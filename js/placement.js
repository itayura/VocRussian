(function () {
  const PLACEMENT_QUESTIONS = [
    {
      id: 1,
      level: "A1",
      question: "What is the English translation of the Russian word 'Привет'?",
      choices: ["Goodbye", "Thank you", "Hello (informal)", "Please"],
      answer: "Hello (informal)"
    },
    {
      id: 2,
      level: "A1",
      question: "Which of these pronouns means 'We' in Russian?",
      choices: ["Я", "Ты", "Он", "Мы"],
      answer: "Мы"
    },
    {
      id: 3,
      level: "A2",
      question: "Identify the correct form of the adjective in: 'Это _____ книга.' (new)",
      choices: ["новый", "новое", "новая", "новые"],
      answer: "новая"
    },
    {
      id: 4,
      level: "A2",
      question: "How do you say 'Where is the station?' in Russian?",
      choices: ["Где вокзал?", "Как дела?", "Где метро?", "Кто это?"],
      answer: "Где вокзал?"
    },
    {
      id: 5,
      level: "B1",
      question: "Which grammatical case is used after the preposition 'без' (without)?",
      choices: ["Nominative", "Genitive", "Accusative", "Dative"],
      answer: "Genitive"
    },
    {
      id: 6,
      level: "B2",
      question: "Choose the correct verb of motion: 'Каждое утро я _____ в школу пешком.' (I go/walk)",
      choices: ["иду", "хожу", "еду", "езжу"],
      answer: "хожу"
    }
  ];

  let currentQuestionIndex = 0;
  let correctAnswersCount = 0;

  function initPlacementTest() {
    const banner = document.getElementById("dashboard-placement-banner");
    const startBannerBtn = document.getElementById("placement-banner-start-btn");
    const startSettingsBtn = document.getElementById("settings-placement-test-btn");
    const closeBtn = document.getElementById("modal-placement-close");
    const startTestBtn = document.getElementById("placement-start-test-btn");
    const finishBtn = document.getElementById("placement-finish-btn");

    if (!banner) return;

    // Show/hide banner on Dashboard load
    const taken = localStorage.getItem("voc_placement_test_taken") === "true";
    const currentXp = window.SRS ? (window.SRS.getGlobalStats().xp || 0) : 0;

    if (!taken && currentXp === 0) {
      banner.style.display = "flex";
    } else {
      banner.style.display = "none";
    }

    // Start buttons
    if (startBannerBtn) {
      // Create new event listener to prevent duplicate binding
      startBannerBtn.replaceWith(startBannerBtn.cloneNode(true));
      document.getElementById("placement-banner-start-btn").addEventListener("click", openPlacementTest);
    }
    if (startSettingsBtn) {
      startSettingsBtn.replaceWith(startSettingsBtn.cloneNode(true));
      document.getElementById("settings-placement-test-btn").addEventListener("click", () => {
        localStorage.removeItem("voc_placement_test_taken");
        openPlacementTest();
      });
    }

    // Modal close
    if (closeBtn) {
      closeBtn.replaceWith(closeBtn.cloneNode(true));
      document.getElementById("modal-placement-close").addEventListener("click", closePlacementTest);
    }

    // Start test trigger
    if (startTestBtn) {
      startTestBtn.replaceWith(startTestBtn.cloneNode(true));
      document.getElementById("placement-start-test-btn").addEventListener("click", startTest);
    }

    // Finish test trigger
    if (finishBtn) {
      finishBtn.replaceWith(finishBtn.cloneNode(true));
      document.getElementById("placement-finish-btn").addEventListener("click", finishTest);
    }
  }

  function openPlacementTest() {
    currentQuestionIndex = 0;
    correctAnswersCount = 0;

    // Reset views
    document.getElementById("placement-intro-view").style.display = "flex";
    document.getElementById("placement-question-view").style.display = "none";
    document.getElementById("placement-result-view").style.display = "none";

    if (window.openModal) {
      window.openModal("modal-placement-test");
    } else {
      document.getElementById("modal-placement-test").classList.add("active");
    }
  }

  function closePlacementTest() {
    if (window.closeModal) {
      window.closeModal("modal-placement-test");
    } else {
      document.getElementById("modal-placement-test").classList.remove("active");
    }
  }

  function startTest() {
    document.getElementById("placement-intro-view").style.display = "none";
    document.getElementById("placement-question-view").style.display = "flex";
    loadQuestion();
  }

  function loadQuestion() {
    const q = PLACEMENT_QUESTIONS[currentQuestionIndex];
    
    // Update step and badge
    document.getElementById("placement-question-step").innerText = `Question ${currentQuestionIndex + 1} of ${PLACEMENT_QUESTIONS.length}`;
    document.getElementById("placement-question-level").innerText = `Level ${q.level}`;
    
    // Progress bar
    const pct = ((currentQuestionIndex + 1) / PLACEMENT_QUESTIONS.length) * 100;
    document.getElementById("placement-progress-bar").style.width = `${pct}%`;

    // Question text
    document.getElementById("placement-question-text").innerText = q.question;

    // Choices
    const container = document.getElementById("placement-choices-container");
    container.innerHTML = "";

    q.choices.forEach(choice => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn btn-secondary choice-btn";
      btn.style.width = "100%";
      btn.style.textAlign = "left";
      btn.style.padding = "0.85rem 1.25rem";
      btn.style.fontSize = "0.95rem";
      btn.style.background = "var(--bg-glass)";
      btn.style.borderColor = "var(--border-glass)";
      btn.style.color = "var(--color-text-main)";
      btn.style.transition = "all 0.2s ease";
      btn.innerText = choice;

      btn.addEventListener("click", () => selectAnswer(choice, btn));
      container.appendChild(btn);
    });
  }

  function selectAnswer(choice, selectedBtn) {
    const q = PLACEMENT_QUESTIONS[currentQuestionIndex];
    const container = document.getElementById("placement-choices-container");
    const buttons = container.querySelectorAll(".choice-btn");
    
    // Disable all options
    buttons.forEach(btn => btn.disabled = true);

    const isCorrect = choice === q.answer;
    const animationsEnabled = window.SRS ? window.SRS.getSetting("animationsEnabled", true) : true;

    if (isCorrect) {
      correctAnswersCount++;
      selectedBtn.classList.add("correct-glow");
      if (window.AudioEngine) window.AudioEngine.playSuccess();
      if (animationsEnabled && window.showConfettiBurst) {
        window.showConfettiBurst(selectedBtn);
      }
    } else {
      selectedBtn.classList.add("incorrect-shake");
      if (window.AudioEngine) window.AudioEngine.playError();
      
      // Highlight correct answer
      buttons.forEach(btn => {
        if (btn.innerText === q.answer) {
          btn.style.borderColor = "var(--color-success)";
          btn.style.background = "rgba(40, 167, 69, 0.1)";
        }
      });
    }

    setTimeout(() => {
      currentQuestionIndex++;
      if (currentQuestionIndex < PLACEMENT_QUESTIONS.length) {
        loadQuestion();
      } else {
        showResults();
      }
    }, 1200);
  }

  function showResults() {
    document.getElementById("placement-question-view").style.display = "none";
    document.getElementById("placement-result-view").style.display = "flex";

    let level = "A1";
    let xp = 0;
    let desc = "";
    let avatar = "🐻";

    if (correctAnswersCount <= 1) {
      level = "A1";
      xp = 50;
      desc = "You placed at level A1 (Beginner). We have set up your starting cards in Box 1 and awarded you a kickstart reward of +50 XP!";
      avatar = "🐻";
    } else if (correctAnswersCount >= 2 && correctAnswersCount <= 3) {
      level = "A2";
      xp = 200;
      desc = "You placed at level A2 (Elementary). We have promoted your A1 vocabulary words to Box 3, marked introductory grammar lessons completed, and awarded you +200 XP!";
      avatar = "🦉";
    } else if (correctAnswersCount >= 4 && correctAnswersCount <= 5) {
      level = "B1";
      xp = 500;
      desc = "You placed at level B1 (Intermediate). We have promoted A1/A2 vocabulary words to Box 4, marked introductory/elementary grammar lessons completed, and awarded you +500 XP!";
      avatar = "🤖";
    } else if (correctAnswersCount === 6) {
      level = "B2";
      xp = 1000;
      desc = "You placed at level B2 (Upper Intermediate). We have promoted all A1/A2/B1 vocabulary words to Box 5 (Mastered), completed corresponding grammar concepts, and awarded you +1000 XP!";
      avatar = "👑";
    }

    document.getElementById("placement-result-avatar").innerText = avatar;
    document.getElementById("placement-result-title").innerText = `Level Placed: ${level}!`;
    document.getElementById("placement-result-text").innerText = desc;

    // Apply seeding algorithm
    seedProgress(level, xp);
  }

  function seedProgress(level, xp) {
    console.log("[PlacementTest] seedProgress started:", level, xp);
    if (!window.SRS) {
      console.error("[PlacementTest] window.SRS is not defined!");
      return;
    }

    try {
      // 1. Seed XP
      console.log("[PlacementTest] Seeding XP:", xp);
      window.SRS.addXP(xp);
      console.log("[PlacementTest] Seeded XP successfully. Current XP:", window.SRS.getGlobalStats().xp);

      // 2. Seed Vocabulary Cards Box Levels
      console.log("[PlacementTest] Seeding vocabulary...");
      const allWords = window.SRS.getAllWords() || [];
      console.log("[PlacementTest] Total words found:", allWords.length);
      allWords.forEach(w => {
        const wLvl = window.SRS.getWordLevel(w);
        const prog = window.SRS.getCardProgress(w.id);

        let targetBox = 1;
        let reviewDays = 0;

        if (level === "A2") {
          if (wLvl === "A1") {
            targetBox = 3;
            reviewDays = 4;
          }
        } else if (level === "B1") {
          if (wLvl === "A1" || wLvl === "A2") {
            targetBox = 4;
            reviewDays = 10;
          }
        } else if (level === "B2") {
          if (wLvl === "A1" || wLvl === "A2" || wLvl === "B1") {
            targetBox = 5;
            reviewDays = 30;
          }
        }

        if (targetBox > 1) {
          prog.box = targetBox;
          prog.nextReview = Date.now() + reviewDays * 24 * 3600 * 1000;
          prog.updatedAt = Date.now();
          window.SRS.saveToStorage(w.id, prog);
        }
      });
      console.log("[PlacementTest] Seeded vocabulary successfully.");
    } catch (e) {
      console.error("[PlacementTest] Error seeding progress:", e);
    }

    // 3. Seed Grammar Concept Completions
    if (window.GrammarManager) {
      const gProgress = window.GrammarManager.getGrammarProgressMap() || {};
      const topics = [
        "nominative_case", "accusative_case", "genitive_case", "dative_case", 
        "instrumental_case", "prepositional_case", "verb_aspects", "verbs_of_motion",
        "verb_conjugations", "past_tense", "future_tense", "adjectives_declension",
        "pronouns_declension", "noun_plurals"
      ];

      // Mark lessons completed
      topics.forEach(topic => {
        let shouldMarkLesson = false;
        let completedLevels = [];

        if (level === "A2") {
          shouldMarkLesson = true;
          completedLevels = ["A1"];
        } else if (level === "B1") {
          shouldMarkLesson = true;
          completedLevels = ["A1", "A2"];
        } else if (level === "B2") {
          shouldMarkLesson = true;
          completedLevels = ["A1", "A2", "B1"];
        }

        if (shouldMarkLesson) {
          gProgress[topic] = {
            topicId: topic,
            lessonsCompleted: 1,
            quizzesTaken: 1,
            avgScore: 80,
            lastPracticed: Date.now(),
            updatedAt: Date.now()
          };

          completedLevels.forEach(lvl => {
            const key = `${topic}_${lvl}`;
            gProgress[key] = {
              topicId: key,
              lessonsCompleted: 1,
              quizzesTaken: 1,
              avgScore: 90,
              lastPracticed: Date.now(),
              updatedAt: Date.now()
            };
          });
        }
      });

      window.GrammarManager.setGrammarProgressMap(gProgress);
    }

    // Set test taken flag
    localStorage.setItem("voc_placement_test_taken", "true");
  }

  function finishTest() {
    closePlacementTest();
    
    // Hide the banner
    const banner = document.getElementById("dashboard-placement-banner");
    if (banner) banner.style.display = "none";

    // Refresh UI components
    if (window.renderDashboard) window.renderDashboard();
    if (window.renderDictionary) window.renderDictionary();
    if (window.updateLevelAssessmentUI) window.updateLevelAssessmentUI();
  }

  // Auto-init on script load/DOM load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPlacementTest);
  } else {
    initPlacementTest();
  }

  // Hook to window for manual settings resets
  window.resetPlacementTest = function () {
    localStorage.removeItem("voc_placement_test_taken");
    initPlacementTest();
  };
})();
