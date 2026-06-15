import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

// Trigger deployment after fixing path filters
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    // Initialize Supabase Client to verify the token
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Verify token: must be a valid authenticated user JWT
    const isAnon = token === supabaseAnonKey;
    let user = null;
    let authCheckError = null;

    if (!isAnon) {
      try {
        const { data, error: authError } = await supabaseClient.auth.getUser(token);
        if (authError) {
          authCheckError = authError.message;
        } else if (data?.user) {
          user = data.user;
        }
      } catch (e) {
        authCheckError = e.message || String(e);
      }
    }

    if (!user) {
      let details = "No authenticated user session found.";
      if (isAnon) {
        details = "The request used the anonymous key. You must be logged in to invoke this function.";
      } else if (authCheckError) {
        details = `Token verification failed: ${authCheckError}`;
      }
      return new Response(JSON.stringify({ 
        error: "Unauthorized: You must be signed in to use AI sentence generation features.",
        details: details
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const { word, translation, partOfSpeech } = await req.json();

    if (!word || !translation) {
      throw new Error("Missing required fields: word, translation");
    }

    // Read the server-side Gemini API key
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured in the server environment.");
    }

    const model = "gemini-3.1-flash-lite";
    const posContext = partOfSpeech ? ` as a ${partOfSpeech}` : "";
    const prompt = `You are a helpful Russian teacher. Generate a single, clear, natural, and grammatically correct example sentence in Russian using the Russian word "${word}" (meaning "${translation}"${posContext}). Keep the sentence simple, suitable for a beginner/intermediate language learner.
Provide the output strictly as a JSON object with the following schema:
{
  "sentence_ru": "the Russian sentence (include stress marks on vowels if helpful, e.g. кни́га)",
  "sentence_en": "the exact English translation of the Russian sentence"
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
          responseSchema: {
            type: "OBJECT",
            properties: {
              sentence_ru: { type: "STRING" },
              sentence_en: { type: "STRING" },
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
