// VocRussian AI Grammar Learning Manager

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

  // State cache
  let grammarProgress = {}; // { topic_id: { lessonsCompleted, quizzesTaken, avgScore, lastPracticed, updatedAt } }
  let currentQuizQuestions = [];
  let currentQuizIndex = 0;
  let currentQuizCorrectCount = 0;
  let activeTopic = "nominative_case";

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

  const GrammarManager = {
    init: function () {
      this.loadFromStorage();
      this.setupEventListeners();
      this.updateGrammarLevelUI();
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
      const topic = document.getElementById("practice-quiz-topic").value;
      const level = document.getElementById("practice-quiz-level").value;
      
      const key = `${topic}_${level}`;
      const gProgressMap = this.getGrammarProgressMap() || {};

      const baseProgress = gProgressMap[topic] || {};
      const lessonCompleted = (baseProgress.lessonsCompleted || 0) > 0;

      const lvlProgress = gProgressMap[key] || {};
      const quizzesTaken = lvlProgress.quizzesTaken || 0;
      const avgScore = lvlProgress.avgScore || 0;

      const masteryPct = Math.round((lessonCompleted ? 40 : 0) + (quizzesTaken > 0 ? avgScore * 0.6 : 0));

      const valEl = document.getElementById("practice-target-mastery-val");
      const fillEl = document.getElementById("practice-target-mastery-fill");
      if (valEl) valEl.innerText = `${masteryPct}%`;
      if (fillEl) fillEl.style.width = `${masteryPct}%`;
    },

    // Event listeners configuration
    setupEventListeners: function () {
      const self = this;

      // Subtab pills
      document.getElementById("grammar-tab-tutor").addEventListener("click", () => self.switchSubtab("tutor"));
      document.getElementById("grammar-tab-practice").addEventListener("click", () => self.switchSubtab("tutor")); // default or practice
      document.getElementById("grammar-tab-practice").addEventListener("click", () => self.switchSubtab("practice"));
      document.getElementById("grammar-tab-sandbox").addEventListener("click", () => self.switchSubtab("sandbox"));

      // Tutor Topic selection buttons
      document.querySelectorAll(".grammar-topic-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
          document.querySelectorAll(".grammar-topic-btn").forEach(b => b.classList.remove("active"));
          btn.classList.add("active");
          
          activeTopic = btn.getAttribute("data-topic");
          self.loadTutorLesson(activeTopic);
        });
      });



      // Practice Arena Buttons
      document.getElementById("practice-start-btn").addEventListener("click", () => self.startPracticeQuiz());
      document.getElementById("quiz-quit-btn").addEventListener("click", () => self.quitPracticeQuiz());
      document.getElementById("quiz-next-btn").addEventListener("click", () => self.nextQuizQuestion());
      document.getElementById("quiz-complete-finish-btn").addEventListener("click", () => self.resetPracticeArenaUI());

      // Target settings change
      document.getElementById("practice-quiz-topic").addEventListener("change", () => self.updateGrammarPracticeMasteryUI());
      document.getElementById("practice-quiz-level").addEventListener("change", () => self.updateGrammarPracticeMasteryUI());

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
        alert("Account Sign-in Required: AI Grammar features require a signed-in account. Please sign in or create an account under the 'Account' tab first.");
        return false;
      }
      return true;
    },

    renderTutorExplanation: function (payload) {
      const contentEl = document.getElementById("tutor-explanation-content");
      contentEl.innerHTML = `
        <div class="card" style="background: var(--bg-input); border: 1px solid var(--border-glass); border-radius: var(--border-radius-md); padding: 1.5rem; width: 100%; display: flex; flex-direction: column; gap: 1rem; box-sizing: border-box;">
          <h3 style="font-family: var(--font-heading); font-size: 1.4rem; margin: 0 0 0.5rem 0; color: var(--color-primary-hover);">${payload.title}</h3>
          <div style="line-height: 1.6; font-size: 1rem; color: var(--color-text-main);">${payload.explanation}</div>
          
          <h4 style="font-family: var(--font-heading); margin-top: 1rem; margin-bottom: 0.5rem; color: var(--color-text-main);">Declension / Conjugation Rules</h4>
          <div style="overflow-x: auto; width: 100%;">
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

          <h4 style="font-family: var(--font-heading); margin-top: 1.25rem; margin-bottom: 0.5rem; color: var(--color-text-main);">Interactive Examples</h4>
          <div style="display:flex; flex-direction:column; gap:0.75rem; width: 100%;">
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

      // Bind TTS audio play buttons
      this.bindTutorTtsButtons();
    },

    // --- AI TUTOR ACTION ---
    loadTutorLesson: async function (topicId) {
      if (!this.ensureCloudConnected()) return;

      const loader = document.getElementById("tutor-loading");
      const contentEl = document.getElementById("tutor-explanation-content");
      
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
        loader.style.display = "none";
        this.renderTutorExplanation(explanationsCache[topicId]);
        this.recordLessonCompleted(topicId);
        window.SRS.scoreCard("dummy_xp_holder", true);
        this.showXpToast("+15 XP (Grammar Study)");
        return;
      }

      try {
        const client = window.SupabaseSync.client;
        const { data: sessionData } = await client.auth.getSession();
        const token = sessionData?.session?.access_token;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        
        // Invoke explain Deno edge function
        const { data, error } = await client.functions.invoke("ai-grammar", {
          body: { action: "explain", topic: topicId },
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
    startPracticeQuiz: async function () {
      if (!this.ensureCloudConnected()) return;

      const setupScreen = document.getElementById("practice-setup-screen");
      const loadingScreen = document.getElementById("practice-loading");
      const activeScreen = document.getElementById("practice-active-screen");

      const topic = document.getElementById("practice-quiz-topic").value;
      const cefr = document.getElementById("practice-quiz-level").value;
      const count = parseInt(document.getElementById("practice-quiz-count").value, 10);

      setupScreen.style.display = "none";
      loadingScreen.style.display = "flex";
      activeScreen.style.display = "none";

      try {
        const client = window.SupabaseSync.client;
        const { data: sessionData } = await client.auth.getSession();
        const token = sessionData?.session?.access_token;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        
        // Invoke quiz Deno edge function
        const { data, error } = await client.functions.invoke("ai-grammar", {
          body: { action: "quiz", topic: topic, cefr: cefr, count: count },
          headers: headers
        });

        if (error) throw new Error(error.message || error);
        if (!data || !data.success || !data.data.questions) throw new Error("Failed to receive valid questions payload.");

        loadingScreen.style.display = "none";
        activeScreen.style.display = "flex";

        currentQuizQuestions = data.data.questions;
        currentQuizIndex = 0;
        currentQuizCorrectCount = 0;

        this.renderQuizQuestion();

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
      const topicEl = document.getElementById("practice-quiz-topic");
      const topicText = topicEl.options[topicEl.selectedIndex].text;
      document.getElementById("quiz-topic-badge").innerText = topicText;

      // Replace [blank] with a styled dashed blank space
      const sentenceHtml = q.sentencePattern.replace(/\[blank\]/gi, '<span class="quiz-blank-line"></span>');
      document.getElementById("quiz-sentence-prompt").innerHTML = sentenceHtml;

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

      if (isCorrect) {
        currentQuizCorrectCount++;
        selectedBtn.style.borderColor = "var(--color-success)";
        selectedBtn.style.backgroundColor = "var(--color-success-glow)";
        
        emojiEl.innerText = "✅";
        titleEl.innerText = "Correct!";
        explBox.style.borderColor = "var(--color-success)";
        explBox.style.background = "var(--color-success-glow)";
      } else {
        selectedBtn.style.borderColor = "var(--color-error)";
        selectedBtn.style.backgroundColor = "var(--color-error-glow)";
        
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

      scoreEl.innerText = `${currentQuizCorrectCount} / ${currentQuizQuestions.length}`;
      
      const xpGained = currentQuizCorrectCount * 15;
      xpEl.innerText = `+${xpGained} XP`;

      // Record in local cache
      const topic = document.getElementById("practice-quiz-topic").value;
      const level = document.getElementById("practice-quiz-level").value;
      this.recordQuizCompleted(topic, level, currentQuizCorrectCount, currentQuizQuestions.length);

      // Award XP
      window.SRS.scoreCard("dummy_xp_holder", true);
      this.showXpToast(`+${xpGained} XP (Quiz Completed)`);
    },

    quitPracticeQuiz: function () {
      if (confirm("Are you sure you want to quit this grammar quiz session? Your progress will not be saved.")) {
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
        const { data, error } = await client.functions.invoke("ai-grammar", {
          body: { action: "analyze", sentence: input },
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

            card.innerHTML = `
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
            
            card.innerHTML = `
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <strong style="font-size:1.1rem; color:var(--color-primary-hover);">${sug.ru}</strong>
                <button type="button" class="audio-btn tutor-tts-btn" data-text="${sug.ru.replace(/[́]/g, '')}" style="width:28px; height:28px; font-size:0.85rem; border-color:transparent; background:var(--bg-input);">🔊</button>
              </div>
              <div class="page-subtitle" style="font-size:0.85rem; margin:0.15rem 0; color:var(--color-text-main); font-weight:500;">"${sug.en}"</div>
              <div style="font-size:0.8rem; color:var(--color-text-muted); line-height:1.4;">${sug.description}</div>
            `;
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
