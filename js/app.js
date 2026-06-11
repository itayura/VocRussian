// VocRussian Application Controller

(function () {
  // --- STATE VARIABLES ---
  let sessionDeck = [];
  let sessionIndex = 0;
  let currentStudyMode = "flashcard"; // 'flashcard' | 'choice' | 'writing'
  let sessionXpGained = 0;
  let currentCard = null;
  let isCardFlipped = false;
  let studyHistory = []; // Tracks items studied in current session: { wordId, isCorrect }

  // --- SELECTORS ---
  const views = {
    dashboard: document.getElementById("view-dashboard"),
    "study-select": document.getElementById("view-study-select"),
    "study-active": document.getElementById("view-study-active"),
    dictionary: document.getElementById("view-dictionary"),
    sync: document.getElementById("view-sync")
  };

  const navItems = document.querySelectorAll(".nav-item");

  // --- INITIALIZATION ---
  document.addEventListener("DOMContentLoaded", () => {
    // Initialize SRS module
    SRS.init();
    
    // Initialize Supabase Sync connection
    if (window.SupabaseSync) {
      window.SupabaseSync.init();
    }
    
    // Wire UI events
    setupNavigation();
    setupDashboard();
    setupStudySelect();
    setupStudySession();
    setupDictionary();
    setupSync();
    setupModals();
    setupGlobalShortcuts();

    // Setup active DB controls in DOM
    const activeDb = SRS.getActiveDb();
    document.getElementById("study-filter-db").value = activeDb;
    document.getElementById("dict-filter-db").value = activeDb;
    
    updateCategoryDropdowns();
    setupScrollLoading();

    // Global UI refresh callback for sync downloads
    window.refreshAppUI = function () {
      renderDashboard();
      updateCategoryDropdowns();
      if (views.dictionary.classList.contains("active")) {
        renderDictionary();
      }
    };

    // Default view: Dashboard
    switchView("dashboard");
  });

  // --- VIEW ROUTING ---
  function setupNavigation() {
    navItems.forEach(item => {
      const button = item.querySelector("button");
      button.addEventListener("click", () => {
        const target = item.getAttribute("data-target");
        switchView(target);
      });
    });

    // Logo click goes to Dashboard
    document.querySelector(".logo-container").addEventListener("click", () => {
      switchView("dashboard");
    });
  }

  function switchView(targetViewId) {
    // Un-activate all nav links
    navItems.forEach(item => {
      if (item.getAttribute("data-target") === targetViewId) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });

    // Hide all sections, display the active one
    Object.keys(views).forEach(key => {
      if (key === targetViewId) {
        views[key].classList.add("active");
      } else {
        views[key].classList.remove("active");
      }
    });

    // Refresh view states
    if (targetViewId === "dashboard") {
      renderDashboard();
    } else if (targetViewId === "dictionary") {
      renderDictionary();
    } else if (targetViewId === "sync") {
      renderSyncData();
    }
  }

  // --- EXPANSION HELPERS & PAGINATION ---
  function updateCategoryDropdowns() {
    const allWords = SRS.getAllWords();
    const categories = new Set();
    allWords.forEach(w => {
      if (w.category) categories.add(w.category);
    });
    
    const sortedCategories = Array.from(categories).sort();
    
    // Populate Study Select Category filter
    const studySelect = document.getElementById("study-filter-category");
    studySelect.innerHTML = `<option value="all">All Categories</option>`;
    sortedCategories.forEach(cat => {
      const option = document.createElement("option");
      option.value = cat;
      option.innerText = cat;
      studySelect.appendChild(option);
    });
    
    // Populate Dictionary Category filter
    const dictSelect = document.getElementById("dict-filter-category");
    dictSelect.innerHTML = `<option value="all">All Categories</option>`;
    sortedCategories.forEach(cat => {
      const option = document.createElement("option");
      option.value = cat;
      option.innerText = cat;
      dictSelect.appendChild(option);
    });
  }

  let dictCurrentPage = 1;
  const dictPageSize = 40;
  let dictFilteredPool = [];

  function setupScrollLoading() {
    window.addEventListener("scroll", () => {
      // Check if dictionary section is active
      if (!views["dictionary"].classList.contains("active")) return;
      
      // Load next page if scrolled within 400px of bottom
      if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 400) {
        renderNextDictPage();
      }
    });
  }

  // --- DASHBOARD CONTROLLERS ---
  function setupDashboard() {
    const quickStudyBtn = document.getElementById("dash-quick-study-btn");
    quickStudyBtn.addEventListener("click", () => {
      // Setup study filters to defaults
      document.getElementById("study-filter-category").value = "all";
      document.getElementById("study-filter-queue").value = "due";
      document.getElementById("study-deck-size").value = "20";
      
      startStudySession("flashcard");
    });
  }

  function renderDashboard() {
    const stats = SRS.getStatsSummary();
    
    // Update global panel stats
    document.getElementById("stat-due-count").innerText = stats.dueCount;
    document.getElementById("stat-streak").innerText = stats.streak;
    document.getElementById("stat-xp").innerText = stats.xp;
    
    // Quick Study button badges
    document.getElementById("dash-due-btn-badge").innerText = stats.dueCount;
    const quickBtn = document.getElementById("dash-quick-study-btn");
    if (stats.dueCount === 0) {
      quickBtn.classList.remove("btn-primary");
      quickBtn.classList.add("btn-secondary");
      quickBtn.querySelector("span:first-child").innerText = "No Due Cards Today";
    } else {
      quickBtn.classList.add("btn-primary");
      quickBtn.classList.remove("btn-secondary");
      quickBtn.querySelector("span:first-child").innerText = "Start Due Review";
    }

    // Sidebar footer stats
    document.getElementById("sidebar-streak-val").innerText = stats.streak;
    document.getElementById("sidebar-xp-val").innerText = stats.xp;

    // Box distribution layout
    for (let box = 1; box <= 5; box++) {
      const count = stats.boxCounts[box] || 0;
      document.getElementById(`box${box}-count`).innerText = count;
      
      const fillPercent = stats.totalWords > 0 
        ? Math.round((count / stats.totalWords) * 100) 
        : 0;
      document.getElementById(`box${box}-fill`).style.width = fillPercent + "%";
    }

    // Weekly Chart Renderer
    renderWeeklyChart();
  }

  function renderWeeklyChart() {
    const weeklyData = SRS.getLast7DaysXp();
    const barsGroup = document.getElementById("chart-bars-group");
    const labelsGroup = document.getElementById("chart-labels-group");
    
    barsGroup.innerHTML = "";
    labelsGroup.innerHTML = "";
    
    const maxVal = Math.max(...weeklyData.map(d => d.xp), 50); // Minimum scale floor of 50 XP
    
    const chartHeight = 150; // Height of bars grid (from Y=20 to Y=170)
    const barWidth = 32;
    const startX = 55;
    const stepX = 46;

    weeklyData.forEach((day, index) => {
      const x = startX + index * stepX;
      
      // Calculate height relative to maxVal
      const barHeight = (day.xp / maxVal) * chartHeight;
      const y = 170 - barHeight;

      // Create SVG Rect
      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttribute("x", x - barWidth / 2);
      rect.setAttribute("y", y);
      rect.setAttribute("width", barWidth);
      rect.setAttribute("height", barHeight);
      rect.setAttribute("rx", 6);
      rect.setAttribute("class", "chart-bar");
      rect.innerHTML = `<title>${day.xp} XP earned on ${day.label}</title>`;
      
      barsGroup.appendChild(rect);

      // Create Value Text
      if (day.xp > 0) {
        const valText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        valText.setAttribute("x", x);
        valText.setAttribute("y", Math.min(y - 6, 160));
        valText.setAttribute("class", "chart-text");
        valText.setAttribute("style", "fill: var(--color-text-main); font-weight: 600; font-size: 9px;");
        valText.textContent = day.xp;
        barsGroup.appendChild(valText);
      }

      // Create Date label text
      const labelText = document.createElementNS("http://www.w3.org/2000/svg", "text");
      labelText.setAttribute("x", x);
      labelText.setAttribute("y", 188);
      labelText.setAttribute("class", "chart-text");
      labelText.textContent = day.label;
      labelsGroup.appendChild(labelText);
    });
  }

  // --- STUDY SELECTION CONTROLLERS ---
  function setupStudySelect() {
    document.getElementById("mode-select-flashcard").addEventListener("click", () => {
      startStudySession("flashcard");
    });
    document.getElementById("mode-select-choice").addEventListener("click", () => {
      startStudySession("choice");
    });
    document.getElementById("mode-select-writing").addEventListener("click", () => {
      startStudySession("writing");
    });

    // Database Deck Switcher
    document.getElementById("study-filter-db").addEventListener("change", (e) => {
      SRS.setActiveDb(e.target.value);
      // Sync other dropdowns
      document.getElementById("dict-filter-db").value = e.target.value;
      updateCategoryDropdowns();
      renderDashboard();
    });
  }

  // --- STUDY ACTIVE CONTROLLERS ---
  function setupStudySession() {
    const quitBtn = document.getElementById("study-quit-btn");
    quitBtn.addEventListener("click", () => {
      if (confirm("Are you sure you want to quit this study session? Your progress on completed words is already saved.")) {
        switchView("study-select");
      }
    });

    // TTS speaker buttons
    document.getElementById("tts-normal-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      if (currentCard) AudioEngine.speak(currentCard.word, 1.0);
    });
    document.getElementById("tts-slow-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      if (currentCard) AudioEngine.speak(currentCard.word, 0.55);
    });

    // --- FLASHCARD EVENTS ---
    const flashcardClickArea = document.getElementById("flashcard-click-wrapper");
    flashcardClickArea.addEventListener("click", flipFlashcard);

    document.getElementById("fc-star-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      if (currentCard) {
        const starred = SRS.toggleStar(currentCard.id);
        const btn = document.getElementById("fc-star-btn");
        btn.classList.toggle("starred", starred);
        btn.innerText = starred ? "★" : "☆";
      }
    });

    // SRS Scores clicks
    document.getElementById("srs-score-1").addEventListener("click", () => handleSrsScore(false));
    document.getElementById("srs-score-3").addEventListener("click", () => handleSrsScore(true));
    document.getElementById("srs-score-5").addEventListener("click", () => handleSrsScore(true));

    // --- CHOICE MODE EVENTS ---
    document.getElementById("choice-next-btn").addEventListener("click", () => {
      showNextCard();
    });

    // --- WRITING MODE EVENTS ---
    document.getElementById("writing-check-btn").addEventListener("click", () => {
      handleWritingSubmit();
    });

    // --- COMPLETE OVERLAY EVENTS ---
    document.getElementById("complete-home-btn").addEventListener("click", () => {
      switchView("dashboard");
    });
    document.getElementById("complete-again-btn").addEventListener("click", () => {
      switchView("study-select");
    });
  }

  function startStudySession(mode) {
    currentStudyMode = mode;
    
    // Get filter options from DOM
    const categoryFilter = document.getElementById("study-filter-category").value;
    const deckTarget = document.getElementById("study-filter-queue").value;
    const maxDeckSize = parseInt(document.getElementById("study-deck-size").value, 10);

    // Filter cards
    let pool = SRS.getAllWords().filter(w => !SRS.getCardProgress(w.id).hidden);

    // Apply category filter
    if (categoryFilter !== "all") {
      pool = pool.filter(w => w.category === categoryFilter);
    }

    // Apply queue targets
    if (deckTarget === "due") {
      const now = Date.now();
      pool = pool.filter(w => {
        const prog = SRS.getCardProgress(w.id);
        return prog.nextReview <= now;
      });
    } else if (deckTarget === "starred") {
      pool = pool.filter(w => {
        const prog = SRS.getCardProgress(w.id);
        return prog.starred;
      });
    }

    // Check if empty deck
    if (pool.length === 0) {
      alert("No cards match your chosen filters! Try targeting 'Entire Database', selecting a different category, or adding some custom words.");
      return;
    }

    // Shuffle and slice
    pool.sort(() => Math.random() - 0.5);
    sessionDeck = pool.slice(0, maxDeckSize);
    sessionIndex = 0;
    sessionXpGained = 0;
    studyHistory = [];

    // Set deck tag badge
    const badge = document.getElementById("study-deck-type-badge");
    if (deckTarget === "due") badge.innerText = "Due Review";
    else if (deckTarget === "starred") badge.innerText = "Starred Deck";
    else badge.innerText = "Endless Deck";

    // Switch display container
    switchView("study-active");

    // Show correct study module container
    document.getElementById("study-sub-flashcard").style.display = mode === "flashcard" ? "block" : "none";
    document.getElementById("study-sub-choice").style.display = mode === "choice" ? "block" : "none";
    document.getElementById("study-sub-writing").style.display = mode === "writing" ? "block" : "none";
    document.getElementById("study-sub-complete").style.display = "none";

    loadCardInSession();
  }

  function loadCardInSession() {
    currentCard = sessionDeck[sessionIndex];
    isCardFlipped = false;
    
    // Update progress numbers
    document.getElementById("study-index-val").innerText = sessionIndex + 1;
    document.getElementById("study-total-val").innerText = sessionDeck.length;
    
    const progressPercent = ((sessionIndex) / sessionDeck.length) * 100;
    document.getElementById("study-progress-bar").style.width = progressPercent + "%";

    // Stop speaking and audio play
    if (currentStudyMode !== "writing") {
      // Auto-pronounce Russian word on load
      setTimeout(() => {
        AudioEngine.speak(currentCard.word);
      }, 300);
    }

    // Populate mode views
    if (currentStudyMode === "flashcard") {
      setupFlashcardLayout();
    } else if (currentStudyMode === "choice") {
      setupChoiceLayout();
    } else if (currentStudyMode === "writing") {
      setupWritingLayout();
    }
  }

  // Flashcards Setup
  function setupFlashcardLayout() {
    const wrapper = document.getElementById("flashcard-click-wrapper");
    wrapper.classList.remove("flipped");

    document.getElementById("fc-category-front").innerText = currentCard.category;
    document.getElementById("fc-word-front").innerText = currentCard.accented || currentCard.word;
    document.getElementById("fc-word-translit-front").innerText = `[${currentCard.transliteration || ""}]`;

    // Star state
    const prog = SRS.getCardProgress(currentCard.id);
    const starBtn = document.getElementById("fc-star-btn");
    starBtn.classList.toggle("starred", prog.starred);
    starBtn.innerText = prog.starred ? "★" : "☆";

    // Back card details
    document.getElementById("fc-category-back").innerText = currentCard.category;
    document.getElementById("fc-word-translation-back").innerText = currentCard.translation;
    document.getElementById("fc-word-pos-back").innerText = currentCard.pos;
    document.getElementById("fc-word-example-ru-back").innerText = currentCard.exampleRu || "";
    document.getElementById("fc-word-example-en-back").innerText = currentCard.exampleEn || "";

    // Lock rating panel until flipped
    const ratingPanel = document.getElementById("fc-rating-panel");
    ratingPanel.style.opacity = "0.3";
    ratingPanel.style.pointerEvents = "none";
  }

  function flipFlashcard() {
    const wrapper = document.getElementById("flashcard-click-wrapper");
    wrapper.classList.toggle("flipped");
    isCardFlipped = wrapper.classList.contains("flipped");
    
    AudioEngine.playFlip();

    const ratingPanel = document.getElementById("fc-rating-panel");
    if (isCardFlipped) {
      ratingPanel.style.opacity = "1";
      ratingPanel.style.pointerEvents = "auto";
      
      // Secondary pronounce on flip to verify accent audibly
      AudioEngine.speak(currentCard.word);
    } else {
      ratingPanel.style.opacity = "0.3";
      ratingPanel.style.pointerEvents = "none";
    }
  }

  function handleSrsScore(isCorrect) {
    if (!isCardFlipped) return;

    // Log progress
    const result = SRS.scoreCard(currentCard.id, isCorrect);
    sessionXpGained += result.xpGained;

    if (isCorrect) {
      AudioEngine.playSuccess();
    } else {
      AudioEngine.playError();
    }

    showNextCard();
  }

  // Multiple Choice Setup
  function setupChoiceLayout() {
    document.getElementById("choice-category").innerText = currentCard.category;
    document.getElementById("choice-word").innerText = currentCard.accented || currentCard.word;
    document.getElementById("choice-word-translit").innerText = `[${currentCard.transliteration || ""}]`;

    // Hide Next button
    const nextBtn = document.getElementById("choice-next-btn");
    nextBtn.style.display = "none";

    // Build distractors
    const allWords = SRS.getAllWords();
    let distractors = allWords.filter(w => w.id !== currentCard.id && w.category === currentCard.category);
    
    // Fallback if not enough category options
    if (distractors.length < 3) {
      distractors = allWords.filter(w => w.id !== currentCard.id);
    }

    // Shuffle and pick 3
    distractors.sort(() => Math.random() - 0.5);
    const selectedDistractors = distractors.slice(0, 3);

    // Merge correct with incorrect
    const options = [currentCard, ...selectedDistractors].map(w => ({
      id: w.id,
      translation: w.translation
    }));
    options.sort(() => Math.random() - 0.5);

    // Render options
    const container = document.getElementById("choices-container");
    container.innerHTML = "";

    options.forEach((opt, idx) => {
      const btn = document.createElement("button");
      btn.className = "choice-btn";
      btn.innerHTML = `<span>${opt.translation}</span><kbd style="font-size:0.65em;">${idx + 1}</kbd>`;
      
      btn.addEventListener("click", () => handleChoiceSelect(btn, opt.id));
      container.appendChild(btn);
    });
  }

  function handleChoiceSelect(buttonElement, chosenWordId) {
    const isCorrect = (chosenWordId === currentCard.id);
    const container = document.getElementById("choices-container");
    const buttons = container.querySelectorAll(".choice-btn");
    
    // Disable all options
    buttons.forEach(btn => btn.classList.add("disabled"));

    // Score via SRS
    const result = SRS.scoreCard(currentCard.id, isCorrect);
    sessionXpGained += result.xpGained;

    if (isCorrect) {
      buttonElement.classList.add("correct");
      AudioEngine.playSuccess();
    } else {
      buttonElement.classList.add("incorrect");
      // Find and highlight correct answer
      buttons.forEach(btn => {
        // Simple comparison of text
        if (btn.querySelector("span").innerText === currentCard.translation) {
          btn.classList.add("correct");
        }
      });
      AudioEngine.playError();
    }

    // Reveal next button
    document.getElementById("choice-next-btn").style.display = "block";
  }

  // Writing Setup
  function setupWritingLayout() {
    document.getElementById("writing-category").innerText = currentCard.category;
    document.getElementById("writing-prompt-translation").innerText = currentCard.translation;
    document.getElementById("writing-prompt-translit").innerText = `[${currentCard.transliteration || ""}]`;
    document.getElementById("writing-prompt-example-en").innerText = currentCard.exampleEn 
      ? `"${currentCard.exampleEn}"` 
      : "";

    const checkBtn = document.getElementById("writing-check-btn");
    checkBtn.innerText = "Submit Answer";
    checkBtn.className = "btn btn-primary";

    const input = document.getElementById("writing-user-input");
    input.value = "";
    input.disabled = false;
    input.focus();

    const diffContainer = document.getElementById("writing-diff-container");
    diffContainer.style.display = "none";
    diffContainer.innerHTML = "";
  }

  function handleWritingSubmit() {
    const checkBtn = document.getElementById("writing-check-btn");
    const input = document.getElementById("writing-user-input");
    const diffContainer = document.getElementById("writing-diff-container");

    // If button state is "Next Word", click goes forward
    if (checkBtn.innerText === "Next Word") {
      showNextCard();
      return;
    }

    const userVal = input.value.trim();
    if (!userVal) {
      alert("Please type a response first.");
      input.focus();
      return;
    }

    // Clean word for comparison (Cyrillic acute accent is \u0301)
    const cleanWord = currentCard.word.replace(/\u0301/g, "").toLowerCase().trim();
    const cleanUser = userVal.replace(/\u0301/g, "").toLowerCase().trim();

    const isCorrect = (cleanUser === cleanWord);
    
    // Save to SRS
    const result = SRS.scoreCard(currentCard.id, isCorrect);
    sessionXpGained += result.xpGained;

    input.disabled = true;

    if (isCorrect) {
      checkBtn.innerText = "Next Word";
      checkBtn.className = "btn btn-success";
      
      diffContainer.style.display = "block";
      diffContainer.innerHTML = `<span class="diff-char-correct" style="font-weight:700;">✓ Correct: ${currentCard.word}</span>`;
      
      AudioEngine.playSuccess();
    } else {
      checkBtn.innerText = "Next Word";
      checkBtn.className = "btn btn-danger";

      // Compute visual character comparison
      const diffMarkup = computeTextDiff(userVal, currentCard.word);
      diffContainer.style.display = "block";
      diffContainer.innerHTML = `<div>Expected: <strong>${currentCard.word}</strong></div>
                                 <div style="font-size:0.9em; margin-top:0.35rem; opacity:0.85;">Diff: ${diffMarkup}</div>`;
      
      AudioEngine.playError();
    }

    // Make sure we speak the correct pronunciation
    AudioEngine.speak(currentCard.word);
  }

  function computeTextDiff(userVal, correctVal) {
    const cleanCorrect = correctVal.replace(/\u0301/g, "").trim().toLowerCase();
    const cleanUser = userVal.trim().toLowerCase();
    
    let html = "";
    const maxLength = Math.max(cleanCorrect.length, cleanUser.length);
    for (let i = 0; i < maxLength; i++) {
      const uChar = cleanUser[i];
      const cChar = cleanCorrect[i];
      
      if (uChar === cChar) {
        html += `<span class="diff-char-correct">${correctVal[i] || cChar}</span>`;
      } else {
        if (cChar === undefined) {
          // Extra character
          html += `<span class="diff-char-extra" style="color:var(--color-error); text-decoration:line-through;">${uChar}</span>`;
        } else if (uChar === undefined) {
          // Missing character
          html += `<span class="diff-char-missing" style="color:var(--color-error); text-decoration:underline;">${correctVal[i] || cChar}</span>`;
        } else {
          // Mistake replacement character
          html += `<span class="diff-char-missing" style="color:var(--color-error); text-decoration:underline;">${correctVal[i] || cChar}</span><span class="diff-char-extra" style="font-size:0.8em; opacity:0.5; text-decoration:line-through; margin-left:1px;">${uChar}</span>`;
        }
      }
    }
    return html;
  }

  function showNextCard() {
    sessionIndex++;
    if (sessionIndex >= sessionDeck.length) {
      showSessionComplete();
    } else {
      loadCardInSession();
    }
  }

  function showSessionComplete() {
    // Fill full progress indicator
    document.getElementById("study-progress-bar").style.width = "100%";

    // Switch components
    document.getElementById("study-sub-flashcard").style.display = "none";
    document.getElementById("study-sub-choice").style.display = "none";
    document.getElementById("study-sub-writing").style.display = "none";
    
    document.getElementById("study-sub-complete").style.display = "block";
    
    // Fill stats
    document.getElementById("complete-words-count").innerText = sessionDeck.length;
    document.getElementById("complete-xp-gain").innerText = `+${sessionXpGained} XP`;
    
    AudioEngine.playLevelUp();
  }

  // --- DICTIONARY EXPLORER CONTROLLERS ---
  function setupDictionary() {
    // Add custom word button
    document.getElementById("dict-add-word-btn").addEventListener("click", () => {
      openModal("modal-add-word");
    });

    // Listeners for filters
    document.getElementById("dict-search").addEventListener("input", renderDictionary);
    document.getElementById("dict-filter-category").addEventListener("change", renderDictionary);
    document.getElementById("dict-filter-status").addEventListener("change", renderDictionary);

    // Database Deck Switcher
    document.getElementById("dict-filter-db").addEventListener("change", (e) => {
      SRS.setActiveDb(e.target.value);
      // Sync other dropdowns
      document.getElementById("study-filter-db").value = e.target.value;
      updateCategoryDropdowns();
      renderDashboard();
      renderDictionary();
    });
  }

  function renderDictionary() {
    const grid = document.getElementById("dict-words-grid");
    const emptyState = document.getElementById("dict-empty-state");
    
    grid.innerHTML = "";
    dictCurrentPage = 1;
    
    // Inputs
    const searchVal = document.getElementById("dict-search").value.toLowerCase().trim();
    const categoryVal = document.getElementById("dict-filter-category").value;
    const statusVal = document.getElementById("dict-filter-status").value;

    let pool = SRS.getAllWords();
    
    // Exclude hidden cards (soft-deleted default cards)
    pool = pool.filter(w => !SRS.getCardProgress(w.id).hidden);

    // Apply search filter
    if (searchVal) {
      pool = pool.filter(w => 
        w.word.toLowerCase().includes(searchVal) || 
        w.translation.toLowerCase().includes(searchVal) || 
        (w.transliteration && w.transliteration.toLowerCase().includes(searchVal))
      );
    }

    // Apply category filter
    if (categoryVal !== "all") {
      pool = pool.filter(w => w.category === categoryVal);
    }

    // Apply status filter
    if (statusVal !== "all") {
      if (statusVal === "due") {
        const now = Date.now();
        pool = pool.filter(w => SRS.getCardProgress(w.id).nextReview <= now);
      } else if (statusVal === "starred") {
        pool = pool.filter(w => SRS.getCardProgress(w.id).starred);
      } else if (statusVal.startsWith("box")) {
        const targetBox = parseInt(statusVal.replace("box", ""), 10);
        pool = pool.filter(w => SRS.getCardProgress(w.id).box === targetBox);
      }
    }

    // Sorting: star status first, then alphabetical
    pool.sort((a, b) => {
      const aStarred = SRS.getCardProgress(a.id).starred ? 1 : 0;
      const bStarred = SRS.getCardProgress(b.id).starred ? 1 : 0;
      if (aStarred !== bStarred) {
        return bStarred - aStarred; // Starred first
      }
      return a.word.localeCompare(b.word);
    });

    dictFilteredPool = pool;

    if (dictFilteredPool.length === 0) {
      grid.style.display = "none";
      emptyState.style.display = "block";
      return;
    }

    grid.style.display = "grid";
    emptyState.style.display = "none";

    renderNextDictPage();
  }

  function renderNextDictPage() {
    const grid = document.getElementById("dict-words-grid");
    const start = (dictCurrentPage - 1) * dictPageSize;
    const end = Math.min(start + dictPageSize, dictFilteredPool.length);
    
    if (start >= dictFilteredPool.length) return;

    for (let i = start; i < end; i++) {
      const card = dictFilteredPool[i];
      const prog = SRS.getCardProgress(card.id);
      
      const cardEl = document.createElement("div");
      cardEl.className = "card vocab-card";
      
      cardEl.innerHTML = `
        <div class="vocab-card-header">
          <div class="vocab-word-display">
            <span style="cursor:pointer;" class="word-speak-icon" title="Listen Pronunciation">${card.accented || card.word}</span>
            <span style="font-size:0.7em; color:var(--color-text-muted); font-weight:normal;">[${card.transliteration || ""}]</span>
          </div>
          
          <div class="vocab-actions">
            <button class="vocab-action-btn star-toggle ${prog.starred ? 'starred' : ''}" style="color:${prog.starred ? 'hsl(45, 100%, 50%)' : 'var(--color-text-muted)'}" title="Star Word">★</button>
            <button class="vocab-action-btn edit" title="Edit Word">✍️</button>
            <button class="vocab-action-btn delete" title="Delete Word">🗑️</button>
          </div>
        </div>

        <div class="vocab-info-row">
          <span class="vocab-label-badge" style="text-transform: capitalize;">${card.pos}</span>
          <span class="vocab-label-badge">${card.category}</span>
          <span class="vocab-label-badge" style="background-color: var(--color-primary-glow); color:var(--color-primary);">Box ${prog.box}</span>
        </div>

        <div class="vocab-card-translation">${card.translation}</div>
        
        ${card.exampleRu ? `
          <div class="vocab-card-example">
            <div class="vocab-card-example-ru">${card.exampleRu}</div>
            <div style="font-size:0.9em; opacity:0.8;">${card.exampleEn}</div>
          </div>
        ` : ""}
      `;

      // Speak text trigger
      cardEl.querySelector(".word-speak-icon").addEventListener("click", () => {
        AudioEngine.speak(card.word);
      });

      // Toggle Star
      cardEl.querySelector(".star-toggle").addEventListener("click", () => {
        const starred = SRS.toggleStar(card.id);
        const btn = cardEl.querySelector(".star-toggle");
        btn.classList.toggle("starred", starred);
        btn.style.color = starred ? "hsl(45, 100%, 50%)" : "var(--color-text-muted)";
      });

      // Edit Word
      cardEl.querySelector(".edit").addEventListener("click", () => {
        openEditWordModal(card.id);
      });

      // Delete Word
      cardEl.querySelector(".delete").addEventListener("click", () => {
        const msg = card.id.startsWith("custom_") 
          ? "Are you sure you want to delete this custom word permanently?" 
          : "Are you sure you want to hide this default word? You can restore it later by clearing data.";
        if (confirm(msg)) {
          SRS.deleteWord(card.id);
          renderDictionary();
        }
      });

      grid.appendChild(cardEl);
    }
    
    dictCurrentPage++;
  }

  // --- SYNC & BACKUP CONTROLLERS ---
  function setupSync() {
    // Local JSON export
    document.getElementById("sync-copy-btn").addEventListener("click", () => {
      const textarea = document.getElementById("sync-export-area");
      textarea.select();
      document.execCommand("copy");
      alert("Backup JSON copied to clipboard successfully!");
    });

    // Local JSON import
    document.getElementById("sync-import-btn").addEventListener("click", () => {
      const jsonStr = document.getElementById("sync-import-area").value.trim();
      if (!jsonStr) {
        alert("Please paste backup JSON payload first.");
        return;
      }
      
      if (confirm("Importing this backup will overwrite your current progress, daily logs, and custom words. Are you sure?")) {
        const success = SRS.importJSON(jsonStr);
        if (success) {
          alert("Backup imported successfully!");
          document.getElementById("sync-import-area").value = "";
          renderSyncData();
          renderDashboard();
        } else {
          alert("Import failed. Please ensure the pasted text is valid JSON exported from this app.");
        }
      }
    });

    // Reset progress
    document.getElementById("sync-reset-btn").addEventListener("click", () => {
      if (confirm("WARNING: This will delete ALL learning progress, box schedules, XP stats, streaks, and custom words. This action CANNOT be undone! Are you sure?")) {
        SRS.resetAllData();
        alert("Application progress reset to clean install.");
        renderDashboard();
        switchView("dashboard");
      }
    });

    // Supabase Connect
    document.getElementById("supabase-connect-btn").addEventListener("click", async () => {
      const url = document.getElementById("supabase-url-input").value.trim();
      const key = document.getElementById("supabase-key-input").value.trim();
      
      if (!url || !key) {
        alert("Please enter both the Supabase Project URL and Anon API key.");
        return;
      }

      try {
        await window.SupabaseSync.connect(url, key);
        alert("Successfully connected to Supabase database!");
      } catch (e) {
        alert("Failed to connect: " + e.message);
      }
    });

    // Supabase Disconnect
    document.getElementById("supabase-disconnect-btn").addEventListener("click", async () => {
      if (confirm("Disconnecting will remove your credentials and sign you out. Your local progress will remain intact. Continue?")) {
        await window.SupabaseSync.disconnect();
        alert("Disconnected from Supabase.");
      }
    });

    // Supabase Auth Tab Switching
    const tabLogin = document.getElementById("auth-tab-login");
    const tabSignup = document.getElementById("auth-tab-signup");
    const submitBtn = document.getElementById("supabase-auth-submit-btn");

    tabLogin.addEventListener("click", () => {
      window.SupabaseSync.authMode = "login";
      tabLogin.style.color = "var(--color-primary)";
      tabLogin.style.borderBottom = "2px solid var(--color-primary)";
      tabSignup.style.color = "var(--color-text-muted)";
      tabSignup.style.borderBottom = "none";
      submitBtn.innerText = "Sign In";
      submitBtn.className = "btn btn-success";
    });

    tabSignup.addEventListener("click", () => {
      window.SupabaseSync.authMode = "signup";
      tabSignup.style.color = "var(--color-primary)";
      tabSignup.style.borderBottom = "2px solid var(--color-primary)";
      tabLogin.style.color = "var(--color-text-muted)";
      tabLogin.style.borderBottom = "none";
      submitBtn.innerText = "Register Account";
      submitBtn.className = "btn btn-primary";
    });

    // Supabase Auth Submit
    submitBtn.addEventListener("click", async () => {
      const email = document.getElementById("supabase-email").value.trim();
      const password = document.getElementById("supabase-password").value.trim();

      if (!email || !password) {
        alert("Please enter both email and password.");
        return;
      }
      if (password.length < 6) {
        alert("Password must be at least 6 characters long.");
        return;
      }

      const origBtnText = submitBtn.innerText;
      submitBtn.disabled = true;
      submitBtn.innerText = "Processing...";

      try {
        if (window.SupabaseSync.authMode === "login") {
          await window.SupabaseSync.signIn(email, password);
          alert("Signed in successfully!");
        } else {
          const res = await window.SupabaseSync.signUp(email, password);
          if (res.session) {
            alert("Registration successful and logged in!");
          } else {
            alert("Registration successful! Please check your email inbox to verify your account before logging in.");
          }
          tabLogin.click();
        }
        document.getElementById("supabase-email").value = "";
        document.getElementById("supabase-password").value = "";
      } catch (e) {
        alert("Authentication error: " + e.message);
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = origBtnText;
      }
    });

    // Supabase Sign Out
    document.getElementById("supabase-logout-btn").addEventListener("click", async () => {
      if (confirm("Are you sure you want to sign out?")) {
        try {
          await window.SupabaseSync.signOut();
          alert("Signed out successfully.");
        } catch (e) {
          alert("Error signing out: " + e.message);
        }
      }
    });

    // Supabase Sync Now
    document.getElementById("supabase-sync-now-btn").addEventListener("click", async () => {
      await window.SupabaseSync.syncBoth();
    });

    // Supabase Auto-sync toggle
    const autosyncToggle = document.getElementById("supabase-autosync-toggle");
    if (autosyncToggle) {
      autosyncToggle.checked = localStorage.getItem("voc_supabase_autosync") !== "false";
      autosyncToggle.addEventListener("change", () => {
        localStorage.setItem("voc_supabase_autosync", autosyncToggle.checked);
      });
    }
  }

  function renderSyncData() {
    const payload = SRS.exportJSON();
    document.getElementById("sync-export-area").value = payload;
    
    if (window.SupabaseSync) {
      window.SupabaseSync.updateUI();
    }
  }

  // --- MODAL WINDOW CONTROLLERS ---
  const modals = {
    "modal-add-word": document.getElementById("modal-add-word"),
    "modal-edit-word": document.getElementById("modal-edit-word")
  };

  function setupModals() {
    // Add close binders
    document.getElementById("modal-add-close").addEventListener("click", () => closeModal("modal-add-word"));
    document.getElementById("modal-add-cancel").addEventListener("click", () => closeModal("modal-add-word"));
    
    document.getElementById("modal-edit-close").addEventListener("click", () => closeModal("modal-edit-word"));
    document.getElementById("modal-edit-cancel").addEventListener("click", () => closeModal("modal-edit-word"));

    // Autofill trigger from Google Translate & Wiktionary
    document.getElementById("modal-add-autofill-btn").addEventListener("click", async () => {
      const wordInput = document.getElementById("add-word-input");
      const word = wordInput.value.trim();
      if (!word) {
        alert("Please enter a Russian word first.");
        wordInput.focus();
        return;
      }

      const statusEl = document.getElementById("autofill-status");
      const autofillBtn = document.getElementById("modal-add-autofill-btn");
      
      autofillBtn.disabled = true;
      statusEl.style.display = "inline-flex";

      try {
        // 1. Fetch translation from Google Translate API (free public endpoint)
        const googleTranslateUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ru&tl=en&dt=t&q=${encodeURIComponent(word)}`;
        const gtRes = await fetch(googleTranslateUrl);
        if (!gtRes.ok) {
          throw new Error("Failed to contact translation service.");
        }
        const gtData = await gtRes.json();
        const translation = gtData && gtData[0] && gtData[0][0] && gtData[0][0][0] 
          ? gtData[0][0][0].trim() 
          : "";
          
        if (!translation) {
          throw new Error("Could not find a translation for this word.");
        }

        // 2. Query Wiktionary for linguistic details (accented stress, example sentences, part of speech)
        let posVal = "noun";
        let cleanDef = translation; // Default to Google Translate translation
        let accented = word;
        let exampleRu = "";
        let exampleEn = "";

        try {
          const restUrl = `https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(word)}`;
          const restRes = await fetch(restUrl);
          if (restRes.ok) {
            const restData = await restRes.json();
            if (restData.ru && restData.ru.length > 0) {
              const blocks = restData.ru;
              const primaryBlock = blocks[0];
              const pos = primaryBlock.partOfSpeech ? primaryBlock.partOfSpeech.toLowerCase() : "noun";
              const definitionObj = primaryBlock.definitions[0];
              
              const rawDef = definitionObj.definition || "";
              const cleanWiktDef = rawDef.replace(/<[^>]*>/g, "").trim();
              
              if (cleanWiktDef) {
                cleanDef = cleanWiktDef;
              }

              // Extract examples
              for (const b of blocks) {
                for (const def of b.definitions) {
                  if (def.examples && def.examples.length > 0) {
                    const ex = def.examples[0];
                    exampleRu = (ex.sentence || "").replace(/<[^>]*>/g, "").trim();
                    exampleEn = (ex.translation || "").replace(/<[^>]*>/g, "").trim();
                    break;
                  }
                }
                if (exampleRu) break;
              }

              // Map parts of speech
              if (pos.includes("noun")) posVal = "noun";
              else if (pos.includes("verb")) posVal = "verb";
              else if (pos.includes("adj")) posVal = "adjective";
              else if (pos.includes("adv")) posVal = "adverb";
              else if (pos.includes("pron")) posVal = "pronoun";
              else if (pos.includes("num")) posVal = "numeral";
              else if (pos.includes("prep")) posVal = "preposition";
              else if (pos.includes("conj")) posVal = "conjunction";
              else if (pos.includes("part")) posVal = "particle";
              else if (pos.includes("interj")) posVal = "interjection";
              else posVal = "phrase";
            }
          }
        } catch (e) {
          console.warn("Wiktionary definitions lookup failed, using translation only.", e);
        }

        // Accented stress lookup
        try {
          const actionUrl = `https://en.wiktionary.org/w/api.php?action=parse&prop=wikitext&page=${encodeURIComponent(word)}&format=json&origin=*`;
          const actionRes = await fetch(actionUrl);
          if (actionRes.ok) {
            const actionData = await actionRes.json();
            if (actionData.parse && actionData.parse.wikitext) {
              const wikitext = actionData.parse.wikitext["*"] || "";
              const accentedRegex = /\{\{ru-[^}]*\}\}/g;
              const matches = wikitext.match(accentedRegex) || [];
              for (const match of matches) {
                const parts = match.replace(/[{}]/g, "").split("|");
                const stressedPart = parts.find(p => p.includes("\u0301"));
                if (stressedPart) {
                  accented = stressedPart.trim();
                  break;
                }
              }
            }
          }
        } catch (e) {
          console.warn("Accented stress lookup failed, using default base spelling.", e);
        }

        // Fill elements
        document.getElementById("add-accented-input").value = accented;
        document.getElementById("add-translation-input").value = cleanDef;
        document.getElementById("add-translit-input").value = transliterateWord(word);
        document.getElementById("add-pos-input").value = posVal;
        document.getElementById("add-exampleru-input").value = exampleRu;
        document.getElementById("add-exampleen-input").value = exampleEn;

        // Visual success pulse
        const inputs = [
          "add-accented-input", "add-translation-input", "add-translit-input",
          "add-pos-input", "add-exampleru-input", "add-exampleen-input"
        ];
        inputs.forEach(id => {
          const el = document.getElementById(id);
          el.style.borderColor = "var(--color-success)";
          setTimeout(() => el.style.borderColor = "", 1000);
        });

      } catch (err) {
        alert(`Auto-fill Error: ${err.message || "Failed to translate word. Please fill details manually."}`);
      } finally {
        autofillBtn.disabled = false;
        statusEl.style.display = "none";
      }
    });

    // Add Form Submit
    document.getElementById("add-word-form").addEventListener("submit", () => {
      const word = document.getElementById("add-word-input").value;
      const accented = document.getElementById("add-accented-input").value;
      const translation = document.getElementById("add-translation-input").value;
      const translit = document.getElementById("add-translit-input").value;
      const pos = document.getElementById("add-pos-input").value;
      const category = document.getElementById("add-category-input").value;
      const exampleRu = document.getElementById("add-exampleru-input").value;
      const exampleEn = document.getElementById("add-exampleen-input").value;

      const added = SRS.addCustomWord({
        word, accented, translation, transliteration: translit, pos, category, exampleRu, exampleEn
      });

      if (added) {
        closeModal("modal-add-word");
        // Reset form
        document.getElementById("add-word-form").reset();
        renderDictionary();
      }
    });

    // Edit Form Submit
    document.getElementById("edit-word-form").addEventListener("submit", () => {
      const id = document.getElementById("edit-word-id").value;
      const word = document.getElementById("edit-word-input").value;
      const accented = document.getElementById("edit-accented-input").value;
      const translation = document.getElementById("edit-translation-input").value;
      const translit = document.getElementById("edit-translit-input").value;
      const pos = document.getElementById("edit-pos-input").value;
      const category = document.getElementById("edit-category-input").value;
      const exampleRu = document.getElementById("edit-exampleru-input").value;
      const exampleEn = document.getElementById("edit-exampleen-input").value;

      const updated = SRS.editWord(id, {
        word, accented, translation, transliteration: translit, pos, category, exampleRu, exampleEn
      });

      if (updated) {
        closeModal("modal-edit-word");
        renderDictionary();
      }
    });
  }

  function openModal(id) {
    modals[id].classList.add("active");
  }

  function closeModal(id) {
    modals[id].classList.remove("active");
  }

  function openEditWordModal(id) {
    const card = SRS.getWord(id);
    if (!card) return;

    document.getElementById("edit-word-id").value = card.id;
    document.getElementById("edit-word-input").value = card.word;
    document.getElementById("edit-accented-input").value = card.accented || card.word;
    document.getElementById("edit-translation-input").value = card.translation;
    document.getElementById("edit-translit-input").value = card.transliteration || "";
    document.getElementById("edit-pos-input").value = card.pos || "noun";
    document.getElementById("edit-category-input").value = card.category || "Custom";
    document.getElementById("edit-exampleru-input").value = card.exampleRu || "";
    document.getElementById("edit-exampleen-input").value = card.exampleEn || "";

    openModal("modal-edit-word");
  }

  // --- KEYBOARD SHORTCUTS ENGINE ---
  function setupGlobalShortcuts() {
    window.addEventListener("keydown", (e) => {
      // Avoid firing hotkeys when user is writing in inputs, selects, textareas
      const activeEl = document.activeElement;
      if (activeEl && (
          activeEl.tagName === "INPUT" || 
          activeEl.tagName === "SELECT" || 
          activeEl.tagName === "TEXTAREA"
      )) {
        // Exception: Enter on writing mode text input runs check
        if (e.key === "Enter" && activeEl.id === "writing-user-input") {
          e.preventDefault();
          handleWritingSubmit();
        }
        return;
      }

      // Check if Study section is currently active
      if (!views["study-active"].classList.contains("active")) {
        return;
      }

      // 1. FLASHCARD SHORTCUTS
      if (currentStudyMode === "flashcard" && document.getElementById("study-sub-flashcard").style.display !== "none") {
        if (e.key === " " || e.key === "Spacebar") {
          e.preventDefault();
          flipFlashcard();
        }
        else if (isCardFlipped) {
          if (e.key === "1") {
            e.preventDefault();
            handleSrsScore(false);
          } else if (e.key === "2") {
            e.preventDefault();
            handleSrsScore(true); // good review
          } else if (e.key === "3") {
            e.preventDefault();
            handleSrsScore(true); // easy review
          }
        }
      }

      // 2. MULTIPLE CHOICE SHORTCUTS
      else if (currentStudyMode === "choice" && document.getElementById("study-sub-choice").style.display !== "none") {
        const nextBtn = document.getElementById("choice-next-btn");
        if (nextBtn.style.display === "block") {
          if (e.key === " " || e.key === "Spacebar" || e.key === "Enter") {
            e.preventDefault();
            showNextCard();
          }
        } else {
          // Choice select via keys 1-4
          if (["1", "2", "3", "4"].includes(e.key)) {
            const index = parseInt(e.key, 10) - 1;
            const container = document.getElementById("choices-container");
            const buttons = container.querySelectorAll(".choice-btn");
            if (buttons[index] && !buttons[index].classList.contains("disabled")) {
              e.preventDefault();
              buttons[index].click();
            }
          }
        }
      }

      // 3. WRITING SHORTCUTS (when focus is outside input)
      else if (currentStudyMode === "writing" && document.getElementById("study-sub-writing").style.display !== "none") {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleWritingSubmit();
        }
      }
    });
  }
  // Cyrillic to Latin Transliteration helper for autofill
  const translitMap = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh', 'з': 'z',
    'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r',
    'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch',
    'ъ': '', 'ы': 'y', 'ь': "'", 'э': 'e', 'ю': 'yu', 'я': 'ya'
  };
  function transliterateWord(text) {
    return text.toLowerCase().split('').map(char => {
      if (char === '\u0301') return '';
      return translitMap[char] !== undefined ? translitMap[char] : char;
    }).join('');
  }
})();
