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
        error: "Unauthorized: You must be signed in to use AI sentence generation features.",
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
        error: "Unauthorized: You must be signed in to use AI sentence generation features.",
        details: `Token verification failed: ${jwtErr.message}`
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    // Verify it is an authenticated user role
    if (payload.role !== "authenticated") {
      return new Response(JSON.stringify({ 
        error: "Unauthorized: You must be signed in to use AI sentence generation features.",
        details: "JWT role is not authenticated."
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const { word, translation, partOfSpeech } = await req.json();

    if (!word || !translation) {
      throw new Error("Missing required fields: word, translation");
    }

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
          temperature: 0.3,
          maxOutputTokens: 150,
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
