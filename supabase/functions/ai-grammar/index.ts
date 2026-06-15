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

    // Verify token and retrieve authenticated user session
    const isAnon = token === supabaseAnonKey;
    let user = null;

    if (!isAnon) {
      try {
        const { data, error: authError } = await supabaseClient.auth.getUser();
        if (!authError && data?.user) {
          user = data.user;
        }
      } catch (e) {
        console.warn("Auth check failed:", e);
      }
    }

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized: You must be signed in to use AI Grammar features." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const requestData = await req.json();
    const { action } = requestData;

    if (!action) {
      throw new Error("Missing required field: action");
    }

    const clientIP = req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for") || "unknown";

    // --- SERVER-SIDE RATE LIMITING ---
    // 1. Check Requests Per Minute limit for logged-in users (Max 20 RPM)
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const { count: countMin, error: errorMin } = await supabaseClient
      .from("voc_ai_request_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gt("created_at", oneMinuteAgo);

    if (errorMin) throw errorMin;
    if (countMin && countMin >= 20) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded: Max 20 AI requests per minute." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 429,
      });
    }

    // 2. Check Requests Per Day limit for logged-in users (Max 400 RPD)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: countDay, error: errorDay } = await supabaseClient
      .from("voc_ai_request_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gt("created_at", twentyFourHoursAgo);

    if (errorDay) throw errorDay;
    if (countDay && countDay >= 400) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded: Max 400 AI requests per day." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 429,
      });
    }

    // 3. Log this successful request
    const { error: logError } = await supabaseClient
      .from("voc_ai_request_logs")
      .insert({ 
        user_id: user.id, 
        action: action,
        ip_address: clientIP
      });
    
    if (logError) {
      console.warn("Failed to write request log:", logError);
    }

    // Read the server-side Gemini API key
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured in the server environment.");
    }

    const model = "gemini-3.1-flash-lite";
    let prompt = "";
    let responseSchema: any = null;

    if (action === "explain") {
      const { topic, customQuestion } = requestData;
      if (!topic && !customQuestion) {
        throw new Error("Missing topic or customQuestion for explain action");
      }

      prompt = `You are a professional Russian language teacher. Explain the Russian grammar topic: "${topic || "User's custom question"}".
${customQuestion ? `The user has a specific question: "${customQuestion}"` : ""}
Keep the explanation clear, engaging, and suitable for a beginner/intermediate language learner.
Provide the output strictly as a JSON object with the following schema:
{
  "title": "A short, engaging title for this grammar concept",
  "explanation": "Clear, formatted explanation using standard HTML markup (paragraphs, lists) for readability, but kept inside this JSON string.",
  "rules": [
    { "ending": "declension/ending case (e.g. Masculine Inanimate)", "rule": "explanation of what changes (e.g. No change)", "example": "Russian word -> Accusative form (e.g. дом -> дом)" }
  ],
  "examples": [
    {
      "ru": "Russian example sentence with stress marks (e.g. Я чита́ю кни́гу.)",
      "en": "English translation",
      "explanation": "Brief context on how the grammar rule applies in this sentence"
    }
  ]
}
Do not include any markdown formatting, backticks, or explanation outside of the raw JSON object.`;

      responseSchema = {
        type: "OBJECT",
        properties: {
          title: { type: "STRING" },
          explanation: { type: "STRING" },
          rules: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                ending: { type: "STRING" },
                rule: { type: "STRING" },
                example: { type: "STRING" },
              },
              required: ["ending", "rule", "example"],
            },
          },
          examples: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                ru: { type: "STRING" },
                en: { type: "STRING" },
                explanation: { type: "STRING" },
              },
              required: ["ru", "en", "explanation"],
            },
          },
        },
        required: ["title", "explanation", "rules", "examples"],
      };

    } else if (action === "quiz") {
      const { topic, cefr, count } = requestData;
      const questionCount = count || 5;

      prompt = `You are a professional Russian language teacher. Generate ${questionCount} Russian grammar fill-in-the-blank quiz questions.
Target grammar topic: "${topic || "General Grammar"}"
Target difficulty level: "${cefr || "A1"}" (CEFR level A1, A2, or B1).
Provide the output strictly as a JSON object with the following schema:
{
  "questions": [
    {
      "sentencePattern": "The Russian sentence with the target word replaced by '[blank]', and the dictionary form in parentheses (e.g., 'Я хочу купить [blank] (книга).')",
      "answer": "The correct declined/conjugated Russian word (e.g. 'книгу')",
      "choices": ["Four choices in Russian Cyrillic including the correct answer", "choice2", "choice3", "choice4"],
      "translation": "English translation of the full correct sentence",
      "transliteration": "Latin transliteration of the full correct sentence",
      "explanation": "Detailed explanation of why the answer is correct and what grammatical rule applies."
    }
  ]
}
Ensure all questions match the target topic and CEFR level. Do not include any markdown formatting, backticks, or explanation outside of the raw JSON object.`;

      responseSchema = {
        type: "OBJECT",
        properties: {
          questions: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                sentencePattern: { type: "STRING" },
                answer: { type: "STRING" },
                choices: {
                  type: "ARRAY",
                  items: { type: "STRING" },
                },
                translation: { type: "STRING" },
                transliteration: { type: "STRING" },
                explanation: { type: "STRING" },
              },
              required: ["sentencePattern", "answer", "choices", "translation", "transliteration", "explanation"],
            },
          },
        },
        required: ["questions"],
      };

    } else if (action === "analyze") {
      const { sentence } = requestData;
      if (!sentence) {
        throw new Error("Missing sentence for analyze action");
      }

      prompt = `You are a professional Russian language proofreader. Analyze the following Russian sentence written by a student:
"${sentence}"
Check for spelling mistakes, grammatical errors (declensions, conjugations, gender/number agreement, preposition usage), and stylistic naturalness.
Provide the output strictly as a JSON object with the following schema:
{
  "hasErrors": true/false,
  "corrections": [
    {
      "original": "The incorrect part of the sentence",
      "fixed": "The corrected version of that part",
      "type": "spelling" or "grammar" or "style",
      "reason": "Explain why this was incorrect and what rule applies."
    }
  ],
  "suggestions": [
    {
      "ru": "A natural, native-sounding alternative phrasing of the entire sentence with stress marks on vowels if helpful (e.g., Вчера́ я ходи́л в теа́тр.)",
      "en": "English translation of this suggestion",
      "description": "Why this suggestion sounds more natural or idiomatic"
    }
  ]
}
Do not include any markdown formatting, backticks, or explanation outside of the raw JSON object.`;

      responseSchema = {
        type: "OBJECT",
        properties: {
          hasErrors: { type: "BOOLEAN" },
          corrections: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                original: { type: "STRING" },
                fixed: { type: "STRING" },
                type: { type: "STRING" },
                reason: { type: "STRING" },
              },
              required: ["original", "fixed", "type", "reason"],
            },
          },
          suggestions: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                ru: { type: "STRING" },
                en: { type: "STRING" },
                description: { type: "STRING" },
              },
              required: ["ru", "en", "description"],
            },
          },
        },
        required: ["hasErrors", "corrections", "suggestions"],
      };

    } else {
      throw new Error(`Unsupported action: ${action}`);
    }

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
          responseSchema: responseSchema,
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
        data: result,
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
