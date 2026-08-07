// Privyetik Supabase Cloud Sync & Authentication Module

(function () {
  const CONFIG = {
    URL: "https://bghuansvungabgsbxqjh.supabase.co",
    KEY: "sb_publishable_KKO_dftWAuA0ndGfBnEldw_ulDWtjUb"
  };

  const STORAGE_KEYS = {
    LAST_SYNC: "voc_supabase_last_sync",
    AUTOSYNC: "voc_supabase_autosync"
  };

  const SupabaseSync = {
    client: null,
    user: null,
    connectionState: "disconnected", // 'disconnected' | 'connecting' | 'connected'
    authMode: "login", // 'login' | 'signup'
    isSyncing: false,
    pendingSyncTimeout: null,
    autoSyncRetryTimeout: null,
    autoSyncRetryCount: 0,
    pendingAutoSync: false,

    init: async function () {
      console.log("[SupabaseSync] init() started using URL:", CONFIG.URL);
      this.connectionState = "connecting";
      this.updateUI();

      try {
        this.client = window.supabase.createClient(CONFIG.URL, CONFIG.KEY);
        const { data, error } = await this.client.auth.getSession();
        if (error) throw error;
        
        this.connectionState = "connected";
        if (data && data.session) {
          this.user = data.session.user;
          console.log("[SupabaseSync] Retrieved initial session for user:", this.user.email);
          if (window.syncPushSubscriptionWithCloud) {
            window.syncPushSubscriptionWithCloud();
          }
        } else {
          console.log("[SupabaseSync] No initial session found.");
        }
        
        // Setup auth state change listener
        this.client.auth.onAuthStateChange((event, session) => {
          console.log("[SupabaseSync] Auth event triggered:", event, "Session user:", session ? session.user.email : "none");
          if (session) {
            this.user = session.user;
            this.onLoginSuccess();
            if (typeof window.completePendingOnboardingSignup === "function") {
              window.completePendingOnboardingSignup();
            }
          } else {
            this.user = null;
            this.onLogout();
          }
          this.updateUI();
        });

        // Setup periodic auto cloud backup (every 5 minutes)
        setInterval(() => {
          if (this.connectionState === "connected" && this.user) {
            this.triggerAutoSync();
          }
        }, 5 * 60 * 1000);

        // Android can suspend fetches as the app is backgrounded. Resume instead.
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible" && this.connectionState === "connected" && this.user) {
            this.triggerAutoSync({ delay: 1000 });
          }
        });
        window.addEventListener("online", () => {
          if (this.connectionState === "connected" && this.user) {
            this.triggerAutoSync({ delay: 500 });
          }
        });
      } catch (e) {
        console.error("Failed to initialize Supabase connection:", e);
        this.connectionState = "disconnected";
      }
      
      this.updateUI();
    },

    signUp: async function (email, password) {
      if (!this.client) throw new Error("Database not connected.");
      const { data, error } = await this.client.auth.signUp({
        email: email.trim(),
        password: password
      });
      if (error) throw error;
      return data;
    },

    signIn: async function (email, password) {
      if (!this.client) throw new Error("Database not connected.");
      const { data, error } = await this.client.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });
      if (error) throw error;
      return data;
    },

    signOut: async function () {
      if (!this.client) return;
      
      // Clean up push subscription on sign out
      try {
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.ready;
          const sub = await reg.pushManager.getSubscription();
          if (sub) {
            await this.unregisterPushSubscription(sub.endpoint);
            await sub.unsubscribe();
          }
        }
      } catch (e) {
        console.warn("Failed to clean up push subscription on sign out:", e);
      }

      const { error } = await this.client.auth.signOut();
      if (error) throw error;
    },

    registerPushSubscription: async function (subscription) {
      if (!this.client || !this.user) return;
      try {
        const subJSON = subscription.toJSON();
        const endpoint = subJSON.endpoint;
        const p256dh = subJSON.keys.p256dh;
        const auth = subJSON.keys.auth;

        const { error } = await this.client.from("user_push_subscriptions").upsert({
          user_id: this.user.id,
          endpoint: endpoint,
          p256dh: p256dh,
          auth: auth
        }, {
          onConflict: "endpoint"
        });
        if (error) throw error;
        console.log("Push subscription synchronized with cloud successfully.");
      } catch (e) {
        console.error("Failed to register push subscription on cloud:", e);
      }
    },

    unregisterPushSubscription: async function (endpoint) {
      if (!this.client || !this.user) return;
      try {
        await this.client.from("user_push_subscriptions").delete().match({
          user_id: this.user.id,
          endpoint: endpoint
        });
        console.log("Push subscription removed from cloud.");
      } catch (e) {
        console.error("Failed to unregister push subscription from cloud:", e);
      }
    },

    signInWithGoogle: async function () {
      if (!this.client) throw new Error("Database not connected.");
      const { data, error } = await this.client.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin + window.location.pathname
        }
      });
      if (error) throw error;
      return data;
    },

    isAutoSyncEnabled: function () {
      const toggle = document.getElementById("supabase-autosync-toggle");
      if (toggle) {
        return toggle.checked;
      }
      return localStorage.getItem(STORAGE_KEYS.AUTOSYNC) !== "false";
    },

    // Handle local state changes dynamically (called by srs.js)
    handleLocalChange: async function (type, id, data) {
      if (this.connectionState !== "connected" || !this.user) return;
      if (!this.isAutoSyncEnabled()) return;

      // Progress and stats contain append-only event logs. Always merge the
      // server snapshot instead of overwriting events recorded on another device.
      if (type === "progress" || type === "stats") {
        clearTimeout(this.pendingSyncTimeout);
        this.pendingSyncTimeout = setTimeout(() => {
          this.pendingSyncTimeout = null;
          if (this.isSyncing) {
            this.handleLocalChange(type, id, data);
          } else {
            this.triggerAutoSync();
          }
        }, 1000);
        return;
      }

      if (this.isSyncing) return;

      try {
        if (type === "progress") {
          const { error } = await this.client.from("voc_progress").upsert({
            user_id: this.user.id,
            word_id: id,
            box: data.box,
            next_review: data.nextReview,
            correct_count: data.correctCount || 0,
            wrong_count: data.wrongCount || 0,
            starred: !!data.starred,
            hidden: !!data.hidden,
            review_events: data.reviewEvents || [],
            updated_at: new Date(data.updatedAt || Date.now()).toISOString()
          });
          if (error) throw error;
        } else if (type === "stats") {
          const { error } = await this.client.from("voc_stats").upsert({
            user_id: this.user.id,
            xp: data.xp || 0,
            streak: data.streak || 0,
            last_active_date: data.lastActiveDate,
            total_correct: data.totalCorrect || 0,
            total_attempts: data.totalAttempts || 0,
            daily_xp_log: data.dailyXpLog || {},
            activity_log: data.activityLog || [],
            settings: data.settings || {},
            updated_at: new Date(data.updatedAt || Date.now()).toISOString()
          });
          if (error) throw error;
        } else if (type === "word") {
          const payload = {
            user_id: this.user.id,
            id: id,
            word: data.word,
            accented: data.accented,
            translation: data.translation,
            transliteration: data.transliteration || "",
            pos: data.pos || "noun",
            category: data.category || "Custom",
            level: data.level || "A1",
            example_ru: data.exampleRu || data.example_ru || "",
            example_en: data.exampleEn || data.example_en || "",
            deck_id: data.deckId || "custom",
            updated_at: new Date(data.updatedAt || Date.now()).toISOString()
          };
          const { error } = await this.client.from("voc_words").upsert(payload);
          if (error) throw error;
        } else if (type === "word_delete") {
          const results = await Promise.all([
            this.client.from("voc_words").delete().match({ user_id: this.user.id, id }),
            this.client.from("voc_progress").delete().match({ user_id: this.user.id, word_id: id })
          ]);
          const error = results.find(result => result.error)?.error;
          if (error) throw error;
        } else if (type === "reset") {
          // Bulk delete on cloud
          const results = await Promise.all([
            this.client.from("voc_progress").delete().match({ user_id: this.user.id }),
            this.client.from("voc_words").delete().match({ user_id: this.user.id }),
            this.client.from("voc_stats").delete().match({ user_id: this.user.id }),
            this.client.from("voc_grammar_progress").delete().match({ user_id: this.user.id })
          ]);
          const error = results.find(result => result.error)?.error;
          if (error) throw error;
        }
      } catch (e) {
        console.warn("Background auto-sync failed (likely offline):", e);
      }
    },

    // Bidirectional Sync algorithm
    syncBoth: async function (options = {}) {
      const manual = options.manual === true;
      if (this.connectionState !== "connected" || !this.user) {
        if (manual) alert("Please sign in first to synchronize your progress.");
        return false;
      }
      if (!navigator.onLine) {
        if (manual) alert("You appear to be offline. Your progress stays safely on this device and will sync when you reconnect.");
        else this.scheduleAutoSyncRetry(new TypeError("Failed to fetch"));
        return false;
      }

      if (this.isSyncing) return false;
      this.isSyncing = true;
      this.updateSyncButtonState(true);

      try {
        console.log("[SupabaseSync] Starting bidirectional sync...");

        // 1. SYNC CUSTOM WORDS & OVERRIDES (voc_words)
        let { data: dbWords, error: errWords } = await this.client
          .from("voc_words")
          .select("*");
        if (errWords) throw errWords;

        const localCustom = window.SRS.getCustomWordsList();
        const localOverrides = window.SRS.getOverridesMap();

        const finalCustomWordsMap = {};
        const finalOverridesMap = {};
        const toPushWords = [];

        // Add local words to final maps initially
        localCustom.forEach(w => { finalCustomWordsMap[w.id] = w; });
        Object.keys(localOverrides).forEach(id => { finalOverridesMap[id] = localOverrides[id]; });

        // Push any pending deletes
        const deletedCustomIds = JSON.parse(localStorage.getItem("voc_russian_deleted_custom_ids")) || [];
        if (deletedCustomIds.length > 0) {
          const { error: delErr } = await this.client
            .from("voc_words")
            .delete()
            .match({ user_id: this.user.id })
            .in("id", deletedCustomIds);
          if (delErr) throw delErr;
          const { error: delProgressErr } = await this.client.from("voc_progress").delete().match({ user_id: this.user.id }).in("word_id", deletedCustomIds);
          if (delProgressErr) throw delProgressErr;
          dbWords = dbWords.filter(word => !deletedCustomIds.includes(word.id));
          localStorage.removeItem("voc_russian_deleted_custom_ids");
        }

        // Map DB words
        const dbWordsMap = {};
        dbWords.forEach(w => { dbWordsMap[w.id] = w; });

        // Merge DB words with local maps using updatedAt conflict resolution
        dbWords.forEach(dbW => {
          const isCustom = dbW.id.startsWith("custom_");
          const localW = isCustom ? finalCustomWordsMap[dbW.id] : finalOverridesMap[dbW.id];

          if (!localW) {
            // Exists in DB but not locally - pull down
            const mappedW = {
              id: dbW.id,
              word: dbW.word,
              accented: dbW.accented || dbW.word,
              translation: dbW.translation,
              transliteration: dbW.transliteration || "",
              pos: dbW.pos || "noun",
              category: dbW.category || "Custom",
              level: dbW.level || "A1",
              exampleRu: dbW.example_ru || "",
              exampleEn: dbW.example_en || "",
              deckId: dbW.deck_id || "custom",
              updatedAt: Date.parse(dbW.updated_at)
            };
            if (isCustom) {
              finalCustomWordsMap[dbW.id] = mappedW;
            } else {
              finalOverridesMap[dbW.id] = mappedW;
            }
          } else {
            // Exists in both - compare updatedAt timestamps
            const dbTime = Date.parse(dbW.updated_at);
            const localTime = localW.updatedAt || 0;
 
            if (localTime > dbTime) {
              // Local is newer - queue to push to Supabase
              toPushWords.push(localW);
            } else if (dbTime > localTime) {
              // DB is newer - update local state
              const mappedW = {
                id: dbW.id,
                word: dbW.word,
                accented: dbW.accented || dbW.word,
                translation: dbW.translation,
                transliteration: dbW.transliteration || "",
                pos: dbW.pos || "noun",
                category: dbW.category || "Custom",
                level: dbW.level || "A1",
                exampleRu: dbW.example_ru || "",
                exampleEn: dbW.example_en || "",
                deckId: dbW.deck_id || "custom",
                updatedAt: dbTime
              };
              if (isCustom) {
                finalCustomWordsMap[dbW.id] = mappedW;
              } else {
                finalOverridesMap[dbW.id] = mappedW;
              }
            }
          }
        });

        // Add local words not present in DB to push list
        Object.values(finalCustomWordsMap).forEach(w => {
          if (!dbWordsMap[w.id]) toPushWords.push(w);
        });
        Object.values(finalOverridesMap).forEach(w => {
          if (!dbWordsMap[w.id]) toPushWords.push(w);
        });

        // Push new/updated words to Supabase in chunks of 500
        if (toPushWords.length > 0) {
          const rowsToPush = toPushWords.map(w => ({
            user_id: this.user.id,
            id: w.id,
            word: w.word,
            accented: w.accented || w.word,
            translation: w.translation,
            transliteration: w.transliteration || "",
            pos: w.pos || "noun",
            category: w.category || "Custom",
            level: w.level || "A1",
            example_ru: w.exampleRu || w.example_ru || "",
            example_en: w.exampleEn || w.example_en || "",
            deck_id: w.deckId || "custom",
            updated_at: new Date(w.updatedAt || Date.now()).toISOString()
          }));
 
          const chunkSize = 500;
          for (let i = 0; i < rowsToPush.length; i += chunkSize) {
            const chunk = rowsToPush.slice(i, i + chunkSize);
            const { error: pushErr } = await this.client
              .from("voc_words")
              .upsert(chunk);
            if (pushErr) throw pushErr;
          }
        }


        // 2. SYNC FLASHCARD PROGRESS (voc_progress)
        let { data: dbProg, error: errProg } = await this.client.from("voc_progress").select("*");
        if (errProg) throw errProg;

        // Remove the legacy XP placeholder row; grammar activity is no longer vocabulary progress.
        if (dbProg.some(row => row.word_id === "dummy_xp_holder")) {
          const { error: dummyDeleteError } = await this.client.from("voc_progress").delete().match({ user_id: this.user.id, word_id: "dummy_xp_holder" });
          if (dummyDeleteError) throw dummyDeleteError;
          dbProg = dbProg.filter(row => row.word_id !== "dummy_xp_holder");
        }

        const localProgMap = { ...window.SRS.getCardProgressMap() };
        delete localProgMap.dummy_xp_holder;
        const remoteProgMap = Object.fromEntries(dbProg.map(row => [row.word_id, {
          id: row.word_id,
          box: row.box,
          nextReview: Number(row.next_review),
          correctCount: row.correct_count || 0,
          wrongCount: row.wrong_count || 0,
          starred: !!row.starred,
          hidden: !!row.hidden,
          reviewEvents: Array.isArray(row.review_events) ? row.review_events : [],
          updatedAt: Date.parse(row.updated_at) || 0
        }]));

        const mergeProgress = (local = {}, remote = {}) => {
          const localEvents = Array.isArray(local.reviewEvents) ? local.reviewEvents : [];
          const remoteEvents = Array.isArray(remote.reviewEvents) ? remote.reviewEvents : [];
          const eventsById = new Map();
          [...localEvents, ...remoteEvents].forEach(event => eventsById.set(event.id, event));
          const allEvents = [...eventsById.values()].sort((a, b) => (a.at || 0) - (b.at || 0));
          const localEventCorrect = localEvents.filter(event => event.correct).length;
          const remoteEventCorrect = remoteEvents.filter(event => event.correct).length;
          const localEventWrong = localEvents.length - localEventCorrect;
          const remoteEventWrong = remoteEvents.length - remoteEventCorrect;
          const baseCorrect = Math.max(0, (local.correctCount || 0) - localEventCorrect, (remote.correctCount || 0) - remoteEventCorrect);
          const baseWrong = Math.max(0, (local.wrongCount || 0) - localEventWrong, (remote.wrongCount || 0) - remoteEventWrong);
          const latest = (local.updatedAt || 0) >= (remote.updatedAt || 0) ? local : remote;
          return {
            id: local.id || remote.id,
            box: latest.box || 1,
            nextReview: latest.nextReview || Date.now(),
            correctCount: baseCorrect + allEvents.filter(event => event.correct).length,
            wrongCount: baseWrong + allEvents.filter(event => !event.correct).length,
            starred: !!latest.starred,
            hidden: !!latest.hidden,
            reviewEvents: allEvents.slice(-100),
            updatedAt: Math.max(local.updatedAt || 0, remote.updatedAt || 0) || Date.now()
          };
        };

        const allProgressIds = new Set([...Object.keys(localProgMap), ...Object.keys(remoteProgMap)]);
        allProgressIds.forEach(wordId => {
          localProgMap[wordId] = mergeProgress(localProgMap[wordId], remoteProgMap[wordId]);
        });

        const progressRows = [...allProgressIds].map(wordId => {
          const progress = localProgMap[wordId];
          return {
            user_id: this.user.id,
            word_id: wordId,
            box: progress.box,
            next_review: progress.nextReview,
            correct_count: progress.correctCount || 0,
            wrong_count: progress.wrongCount || 0,
            starred: !!progress.starred,
            hidden: !!progress.hidden,
            review_events: progress.reviewEvents || [],
            updated_at: new Date(progress.updatedAt || Date.now()).toISOString()
          };
        });
        for (let i = 0; i < progressRows.length; i += 500) {
          const { error: pushProgErr } = await this.client.from("voc_progress").upsert(progressRows.slice(i, i + 500));
          if (pushProgErr) throw pushProgErr;
        }


        // 3. SYNC GLOBAL STATS (voc_stats)
        const { data: dbStatsRows, error: errStats } = await this.client.from("voc_stats").select("*").match({ user_id: this.user.id });
        if (errStats) throw errStats;

        const localStats = { ...window.SRS.getGlobalStats() };
        const dbStats = dbStatsRows[0] || {};
        const localEvents = Array.isArray(localStats.activityLog) ? localStats.activityLog : [];
        const remoteEvents = Array.isArray(dbStats.activity_log) ? dbStats.activity_log : [];
        const activityById = new Map();
        [...localEvents, ...remoteEvents].forEach(event => activityById.set(event.id, event));
        const mergedActivity = [...activityById.values()].sort((a, b) => (a.occurredAt || 0) - (b.occurredAt || 0));
        const localEventXp = localEvents.reduce((sum, event) => sum + (event.xp || 0), 0);
        const remoteEventXp = remoteEvents.reduce((sum, event) => sum + (event.xp || 0), 0);
        const legacyXpBase = Math.max(0, (localStats.xp || 0) - localEventXp, (dbStats.xp || 0) - remoteEventXp);
        localStats.xp = legacyXpBase + mergedActivity.reduce((sum, event) => sum + (event.xp || 0), 0);
        localStats.activityLog = mergedActivity.slice(-500);

        const allDates = new Set([
          ...Object.keys(localStats.dailyXpLog || {}),
          ...Object.keys(dbStats.daily_xp_log || {}),
          ...mergedActivity.map(event => event.date).filter(Boolean)
        ]);
        const mergedDailyXp = {};
        allDates.forEach(date => {
          const localDateEvents = localEvents.filter(event => event.date === date).reduce((sum, event) => sum + (event.xp || 0), 0);
          const remoteDateEvents = remoteEvents.filter(event => event.date === date).reduce((sum, event) => sum + (event.xp || 0), 0);
          const mergedDateEvents = mergedActivity.filter(event => event.date === date).reduce((sum, event) => sum + (event.xp || 0), 0);
          const base = Math.max(0, ((localStats.dailyXpLog || {})[date] || 0) - localDateEvents, ((dbStats.daily_xp_log || {})[date] || 0) - remoteDateEvents);
          mergedDailyXp[date] = base + mergedDateEvents;
        });
        localStats.dailyXpLog = mergedDailyXp;

        const reviewedProgress = Object.values(localProgMap);
        localStats.totalCorrect = reviewedProgress.reduce((sum, progress) => sum + (progress.correctCount || 0), 0);
        localStats.totalAttempts = reviewedProgress.reduce((sum, progress) => sum + (progress.correctCount || 0) + (progress.wrongCount || 0), 0);
        const localTime = localStats.updatedAt || 0;
        const dbTime = Date.parse(dbStats.updated_at) || 0;
        const remoteSettings = dbStats.settings || {};
        localStats.settings = localTime >= dbTime ? { ...remoteSettings, ...(localStats.settings || {}) } : { ...(localStats.settings || {}), ...remoteSettings };

        // Recalculate streaks from merged daily evidence. Taking the maximum current
        // streak would let an old offline device resurrect a streak that was broken.
        const streakGoal = window.SRS.getDailyStreakGoal ? window.SRS.getDailyStreakGoal() : 20;
        const qualifyingDates = Object.keys(mergedDailyXp).filter(date => mergedDailyXp[date] >= streakGoal).sort();
        const dayNumber = date => {
          const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date || "");
          return match ? Math.floor(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) / 86400000) : null;
        };
        let longestStreak = 0;
        let runningStreak = 0;
        let previousDay = null;
        qualifyingDates.forEach(date => {
          const day = dayNumber(date);
          runningStreak = previousDay !== null && day === previousDay + 1 ? runningStreak + 1 : 1;
          longestStreak = Math.max(longestStreak, runningStreak);
          previousDay = day;
        });
        const now = new Date();
        const today = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");
        const latestQualifyingDate = qualifyingDates.at(-1) || null;
        let currentStreak = 0;
        if (latestQualifyingDate && dayNumber(today) - dayNumber(latestQualifyingDate) <= 1) {
          currentStreak = 1;
          for (let i = qualifyingDates.length - 1; i > 0; i--) {
            if (dayNumber(qualifyingDates[i]) - dayNumber(qualifyingDates[i - 1]) !== 1) break;
            currentStreak++;
          }
        }
        const legacyLastActive = [localStats.lastActiveDate, dbStats.last_active_date].filter(Boolean).sort().at(-1) || null;
        localStats.lastActiveDate = latestQualifyingDate || legacyLastActive;
        localStats.streak = qualifyingDates.length > 0 ? currentStreak : Math.max(localStats.streak || 0, dbStats.streak || 0);
        localStats.settings.maxStreak = Math.max(localStats.settings.maxStreak || 0, remoteSettings.maxStreak || 0, longestStreak, localStats.streak || 0, dbStats.streak || 0);
        localStats.updatedAt = Date.now();

        const { error: pushStatsErr } = await this.client.from("voc_stats").upsert({
          user_id: this.user.id,
          xp: localStats.xp,
          streak: localStats.streak,
          last_active_date: localStats.lastActiveDate,
          total_correct: localStats.totalCorrect,
          total_attempts: localStats.totalAttempts,
          daily_xp_log: localStats.dailyXpLog,
          activity_log: localStats.activityLog,
          settings: localStats.settings,
          updated_at: new Date(localStats.updatedAt).toISOString()
        });
        if (pushStatsErr) throw pushStatsErr;


        // 4. WRITE BACK TO STORAGE AND REFRESH UI
        window.SRS.setAllData(
          localProgMap,
          Object.values(finalCustomWordsMap),
          localStats,
          finalOverridesMap
        );

        const grammarSynced = !window.GrammarManager || typeof window.GrammarManager.syncWithCloud !== "function" || await window.GrammarManager.syncWithCloud();
        if (!grammarSynced) throw new Error("Grammar progress could not be synchronized.");

        const syncTime = new Date().toLocaleString();
        localStorage.setItem(STORAGE_KEYS.LAST_SYNC, syncTime);
        console.log("[SupabaseSync] Sync completed successfully at:", syncTime);

        // Refresh UI
        if (window.refreshAppUI) {
          window.refreshAppUI();
        }

        this.isSyncing = false;
        this.pendingAutoSync = false;
        this.autoSyncRetryCount = 0;
        this.updateSyncButtonState(false);
        this.updateUI();
        return true;
      } catch (e) {
        console.error("Bidirectional Sync failed:", e);
        if (manual) {
          alert(this.getManualSyncErrorMessage(e));
        } else if (this.isTransientNetworkError(e)) {
          this.scheduleAutoSyncRetry(e);
        } else {
          console.warn("Automatic sync failed and will wait for the next scheduled attempt:", e);
        }
        this.isSyncing = false;
        this.updateSyncButtonState(false);
        this.updateUI();
        return false;
      }
    },

    onLoginSuccess: function () {
      console.log("Logged in user:", this.user.email);
      // Defer login sync until the app is visible and has a network connection.
      setTimeout(() => {
        this.triggerAutoSync({ delay: 500 });
        if (window.syncPushSubscriptionWithCloud) {
          window.syncPushSubscriptionWithCloud();
        }
        if (window.GrammarManager && typeof window.GrammarManager.prefetchQuizToBuffer === "function") {
          window.GrammarManager.prefetchQuizToBuffer();
        }
      }, 500);
    },

    onLogout: function () {
      console.log("User logged out");
      if (window.refreshAppUI) {
        window.refreshAppUI();
      }
    },

    // UI Updates
    updateUI: function () {
      const operationsPanel = document.getElementById("supabase-operations-panel");
      const authForm = document.getElementById("supabase-auth-form");
      const syncPanel = document.getElementById("supabase-sync-panel");
      const userEmailSpan = document.getElementById("supabase-user-email");
      const lastSyncSpan = document.getElementById("supabase-last-sync");

      // Last sync timestamp
      if (lastSyncSpan) {
        const lastSync = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
        lastSyncSpan.innerText = lastSync ? "Last synced: " + lastSync : "Last synced: Never";
      }

      if (this.connectionState === "connected") {
        // Enable actions panel
        if (operationsPanel) {
          operationsPanel.style.opacity = "1";
          operationsPanel.style.pointerEvents = "auto";
        }

        // Show Auth form or Sync panel depending on login state
        if (this.user) {
          if (authForm) authForm.style.display = "none";
          if (syncPanel) syncPanel.style.display = "block";
          if (userEmailSpan) userEmailSpan.innerText = this.user.email;
        } else {
          if (authForm) authForm.style.display = "block";
          if (syncPanel) syncPanel.style.display = "none";
        }

      } else if (this.connectionState === "connecting") {
        if (operationsPanel) {
          operationsPanel.style.opacity = "0.4";
          operationsPanel.style.pointerEvents = "none";
        }
      } else {
        // Disconnected
        if (operationsPanel) {
          operationsPanel.style.opacity = "0.4";
          operationsPanel.style.pointerEvents = "none";
        }
        if (authForm) authForm.style.display = "block";
        if (syncPanel) syncPanel.style.display = "none";
      }

      // Admin feedback card visibility toggling
      const adminCard = document.getElementById("supabase-admin-feedback-card");
      if (adminCard) {
        if (this.connectionState === "connected" && this.user && this.user.email === "itayuralevich@gmail.com") {
          adminCard.style.display = "block";
          if (window.renderAdminFeedback) {
            window.renderAdminFeedback();
          }
        } else {
          adminCard.style.display = "none";
        }
      }

      // Call grammar update state if it exists
      if (typeof window.updateAIGrammarLockState === "function") {
        window.updateAIGrammarLockState();
      }
    },

    updateSyncButtonState: function (syncing) {
      const syncBtn = document.getElementById("supabase-sync-now-btn");
      if (syncBtn) {
        if (syncing) {
          syncBtn.disabled = true;
          syncBtn.innerText = "🔄 Syncing data in progress...";
        } else {
          syncBtn.disabled = false;
          syncBtn.innerText = "🔄 Sync Progress & Custom Words Now";
        }
      }
    },

    submitFeedback: async function (type, title, description) {
      if (!this.client) throw new Error("Database not connected.");
      if (!this.user) throw new Error("Please sign in before submitting feedback.");
      if (!["bug", "feature"].includes(type)) throw new Error("Invalid feedback type.");
      if (typeof title !== "string" || !title.trim() || title.length > 200) throw new Error("Feedback title must contain 1-200 characters.");
      if (typeof description !== "string" || !description.trim() || description.length > 5000) throw new Error("Feedback description must contain 1-5,000 characters.");
      
      const payload = {
        type: type,
        title: title.trim(),
        description: description.trim(),
        user_id: this.user ? this.user.id : null,
        user_email: this.user ? this.user.email : "Anonymous"
      };

      const { data, error } = await this.client
        .from("voc_feedback")
        .insert([payload]);

      if (error) throw error;
      return data;
    },

    fetchFeedback: async function () {
      if (!this.client) throw new Error("Database not connected.");
      const { data, error } = await this.client
        .from("voc_feedback")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },

    updateFeedbackStatus: async function (id, newStatus) {
      if (!this.client) throw new Error("Database not connected.");
      const { data, error } = await this.client
        .from("voc_feedback")
        .update({ status: newStatus })
        .match({ id: id })
        .select();

      if (error) throw error;
      return data;
    },

    deleteFeedback: async function (id) {
      if (!this.client) throw new Error("Database not connected.");
      const { data, error } = await this.client
        .from("voc_feedback")
        .delete()
        .match({ id: id })
        .select();

      if (error) throw error;
      return data;
    },

    isTransientNetworkError: function (error) {
      const message = String(error && (error.message || error)).toLowerCase();
      return error instanceof TypeError || /failed to fetch|network|load failed|timeout|timed out|connection/.test(message);
    },
    getManualSyncErrorMessage: function (error) {
      if (this.isTransientNetworkError(error)) {
        return "Couldn't reach the sync service. Check your connection and try again; your progress remains saved on this device.";
      }
      return "Synchronization failed: " + (error && error.message ? error.message : "Unknown error");
    },
    scheduleAutoSyncRetry: function (error) {
      this.pendingAutoSync = true;
      if (!navigator.onLine || document.visibilityState === "hidden") return;
      clearTimeout(this.autoSyncRetryTimeout);
      const delay = Math.min(30000, 1000 * (2 ** this.autoSyncRetryCount));
      this.autoSyncRetryCount = Math.min(this.autoSyncRetryCount + 1, 5);
      this.autoSyncRetryTimeout = setTimeout(() => {
        this.autoSyncRetryTimeout = null;
        if (navigator.onLine && document.visibilityState !== "hidden") this.triggerAutoSync();
      }, delay);
      console.warn(`[SupabaseSync] Retrying automatic sync in ${delay}ms:`, error);
    },
    triggerAutoSync: function (options = {}) {
      if (this.connectionState !== "connected" || !this.user || this.isSyncing) return;
      if (!this.isAutoSyncEnabled()) return;
      this.pendingAutoSync = true;
      const delay = Math.max(0, Number(options.delay) || 0);
      if (delay > 0) {
        clearTimeout(this.autoSyncRetryTimeout);
        this.autoSyncRetryTimeout = setTimeout(() => {
          this.autoSyncRetryTimeout = null;
          this.triggerAutoSync();
        }, delay);
        return;
      }
      if (!navigator.onLine || document.visibilityState === "hidden") return;
      console.log("[SupabaseSync] Triggering auto background cloud backup...");
      this.syncBoth({ manual: false }).then((success) => {
        if (success) {
          this.pendingAutoSync = false;
          this.autoSyncRetryCount = 0;
        }
      });
    }
  };

  window.triggerAutoCloudBackup = function() {
    if (window.SupabaseSync && typeof window.SupabaseSync.triggerAutoSync === "function") {
      window.SupabaseSync.triggerAutoSync();
    }
  };

  window.SupabaseSync = SupabaseSync;
})();
