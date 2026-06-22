// VocRussian Cyrillic Alphabet Practice Module

(function () {
  const ALPHABET_DB = [
    { char: "А", lower: "а", sound: "ah", example: "Арбуз", translation: "watermelon", audioText: "А" },
    { char: "Б", lower: "б", sound: "b", example: "Бабушка", translation: "grandmother", audioText: "Б" },
    { char: "В", lower: "в", sound: "v", example: "Вода", translation: "water", audioText: "В" },
    { char: "Г", lower: "г", sound: "g", example: "Город", translation: "city", audioText: "Г" },
    { char: "Д", lower: "д", sound: "d", example: "Дом", translation: "house", audioText: "Д" },
    { char: "Е", lower: "е", sound: "yeh", example: "Еда", translation: "food", audioText: "Е" },
    { char: "Ё", lower: "ё", sound: "yoh", example: "Ёлка", translation: "fir tree", audioText: "Ё" },
    { char: "Ж", lower: "ж", sound: "zh", example: "Жук", translation: "beetle", audioText: "Ж" },
    { char: "З", lower: "з", sound: "z", example: "Звезда", translation: "star", audioText: "З" },
    { char: "И", lower: "и", sound: "ee", example: "Игра", translation: "game", audioText: "И" },
    { char: "Й", lower: "й", sound: "y", example: "Йогурт", translation: "yogurt", audioText: "Й" },
    { char: "К", lower: "к", sound: "k", example: "Кот", translation: "cat", audioText: "К" },
    { char: "Л", lower: "л", sound: "l", example: "Луна", translation: "moon", audioText: "Л" },
    { char: "М", lower: "м", sound: "m", example: "Мама", translation: "mother", audioText: "М" },
    { char: "Н", lower: "н", sound: "n", example: "Ночь", translation: "night", audioText: "Н" },
    { char: "О", lower: "о", sound: "oh", example: "Окно", translation: "window", audioText: "О" },
    { char: "П", lower: "п", sound: "p", example: "Папа", translation: "father", audioText: "П" },
    { char: "Р", lower: "р", sound: "r", example: "Рыба", translation: "fish", audioText: "Р" },
    { char: "С", lower: "с", sound: "s", example: "Солнце", translation: "sun", audioText: "С" },
    { char: "Т", lower: "т", sound: "t", example: "Телефон", translation: "telephone", audioText: "Т" },
    { char: "У", lower: "у", sound: "oo", example: "Утро", translation: "morning", audioText: "У" },
    { char: "Ф", lower: "ф", sound: "f", example: "Флаг", translation: "flag", audioText: "Ф" },
    { char: "Х", lower: "х", sound: "kh", example: "Хлеб", translation: "bread", audioText: "Х" },
    { char: "Ц", lower: "ц", sound: "ts", example: "Цветы", translation: "flowers", audioText: "Ц" },
    { char: "Ч", lower: "ч", sound: "ch", example: "Чай", translation: "tea", audioText: "Ч" },
    { char: "Ш", lower: "ш", sound: "sh", example: "Школа", translation: "school", audioText: "Ш" },
    { char: "Щ", lower: "щ", sound: "shch", example: "Щётка", translation: "brush", audioText: "Щ" },
    { char: "Ъ", lower: "ъ", sound: "hard sign (silent)", example: "Объявление", translation: "announcement", audioText: "Твёрдый знак" },
    { char: "Ы", lower: "ы", sound: "y (guttural)", example: "Мыло", translation: "soap", audioText: "Ы" },
    { char: "Ь", lower: "ь", sound: "soft sign (silent)", example: "День", translation: "day", audioText: "Мягкий знак" },
    { char: "Э", lower: "э", sound: "eh", example: "Эхо", translation: "echo", audioText: "Э" },
    { char: "Ю", lower: "ю", sound: "yoo", example: "Юбка", translation: "skirt", audioText: "Ю" },
    { char: "Я", lower: "я", sound: "yah", example: "Яблоко", translation: "apple", audioText: "Я" }
  ];

  // Game state variables
  let isInitialized = false;
  let gameActive = false;
  let gameMode = "sound"; // 'sound' | 'typing'
  let currentQuestionIndex = 0;
  let currentScore = 0;
  let totalQuestions = 10;
  let currentTargetLetter = null;
  let currentChoices = [];

  const AlphabetManager = {
    init: function () {
      if (isInitialized) return;
      
      this.renderGrid();
      this.setupEvents();
      this.setupCustomKeyboard();
      isInitialized = true;
    },

    renderGrid: function () {
      const container = document.getElementById("alphabet-grid-container");
      if (!container) return;

      let html = "";
      ALPHABET_DB.forEach(item => {
        html += `
          <div class="card alphabet-letter-card" style="display: flex; flex-direction: column; align-items: center; text-align: center; padding: 1rem; position: relative; border: 1px solid var(--border-glass); background: var(--bg-input); transition: var(--transition-fast); border-radius: var(--border-radius-md);">
            <div style="font-size: 1.75rem; font-family: var(--font-heading); font-weight: 800; color: var(--color-text-main); margin-bottom: 0.15rem;">
              ${item.char} <span style="font-size: 1.25rem; font-weight: 500; opacity: 0.7;">${item.lower}</span>
            </div>
            <div style="font-size: 0.8rem; color: var(--color-primary-hover); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem;">
              /${item.sound}/
            </div>
            <div style="font-size: 0.75rem; color: var(--color-text-muted); line-height: 1.3; margin-top: auto; width: 100%; border-top: 1px solid var(--border-glass); padding-top: 0.5rem;">
              <div style="color: var(--color-text-main); font-weight: bold; cursor: pointer;" class="alphabet-speak-word" data-word="${item.example}">${item.example}</div>
              <div style="font-size: 0.7rem;">(${item.translation})</div>
            </div>
            <button class="vocab-action-btn alphabet-play-btn" data-sound="${item.audioText}" style="position: absolute; top: 8px; right: 8px; font-size: 0.9rem;" title="Play letter sound">🔊</button>
          </div>
        `;
      });
      container.innerHTML = html;

      // Bind Grid Audios
      container.querySelectorAll(".alphabet-play-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const sound = btn.getAttribute("data-sound");
          this.playLetterSound(sound);
        });
      });

      container.querySelectorAll(".alphabet-speak-word").forEach(wordEl => {
        wordEl.addEventListener("click", (e) => {
          e.stopPropagation();
          const word = wordEl.getAttribute("data-word");
          this.playLetterSound(word);
        });
      });
    },

    playLetterSound: function (text) {
      if (window.AudioEngine) {
        window.AudioEngine.speak(text);
      }
    },

    setupEvents: function () {
      // Toggle Quiz Panel
      const quizBtn = document.getElementById("alphabet-quiz-btn");
      const quizPanel = document.getElementById("alphabet-quiz-panel");
      const closeBtn = document.getElementById("alphabet-quiz-close-btn");

      if (quizBtn && quizPanel) {
        quizBtn.addEventListener("click", () => {
          if (!gameActive) {
            this.startNewGame();
          }
          quizPanel.style.display = "block";
          quizBtn.style.display = "none";
          quizPanel.scrollIntoView({ behavior: "smooth" });
        });
      }

      if (closeBtn && quizPanel && quizBtn) {
        closeBtn.addEventListener("click", () => {
          quizPanel.style.display = "none";
          quizBtn.style.display = "block";
          gameActive = false;
        });
      }

      // Game mode toggles
      const soundModeBtn = document.getElementById("game-mode-sound");
      const typingModeBtn = document.getElementById("game-mode-typing");

      if (soundModeBtn && typingModeBtn) {
        soundModeBtn.addEventListener("click", () => {
          soundModeBtn.classList.add("active");
          soundModeBtn.style.background = "var(--color-primary)";
          soundModeBtn.style.color = "var(--color-text-main)";
          typingModeBtn.classList.remove("active");
          typingModeBtn.style.background = "transparent";
          typingModeBtn.style.color = "var(--color-text-muted)";
          
          gameMode = "sound";
          this.startNewGame();
        });

        typingModeBtn.addEventListener("click", () => {
          typingModeBtn.classList.add("active");
          typingModeBtn.style.background = "var(--color-primary)";
          typingModeBtn.style.color = "var(--color-text-main)";
          soundModeBtn.classList.remove("active");
          soundModeBtn.style.background = "transparent";
          soundModeBtn.style.color = "var(--color-text-muted)";
          
          gameMode = "typing";
          this.startNewGame();
        });
      }

      // Speaker click in game
      const gameSpeaker = document.getElementById("alphabet-quiz-question-sound");
      if (gameSpeaker) {
        gameSpeaker.addEventListener("click", () => {
          if (currentTargetLetter) {
            this.playLetterSound(currentTargetLetter.audioText);
          }
        });
      }

      // Typing Mode submit
      const typingSubmit = document.getElementById("alphabet-typing-submit-btn");
      const typingInput = document.getElementById("alphabet-typing-input");
      if (typingSubmit && typingInput) {
        typingSubmit.addEventListener("click", () => {
          this.checkTypingAnswer();
        });
        typingInput.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            this.checkTypingAnswer();
          }
        });
      }
    },

    setupCustomKeyboard: function () {
      const keyboard = document.getElementById("alphabet-custom-keyboard");
      if (!keyboard) return;

      keyboard.innerHTML = "";
      // All 33 Cyrillic lowercase keys
      const keys = ["а", "б", "в", "г", "д", "е", "ё", "ж", "з", "и", "й", "к", "л", "м", "н", "о", "п", "р", "с", "т", "у", "ф", "х", "ц", "ч", "ш", "щ", "ъ", "ы", "ь", "э", "ю", "я"];
      
      keys.forEach(k => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "btn btn-secondary";
        btn.style.padding = "0.4rem 0.2rem";
        btn.style.fontSize = "1.05rem";
        btn.style.fontWeight = "bold";
        btn.style.fontFamily = "var(--font-heading)";
        btn.textContent = k;
        btn.addEventListener("click", () => {
          const input = document.getElementById("alphabet-typing-input");
          if (input) {
            input.value += k;
            input.focus();
          }
        });
        keyboard.appendChild(btn);
      });
    },

    startNewGame: function () {
      gameActive = true;
      currentQuestionIndex = 0;
      currentScore = 0;
      
      this.updateScoreDisplay();
      this.nextQuestion();
    },

    updateScoreDisplay: function () {
      const scoreDisp = document.getElementById("alphabet-quiz-score-display");
      const progText = document.getElementById("alphabet-quiz-progress-text");
      
      if (scoreDisp) scoreDisp.textContent = `Score: ${currentScore} / ${currentQuestionIndex}`;
      if (progText) progText.textContent = `Question ${Math.min(totalQuestions, currentQuestionIndex + 1)} / ${totalQuestions}`;
    },

    nextQuestion: function () {
      if (currentQuestionIndex >= totalQuestions) {
        this.endGame();
        return;
      }

      this.updateScoreDisplay();
      
      // Select target letter
      currentTargetLetter = ALPHABET_DB[Math.floor(Math.random() * ALPHABET_DB.length)];

      const qSound = document.getElementById("alphabet-quiz-question-sound");
      const qChar = document.getElementById("alphabet-quiz-question-char");
      const choicesContainer = document.getElementById("alphabet-quiz-choices");
      const typingContainer = document.getElementById("alphabet-quiz-typing-container");
      const typingInput = document.getElementById("alphabet-typing-input");
      const feedback = document.getElementById("alphabet-quiz-feedback");
      const instruction = document.getElementById("alphabet-quiz-instruction");

      if (feedback) feedback.innerHTML = "";
      if (typingInput) typingInput.value = "";
      
      // Auto-play audio
      setTimeout(() => {
        if (currentTargetLetter) this.playLetterSound(currentTargetLetter.audioText);
      }, 300);

      if (gameMode === "sound") {
        // Mode 1: Sound Matching Choice Mode
        if (qSound) qSound.style.display = "block";
        if (qChar) qChar.style.display = "none";
        if (choicesContainer) choicesContainer.style.display = "grid";
        if (typingContainer) typingContainer.style.display = "none";
        if (instruction) instruction.textContent = "Click the speaker to hear the sound, then choose the matching letter.";

        // Populate multiple choices
        const choices = [currentTargetLetter];
        while (choices.length < 4) {
          const rand = ALPHABET_DB[Math.floor(Math.random() * ALPHABET_DB.length)];
          if (!choices.find(c => c.char === rand.char)) {
            choices.push(rand);
          }
        }
        
        // Shuffle choices
        choices.sort(() => Math.random() - 0.5);
        currentChoices = choices;

        if (choicesContainer) {
          choicesContainer.innerHTML = "";
          choices.forEach(choice => {
            const btn = document.createElement("button");
            btn.className = "btn btn-secondary";
            btn.style.padding = "1rem";
            btn.style.fontSize = "1.5rem";
            btn.style.fontWeight = "800";
            btn.style.fontFamily = "var(--font-heading)";
            btn.textContent = choice.char;
            btn.addEventListener("click", () => this.handleChoiceSelect(btn, choice));
            choicesContainer.appendChild(btn);
          });
        }
      } else {
        // Mode 2: Typing Practice Mode
        if (qSound) qSound.style.display = "block";
        if (qChar) qChar.style.display = "none";
        if (choicesContainer) choicesContainer.style.display = "none";
        if (typingContainer) typingContainer.style.display = "flex";
        if (instruction) instruction.textContent = "Listen to the letter and type it (using keyboard or custom keys below).";
        
        const submitBtn = document.getElementById("alphabet-typing-submit-btn");
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Check Answer";
        }
        if (typingInput) {
          typingInput.disabled = false;
          typingInput.focus();
        }
      }
    },

    handleChoiceSelect: function (btn, selectedChoice) {
      const choicesContainer = document.getElementById("alphabet-quiz-choices");
      if (!choicesContainer) return;
      
      // Disable all choice buttons
      choicesContainer.querySelectorAll("button").forEach(b => b.disabled = true);

      const feedback = document.getElementById("alphabet-quiz-feedback");
      const isCorrect = (selectedChoice.char === currentTargetLetter.char);

      if (isCorrect) {
        currentScore++;
        btn.className = "btn btn-success";
        if (feedback) feedback.innerHTML = `<span style="color:var(--color-success)">✓ Correct! That's ${currentTargetLetter.char} (/${currentTargetLetter.sound}/)</span>`;
        if (window.AudioEngine) window.AudioEngine.playSuccess();
      } else {
        btn.className = "btn btn-danger";
        // Highlight correct button
        choicesContainer.querySelectorAll("button").forEach(b => {
          if (b.textContent === currentTargetLetter.char) {
            b.className = "btn btn-success";
          }
        });
        if (feedback) feedback.innerHTML = `<span style="color:var(--color-error)">✗ Incorrect. The correct answer was ${currentTargetLetter.char} (/${currentTargetLetter.sound}/)</span>`;
        if (window.AudioEngine) window.AudioEngine.playError();
      }

      currentQuestionIndex++;
      this.updateScoreDisplay();
      
      // Advance after 1.8 seconds
      setTimeout(() => {
        this.nextQuestion();
      }, 1800);
    },

    checkTypingAnswer: function () {
      const typingInput = document.getElementById("alphabet-typing-input");
      const submitBtn = document.getElementById("alphabet-typing-submit-btn");
      const feedback = document.getElementById("alphabet-quiz-feedback");

      if (!typingInput || !submitBtn || typingInput.disabled) return;

      const userVal = typingInput.value.trim().toLowerCase();
      if (!userVal) {
        alert("Please type a letter first!");
        return;
      }

      typingInput.disabled = true;
      submitBtn.disabled = true;

      const correctChar = currentTargetLetter.lower.toLowerCase();
      const isCorrect = (userVal === correctChar || userVal === currentTargetLetter.char.toLowerCase());

      if (isCorrect) {
        currentScore++;
        if (feedback) feedback.innerHTML = `<span style="color:var(--color-success)">✓ Correct! It is ${currentTargetLetter.char} (/${currentTargetLetter.sound}/)</span>`;
        if (window.AudioEngine) window.AudioEngine.playSuccess();
      } else {
        if (feedback) feedback.innerHTML = `<span style="color:var(--color-error)">✗ Incorrect. The letter is ${currentTargetLetter.char} (/${currentTargetLetter.sound}/)</span>`;
        if (window.AudioEngine) window.AudioEngine.playError();
      }

      currentQuestionIndex++;
      this.updateScoreDisplay();

      // Advance after 2 seconds
      setTimeout(() => {
        this.nextQuestion();
      }, 2000);
    },

    endGame: function () {
      const qSound = document.getElementById("alphabet-quiz-question-sound");
      const qChar = document.getElementById("alphabet-quiz-question-char");
      const choicesContainer = document.getElementById("alphabet-quiz-choices");
      const typingContainer = document.getElementById("alphabet-quiz-typing-container");
      const feedback = document.getElementById("alphabet-quiz-feedback");
      const instruction = document.getElementById("alphabet-quiz-instruction");

      if (qSound) qSound.style.display = "none";
      if (qChar) qChar.style.display = "block";
      if (qChar) qChar.textContent = "🏆";
      if (choicesContainer) choicesContainer.style.display = "none";
      if (typingContainer) typingContainer.style.display = "none";
      if (instruction) instruction.textContent = "You have completed the Alphabet Quiz!";

      if (feedback) {
        const pct = Math.round((currentScore / totalQuestions) * 100);
        feedback.innerHTML = `
          <div style="font-size:1.2rem; margin-bottom:1rem;">Final Score: <strong>${currentScore} / ${totalQuestions}</strong> (${pct}%)</div>
          <button id="alphabet-quiz-restart-btn" class="btn btn-primary" style="margin-right:0.5rem; padding: 0.5rem 1rem;">Play Again</button>
        `;
        
        document.getElementById("alphabet-quiz-restart-btn").addEventListener("click", () => {
          this.startNewGame();
        });
      }

      if (window.AudioEngine) {
        window.AudioEngine.playLevelUp();
      }
      
      gameActive = false;
    }
  };

  window.AlphabetManager = AlphabetManager;
})();
