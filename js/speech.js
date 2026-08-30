// Privyetik Speech Engine: Agnostic Speech-to-Text & Pronunciation Evaluator
// Provides a pluggable provider architecture (Web Speech API, Transformers.js, Cloud Whisper)

(function () {
  "use strict";

  // --- RUSSIAN TEXT NORMALIZATION & PHONETIC HELPERS ---
  const SpeechUtils = {
    // Strip accents, punctuation, normalize Unicode
    cleanRussianText: function (text) {
      if (!text || typeof text !== "string") return "";
      return text
        .normalize("NFC")
        .replace(/\u0301/g, "") // Cyrillic combining acute accent
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'«»—–]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
    },

    // Phonetic normalization for Russian speech recognition tolerance
    phoneticNormalize: function (text) {
      const clean = this.cleanRussianText(text);
      return clean
        .replace(/ё/g, "е"); // Many STT models output 'е' instead of 'ё'
    },

    // Standard Levenshtein Distance implementation
    levenshteinDistance: function (a, b) {
      if (a === b) return 0;
      if (a.length === 0) return b.length;
      if (b.length === 0) return a.length;

      const matrix = [];
      for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
      }
      for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
      }

      for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
          if (b.charAt(i - 1) === a.charAt(j - 1)) {
            matrix[i][j] = matrix[i - 1][j - 1];
          } else {
            matrix[i][j] = Math.min(
              matrix[i - 1][j - 1] + 1, // substitution
              matrix[i][j - 1] + 1,     // insertion
              matrix[i - 1][j] + 1      // deletion
            );
          }
        }
      }
      return matrix[b.length][a.length];
    },

    // Calculate similarity score between 0 and 100
    calculateSimilarity: function (target, spoken) {
      const cleanTarget = this.cleanRussianText(target);
      const cleanSpoken = this.cleanRussianText(spoken);

      if (!cleanTarget) return 0;
      if (cleanTarget === cleanSpoken) return 100;

      // Check phonetic match (e.g. ё/е)
      const phonTarget = this.phoneticNormalize(target);
      const phonSpoken = this.phoneticNormalize(spoken);
      if (phonTarget === phonSpoken) return 98;

      // Handle single letter recognition (alphabet mode)
      if (cleanTarget.length === 1) {
        if (cleanSpoken.includes(cleanTarget)) return 100;
        if (phonSpoken.includes(phonTarget)) return 95;
      }

      const dist = this.levenshteinDistance(phonTarget, phonSpoken);
      const maxLen = Math.max(phonTarget.length, phonSpoken.length);
      if (maxLen === 0) return 100;

      const similarityRatio = Math.max(0, 1 - dist / maxLen);
      return Math.round(similarityRatio * 100);
    },

    // Generate letter-by-letter diff comparison for visual feedback
    computePronunciationDiff: function (target, spoken) {
      const rawTarget = (target || "").normalize("NFC").replace(/\u0301/g, "").trim();
      const cleanTarget = this.phoneticNormalize(target);
      const cleanSpoken = this.phoneticNormalize(spoken);

      const diff = [];
      const maxLen = Math.max(cleanTarget.length, cleanSpoken.length);

      for (let i = 0; i < maxLen; i++) {
        const targetChar = rawTarget[i] || cleanTarget[i];
        const tPhon = cleanTarget[i];
        const sPhon = cleanSpoken[i];

        if (tPhon === sPhon) {
          diff.push({
            char: targetChar,
            status: "correct"
          });
        } else if (tPhon !== undefined && sPhon === undefined) {
          diff.push({
            char: targetChar,
            status: "missing"
          });
        } else if (tPhon === undefined && sPhon !== undefined) {
          diff.push({
            char: sPhon,
            status: "extra"
          });
        } else {
          diff.push({
            char: targetChar,
            spokenChar: sPhon,
            status: "mismatch"
          });
        }
      }

      return diff;
    }
  };

  // --- PROVIDER 1: WEB SPEECH API PROVIDER ---
  class WebSpeechProvider {
    constructor() {
      this.name = "web-speech";
      this.recognition = null;
      this.isListening = false;
      this.initRecognition();
    }

    initRecognition() {
      const SpeechRecognition = typeof window !== "undefined"
        ? (window.SpeechRecognition || window.webkitSpeechRecognition || null)
        : null;

      if (SpeechRecognition) {
        try {
          this.recognition = new SpeechRecognition();
          this.recognition.lang = "ru-RU";
          this.recognition.continuous = false;
          this.recognition.interimResults = true;
          this.recognition.maxAlternatives = 3;
        } catch (e) {
          console.warn("Web Speech API recognition initialization failed:", e);
          this.recognition = null;
        }
      }
    }

    isSupported() {
      if (typeof window === "undefined") return false;
      return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    }

    startListening(options = {}) {
      if (!this.isSupported()) {
        const err = new Error("Speech recognition is not supported in this browser.");
        if (options.onError) options.onError(err);
        return Promise.reject(err);
      }

      if (!this.recognition) {
        this.initRecognition();
      }

      // Individual answer controls can override the recognition language. This
      // keeps Russian production exercises in ru-RU while allowing spoken
      // English answers (for example, "Genitive Case") to use en-US.
      this.recognition.lang = options.lang || "ru-RU";

      return new Promise((resolve, reject) => {
        let finalTranscript = "";
        let bestTranscript = "";
        let bestConfidence = 0;
        let alternatives = [];
        let hasResolved = false;

        this.recognition.onstart = () => {
          this.isListening = true;
          if (options.onStart) options.onStart();
        };

        this.recognition.onresult = (event) => {
          let interim = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const res = event.results[i];
            if (res.isFinal) {
              finalTranscript += res[0].transcript;
            } else {
              interim += res[0].transcript;
            }

            // Collect all candidate alternatives
            for (let j = 0; j < res.length; j++) {
              const alt = res[j];
              alternatives.push(alt.transcript);
              if (alt.confidence > bestConfidence) {
                bestConfidence = alt.confidence;
                bestTranscript = alt.transcript;
              }
            }
          }

          const currentBest = (finalTranscript || bestTranscript || interim).trim();
          if (options.onInterim) {
            options.onInterim(currentBest || interim);
          }
        };

        this.recognition.onerror = (event) => {
          this.isListening = false;
          const errorMsg = event.error || "Speech recognition error";
          if (!hasResolved) {
            hasResolved = true;
            if (options.onError) options.onError(new Error(errorMsg));
            reject(new Error(errorMsg));
          }
        };

        this.recognition.onend = () => {
          this.isListening = false;
          if (!hasResolved) {
            hasResolved = true;
            const chosen = (finalTranscript || bestTranscript).trim();
            if (options.onEnd) options.onEnd(chosen);
            resolve({
              transcript: chosen,
              alternatives: Array.from(new Set(alternatives))
            });
          }
        };

        try {
          this.recognition.start();
        } catch (e) {
          this.isListening = false;
          hasResolved = true;
          if (options.onError) options.onError(e);
          reject(e);
        }
      });
    }

    stopListening() {
      if (this.recognition && this.isListening) {
        try {
          this.recognition.stop();
        } catch (e) {
          console.warn("Failed to stop recognition:", e);
        }
      }
      this.isListening = false;
    }

    abortListening() {
      if (this.recognition && this.isListening) {
        try {
          this.recognition.abort();
        } catch (e) {
          console.warn("Failed to abort recognition:", e);
        }
      }
      this.isListening = false;
    }
  }

  // --- AGNOSTIC SPEECH ENGINE FACADE ---
  const defaultProvider = new WebSpeechProvider();

  const SpeechEngine = {
    providers: {
      "webspeech": defaultProvider,
      "web-speech": defaultProvider
    },
    provider: defaultProvider,
    utils: SpeechUtils,

    // Register a new speech provider
    registerProvider: function (name, provider) {
      if (name && provider) {
        this.providers[name] = provider;
      }
    },

    // Switch provider dynamically by name or instance ('webspeech', 'transformers-whisper', etc.)
    setProvider: function (providerOrName) {
      if (typeof providerOrName === "string") {
        if (this.providers[providerOrName]) {
          this.provider = this.providers[providerOrName];
        }
      } else if (providerOrName && typeof providerOrName.isSupported === "function") {
        this.provider = providerOrName;
      }
    },

    getProviderName: function () {
      return this.provider ? (this.provider.name || "custom") : "none";
    },

    isSupported: function () {
      return this.provider && this.provider.isSupported();
    },

    startListening: function (options) {
      if (!this.provider) {
        return Promise.reject(new Error("No speech provider available."));
      }
      return this.provider.startListening(options);
    },

    stopListening: function () {
      if (this.provider) {
        this.provider.stopListening();
      }
    },

    abortListening: function () {
      if (this.provider) {
        this.provider.abortListening();
      }
    },

    isListening: function () {
      return this.provider ? !!this.provider.isListening : false;
    },

    // Evaluates a spoken transcript against a target word/phrase
    evaluate: function (targetWord, spokenTranscript, options = {}) {
      const passThreshold = options.threshold || 75;
      const target = (targetWord || "").trim();
      const spoken = (spokenTranscript || "").trim();

      // If alternatives are provided, test against the highest matching one
      let bestScore = SpeechUtils.calculateSimilarity(target, spoken);
      let bestTranscript = spoken;

      if (Array.isArray(options.alternatives) && options.alternatives.length > 0) {
        options.alternatives.forEach(alt => {
          const score = SpeechUtils.calculateSimilarity(target, alt);
          if (score > bestScore) {
            bestScore = score;
            bestTranscript = alt;
          }
        });
      }

      const isCorrect = bestScore >= passThreshold;
      const letterDiff = SpeechUtils.computePronunciationDiff(target, bestTranscript);

      let grade = "poor";
      let feedback = "Try again / Попробуйте ещё раз";
      let emoji = "🔄";

      if (bestScore >= 95) {
        grade = "perfect";
        feedback = "Outstanding! / Превосходно!";
        emoji = "🌟";
      } else if (bestScore >= 85) {
        grade = "excellent";
        feedback = "Excellent! / Отлично!";
        emoji = "✨";
      } else if (bestScore >= 75) {
        grade = "good";
        feedback = "Good job! / Хорошо!";
        emoji = "👍";
      } else if (bestScore >= 50) {
        grade = "almost";
        feedback = "Almost there! / Почти правильно!";
        emoji = "🎯";
      }

      return {
        targetWord: target,
        transcript: bestTranscript,
        score: bestScore,
        isCorrect: isCorrect,
        grade: grade,
        feedback: feedback,
        emoji: emoji,
        letterDiff: letterDiff
      };
    }
  };

  // Export to window and CommonJS / Node environment for testing
  if (typeof window !== "undefined") {
    window.SpeechEngine = SpeechEngine;
    window.SpeechUtils = SpeechUtils;
    window.WebSpeechProvider = WebSpeechProvider;
  }
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { SpeechEngine, SpeechUtils, WebSpeechProvider };
  }
})();
