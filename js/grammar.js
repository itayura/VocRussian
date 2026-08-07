// Privyetik AI Grammar Learning Manager

(function () {
  // Fallback for setRevealableText helper (useful if app.js is served cached)
  if (!window.setRevealableText) {
    window.setRevealableText = function (elementId, text) {
      const el = document.getElementById(elementId);
      if (!el) return;
      if (!text) {
        el.innerHTML = "";
        return;
      }
      el.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem; width: 100%;">
          <button type="button" class="btn btn-secondary reveal-translation-btn" style="padding: 0.4rem 0.85rem; font-size: 0.85rem; border: 1px solid var(--border-glass); background: var(--bg-input); border-radius: var(--border-radius-sm); color: var(--color-text-muted); cursor: pointer; display: inline-flex; align-items: center; gap: 0.35rem; transition: all 0.2s;">👁️ Reveal Translation</button>
          <span class="translation-text" style="display: none; font-size: 1.05rem;">${escapeHTML(text)}</span>
        </div>
      `;
      const btn = el.querySelector(".reveal-translation-btn");
      const span = el.querySelector(".translation-text");
      if (btn && span) {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          btn.style.display = "none";
          span.style.display = "inline";
        });
      }
    };
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>'"]/g, character => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
    })[character]);
  }

  function sanitizeRichHTML(value) {
    const template = document.createElement("template");
    template.innerHTML = String(value ?? "");
    const allowedTags = new Set(["P", "BR", "UL", "OL", "LI", "STRONG", "B", "EM", "I", "CODE"]);
    [...template.content.querySelectorAll("*")].forEach(element => {
      if (!allowedTags.has(element.tagName)) {
        element.replaceWith(document.createTextNode(element.textContent || ""));
        return;
      }
      [...element.attributes].forEach(attribute => element.removeAttribute(attribute.name));
    });
    return template.innerHTML;
  }

  const STORAGE_KEYS = {
    GRAMMAR_PROGRESS: "voc_russian_grammar_progress",
  };

  const TOPICS_MAP = {
    nominative_case: "Nominative Case",
    accusative_case: "Accusative Case",
    genitive_case: "Genitive Case",
    dative_case: "Dative Case",
    instrumental_case: "Instrumental Case",
    prepositional_case: "Prepositional Case",
    verb_aspects: "Verb Aspects",
    verbs_of_motion: "Verbs of Motion",
    verb_conjugations: "Verb Conjugations",
    past_tense: "Past Tense",
    future_tense: "Future Tense",
    adjectives_declension: "Adjectives Declension",
    pronouns_declension: "Pronouns Declension",
    noun_plurals: "Noun Plurals"
  };

  const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
  const CEFR_TOPIC_WEIGHTS = { A1: 0.35, A2: 0.5, B1: 0.65, B2: 0.78, C1: 0.9, C2: 1 };
  const GRAMMAR_LEVEL_MIN_TOPICS = Math.ceil(Object.keys(TOPICS_MAP).length / 2);
  const GRAMMAR_LEVEL_MIN_MASTERY = 70;
  const GRAMMAR_EVIDENCE_WINDOW = 40;
  const GRAMMAR_EVIDENCE_HALF_LIFE_DAYS = 180;
  const PLACEMENT_PROGRESS_KEY = "__placement_assessment__";

  // State cache
  let grammarProgress = {}; // { topic_id: { lessonsCompleted, quizzesTaken, avgScore, lastPracticed, updatedAt } }
  let currentQuizQuestions = [];
  let currentQuizIndex = 0;
  let currentQuizCorrectCount = 0;
  let currentQuizTopicIds = [];
  let currentQuizResults = [];
  let activeTopic = "nominative_case";
  let activePresetName = null;

  // Parse server-side/Deno JSON error messages
  function getErrorMessage(error) {
    if (!error) return "Unknown error";
    let msg = error.message || String(error);
    try {
      const parsed = JSON.parse(msg);
      if (parsed && parsed.error) {
        msg = parsed.error;
        if (parsed.details) {
          msg += ` (${parsed.details})`;
        }
      }
    } catch (e) {
      // Not JSON, use original message
    }
    return msg;
  }

  const PREVIEW_LESSON_NOMINATIVE = {
    title: "Nominative Case (Именительный падеж)",
    explanation: "The Nominative case is the starting point of the Russian noun system. It represents the subject of the sentence — the person or thing that performs the action. It answers the questions <strong>Кто?</strong> (Who?) for animate subjects and <strong>Что?</strong> (What?) for inanimate ones. When you look up a word in the dictionary, it is always presented in the Nominative case.",
    rules: [
      { ending: "Consonant / -а / -о", rule: "Base Dictionary Form", example: "дом (house), кни́га (book), окно́ (window)" },
      { ending: "Nouns ending in -й / -я / -е", rule: "Soft Nouns Base", example: "музе́й (museum), пе́сня (song), мо́ре (sea)" },
      { ending: "-ы / -и / -а / -я", rule: "Plural Forms", example: "кни́ги (books), дома́ (houses)" }
    ],
    examples: [
      { ru: "Студе́нт чита́ет кни́гу.", en: "The student is reading a book.", explanation: "Студент is the subject, so it remains in the Nominative case." },
      { ru: "Кни́га лежи́т на столе́.", en: "The book is lying on the table.", explanation: "Книга is the subject, in Nominative singular." },
      { ru: "Москва́ — столи́ца Росси́и.", en: "Moscow is the capital of Russia.", explanation: "Москва is the subject, in Nominative." }
    ]
  };

  const GrammarManager = {
    isPrefetching: false,
    debouncePrefetchTimeout: null,

    init: function () {
      this.loadFromStorage();
      this.setupEventListeners();
      this.initCollapsibleSidebar();
      this.initCustomTopicsPanel();
      this.updateGrammarLevelUI();
      // Trigger background prefetch on initialize if user is already logged in
      setTimeout(() => {
        this.prefetchQuizToBuffer();
      }, 1500);
    },

    loadFromStorage: function () {
      try {
        const current = JSON.parse(localStorage.getItem(STORAGE_KEYS.GRAMMAR_PROGRESS)) || {};
        const legacy = JSON.parse(localStorage.getItem("voc_grammar_progress")) || {};
        grammarProgress = { ...legacy, ...current };
        if (Object.keys(legacy).length > 0) {
          localStorage.removeItem("voc_grammar_progress");
          localStorage.setItem(STORAGE_KEYS.GRAMMAR_PROGRESS, JSON.stringify(grammarProgress));
        }
      } catch (e) {
        console.error("Failed to load local grammar progress, initializing empty.", e);
        grammarProgress = {};
      }
    },

    saveToStorage: function () {
      localStorage.setItem(STORAGE_KEYS.GRAMMAR_PROGRESS, JSON.stringify(grammarProgress));
      this.updateGrammarLevelUI();
    },

    initCollapsibleSidebar: function () {
      const gridContainer = document.querySelector(".tutor-grid-container");
      const collapseBtn = document.getElementById("tutor-sidebar-collapse-btn");
      const expandBtn = document.getElementById("tutor-sidebar-expand-btn");

      if (!gridContainer || !collapseBtn || !expandBtn) return;

      // Load collapsed state from cache
      const isCollapsed = localStorage.getItem("voc_grammar_sidebar_collapsed") === "true";
      if (isCollapsed) {
        gridContainer.classList.add("sidebar-collapsed");
      }

      collapseBtn.addEventListener("click", () => {
        gridContainer.classList.add("sidebar-collapsed");
        localStorage.setItem("voc_grammar_sidebar_collapsed", "true");
      });

      expandBtn.addEventListener("click", () => {
        gridContainer.classList.remove("sidebar-collapsed");
        localStorage.setItem("voc_grammar_sidebar_collapsed", "false");
      });
    },

    initCustomTopicsPanel: function () {
      const container = document.getElementById("custom-topics-checkboxes");
      if (!container) return;

      container.innerHTML = "";
      Object.entries(TOPICS_MAP).forEach(([id, name]) => {
        const label = document.createElement("label");
        label.style.display = "flex";
        label.style.alignItems = "center";
        label.style.gap = "0.5rem";
        label.style.fontSize = "0.85rem";
        label.style.color = "var(--color-text-main)";
        label.style.cursor = "pointer";
        label.style.padding = "0.25rem 0";
        label.style.userSelect = "none";
        label.style.position = "relative";
        label.style.zIndex = "10";

        const input = document.createElement("input");
        input.type = "checkbox";
        input.value = id;
        input.className = "topic-checkbox";
        input.style.cursor = "pointer";
        input.style.accentColor = "var(--color-primary)";
        input.style.position = "relative";
        input.style.zIndex = "10";
        
        input.addEventListener("change", () => {
          activePresetName = null;
          this.updatePresetPillsHighlight();
          this.updateGrammarPracticeMasteryUI();
          this.debouncePrefetch();
        });

        label.appendChild(input);
        label.appendChild(document.createTextNode(name));
        container.appendChild(label);
      });

      // Hook up Select All / Clear All
      document.getElementById("topics-select-all").addEventListener("click", () => {
        document.querySelectorAll("#custom-topics-checkboxes .topic-checkbox").forEach(cb => cb.checked = true);
        activePresetName = null;
        this.updatePresetPillsHighlight();
        this.updateGrammarPracticeMasteryUI();
        this.debouncePrefetch();
      });

      document.getElementById("topics-clear-all").addEventListener("click", () => {
        document.querySelectorAll("#custom-topics-checkboxes .topic-checkbox").forEach(cb => cb.checked = false);
        activePresetName = null;
        this.updatePresetPillsHighlight();
        this.updateGrammarPracticeMasteryUI();
        localStorage.removeItem("voc_grammar_quiz_buffer");
      });

      // Hook up Save Preset Button
      document.getElementById("save-subset-btn").addEventListener("click", () => this.saveCurrentSubset());

      // Load saved subsets
      this.loadSavedSubsets();

      // Check first checkbox by default if no preset was auto-activated
      if (!activePresetName) {
        const firstCb = container.querySelector(".topic-checkbox");
        if (firstCb) {
          firstCb.checked = true;
        }
      }
      this.updateGrammarPracticeMasteryUI();
    },

    loadSavedSubsets: function () {
      const listContainer = document.getElementById("saved-subsets-list");
      const listWrapper = document.getElementById("saved-subsets-container");
      if (!listContainer) return;

      // Fetch from localStorage
      let subsets = {};
      try {
        subsets = JSON.parse(localStorage.getItem("voc_russian_grammar_subsets")) || {};
      } catch (e) {
        console.error("Failed to parse subsets", e);
      }

      const subsetKeys = Object.keys(subsets);
      if (subsetKeys.length > 0) {
        listWrapper.style.display = "flex";
        listContainer.innerHTML = "";

        subsetKeys.forEach(name => {
          // Append to list
          const pill = document.createElement("div");
          pill.className = "subset-pill";
          pill.style.display = "inline-flex";
          pill.style.alignItems = "center";
          pill.style.gap = "0.5rem";
          pill.style.padding = "0.35rem 0.75rem";
          pill.style.background = "var(--bg-input)";
          pill.style.border = "1px solid var(--border-glass)";
          pill.style.borderRadius = "var(--border-radius-pill)";
          pill.style.fontSize = "0.8rem";
          pill.style.color = "var(--color-text-main)";
          pill.style.cursor = "pointer";
          pill.style.transition = "all 0.2s";

          pill.onmouseenter = () => {
            if (activePresetName !== name) {
              pill.style.borderColor = "var(--color-primary)";
            }
          };
          pill.onmouseleave = () => {
            if (activePresetName !== name) {
              pill.style.borderColor = "var(--border-glass)";
            }
          };

          pill.addEventListener("click", (e) => {
            if (e.target.classList.contains("delete-subset-btn")) return;
            activePresetName = name;
            
            const checkedTopics = subsets[name] || [];
            document.querySelectorAll("#custom-topics-checkboxes .topic-checkbox").forEach(cb => {
              cb.checked = checkedTopics.includes(cb.value);
            });
            this.updatePresetPillsHighlight();
            this.updateGrammarPracticeMasteryUI();
            this.prefetchQuizToBuffer();
          });

          const nameSpan = document.createElement("span");
          nameSpan.innerText = name;
          pill.appendChild(nameSpan);

          const delBtn = document.createElement("button");
          delBtn.type = "button";
          delBtn.className = "delete-subset-btn";
          delBtn.innerText = "✖";
          delBtn.style.background = "transparent";
          delBtn.style.border = "none";
          delBtn.style.color = "var(--color-text-muted)";
          delBtn.style.cursor = "pointer";
          delBtn.style.fontSize = "0.85rem";
          delBtn.style.padding = "0";
          delBtn.style.display = "flex";
          delBtn.style.alignItems = "center";
          delBtn.style.justifyContent = "center";
          delBtn.style.width = "14px";
          delBtn.style.height = "14px";

          delBtn.onmouseenter = () => delBtn.style.color = "var(--color-error)";
          delBtn.onmouseleave = () => delBtn.style.color = "var(--color-text-muted)";

          delBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            this.deleteSubset(name);
          });

          pill.appendChild(delBtn);
          listContainer.appendChild(pill);
        });
        this.updatePresetPillsHighlight();
      } else {
        listWrapper.style.display = "none";
      }
    },

    updatePresetPillsHighlight: function () {
      const pills = document.querySelectorAll("#saved-subsets-list .subset-pill");
      pills.forEach(pill => {
        const span = pill.querySelector("span");
        if (!span) return;
        const name = span.innerText;
        if (activePresetName === name) {
          pill.style.background = "var(--color-primary)";
          pill.style.color = "#ffffff";
          pill.style.borderColor = "var(--color-primary-hover)";
        } else {
          pill.style.background = "var(--bg-input)";
          pill.style.color = "var(--color-text-main)";
          pill.style.borderColor = "var(--border-glass)";
        }
      });
    },

    saveCurrentSubset: function () {
      const nameInput = document.getElementById("subset-name-input");
      const name = nameInput.value.trim();
      if (!name) {
        alert("Please enter a name for your preset subset.");
        return;
      }

      if (name.length > 25) {
        alert("Preset name should be under 25 characters.");
        return;
      }

      const checked = [];
      document.querySelectorAll("#custom-topics-checkboxes .topic-checkbox:checked").forEach(cb => {
        checked.push(cb.value);
      });

      if (checked.length === 0) {
        alert("Please select at least one topic to save as a preset.");
        return;
      }

      let subsets = {};
      try {
        subsets = JSON.parse(localStorage.getItem("voc_russian_grammar_subsets")) || {};
      } catch (e) {
        console.error(e);
      }

      subsets[name] = checked;
      localStorage.setItem("voc_russian_grammar_subsets", JSON.stringify(subsets));

      nameInput.value = "";
      activePresetName = name;
      this.loadSavedSubsets();
      this.updateGrammarPracticeMasteryUI();
    },

    deleteSubset: async function (name) {
      if (!await window.confirmCustom(`Are you sure you want to delete the preset "${name}"?`)) return;

      let subsets = {};
      try {
        subsets = JSON.parse(localStorage.getItem("voc_russian_grammar_subsets")) || {};
      } catch (e) {
        console.error(e);
      }

      delete subsets[name];
      localStorage.setItem("voc_russian_grammar_subsets", JSON.stringify(subsets));

      if (activePresetName === name) {
        activePresetName = null;
      }
      this.loadSavedSubsets();
      this.updateGrammarPracticeMasteryUI();
    },

    getGrammarProgressMap: function () {
      return grammarProgress;
    },

    setGrammarProgressMap: function (newProgress) {
      grammarProgress = newProgress;
      this.saveToStorage();
    },

    getTopicEvidence: function (topicId, level) {
      const progress = grammarProgress[`${topicId}_${level}`] || {};
      let attempts = Array.isArray(progress.attempts) ? progress.attempts : [];

      if (attempts.length === 0) {
        const total = Number.isFinite(progress.totalQuestions)
          ? progress.totalQuestions
          : (progress.quizzesTaken || 0) * 5;
        if (total > 0) {
          const correct = Number.isFinite(progress.totalCorrect)
            ? progress.totalCorrect
            : ((progress.avgScore || 0) / 100) * total;
          attempts = [{ correct, total, at: progress.lastPracticed || 0 }];
        }
      }

      const now = Date.now();
      let remainingQuestions = GRAMMAR_EVIDENCE_WINDOW;
      let weightedCorrect = 0;
      let weightedTotal = 0;
      let rawQuestions = 0;
      let lastPracticed = 0;

      [...attempts]
        .filter(attempt => Number.isFinite(attempt.total) && attempt.total > 0)
        .sort((a, b) => (b.at || 0) - (a.at || 0))
        .forEach(attempt => {
          if (remainingQuestions <= 0) return;
          const usableQuestions = Math.min(attempt.total, remainingQuestions);
          const accuracy = Math.max(0, Math.min(1, (Number(attempt.correct) || 0) / attempt.total));
          const ageDays = attempt.at > 0 ? Math.max(0, now - attempt.at) / 86400000 : 0;
          const recencyWeight = Math.pow(0.5, ageDays / GRAMMAR_EVIDENCE_HALF_LIFE_DAYS);
          weightedCorrect += accuracy * usableQuestions * recencyWeight;
          weightedTotal += usableQuestions * recencyWeight;
          rawQuestions += usableQuestions;
          remainingQuestions -= usableQuestions;
          lastPracticed = Math.max(lastPracticed, attempt.at || 0);
        });

      if (weightedTotal <= 0) {
        return { mastery: 0, accuracy: 0, questions: 0, effectiveQuestions: 0, lastPracticed: 0 };
      }

      // An 80% Wilson lower bound prevents a tiny perfect quiz from looking like
      // certain mastery while still allowing confidence to grow with practice.
      const accuracy = weightedCorrect / weightedTotal;
      const z = 1.2815515655446004;
      const zSquared = z * z;
      const denominator = 1 + zSquared / weightedTotal;
      const centre = accuracy + zSquared / (2 * weightedTotal);
      const margin = z * Math.sqrt((accuracy * (1 - accuracy) + zSquared / (4 * weightedTotal)) / weightedTotal);
      const lowerBound = Math.max(0, (centre - margin) / denominator);

      return {
        mastery: Math.round(lowerBound * 100),
        accuracy: Math.round(accuracy * 100),
        questions: rawQuestions,
        effectiveQuestions: weightedTotal,
        lastPracticed
      };
    },

    getTopicMastery: function (topicId, level = null) {
      if (!TOPICS_MAP[topicId]) return 0;
      if (level) return this.getTopicEvidence(topicId, level).mastery;

      // Overall topic mastery represents progress through the full CEFR path,
      // so an A1 result cannot be displayed as equivalent to a C2 result.
      let bestMastery = 0;
      CEFR_LEVELS.forEach(cefr => {
        bestMastery = Math.max(bestMastery, this.getTopicEvidence(topicId, cefr).mastery * CEFR_TOPIC_WEIGHTS[cefr]);
      });
      return Math.round(bestMastery);
    },

    getLevelReadiness: function (level) {
      const evidence = Object.keys(TOPICS_MAP)
        .map(topicId => this.getTopicEvidence(topicId, level))
        .filter(result => result.questions > 0);
      const topicsPracticed = evidence.length;
      const averageMastery = topicsPracticed > 0
        ? evidence.reduce((sum, result) => sum + result.mastery, 0) / topicsPracticed
        : 0;
      const coverage = Math.min(1, topicsPracticed / GRAMMAR_LEVEL_MIN_TOPICS);
      const quality = Math.min(1, averageMastery / GRAMMAR_LEVEL_MIN_MASTERY);

      return {
        level,
        progress: Math.round(coverage * quality * 100),
        topicsPracticed,
        requiredTopics: GRAMMAR_LEVEL_MIN_TOPICS,
        averageMastery: Math.round(averageMastery),
        demonstrated: topicsPracticed >= GRAMMAR_LEVEL_MIN_TOPICS && averageMastery >= GRAMMAR_LEVEL_MIN_MASTERY
      };
    },

    getPlacementEstimate: function () {
      const attempts = grammarProgress[PLACEMENT_PROGRESS_KEY]?.attempts;
      if (!Array.isArray(attempts)) return null;
      const assessments = new Map();
      attempts.filter(attempt => attempt.source === "placement" && (attempt.placedLevel === "Pre-A1" || CEFR_LEVELS.includes(attempt.placedLevel))).forEach(attempt => {
        const id = attempt.assessmentId || attempt.id;
        const existing = assessments.get(id);
        if (!existing || (attempt.at || 0) > existing.at) {
          assessments.set(id, { level: attempt.placedLevel, at: attempt.at || 0 });
        }
      });
      return [...assessments.values()].sort((a, b) => b.at - a.at)[0] || null;
    },

    getGrammarProficiency: function () {
      const readiness = Object.fromEntries(CEFR_LEVELS.map(level => [level, this.getLevelReadiness(level)]));
      const demonstratedLevel = [...CEFR_LEVELS].reverse().find(level => readiness[level].demonstrated) || null;
      const placement = this.getPlacementEstimate();
      const demonstratedIndex = demonstratedLevel ? CEFR_LEVELS.indexOf(demonstratedLevel) : -1;
      const placementIndex = placement ? CEFR_LEVELS.indexOf(placement.level) : -1;
      const levelIndex = Math.max(demonstratedIndex, placementIndex);
      const level = levelIndex >= 0 ? CEFR_LEVELS[levelIndex] : "Pre-A1";
      const targetLevel = CEFR_LEVELS[levelIndex + 1] || null;

      return {
        level,
        progress: targetLevel ? readiness[targetLevel].progress : 100,
        targetLevel,
        basis: demonstratedIndex >= placementIndex && demonstratedIndex >= 0 ? "demonstrated" : (placement ? "placement" : "none"),
        readiness
      };
    },

    getGrammarLevel: function () {
      return this.getGrammarProficiency().level;
    },

    updateGrammarLevelUI: function () {
      const lvlVal = document.getElementById("grammar-level-val");
      const progressVal = document.getElementById("grammar-progress-val");
      const summary = this.getGrammarProficiency();
      if (lvlVal) lvlVal.innerText = summary.level;
      if (progressVal) {
        progressVal.innerText = summary.targetLevel
          ? `${summary.progress}% to ${summary.targetLevel}${summary.basis === "placement" ? " - placement estimate" : ""}`
          : "Highest CEFR band demonstrated";
      }
    },

    // Merge immutable quiz-attempt events so concurrent devices cannot lose progress.
    syncWithCloud: async function () {
      if (!window.SupabaseSync || window.SupabaseSync.connectionState !== "connected" || !window.SupabaseSync.user) return false;

      try {
        const client = window.SupabaseSync.client;
        const userId = window.SupabaseSync.user.id;
        const { data: dbProgress, error: fetchErr } = await client.from("voc_grammar_progress").select("*");
        if (fetchErr) throw fetchErr;

        const fromDb = row => ({
          topicId: row.topic_id,
          lessonsCompleted: row.lessons_completed || 0,
          quizzesTaken: row.quizzes_taken || 0,
          totalCorrect: row.total_questions > 0 ? (row.total_correct || 0) : undefined,
          totalQuestions: row.total_questions > 0 ? row.total_questions : undefined,
          avgScore: row.avg_score || 0,
          attempts: Array.isArray(row.attempts) ? row.attempts : [],
          lastPracticed: Date.parse(row.last_practiced) || 0,
          updatedAt: Date.parse(row.updated_at) || 0
        });

        const normalizeAttempts = record => {
          if (Array.isArray(record.attempts) && record.attempts.length > 0) return record.attempts;
          const total = record.totalQuestions || ((record.quizzesTaken || 0) * 5);
          if (total <= 0) return [];
          const correct = Number.isFinite(record.totalCorrect)
            ? record.totalCorrect
            : Math.round(((record.avgScore || 0) / 100) * total);
          return [{ id: `legacy_${record.topicId}_${record.updatedAt || record.lastPracticed || 0}`, correct, total, at: record.lastPracticed || 0, source: "legacy" }];
        };

        const mergeRecord = (local = {}, remote = {}) => {
          const topicId = local.topicId || remote.topicId;
          const attemptsById = new Map();
          [...normalizeAttempts(local), ...normalizeAttempts(remote)].forEach(attempt => attemptsById.set(attempt.id, attempt));
          const attempts = [...attemptsById.values()];
          const totalCorrect = attempts.reduce((sum, attempt) => sum + (attempt.correct || 0), 0);
          const totalQuestions = attempts.reduce((sum, attempt) => sum + (attempt.total || 0), 0);
          const updatedAt = Math.max(local.updatedAt || 0, remote.updatedAt || 0) || Date.now();
          return {
            topicId,
            lessonsCompleted: Math.max(local.lessonsCompleted || 0, remote.lessonsCompleted || 0),
            quizzesTaken: attempts.length,
            totalCorrect,
            totalQuestions,
            avgScore: totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0,
            attempts,
            lastPracticed: Math.max(local.lastPracticed || 0, remote.lastPracticed || 0),
            updatedAt
          };
        };

        const remoteMap = Object.fromEntries((dbProgress || []).map(row => [row.topic_id, fromDb(row)]));
        const allTopicIds = new Set([...Object.keys(grammarProgress), ...Object.keys(remoteMap)]);
        allTopicIds.forEach(topicId => {
          grammarProgress[topicId] = mergeRecord(grammarProgress[topicId], remoteMap[topicId]);
        });

        const rows = [...allTopicIds].map(topicId => {
          const progress = grammarProgress[topicId];
          return {
            user_id: userId,
            topic_id: topicId,
            lessons_completed: progress.lessonsCompleted || 0,
            quizzes_taken: progress.quizzesTaken || 0,
            total_correct: progress.totalCorrect || 0,
            total_questions: progress.totalQuestions || 0,
            avg_score: progress.avgScore || 0,
            attempts: progress.attempts || [],
            last_practiced: new Date(progress.lastPracticed || Date.now()).toISOString(),
            updated_at: new Date(progress.updatedAt || Date.now()).toISOString()
          };
        });
        if (rows.length > 0) {
          const { error: pushErr } = await client.from("voc_grammar_progress").upsert(rows);
          if (pushErr) throw pushErr;
        }
        this.saveToStorage();
        return true;
      } catch (err) {
        console.warn("[GrammarManager] Sync failed:", err);
        return false;
      }
    },

    // Record lesson completion
    recordLessonCompleted: function (topicId) {
      if (!grammarProgress[topicId]) {
        grammarProgress[topicId] = {
          topicId: topicId,
          lessonsCompleted: 0,
          quizzesTaken: 0,
          avgScore: 0,
          lastPracticed: Date.now(),
          updatedAt: Date.now()
        };
      }
      const wasCompleted = (grammarProgress[topicId].lessonsCompleted || 0) > 0;
      grammarProgress[topicId].lessonsCompleted = 1;
      grammarProgress[topicId].lastPracticed = Date.now();
      grammarProgress[topicId].updatedAt = Date.now();
      
      this.saveToStorage();
      
      // Auto sync background change
      if (window.SupabaseSync && window.SupabaseSync.connectionState === "connected" && window.SupabaseSync.user) {
        this.syncWithCloud();
      }
      return !wasCompleted;
    },

    // Record quiz completion
    recordQuizCompleted: function (topicId, level, correctCount, totalCount) {
      if (!TOPICS_MAP[topicId] || !CEFR_LEVELS.includes(level) || !Number.isFinite(correctCount) || !Number.isFinite(totalCount) || totalCount <= 0 || correctCount < 0 || correctCount > totalCount) return false;
      const key = `${topicId}_${level}`; // e.g. "nominative_case_A1"
      
      if (!grammarProgress[key]) {
        grammarProgress[key] = {
          topicId: key,
          lessonsCompleted: 0,
          quizzesTaken: 0,
          totalCorrect: 0,
          totalQuestions: 0,
          avgScore: 0,
          lastPracticed: Date.now(),
          updatedAt: Date.now()
        };
      }

      const p = grammarProgress[key];
      if (!Number.isFinite(p.totalQuestions)) {
        p.totalQuestions = (p.quizzesTaken || 0) * 5;
        p.totalCorrect = Math.round(((p.avgScore || 0) / 100) * p.totalQuestions);
      }
      p.attempts = Array.isArray(p.attempts) ? p.attempts : [];
      if (p.attempts.length === 0 && p.totalQuestions > 0) {
        p.attempts.push({ id: `legacy_${key}_${p.lastPracticed || 0}`, correct: p.totalCorrect || 0, total: p.totalQuestions, at: p.lastPracticed || 0, source: "legacy" });
      }
      p.attempts.push({
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        correct: correctCount,
        total: totalCount,
        at: Date.now(),
        source: "quiz"
      });
      p.totalCorrect = p.attempts.reduce((sum, attempt) => sum + (attempt.correct || 0), 0);
      p.totalQuestions = p.attempts.reduce((sum, attempt) => sum + (attempt.total || 0), 0);
      p.quizzesTaken = p.attempts.length;
      p.avgScore = Math.round((p.totalCorrect / p.totalQuestions) * 100);
      p.lastPracticed = Date.now();
      p.updatedAt = Date.now();

      this.saveToStorage();

      // Auto sync background change
      if (window.SupabaseSync && window.SupabaseSync.connectionState === "connected" && window.SupabaseSync.user) {
        this.syncWithCloud();
      }
      return true;
    },

    recordPlacementAssessment: function (placedLevel, bandResults) {
      if ((placedLevel !== "Pre-A1" && !CEFR_LEVELS.includes(placedLevel)) || !Array.isArray(bandResults)) return false;
      const validResults = bandResults.filter(result =>
        CEFR_LEVELS.includes(result.level) && Number.isFinite(result.correct) && Number.isFinite(result.total) &&
        result.total > 0 && result.correct >= 0 && result.correct <= result.total
      );
      if (validResults.length === 0) return false;

      const now = Date.now();
      const assessmentId = `placement_${now}_${Math.random().toString(36).slice(2, 8)}`;
      const progress = grammarProgress[PLACEMENT_PROGRESS_KEY] || {
        topicId: PLACEMENT_PROGRESS_KEY,
        lessonsCompleted: 0,
        attempts: []
      };
      progress.attempts = Array.isArray(progress.attempts) ? progress.attempts : [];
      validResults.forEach(result => {
        progress.attempts.push({
          id: `${assessmentId}_${result.level}`,
          assessmentId,
          level: result.level,
          placedLevel,
          correct: result.correct,
          total: result.total,
          at: now,
          source: "placement"
        });
      });
      progress.totalCorrect = progress.attempts.reduce((sum, attempt) => sum + (Number(attempt.correct) || 0), 0);
      progress.totalQuestions = progress.attempts.reduce((sum, attempt) => sum + (Number(attempt.total) || 0), 0);
      progress.quizzesTaken = new Set(progress.attempts.map(attempt => attempt.assessmentId || attempt.id)).size;
      progress.avgScore = progress.totalQuestions > 0 ? Math.round((progress.totalCorrect / progress.totalQuestions) * 100) : 0;
      progress.lastPracticed = now;
      progress.updatedAt = now;
      grammarProgress[PLACEMENT_PROGRESS_KEY] = progress;
      this.saveToStorage();

      if (window.SupabaseSync && window.SupabaseSync.connectionState === "connected" && window.SupabaseSync.user) {
        this.syncWithCloud();
      }
      return true;
    },

    debouncePrefetch: function () {
      if (this.debouncePrefetchTimeout) {
        clearTimeout(this.debouncePrefetchTimeout);
      }
      this.debouncePrefetchTimeout = setTimeout(() => {
        this.prefetchQuizToBuffer();
      }, 1000);
    },

    prefetchQuizToBuffer: async function () {
      // 1. Only run if user is logged in
      if (!window.SupabaseSync || window.SupabaseSync.connectionState !== "connected" || !window.SupabaseSync.user) {
        return;
      }

      if (this.isPrefetching) {
        return;
      }

      // 2. Determine current parameters
      const levelEl = document.getElementById("practice-quiz-level");
      const cefr = levelEl ? levelEl.value : "A1";

      const countEl = document.getElementById("practice-quiz-count");
      const count = countEl ? parseInt(countEl.value, 10) : 5;

      const checkedTopics = [];
      const checkedNames = [];
      document.querySelectorAll("#custom-topics-checkboxes .topic-checkbox:checked").forEach(cb => {
        checkedTopics.push(cb.value);
        checkedNames.push(TOPICS_MAP[cb.value] || cb.value);
      });
      
      if (checkedNames.length === 0) {
        return;
      }
      const topicParam = checkedNames.join(", ");
      currentQuizTopicIds = [...checkedTopics];

      // Check if there is already a valid buffer matching these exact parameters
      try {
        const currentBuffer = JSON.parse(localStorage.getItem("voc_grammar_quiz_buffer"));
        if (currentBuffer && 
            currentBuffer.cefr === cefr && 
            currentBuffer.topicParam === topicParam && 
            currentBuffer.count === count &&
            Array.isArray(currentBuffer.questions) && 
            currentBuffer.questions.length > 0) {
          console.log("[GrammarManager] Buffer already exists and matches parameters. Skipping prefetch.");
          return;
        }
      } catch (e) {
        localStorage.removeItem("voc_grammar_quiz_buffer");
      }

      this.isPrefetching = true;
      console.log("[GrammarManager] Starting background prefetch for topics:", topicParam, "cefr:", cefr, "count:", count);

      try {
        const client = window.SupabaseSync.client;
        const { data: sessionData } = await client.auth.getSession();
        const token = sessionData?.session?.access_token;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const vocabList = this.getActiveVocabWords();
        const nativeLang = window.SRS ? window.SRS.getSetting("nativeLanguage", "en") : "en";

        const { data, error } = await client.functions.invoke("ai-grammar", {
          body: { action: "quiz", topic: topicParam, topicIds: checkedTopics, cefr: cefr, count: count, vocab: vocabList, nativeLanguage: nativeLang },
          headers: headers
        });

        if (error) throw new Error(error.message || error);
        if (!data?.success || !Array.isArray(data?.data?.questions)) throw new Error("Invalid prefetch questions payload.");

        let questions = data.data.questions;

        // Apply blacklist filter
        let blacklist = [];
        try {
          blacklist = JSON.parse(localStorage.getItem("voc_blacklisted_sentences")) || [];
        } catch (e) {}

        if (blacklist.length > 0) {
          questions = questions.filter(q => !blacklist.includes(q.sentencePattern));
        }

        if (questions.length > 0) {
          const bufferData = {
            cefr: cefr,
            topicParam: topicParam,
            count: count,
            questions: questions,
            timestamp: Date.now()
          };
          localStorage.setItem("voc_grammar_quiz_buffer", JSON.stringify(bufferData));
          console.log("[GrammarManager] Background prefetch complete. Buffered", questions.length, "questions.");
        }
      } catch (err) {
        console.warn("[GrammarManager] Background prefetch failed:", err);
      } finally {
        this.isPrefetching = false;
      }
    },

    // UI Tab controller switching
    switchSubtab: function (tabId) {
      // Deactivate all tabs
      document.getElementById("grammar-tab-tutor").classList.remove("active");
      document.getElementById("grammar-tab-practice").classList.remove("active");
      document.getElementById("grammar-tab-sandbox").classList.remove("active");

      // Hide panels
      document.getElementById("grammar-subview-tutor").style.display = "none";
      document.getElementById("grammar-subview-practice").style.display = "none";
      document.getElementById("grammar-subview-sandbox").style.display = "none";

      // Activate clicked
      document.getElementById(`grammar-tab-${tabId}`).classList.add("active");
      document.getElementById(`grammar-subview-${tabId}`).style.display = "flex";

      if (tabId === "practice") {
        this.updateGrammarPracticeMasteryUI();
      }
    },

    // Calculate and render grammar mastery for selected topic/level
    updateGrammarPracticeMasteryUI: function () {
      const level = document.getElementById("practice-quiz-level").value;
      const gProgressMap = this.getGrammarProgressMap() || {};

      let checkedTopics = [];
      document.querySelectorAll("#custom-topics-checkboxes .topic-checkbox:checked").forEach(cb => {
        checkedTopics.push(cb.value);
      });

      const valEl = document.getElementById("practice-target-mastery-val");
      const fillEl = document.getElementById("practice-target-mastery-fill");

      if (checkedTopics.length === 0) {
        if (valEl) valEl.innerText = "0%";
        if (fillEl) fillEl.style.width = "0%";
        return;
      }

      let totalMastery = 0;
      checkedTopics.forEach(t => {
        totalMastery += this.getTopicMastery(t, level);
      });

      const masteryPct = Math.round(totalMastery / checkedTopics.length);

      if (valEl) valEl.innerText = `${masteryPct}%`;
      if (fillEl) fillEl.style.width = `${masteryPct}%`;
    },

    // Event listeners configuration
    setupEventListeners: function () {
      const self = this;

      // Subtab pills
      document.getElementById("grammar-tab-tutor").addEventListener("click", () => self.switchSubtab("tutor"));
      document.getElementById("grammar-tab-practice").addEventListener("click", () => self.switchSubtab("practice"));
      document.getElementById("grammar-tab-sandbox").addEventListener("click", () => self.switchSubtab("sandbox"));

      // Tutor Topic selection buttons
      document.querySelectorAll(".grammar-topic-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
          document.querySelectorAll(".grammar-topic-btn").forEach(b => {
            b.classList.remove("active");
            b.style.background = "transparent";
            b.style.borderColor = "transparent";
            b.style.color = "var(--color-text-muted)";
          });
          btn.classList.add("active");
          btn.style.background = "var(--bg-input)";
          btn.style.borderColor = "var(--border-glass)";
          btn.style.color = "var(--color-text-main)";
          
          activeTopic = btn.getAttribute("data-topic");
          const mobileSelect = document.getElementById("tutor-topic-select-mobile");
          if (mobileSelect) {
            mobileSelect.value = activeTopic;
          }
          self.loadTutorLesson(activeTopic);
        });
      });

      // Synchronize mobile topic select dropdown
      const mobileSelect = document.getElementById("tutor-topic-select-mobile");
      if (mobileSelect) {
        mobileSelect.addEventListener("change", (e) => {
          const val = e.target.value;
          activeTopic = val;
          document.querySelectorAll(".grammar-topic-btn").forEach(b => {
            if (b.getAttribute("data-topic") === val) {
              b.classList.add("active");
              b.style.background = "var(--bg-input)";
              b.style.borderColor = "var(--border-glass)";
              b.style.color = "var(--color-text-main)";
            } else {
              b.classList.remove("active");
              b.style.background = "transparent";
              b.style.borderColor = "transparent";
              b.style.color = "var(--color-text-muted)";
            }
          });
          self.loadTutorLesson(val);
        });
      }



      // Practice Arena Buttons
      document.getElementById("practice-start-btn").addEventListener("click", () => self.startPracticeQuiz());
      document.getElementById("quiz-quit-btn").addEventListener("click", () => self.quitPracticeQuiz());
      document.getElementById("quiz-next-btn").addEventListener("click", () => self.nextQuizQuestion());
      document.getElementById("quiz-complete-finish-btn").addEventListener("click", () => self.resetPracticeArenaUI());
      
      const quizCompleteAgainBtn = document.getElementById("quiz-complete-again-btn");
      if (quizCompleteAgainBtn) {
        quizCompleteAgainBtn.addEventListener("click", () => {
          document.getElementById("practice-complete-screen").style.display = "none";
          self.startPracticeQuiz();
        });
      }

      // Target settings change
      document.getElementById("practice-quiz-level").addEventListener("change", () => {
        self.updateGrammarPracticeMasteryUI();
        self.prefetchQuizToBuffer();
      });

      // Sandbox Buttons
      document.getElementById("sandbox-analyze-btn").addEventListener("click", () => self.analyzeSandboxWriting());
      document.getElementById("sandbox-clear-btn").addEventListener("click", () => {
        document.getElementById("sandbox-user-input").value = "";
        document.getElementById("sandbox-results-panel").style.display = "none";
      });
    },

    // Check Cloud Database Connected
    ensureCloudConnected: function () {
      if (!window.SupabaseSync || !window.SupabaseSync.client || !window.SupabaseSync.user) {
        if (window.openModal) {
          window.openModal("modal-grammar-cta");
        } else {
          alert("Account Sign-in Required: AI Grammar features require a signed-in account. Please sign in or create an account under the 'Account' tab first.");
        }
        return false;
      }
      return true;
    },

    renderTutorExplanation: function (payload) {
      payload = {
        title: escapeHTML(payload?.title),
        explanation: sanitizeRichHTML(payload?.explanation),
        rules: Array.isArray(payload?.rules) ? payload.rules.map(rule => ({ ending: escapeHTML(rule.ending), rule: escapeHTML(rule.rule), example: escapeHTML(rule.example) })) : [],
        examples: Array.isArray(payload?.examples) ? payload.examples.map(example => ({ ru: escapeHTML(example.ru), en: escapeHTML(example.en), explanation: escapeHTML(example.explanation) })) : []
      };
      const contentEl = document.getElementById("tutor-explanation-content");
      const rulesCollapsed = localStorage.getItem("voc_tutor_rules_collapsed") === "true";
      const examplesCollapsed = localStorage.getItem("voc_tutor_examples_collapsed") === "true";

      const html = `
        <div class="card" style="background: var(--bg-input); border: 1px solid var(--border-glass); border-radius: var(--border-radius-md); padding: 1.5rem; width: 100%; display: flex; flex-direction: column; gap: 1rem; box-sizing: border-box;">
          <h3 style="font-family: var(--font-heading); font-size: 1.4rem; margin: 0 0 0.5rem 0; color: var(--color-primary-hover);">${payload.title}</h3>
          <div class="tutor-explanation-text" style="line-height: 1.6; font-size: 1rem; color: var(--color-text-main); word-break: break-word; overflow-wrap: break-word; max-width: 100%; overflow-x: auto;">${payload.explanation}</div>
          
          <h4 class="tutor-collapsible-trigger" data-target="voc_tutor_rules_collapsed" style="font-family: var(--font-heading); margin-top: 1rem; margin-bottom: 0.5rem; color: var(--color-text-main); cursor: pointer; display: flex; align-items: center; gap: 0.5rem; user-select: none; -webkit-user-select: none;">
            <span class="collapse-arrow" style="font-size: 0.8rem; color: var(--color-primary); transition: transform 0.2s;">${rulesCollapsed ? "▶" : "▼"}</span> Declension / Conjugation Rules
          </h4>
          <div id="tutor-rules-section" style="overflow-x: auto; width: 100%; display: ${rulesCollapsed ? "none" : "block"};">
            <table style="width: 100%; border-collapse: collapse; font-size: 0.95rem;">
              <thead>
                <tr style="background-color: var(--bg-input); border-bottom: 2px solid var(--border-glass);">
                  <th style="padding: 0.75rem 1rem; text-align: left; color: var(--color-primary);">Pattern/Form</th>
                  <th style="padding: 0.75rem 1rem; text-align: left; color: var(--color-primary);">Ending Shift</th>
                  <th style="padding: 0.75rem 1rem; text-align: left; color: var(--color-primary);">Example</th>
                </tr>
              </thead>
              <tbody>
                ${payload.rules.map(r => `
                  <tr style="border-bottom: 1px solid var(--border-glass);">
                    <td style="padding: 0.75rem 1rem;"><strong>${r.ending}</strong></td>
                    <td style="padding: 0.75rem 1rem;">${r.rule}</td>
                    <td style="padding: 0.75rem 1rem;"><code>${r.example}</code></td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>

          <h4 class="tutor-collapsible-trigger" data-target="voc_tutor_examples_collapsed" style="font-family: var(--font-heading); margin-top: 1.25rem; margin-bottom: 0.5rem; color: var(--color-text-main); cursor: pointer; display: flex; align-items: center; gap: 0.5rem; user-select: none; -webkit-user-select: none;">
            <span class="collapse-arrow" style="font-size: 0.8rem; color: var(--color-primary); transition: transform 0.2s;">${examplesCollapsed ? "▶" : "▼"}</span> Interactive Examples
          </h4>
          <div id="tutor-examples-section" style="display: ${examplesCollapsed ? "none" : "flex"}; flex-direction: column; gap: 0.75rem; width: 100%;">
            ${payload.examples.map(ex => `
              <div style="background: rgba(255,255,255,0.02); border-radius: var(--border-radius-sm); padding: 0.85rem 1rem; border: 1px solid var(--border-glass); display: flex; flex-direction: column; gap: 0.35rem; box-sizing: border-box;">
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap: wrap; gap: 0.5rem; width: 100%;">
                  <strong style="font-size:1.15rem; color:var(--color-primary-hover); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">${ex.ru}</strong>
                  <button type="button" class="audio-btn tutor-tts-btn" data-text="${ex.ru.replace(/[́]/g, '')}" style="width:32px; height:32px; font-size:0.9rem; border-color:transparent; background:var(--bg-card); display: inline-flex; align-items: center; justify-content: center; cursor: pointer; border-radius: 50%;">🔊</button>
                </div>
                <div class="page-subtitle" style="font-size: 0.9rem; margin: 0; color: var(--color-text-main); font-weight: 500;">${ex.en}</div>
                <div style="font-size: 0.85rem; font-style:italic; color:var(--color-text-muted);">${ex.explanation}</div>
              </div>
            `).join("")}
          </div>

        </div>
      `;

      contentEl.innerHTML = window.wrapCyrillicWords ? window.wrapCyrillicWords(html) : html;

      // Bind collapsible headers inside tutor explanation
      contentEl.querySelectorAll(".tutor-collapsible-trigger").forEach(trigger => {
        trigger.addEventListener("click", () => {
          const cacheKey = trigger.getAttribute("data-target");
          const sectionEl = trigger.nextElementSibling;
          const arrowEl = trigger.querySelector(".collapse-arrow");
          if (!sectionEl || !arrowEl) return;
          
          const isCollapsed = sectionEl.style.display === "none";
          if (isCollapsed) {
            sectionEl.style.display = cacheKey.includes("rules") ? "block" : "flex";
            arrowEl.textContent = "▼";
            localStorage.setItem(cacheKey, "false");
          } else {
            sectionEl.style.display = "none";
            arrowEl.textContent = "▶";
            localStorage.setItem(cacheKey, "true");
          }
        });
      });

      // Bind TTS audio play buttons
      this.bindTutorTtsButtons();

    },

    // --- AI TUTOR ACTION ---
    loadTutorLesson: async function (topicId) {
      const isLoggedIn = !!(window.SupabaseSync && window.SupabaseSync.connectionState === "connected" && window.SupabaseSync.user);
      
      const loader = document.getElementById("tutor-loading");
      const contentEl = document.getElementById("tutor-explanation-content");

      if (!isLoggedIn) {
        if (topicId === "nominative_case") {
          loader.style.display = "flex";
          contentEl.innerHTML = "";
          setTimeout(() => {
            loader.style.display = "none";
            this.renderTutorExplanation(PREVIEW_LESSON_NOMINATIVE);
          }, 300);
          return;
        } else {
          this.ensureCloudConnected();
          return;
        }
      }

      loader.style.display = "flex";
      contentEl.innerHTML = "";

      // Check Cache
      const cacheKey = "voc_grammar_explanations_cache";
      let explanationsCache = {};
      try {
        explanationsCache = JSON.parse(localStorage.getItem(cacheKey)) || {};
      } catch (e) {
        console.warn("Failed to parse explanations cache", e);
      }

      if (explanationsCache[topicId]) {
        try {
          this.renderTutorExplanation(explanationsCache[topicId]);
          const firstCompletion = this.recordLessonCompleted(topicId);
          if (firstCompletion && window.SRS) {
            window.SRS.addActivityXP(15, "grammar_lesson", { topicId });
            this.showXpToast("+15 XP (Grammar Study)");
          }
          loader.style.display = "none";
          return;
        } catch (cacheErr) {
          console.warn("Failed to render cached explanation for " + topicId + ", clearing cache and refetching:", cacheErr);
          delete explanationsCache[topicId];
          try {
            localStorage.setItem(cacheKey, JSON.stringify(explanationsCache));
          } catch (storageErr) {}
        }
      }

      try {
        const client = window.SupabaseSync.client;
        const { data: sessionData } = await client.auth.getSession();
        const token = sessionData?.session?.access_token;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        
        // Invoke explain Deno edge function
        const nativeLang = window.SRS ? window.SRS.getSetting("nativeLanguage", "en") : "en";
        const { data, error } = await client.functions.invoke("ai-grammar", {
          body: { action: "explain", topic: topicId, nativeLanguage: nativeLang },
          headers: headers
        });

        if (error) throw new Error(error.message || error);
        if (!data || !data.success) throw new Error("Failed to receive explanation payload.");

        loader.style.display = "none";
        
        const payload = data.data;

        // Render AI Response
        this.renderTutorExplanation(payload);

        // Save to cache
        try {
          explanationsCache[topicId] = payload;
          localStorage.setItem(cacheKey, JSON.stringify(explanationsCache));
        } catch (cacheErr) {
          console.warn("Failed to write explanation to cache:", cacheErr);
        }

        // Save XP/Progress
        const firstCompletion = this.recordLessonCompleted(topicId);
        if (firstCompletion && window.SRS) {
          window.SRS.addActivityXP(15, "grammar_lesson", { topicId });
          this.showXpToast("+15 XP (Grammar Study)");
        }

      } catch (err) {
        loader.style.display = "none";
        console.error("Failed to explain grammar concept:", err);
        const errContent = `<div class="card" style="background:var(--bg-input); border:1px solid var(--border-glass); border-radius:var(--border-radius-md); padding:1.5rem; color:var(--color-error); width:100%;">Error loading lesson: ${escapeHTML(getErrorMessage(err))}. Please try again later.</div>`;
        contentEl.innerHTML = errContent;
      }
    },

    bindTutorTtsButtons: function () {
      document.querySelectorAll(".tutor-tts-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          const text = btn.getAttribute("data-text");
          if (window.AudioEngine && typeof window.AudioEngine.speak === "function") {
            window.AudioEngine.speak(text);
          } else if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'ru-RU';
            window.speechSynthesis.speak(utterance);
          }
        });
      });
    },

    // --- PRACTICE ARENA ACTION ---
    getActiveVocabWords: function () {
      if (!window.SRS || typeof window.SRS.getAllWords !== "function") return [];
      const allWords = window.SRS.getAllWords();
      const active = allWords.filter(w => {
        const prog = window.SRS.getCardProgress(w.id);
        return (prog.box > 1 && prog.box < 5) || prog.correctCount > 0 || prog.wrongCount > 0;
      });
      const targetList = active.length > 0 ? active : allWords;
      const shuffled = [...targetList].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, 15).map(w => w.word);
    },

    startPracticeQuiz: async function () {
      const setupScreen = document.getElementById("practice-setup-screen");
      const loadingScreen = document.getElementById("practice-loading");
      const activeScreen = document.getElementById("practice-active-screen");

      const cefr = document.getElementById("practice-quiz-level").value;
      const count = parseInt(document.getElementById("practice-quiz-count").value, 10);

      const checkedTopics = [];
      const checkedNames = [];
      document.querySelectorAll("#custom-topics-checkboxes .topic-checkbox:checked").forEach(cb => {
        checkedTopics.push(cb.value);
        checkedNames.push(TOPICS_MAP[cb.value] || cb.value);
      });
      if (checkedNames.length === 0) {
        alert("Please select at least one grammar topic to start the quiz.");
        return;
      }
      const topicParam = checkedNames.join(", ");
      currentQuizTopicIds = [...checkedTopics];

      // Check Offline Mode
      const isOnline = navigator.onLine;
      if (!isOnline) {
        let cachedSentences = [];
        try {
          cachedSentences = JSON.parse(localStorage.getItem("voc_highly_rated_sentences")) || [];
        } catch (e) {}

        const matching = cachedSentences.filter(q => {
          return q.cefr === cefr && checkedTopics.includes(q.topic);
        });

        if (matching.length >= count) {
          const shuffled = [...matching].sort(() => 0.5 - Math.random());
          currentQuizQuestions = shuffled.slice(0, count);
          currentQuizIndex = 0;
          currentQuizCorrectCount = 0;
          currentQuizResults = [];

          setupScreen.style.display = "none";
          loadingScreen.style.display = "none";
          if (window.setPracticeFocusMode) window.setPracticeFocusMode(true);
          activeScreen.style.display = "flex";
          this.renderQuizQuestion();
          this.showXpToast("Started Quiz in Offline Mode 📶");
          return;
        } else {
          alert(`Offline Mode: Not enough highly-rated cached sentences for selected topics (requires at least ${count}, you have ${matching.length} cached). Please connect online or rate sentences with 👍 during online study to cache them.`);
          return;
        }
      }

      if (!this.ensureCloudConnected()) return;
      if (window.setPracticeFocusMode) window.setPracticeFocusMode(true);

      // Check if we have matching buffered sentences for logged-in user
      const isLoggedIn = !!(window.SupabaseSync && window.SupabaseSync.connectionState === "connected" && window.SupabaseSync.user);
      if (isLoggedIn) {
        try {
          const bufferVal = localStorage.getItem("voc_grammar_quiz_buffer");
          if (bufferVal) {
            const buffer = JSON.parse(bufferVal);
            if (buffer && 
                buffer.cefr === cefr && 
                buffer.topicParam === topicParam && 
                buffer.count === count &&
                Array.isArray(buffer.questions) && 
                buffer.questions.length > 0) {
              
              console.log("[GrammarManager] Buffer hit! Starting quiz instantly with buffered questions.");
              currentQuizQuestions = buffer.questions;
              currentQuizIndex = 0;
              currentQuizCorrectCount = 0;
              currentQuizResults = [];
              
              localStorage.removeItem("voc_grammar_quiz_buffer");
              
              setupScreen.style.display = "none";
              loadingScreen.style.display = "none";
              activeScreen.style.display = "flex";
              
              this.renderQuizQuestion();
              this.showXpToast("Loaded quiz instantly from buffer! ⚡");
              
              // Trigger prefetch for the NEXT quiz in the background
              setTimeout(() => {
                this.prefetchQuizToBuffer();
              }, 1000);
              return;
            }
          }
        } catch (e) {
          console.warn("[GrammarManager] Failed to read or parse quiz buffer:", e);
          localStorage.removeItem("voc_grammar_quiz_buffer");
        }
      }

      setupScreen.style.display = "none";
      loadingScreen.style.display = "flex";
      activeScreen.style.display = "none";

      try {
        const client = window.SupabaseSync.client;
        const { data: sessionData } = await client.auth.getSession();
        const token = sessionData?.session?.access_token;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const vocabList = this.getActiveVocabWords();
        
        const nativeLang = window.SRS ? window.SRS.getSetting("nativeLanguage", "en") : "en";
        const { data, error } = await client.functions.invoke("ai-grammar", {
          body: { action: "quiz", topic: topicParam, topicIds: checkedTopics, cefr: cefr, count: count, vocab: vocabList, nativeLanguage: nativeLang },
          headers: headers
        });

        if (error) throw new Error(error.message || error);
        if (!data?.success || !Array.isArray(data?.data?.questions)) throw new Error("Failed to receive valid questions payload.");

        let questions = data.data.questions;

        // Blacklist filter
        let blacklist = [];
        try {
          blacklist = JSON.parse(localStorage.getItem("voc_blacklisted_sentences")) || [];
        } catch (e) {}

        if (blacklist.length > 0) {
          questions = questions.filter(q => !blacklist.includes(q.sentencePattern));
        }

        if (questions.length === 0) {
          throw new Error("All generated questions were filtered out by your blacklist. Please try again.");
        }

        loadingScreen.style.display = "none";
        activeScreen.style.display = "flex";

        currentQuizQuestions = questions;
        currentQuizIndex = 0;
        currentQuizCorrectCount = 0;
        currentQuizResults = [];

        this.renderQuizQuestion();

        // Trigger prefetch for the NEXT quiz in the background
        setTimeout(() => {
          this.prefetchQuizToBuffer();
        }, 1000);

      } catch (err) {
        loadingScreen.style.display = "none";
        setupScreen.style.display = "flex";
        if (window.setPracticeFocusMode) window.setPracticeFocusMode(false);
        console.error("AI Quiz generation failed:", err);
        alert(`Failed to start quiz: ${getErrorMessage(err)}. Please try again.`);
      }
    },

    renderQuizQuestion: function () {
      const q = currentQuizQuestions[currentQuizIndex];
      const activeScreen = document.getElementById("practice-active-screen");

      // Progress indicators
      document.getElementById("quiz-index-val").innerText = currentQuizIndex + 1;
      document.getElementById("quiz-total-val").innerText = currentQuizQuestions.length;
      
      const fillPercentage = ((currentQuizIndex) / currentQuizQuestions.length) * 100;
      document.getElementById("quiz-progress-bar").style.width = `${fillPercentage}%`;

      // Prompt fields
      let topicText = "";
      const checkedCbs = document.querySelectorAll("#custom-topics-checkboxes .topic-checkbox:checked");
      if (activePresetName) {
        topicText = `Preset: ${activePresetName}`;
      } else if (checkedCbs.length === 1) {
        const id = checkedCbs[0].value;
        topicText = TOPICS_MAP[id] || id;
      } else {
        topicText = "Multiple Topics";
      }
      const badgeEl = document.getElementById("quiz-topic-badge");
      if (badgeEl) {
        badgeEl.innerText = topicText;
      }

      // Replace [blank] with a styled dashed blank space
      const sentenceHtml = escapeHTML(q.sentencePattern).replace(/\[blank\]/gi, '<span class="quiz-blank-line"></span>');
      document.getElementById("quiz-sentence-prompt").innerHTML = window.wrapCyrillicWords ? window.wrapCyrillicWords(sentenceHtml) : sentenceHtml;

      // Bind TTS button
      const ttsBtn = document.getElementById("quiz-tts-btn");
      if (ttsBtn) {
        ttsBtn.onclick = () => {
          const textToSpeak = q.sentencePattern
            .replace(/\[blank\]/gi, ", ")
            .replace(/[\u0301]/g, "")
            .replace(/\((.*?)\)/g, "$1");
          if (window.AudioEngine && typeof window.AudioEngine.speak === "function") {
            window.AudioEngine.speak(textToSpeak);
          } else if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(textToSpeak);
            utterance.lang = 'ru-RU';
            window.speechSynthesis.speak(utterance);
          }
        };
      }

      window.setRevealableText("quiz-translation-prompt", `"${q.translation}"`);

      // Render choice buttons
      const choicesContainer = document.getElementById("quiz-choices-container");
      choicesContainer.innerHTML = "";
      
      q.choices.forEach(choice => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "choice-btn";
        btn.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif";
        btn.style.fontSize = "1.15rem";
        btn.style.padding = "1rem 1.5rem";
        btn.style.background = "var(--bg-card)";
        btn.style.border = "1px solid var(--border-glass)";
        btn.style.borderRadius = "var(--border-radius-md)";
        btn.style.color = "var(--color-text-main)";
        btn.style.cursor = "pointer";
        btn.style.transition = "all 0.2s";
        btn.style.textAlign = "left";
        btn.innerText = choice;

        btn.addEventListener("click", () => this.handleQuizChoiceSelection(btn, choice));
        choicesContainer.appendChild(btn);
      });

      // Reset explanation and next button
      document.getElementById("quiz-explanation-box").style.display = "none";
      document.getElementById("quiz-next-btn").style.display = "none";
    },

    handleQuizChoiceSelection: function (selectedBtn, choice) {
      const q = currentQuizQuestions[currentQuizIndex];
      const isCorrect = choice.trim().toLowerCase() === q.answer.trim().toLowerCase();
      const fallbackTopic = currentQuizTopicIds.length === 1 ? currentQuizTopicIds[0] : null;
      const topicId = TOPICS_MAP[q.topicId] ? q.topicId : fallbackTopic;
      currentQuizResults.push({ topicId, isCorrect });
      
      // Disable further clicks on all choice buttons
      document.querySelectorAll("#quiz-choices-container .choice-btn").forEach(btn => {
        btn.disabled = true;
        btn.style.cursor = "default";
        
        // Show correct answer in green
        if (btn.innerText.trim().toLowerCase() === q.answer.trim().toLowerCase()) {
          btn.style.borderColor = "var(--color-success)";
          btn.style.backgroundColor = "var(--color-success-glow)";
        }
      });

      const emojiEl = document.getElementById("quiz-result-emoji");
      const titleEl = document.getElementById("quiz-result-title");
      const explBox = document.getElementById("quiz-explanation-box");
      const explText = document.getElementById("quiz-explanation-text");

      const animationsEnabled = window.SRS ? window.SRS.getSetting("animationsEnabled", true) : true;

      if (isCorrect) {
        currentQuizCorrectCount++;
        if (animationsEnabled) {
          selectedBtn.classList.add("correct-glow");
        }
        selectedBtn.style.borderColor = "var(--color-success)";
        selectedBtn.style.backgroundColor = "var(--color-success-glow)";
        if (window.AudioEngine) window.AudioEngine.playSuccess();
        if (animationsEnabled && window.showConfettiBurst) window.showConfettiBurst(selectedBtn);
        
        emojiEl.innerText = "✅";
        titleEl.innerText = "Correct!";
        explBox.style.borderColor = "var(--color-success)";
        explBox.style.background = "var(--color-success-glow)";
      } else {
        if (animationsEnabled) {
          selectedBtn.classList.add("incorrect-shake");
        }
        selectedBtn.style.borderColor = "var(--color-error)";
        selectedBtn.style.backgroundColor = "var(--color-error-glow)";
        if (window.AudioEngine) window.AudioEngine.playError();
        
        emojiEl.innerText = "❌";
        titleEl.innerText = "Incorrect";
        explBox.style.borderColor = "var(--color-error)";
        explBox.style.background = "var(--color-error-glow)";
      }

      // Populate description and show box
      explText.innerText = q.explanation;
      explBox.style.display = "flex";

      // Bind play full sentence button
      const playFullBtn = document.getElementById("quiz-play-full-btn");
      if (playFullBtn) {
        playFullBtn.onclick = () => {
          const fullSentenceText = q.sentencePattern
            .replace(/\[blank\]/gi, q.answer)
            .replace(/[\u0301]/g, "")
            .replace(/\((.*?)\)/g, ""); // Remove parenthetical hints
          if (window.AudioEngine && typeof window.AudioEngine.speak === "function") {
            window.AudioEngine.speak(fullSentenceText);
          } else if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(fullSentenceText);
            utterance.lang = 'ru-RU';
            window.speechSynthesis.speak(utterance);
          }
        };
      }



      // Bind Thumbs Up/Down Rating Buttons
      const rateUpBtn = document.getElementById("quiz-rate-up-btn");
      const rateDownBtn = document.getElementById("quiz-rate-down-btn");
      
      if (rateUpBtn && rateDownBtn) {
        rateUpBtn.style.backgroundColor = "var(--bg-card)";
        rateUpBtn.style.borderColor = "var(--border-glass-hover)";
        rateUpBtn.style.color = "var(--color-text-muted)";
        rateUpBtn.disabled = false;

        rateDownBtn.style.backgroundColor = "var(--bg-card)";
        rateDownBtn.style.borderColor = "var(--border-glass-hover)";
        rateDownBtn.style.color = "var(--color-text-muted)";
        rateDownBtn.disabled = false;

        rateUpBtn.onclick = () => {
          let cached = [];
          try {
            cached = JSON.parse(localStorage.getItem("voc_highly_rated_sentences")) || [];
          } catch (e) {}

          const alreadyCached = cached.some(item => item.sentencePattern === q.sentencePattern);
          if (!alreadyCached) {
            const topicVal = q.topic || (document.querySelector("#custom-topics-checkboxes .topic-checkbox:checked")?.value || "nominative_case");
            const cefrVal = q.cefr || document.getElementById("practice-quiz-level").value;
            
            const itemToCache = {
              ...q,
              topic: topicVal,
              cefr: cefrVal
            };
            cached.push(itemToCache);
            localStorage.setItem("voc_highly_rated_sentences", JSON.stringify(cached));
          }

          rateUpBtn.style.backgroundColor = "rgba(56, 176, 0, 0.15)";
          rateUpBtn.style.borderColor = "var(--color-success)";
          rateUpBtn.style.color = "var(--color-success)";
          rateDownBtn.disabled = true;
          
          this.showXpToast("Sentence Cached 👍");
        };

        rateDownBtn.onclick = () => {
          let blacklist = [];
          try {
            blacklist = JSON.parse(localStorage.getItem("voc_blacklisted_sentences")) || [];
          } catch (e) {}
          if (!blacklist.includes(q.sentencePattern)) {
            blacklist.push(q.sentencePattern);
            localStorage.setItem("voc_blacklisted_sentences", JSON.stringify(blacklist));
          }

          let cached = [];
          try {
            cached = JSON.parse(localStorage.getItem("voc_highly_rated_sentences")) || [];
          } catch (e) {}
          cached = cached.filter(item => item.sentencePattern !== q.sentencePattern);
          localStorage.setItem("voc_highly_rated_sentences", JSON.stringify(cached));

          rateDownBtn.style.backgroundColor = "rgba(220, 53, 69, 0.15)";
          rateDownBtn.style.borderColor = "var(--color-error)";
          rateDownBtn.style.color = "var(--color-error)";
          rateUpBtn.disabled = true;
          
          this.showXpToast("Sentence Blacklisted 👎");
        };
      }

      // Show Next button
      document.getElementById("quiz-next-btn").style.display = "block";
    },

    nextQuizQuestion: function () {
      currentQuizIndex++;
      if (currentQuizIndex < currentQuizQuestions.length) {
        this.renderQuizQuestion();
      } else {
        this.showQuizCompleteScreen();
      }
    },

    showQuizCompleteScreen: function () {
      document.getElementById("practice-active-screen").style.display = "none";
      document.getElementById("practice-complete-screen").style.display = "flex";

      const scoreEl = document.getElementById("quiz-complete-score");
      const xpEl = document.getElementById("quiz-complete-xp");
      const accuracyEl = document.getElementById("quiz-complete-accuracy");
      const streakEl = document.getElementById("quiz-complete-streak");

      scoreEl.innerText = `${currentQuizCorrectCount} / ${currentQuizQuestions.length}`;
      
      const xpGained = currentQuizCorrectCount * 15;
      xpEl.innerText = `+${xpGained} XP`;

      const accuracy = currentQuizQuestions.length > 0 ? Math.round((currentQuizCorrectCount / currentQuizQuestions.length) * 100) : 0;
      if (accuracyEl) accuracyEl.innerText = `${accuracy}%`;

      if (streakEl && window.SRS) {
        const stats = window.SRS.getStatsSummary();
        streakEl.innerText = `${stats.streak} days`;
      }

      // Attribute every question exactly once. Older cached questions may not have
      // topicId, so distribute those across the selected topics instead of giving
      // the full quiz score to every topic.
      const level = document.getElementById("practice-quiz-level").value;
      const fallbackTopics = currentQuizTopicIds.filter(topicId => TOPICS_MAP[topicId]);
      const resultsByTopic = new Map();
      currentQuizResults.forEach((result, index) => {
        const topicId = TOPICS_MAP[result.topicId]
          ? result.topicId
          : fallbackTopics[index % fallbackTopics.length];
        if (!topicId) return;
        if (!resultsByTopic.has(topicId)) resultsByTopic.set(topicId, []);
        resultsByTopic.get(topicId).push(result);
      });
      resultsByTopic.forEach((topicResults, topicId) => {
        this.recordQuizCompleted(topicId, level, topicResults.filter(result => result.isCorrect).length, topicResults.length);
      });

      if (xpGained > 0 && window.SRS) {
        window.SRS.addActivityXP(xpGained, "grammar_quiz", { level, topics: currentQuizTopicIds });
      }
      this.showXpToast(`+${xpGained} XP (Quiz Completed)`);
    },

    quitPracticeQuiz: async function () {
      if (await window.confirmCustom("Are you sure you want to quit this grammar quiz session? Your progress will not be saved.")) {
        this.resetPracticeArenaUI();
      }
    },

    resetPracticeArenaUI: function () {
      document.getElementById("practice-complete-screen").style.display = "none";
      document.getElementById("practice-active-screen").style.display = "none";
      document.getElementById("practice-setup-screen").style.display = "flex";
      if (window.setPracticeFocusMode) window.setPracticeFocusMode(false);
      
      currentQuizQuestions = [];
      currentQuizIndex = 0;
      currentQuizCorrectCount = 0;
      currentQuizTopicIds = [];
      currentQuizResults = [];
    },

    // --- SANDBOX ACTION ---
    analyzeSandboxWriting: async function () {
      if (!this.ensureCloudConnected()) return;

      const input = document.getElementById("sandbox-user-input").value.trim();
      if (!input) {
        alert("Please type a Russian sentence first.");
        return;
      }

      const loader = document.getElementById("sandbox-loading");
      const resultsPanel = document.getElementById("sandbox-results-panel");
      const analyzeBtn = document.getElementById("sandbox-analyze-btn");

      loader.style.display = "flex";
      resultsPanel.style.display = "none";
      analyzeBtn.disabled = true;

      try {
        const client = window.SupabaseSync.client;
        const { data: sessionData } = await client.auth.getSession();
        const token = sessionData?.session?.access_token;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        
        // Invoke Deno edge function analyze-sentence
        const nativeLang = window.SRS ? window.SRS.getSetting("nativeLanguage", "en") : "en";
        const { data, error } = await client.functions.invoke("ai-grammar", {
          body: { action: "analyze", sentence: input, nativeLanguage: nativeLang },
          headers: headers
        });

        if (error) throw new Error(error.message || error);
        if (!data || !data.success) throw new Error("Failed to receive writing feedback payload.");

        loader.style.display = "none";
        analyzeBtn.disabled = false;
        resultsPanel.style.display = "flex";

        const payload = data.data;

        // Render Corrections
        const correctionsList = document.getElementById("sandbox-corrections-list");
        correctionsList.innerHTML = "";

        if (!payload.hasErrors || payload.corrections.length === 0) {
          correctionsList.innerHTML = `
            <div style="color:var(--color-success); font-weight:600; display:flex; align-items:center; gap:0.5rem; justify-content:center; padding: 2rem 0;">
              ✨ Excellent! No spelling or grammatical mistakes found.
            </div>
          `;
        } else {
          payload.corrections.forEach(corr => {
            const card = document.createElement("div");
            card.className = "correction-card";
            
            const badgeTypeBg = corr.type === 'spelling' ? 'rgba(220, 53, 69, 0.15)' : 'rgba(255, 193, 7, 0.15)';
            const badgeTypeColor = corr.type === 'spelling' ? '#dc3545' : '#ffc107';

            const cardHtml = `
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <span class="vocab-label-badge" style="font-size:0.75rem; text-transform:uppercase; padding:0.15rem 0.5rem; background:${badgeTypeBg}; color:${badgeTypeColor}; border-color:transparent;">
                  ${escapeHTML(corr.type)}
                </span>
              </div>
              <div style="font-size:1.05rem; margin-top:0.25rem;">
                <span class="correction-original">${escapeHTML(corr.original)}</span> &rarr; <span class="correction-fixed">${escapeHTML(corr.fixed)}</span>
              </div>
              <div style="font-size:0.85rem; color:var(--color-text-muted); line-height:1.4;">${escapeHTML(corr.reason)}</div>
            `;
            card.innerHTML = window.wrapCyrillicWords ? window.wrapCyrillicWords(cardHtml) : cardHtml;
            correctionsList.appendChild(card);
          });
        }

        // Render Suggestions
        const suggestionsList = document.getElementById("sandbox-suggestions-list");
        suggestionsList.innerHTML = "";

        if (payload.suggestions && payload.suggestions.length > 0) {
          payload.suggestions.forEach(sug => {
            const card = document.createElement("div");
            card.className = "suggestion-card";
            
            const cardHtml = `
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <strong style="font-size:1.1rem; color:var(--color-primary-hover);">${escapeHTML(sug.ru)}</strong>
                <button type="button" class="audio-btn tutor-tts-btn" data-text="${escapeHTML(sug.ru.replace(/[́]/g, ''))}" style="width:28px; height:28px; font-size:0.85rem; border-color:transparent; background:var(--bg-input);">🔊</button>
              </div>
              <div class="page-subtitle" style="font-size:0.85rem; margin:0.15rem 0; color:var(--color-text-main); font-weight:500;">"${escapeHTML(sug.en)}"</div>
              <div style="font-size:0.8rem; color:var(--color-text-muted); line-height:1.4;">${escapeHTML(sug.description)}</div>
            `;
            card.innerHTML = window.wrapCyrillicWords ? window.wrapCyrillicWords(cardHtml) : cardHtml;
            suggestionsList.appendChild(card);
          });
          
          this.bindTutorTtsButtons();
        } else {
          suggestionsList.innerHTML = `<div style="text-align:center; color:var(--color-text-muted); padding:2rem 0;">No suggestions needed. Your wording sounds natural!</div>`;
        }

        // Award XP
        window.SRS.addActivityXP(10, "grammar_writing");
        this.showXpToast("+10 XP (AI Writing sandbox)");



      } catch (err) {
        loader.style.display = "none";
        analyzeBtn.disabled = false;
        console.error("AI writing analysis failed:", err);
        alert(`Analysis failed: ${getErrorMessage(err)}. Please try again.`);
      }
    },

    // UI Toast Alert Helper
    showXpToast: function (message) {
      const container = document.getElementById("demo-xp-container");
      if (!container) return;

      const toast = document.createElement("div");
      toast.className = "xp-toast";
      toast.style.background = "linear-gradient(135deg, var(--color-primary), hsl(280, 85%, 65%))";
      toast.style.color = "var(--color-text-main)";
      toast.style.padding = "0.75rem 1.25rem";
      toast.style.borderRadius = "var(--border-radius-md)";
      toast.style.boxShadow = "var(--shadow-glow)";
      toast.style.fontFamily = "var(--font-heading)";
      toast.style.fontWeight = "700";
      toast.style.fontSize = "0.95rem";
      toast.style.animation = "fadeInUp 0.3s forwards, fadeOut 0.3s 2.2s forwards";
      toast.style.display = "inline-flex";
      toast.style.alignItems = "center";
      toast.style.gap = "0.5rem";
      
      toast.textContent = `XP: ${message}`;
      
      container.appendChild(toast);
      setTimeout(() => toast.remove(), 2500);
    }
  };

  window.GrammarManager = GrammarManager;
})();
