import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getDefaultPublishableKey(): string {
  try {
    const keys = JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") ?? "{}");
    return typeof keys?.default === "string" ? keys.default : "";
  } catch {
    return "";
  }
}

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
    const supabasePublishableKey = getDefaultPublishableKey();
    if (!supabaseUrl || !supabasePublishableKey) throw new Error("Supabase authentication is not configured.");

    const supabaseClient = createClient(supabaseUrl, supabasePublishableKey, {
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
    if ((minuteCount || 0) >= 10 || (dayCount || 0) >= 100) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait before trying again." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 429
      });
    }
    const clientIP = (req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
    const { error: logError } = await supabaseClient.from("voc_ai_request_logs").insert({ user_id: user.id, action: "add_word", ip_address: clientIP });
    if (logError) throw logError;

    const { word, language, nativeLanguage, deckId, preview } = await req.json();

    if (typeof word !== "string" || word.trim().length === 0 || word.length > 200) {
      throw new Error("Word or phrase must contain between 1 and 200 characters.");
    }
    if (deckId && (typeof deckId !== "string" || !/^(?:custom|deck_[a-zA-Z0-9_]+)$/.test(deckId))) {
      throw new Error("Invalid deck identifier.");
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
    const srcLangContext = language ? `which is explicitly in "${langMap[language] || language}" language` : "of auto-detected language";

    const model = "gemini-3.1-flash-lite";
    const prompt = `You are a helpful Russian teacher.
The user wants to add the word or phrase "${word}" (${srcLangContext}) to their Russian vocabulary list.

If the input is already in Russian:
- Translate it to English.
- If nativeLanguage "${nativeLanguage}" is specified and is not "en", also translate it into that native language.

If the input is NOT in Russian (e.g. English, Hebrew, Spanish, French, etc.):
- Translate it into Russian (this will be the 'word' field).
- Translate the Russian word into English.
- If nativeLanguage "${nativeLanguage}" is specified and is not "en", also translate the Russian word into that native language.

Determine the CEFR level (A1, A2, B1, B2, C1, or C2) of the Russian word.

Analyze the word and provide the output strictly as a JSON object matching the following schema:
{
  "word": "the base Russian word in Cyrillic (e.g., вода)",
  "accented": "the Russian word with stress marks on vowels (e.g., вода́)",
  "translation": "the English translation (e.g., water)",
  "transliteration": "the English transliteration of the Russian word (e.g., voda)",
  "pos": "the part of speech (lowercase, e.g., noun, verb, adjective, adverb, pronoun, preposition, conjunction, particle, interjection, phrase)",
  "category": "a single-word or short phrase category (e.g., Food, Travel, Essentials, Family, Verbs)",
  "level": "the CEFR level (one of: A1, A2, B1, B2, C1, C2)",
  "exampleRu": "a simple, natural Russian example sentence using this word, with stress marks (e.g., Да́йте мне стака́н воды́, пожа́луйста.)",
  "exampleEn": "the translation of the example sentence in the user's native language (${targetLang}) (e.g., Please give me a glass of water.)"
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
          maxOutputTokens: 250,
          responseSchema: {
            type: "OBJECT",
            properties: {
              word: { type: "STRING" },
              accented: { type: "STRING" },
              translation: { type: "STRING" },
              transliteration: { type: "STRING" },
              pos: { type: "STRING" },
              category: { type: "STRING" },
              level: { type: "STRING" },
              exampleRu: { type: "STRING" },
              exampleEn: { type: "STRING" },
            },
            required: ["word", "accented", "translation", "transliteration", "pos", "category", "level", "exampleRu", "exampleEn"],
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

    if (preview) {
      return new Response(
        JSON.stringify({
          success: true,
          word: {
            id: `preview_${Date.now()}`,
            word: result.word,
            accented: result.accented,
            translation: result.translation,
            transliteration: result.transliteration,
            pos: result.pos,
            category: result.category,
            level: result.level || "A1",
            exampleRu: result.exampleRu,
            exampleEn: result.exampleEn,
            deckId: deckId || "custom",
            updatedAt: Date.now()
          }
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Reuse the authenticated Supabase configuration validated above.
    if (!supabaseUrl || !supabasePublishableKey) {
      throw new Error("Supabase URL or Anon Key is not configured on the server.");
    }

    const targetDeckId = deckId || "custom";
    const wordId = `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    
    // 1. Insert word to voc_words
    const wordPayload = {
      id: wordId,
      user_id: user.id,
      word: result.word,
      accented: result.accented,
      translation: result.translation,
      transliteration: result.transliteration,
      pos: result.pos,
      category: result.category,
      level: result.level || "A1",
      example_ru: result.exampleRu,
      example_en: result.exampleEn,
      deck_id: targetDeckId,
      updated_at: new Date().toISOString()
    };

    const wordInsertRes = await fetch(`${supabaseUrl}/rest/v1/voc_words`, {
      method: "POST",
      headers: {
        "apikey": supabasePublishableKey,
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      body: JSON.stringify(wordPayload)
    });

    if (!wordInsertRes.ok) {
      const errText = await wordInsertRes.text();
      throw new Error(`Failed to save word to database: ${errText}`);
    }

    // 2. Initialize progress to Box 1 in voc_progress
    const progressPayload = {
      user_id: user.id,
      word_id: wordId,
      box: 1,
      next_review: Date.now(),
      correct_count: 0,
      wrong_count: 0,
      starred: false,
      hidden: false,
      updated_at: new Date().toISOString()
    };

    const progressInsertRes = await fetch(`${supabaseUrl}/rest/v1/voc_progress`, {
      method: "POST",
      headers: {
        "apikey": supabasePublishableKey,
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      body: JSON.stringify(progressPayload)
    });

    if (!progressInsertRes.ok) {
      const errText = await progressInsertRes.text();
      await fetch(`${supabaseUrl}/rest/v1/voc_words?user_id=eq.${encodeURIComponent(user.id)}&id=eq.${encodeURIComponent(wordId)}`, {
        method: "DELETE",
        headers: { "apikey": supabasePublishableKey, "Authorization": `Bearer ${token}` }
      });
      throw new Error(`Failed to initialize card progress in database: ${errText}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        word: {
          id: wordId,
          word: result.word,
          accented: result.accented,
          translation: result.translation,
          transliteration: result.transliteration,
          pos: result.pos,
          category: result.category,
          level: result.level || "A1",
          exampleRu: result.exampleRu,
          exampleEn: result.exampleEn,
          deckId: targetDeckId,
          updatedAt: Date.now()
        }
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
