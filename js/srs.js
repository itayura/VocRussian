// VocRussian Spaced Repetition System (SRS) & State Management

(function () {
  // Leitner system intervals in milliseconds
  const INTERVALS = {
    1: 1 * 24 * 60 * 60 * 1000,   // Box 1: 1 day
    2: 2 * 24 * 60 * 60 * 1000,   // Box 2: 2 days
    3: 4 * 24 * 60 * 60 * 1000,   // Box 3: 4 days
    4: 7 * 24 * 60 * 60 * 1000,   // Box 4: 7 days
    5: 14 * 24 * 60 * 60 * 1000,  // Box 5: 14 days
  };

  const STORAGE_KEYS = {
    PROGRESS: "voc_russian_progress", // card status: box, nextReview, stats
    CUSTOM_WORDS: "voc_russian_custom", // custom words added by user
    GLOBAL_STATS: "voc_russian_stats", // streak, XP, correct/wrong counts, history logs
  };

  // State caches
  let cardProgress = {};
  let customWords = [];
  let globalStats = {
    xp: 0,
    streak: 0,
    lastActiveDate: null,
    totalCorrect: 0,
    totalAttempts: 0,
    dailyXpLog: {} // { "YYYY-MM-DD": xpValue }
  };

  // --- INTERNAL UTILS ---

  function loadFromStorage() {
    try {
      cardProgress = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROGRESS)) || {};
      customWords = JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOM_WORDS)) || [];
      globalStats = JSON.parse(localStorage.getItem(STORAGE_KEYS.GLOBAL_STATS)) || {
        xp: 0,
        streak: 0,
        lastActiveDate: null,
        totalCorrect: 0,
        totalAttempts: 0,
        dailyXpLog: {}
      };
    } catch (e) {
      console.error("Failed to load local storage state, initializing empty.", e);
      cardProgress = {};
      customWords = [];
      globalStats = { xp: 0, streak: 0, lastActiveDate: null, totalCorrect: 0, totalAttempts: 0, dailyXpLog: {} };
    }
  }

  function saveToStorage() {
    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(cardProgress));
    localStorage.setItem(STORAGE_KEYS.CUSTOM_WORDS, JSON.stringify(customWords));
    localStorage.setItem(STORAGE_KEYS.GLOBAL_STATS, JSON.stringify(globalStats));
  }

  function getFormattedDate(dateObj = new Date()) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    const d = String(dateObj.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function checkAndUpdateStreak() {
    const todayStr = getFormattedDate();
    if (!globalStats.lastActiveDate) {
      globalStats.streak = 0;
      return;
    }

    const lastDate = new Date(globalStats.lastActiveDate);
    const todayDate = new Date(todayStr);
    
    // Reset time components for accurate date difference
    lastDate.setHours(0,0,0,0);
    todayDate.setHours(0,0,0,0);

    const diffTime = todayDate - lastDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 1) {
      // Streak broken
      globalStats.streak = 0;
    }
  }

  function addXP(amount) {
    globalStats.xp = (globalStats.xp || 0) + amount;
    
    // Track daily XP log
    const todayStr = getFormattedDate();
    globalStats.dailyXpLog = globalStats.dailyXpLog || {};
    globalStats.dailyXpLog[todayStr] = (globalStats.dailyXpLog[todayStr] || 0) + amount;

    // Update streak activity
    const lastActive = globalStats.lastActiveDate;
    const today = getFormattedDate();
    if (lastActive !== today) {
      if (lastActive) {
        const lastDate = new Date(lastActive);
        const todayDate = new Date(today);
        lastDate.setHours(0,0,0,0);
        todayDate.setHours(0,0,0,0);
        const diffTime = todayDate - lastDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          globalStats.streak = (globalStats.streak || 0) + 1;
        } else if (diffDays > 1) {
          globalStats.streak = 1;
        }
      } else {
        globalStats.streak = 1;
      }
      globalStats.lastActiveDate = today;
    }
    saveToStorage();
  }

  // --- PUBLIC API ---

  const SRS = {
    init: function () {
      loadFromStorage();
      checkAndUpdateStreak();
      saveToStorage();
    },

    // Get active database name ('standard' | 'expanded' | 'custom')
    getActiveDb: function() {
      return localStorage.getItem("voc_russian_active_db") || "standard";
    },

    // Set active database name
    setActiveDb: function(dbName) {
      if (dbName === "expanded" || dbName === "standard" || dbName === "custom") {
        localStorage.setItem("voc_russian_active_db", dbName);
        return true;
      }
      return false;
    },

    // Get all words (default + custom)
    getAllWords: function () {
      const activeDb = this.getActiveDb();
      let baseList = [];
      if (activeDb === "expanded") {
        baseList = window.expandedVocabulary || [];
      } else if (activeDb === "standard") {
        baseList = window.defaultVocabulary || [];
      } // If 'custom', baseList is empty, returning only customWords
      return [...baseList, ...customWords];
    },

    // Get specific word by ID
    getWord: function (id) {
      return this.getAllWords().find(w => w.id === id);
    },

    // Get progress details for a card
    getCardProgress: function (id) {
      if (!cardProgress[id]) {
        // Initialize if not exists
        cardProgress[id] = {
          id: id,
          box: 1,
          nextReview: Date.now(), // Due immediately
          correctCount: 0,
          wrongCount: 0,
          starred: false
        };
      }
      return cardProgress[id];
    },

    // Get all due cards
    getDueCards: function () {
      const now = Date.now();
      const all = this.getAllWords();
      return all.filter(word => {
        const prog = this.getCardProgress(word.id);
        return prog.nextReview <= now;
      });
    },

    // Score a card based on active study outcome
    scoreCard: function (id, isCorrect) {
      const prog = this.getCardProgress(id);
      
      prog.correctCount = prog.correctCount || 0;
      prog.wrongCount = prog.wrongCount || 0;
      
      globalStats.totalAttempts = (globalStats.totalAttempts || 0) + 1;

      let xpGained = 0;
      if (isCorrect) {
        prog.correctCount++;
        globalStats.totalCorrect = (globalStats.totalCorrect || 0) + 1;
        
        // Move up Leitner boxes
        prog.box = Math.min((prog.box || 1) + 1, 5);
        xpGained = 15; // 15 XP for correct answer
      } else {
        prog.wrongCount++;
        // Reset to box 1 (strict Leitner)
        prog.box = 1;
        xpGained = 5; // 5 XP for attempt/fail
      }

      // Calculate next review timestamp
      const interval = INTERVALS[prog.box];
      prog.nextReview = Date.now() + interval;

      // Update progress memory
      cardProgress[id] = prog;
      
      // Save stats
      addXP(xpGained);
      saveToStorage();
      
      return {
        newBox: prog.box,
        xpGained: xpGained,
        nextReview: prog.nextReview
      };
    },

    // Add a custom word
    addCustomWord: function (wordData) {
      const id = "custom_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5);
      const newWord = {
        id: id,
        word: wordData.word.trim(),
        accented: wordData.accented ? wordData.accented.trim() : wordData.word.trim(),
        translation: wordData.translation.trim(),
        transliteration: wordData.transliteration ? wordData.transliteration.trim() : "",
        pos: wordData.pos || "noun",
        category: wordData.category || "Custom",
        exampleRu: wordData.exampleRu ? wordData.exampleRu.trim() : "",
        exampleEn: wordData.exampleEn ? wordData.exampleEn.trim() : ""
      };

      customWords.push(newWord);
      // Initialize progress
      this.getCardProgress(id);
      saveToStorage();
      return newWord;
    },

    // Edit an existing word (supports both default override details and custom edits)
    editWord: function (id, updatedFields) {
      // Find in custom words
      const customIdx = customWords.findIndex(w => w.id === id);
      if (customIdx !== -1) {
        customWords[customIdx] = { ...customWords[customIdx], ...updatedFields };
        saveToStorage();
        return true;
      }
      
      // If it is a default word, we override details by keeping an override list or writing to progress.
      // For simplicity, if they edit a default word, we can convert it into a local copy or we can just save the modifications inside progress,
      // But creating a simple overrides object in localStorage is cleaner. Let's support editing custom words directly, 
      // and for default words, let's keep overrides inside localStorage. Let's merge overrides when loading words.
      // Let's implement an overrides database.
      let overrides = JSON.parse(localStorage.getItem("voc_russian_overrides")) || {};
      overrides[id] = { ...overrides[id], ...updatedFields };
      localStorage.setItem("voc_russian_overrides", JSON.stringify(overrides));
      return true;
    },

    // Delete a word
    deleteWord: function (id) {
      // Only custom words can be hard-deleted from database
      const idx = customWords.findIndex(w => w.id === id);
      if (idx !== -1) {
        customWords.splice(idx, 1);
        delete cardProgress[id];
        saveToStorage();
        return true;
      }
      
      // For default words, we can't delete from standard database, but we can set a "hidden" flag in progress to exclude them.
      const prog = this.getCardProgress(id);
      prog.hidden = true;
      saveToStorage();
      return true;
    },

    // Unhide a deleted default word
    restoreWord: function(id) {
      const prog = this.getCardProgress(id);
      prog.hidden = false;
      saveToStorage();
    },

    // Toggle Favorite status
    toggleStar: function (id) {
      const prog = this.getCardProgress(id);
      prog.starred = !prog.starred;
      saveToStorage();
      return prog.starred;
    },

    // Get stats summary
    getStatsSummary: function () {
      const allWords = this.getAllWords().filter(w => !this.getCardProgress(w.id).hidden);
      const boxCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      let starredCount = 0;

      allWords.forEach(w => {
        const prog = this.getCardProgress(w.id);
        boxCounts[prog.box] = (boxCounts[prog.box] || 0) + 1;
        if (prog.starred) starredCount++;
      });

      const dueCount = this.getDueCards().filter(w => !this.getCardProgress(w.id).hidden).length;

      return {
        xp: globalStats.xp || 0,
        streak: globalStats.streak || 0,
        totalAttempts: globalStats.totalAttempts || 0,
        totalCorrect: globalStats.totalCorrect || 0,
        correctPercentage: globalStats.totalAttempts > 0 
          ? Math.round((globalStats.totalCorrect / globalStats.totalAttempts) * 100) 
          : 0,
        dueCount: dueCount,
        starredCount: starredCount,
        boxCounts: boxCounts,
        totalWords: allWords.length,
        dailyXpLog: globalStats.dailyXpLog || {}
      };
    },

    // Get progress details for charts
    getLast7DaysXp: function() {
      const result = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = getFormattedDate(d);
        const xp = (globalStats.dailyXpLog && globalStats.dailyXpLog[dateStr]) || 0;
        
        // Formatted label like "Jun 11"
        const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        result.push({ date: dateStr, label: label, xp: xp });
      }
      return result;
    },

    // Reset all progress data
    resetAllData: function () {
      localStorage.removeItem(STORAGE_KEYS.PROGRESS);
      localStorage.removeItem(STORAGE_KEYS.CUSTOM_WORDS);
      localStorage.removeItem(STORAGE_KEYS.GLOBAL_STATS);
      localStorage.removeItem("voc_russian_overrides");
      
      cardProgress = {};
      customWords = [];
      globalStats = { xp: 0, streak: 0, lastActiveDate: null, totalCorrect: 0, totalAttempts: 0, dailyXpLog: {} };
      
      saveToStorage();
    },

    // Export payload
    exportJSON: function () {
      const data = {
        progress: cardProgress,
        customWords: customWords,
        stats: globalStats,
        overrides: JSON.parse(localStorage.getItem("voc_russian_overrides")) || {}
      };
      return JSON.stringify(data, null, 2);
    },

    // Import payload
    importJSON: function (jsonStr) {
      try {
        const data = JSON.parse(jsonStr);
        if (data.progress) cardProgress = data.progress;
        if (data.customWords) customWords = data.customWords;
        if (data.stats) globalStats = data.stats;
        
        if (data.overrides) {
          localStorage.setItem("voc_russian_overrides", JSON.stringify(data.overrides));
        }
        
        saveToStorage();
        return true;
      } catch (e) {
        console.error("Invalid JSON format for import", e);
        return false;
      }
    }
  };

  // Merge overrides on load
  const origGetAllWords = SRS.getAllWords;
  SRS.getAllWords = function() {
    const words = origGetAllWords.call(this);
    const overrides = JSON.parse(localStorage.getItem("voc_russian_overrides")) || {};
    return words.map(w => {
      if (overrides[w.id]) {
        return { ...w, ...overrides[w.id] };
      }
      return w;
    });
  };

  window.SRS = SRS;
})();
