import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper to decode Base64URL string to Unicode text
function decodeBase64UrlToText(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

// Decodes a JWT payload without cryptographically verifying the signature (useful for dev/fallback)
function decodeJwtWithoutVerification(token: string): any {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid token format");
  }
  const payloadStr = parts[1];
  const payloadJson = decodeBase64UrlToText(payloadStr);
  const payload = JSON.parse(payloadJson);

  // Check expiration
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) {
    throw new Error("Token has expired");
  }

  return payload;
}

// Cryptographically verifies a Supabase HS256 JWT signature and claims
async function verifySupabaseJwt(token: string, secret: string): Promise<any> {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid token format");
  }

  const [headerStr, payloadStr, signatureStr] = parts;

  // 1. Verify HS256 signature using Web Crypto API
  const keyData = new TextEncoder().encode(secret);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );

  const data = new TextEncoder().encode(`${headerStr}.${payloadStr}`);
  
  // Decode signature
  const signatureBytes = Uint8Array.from(
    atob(signatureStr.replace(/-/g, "+").replace(/_/g, "/").padEnd(signatureStr.length + (4 - (signatureStr.length % 4)) % 4, "=")),
    c => c.charCodeAt(0)
  );

  const isValid = await crypto.subtle.verify(
    "HMAC",
    cryptoKey,
    signatureBytes,
    data
  );

  if (!isValid) {
    throw new Error("Invalid JWT signature");
  }

  // 2. Decode and parse payload
  const payloadJson = decodeBase64UrlToText(payloadStr);
  const payload = JSON.parse(payloadJson);

  // 3. Verify expiration
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) {
    throw new Error("Token has expired");
  }

  return payload;
}

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
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    const isAnon = token === supabaseAnonKey;
    if (isAnon) {
      return new Response(JSON.stringify({ 
        error: "Unauthorized: You must be signed in to add words to your vocabulary.",
        details: "The request used the anonymous key. You must be logged in to invoke this function."
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    // Verify token locally without calling Supabase database/auth API
    let payload;
    const jwtSecret = Deno.env.get("SUPABASE_JWT_SECRET");
    try {
      if (jwtSecret) {
        payload = await verifySupabaseJwt(token, jwtSecret);
      } else {
        payload = decodeJwtWithoutVerification(token);
      }
    } catch (jwtErr) {
      return new Response(JSON.stringify({ 
        error: "Unauthorized: You must be signed in to add words to your vocabulary.",
        details: `Token verification failed: ${jwtErr.message}`
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    // Verify it is an authenticated user role
    if (payload.role !== "authenticated") {
      return new Response(JSON.stringify({ 
        error: "Unauthorized: You must be signed in to add words to your vocabulary.",
        details: "JWT role is not authenticated."
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const { word, language, nativeLanguage, deckId } = await req.json();

    if (!word) {
      throw new Error("Missing required field: word");
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

Analyze the word and provide the output strictly as a JSON object matching the following schema:
{
  "word": "the base Russian word in Cyrillic (e.g., вода)",
  "accented": "the Russian word with stress marks on vowels (e.g., вода́)",
  "translation": "the English translation (e.g., water)",
  "transliteration": "the English transliteration of the Russian word (e.g., voda)",
  "pos": "the part of speech (lowercase, e.g., noun, verb, adjective, adverb, pronoun, preposition, conjunction, particle, interjection, phrase)",
  "category": "a single-word or short phrase category (e.g., Food, Travel, Essentials, Family, Verbs)",
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
              exampleRu: { type: "STRING" },
              exampleEn: { type: "STRING" },
            },
            required: ["word", "accented", "translation", "transliteration", "pos", "category", "exampleRu", "exampleEn"],
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

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Supabase URL or Anon Key is not configured on the server.");
    }

    const targetDeckId = deckId || "custom";
    const wordId = `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    
    // 1. Insert word to voc_words
    const wordPayload = {
      id: wordId,
      user_id: payload.sub,
      word: result.word,
      accented: result.accented,
      translation: result.translation,
      transliteration: result.transliteration,
      pos: result.pos,
      category: result.category,
      example_ru: result.exampleRu,
      example_en: result.exampleEn,
      deck_id: targetDeckId,
      updated_at: new Date().toISOString()
    };

    const wordInsertRes = await fetch(`${supabaseUrl}/rest/v1/voc_words`, {
      method: "POST",
      headers: {
        "apikey": supabaseAnonKey,
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      body: JSON.stringify(wordPayload)
    });

    if (!wordInsertRes.ok) {
      // In case deck_id is not supported, fallback without it
      const fallbackPayload = { ...wordPayload };
      delete (fallbackPayload as any).deck_id;

      const fallbackInsertRes = await fetch(`${supabaseUrl}/rest/v1/voc_words`, {
        method: "POST",
        headers: {
          "apikey": supabaseAnonKey,
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Prefer": "return=representation"
        },
        body: JSON.stringify(fallbackPayload)
      });

      if (!fallbackInsertRes.ok) {
        const errText = await fallbackInsertRes.text();
        throw new Error(`Failed to save word to database: ${errText}`);
      }
    }

    // 2. Initialize progress to Box 1 in voc_progress
    const progressPayload = {
      user_id: payload.sub,
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
        "apikey": supabaseAnonKey,
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      body: JSON.stringify(progressPayload)
    });

    if (!progressInsertRes.ok) {
      const errText = await progressInsertRes.text();
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
