// Privyetik Grammar Learning Manager

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

  function normalizeQuizText(value) {
    return String(value ?? "")
      .normalize("NFC")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLocaleLowerCase("ru-RU");
  }

  function isValidQuizQuestion(question, allowedTopicIds = []) {
    if (!question || typeof question !== "object") return false;
    const requiredTextFields = ["sentencePattern", "answer", "translation", "transliteration", "explanation"];
    if (requiredTextFields.some(field => typeof question[field] !== "string" || !question[field].trim())) return false;

    const blankMatches = question.sentencePattern.match(/\[blank\]/gi) || [];
    if (blankMatches.length !== 1 || !/\([^()[\]]+\)/u.test(question.sentencePattern)) return false;
    if (!Array.isArray(question.choices) || question.choices.length !== 4) return false;

    const normalizedChoices = question.choices.map(normalizeQuizText);
    const normalizedAnswer = normalizeQuizText(question.answer);
    if (normalizedChoices.some(choice => !choice) || new Set(normalizedChoices).size !== 4) return false;
    if (!/[а-яё]/iu.test(normalizedAnswer)) return false;
    if (normalizedChoices.filter(choice => choice === normalizedAnswer).length !== 1) return false;
    if (allowedTopicIds.length > 0 && !allowedTopicIds.includes(question.topicId)) return false;

    const normalizedPattern = normalizeQuizText(question.sentencePattern);
    if (/тебя\s+зовут/u.test(normalizedPattern) && /\(\s*имя\s*\)/u.test(normalizedPattern)) return false;
    return true;
  }

  function filterQuizQuestions(questions, allowedTopicIds = []) {
    return Array.isArray(questions)
      ? questions.filter(question => isValidQuizQuestion(question, allowedTopicIds))
      : [];
  }

  function buildQuizFeedback(question, selectedChoice) {
    const selected = String(selectedChoice || "").trim();
    const answer = String(question?.answer || "").trim();
    const explanation = String(question?.explanation || "").trim();
    const isCorrect = normalizeQuizText(selected) === normalizeQuizText(answer);
    if (isCorrect) {
      return {
        isCorrect: true,
        text: `You chose “${selected}”, and it fits this sentence. ${explanation}`
      };
    }
    return {
      isCorrect: false,
      text: `You chose “${selected}”. The correct answer is “${answer}”. ${explanation} In this sentence, “${selected}” does not fit the required grammatical form or meaning.`
    };
  }

  const STORAGE_KEYS = {
    GRAMMAR_PROGRESS: "voc_russian_grammar_progress",
    GRAMMAR_MISTAKES: "voc_russian_grammar_mistakes_v1",
    ACTIVE_TOPIC: "voc_russian_grammar_active_topic",
    ACTIVE_SUBTAB: "voc_russian_grammar_active_subtab"
  };

  const FALLBACK_TOPICS_MAP = {
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
    noun_plurals: "Noun Plurals",
    numerals_agreement: "Numerals & Agreement",
    prefixed_motion_verbs: "Prefixed Motion Verbs",
    imperatives: "Imperatives & Commands",
    reflexive_verbs: "Reflexive Verbs (-ся/-сь)",
    subjunctive_conditional: "Subjunctive & Conditional",
    impersonal_sentences: "Impersonal Sentences",
    comparatives_superlatives: "Comparatives & Superlatives",
    time_expressions: "Time & Expressions",
    relative_clauses_conjunctions: "Relative Clauses & Conjunctions",
    participles_gerunds: "Participles & Gerunds"
  };

  const GRAMMAR_CATALOG = window.GrammarCatalog || {
    groups: [{ id: "all", title: "Grammar", icon: "📚", description: "Grammar topics" }],
    topics: Object.entries(FALLBACK_TOPICS_MAP).map(([id, title]) => ({
      id, title, russian: "", group: "all", level: "A1–B1", summary: "Learn this Russian grammar pattern.", tip: "Use the examples to notice the pattern."
    })),
    getTopic(topicId) {
      return this.topics.find(topic => topic.id === topicId) || this.topics[0];
    },
    getGroup() { return this.groups[0]; },
    getTopicsForGroup() { return this.topics; },
    getPrimaryLevel(level) {
      const match = String(level || "").match(/A1|A2|B1|B2|C1|C2/);
      return match ? match[0] : "A1";
    },
    getPreviousTopic(topicId) {
      const index = Math.max(0, this.topics.findIndex(topic => topic.id === topicId));
      return this.topics[Math.max(0, index - 1)];
    },
    getNextTopic(topicId) {
      const index = Math.max(0, this.topics.findIndex(topic => topic.id === topicId));
      return this.topics[Math.min(this.topics.length - 1, index + 1)];
    }
  };
  const TOPICS_MAP = Object.fromEntries(GRAMMAR_CATALOG.topics.map(topic => [topic.id, topic.title]));


  const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
  const CEFR_TOPIC_WEIGHTS = { A1: 0.35, A2: 0.5, B1: 0.65, B2: 0.78, C1: 0.9, C2: 1 };
  const GRAMMAR_LEVEL_MIN_TOPICS = 7;
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
  let currentSubtab = "home";
  let activeTopicGroupFilter = "all";
  let activePresetName = null;
  let grammarMistakes = [];
  let sandboxUndoTimer = null;

  // Matrix Drills State (Strategy C)
  let endingDrillStreak = 0;
  let currentEndingDrill = null;
  let detectiveDrillStreak = 0;
  let currentDetectiveDrill = null;
  let aspectMatchedCount = 0;
  let selectedAspectLeft = null;
  let currentAspectRound = null;
  let currentPracticeMode = "quiz"; // "quiz" | "ending" | "detective" | "aspect"

  // Aspects Hub State (5 Dedicated Modes)
  let currentAspectHubMode = "matcher"; // "matcher" | "trigger" | "nuance" | "transform" | "explorer"
  let aspectHubMatchedCount = 0;
  let aspectHubSelectedLeft = null;
  let aspectHubCurrentRound = null;
  let aspectHubMatcherStreak = 0;
  let aspectTriggerStreak = 0;
  let currentAspectTriggerDrill = null;
  let currentAspectNuanceDrill = null;
  let aspectTransformStreak = 0;
  let currentAspectTransformDrill = null;
  let isAspectHubBound = false;

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
    isValidQuizQuestion,
    filterQuizQuestions,
    buildQuizFeedback,
    isPrefetching: false,
    debouncePrefetchTimeout: null,

    init: function () {
      this.loadFromStorage();
      this.renderCatalogNavigation();
      this.setupEventListeners();
      this.initCollapsibleSidebar();
      this.initCustomTopicsPanel();
      this.initEngineSelector();
      this.initPracticeModeSelector();
      this.updateGrammarLevelUI();
      this.switchSubtab("home", { remember: false, focus: false });
      this.refreshGrammarWorkspace();
      // Trigger background prefetch on initialize if user is already logged in
      setTimeout(() => {
        this.prefetchQuizToBuffer();
      }, 1500);
    },

    trackGrammarEvent: function (eventName, properties = {}) {
      if (typeof window.gtag !== "function") return;
      const allowed = {
        grammar_section: properties.grammar_section,
        topic_id: TOPICS_MAP[properties.topic_id] ? properties.topic_id : undefined,
        cefr: CEFR_LEVELS.includes(properties.cefr) ? properties.cefr : undefined,
        question_count: Number.isFinite(properties.question_count) ? properties.question_count : undefined,
        source: ["offline", "ai"].includes(properties.source) ? properties.source : undefined
      };
      Object.keys(allowed).forEach(key => allowed[key] === undefined && delete allowed[key]);
      window.gtag("event", eventName, allowed);
    },

    getTopicProgressSummary: function (topicId) {
      const lessonRecord = grammarProgress[topicId] || {};
      const evidence = CEFR_LEVELS.map(level => this.getTopicEvidence(topicId, level));
      const attempts = evidence.reduce((sum, result) => sum + result.attempts, 0);
      const mastery = Math.round(this.getTopicMastery(topicId));
      const lastPracticed = Math.max(
        Number(lessonRecord.lastPracticed || 0),
        ...CEFR_LEVELS.map(level => Number(grammarProgress[`${topicId}_${level}`]?.lastPracticed || 0))
      );
      const lessonStarted = Number(lessonRecord.lessonsCompleted || 0) > 0;
      const status = mastery >= 70 ? "Mastered" : (lessonStarted || attempts > 0 ? "In progress" : "New");
      return { lessonStarted, attempts, mastery, lastPracticed, status };
    },

    getRecommendedTopicId: function () {
      const inProgress = GRAMMAR_CATALOG.topics
        .map(topic => ({ topic, progress: this.getTopicProgressSummary(topic.id) }))
        .filter(item => item.progress.status === "In progress")
        .sort((a, b) => b.progress.lastPracticed - a.progress.lastPracticed);
      if (inProgress.length > 0) return inProgress[0].topic.id;
      const nextNew = GRAMMAR_CATALOG.topics.find(topic => this.getTopicProgressSummary(topic.id).mastery < 70);
      return nextNew?.id || GRAMMAR_CATALOG.topics[0].id;
    },

    getUnresolvedMistakes: function () {
      return grammarMistakes.filter(mistake => !mistake.recovered);
    },

    getMistakeKey: function (question) {
      return `${question?.topicId || "unknown"}:${normalizeQuizText(question?.sentencePattern || question?.id || "")}`;
    },

    recordGrammarMistake: function (question, level) {
      const key = this.getMistakeKey(question);
      const existing = grammarMistakes.find(mistake => mistake.key === key);
      if (existing) {
        existing.wrongCount = Number(existing.wrongCount || 0) + 1;
        existing.lastWrongAt = Date.now();
        existing.recovered = false;
      } else {
        grammarMistakes.unshift({
          key,
          topicId: TOPICS_MAP[question?.topicId] ? question.topicId : activeTopic,
          level: CEFR_LEVELS.includes(level) ? level : GRAMMAR_CATALOG.getPrimaryLevel(GRAMMAR_CATALOG.getTopic(activeTopic).level),
          wrongCount: 1,
          lastWrongAt: Date.now(),
          recovered: false
        });
      }
      grammarMistakes = grammarMistakes.slice(0, 100);
      localStorage.setItem(STORAGE_KEYS.GRAMMAR_MISTAKES, JSON.stringify(grammarMistakes));
      this.refreshGrammarWorkspace();
    },

    resolveGrammarMistake: function (question) {
      const key = this.getMistakeKey(question);
      const existing = grammarMistakes.find(mistake => mistake.key === key && !mistake.recovered);
      if (!existing) return;
      existing.recovered = true;
      existing.recoveredAt = Date.now();
      localStorage.setItem(STORAGE_KEYS.GRAMMAR_MISTAKES, JSON.stringify(grammarMistakes));
      this.refreshGrammarWorkspace();
    },

    getWeakTopicIds: function () {
      const mistakeTopics = [...new Set(this.getUnresolvedMistakes().map(mistake => mistake.topicId).filter(topicId => TOPICS_MAP[topicId]))];
      if (mistakeTopics.length > 0) return mistakeTopics;
      return GRAMMAR_CATALOG.topics
        .map(topic => ({ id: topic.id, progress: this.getTopicProgressSummary(topic.id) }))
        .filter(item => item.progress.attempts > 0 && item.progress.mastery < 70)
        .sort((a, b) => a.progress.mastery - b.progress.mastery)
        .slice(0, 4)
        .map(item => item.id);
    },

    renderCatalogNavigation: function () {
      const topicList = document.querySelector(".grammar-topic-list");
      const mobileSelect = document.getElementById("tutor-topic-select-mobile");
      const filterContainer = document.getElementById("grammar-topic-group-filters");
      if (!topicList || !mobileSelect || !filterContainer) return;

      topicList.innerHTML = "";
      mobileSelect.innerHTML = "";
      filterContainer.innerHTML = "";

      const allFilter = document.createElement("button");
      allFilter.type = "button";
      allFilter.className = "grammar-topic-filter active";
      allFilter.dataset.group = "all";
      allFilter.textContent = "All";
      allFilter.setAttribute("aria-pressed", "true");
      filterContainer.appendChild(allFilter);

      GRAMMAR_CATALOG.groups.forEach(group => {
        const filter = document.createElement("button");
        filter.type = "button";
        filter.className = "grammar-topic-filter";
        filter.dataset.group = group.id;
        filter.textContent = `${group.icon} ${group.title}`;
        filter.setAttribute("aria-pressed", "false");
        filterContainer.appendChild(filter);

        const optionGroup = document.createElement("optgroup");
        optionGroup.label = group.title;

        const section = document.createElement("section");
        section.className = "grammar-topic-group";
        section.dataset.group = group.id;
        const heading = document.createElement("h4");
        heading.textContent = `${group.icon} ${group.title}`;
        section.appendChild(heading);

        GRAMMAR_CATALOG.getTopicsForGroup(group.id).forEach(topic => {
          const progress = this.getTopicProgressSummary(topic.id);
          const button = document.createElement("button");
          button.type = "button";
          button.className = "grammar-topic-btn";
          button.dataset.topic = topic.id;
          button.dataset.searchText = `${topic.title} ${topic.russian} ${group.title}`.toLocaleLowerCase();
          button.innerHTML = `
            <span class="grammar-topic-btn-copy">
              <strong>${escapeHTML(topic.title)}</strong>
              <small>${escapeHTML(topic.russian)}</small>
            </span>
            <span class="grammar-topic-btn-state">
              <span class="grammar-level-chip">${escapeHTML(topic.level)}</span>
              <span class="grammar-status-dot grammar-status-${progress.status.toLowerCase().replace(/\s+/g, "-")}" aria-label="${progress.status}"></span>
            </span>`;
          section.appendChild(button);

          const option = document.createElement("option");
          option.value = topic.id;
          option.textContent = `${topic.title} (${topic.russian}) · ${topic.level}`;
          optionGroup.appendChild(option);
        });
        topicList.appendChild(section);
        mobileSelect.appendChild(optionGroup);
      });

      const empty = document.createElement("p");
      empty.id = "grammar-topic-search-empty";
      empty.className = "grammar-topic-search-empty";
      empty.textContent = "No grammar topics match that search.";
      empty.hidden = true;
      topicList.appendChild(empty);
      this.updateTopicNavigationState();
    },

    updateTopicNavigationState: function () {
      document.querySelectorAll(".grammar-topic-btn").forEach(button => {
        const isActive = button.dataset.topic === activeTopic;
        button.classList.toggle("active", isActive);
        if (isActive) button.setAttribute("aria-current", "page");
        else button.removeAttribute("aria-current");
        const progress = this.getTopicProgressSummary(button.dataset.topic);
        const dot = button.querySelector(".grammar-status-dot");
        if (dot) {
          dot.className = `grammar-status-dot grammar-status-${progress.status.toLowerCase().replace(/\s+/g, "-")}`;
          dot.setAttribute("aria-label", progress.status);
        }
      });
      const mobileSelect = document.getElementById("tutor-topic-select-mobile");
      if (mobileSelect && TOPICS_MAP[activeTopic]) mobileSelect.value = activeTopic;
    },

    filterTopicNavigation: function () {
      const search = normalizeQuizText(document.getElementById("grammar-topic-search-input")?.value || "");
      let visibleCount = 0;
      document.querySelectorAll(".grammar-topic-group").forEach(section => {
        const groupMatches = activeTopicGroupFilter === "all" || section.dataset.group === activeTopicGroupFilter;
        let groupVisibleCount = 0;
        section.querySelectorAll(".grammar-topic-btn").forEach(button => {
          const searchMatches = !search || normalizeQuizText(button.dataset.searchText).includes(search);
          const visible = groupMatches && searchMatches;
          button.hidden = !visible;
          if (visible) groupVisibleCount += 1;
        });
        section.hidden = groupVisibleCount === 0;
        visibleCount += groupVisibleCount;
      });
      const empty = document.getElementById("grammar-topic-search-empty");
      if (empty) empty.hidden = visibleCount > 0;
    },

    selectTopic: function (topicId, options = {}) {
      if (!TOPICS_MAP[topicId]) return;
      activeTopic = topicId;
      localStorage.setItem(STORAGE_KEYS.ACTIVE_TOPIC, topicId);
      this.updateTopicNavigationState();
      this.updateQuickPracticeUI();
      this.renderOverview();
      if (options.switchToLearn !== false) this.switchSubtab("tutor");
      if (options.load !== false) this.loadTutorLesson(topicId);
    },

    openTopicGroup: function (groupId) {
      if (!GRAMMAR_CATALOG.groups.some(group => group.id === groupId)) return;
      activeTopicGroupFilter = groupId;
      document.querySelectorAll(".grammar-topic-filter").forEach(button => {
        const active = button.dataset.group === groupId;
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", String(active));
      });
      this.filterTopicNavigation();
      const first = GRAMMAR_CATALOG.getTopicsForGroup(groupId)[0];
      const topic = GRAMMAR_CATALOG.getTopic(activeTopic).group === groupId ? activeTopic : first?.id;
      if (topic) this.selectTopic(topic);
    },

    renderOverview: function () {
      const topic = GRAMMAR_CATALOG.getTopic(activeTopic || this.getRecommendedTopicId());
      const progress = this.getTopicProgressSummary(topic.id);
      const group = GRAMMAR_CATALOG.getGroup(topic.group);
      const title = document.getElementById("grammar-continue-title");
      const summary = document.getElementById("grammar-continue-summary");
      const meta = document.getElementById("grammar-continue-meta");
      if (title) title.textContent = `${progress.status === "New" ? "Start" : "Continue"}: ${topic.title}`;
      if (summary) summary.textContent = topic.summary;
      if (meta) meta.innerHTML = `<span class="grammar-level-chip">${escapeHTML(topic.level)}</span><span>${escapeHTML(group.title)}</span><span>${escapeHTML(progress.status)}${progress.mastery ? ` · ${progress.mastery}% mastery` : ""}</span>`;

      const started = GRAMMAR_CATALOG.topics.filter(item => this.getTopicProgressSummary(item.id).lessonStarted).length;
      const practiced = GRAMMAR_CATALOG.topics.filter(item => this.getTopicProgressSummary(item.id).attempts > 0).length;
      const mistakes = this.getUnresolvedMistakes().length;
      const startedEl = document.getElementById("grammar-lessons-started-val");
      const practicedEl = document.getElementById("grammar-topics-practiced-val");
      const mistakesEl = document.getElementById("grammar-mistakes-count-val");
      if (startedEl) startedEl.textContent = String(started);
      if (practicedEl) practicedEl.textContent = String(practiced);
      if (mistakesEl) mistakesEl.textContent = String(mistakes);

      const pathGrid = document.getElementById("grammar-path-grid");
      if (pathGrid) {
        pathGrid.innerHTML = GRAMMAR_CATALOG.groups.map(path => {
          const topics = GRAMMAR_CATALOG.getTopicsForGroup(path.id);
          const complete = topics.filter(item => this.getTopicProgressSummary(item.id).mastery >= 70).length;
          const percent = topics.length ? Math.round((complete / topics.length) * 100) : 0;
          return `<button type="button" class="grammar-path-card card" data-group="${escapeHTML(path.id)}">
            <span class="grammar-path-icon">${path.icon}</span>
            <span class="grammar-path-copy"><strong>${escapeHTML(path.title)}</strong><small>${escapeHTML(path.description)}</small></span>
            <span class="grammar-path-progress"><span>${complete}/${topics.length}</span><span class="grammar-path-track"><span style="width:${percent}%"></span></span></span>
          </button>`;
        }).join("");
      }
      this.updateQuickPracticeUI();
    },

    updateQuickPracticeUI: function () {
      const topic = GRAMMAR_CATALOG.getTopic(activeTopic || this.getRecommendedTopicId());
      const quickTitle = document.getElementById("practice-quick-title");
      const quickSummary = document.getElementById("practice-quick-summary");
      const mistakesCount = document.getElementById("practice-mistakes-count");
      const reviewButton = document.getElementById("practice-review-mistakes-btn");
      if (quickTitle) quickTitle.textContent = `Quick practice: ${topic.title}`;
      if (quickSummary) quickSummary.textContent = `Five ${topic.level} questions focused on ${topic.summary.toLowerCase()}`;
      const unresolvedCount = this.getUnresolvedMistakes().length;
      if (mistakesCount) mistakesCount.textContent = String(unresolvedCount);
      if (reviewButton) {
        reviewButton.disabled = this.getWeakTopicIds().length === 0;
        reviewButton.textContent = unresolvedCount > 0 ? "Review weak topics" : "No weak topics yet";
      }
      const engineMode = localStorage.getItem("voc_grammar_engine_mode") || "offline";
      const note = document.getElementById("practice-engine-note");
      if (note) note.textContent = engineMode === "offline"
        ? "Reviewed questions work instantly and offline."
        : "AI-enhanced questions require a signed-in account and connection.";
    },

    selectPracticeTopics: function (topicIds, level, count = 5) {
      const allowed = topicIds.filter(topicId => TOPICS_MAP[topicId]);
      document.querySelectorAll("#custom-topics-checkboxes .topic-checkbox").forEach(checkbox => {
        checkbox.checked = allowed.includes(checkbox.value);
      });
      const levelSelect = document.getElementById("practice-quiz-level");
      const countSelect = document.getElementById("practice-quiz-count");
      if (levelSelect && CEFR_LEVELS.includes(level)) levelSelect.value = level;
      if (countSelect) countSelect.value = String(count);
      activePresetName = null;
      this.updateGrammarPracticeMasteryUI();
    },

    startQuickPractice: function (topicId = activeTopic) {
      const topic = GRAMMAR_CATALOG.getTopic(topicId);
      const level = GRAMMAR_CATALOG.getPrimaryLevel(topic.level);
      this.selectPracticeTopics([topic.id], level, 5);
      this.switchSubtab("practice");
      this.trackGrammarEvent("grammar_quick_practice_start", { topic_id: topic.id, cefr: level, question_count: 5, source: localStorage.getItem("voc_grammar_engine_mode") || "offline" });
      this.startPracticeQuiz({ topicIds: [topic.id], level, count: 5 });
    },

    startMistakeReview: function () {
      const topicIds = this.getWeakTopicIds();
      if (topicIds.length === 0) return;
      const level = this.getUnresolvedMistakes().find(mistake => CEFR_LEVELS.includes(mistake.level))?.level
        || GRAMMAR_CATALOG.getPrimaryLevel(GRAMMAR_CATALOG.getTopic(topicIds[0]).level);
      this.selectPracticeTopics(topicIds, level, 5);
      this.switchSubtab("practice");
      this.trackGrammarEvent("grammar_mistakes_review_start", { topic_id: topicIds[0], cefr: level, question_count: 5 });
      this.startPracticeQuiz({ topicIds, level, count: 5 });
    },

    refreshGrammarWorkspace: function () {
      this.renderOverview();
      this.updateTopicNavigationState();
      this.updateQuickPracticeUI();
    },

    initEngineSelector: function () {
      const container = document.getElementById("grammar-engine-selector-container");
      const select = document.getElementById("grammar-engine-mode-select");
      if (!container || !select) return;

      const isFeatureEnabled = window.isOfflineGrammarFeatureEnabled && window.isOfflineGrammarFeatureEnabled();
      if (isFeatureEnabled) {
        container.style.display = "flex";
        select.value = localStorage.getItem("voc_grammar_engine_mode") || "offline";
        if (select.dataset.grammarEngineBound !== "true") {
          select.dataset.grammarEngineBound = "true";
          select.addEventListener("change", () => {
            localStorage.setItem("voc_grammar_engine_mode", select.value);
            this.updateQuickPracticeUI();
            this.showXpToast(select.value === "offline" ? "Using reviewed offline lessons" : "Using AI-enhanced lessons");
            if (currentSubtab === "tutor") this.loadTutorLesson(activeTopic);
          });
        }
      } else {
        container.style.display = "none";
      }
    },

    initPracticeModeSelector: function () {
      const container = document.getElementById("practice-mode-selector-container");
      if (!container) return;

      const isFeatureEnabled = window.isOfflineGrammarFeatureEnabled && window.isOfflineGrammarFeatureEnabled();
      if (!isFeatureEnabled) {
        container.style.display = "none";
        if (currentPracticeMode !== "quiz") this.switchPracticeMode("quiz");
        return;
      }
      container.style.display = "block";

      const tabs = [
        { id: "practice-mode-tab-quiz", mode: "quiz" },
        { id: "practice-mode-tab-ending", mode: "ending" },
        { id: "practice-mode-tab-detective", mode: "detective" },
        { id: "practice-mode-tab-aspect", mode: "aspect" }
      ];

      tabs.forEach(tab => {
        const btn = document.getElementById(tab.id);
        if (btn && btn.dataset.grammarPracticeModeBound !== "true") {
          btn.dataset.grammarPracticeModeBound = "true";
          btn.addEventListener("click", () => {
            tabs.forEach(t => {
              const b = document.getElementById(t.id);
              if (b) {
                b.classList.remove("active");
                b.style.background = "transparent";
                b.style.borderColor = "transparent";
                b.style.color = "var(--color-text-muted)";
              }
            });
            btn.classList.add("active");
            btn.style.background = "var(--bg-input)";
            btn.style.borderColor = "var(--border-glass)";
            btn.style.color = "var(--color-text-main)";
            this.switchPracticeMode(tab.mode);
          });
        }
      });

      // Wire Matrix Drill buttons
      const endingNextBtn = document.getElementById("ending-drill-next-btn");
      if (endingNextBtn && endingNextBtn.dataset.grammarDrillBound !== "true") {
        endingNextBtn.dataset.grammarDrillBound = "true";
        endingNextBtn.addEventListener("click", () => this.nextEndingDrill());
      }
      const endingQuitBtn = document.getElementById("ending-drill-quit-btn");
      if (endingQuitBtn && endingQuitBtn.dataset.grammarDrillBound !== "true") {
        endingQuitBtn.dataset.grammarDrillBound = "true";
        endingQuitBtn.addEventListener("click", () => this.switchPracticeMode("quiz"));
      }

      const detectiveNextBtn = document.getElementById("detective-next-btn");
      if (detectiveNextBtn && detectiveNextBtn.dataset.grammarDrillBound !== "true") {
        detectiveNextBtn.dataset.grammarDrillBound = "true";
        detectiveNextBtn.addEventListener("click", () => this.nextDetectiveDrill());
      }
      const detectiveQuitBtn = document.getElementById("detective-drill-quit-btn");
      if (detectiveQuitBtn && detectiveQuitBtn.dataset.grammarDrillBound !== "true") {
        detectiveQuitBtn.dataset.grammarDrillBound = "true";
        detectiveQuitBtn.addEventListener("click", () => this.switchPracticeMode("quiz"));
      }

      const aspectPlayAgainBtn = document.getElementById("aspect-play-again-btn");
      if (aspectPlayAgainBtn && aspectPlayAgainBtn.dataset.grammarDrillBound !== "true") {
        aspectPlayAgainBtn.dataset.grammarDrillBound = "true";
        aspectPlayAgainBtn.addEventListener("click", () => this.startAspectMatcherDrill());
      }
      const aspectQuitBtn = document.getElementById("aspect-quit-btn");
      if (aspectQuitBtn && aspectQuitBtn.dataset.grammarDrillBound !== "true") {
        aspectQuitBtn.dataset.grammarDrillBound = "true";
        aspectQuitBtn.addEventListener("click", () => this.switchPracticeMode("quiz"));
      }
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
      try {
        const storedMistakes = JSON.parse(localStorage.getItem(STORAGE_KEYS.GRAMMAR_MISTAKES)) || [];
        grammarMistakes = Array.isArray(storedMistakes) ? storedMistakes.slice(0, 100) : [];
      } catch (e) {
        grammarMistakes = [];
      }
      const storedTopic = localStorage.getItem(STORAGE_KEYS.ACTIVE_TOPIC);
      activeTopic = TOPICS_MAP[storedTopic] ? storedTopic : this.getRecommendedTopicId();
    },

    saveToStorage: function () {
      localStorage.setItem(STORAGE_KEYS.GRAMMAR_PROGRESS, JSON.stringify(grammarProgress));
      this.updateGrammarLevelUI();
      this.refreshGrammarWorkspace();
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
      GRAMMAR_CATALOG.groups.forEach(group => {
        const fieldset = document.createElement("fieldset");
        fieldset.className = "grammar-topic-checkbox-group";
        const legend = document.createElement("legend");
        legend.textContent = `${group.icon} ${group.title}`;
        fieldset.appendChild(legend);

        const options = document.createElement("div");
        options.className = "grammar-topic-checkbox-options";
        GRAMMAR_CATALOG.getTopicsForGroup(group.id).forEach(topic => {
          const label = document.createElement("label");
          label.className = "grammar-topic-checkbox-label";

          const input = document.createElement("input");
          input.type = "checkbox";
          input.value = topic.id;
          input.className = "topic-checkbox";
          input.addEventListener("change", () => {
            activePresetName = null;
            this.updatePresetPillsHighlight();
            this.updateGrammarPracticeMasteryUI();
            this.debouncePrefetch();
          });

          const copy = document.createElement("span");
          copy.innerHTML = `<strong>${escapeHTML(topic.title)}</strong><small>${escapeHTML(topic.level)}</small>`;
          label.appendChild(input);
          label.appendChild(copy);
          options.appendChild(label);
        });
        fieldset.appendChild(options);
        container.appendChild(fieldset);
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
            filterQuizQuestions(currentBuffer.questions, checkedTopics).length > 0) {
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

        let questions = filterQuizQuestions(data.data.questions, checkedTopics);

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

    // Primary workspace navigation. Aspect training is launched contextually.
    switchSubtab: function (tabId, options = {}) {
      if (!["home", "tutor", "practice", "aspects", "sandbox"].includes(tabId)) return;
      ["home", "tutor", "practice", "aspects", "sandbox"].forEach(id => {
        const tabEl = document.getElementById(`grammar-tab-${id}`);
        if (tabEl) {
          tabEl.classList.remove("active");
          if (!tabEl.hidden) {
            tabEl.setAttribute("aria-selected", "false");
            tabEl.tabIndex = -1;
          }
        }
        const panelEl = document.getElementById(`grammar-subview-${id}`);
        if (panelEl) {
          panelEl.hidden = true;
          panelEl.style.display = "none";
        }
      });

      const activeTabEl = document.getElementById(`grammar-tab-${tabId}`);
      if (activeTabEl && !activeTabEl.hidden) {
        activeTabEl.classList.add("active");
        activeTabEl.setAttribute("aria-selected", "true");
        activeTabEl.tabIndex = 0;
        if (options.focus) activeTabEl.focus();
      }
      const activePanelEl = document.getElementById(`grammar-subview-${tabId}`);
      if (activePanelEl) {
        activePanelEl.hidden = false;
        activePanelEl.style.display = "flex";
      }

      currentSubtab = tabId;
      if (options.remember !== false && tabId !== "aspects") {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_SUBTAB, tabId);
      }
      this.trackGrammarEvent("grammar_section_view", { grammar_section: tabId });

      if (tabId === "home") {
        this.renderOverview();
      } else if (tabId === "tutor") {
        this.updateTopicNavigationState();
        const content = document.getElementById("tutor-explanation-content");
        if (content?.dataset.topicId !== activeTopic) this.loadTutorLesson(activeTopic);
      } else if (tabId === "practice") {
        this.updateGrammarPracticeMasteryUI();
        this.updateQuickPracticeUI();
      } else if (tabId === "aspects") {
        this.initAspectsHub();
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

      const quizAudioBtn = document.getElementById("quiz-tts-btn");
      const quizTranslation = document.getElementById("quiz-translation-prompt");
      if (quizAudioBtn && quizTranslation && !quizAudioBtn.closest(".practice-audio-controls")) {
        const controls = document.createElement("div");
        controls.className = "practice-audio-controls";
        controls.setAttribute("aria-label", "Practice pronunciation controls");
        quizTranslation.insertAdjacentElement("afterend", controls);
        controls.appendChild(quizAudioBtn);
      }

      // Primary grammar navigation
      const primaryTabIds = ["home", "tutor", "practice", "sandbox"];
      primaryTabIds.forEach(tabId => {
        document.getElementById(`grammar-tab-${tabId}`)?.addEventListener("click", () => self.switchSubtab(tabId));
      });
      document.querySelector(".grammar-primary-nav")?.addEventListener("keydown", event => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        const currentIndex = primaryTabIds.indexOf(currentSubtab);
        let nextIndex = currentIndex < 0 ? 0 : currentIndex;
        if (event.key === "ArrowRight") nextIndex = (nextIndex + 1) % primaryTabIds.length;
        if (event.key === "ArrowLeft") nextIndex = (nextIndex - 1 + primaryTabIds.length) % primaryTabIds.length;
        if (event.key === "Home") nextIndex = 0;
        if (event.key === "End") nextIndex = primaryTabIds.length - 1;
        event.preventDefault();
        self.switchSubtab(primaryTabIds[nextIndex], { focus: true });
      });

      document.getElementById("grammar-continue-btn")?.addEventListener("click", () => self.selectTopic(activeTopic));
      document.getElementById("grammar-quick-practice-btn")?.addEventListener("click", () => self.startQuickPractice(activeTopic));
      document.getElementById("grammar-browse-all-btn")?.addEventListener("click", () => {
        activeTopicGroupFilter = "all";
        document.querySelectorAll(".grammar-topic-filter").forEach(button => {
          const active = button.dataset.group === "all";
          button.classList.toggle("active", active);
          button.setAttribute("aria-pressed", String(active));
        });
        self.filterTopicNavigation();
        self.switchSubtab("tutor");
      });
      document.getElementById("grammar-open-aspects-btn")?.addEventListener("click", () => self.switchSubtab("aspects"));
      document.getElementById("aspect-back-to-lesson-btn")?.addEventListener("click", () => self.selectTopic("verb_aspects"));
      document.getElementById("grammar-open-writing-btn")?.addEventListener("click", () => self.switchSubtab("sandbox"));
      document.getElementById("grammar-path-grid")?.addEventListener("click", event => {
        const card = event.target.closest("[data-group]");
        if (card) self.openTopicGroup(card.dataset.group);
      });

      // Catalog-driven topic navigation
      document.querySelectorAll(".grammar-topic-btn").forEach(btn => {
        btn.addEventListener("click", () => self.selectTopic(btn.dataset.topic, { switchToLearn: false }));
      });
      document.querySelectorAll(".grammar-topic-filter").forEach(button => {
        button.addEventListener("click", () => {
          activeTopicGroupFilter = button.dataset.group;
          document.querySelectorAll(".grammar-topic-filter").forEach(filter => {
            const active = filter === button;
            filter.classList.toggle("active", active);
            filter.setAttribute("aria-pressed", String(active));
          });
          self.filterTopicNavigation();
        });
      });
      document.getElementById("grammar-topic-search-input")?.addEventListener("input", () => self.filterTopicNavigation());

      const mobileSelect = document.getElementById("tutor-topic-select-mobile");
      if (mobileSelect) {
        mobileSelect.addEventListener("change", (e) => {
          self.selectTopic(e.target.value, { switchToLearn: false });
        });
      }

      document.getElementById("tutor-explanation-content")?.addEventListener("click", event => {
        const action = event.target.closest("[data-grammar-action]")?.dataset.grammarAction;
        if (!action) return;
        if (action === "practice-topic") self.startQuickPractice(activeTopic);
        if (action === "previous-topic") self.selectTopic(GRAMMAR_CATALOG.getPreviousTopic(activeTopic).id, { switchToLearn: false });
        if (action === "next-topic") self.selectTopic(GRAMMAR_CATALOG.getNextTopic(activeTopic).id, { switchToLearn: false });
        if (action === "aspect-training") self.switchSubtab("aspects");
      });

      // Practice actions
      document.getElementById("practice-quick-start-btn")?.addEventListener("click", () => self.startQuickPractice(activeTopic));
      document.getElementById("practice-review-mistakes-btn")?.addEventListener("click", () => self.startMistakeReview());
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
      document.getElementById("quiz-complete-learn-btn")?.addEventListener("click", () => {
        self.resetPracticeArenaUI();
        const nextTopic = self.getTopicProgressSummary(activeTopic).mastery >= 70
          ? GRAMMAR_CATALOG.getNextTopic(activeTopic).id
          : activeTopic;
        self.selectTopic(nextTopic);
      });

      // Target settings change
      document.getElementById("practice-quiz-level").addEventListener("change", () => {
        self.updateGrammarPracticeMasteryUI();
        self.prefetchQuizToBuffer();
      });

      // Sandbox Buttons
      document.getElementById("sandbox-analyze-btn").addEventListener("click", () => self.analyzeSandboxWriting());
      document.getElementById("sandbox-clear-btn").addEventListener("click", () => {
        const input = document.getElementById("sandbox-user-input");
        const undoButton = document.getElementById("sandbox-undo-btn");
        if (!input || !input.value) return;
        undoButton.dataset.previousText = input.value;
        input.value = "";
        document.getElementById("sandbox-results-panel").style.display = "none";
        undoButton.hidden = false;
        clearTimeout(sandboxUndoTimer);
        sandboxUndoTimer = setTimeout(() => {
          undoButton.hidden = true;
          undoButton.dataset.previousText = "";
        }, 8000);
      });
      document.getElementById("sandbox-undo-btn")?.addEventListener("click", event => {
        const input = document.getElementById("sandbox-user-input");
        input.value = event.currentTarget.dataset.previousText || "";
        event.currentTarget.hidden = true;
        input.focus();
      });

    },

    // Check Cloud Database Connected
    ensureCloudConnected: function () {
      if (!window.SupabaseSync || !window.SupabaseSync.client || !window.SupabaseSync.user) {
        if (window.openModal) {
          window.openModal("modal-grammar-cta");
        } else {
          alert("Account Sign-in Required: Cloud grammar features require a signed-in account. Please sign in or create an account under the 'Account' tab first.");
        }
        return false;
      }
      return true;
    },

    renderTutorExplanation: function (payload) {
      payload = {
        title: escapeHTML(payload?.title),
        explanation: sanitizeRichHTML(payload?.explanation || payload?.description),
        rules: Array.isArray(payload?.rules) ? payload.rules.map(rule => ({ ending: escapeHTML(rule.ending), rule: escapeHTML(rule.rule), example: escapeHTML(rule.example) })) : [],
        examples: Array.isArray(payload?.examples) ? payload.examples.map(example => ({ ru: escapeHTML(example.ru), en: escapeHTML(example.en), explanation: escapeHTML(example.explanation) })) : []
      };
      const contentEl = document.getElementById("tutor-explanation-content");
      if (!contentEl) return;
      const topic = GRAMMAR_CATALOG.getTopic(activeTopic);
      const group = GRAMMAR_CATALOG.getGroup(topic.group);
      const progress = this.getTopicProgressSummary(activeTopic);
      const previousTopic = GRAMMAR_CATALOG.getPreviousTopic(activeTopic);
      const nextTopic = GRAMMAR_CATALOG.getNextTopic(activeTopic);
      const rulesCollapsed = localStorage.getItem("voc_tutor_rules_collapsed") === "true";
      const examplesCollapsed = localStorage.getItem("voc_tutor_examples_collapsed") === "true";

      const html = `
        <article class="grammar-lesson-card card">
          <header class="grammar-lesson-header">
            <div class="grammar-topic-meta">
              <span class="grammar-level-chip">${escapeHTML(topic.level)}</span>
              <span>${escapeHTML(group.title)}</span>
              <span>${escapeHTML(progress.status)}${progress.mastery ? ` · ${progress.mastery}% mastery` : ""}</span>
            </div>
            <h2>${payload.title}</h2>
            <div class="tutor-explanation-text grammar-lesson-overview">${payload.explanation}</div>
          </header>

          <section class="grammar-lesson-section">
            <button type="button" class="tutor-collapsible-trigger" data-target="voc_tutor_rules_collapsed" aria-expanded="${String(!rulesCollapsed)}" aria-controls="tutor-rules-section">
              <span><span class="grammar-section-number">1</span> Learn the pattern</span>
              <span class="collapse-arrow" aria-hidden="true">${rulesCollapsed ? "＋" : "−"}</span>
            </button>
            <div id="tutor-rules-section" class="grammar-rule-grid" ${rulesCollapsed ? "hidden" : ""}>
              ${payload.rules.map(r => `
                <article class="grammar-rule-card">
                  <strong class="grammar-rule-ending">${r.ending}</strong>
                  <span class="grammar-rule-meaning">${r.rule}</span>
                  <code class="grammar-rule-example">${r.example}</code>
                </article>
              `).join("")}
            </div>
          </section>

          <div class="grammar-mistake-tip" role="note">
            <span aria-hidden="true">💡</span>
            <div><strong>What to watch for</strong><p>${escapeHTML(topic.tip)}</p></div>
          </div>

          <section class="grammar-lesson-section">
            <button type="button" class="tutor-collapsible-trigger" data-target="voc_tutor_examples_collapsed" aria-expanded="${String(!examplesCollapsed)}" aria-controls="tutor-examples-section">
              <span><span class="grammar-section-number">2</span> See it in context</span>
              <span class="collapse-arrow" aria-hidden="true">${examplesCollapsed ? "＋" : "−"}</span>
            </button>
            <div id="tutor-examples-section" class="grammar-example-grid" ${examplesCollapsed ? "hidden" : ""}>
              ${payload.examples.map(ex => `
                <article class="grammar-example-card">
                  <div class="grammar-example-heading">
                    <strong class="grammar-example-ru">${ex.ru}</strong>
                    <button type="button" class="audio-btn tutor-tts-btn" data-text="${ex.ru.replace(/[́]/g, '')}" aria-label="Listen to example">🔊</button>
                  </div>
                  <p class="grammar-example-translation">${ex.en}</p>
                  <p class="grammar-example-explanation">${ex.explanation}</p>
                </article>
              `).join("")}
            </div>
          </section>

          <section class="grammar-lesson-action card">
            <div>
              <span class="grammar-eyebrow">Quick check</span>
              <h3>Can you use this pattern?</h3>
              <p>Answer five focused questions. Your result updates this topic's mastery.</p>
            </div>
            <div class="grammar-lesson-action-buttons">
              <button type="button" class="btn btn-primary" data-grammar-action="practice-topic">Practice this topic →</button>
              ${topic.hasTrainingHub ? '<button type="button" class="btn btn-secondary" data-grammar-action="aspect-training">Open aspect drills</button>' : ""}
            </div>
          </section>

          <nav class="grammar-lesson-pagination" aria-label="Lesson sequence">
            <button type="button" class="btn btn-secondary" data-grammar-action="previous-topic" ${previousTopic.id === activeTopic ? "disabled" : ""}>← ${escapeHTML(previousTopic.title)}</button>
            <button type="button" class="btn btn-secondary" data-grammar-action="next-topic" ${nextTopic.id === activeTopic ? "disabled" : ""}>${escapeHTML(nextTopic.title)} →</button>
          </nav>
        </article>
      `;

      contentEl.innerHTML = html;
      contentEl.dataset.topicId = activeTopic;
      const breadcrumb = document.getElementById("grammar-lesson-breadcrumb");
      if (breadcrumb) breadcrumb.textContent = `${group.title}  /  ${topic.title}`;
      if (window.wrapCyrillicWords) {
        contentEl.querySelectorAll(".grammar-example-ru, .grammar-rule-example").forEach(element => {
          element.innerHTML = window.wrapCyrillicWords(element.innerHTML);
        });
      }

      // Bind collapsible headers inside tutor explanation
      contentEl.querySelectorAll(".tutor-collapsible-trigger").forEach(trigger => {
        trigger.addEventListener("click", () => {
          const cacheKey = trigger.getAttribute("data-target");
          const sectionEl = document.getElementById(trigger.getAttribute("aria-controls"));
          const arrowEl = trigger.querySelector(".collapse-arrow");
          if (!sectionEl || !arrowEl) return;
          const expanding = sectionEl.hidden;
          sectionEl.hidden = !expanding;
          trigger.setAttribute("aria-expanded", String(expanding));
          arrowEl.textContent = expanding ? "−" : "＋";
          localStorage.setItem(cacheKey, String(!expanding));
        });
      });

      // Bind TTS audio play buttons
      this.bindTutorTtsButtons();
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

    // --- AI / OFFLINE TUTOR ACTION ---
    loadTutorLesson: async function (topicId) {
      if (!TOPICS_MAP[topicId]) topicId = this.getRecommendedTopicId();
      activeTopic = topicId;
      localStorage.setItem(STORAGE_KEYS.ACTIVE_TOPIC, topicId);
      this.updateTopicNavigationState();
      const isFeatureEnabled = window.isOfflineGrammarFeatureEnabled && window.isOfflineGrammarFeatureEnabled();
      const engineMode = isFeatureEnabled ? (localStorage.getItem("voc_grammar_engine_mode") || "offline") : "ai";
      const isLoggedIn = !!(window.SupabaseSync && window.SupabaseSync.connectionState === "connected" && window.SupabaseSync.user);
      
      const loader = document.getElementById("tutor-loading");
      const contentEl = document.getElementById("tutor-explanation-content");

      // Check Offline Engine
      if (engineMode === "offline") {
        if (!window.GrammarOffline) {
          if (loader) loader.style.display = "none";
          if (contentEl) contentEl.innerHTML = '<div class="card" style="background:var(--bg-input); border:1px solid var(--border-glass); border-radius:var(--border-radius-md); padding:1.5rem; color:var(--color-error); width:100%;">Offline grammar data is unavailable. Reconnect once so the app can cache it, then try again.</div>';
          return;
        }
        if (loader) loader.style.display = "none";
        const payload = window.GrammarOffline.getLesson(topicId);
        this.renderTutorExplanation(payload);
        this.trackGrammarEvent("grammar_lesson_open", { topic_id: topicId, cefr: GRAMMAR_CATALOG.getPrimaryLevel(GRAMMAR_CATALOG.getTopic(topicId).level), source: "offline" });
        const firstCompletion = this.recordLessonCompleted(topicId);
        if (firstCompletion && window.SRS) {
          window.SRS.addActivityXP(15, "grammar_lesson", { topicId });
          this.showXpToast("+15 XP (Grammar Study)");
        }
        return;
      }

      if (!isLoggedIn) {
        if (topicId === "nominative_case") {
          if (loader) loader.style.display = "flex";
          if (contentEl) contentEl.innerHTML = "";
          setTimeout(() => {
            if (loader) loader.style.display = "none";
            this.renderTutorExplanation(PREVIEW_LESSON_NOMINATIVE);
            this.trackGrammarEvent("grammar_lesson_open", { topic_id: topicId, cefr: "A1", source: "ai" });
          }, 300);
          return;
        } else {
          this.ensureCloudConnected();
          return;
        }
      }

      if (loader) loader.style.display = "flex";
      if (contentEl) contentEl.innerHTML = "";

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
          this.trackGrammarEvent("grammar_lesson_open", { topic_id: topicId, cefr: GRAMMAR_CATALOG.getPrimaryLevel(GRAMMAR_CATALOG.getTopic(topicId).level), source: "ai" });
          const firstCompletion = this.recordLessonCompleted(topicId);
          if (firstCompletion && window.SRS) {
            window.SRS.addActivityXP(15, "grammar_lesson", { topicId });
            this.showXpToast("+15 XP (Grammar Study)");
          }
          if (loader) loader.style.display = "none";
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

        if (loader) loader.style.display = "none";
        
        const payload = data.data;

        // Render AI Response
        this.renderTutorExplanation(payload);
        this.trackGrammarEvent("grammar_lesson_open", { topic_id: topicId, cefr: GRAMMAR_CATALOG.getPrimaryLevel(GRAMMAR_CATALOG.getTopic(topicId).level), source: "ai" });

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
        if (loader) loader.style.display = "none";
        console.error("Failed to explain grammar concept:", err);
        const errContent = `<div class="card" style="background:var(--bg-input); border:1px solid var(--border-glass); border-radius:var(--border-radius-md); padding:1.5rem; color:var(--color-error); width:100%;">Error loading lesson: ${escapeHTML(getErrorMessage(err))}. Please try again later.</div>`;
        if (contentEl) contentEl.innerHTML = errContent;
      }
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

    startPracticeQuiz: async function (options = {}) {
      const setupScreen = document.getElementById("practice-setup-screen");
      const loadingScreen = document.getElementById("practice-loading");
      const activeScreen = document.getElementById("practice-active-screen");

      const cefr = CEFR_LEVELS.includes(options.level) ? options.level : document.getElementById("practice-quiz-level").value;
      const count = Number.isFinite(options.count) ? Math.max(1, Math.min(10, Math.floor(options.count))) : parseInt(document.getElementById("practice-quiz-count").value, 10);
      const requestedTopics = Array.isArray(options.topicIds) ? options.topicIds.filter(topicId => TOPICS_MAP[topicId]) : [];
      if (requestedTopics.length > 0) this.selectPracticeTopics(requestedTopics, cefr, count);

      const checkedTopics = [];
      const checkedNames = [];
      if (requestedTopics.length > 0) {
        requestedTopics.forEach(topicId => {
          checkedTopics.push(topicId);
          checkedNames.push(TOPICS_MAP[topicId]);
        });
      } else {
        document.querySelectorAll("#custom-topics-checkboxes .topic-checkbox:checked").forEach(cb => {
          checkedTopics.push(cb.value);
          checkedNames.push(TOPICS_MAP[cb.value] || cb.value);
        });
      }
      if (checkedNames.length === 0) {
        alert("Please select at least one grammar topic to start the quiz.");
        return;
      }
      const topicParam = checkedNames.join(", ");
      currentQuizTopicIds = [...checkedTopics];
      this.trackGrammarEvent("grammar_quiz_start", {
        topic_id: checkedTopics.length === 1 ? checkedTopics[0] : undefined,
        cefr,
        question_count: count,
        source: localStorage.getItem("voc_grammar_engine_mode") || "offline"
      });

      // Check Offline Engine
      const isFeatureEnabled = window.isOfflineGrammarFeatureEnabled && window.isOfflineGrammarFeatureEnabled();
      const engineMode = isFeatureEnabled ? (localStorage.getItem("voc_grammar_engine_mode") || "offline") : "ai";
      const isLoggedIn = !!(window.SupabaseSync && window.SupabaseSync.connectionState === "connected" && window.SupabaseSync.user);

      if (engineMode === "offline") {
        if (!window.GrammarOffline) {
          alert("Offline grammar data is unavailable. Reconnect once so the app can cache it, then try again.");
          return;
        }
        const questions = window.GrammarOffline.getQuestions(checkedTopics, count, cefr);
        if (!questions || questions.length === 0) {
          alert(`No curated offline questions are available for the selected ${cefr} topics. Choose a supported level/topic combination or switch to the Cloud AI engine.`);
          return;
        }
        currentQuizQuestions = questions;
        currentQuizTopicIds = [...new Set(questions.map(question => question.topicId).filter(topicId => TOPICS_MAP[topicId]))];
        currentQuizIndex = 0;
        currentQuizCorrectCount = 0;
        currentQuizResults = [];

        if (setupScreen) setupScreen.style.display = "none";
        if (loadingScreen) loadingScreen.style.display = "none";
        if (window.setPracticeFocusMode) window.setPracticeFocusMode(true);
        if (activeScreen) activeScreen.style.display = "flex";
        this.renderQuizQuestion();
        this.showXpToast("Started Instant Offline Quiz ⚡");
        return;
      }

      if (!this.ensureCloudConnected()) return;
      if (window.setPracticeFocusMode) window.setPracticeFocusMode(true);

      // Check if we have matching buffered sentences for logged-in user
      if (isLoggedIn) {
        try {
          const bufferVal = localStorage.getItem("voc_grammar_quiz_buffer");
          if (bufferVal) {
            const buffer = JSON.parse(bufferVal);
            if (buffer && 
                buffer.cefr === cefr && 
                buffer.topicParam === topicParam && 
                buffer.count === count &&
                filterQuizQuestions(buffer.questions, checkedTopics).length > 0) {
              
              console.log("[GrammarManager] Buffer hit! Starting quiz instantly with buffered questions.");
              currentQuizQuestions = filterQuizQuestions(buffer.questions, checkedTopics).slice(0, count);
              currentQuizIndex = 0;
              currentQuizCorrectCount = 0;
              currentQuizResults = [];
              
              localStorage.removeItem("voc_grammar_quiz_buffer");
              
              setupScreen.style.display = "none";
              loadingScreen.style.display = "none";
              activeScreen.style.display = "flex";
              
              this.renderQuizQuestion();
              this.showXpToast("Loaded quiz instantly from buffer! ⚡");
              
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

        let questions = filterQuizQuestions(data.data.questions, checkedTopics);

        // Blacklist filter
        let blacklist = [];
        try {
          blacklist = JSON.parse(localStorage.getItem("voc_blacklisted_sentences")) || [];
        } catch (e) {}

        if (blacklist.length > 0) {
          questions = questions.filter(q => !blacklist.includes(q.sentencePattern));
        }

        if (questions.length === 0) {
          throw new Error("No generated questions passed the quality checks. Please try again.");
        }

        currentQuizQuestions = questions.slice(0, count);
        currentQuizIndex = 0;
        currentQuizCorrectCount = 0;
        currentQuizResults = [];

        loadingScreen.style.display = "none";
        activeScreen.style.display = "flex";

        this.renderQuizQuestion();

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

    // --- STRATEGY C: MATRIX DRILLS (ENDING PICKER, CASE DETECTIVE, ASPECT MATCHER) ---
    switchPracticeMode: function (mode) {
      currentPracticeMode = mode;
      const setupScreen = document.getElementById("practice-setup-screen");
      const activeQuizScreen = document.getElementById("practice-active-screen");
      const completeQuizScreen = document.getElementById("practice-complete-screen");
      const endingScreen = document.getElementById("practice-matrix-ending-screen");
      const detectiveScreen = document.getElementById("practice-matrix-detective-screen");
      const aspectScreen = document.getElementById("practice-matrix-aspect-screen");

      // Hide all sub-screens
      if (setupScreen) setupScreen.style.display = "none";
      if (activeQuizScreen) activeQuizScreen.style.display = "none";
      if (completeQuizScreen) completeQuizScreen.style.display = "none";
      if (endingScreen) endingScreen.style.display = "none";
      if (detectiveScreen) detectiveScreen.style.display = "none";
      if (aspectScreen) aspectScreen.style.display = "none";

      if (window.setPracticeFocusMode) window.setPracticeFocusMode(mode !== "quiz");

      if (mode === "quiz") {
        if (setupScreen) setupScreen.style.display = "flex";
        if (window.setPracticeFocusMode) window.setPracticeFocusMode(false);
      } else if (mode === "ending") {
        this.startEndingPickerDrill();
      } else if (mode === "detective") {
        this.startCaseDetectiveDrill();
      } else if (mode === "aspect") {
        this.startAspectMatcherDrill();
      }
    },

    // 1. Ending Picker Drill
    startEndingPickerDrill: function () {
      endingDrillStreak = 0;
      const endingScreen = document.getElementById("practice-matrix-ending-screen");
      if (endingScreen) endingScreen.style.display = "flex";
      this.nextEndingDrill();
    },

    nextEndingDrill: function () {
      if (!window.GrammarOffline) return;
      currentEndingDrill = window.GrammarOffline.getEndingPickerDrill();
      this.renderEndingPickerDrill();
    },

    renderEndingPickerDrill: function () {
      const drill = currentEndingDrill;
      if (!drill) return;

      const streakEl = document.getElementById("ending-drill-streak");
      const targetCaseEl = document.getElementById("ending-drill-target-case");
      const wordPromptEl = document.getElementById("ending-drill-word-prompt");
      const hintEl = document.getElementById("ending-drill-hint");
      const choicesContainer = document.getElementById("ending-drill-choices-container");
      const feedbackBox = document.getElementById("ending-drill-feedback-box");

      if (streakEl) streakEl.innerText = `🔥 ${endingDrillStreak} Streak`;
      if (targetCaseEl) targetCaseEl.innerText = drill.targetCase;
      if (wordPromptEl) wordPromptEl.innerText = `${drill.stem}[ ___ ]`;
      if (hintEl) hintEl.innerText = drill.hint;
      if (feedbackBox) feedbackBox.style.display = "none";

      if (!choicesContainer) return;
      choicesContainer.innerHTML = "";

      drill.choices.forEach(choice => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "choice-btn";
        btn.innerText = choice;
        btn.style.fontSize = "1.3rem";
        btn.style.padding = "1rem";
        btn.style.fontWeight = "bold";
        btn.style.fontFamily = "var(--font-heading)";

        btn.addEventListener("click", () => this.handleEndingChoice(choice, btn));
        choicesContainer.appendChild(btn);
      });
    },

    handleEndingChoice: function (choice, btnEl) {
      const drill = currentEndingDrill;
      if (!drill) return;

      const choicesContainer = document.getElementById("ending-drill-choices-container");
      const feedbackBox = document.getElementById("ending-drill-feedback-box");
      const feedbackTitle = document.getElementById("ending-drill-feedback-title");

      if (choicesContainer) {
        choicesContainer.querySelectorAll(".choice-btn").forEach(b => b.disabled = true);
      }

      if (choice === drill.targetEnding) {
        btnEl.classList.add("correct");
        btnEl.style.background = "var(--color-primary)";
        btnEl.style.borderColor = "var(--color-primary-hover)";
        btnEl.style.color = "#fff";

        endingDrillStreak++;
        if (feedbackTitle) feedbackTitle.innerText = `✅ Correct! ${drill.stem} + ${drill.targetEnding} → ${drill.fullWord}`;
        if (feedbackBox) {
          feedbackBox.style.display = "flex";
          feedbackBox.style.borderColor = "var(--color-primary)";
        }
        if (window.SRS) window.SRS.addActivityXP(5, "grammar_drill_ending");
        this.showXpToast("+5 XP (Ending Master!)");
      } else {
        btnEl.classList.add("incorrect");
        btnEl.style.background = "rgba(255, 59, 48, 0.2)";
        btnEl.style.borderColor = "rgb(255, 59, 48)";

        endingDrillStreak = 0;
        if (feedbackTitle) feedbackTitle.innerText = `❌ Incorrect. The correct ending is ${drill.targetEnding} (${drill.fullWord})`;
        if (feedbackBox) {
          feedbackBox.style.display = "flex";
          feedbackBox.style.borderColor = "rgb(255, 59, 48)";
        }

        if (choicesContainer) {
          choicesContainer.querySelectorAll(".choice-btn").forEach(b => {
            if (b.innerText === drill.targetEnding) {
              b.style.borderColor = "var(--color-primary)";
              b.style.color = "var(--color-primary-hover)";
            }
          });
        }
      }

      const streakEl = document.getElementById("ending-drill-streak");
      if (streakEl) streakEl.innerText = `🔥 ${endingDrillStreak} Streak`;
    },

    // 2. Case Detective Drill
    startCaseDetectiveDrill: function () {
      detectiveDrillStreak = 0;
      const detectiveScreen = document.getElementById("practice-matrix-detective-screen");
      if (detectiveScreen) detectiveScreen.style.display = "flex";
      this.nextDetectiveDrill();
    },

    nextDetectiveDrill: function () {
      if (!window.GrammarOffline) return;
      currentDetectiveDrill = window.GrammarOffline.getCaseDetectiveDrill();
      this.renderCaseDetectiveDrill();
    },

    renderCaseDetectiveDrill: function () {
      const drill = currentDetectiveDrill;
      if (!drill) return;

      const streakEl = document.getElementById("detective-drill-streak");
      const promptEl = document.getElementById("detective-sentence-prompt");
      const choicesContainer = document.getElementById("detective-choices-container");
      const feedbackBox = document.getElementById("detective-feedback-box");

      if (streakEl) streakEl.innerText = `🔥 ${detectiveDrillStreak} Streak`;
      if (feedbackBox) feedbackBox.style.display = "none";

      if (promptEl) {
        const highlightedSentence = drill.sentence.replace(
          `[${drill.targetWord}]`,
          `<strong style="color: var(--color-primary-hover); text-decoration: underline;">[${drill.targetWord}]</strong>`
        );
        promptEl.innerHTML = highlightedSentence;
      }

      if (!choicesContainer) return;
      choicesContainer.innerHTML = "";

      drill.choices.forEach(choice => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "choice-btn";
        btn.innerText = choice;
        btn.style.fontSize = "1.05rem";
        btn.style.padding = "0.9rem";
        btn.style.fontWeight = "bold";

        btn.addEventListener("click", () => this.handleDetectiveChoice(choice, btn));
        choicesContainer.appendChild(btn);
      });
    },

    handleDetectiveChoice: function (choice, btnEl) {
      const drill = currentDetectiveDrill;
      if (!drill) return;

      const choicesContainer = document.getElementById("detective-choices-container");
      const feedbackBox = document.getElementById("detective-feedback-box");
      const feedbackTitle = document.getElementById("detective-feedback-title");
      const feedbackExplanation = document.getElementById("detective-feedback-explanation");

      if (choicesContainer) {
        choicesContainer.querySelectorAll(".choice-btn").forEach(b => b.disabled = true);
      }

      if (choice === drill.correctCase) {
        btnEl.classList.add("correct");
        btnEl.style.background = "var(--color-primary)";
        btnEl.style.borderColor = "var(--color-primary-hover)";
        btnEl.style.color = "#fff";

        detectiveDrillStreak++;
        if (feedbackTitle) feedbackTitle.innerText = `✅ Correct! «${drill.targetWord}» is in the ${drill.correctCase}.`;
        if (feedbackExplanation) feedbackExplanation.innerText = drill.explanation;
        if (feedbackBox) {
          feedbackBox.style.display = "flex";
          feedbackBox.style.borderColor = "var(--color-primary)";
        }
        if (window.SRS) window.SRS.addActivityXP(5, "grammar_drill_case");
        this.showXpToast("+5 XP (Case Detective!)");
      } else {
        btnEl.classList.add("incorrect");
        btnEl.style.background = "rgba(255, 59, 48, 0.2)";
        btnEl.style.borderColor = "rgb(255, 59, 48)";

        detectiveDrillStreak = 0;
        if (feedbackTitle) feedbackTitle.innerText = `❌ Incorrect. Correct Case: ${drill.correctCase}`;
        if (feedbackExplanation) feedbackExplanation.innerText = drill.explanation;
        if (feedbackBox) {
          feedbackBox.style.display = "flex";
          feedbackBox.style.borderColor = "rgb(255, 59, 48)";
        }

        if (choicesContainer) {
          choicesContainer.querySelectorAll(".choice-btn").forEach(b => {
            if (b.innerText === drill.correctCase) {
              b.style.borderColor = "var(--color-primary)";
              b.style.color = "var(--color-primary-hover)";
            }
          });
        }
      }

      const streakEl = document.getElementById("detective-drill-streak");
      if (streakEl) streakEl.innerText = `🔥 ${detectiveDrillStreak} Streak`;
    },

    // 3. Aspect Matcher Drill
    startAspectMatcherDrill: function () {
      if (!window.GrammarOffline) return;
      aspectMatchedCount = 0;
      selectedAspectLeft = null;
      currentAspectRound = window.GrammarOffline.getAspectMatchingRound(5);

      const aspectScreen = document.getElementById("practice-matrix-aspect-screen");
      if (aspectScreen) aspectScreen.style.display = "flex";
      this.renderAspectMatcherDrill();
    },

    renderAspectMatcherDrill: function () {
      const round = currentAspectRound;
      if (!round) return;

      const matchesCountEl = document.getElementById("aspect-matches-count");
      const leftCol = document.getElementById("aspect-left-column");
      const rightCol = document.getElementById("aspect-right-column");
      const completeBox = document.getElementById("aspect-round-complete-box");

      if (matchesCountEl) matchesCountEl.innerText = `${aspectMatchedCount} / ${round.pairs.length}`;
      if (completeBox) completeBox.style.display = "none";

      if (leftCol) {
        leftCol.innerHTML = "";
        round.left.forEach(item => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "btn btn-secondary aspect-match-tile";
          btn.id = `aspect_btn_${item.id}`;
          btn.innerText = item.text;
          btn.style.padding = "0.85rem 1rem";
          btn.style.fontSize = "1.05rem";
          btn.style.fontFamily = "var(--font-heading)";
          btn.style.fontWeight = "bold";
          btn.style.cursor = "pointer";
          btn.style.transition = "all 0.2s";
          btn.style.border = "1px solid var(--border-glass)";

          btn.addEventListener("click", () => this.handleAspectLeftClick(item, btn));
          leftCol.appendChild(btn);
        });
      }

      if (rightCol) {
        rightCol.innerHTML = "";
        round.right.forEach(item => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "btn btn-secondary aspect-match-tile";
          btn.id = `aspect_btn_${item.id}`;
          btn.innerText = item.text;
          btn.style.padding = "0.85rem 1rem";
          btn.style.fontSize = "1.05rem";
          btn.style.fontFamily = "var(--font-heading)";
          btn.style.fontWeight = "bold";
          btn.style.cursor = "pointer";
          btn.style.transition = "all 0.2s";
          btn.style.border = "1px solid var(--border-glass)";

          btn.addEventListener("click", () => this.handleAspectRightClick(item, btn));
          rightCol.appendChild(btn);
        });
      }
    },

    handleAspectLeftClick: function (item, btnEl) {
      if (btnEl.disabled) return;

      document.querySelectorAll("#aspect-left-column .aspect-match-tile").forEach(b => {
        if (!b.disabled) {
          b.style.borderColor = "var(--border-glass)";
          b.style.background = "var(--bg-input)";
        }
      });

      selectedAspectLeft = { item, btnEl };
      btnEl.style.borderColor = "var(--color-primary-hover)";
      btnEl.style.background = "var(--color-primary-glow)";
    },

    handleAspectRightClick: function (item, btnEl) {
      if (btnEl.disabled || !selectedAspectLeft) return;

      const left = selectedAspectLeft;
      if (left.item.pairId === item.pairId) {
        left.btnEl.disabled = true;
        btnEl.disabled = true;

        left.btnEl.style.background = "rgba(46, 213, 115, 0.2)";
        left.btnEl.style.borderColor = "#2ed573";
        left.btnEl.style.color = "#2ed573";
        left.btnEl.innerText = `✔ ${left.item.text}`;

        btnEl.style.background = "rgba(46, 213, 115, 0.2)";
        btnEl.style.borderColor = "#2ed573";
        btnEl.style.color = "#2ed573";
        btnEl.innerText = `✔ ${item.text}`;

        selectedAspectLeft = null;
        aspectMatchedCount++;

        const matchesCountEl = document.getElementById("aspect-matches-count");
        if (matchesCountEl) matchesCountEl.innerText = `${aspectMatchedCount} / 5`;

        if (aspectMatchedCount === 5) {
          const completeBox = document.getElementById("aspect-round-complete-box");
          if (completeBox) completeBox.style.display = "flex";
          if (window.SRS) window.SRS.addActivityXP(20, "grammar_drill_aspect");
          this.showXpToast("🎉 +20 XP (Aspect Master!)");
        }
      } else {
        btnEl.style.borderColor = "rgb(255, 59, 48)";
        left.btnEl.style.borderColor = "rgb(255, 59, 48)";

        setTimeout(() => {
          if (!left.btnEl.disabled) {
            left.btnEl.style.borderColor = "var(--border-glass)";
            left.btnEl.style.background = "var(--bg-input)";
          }
          if (!btnEl.disabled) {
            btnEl.style.borderColor = "var(--border-glass)";
            btnEl.style.background = "var(--bg-input)";
          }
          selectedAspectLeft = null;
        }, 500);
      }
    },

    // ==========================================
    // --- VERB ASPECTS HUB CONTROLLER (5 MODES) ---
    // ==========================================
    initAspectsHub: function () {
      if (!window.GrammarOffline) return;

      if (!isAspectHubBound) {
        isAspectHubBound = true;

        // 1. Mode Tab switching
        document.querySelectorAll(".aspect-mode-tab").forEach(tab => {
          tab.addEventListener("click", () => {
            const mode = tab.getAttribute("data-mode");
            this.switchAspectMode(mode);
          });
        });

        // 2. Global Filters
        const levelFilter = document.getElementById("aspect-hub-level-filter");
        if (levelFilter) {
          levelFilter.addEventListener("change", () => {
            this.switchAspectMode(currentAspectHubMode);
          });
        }

        const patternFilter = document.getElementById("aspect-hub-pattern-filter");
        if (patternFilter) {
          patternFilter.addEventListener("change", () => {
            this.switchAspectMode(currentAspectHubMode);
          });
        }

        // 3. Screen 1: Matcher Play Again
        const matcherPlayAgain = document.getElementById("aspect-hub-play-again-btn");
        if (matcherPlayAgain) {
          matcherPlayAgain.addEventListener("click", () => this.startAspectHubMatcher());
        }

        // 4. Screen 2: Trigger Hunt Next & TTS
        const triggerChoiceNsv = document.getElementById("aspect-trigger-choice-nsv");
        const triggerChoiceSv = document.getElementById("aspect-trigger-choice-sv");
        if (triggerChoiceNsv) {
          triggerChoiceNsv.addEventListener("click", () => this.handleAspectTriggerChoice("nsv"));
        }
        if (triggerChoiceSv) {
          triggerChoiceSv.addEventListener("click", () => this.handleAspectTriggerChoice("sv"));
        }
        const triggerNextBtn = document.getElementById("aspect-trigger-next-btn");
        if (triggerNextBtn) {
          triggerNextBtn.addEventListener("click", () => this.startAspectTriggerDrill());
        }
        const triggerTtsBtn = document.getElementById("aspect-trigger-tts-btn");
        if (triggerTtsBtn) {
          triggerTtsBtn.addEventListener("click", () => {
            if (currentAspectTriggerDrill) {
              const fullSentence = currentAspectTriggerDrill.sentencePattern.replace(/\[blank\]/gi, currentAspectTriggerDrill.answer);
              if (window.AudioEngine && typeof window.AudioEngine.speak === "function") {
                window.AudioEngine.speak(fullSentence);
              }
            }
          });
        }

        // 5. Screen 3: Nuance Next & TTS
        const nuanceNextBtn = document.getElementById("aspect-nuance-next-btn");
        if (nuanceNextBtn) {
          nuanceNextBtn.addEventListener("click", () => this.startAspectNuanceDrill());
        }
        const nuanceTtsA = document.getElementById("aspect-nuance-tts-a");
        if (nuanceTtsA) {
          nuanceTtsA.addEventListener("click", () => {
            if (currentAspectNuanceDrill && window.AudioEngine) {
              window.AudioEngine.speak(currentAspectNuanceDrill.sentenceA);
            }
          });
        }
        const nuanceTtsB = document.getElementById("aspect-nuance-tts-b");
        if (nuanceTtsB) {
          nuanceTtsB.addEventListener("click", () => {
            if (currentAspectNuanceDrill && window.AudioEngine) {
              window.AudioEngine.speak(currentAspectNuanceDrill.sentenceB);
            }
          });
        }

        // 6. Screen 4: Transform Next
        const transformNextBtn = document.getElementById("aspect-transform-next-btn");
        if (transformNextBtn) {
          transformNextBtn.addEventListener("click", () => this.startAspectTransformDrill());
        }

        // 7. Screen 5: Explorer Search Input
        const explorerSearch = document.getElementById("aspect-explorer-search-input");
        if (explorerSearch) {
          explorerSearch.addEventListener("input", () => this.renderAspectExplorer());
        }
      }

      this.switchAspectMode(currentAspectHubMode);
    },

    switchAspectMode: function (mode) {
      currentAspectHubMode = mode || "matcher";

      // Deactivate tabs
      document.querySelectorAll(".aspect-mode-tab").forEach(tab => {
        if (tab.getAttribute("data-mode") === currentAspectHubMode) {
          tab.classList.add("active");
        } else {
          tab.classList.remove("active");
        }
      });

      // Hide all panels
      document.querySelectorAll(".aspect-screen-panel").forEach(p => p.style.display = "none");

      // Show chosen panel
      const targetPanel = document.getElementById(`aspect-screen-${currentAspectHubMode}`);
      if (targetPanel) {
        targetPanel.style.display = "flex";
      }

      if (currentAspectHubMode === "matcher") {
        this.startAspectHubMatcher();
      } else if (currentAspectHubMode === "trigger") {
        this.startAspectTriggerDrill();
      } else if (currentAspectHubMode === "nuance") {
        this.startAspectNuanceDrill();
      } else if (currentAspectHubMode === "transform") {
        this.startAspectTransformDrill();
      } else if (currentAspectHubMode === "explorer") {
        this.renderAspectExplorer();
      }
    },

    // --- 1. PAIR MATCHER ---
    startAspectHubMatcher: function () {
      if (!window.GrammarOffline) return;
      const level = document.getElementById("aspect-hub-level-filter")?.value || "all";
      const pattern = document.getElementById("aspect-hub-pattern-filter")?.value || "all";

      aspectHubMatchedCount = 0;
      aspectHubSelectedLeft = null;
      aspectHubCurrentRound = window.GrammarOffline.getAspectMatchingRound(5, level, pattern);

      this.renderAspectHubMatcher();
    },

    renderAspectHubMatcher: function () {
      const round = aspectHubCurrentRound;
      if (!round) return;

      const matchesCountEl = document.getElementById("aspect-hub-matches-count");
      const streakEl = document.getElementById("aspect-hub-matcher-streak");
      const leftCol = document.getElementById("aspect-hub-left-column");
      const rightCol = document.getElementById("aspect-hub-right-column");
      const completeBox = document.getElementById("aspect-hub-round-complete-box");

      if (matchesCountEl) matchesCountEl.innerText = `${aspectHubMatchedCount} / ${round.pairs.length}`;
      if (streakEl) streakEl.innerText = `🔥 ${aspectHubMatcherStreak} Streak`;
      if (completeBox) completeBox.style.display = "none";

      if (leftCol) {
        leftCol.innerHTML = "";
        round.left.forEach(item => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "btn btn-secondary aspect-match-tile";
          btn.id = `aspect_hub_btn_${item.id}`;
          btn.innerHTML = `<span>${item.accented || item.text}</span> <small style="display:block;font-size:0.75rem;color:var(--color-text-muted);font-weight:normal;">${item.translation}</small>`;
          btn.style.padding = "0.75rem 1rem";
          btn.style.fontSize = "1.05rem";
          btn.style.fontWeight = "bold";
          btn.style.cursor = "pointer";
          btn.style.transition = "all 0.2s";
          btn.style.border = "1px solid var(--border-glass)";
          btn.style.flexDirection = "column";

          btn.addEventListener("click", () => this.handleAspectHubLeftClick(item, btn));
          leftCol.appendChild(btn);
        });
      }

      if (rightCol) {
        rightCol.innerHTML = "";
        round.right.forEach(item => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "btn btn-secondary aspect-match-tile";
          btn.id = `aspect_hub_btn_${item.id}`;
          btn.innerHTML = `<span>${item.accented || item.text}</span> <small style="display:block;font-size:0.75rem;color:var(--color-text-muted);font-weight:normal;">${item.translation}</small>`;
          btn.style.padding = "0.75rem 1rem";
          btn.style.fontSize = "1.05rem";
          btn.style.fontWeight = "bold";
          btn.style.cursor = "pointer";
          btn.style.transition = "all 0.2s";
          btn.style.border = "1px solid var(--border-glass)";
          btn.style.flexDirection = "column";

          btn.addEventListener("click", () => this.handleAspectHubRightClick(item, btn));
          rightCol.appendChild(btn);
        });
      }
    },

    handleAspectHubLeftClick: function (item, btnEl) {
      if (btnEl.disabled) return;

      document.querySelectorAll("#aspect-hub-left-column .aspect-match-tile").forEach(b => {
        if (!b.disabled) {
          b.style.borderColor = "var(--border-glass)";
          b.style.background = "var(--bg-input)";
        }
      });

      aspectHubSelectedLeft = { item, btnEl };
      btnEl.style.borderColor = "#00d2d3";
      btnEl.style.background = "rgba(0, 210, 211, 0.15)";

      if (window.AudioEngine && typeof window.AudioEngine.speak === "function") {
        window.AudioEngine.speak(item.text);
      }
    },

    handleAspectHubRightClick: function (item, btnEl) {
      if (btnEl.disabled || !aspectHubSelectedLeft) return;

      const left = aspectHubSelectedLeft;
      if (left.item.pairId === item.pairId) {
        left.btnEl.disabled = true;
        btnEl.disabled = true;

        left.btnEl.style.background = "rgba(46, 213, 115, 0.2)";
        left.btnEl.style.borderColor = "#2ed573";
        left.btnEl.style.color = "#2ed573";
        left.btnEl.innerHTML = `<span>✔ ${left.item.accented || left.item.text}</span> <small style="display:block;font-size:0.75rem;color:#2ed573;">${left.item.translation}</small>`;

        btnEl.style.background = "rgba(46, 213, 115, 0.2)";
        btnEl.style.borderColor = "#2ed573";
        btnEl.style.color = "#2ed573";
        btnEl.innerHTML = `<span>✔ ${item.accented || item.text}</span> <small style="display:block;font-size:0.75rem;color:#2ed573;">${item.translation}</small>`;

        aspectHubSelectedLeft = null;
        aspectHubMatchedCount++;

        const matchesCountEl = document.getElementById("aspect-hub-matches-count");
        if (matchesCountEl) matchesCountEl.innerText = `${aspectHubMatchedCount} / 5`;

        if (window.AudioEngine) {
          if (typeof window.AudioEngine.playSuccess === "function") window.AudioEngine.playSuccess();
          if (typeof window.AudioEngine.speak === "function") window.AudioEngine.speak(item.text);
        }

        if (aspectHubMatchedCount === 5) {
          aspectHubMatcherStreak++;
          const streakEl = document.getElementById("aspect-hub-matcher-streak");
          if (streakEl) streakEl.innerText = `🔥 ${aspectHubMatcherStreak} Streak`;

          const completeBox = document.getElementById("aspect-hub-round-complete-box");
          if (completeBox) completeBox.style.display = "flex";
          if (window.SRS) window.SRS.addActivityXP(20, "aspect_matcher_complete");
          this.showXpToast("🎉 +20 XP (Aspect Master!)");
        }
      } else {
        btnEl.style.borderColor = "rgb(255, 59, 48)";
        left.btnEl.style.borderColor = "rgb(255, 59, 48)";
        if (window.AudioEngine && typeof window.AudioEngine.playError === "function") {
          window.AudioEngine.playError();
        }

        setTimeout(() => {
          if (!left.btnEl.disabled) {
            left.btnEl.style.borderColor = "var(--border-glass)";
            left.btnEl.style.background = "var(--bg-input)";
          }
          if (!btnEl.disabled) {
            btnEl.style.borderColor = "var(--border-glass)";
            btnEl.style.background = "var(--bg-input)";
          }
          aspectHubSelectedLeft = null;
        }, 500);
      }
    },

    // --- 2. TRIGGER HUNT ---
    startAspectTriggerDrill: function () {
      if (!window.GrammarOffline) return;
      const level = document.getElementById("aspect-hub-level-filter")?.value || "all";
      currentAspectTriggerDrill = window.GrammarOffline.getAspectTriggerDrill(level);
      this.renderAspectTriggerDrill();
    },

    renderAspectTriggerDrill: function () {
      const q = currentAspectTriggerDrill;
      if (!q) return;

      const streakEl = document.getElementById("aspect-trigger-streak");
      const levelBadge = document.getElementById("aspect-trigger-level-badge");
      const clueBadge = document.getElementById("aspect-trigger-clue-badge");
      const promptEl = document.getElementById("aspect-trigger-sentence-prompt");
      const translEl = document.getElementById("aspect-trigger-translation-prompt");
      const nsvBtn = document.getElementById("aspect-trigger-choice-nsv");
      const svBtn = document.getElementById("aspect-trigger-choice-sv");
      const nsvText = document.getElementById("aspect-trigger-choice-nsv-text");
      const svText = document.getElementById("aspect-trigger-choice-sv-text");
      const feedbackBox = document.getElementById("aspect-trigger-feedback-box");

      if (streakEl) streakEl.innerText = `🔥 ${aspectTriggerStreak} Streak`;
      if (levelBadge) levelBadge.innerText = `${q.level || "A1"} Level`;
      if (clueBadge) clueBadge.innerHTML = `🔍 Trigger Clue: <strong>${escapeHTML(q.trigger)}</strong>`;

      // Highlight [blank]
      const formattedPrompt = escapeHTML(q.sentencePattern).replace(/\[blank\]/gi, '<span class="aspect-trigger-highlight">[ ___ ]</span>');
      if (promptEl) promptEl.innerHTML = formattedPrompt;
      if (translEl) translEl.innerText = `"${q.translation}"`;

      if (nsvText) nsvText.innerText = q.nsv;
      if (svText) svText.innerText = q.sv;

      // Reset choice buttons
      [nsvBtn, svBtn].forEach(btn => {
        if (btn) {
          btn.disabled = false;
          btn.style.borderColor = "var(--border-glass)";
          btn.style.background = "var(--bg-card)";
        }
      });

      if (feedbackBox) feedbackBox.style.display = "none";
    },

    handleAspectTriggerChoice: function (chosenAspect) {
      const q = currentAspectTriggerDrill;
      if (!q) return;

      const nsvBtn = document.getElementById("aspect-trigger-choice-nsv");
      const svBtn = document.getElementById("aspect-trigger-choice-sv");
      const feedbackBox = document.getElementById("aspect-trigger-feedback-box");
      const feedbackTitle = document.getElementById("aspect-trigger-feedback-title");
      const feedbackText = document.getElementById("aspect-trigger-feedback-text");
      const streakEl = document.getElementById("aspect-trigger-streak");

      if (nsvBtn) nsvBtn.disabled = true;
      if (svBtn) svBtn.disabled = true;

      const chosenWord = chosenAspect === "nsv" ? q.nsv : q.sv;
      const isCorrect = chosenWord.trim().toLowerCase() === q.answer.trim().toLowerCase();

      const clickedBtn = chosenAspect === "nsv" ? nsvBtn : svBtn;

      if (isCorrect) {
        if (clickedBtn) {
          clickedBtn.style.borderColor = "#2ed573";
          clickedBtn.style.background = "rgba(46, 213, 115, 0.15)";
        }
        if (window.AudioEngine) {
          if (typeof window.AudioEngine.playSuccess === "function") window.AudioEngine.playSuccess();
        }
        if (feedbackTitle) feedbackTitle.innerHTML = `<span style="color:#2ed573;">✅ Correct! (${escapeHTML(q.aspect)})</span>`;
        if (feedbackText) feedbackText.innerText = q.explanation;
        aspectTriggerStreak++;
        if (window.SRS) window.SRS.addActivityXP(15, "aspect_trigger_drill");
        this.showXpToast("🎯 +15 XP (Trigger Master!)");
      } else {
        if (clickedBtn) {
          clickedBtn.style.borderColor = "rgb(255, 59, 48)";
          clickedBtn.style.background = "rgba(255, 59, 48, 0.15)";
        }
        if (window.AudioEngine && typeof window.AudioEngine.playError === "function") {
          window.AudioEngine.playError();
        }
        if (feedbackTitle) feedbackTitle.innerHTML = `<span style="color:rgb(255, 59, 48);">❌ Incorrect. Correct form: «${escapeHTML(q.answer)}» (${escapeHTML(q.aspect)})</span>`;
        if (feedbackText) feedbackText.innerText = q.explanation;
        aspectTriggerStreak = 0;
      }

      if (streakEl) streakEl.innerText = `🔥 ${aspectTriggerStreak} Streak`;
      if (feedbackBox) feedbackBox.style.display = "flex";
    },

    // --- 3. NUANCE EXPLORER ---
    startAspectNuanceDrill: function () {
      if (!window.GrammarOffline) return;
      const level = document.getElementById("aspect-hub-level-filter")?.value || "all";
      currentAspectNuanceDrill = window.GrammarOffline.getAspectNuanceDrill(level);
      this.renderAspectNuanceDrill();
    },

    renderAspectNuanceDrill: function () {
      const q = currentAspectNuanceDrill;
      if (!q) return;

      const titleBadge = document.getElementById("aspect-nuance-title-badge");
      const sentenceA = document.getElementById("aspect-nuance-sentence-a");
      const meaningA = document.getElementById("aspect-nuance-meaning-a");
      const sentenceB = document.getElementById("aspect-nuance-sentence-b");
      const meaningB = document.getElementById("aspect-nuance-meaning-b");
      const explanationText = document.getElementById("aspect-nuance-explanation-text");

      if (titleBadge) titleBadge.innerText = q.title;
      if (sentenceA) sentenceA.innerText = q.sentenceA;
      if (meaningA) meaningA.innerText = q.meaningA;
      if (sentenceB) sentenceB.innerText = q.sentenceB;
      if (meaningB) meaningB.innerText = q.meaningB;
      if (explanationText) explanationText.innerText = q.explanation;
    },

    // --- 4. TENSE & ASPECT SHIFT ---
    startAspectTransformDrill: function () {
      if (!window.GrammarOffline) return;
      const level = document.getElementById("aspect-hub-level-filter")?.value || "all";
      currentAspectTransformDrill = window.GrammarOffline.getAspectTransformDrill(level);
      this.renderAspectTransformDrill();
    },

    renderAspectTransformDrill: function () {
      const q = currentAspectTransformDrill;
      if (!q) return;

      const streakEl = document.getElementById("aspect-transform-streak");
      const titleBadge = document.getElementById("aspect-transform-title-badge");
      const sourceSentence = document.getElementById("aspect-transform-source-sentence");
      const sourceAspect = document.getElementById("aspect-transform-source-aspect");
      const instructionEl = document.getElementById("aspect-transform-instruction");
      const targetPrompt = document.getElementById("aspect-transform-target-prompt");
      const choicesContainer = document.getElementById("aspect-transform-choices-container");
      const feedbackBox = document.getElementById("aspect-transform-feedback-box");

      if (streakEl) streakEl.innerText = `🔄 ${aspectTransformStreak} Streak`;
      if (titleBadge) titleBadge.innerText = q.title;
      if (sourceSentence) sourceSentence.innerText = q.sourceSentence;
      if (sourceAspect) sourceAspect.innerText = q.sourceAspect;
      if (instructionEl) instructionEl.innerText = q.instruction;

      const formattedPrompt = escapeHTML(q.targetSentencePattern).replace(/\[blank\]/gi, '<span class="aspect-trigger-highlight">[ ___ ]</span>');
      if (targetPrompt) targetPrompt.innerHTML = formattedPrompt;

      if (choicesContainer) {
        choicesContainer.innerHTML = "";
        q.choices.forEach(choice => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "choice-btn";
          btn.innerText = choice;
          btn.style.fontSize = "1.1rem";
          btn.style.padding = "0.85rem 1rem";
          btn.style.fontWeight = "600";
          btn.addEventListener("click", () => this.handleAspectTransformChoice(choice, btn));
          choicesContainer.appendChild(btn);
        });
      }

      if (feedbackBox) feedbackBox.style.display = "none";
    },

    handleAspectTransformChoice: function (choice, btnEl) {
      const q = currentAspectTransformDrill;
      if (!q) return;

      const feedbackBox = document.getElementById("aspect-transform-feedback-box");
      const feedbackTitle = document.getElementById("aspect-transform-feedback-title");
      const feedbackText = document.getElementById("aspect-transform-feedback-text");
      const streakEl = document.getElementById("aspect-transform-streak");

      document.querySelectorAll("#aspect-transform-choices-container .choice-btn").forEach(b => b.disabled = true);

      const isCorrect = choice.trim().toLowerCase() === q.answer.trim().toLowerCase();

      if (isCorrect) {
        btnEl.classList.add("correct");
        if (window.AudioEngine && typeof window.AudioEngine.playSuccess === "function") {
          window.AudioEngine.playSuccess();
        }
        if (feedbackTitle) feedbackTitle.innerHTML = `<span style="color:#2ed573;">✅ Correct! «${escapeHTML(q.answer)}»</span>`;
        if (feedbackText) feedbackText.innerText = q.explanation;
        aspectTransformStreak++;
        if (window.SRS) window.SRS.addActivityXP(15, "aspect_transform_drill");
        this.showXpToast("🔄 +15 XP (Aspect Shift!)");
      } else {
        btnEl.classList.add("incorrect");
        if (window.AudioEngine && typeof window.AudioEngine.playError === "function") {
          window.AudioEngine.playError();
        }
        if (feedbackTitle) feedbackTitle.innerHTML = `<span style="color:rgb(255, 59, 48);">❌ Incorrect. Expected: «${escapeHTML(q.answer)}»</span>`;
        if (feedbackText) feedbackText.innerText = q.explanation;
        aspectTransformStreak = 0;
      }

      if (streakEl) streakEl.innerText = `🔄 ${aspectTransformStreak} Streak`;
      if (feedbackBox) feedbackBox.style.display = "flex";
    },

    // --- 5. PAIR EXPLORER ---
    renderAspectExplorer: function () {
      if (!window.GrammarOffline) return;
      const level = document.getElementById("aspect-hub-level-filter")?.value || "all";
      const pattern = document.getElementById("aspect-hub-pattern-filter")?.value || "all";
      const search = document.getElementById("aspect-explorer-search-input")?.value || "";

      const pairs = window.GrammarOffline.getAspectPairs({ level, pattern, search });

      const countEl = document.getElementById("aspect-explorer-count");
      const grid = document.getElementById("aspect-explorer-grid");

      if (countEl) countEl.innerText = `Showing ${pairs.length} aspect pair${pairs.length === 1 ? "" : "s"}`;

      if (grid) {
        grid.innerHTML = "";
        if (pairs.length === 0) {
          grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--color-text-muted);">No aspect pairs found matching your search.</div>`;
          return;
        }

        pairs.forEach(p => {
          const card = document.createElement("div");
          card.className = "aspect-pair-card";

          const patternLabels = {
            prefix: "Prefixation",
            suffix: "Suffixation",
            suppletive: "Irregular",
            stress: "Stress Shift"
          };

          card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-glass); padding-bottom: 0.5rem;">
              <span style="font-weight: 700; font-size: 1.05rem; color: var(--color-text-main);">${escapeHTML(p.translation)}</span>
              <div style="display: flex; gap: 0.35rem; align-items: center;">
                <span class="card-category-tag" style="margin: 0; font-size: 0.7rem;">${p.level}</span>
                <span style="font-size: 0.7rem; padding: 0.15rem 0.4rem; border-radius: 4px; background: rgba(255,255,255,0.06); color: var(--color-text-muted);">${patternLabels[p.pattern] || p.pattern}</span>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin: 0.25rem 0;">
              <!-- NSV side -->
              <div style="background: rgba(0, 210, 211, 0.06); border: 1px solid rgba(0, 210, 211, 0.2); border-radius: var(--border-radius-sm); padding: 0.6rem; display: flex; flex-direction: column; gap: 0.25rem;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span class="aspect-badge-nsv" style="padding: 0.1rem 0.4rem; font-size: 0.65rem;">НСВ</span>
                  <button type="button" class="audio-btn aspect-speak-nsv" style="width: 26px; height: 26px; font-size: 0.75rem;" title="Listen">🔊</button>
                </div>
                <strong style="font-size: 1.15rem; color: var(--color-text-main);">${escapeHTML(p.nsvAccented || p.nsv)}</strong>
                <span style="font-size: 0.75rem; color: var(--color-text-muted); line-height: 1.3;">${escapeHTML(p.exampleNsv || "")}</span>
              </div>

              <!-- SV side -->
              <div style="background: rgba(255, 159, 67, 0.06); border: 1px solid rgba(255, 159, 67, 0.2); border-radius: var(--border-radius-sm); padding: 0.6rem; display: flex; flex-direction: column; gap: 0.25rem;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span class="aspect-badge-sv" style="padding: 0.1rem 0.4rem; font-size: 0.65rem;">СВ</span>
                  <button type="button" class="audio-btn aspect-speak-sv" style="width: 26px; height: 26px; font-size: 0.75rem;" title="Listen">🔊</button>
                </div>
                <strong style="font-size: 1.15rem; color: var(--color-text-main);">${escapeHTML(p.svAccented || p.sv)}</strong>
                <span style="font-size: 0.75rem; color: var(--color-text-muted); line-height: 1.3;">${escapeHTML(p.exampleSv || "")}</span>
              </div>
            </div>
          `;

          // Bind audio buttons
          card.querySelector(".aspect-speak-nsv")?.addEventListener("click", () => {
            if (window.AudioEngine) window.AudioEngine.speak(p.nsv);
          });
          card.querySelector(".aspect-speak-sv")?.addEventListener("click", () => {
            if (window.AudioEngine) window.AudioEngine.speak(p.sv);
          });

          grid.appendChild(card);
        });
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
      const evidenceQuestion = { ...q, topicId: topicId || activeTopic };
      const evidenceLevel = document.getElementById("practice-quiz-level")?.value || "A1";
      if (isCorrect) this.resolveGrammarMistake(evidenceQuestion);
      else this.recordGrammarMistake(evidenceQuestion, evidenceLevel);
      
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

      // Give choice-aware feedback. The question bank explanation remains the
      // authoritative grammar explanation, while the surrounding message
      // tells the learner what their specific choice meant.
      explText.innerText = this.buildQuizFeedback(q, choice).text;
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
      this.trackGrammarEvent("grammar_quiz_complete", {
        topic_id: currentQuizTopicIds.length === 1 ? currentQuizTopicIds[0] : undefined,
        cefr: level,
        question_count: currentQuizQuestions.length,
        source: localStorage.getItem("voc_grammar_engine_mode") || "offline"
      });
      this.refreshGrammarWorkspace();
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
