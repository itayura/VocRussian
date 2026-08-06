import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

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
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    if (!supabaseUrl || !supabaseAnonKey) throw new Error("Supabase authentication is not configured.");

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false }
    });
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    const user = userData?.user;
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized: a valid signed-in session is required." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401
      });
    }

    const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();
    const oneDayAgo = new Date(Date.now() - 86_400_000).toISOString();
    const [{ count: minuteCount, error: minuteError }, { count: dayCount, error: dayError }] = await Promise.all([
      supabaseClient.from("voc_ai_request_logs").select("*", { count: "exact", head: true }).eq("user_id", user.id).gt("created_at", oneMinuteAgo),
      supabaseClient.from("voc_ai_request_logs").select("*", { count: "exact", head: true }).eq("user_id", user.id).gt("created_at", oneDayAgo)
    ]);
    if (minuteError || dayError) throw minuteError || dayError;
    if ((minuteCount || 0) >= 20 || (dayCount || 0) >= 300) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait before trying again." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 429
      });
    }
    const clientIP = (req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
    const { error: logError } = await supabaseClient.from("voc_ai_request_logs").insert({ user_id: user.id, action: "generate_sentence", ip_address: clientIP });
    if (logError) throw logError;

    const { word, translation, partOfSpeech, nativeLanguage } = await req.json();

    if (typeof word !== "string" || typeof translation !== "string" || !word.trim() || !translation.trim()) {
      throw new Error("Missing required fields: word, translation");
    }
    if (word.length > 200 || translation.length > 300 || String(partOfSpeech || "").length > 50) {
      throw new Error("Input is too long.");
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured in the server environment.");
    }

    const langMap: Record<string, string> = {
      en: "English",
      he: "Hebrew",
      es: "Spanish",
      fr: "French"
    };
    const targetLang = langMap[nativeLanguage] || "English";

    const model = "gemini-3.1-flash-lite";
    const posContext = partOfSpeech ? ` as a ${partOfSpeech}` : "";
    const prompt = `You are a helpful Russian teacher. Generate a single, clear, natural, and grammatically correct example sentence in Russian using the Russian word "${word}" (meaning "${translation}"${posContext}). Keep the sentence simple, suitable for a beginner/intermediate language learner.
Provide the output strictly as a JSON object with the following schema:
{
  "sentence_ru": "the Russian sentence (include stress marks on vowels if helpful, e.g. кни́га)",
  "sentence_en": "the exact translation of the Russian sentence in ${targetLang}"
}
Do not include any markdown formatting, backticks, or explanation outside of the raw JSON object.`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.3,
          maxOutputTokens: 150,
          responseSchema: {
            type: "OBJECT",
            properties: {
              sentence_ru: { type: "STRING" },
              sentence_en: { type: "STRING", description: `The exact translation in ${targetLang}` },
            },
            required: ["sentence_ru", "sentence_en"],
          },
        },
      }),
    });

    if (!geminiRes.ok) {
      const errorText = await geminiRes.text();
      throw new Error(`Gemini API returned error: ${geminiRes.status} - ${errorText}`);
    }

    const geminiData = await geminiRes.json();
    const textResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textResponse) {
      throw new Error("No response content received from Gemini API.");
    }

    const result = JSON.parse(textResponse.trim());
    return new Response(
      JSON.stringify({
        success: true,
        sentenceRu: result.sentence_ru,
        sentenceEn: result.sentence_en,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
