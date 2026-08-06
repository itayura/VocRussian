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
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json", "Allow": "POST" },
      status: 405
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized: missing Authorization header." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401
      });
    }

    const token = authHeader.replace(/^Bearer /, "");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    if (!serviceRoleKey || !supabaseUrl) throw new Error("Push service is not configured.");
    const isServiceRole = token.length > 0 && token === serviceRoleKey;
    if (!isServiceRole) {
      return new Response(JSON.stringify({ error: "Forbidden: push delivery is an internal service." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403
      });
    }

    // Internal service-role client used only by the database reminder scheduler.
    const supabaseClient = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { userId, title, body } = await req.json();

    if (typeof title !== "string" || typeof body !== "string" || !title.trim() || !body.trim()) {
      throw new Error("Missing required fields: title, body");
    }
    if (title.length > 120 || body.length > 500) throw new Error("Notification content is too long.");
    if (userId !== "all" && (typeof userId !== "string" || !/^[0-9a-f-]{36}$/i.test(userId))) {
      throw new Error("Invalid target user.");
    }

    let subscriptions = [];

    // Check if the request is a broadcast to all users
    if (userId === "all") {
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
        console.error(`Failed to send notification for subscription ${sub.id}:`, err);
        failedCount++;
        
        // If the subscription is expired or inactive (410 Gone / 404 Not Found), delete it
        if (err.statusCode === 410 || err.statusCode === 404) {
          const adminClient = createClient(
            supabaseUrl,
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
