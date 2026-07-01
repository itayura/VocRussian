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
          <span class="translation-text" style="display: none; font-size: 1.05rem;">${text}</span>
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

  // State cache
  let grammarProgress = {}; // { topic_id: { lessonsCompleted, quizzesTaken, avgScore, lastPracticed, updatedAt } }
  let currentQuizQuestions = [];
  let currentQuizIndex = 0;
  let currentQuizCorrectCount = 0;
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
        grammarProgress = JSON.parse(localStorage.getItem(STORAGE_KEYS.GRAMMAR_PROGRESS)) || {};
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

    // Calculate Grammar level based on completions
    getGrammarLevel: function () {
      let totalLessons = 0;
      let totalQuizzes = 0;
      
      Object.values(grammarProgress).forEach(p => {
        totalLessons += p.lessonsCompleted || 0;
        totalQuizzes += p.quizzesTaken || 0;
      });

      const totalGrammarXP = (totalLessons * 15) + (totalQuizzes * 25);
      return 1 + Math.floor(totalGrammarXP / 200);
    },

    updateGrammarLevelUI: function () {
      const lvlVal = document.getElementById("grammar-level-val");
      if (lvlVal) {
        lvlVal.innerText = this.getGrammarLevel();
      }
    },

    // Sync database table voc_grammar_progress with local state
    syncWithCloud: async function () {
      if (!window.SupabaseSync || window.SupabaseSync.connectionState !== "connected" || !window.SupabaseSync.user) {
        return;
      }

      try {
        const client = window.SupabaseSync.client;
        const userId = window.SupabaseSync.user.id;

        // 1. Fetch cloud records
        const { data: dbProgress, error: fetchErr } = await client
          .from("voc_grammar_progress")
          .select("*");
        if (fetchErr) throw fetchErr;

        const dbProgMap = {};
        dbProgress.forEach(p => { dbProgMap[p.topic_id] = p; });

        const toPush = [];

        // 2. Merge local progress with cloud progress
        Object.keys(grammarProgress).forEach(topicId => {
          const dbP = dbProgMap[topicId];
          const localP = grammarProgress[topicId];

          if (dbP) {
            const dbTime = Date.parse(dbP.updated_at);
            const localTime = localP.updatedAt || 0;

            if (localTime > dbTime) {
              toPush.push(localP);
            } else if (dbTime > localTime) {
              grammarProgress[topicId] = {
                topicId: topicId,
                lessonsCompleted: dbP.lessons_completed,
                quizzesTaken: dbP.quizzes_taken,
                avgScore: dbP.avg_score,
                lastPracticed: Date.parse(dbP.last_practiced),
                updatedAt: dbTime
              };
            }
          } else {
            toPush.push(localP);
          }
        });

        // Add db records not in local cache
        dbProgress.forEach(dbP => {
          if (!grammarProgress[dbP.topic_id]) {
            grammarProgress[dbP.topic_id] = {
              topicId: dbP.topic_id,
              lessonsCompleted: dbP.lessons_completed,
              quizzesTaken: dbP.quizzes_taken,
              avgScore: dbP.avg_score,
              lastPracticed: Date.parse(dbP.last_practiced),
              updatedAt: Date.parse(dbP.updated_at)
            };
          }
        });

        // 3. Push local changes
        if (toPush.length > 0) {
          const rowsToPush = toPush.map(p => ({
            user_id: userId,
            topic_id: p.topicId,
            lessons_completed: p.lessonsCompleted || 0,
            quizzes_taken: p.quizzesTaken || 0,
            avg_score: p.avgScore || 0,
            last_practiced: new Date(p.lastPracticed || Date.now()).toISOString(),
            updated_at: new Date(p.updatedAt || Date.now()).toISOString()
          }));

          const { error: pushErr } = await client
            .from("voc_grammar_progress")
            .upsert(rowsToPush);
          if (pushErr) throw pushErr;
        }

        this.saveToStorage();
        console.log("[GrammarManager] Sync complete.");
      } catch (err) {
        console.warn("[GrammarManager] Sync failed:", err);
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
      grammarProgress[topicId].lessonsCompleted++;
      grammarProgress[topicId].lastPracticed = Date.now();
      grammarProgress[topicId].updatedAt = Date.now();
      
      this.saveToStorage();
      
      // Auto sync background change
      if (window.SupabaseSync && window.SupabaseSync.connectionState === "connected" && window.SupabaseSync.user) {
        this.syncWithCloud();
      }
    },

    // Record quiz completion
    recordQuizCompleted: function (topicId, level, correctCount, totalCount) {
      const score = Math.round((correctCount / totalCount) * 100);
      const key = `${topicId}_${level}`; // e.g. "nominative_case_A1"
      
      if (!grammarProgress[key]) {
        grammarProgress[key] = {
          topicId: key,
          lessonsCompleted: 0,
          quizzesTaken: 0,
          avgScore: 0,
          lastPracticed: Date.now(),
          updatedAt: Date.now()
        };
      }

      const p = grammarProgress[key];
      // Compute moving average score
      p.avgScore = Math.round(((p.avgScore * p.quizzesTaken) + score) / (p.quizzesTaken + 1));
      p.quizzesTaken++;
      p.lastPracticed = Date.now();
      p.updatedAt = Date.now();

      this.saveToStorage();

      // Auto sync background change
      if (window.SupabaseSync && window.SupabaseSync.connectionState === "connected" && window.SupabaseSync.user) {
        this.syncWithCloud();
      }
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
          body: { action: "quiz", topic: topicParam, cefr: cefr, count: count, vocab: vocabList, nativeLanguage: nativeLang },
          headers: headers
        });

        if (error) throw new Error(error.message || error);
        if (!data || !data.success || !data.data.questions) throw new Error("Invalid prefetch questions payload.");

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
        const key = `${t}_${level}`;
        const baseProgress = gProgressMap[t] || {};
        const lessonCompleted = (baseProgress.lessonsCompleted || 0) > 0;

        const lvlProgress = gProgressMap[key] || {};
        const quizzesTaken = lvlProgress.quizzesTaken || 0;
        const avgScore = lvlProgress.avgScore || 0;

        const topicMastery = (lessonCompleted ? 40 : 0) + (quizzesTaken > 0 ? avgScore * 0.6 : 0);
        totalMastery += topicMastery;
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
          this.recordLessonCompleted(topicId);
          window.SRS.scoreCard("dummy_xp_holder", true);
          this.showXpToast("+15 XP (Grammar Study)");
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
        this.recordLessonCompleted(topicId);
        window.SRS.scoreCard("dummy_xp_holder", true); // Trigger local streak updates + XP gain alert
        
        // Render XP Gain Toast
        this.showXpToast("+15 XP (Grammar Study)");

      } catch (err) {
        loader.style.display = "none";
        console.error("Failed to explain grammar concept:", err);
        const errContent = `<div class="card" style="background:var(--bg-input); border:1px solid var(--border-glass); border-radius:var(--border-radius-md); padding:1.5rem; color:var(--color-error); width:100%;">Error loading lesson: ${getErrorMessage(err)}. Please try again later.</div>`;
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

          setupScreen.style.display = "none";
          loadingScreen.style.display = "none";
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
          body: { action: "quiz", topic: topicParam, cefr: cefr, count: count, vocab: vocabList, nativeLanguage: nativeLang },
          headers: headers
        });

        if (error) throw new Error(error.message || error);
        if (!data || !data.success || !data.data.questions) throw new Error("Failed to receive valid questions payload.");

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

        this.renderQuizQuestion();

        // Trigger prefetch for the NEXT quiz in the background
        setTimeout(() => {
          this.prefetchQuizToBuffer();
        }, 1000);

      } catch (err) {
        loadingScreen.style.display = "none";
        setupScreen.style.display = "flex";
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
      const sentenceHtml = q.sentencePattern.replace(/\[blank\]/gi, '<span class="quiz-blank-line"></span>');
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

      // Record in local cache
      const checkedCbs = document.querySelectorAll("#custom-topics-checkboxes .topic-checkbox:checked");
      let topicKey = "";
      if (activePresetName) {
        topicKey = `subset_${activePresetName}`;
      } else if (checkedCbs.length === 1) {
        topicKey = checkedCbs[0].value;
      } else {
        topicKey = "multiple_random";
      }
      const level = document.getElementById("practice-quiz-level").value;
      this.recordQuizCompleted(topicKey, level, currentQuizCorrectCount, currentQuizQuestions.length);

      // Award XP
      window.SRS.scoreCard("dummy_xp_holder", true);
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
      
      currentQuizQuestions = [];
      currentQuizIndex = 0;
      currentQuizCorrectCount = 0;
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
                  ${corr.type}
                </span>
              </div>
              <div style="font-size:1.05rem; margin-top:0.25rem;">
                <span class="correction-original">${corr.original}</span> &rarr; <span class="correction-fixed">${corr.fixed}</span>
              </div>
              <div style="font-size:0.85rem; color:var(--color-text-muted); line-height:1.4;">${corr.reason}</div>
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
                <strong style="font-size:1.1rem; color:var(--color-primary-hover);">${sug.ru}</strong>
                <button type="button" class="audio-btn tutor-tts-btn" data-text="${sug.ru.replace(/[́]/g, '')}" style="width:28px; height:28px; font-size:0.85rem; border-color:transparent; background:var(--bg-input);">🔊</button>
              </div>
              <div class="page-subtitle" style="font-size:0.85rem; margin:0.15rem 0; color:var(--color-text-main); font-weight:500;">"${sug.en}"</div>
              <div style="font-size:0.8rem; color:var(--color-text-muted); line-height:1.4;">${sug.description}</div>
            `;
            card.innerHTML = window.wrapCyrillicWords ? window.wrapCyrillicWords(cardHtml) : cardHtml;
            suggestionsList.appendChild(card);
          });
          
          this.bindTutorTtsButtons();
        } else {
          suggestionsList.innerHTML = `<div style="text-align:center; color:var(--color-text-muted); padding:2rem 0;">No suggestions needed. Your wording sounds natural!</div>`;
        }

        // Award XP
        window.SRS.scoreCard("dummy_xp_holder", true);
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
      
      toast.innerHTML = `🏆 <span>${message}</span>`;
      
      container.appendChild(toast);
      setTimeout(() => toast.remove(), 2500);
    }
  };

  window.GrammarManager = GrammarManager;
})();
