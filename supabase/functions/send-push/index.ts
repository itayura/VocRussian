import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import webpush from "npm:web-push";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { userId, title, body } = await req.json();

    if (!userId || !title || !body) {
      throw new Error("Missing required fields: userId, title, body");
    }

    // Fetch user's push subscriptions
    const { data: subscriptions, error } = await supabaseClient
      .from("user_push_subscriptions")
      .select("*")
      .eq("user_id", userId);

    if (error) throw error;
    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ success: true, message: "No subscriptions found for user." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Setup VAPID details (configured via Supabase environment variables)
    const publicKey = Deno.env.get("VAPID_PUBLIC_KEY") || "";
    const privateKey = Deno.env.get("VAPID_PRIVATE_KEY") || "";
    
    if (!publicKey || !privateKey) {
      throw new Error("VAPID keys are not set in the server environment.");
    }

    webpush.setVapidDetails(
      "mailto:itayuralevich@gmail.com",
      publicKey,
      privateKey
    );

    let sentCount = 0;
    let failedCount = 0;

    for (const sub of subscriptions) {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      try {
        await webpush.sendNotification(
          pushSubscription,
          JSON.stringify({ title, body })
        );
        sentCount++;
      } catch (err) {
        console.error(`Failed to send notification to endpoint ${sub.endpoint}:`, err);
        failedCount++;
        
        // If the subscription is expired or inactive (410 Gone / 404 Not Found), delete it
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabaseClient
            .from("user_push_subscriptions")
            .delete()
            .eq("id", sub.id);
        }
      }
    }

    return new Response(JSON.stringify({ success: true, sentCount, failedCount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
