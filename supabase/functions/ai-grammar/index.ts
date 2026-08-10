import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function normalizeQuizText(value: unknown): string {
  return String(value ?? "")
    .normalize("NFC")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase("ru-RU");
}

function isValidQuizQuestion(question: any, allowedTopicIds: string[]): boolean {
  if (!question || typeof question !== "object") return false;

  const requiredTextFields = ["sentencePattern", "answer", "translation", "transliteration", "explanation"];
  if (requiredTextFields.some(field => typeof question[field] !== "string" || !question[field].trim())) return false;
  if (question.sentencePattern.length > 500 || question.explanation.length > 2000) return false;

  const blankMatches = question.sentencePattern.match(/\[blank\]/gi) || [];
  if (blankMatches.length !== 1 || !/\([^()[\]]+\)/u.test(question.sentencePattern)) return false;

  if (!Array.isArray(question.choices) || question.choices.length !== 4) return false;
  const normalizedChoices = question.choices.map(normalizeQuizText);
  if (normalizedChoices.some(choice => !choice || choice.length > 100)) return false;
  if (new Set(normalizedChoices).size !== normalizedChoices.length) return false;

  const normalizedAnswer = normalizeQuizText(question.answer);
  if (!/[а-яё]/iu.test(normalizedAnswer)) return false;
  if (normalizedChoices.filter(choice => choice === normalizedAnswer).length !== 1) return false;

  if (allowedTopicIds.length > 0 && !allowedTopicIds.includes(question.topicId)) return false;

  // This common model failure creates "Как твоё имя тебя зовут?". The valid
  // idiom is "Как тебя зовут?"; a possessive-name question needs a new frame.
  const normalizedPattern = normalizeQuizText(question.sentencePattern);
  if (/тебя\s+зовут/u.test(normalizedPattern) && /\(\s*имя\s*\)/u.test(normalizedPattern)) return false;

  return true;
}

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

    // Initialize Supabase Client for database rate limits (we don't use it for getUser authentication check anymore)
    const supabaseClient = createClient(supabaseUrl, supabasePublishableKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    const user = userData?.user;
    if (userError || !user) {
      return new Response(JSON.stringify({
        error: "Unauthorized: You must be signed in to use AI Grammar features."
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401
      });
    }

    const requestData = await req.json();
    const { action, nativeLanguage } = requestData;

    const langMap: Record<string, string> = {
      en: "English",
      he: "Hebrew",
      es: "Spanish",
      fr: "French"
    };
    const targetLang = langMap[nativeLanguage] || "English";

    const allowedActions = new Set(["explain", "quiz", "analyze", "inflections"]);
    if (typeof action !== "string" || !allowedActions.has(action)) {
      throw new Error("Invalid or missing action.");
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
    
    if (logError) throw logError;

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
      if (String(topic || "").length > 200 || String(customQuestion || "").length > 1000) throw new Error("Explanation request is too long.");

      prompt = `You are a professional Russian language teacher. Explain the Russian grammar topic: "${topic || "User's custom question"}".
${customQuestion ? `The user has a specific question: "${customQuestion}"` : ""}
Keep the explanation clear, engaging, and suitable for a beginner/intermediate language learner.
Provide all explanations, rules descriptions, and example translations in ${targetLang} instead of English.
Provide the output strictly as a JSON object with the following schema:
{
  "title": "A short, engaging title for this grammar concept",
  "explanation": "Clear, formatted explanation in ${targetLang} using standard HTML markup (paragraphs, lists) for readability, but kept inside this JSON string.",
  "rules": [
    { "ending": "declension/ending case (e.g. Masculine Inanimate)", "rule": "explanation of what changes in ${targetLang}", "example": "Russian word -> Accusative form (e.g. дом -> дом)" }
  ],
  "examples": [
    {
      "ru": "Russian example sentence with stress marks (e.g. Я чита́ю кни́гу.)",
      "en": "exact translation of the Russian sentence in ${targetLang}",
      "explanation": "Brief context on how the grammar rule applies in this sentence, explained in ${targetLang}"
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
      const { topic, topicIds, cefr, count, vocab } = requestData;
      const allowedTopicIds = Array.isArray(topicIds) ? topicIds.filter((id: unknown) => typeof id === "string").slice(0, 14) : [];
      const questionCount = Math.max(3, Math.min(10, Math.round(Number(count) || 5)));
      const allowedLevels = new Set(["A1", "A2", "B1", "B2", "C1", "C2"]);
      const safeCefr = allowedLevels.has(cefr) ? cefr : "A1";
      if (String(topic || "").length > 500) throw new Error("Quiz topic selection is too long.");
      const safeVocab = Array.isArray(vocab) ? vocab.filter(item => typeof item === "string").slice(0, 15).map(item => item.slice(0, 80)) : [];
      const vocabList = safeVocab.join(", ");

      prompt = `You are a professional Russian language teacher. Generate ${questionCount} Russian grammar fill-in-the-blank quiz questions.
Target grammar topic: "${topic || "General Grammar"}"
Allowed topic IDs: ${allowedTopicIds.join(", ") || "general"}. Assign each question the single best matching topicId from this list.
Target difficulty level: "${safeCefr}" (CEFR level A1, A2, B1, B2, C1, or C2).
${vocabList ? `Try to base the fill-in-the-blank sentences or choices on these vocabulary words the user is currently studying: [${vocabList}]. Do not force it if it doesn't fit the grammar rules naturally, but use them whenever possible.` : ""}
Before returning each question, silently perform this mandatory quality check:
1. Replace [blank] with answer and remove the parenthetical dictionary-form hint. The result must be one complete, natural Russian sentence with the same meaning as translation.
2. Exactly one of the four distinct choices must correctly complete that sentence.
3. The parenthetical hint is metadata only; never write a sentence that needs the hint as an extra spoken word.
4. Do not combine the idiom "Как тебя зовут?" with "имя" or a possessive. For a possessive exercise use a natural frame such as "Это [blank] (твой) имя?" with the grammatically correct answer.
5. If a draft fails any check, replace it with a different question before returning the JSON.
Provide the output strictly as a JSON object with the following schema:
{
  "questions": [
    {
      "topicId": "One exact topic ID from the allowed list",
      "sentencePattern": "The Russian sentence with the target word replaced by '[blank]', and the dictionary form in parentheses (e.g., 'Я хочу купить [blank] (книга).')",
      "answer": "The correct declined/conjugated Russian word (e.g. 'книгу')",
      "choices": ["Four choices in Russian Cyrillic including the correct answer", "choice2", "choice3", "choice4"],
      "translation": "exact translation of the full correct sentence in ${targetLang}",
      "transliteration": "Latin transliteration of the full correct sentence",
      "explanation": "Detailed explanation in ${targetLang} of why the correct answer is required, what grammatical rule applies, and why the other incorrect choices are grammatically incorrect or incompatible (e.g. 'книге is in Dative case, but Accusative is required after читаю')."
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
                topicId: { type: "STRING" },
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
              required: ["topicId", "sentencePattern", "answer", "choices", "translation", "transliteration", "explanation"],
            },
          },
        },
        required: ["questions"],
      };

    } else if (action === "analyze") {
      const { sentence } = requestData;
      if (typeof sentence !== "string" || !sentence.trim()) {
        throw new Error("Missing sentence for analyze action");
      }
      if (sentence.length > 2000) throw new Error("Sentence is too long (maximum 2,000 characters).");

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
      "reason": "Explain in ${targetLang} why this was incorrect and what rule applies."
    }
  ],
  "suggestions": [
    {
      "ru": "A natural, native-sounding alternative phrasing of the entire sentence with stress marks on vowels if helpful (e.g., Вчера́ я ходи́л в теа́тр.)",
      "en": "Translation of this suggestion in ${targetLang}",
      "description": "Why this suggestion sounds more natural or idiomatic, explained in ${targetLang}"
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

    } else if (action === "inflections") {
      const { word: infWord, pos: infPos } = requestData;
      if (typeof infWord !== "string" || !infWord.trim() || infWord.length > 100 || String(infPos || "").length > 50) {
        throw new Error("Missing word for inflections action");
      }

      prompt = `You are a professional Russian language teacher. Generate a complete inflection table (declension or conjugation) for the Russian word "${infWord}" (Part of speech: "${infPos || "auto-detect"}").
All descriptions and text explanations in the output must be in ${targetLang}.

Output structure depends on the part of speech of the word:
1. If the word is a Verb (or part of speech matches verb):
   Provide present/future tense conjugations (Я, Ты, Он/Она, Мы, Вы, Они), past tense forms (masculine, feminine, neuter, plural), and imperative forms (singular, plural).
   Return a JSON matching this exact structure:
   {
     "type": "conjugation",
     "forms": {
       "presentFuture": [
         { "pronoun": "Я", "form": "Russian form with stress mark", "english": "translation of form" },
         { "pronoun": "Ты", "form": "...", "english": "..." },
         { "pronoun": "Он/Она", "form": "...", "english": "..." },
         { "pronoun": "Мы", "form": "...", "english": "..." },
         { "pronoun": "Вы", "form": "...", "english": "..." },
         { "pronoun": "Они", "form": "...", "english": "..." }
       ],
       "past": [
         { "gender": "Masculine", "form": "...", "english": "..." },
         { "gender": "Feminine", "form": "...", "english": "..." },
         { "gender": "Neuter", "form": "...", "english": "..." },
         { "gender": "Plural", "form": "...", "english": "..." }
       ],
       "imperative": [
         { "type": "Singular (ты)", "form": "...", "english": "..." },
         { "type": "Plural (вы)", "form": "...", "english": "..." }
       ]
     }
   }

2. If the word is a Noun, Adjective, or Pronoun:
   Provide declensions for all 6 cases (Nominative, Accusative, Genitive, Dative, Instrumental, Prepositional) in both Singular and Plural forms.
   Return a JSON matching this exact structure:
   {
     "type": "declension",
     "forms": {
       "declensions": [
         { "case": "Nominative (Именительный)", "singular": "Russian form with stress mark", "plural": "Russian form with stress mark" },
         { "case": "Accusative (Винительный)", "singular": "...", "plural": "..." },
         { "case": "Genitive (Родительный)", "singular": "...", "plural": "..." },
         { "case": "Dative (Дательный)", "singular": "...", "plural": "..." },
         { "case": "Instrumental (Творительный)", "singular": "...", "plural": "..." },
         { "case": "Prepositional (Предложный)", "singular": "...", "plural": "..." }
       ]
     }
   }

3. If the word is any other part of speech (e.g. adverb, preposition, conjunction, particle, interjection, phrase):
   Return a JSON indicating it is not applicable:
   {
     "type": "not_applicable",
     "message": "This word does not undergo declension or conjugation."
   }

Do not include any markdown formatting, backticks, or explanation outside of the raw JSON object.`;

      responseSchema = {
        type: "OBJECT",
        properties: {
          type: { type: "STRING" },
          message: { type: "STRING" },
          forms: {
            type: "OBJECT",
            properties: {
              presentFuture: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    pronoun: { type: "STRING" },
                    form: { type: "STRING" },
                    english: { type: "STRING" }
                  },
                  required: ["pronoun", "form", "english"]
                }
              },
              past: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    gender: { type: "STRING" },
                    form: { type: "STRING" },
                    english: { type: "STRING" }
                  },
                  required: ["gender", "form", "english"]
                }
              },
              imperative: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    type: { type: "STRING" },
                    form: { type: "STRING" },
                    english: { type: "STRING" }
                  },
                  required: ["type", "form", "english"]
                }
              },
              declensions: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    case: { type: "STRING" },
                    singular: { type: "STRING" },
                    plural: { type: "STRING" }
                  },
                  required: ["case", "singular", "plural"]
                }
              }
            }
          }
        },
        required: ["type"]
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
          temperature: 0.3,
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
    if (action === "quiz") {
      const requestedCount = Math.max(3, Math.min(10, Math.round(Number(requestData.count) || 5)));
      const allowedTopicIds = Array.isArray(requestData.topicIds)
        ? requestData.topicIds.filter((id: unknown) => typeof id === "string").slice(0, 14)
        : [];
      const generatedQuestions = Array.isArray(result?.questions) ? result.questions : [];
      result.questions = generatedQuestions
        .filter((question: any) => isValidQuizQuestion(question, allowedTopicIds))
        .slice(0, requestedCount);

      if (result.questions.length === 0) {
        throw new Error("The generated quiz did not pass quality checks. Please try again.");
      }
    }
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
