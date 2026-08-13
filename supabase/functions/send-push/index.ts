import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import webpush from "npm:web-push";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getRemindersSecretKey(): string {
  try {
    const keys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}");
    return typeof keys?.reminders === "string" ? keys.reminders : "";
  } catch {
    return "";
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json", "Allow": "POST" },
      status: 405,
    });
  }

  try {
    const suppliedApiKey = req.headers.get("apikey") ?? "";
    const remindersSecretKey = getRemindersSecretKey();

    if (!suppliedApiKey) {
      return new Response(JSON.stringify({ error: "Unauthorized: missing internal API key." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }
    if (!remindersSecretKey || suppliedApiKey !== remindersSecretKey) {
      return new Response(JSON.stringify({ error: "Forbidden: push delivery is an internal service." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    if (!supabaseUrl) {
      throw new Error("Push service is not configured.");
    }

    const supabaseClient = createClient(supabaseUrl, remindersSecretKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { userId, title, body } = await req.json();
    if (typeof title !== "string" || typeof body !== "string" || !title.trim() || !body.trim()) {
      throw new Error("Missing required fields: title, body");
    }
    if (title.length > 120 || body.length > 500) {
      throw new Error("Notification content is too long.");
    }
    if (userId !== "all" && (typeof userId !== "string" || !/^[0-9a-f-]{36}$/i.test(userId))) {
      throw new Error("Invalid target user.");
    }

    let query = supabaseClient.from("user_push_subscriptions").select("*");
    if (userId !== "all") {
      query = query.eq("user_id", userId);
    }
    const { data: subscriptions, error: subscriptionError } = await query;
    if (subscriptionError) throw subscriptionError;

    if (!subscriptions?.length) {
      return new Response(JSON.stringify({
        success: true,
        message: "No active subscriptions found to receive this notification.",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const publicKey = Deno.env.get("VAPID_PUBLIC_KEY") ?? "";
    const privateKey = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
    if (!publicKey || !privateKey) {
      throw new Error("VAPID keys are not set in the server environment.");
    }

    webpush.setVapidDetails("mailto:itayuralevich@gmail.com", publicKey, privateKey);

    // Reuse one tag for every subscription targeted by this request, while
    // ensuring a later reminder does not silently replace an earlier one.
    const notificationTag = `remote-push-${Date.now()}`;

    let sentCount = 0;
    let failedCount = 0;

    const logDelivery = async (subscription: { id: number; user_id: string }, status: "accepted" | "failed", statusCode: number | null, errorMessage: string | null) => {
      const { error } = await supabaseClient.from("push_delivery_logs").insert({
        user_id: subscription.user_id,
        subscription_id: subscription.id,
        status,
        status_code: statusCode,
        error_message: errorMessage,
      });
      if (error) {
        console.error("Failed to record push delivery diagnostic:", error.message);
      }
    };

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify({ title, body, tag: notificationTag }),
          { urgency: "high", TTL: 86400 },
        );
        sentCount++;
        await logDelivery(sub, "accepted", null, null);
      } catch (error) {
        failedCount++;
        const statusCode = Number((error as { statusCode?: number })?.statusCode ?? 0);
        console.error(`Push delivery failed for subscription ${sub.id} with status ${statusCode || "unknown"}.`);
        await logDelivery(sub, "failed", statusCode || null, error instanceof Error ? error.message.slice(0, 500) : "Unknown push service error");

        if (statusCode === 404 || statusCode === 410) {
          const { error: deleteError } = await supabaseClient
            .from("user_push_subscriptions")
            .delete()
            .eq("id", sub.id);
          if (deleteError) {
            console.error(`Failed to remove expired subscription ${sub.id}.`);
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true, sentCount, failedCount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected push delivery error.";
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
