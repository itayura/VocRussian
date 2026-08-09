import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "A valid signed-in session is required." }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const publishableKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const secretKey = Deno.env.get("SUPABASE_SECRET_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !publishableKey || !secretKey) {
      throw new Error("Account deletion is not configured on the server.");
    }

    const token = authHeader.slice("Bearer ".length).trim();
    const userClient = createClient(supabaseUrl, publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: authHeader } }
    });
    const { data: userData, error: userError } = await userClient.auth.getUser(token);
    const user = userData?.user;
    if (userError || !user) {
      return jsonResponse({ error: "A valid signed-in session is required." }, 401);
    }

    const body = await req.json().catch(() => ({}));
    const confirmationEmail = typeof body?.confirmationEmail === "string"
      ? body.confirmationEmail.trim().toLowerCase()
      : "";
    const accountEmail = String(user.email || "").trim().toLowerCase();
    if (!accountEmail || confirmationEmail !== accountEmail) {
      return jsonResponse({ error: "The confirmation email does not match the signed-in account." }, 400);
    }

    const admin = createClient(supabaseUrl, secretKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    // Feedback uses ON DELETE SET NULL so remove it explicitly before deleting
    // the Auth user. All other user-owned tables use ON DELETE CASCADE.
    const { error: feedbackError } = await admin
      .from("voc_feedback")
      .delete()
      .eq("user_id", user.id);
    if (feedbackError) throw feedbackError;

    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id, false);
    if (deleteError) throw deleteError;

    return jsonResponse({ success: true });
  } catch (error) {
    console.error("Account deletion failed:", error);
    return jsonResponse({ error: "The account could not be deleted. Please try again or use the support link." }, 500);
  }
});
