(function () {
  const PLACEMENT_QUESTIONS = [
    // A1 (10 Questions)
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
      level: "A1",
      question: "What does the Russian word 'Спасибо' mean?",
      choices: ["Goodbye", "Thank you", "Hello (informal)", "Please"],
      answer: "Thank you"
    },
    {
      id: 4,
      level: "A1",
      question: "What does the Russian word 'Книга' mean?",
      choices: ["Book", "Pen", "Notebook", "Pencil"],
      answer: "Book"
    },
    {
      id: 5,
      level: "A1",
      question: "Which word means 'Yes' in Russian?",
      choices: ["Нет", "Да", "И", "Но"],
      answer: "Да"
    },
    {
      id: 6,
      level: "A1",
      question: "How do you say 'How are you?' in Russian?",
      choices: ["Как дела?", "Кто это?", "Где это?", "Что это?"],
      answer: "Как дела?"
    },
    {
      id: 7,
      level: "A1",
      question: "Translate 'What is your name?' (informal) to Russian:",
      choices: ["Как тебя зовут?", "Как вас зовут?", "Кто ты?", "Как дела?"],
      answer: "Как тебя зовут?"
    },
    {
      id: 8,
      level: "A1",
      question: "Choose the correct translation: 'I speak Russian.'",
      choices: ["Я говорю по-русски", "Я знаю по-русски", "Я пишу по-русски", "Я читаю по-русски"],
      answer: "Я говорю по-русски"
    },
    {
      id: 9,
      level: "A1",
      question: "What does 'Мама' mean?",
      choices: ["Mother", "Father", "Sister", "Brother"],
      answer: "Mother"
    },
    {
      id: 10,
      level: "A1",
      question: "Which phrase means 'Goodbye' in Russian?",
      choices: ["До свидания", "Пожалуйста", "Привет", "Здравствуйте"],
      answer: "До свидания"
    },

    // A2 (10 Questions)
    {
      id: 11,
      level: "A2",
      question: "Identify the correct form of the adjective in: 'Это _____ книга.'",
      choices: ["новый", "новое", "новая", "новые"],
      answer: "новая"
    },
    {
      id: 12,
      level: "A2",
      question: "How do you say 'Where is the station?' in Russian?",
      choices: ["Где вокзал?", "Как дела?", "Где метро?", "Кто это?"],
      answer: "Где вокзал?"
    },
    {
      id: 13,
      level: "A2",
      question: "Complete the sentence: 'Он _____ говорит по-русски.' (He speaks Russian well)",
      choices: ["хорошо", "хороший", "хорошие", "хорошая"],
      answer: "хорошо"
    },
    {
      id: 14,
      level: "A2",
      question: "Choose the correct preposition: 'Я живу _____ Москве.' (I live in Moscow)",
      choices: ["в", "на", "о", "к"],
      answer: "в"
    },
    {
      id: 15,
      level: "A2",
      question: "Choose the correct form of the pronoun: '_____ нравится эта музыка.' (I like this music)",
      choices: ["Я", "Меня", "Мне", "Мной"],
      answer: "Мне"
    },
    {
      id: 16,
      level: "A2",
      question: "Complete the sentence: 'Мы _____ в кино.' (We are going to the cinema)",
      choices: ["идём", "ходим", "едем", "ездим"],
      answer: "идём"
    },
    {
      id: 17,
      level: "A2",
      question: "Complete the sentence: 'Мой брат — _____.' (My brother is a student)",
      choices: ["студент", "студенты", "студентка", "студентом"],
      answer: "студент"
    },
    {
      id: 18,
      level: "A2",
      question: "Complete the sentence: 'Она пьёт _____.' (She drinks tea)",
      choices: ["чай", "чая", "чаю", "чаем"],
      answer: "чай"
    },
    {
      id: 19,
      level: "A2",
      question: "Choose the correct form of the adjective: 'Это _____ город.' (This is a beautiful city)",
      choices: ["красивый", "красивая", "красивое", "красивые"],
      answer: "красивый"
    },
    {
      id: 20,
      level: "A2",
      question: "Choose the correct phrase for 'I have a cat':",
      choices: ["У меня есть кошка", "Я имею кошку", "Мне есть кошка", "У меня кошка есть"],
      answer: "У меня есть кошка"
    },

    // B1 (10 Questions)
    {
      id: 21,
      level: "B1",
      question: "Which grammatical case is used after the preposition 'без' (without)?",
      choices: ["Nominative", "Genitive", "Accusative", "Dative"],
      answer: "Genitive"
    },
    {
      id: 22,
      level: "B1",
      question: "Complete the sentence with the correct verb form: 'Он _____ книгу весь вечер.' (He was reading)",
      choices: ["читал", "читать", "прочитает", "прочитал"],
      answer: "читал"
    },
    {
      id: 23,
      level: "B1",
      question: "Choose the correct preposition: 'Мы встретимся _____ субботу.' (We will meet on Saturday)",
      choices: ["в", "на", "о", "с"],
      answer: "в"
    },
    {
      id: 24,
      level: "B1",
      question: "Choose the correct pronoun form: 'Я позвоню _____ завтра.' (I will call you tomorrow)",
      choices: ["тебя", "тобой", "тебе", "о тебе"],
      answer: "тебе"
    },
    {
      id: 25,
      level: "B1",
      question: "Complete the sentence: 'Она интересуется _____.' (She is interested in music)",
      choices: ["музыка", "музыку", "музыкой", "музыке"],
      answer: "музыкой"
    },
    {
      id: 26,
      level: "B1",
      question: "Complete the sentence: 'Они уже _____ статью.' (They have already read/finished the article)",
      choices: ["читали", "прочитали", "будут читать", "прочитают"],
      answer: "прочитали"
    },
    {
      id: 27,
      level: "B1",
      question: "Choose the correct imperative: '_____ мне этот карандаш, пожалуйста.' (Give)",
      choices: ["Дай", "Дайте", "Давай", "Давать"],
      answer: "Дай"
    },
    {
      id: 28,
      level: "B1",
      question: "Complete the sentence: 'Он _____ своего брата.' (He is older than his brother)",
      choices: ["старше", "более старый", "самый старый", "старее"],
      answer: "старше"
    },
    {
      id: 29,
      level: "B1",
      question: "Complete the sentence: 'Если завтра _____ хорошая погода, мы пойдём гулять.'",
      choices: ["будет", "есть", "была", "будем"],
      answer: "будет"
    },
    {
      id: 30,
      level: "B1",
      question: "Complete the sentence: 'Я часто _____ на метро.' (I often ride/go by metro)",
      choices: ["еду", "езжу", "хожу", "иду"],
      answer: "езжу"
    },

    // B2 (10 Questions)
    {
      id: 31,
      level: "B2",
      question: "Choose the correct verb of motion: 'Каждое утро я _____ в школу пешком.' (I walk)",
      choices: ["иду", "хожу", "еду", "езжу"],
      answer: "хожу"
    },
    {
      id: 32,
      level: "B2",
      question: "Complete the sentence: 'Девочка, _____ книгу у окна, была очень внимательна.' (reading)",
      choices: ["читающая", "читающий", "читающее", "читающие"],
      answer: "читающая"
    },
    {
      id: 33,
      level: "B2",
      question: "Choose the correct conditional form: 'Если бы я знал, я бы _____.' (came/would have come)",
      choices: ["пришёл", "приду", "приходить", "пришли"],
      answer: "пришёл"
    },
    {
      id: 34,
      level: "B2",
      question: "Complete the sentence with the correct verb of motion: 'Он _____ домой очень поздно вчера.' (He came/arrived)",
      choices: ["шёл", "пришёл", "пошёл", "ходил"],
      answer: "пришёл"
    },
    {
      id: 35,
      level: "B2",
      question: "Complete the sentence: 'Она пишет письмо _____.' (She writes a letter with a pen)",
      choices: ["ручка", "ручку", "ручкой", "ручке"],
      answer: "ручкой"
    },
    {
      id: 36,
      level: "B2",
      question: "Choose the correct pronoun form: 'Мы очень рады _____ успеху.' (We are very glad of your success)",
      choices: ["вашего", "вашему", "вашим", "вашем"],
      answer: "вашему"
    },
    {
      id: 37,
      level: "B2",
      question: "Complete the sentence: 'Он _____ помочь нам.' (He agreed to help us)",
      choices: ["согласился", "согласилась", "согласились", "согласиться"],
      answer: "согласился"
    },
    {
      id: 38,
      level: "B2",
      question: "Complete the sentence: 'Этот фильм _____ посмотреть.' (This movie is worth watching)",
      choices: ["стоит", "должен", "нужно", "может"],
      answer: "стоит"
    },
    {
      id: 39,
      level: "B2",
      question: "Complete the sentence: 'Я _____ вставать рано утром.' (I got used to)",
      choices: ["привык", "привыкла", "привыкли", "привыкнуть"],
      answer: "привык"
    },
    {
      id: 40,
      level: "B2",
      question: "Complete the sentence: '_____ дождь, мы пошли гулять.' (Despite the rain)",
      choices: ["Несмотря на", "Из-за", "Благодаря", "В связи с"],
      answer: "Несмотря на"
    },

    // C1 (10 Questions)
    {
      id: 41,
      level: "C1",
      question: "Choose the correct verbal adverb (gerund): '_____, я встретил друга.' (While walking down the street)",
      choices: ["Идя по улице", "Ходя по улице", "Шёл по улице", "Прогулявшись по улице"],
      answer: "Идя по улице"
    },
    {
      id: 42,
      level: "C1",
      question: "Choose the correct collective numeral: 'У неё _____ детей.' (three children)",
      choices: ["трое", "три", "тремя", "троих"],
      answer: "трое"
    },
    {
      id: 43,
      level: "C1",
      question: "Complete the sentence with the correct preposition: 'Он работает _____ фабрике.' (at the factory)",
      choices: ["на", "в", "при", "у"],
      answer: "на"
    },
    {
      id: 44,
      level: "C1",
      question: "Choose the correct passive participle form: 'Решение, _____ на собрании, устроило всех.' (taken/adopted)",
      choices: ["принятое", "принятый", "принятая", "принятые"],
      answer: "принятое"
    },
    {
      id: 45,
      level: "C1",
      question: "Choose the correct preposition: '_____ часа мы обсуждали новый план.' (During / In the course of)",
      choices: ["В течение", "В течении", "За время", "В продолжении"],
      answer: "В течение"
    },
    {
      id: 46,
      level: "C1",
      question: "Choose the correct preposition: '_____ помощи друга, я сдал сложный экзамен.' (Thanks to)",
      choices: ["Благодаря", "Из-за", "Несмотря на", "Вследствие"],
      answer: "Благодаря"
    },
    {
      id: 47,
      level: "C1",
      question: "Complete the sentence: 'Он говорит так, _____ знает абсолютно всё.' (as if)",
      choices: ["будто", "что", "чтобы", "как"],
      answer: "будто"
    },
    {
      id: 48,
      level: "C1",
      question: "Complete the impersonal sentence: 'Мне не _____.' (I don't feel like sleeping)",
      choices: ["спится", "хочется спать", "сплю", "спать"],
      answer: "спится"
    },
    {
      id: 49,
      level: "C1",
      question: "Complete the sentence with the correct preposition: 'Она сделала это _____ своей семьи.' (for the sake of)",
      choices: ["ради", "для", "за", "ради интересов"],
      answer: "ради"
    },
    {
      id: 50,
      level: "C1",
      question: "Complete the double conjunction: 'Чем больше я учусь, _____ лучше понимаю русский язык.'",
      choices: ["тем", "то", "так", "чем"],
      answer: "тем"
    },

    // C2 (10 Questions)
    {
      id: 51,
      level: "C2",
      question: "Complete the sentence: 'Она не _____ меня в свои дальнейшие планы.' (did not initiate/let in)",
      choices: ["посвятила", "посвятил", "посвятить", "посвятили"],
      answer: "посвятила"
    },
    {
      id: 52,
      level: "C2",
      question: "Choose the correct particle: 'Как он _____ старался, ничего не выходило.' (No matter how hard he tried)",
      choices: ["ни", "не", "ли", "бы"],
      answer: "ни"
    },
    {
      id: 53,
      level: "C2",
      question: "Complete the idiom: 'Он сказал мне правду в _____.' (He told me the truth to my face)",
      choices: ["глаза", "лицо", "лоб", "уши"],
      answer: "глаза"
    },
    {
      id: 54,
      level: "C2",
      question: "Complete the sentence: 'Он _____ приедет сегодня.' (He is unlikely/hardly going to arrive today)",
      choices: ["вряд ли", "едва ли", "почти не", "навряд"],
      answer: "вряд ли"
    },
    {
      id: 55,
      level: "C2",
      question: "Choose the correct conditional phrasing: '_____ глупо отказываться от такого предложения.' (It would be)",
      choices: ["Было бы", "Есть", "Будет", "Было"],
      answer: "Было бы"
    },
    {
      id: 56,
      level: "C2",
      question: "Complete the idiom: 'Давай сделаем это во что бы то _____.' (at all costs / no matter what)",
      choices: ["ни стало", "не стало", "ни было", "не было"],
      answer: "ни стало"
    },
    {
      id: 57,
      level: "C2",
      question: "Complete the idiom: 'В этой статье речь _____ о глобальном потеплении.' (It is about / The issue is)",
      choices: ["идёт", "говорится", "пишется", "ведет"],
      answer: "идёт"
    },
    {
      id: 58,
      level: "C2",
      question: "Complete the idiom: 'Она сделала _____, что не заметила нас.' (She pretended)",
      choices: ["вид", "форму", "маску", "лицо"],
      answer: "вид"
    },
    {
      id: 59,
      level: "C2",
      question: "Choose the correct particle: 'Что бы _____ случилось, сохраняй спокойствие.' (Whatever happens)",
      choices: ["ни", "не", "ли", "бы"],
      answer: "ни"
    },
    {
      id: 60,
      level: "C2",
      question: "Complete the impersonal idiom: 'Ему _____.' (He feels under the weather / sick)",
      choices: ["нездоровится", "болеет", "плохо", "нездоровится ему"],
      answer: "нездоровится"
    }
  ];

  let selectedQuestions = [];
  let currentQuestionIndex = 0; // 0 to 49
  let correctAnswersCount = 0;
  let correctByLevel = { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0 };
  let currentQuestion = null;
  let pendingPlacement = null; // { level, xp }

  function initPlacementTest() {
    const banner = document.getElementById("dashboard-placement-banner");
    const startBannerBtn = document.getElementById("placement-banner-start-btn");
    const startSettingsBtn = document.getElementById("settings-placement-test-btn");
    const closeBtn = document.getElementById("modal-placement-close");
    const startTestBtn = document.getElementById("placement-start-test-btn");
    const applyBtn = document.getElementById("placement-apply-btn");
    const skipBtn = document.getElementById("placement-skip-btn");

    if (!banner) return;

    // The assessment test card is a permanent dashboard component.
    banner.style.display = "flex";

    // Start buttons
    if (startBannerBtn) {
      startBannerBtn.replaceWith(startBannerBtn.cloneNode(true));
      document.getElementById("placement-banner-start-btn").addEventListener("click", openPlacementTest);
    }
    if (startSettingsBtn) {
      startSettingsBtn.replaceWith(startSettingsBtn.cloneNode(true));
      document.getElementById("settings-placement-test-btn").addEventListener("click", () => {
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

    // Apply / Skip button triggers
    if (applyBtn) {
      applyBtn.replaceWith(applyBtn.cloneNode(true));
      document.getElementById("placement-apply-btn").addEventListener("click", handleApplyPlacement);
    }

    if (skipBtn) {
      skipBtn.replaceWith(skipBtn.cloneNode(true));
      document.getElementById("placement-skip-btn").addEventListener("click", handleSkipPlacement);
    }
  }

  function openPlacementTest() {
    selectedQuestions = [];
    currentQuestionIndex = 0;
    correctAnswersCount = 0;
    correctByLevel = { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0 };
    pendingPlacement = null;

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

  function shuffleArray(array) {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function startTest() {
    // Five questions per CEFR band, with early exit after the first failed band.
    const a1Pool = shuffleArray(PLACEMENT_QUESTIONS.filter(q => q.level === "A1")).slice(0, 5);
    const a2Pool = shuffleArray(PLACEMENT_QUESTIONS.filter(q => q.level === "A2")).slice(0, 5);
    const b1Pool = shuffleArray(PLACEMENT_QUESTIONS.filter(q => q.level === "B1")).slice(0, 5);
    const b2Pool = shuffleArray(PLACEMENT_QUESTIONS.filter(q => q.level === "B2")).slice(0, 5);
    const c1Pool = shuffleArray(PLACEMENT_QUESTIONS.filter(q => q.level === "C1")).slice(0, 5);
    const c2Pool = shuffleArray(PLACEMENT_QUESTIONS.filter(q => q.level === "C2")).slice(0, 5);

    // Concatenate sequentially to display from easiest to hardest
    selectedQuestions = [...a1Pool, ...a2Pool, ...b1Pool, ...b2Pool, ...c1Pool, ...c2Pool];
    
    currentQuestionIndex = 0;
    correctAnswersCount = 0;
    correctByLevel = { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0 };
    pendingPlacement = null;

    document.getElementById("placement-intro-view").style.display = "none";
    document.getElementById("placement-question-view").style.display = "flex";
    document.getElementById("placement-result-view").style.display = "none";
    loadQuestion();
  }

  function loadQuestion() {
    currentQuestion = selectedQuestions[currentQuestionIndex];
    if (!currentQuestion) {
      console.error("[PlacementTest] No question found at index:", currentQuestionIndex);
      showResults();
      return;
    }

    const currentQuestionStep = currentQuestionIndex + 1;

    // Update step and badge
    document.getElementById("placement-question-step").innerText = `Question ${currentQuestionStep} of ${selectedQuestions.length}`;
    document.getElementById("placement-question-level").innerText = `Level ${currentQuestion.level}`;
    
    // Progress bar
    const pct = (currentQuestionStep / selectedQuestions.length) * 100;
    document.getElementById("placement-progress-bar").style.width = `${pct}%`;

    // Question text
    document.getElementById("placement-question-text").innerText = currentQuestion.question;

    // Choices
    const container = document.getElementById("placement-choices-container");
    container.innerHTML = "";

    const shuffledChoices = shuffleArray(currentQuestion.choices);
    shuffledChoices.forEach(choice => {
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
    const q = currentQuestion;
    const container = document.getElementById("placement-choices-container");
    const buttons = container.querySelectorAll(".choice-btn");
    
    // Disable all options
    buttons.forEach(btn => btn.disabled = true);

    const isCorrect = choice === q.answer;
    const animationsEnabled = window.SRS ? window.SRS.getSetting("animationsEnabled", true) : true;

    if (isCorrect) {
      correctAnswersCount++;
      correctByLevel[q.level]++;
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
      const completedBand = currentQuestionIndex % 5 === 0;
      const failedBand = completedBand && (correctByLevel[q.level] || 0) < 3;
      if (failedBand || currentQuestionIndex >= selectedQuestions.length) {
        showResults();
      } else {
        loadQuestion();
      }
    }, animationsEnabled ? 350 : 50);
  }

  function showResults() {
    document.getElementById("placement-question-view").style.display = "none";
    document.getElementById("placement-result-view").style.display = "flex";

    const levels = ["A1", "A2", "B1", "B2", "C1", "C2"];
    let finalLevelIndex = -1; // failing the first band is honestly reported as Pre-A1
    
    // CEFR levels are cumulative: a higher placement requires passing every lower band.
    for (let i = 0; i < levels.length; i++) {
      const lvl = levels[i];
      const lvlQuestions = selectedQuestions.filter(q => q.level === lvl);
      const lvlCorrect = correctByLevel[lvl] || 0;
      const pct = lvlQuestions.length > 0 ? (lvlCorrect / lvlQuestions.length) * 100 : 0;
      if (pct < 60) break;
      finalLevelIndex = i;
    }

    const level = finalLevelIndex >= 0 ? levels[finalLevelIndex] : "Pre-A1";
    const answeredTotal = Math.min(currentQuestionIndex, selectedQuestions.length);
    let xp = 0;
    let desc = "";
    let avatar = "🐻";

    if (level === "Pre-A1") {
      xp = 50;
      desc = `Your current starting point is Pre-A1 with a total score of ${correctAnswersCount}/${answeredTotal}. We can save this honest baseline and award you a +50 XP welcome reward.`;
    } else if (level === "A1") {
      xp = 50;
      desc = `You placed at level A1 (Beginner) with a total score of ${correctAnswersCount}/${answeredTotal}! We can save A1 as your estimated grammar starting point and award you a kickstart reward of +50 XP!`;
      avatar = "🐻";
    } else if (level === "A2") {
      xp = 200;
      desc = `You placed at level A2 (Elementary) with a total score of ${correctAnswersCount}/${answeredTotal}! We can promote your A1 vocabulary words to Box 3, save A2 as your estimated grammar starting point, and award you +200 XP!`;
      avatar = "🦉";
    } else if (level === "B1") {
      xp = 500;
      desc = `You placed at level B1 (Intermediate) with a total score of ${correctAnswersCount}/${answeredTotal}! We can promote A1/A2 vocabulary words to Box 4, save B1 as your estimated grammar starting point, and award you +500 XP!`;
      avatar = "🤖";
    } else if (level === "B2") {
      xp = 1000;
      desc = `You placed at level B2 (Upper Intermediate) with a total score of ${correctAnswersCount}/${answeredTotal}! We can promote all A1/A2/B1 vocabulary words to Box 5 (Mastered), save ${level} as your estimated grammar starting point, and award you +1000 XP!`;
      avatar = "👑";
    } else if (level === "C1") {
      xp = 1500;
      desc = `You placed at level C1 (Advanced) with a total score of ${correctAnswersCount}/${answeredTotal}! We can promote all A1/A2/B1/B2 vocabulary words to Box 5 (Mastered), save ${level} as your estimated grammar starting point, and award you +1500 XP!`;
      avatar = "🦁";
    } else if (level === "C2") {
      xp = 2000;
      desc = `You placed at level C2 (Proficient) with a total score of ${correctAnswersCount}/${answeredTotal}! We can promote all A1/A2/B1/B2/C1 vocabulary words to Box 5 (Mastered), save ${level} as your estimated grammar starting point, and award you +2000 XP!`;
      avatar = "🧙‍♂️";
    }

    const rewardAlreadyClaimed = localStorage.getItem("voc_placement_reward_claimed") === "true";
    if (rewardAlreadyClaimed) {
      xp = 0;
      desc += " Your one-time placement XP reward has already been claimed; applying this result will only seed previously unstudied progress.";
    }

    document.getElementById("placement-result-avatar").innerText = avatar;
    document.getElementById("placement-result-title").innerText = `Level Assessed: ${level}!`;
    document.getElementById("placement-result-text").innerText = desc;

    const answeredQuestions = selectedQuestions.slice(0, answeredTotal);
    const bandResults = levels.map(band => ({
      level: band,
      correct: correctByLevel[band] || 0,
      total: answeredQuestions.filter(question => question.level === band).length
    })).filter(result => result.total > 0);
    pendingPlacement = { level, xp, bandResults };
  }

  async function handleApplyPlacement() {
    if (!pendingPlacement) return;

    const approved = await window.confirmCustom("Apply this placement result? This will promote eligible vocabulary cards and save an estimated grammar starting level without marking unstudied lessons as mastered. We will back up your current progress first.");
    if (!approved) return;

    try {
      // Back up progress before applying
      const backup = {
        progress: localStorage.getItem("voc_russian_progress") ? JSON.parse(localStorage.getItem("voc_russian_progress")) : null,
        stats: localStorage.getItem("voc_russian_stats") ? JSON.parse(localStorage.getItem("voc_russian_stats")) : null,
        grammarProgress: localStorage.getItem("voc_russian_grammar_progress") ? JSON.parse(localStorage.getItem("voc_russian_grammar_progress")) : null,
        placementRewardClaimed: localStorage.getItem("voc_placement_reward_claimed") === "true",
        placementTestTaken: localStorage.getItem("voc_placement_test_taken") === "true"
      };
      localStorage.setItem("voc_progress_backup_before_placement", JSON.stringify(backup));

      seedProgress(pendingPlacement.level, pendingPlacement.xp, pendingPlacement.bandResults);

      localStorage.setItem("voc_placement_test_taken", "true");
      closePlacementTest();

      if (window.updateSettingsBackupUI) window.updateSettingsBackupUI();
      if (window.refreshAppUI) window.refreshAppUI();
      if (window.renderDashboard) window.renderDashboard();
      if (window.renderDictionary) window.renderDictionary();
      if (window.updateLevelAssessmentUI) window.updateLevelAssessmentUI();

      if (window.SupabaseSync && window.SupabaseSync.connectionState === "connected" && window.SupabaseSync.user) {
        window.SupabaseSync.syncBoth();
      }
    } catch (e) {
      console.error(e);
      alert("Failed to apply seeding: " + e.message);
    }
  }

  function handleSkipPlacement() {
    localStorage.setItem("voc_placement_test_taken", "true");
    closePlacementTest();

    if (window.updateSettingsBackupUI) window.updateSettingsBackupUI();
    if (window.refreshAppUI) window.refreshAppUI();
    if (window.renderDashboard) window.renderDashboard();
    if (window.renderDictionary) window.renderDictionary();
    if (window.updateLevelAssessmentUI) window.updateLevelAssessmentUI();
  }

  function seedProgress(level, xp, bandResults = []) {
    console.log("[PlacementTest] seedProgress started:", level, xp);
    if (!window.SRS) {
      console.error("[PlacementTest] window.SRS is not defined!");
      return;
    }

    try {
      // 1. Seed XP
      console.log("[PlacementTest] Seeding XP:", xp);
      if (xp > 0 && localStorage.getItem("voc_placement_reward_claimed") !== "true") {
        window.SRS.addActivityXP(xp, "placement_reward", { level });
        localStorage.setItem("voc_placement_reward_claimed", "true");
      }
      console.log("[PlacementTest] Seeded XP successfully. Current XP:", window.SRS.getGlobalStats().xp);

      // 2. Seed Vocabulary Cards Box Levels
      console.log("[PlacementTest] Seeding vocabulary...");
      const allWords = [
        ...(window.defaultVocabulary || []),
        ...(window.expandedVocabulary || []),
        ...(window.SRS ? window.SRS.getCustomWordsList() : [])
      ];
      console.log("[PlacementTest] Total words found:", allWords.length);
      const promotions = [];
      allWords.forEach(w => {
        const wLvl = window.SRS.getWordLevel(w);
        let targetBox = 1;

        if (level === "A2" && wLvl === "A1") {
          targetBox = 3;
        } else if (level === "B1" && (wLvl === "A1" || wLvl === "A2")) {
          targetBox = 4;
        } else if (level === "B2" && ["A1", "A2", "B1"].includes(wLvl)) {
          targetBox = 5;
        } else if (level === "C1" && ["A1", "A2", "B1", "B2"].includes(wLvl)) {
          targetBox = 5;
        } else if (level === "C2" && ["A1", "A2", "B1", "B2", "C1"].includes(wLvl)) {
          targetBox = 5;
        }

        if (targetBox > 1) promotions.push({ id: w.id, targetBox });
      });
      window.SRS.promoteCardsToBoxes(promotions);
      console.log("[PlacementTest] Seeded vocabulary successfully.");
    } catch (e) {
      console.error("[PlacementTest] Error seeding progress:", e);
    }

    // Placement is broad evidence, not proof that every individual grammar
    // lesson or topic has been mastered. Keep it as a labelled estimate and let
    // topic mastery come only from topic-specific quiz answers.
    if (window.GrammarManager) {
      window.GrammarManager.recordPlacementAssessment(level, bandResults);
    }

    // Set test taken flag
    localStorage.setItem("voc_placement_test_taken", "true");
  }

  // Hook to window for manual settings resets
  window.resetPlacementTest = function () {
    localStorage.removeItem("voc_placement_test_taken");
    initPlacementTest();
  };

  // Auto-init on script load/DOM load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPlacementTest);
  } else {
    initPlacementTest();
  }
})();
