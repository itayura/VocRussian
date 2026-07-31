// Trigger deployment with new GitHub secrets
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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }

    const token = authHeader.replace(/^Bearer /, "");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const isServiceRole = token === serviceRoleKey;

    // Initialize Supabase Client.
    // If it's a standard user token, we use the Anon Key and forward their token to enforce RLS.
    // If it's the Service Role key, we use the Service Role key to bypass RLS.
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      isServiceRole ? serviceRoleKey : (Deno.env.get("SUPABASE_ANON_KEY") ?? ""),
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { userId, title, body } = await req.json();

    if (!title || !body) {
      throw new Error("Missing required fields: title, body");
    }

    let subscriptions = [];

    // Check if the request is a broadcast to all users
    if (userId === "all" || !userId) {
      if (!isServiceRole) {
        return new Response(JSON.stringify({ 
          error: "Unauthorized: Only administrators using the service_role key can broadcast notifications to everyone." 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403,
        });
      }

      // Admin broadcast: Fetch all subscriptions
      const { data, error } = await supabaseClient
        .from("user_push_subscriptions")
        .select("*");
      
      if (error) throw error;
      subscriptions = data || [];
    } else {
      // Standard target push: Fetch target user's subscriptions
      const { data, error } = await supabaseClient
        .from("user_push_subscriptions")
        .select("*")
        .eq("user_id", userId);
      
      if (error) throw error;
      subscriptions = data || [];
    }

    // If no subscriptions found (or access denied by RLS)
    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: "No active subscriptions found to receive this notification." 
      }), {
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
          JSON.stringify({ title, body }),
          {
            urgency: "high",
            TTL: 86400,
          }
        );
        sentCount++;
      } catch (err) {
        console.error(`Failed to send notification to endpoint ${sub.endpoint}:`, err);
        failedCount++;
        
        // If the subscription is expired or inactive (410 Gone / 404 Not Found), delete it
        if (err.statusCode === 410 || err.statusCode === 404) {
          const adminClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            serviceRoleKey
          );
          await adminClient
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
