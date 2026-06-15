// VocRussian Supabase Cloud Sync & Authentication Module

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
        } else {
          console.log("[SupabaseSync] No initial session found.");
        }
        
        // Setup auth state change listener
        this.client.auth.onAuthStateChange((event, session) => {
          console.log("[SupabaseSync] Auth event triggered:", event, "Session user:", session ? session.user.email : "none");
          if (session) {
            this.user = session.user;
            this.onLoginSuccess();
          } else {
            this.user = null;
            this.onLogout();
          }
          this.updateUI();
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
      if (this.connectionState !== "connected" || !this.user || this.isSyncing) return;
      if (!this.isAutoSyncEnabled()) return;

      try {
        if (type === "progress") {
          await this.client.from("voc_progress").upsert({
            user_id: this.user.id,
            word_id: id,
            box: data.box,
            next_review: data.nextReview,
            correct_count: data.correctCount || 0,
            wrong_count: data.wrongCount || 0,
            starred: !!data.starred,
            hidden: !!data.hidden,
            updated_at: new Date(data.updatedAt || Date.now()).toISOString()
          });
        } else if (type === "stats") {
          await this.client.from("voc_stats").upsert({
            user_id: this.user.id,
            xp: data.xp || 0,
            streak: data.streak || 0,
            last_active_date: data.lastActiveDate,
            total_correct: data.totalCorrect || 0,
            total_attempts: data.totalAttempts || 0,
            daily_xp_log: data.dailyXpLog || {},
            settings: data.settings || {},
            updated_at: new Date(data.updatedAt || Date.now()).toISOString()
          });
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
            example_ru: data.exampleRu || data.example_ru || "",
            example_en: data.exampleEn || data.example_en || "",
            deck_id: data.deckId || "custom",
            updated_at: new Date(data.updatedAt || Date.now()).toISOString()
          };
          const { error } = await this.client.from("voc_words").upsert(payload);
          if (error) {
            console.warn("[SupabaseSync] Upsert with deck_id failed, retrying without it:", error);
            delete payload.deck_id;
            await this.client.from("voc_words").upsert(payload);
          }
        } else if (type === "word_delete") {
          await this.client.from("voc_words").delete().match({
            user_id: this.user.id,
            id: id
          });
        } else if (type === "reset") {
          // Bulk delete on cloud
          await Promise.all([
            this.client.from("voc_progress").delete().match({ user_id: this.user.id }),
            this.client.from("voc_words").delete().match({ user_id: this.user.id }),
            this.client.from("voc_stats").delete().match({ user_id: this.user.id })
          ]);
        }
      } catch (e) {
        console.warn("Background auto-sync failed (likely offline):", e);
      }
    },

    // Bidirectional Sync algorithm
    syncBoth: async function () {
      if (this.connectionState !== "connected" || !this.user) {
        alert("Please sign in first to synchronize your progress.");
        return false;
      }

      if (this.isSyncing) return;
      this.isSyncing = true;
      this.updateSyncButtonState(true);

      try {
        console.log("[SupabaseSync] Starting bidirectional sync...");

        // 1. SYNC CUSTOM WORDS & OVERRIDES (voc_words)
        const { data: dbWords, error: errWords } = await this.client
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

        // Push new/updated words to Supabase
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
            example_ru: w.exampleRu || w.example_ru || "",
            example_en: w.exampleEn || w.example_en || "",
            deck_id: w.deckId || "custom",
            updated_at: new Date(w.updatedAt || Date.now()).toISOString()
          }));
 
          const { error: pushErr } = await this.client
            .from("voc_words")
            .upsert(rowsToPush);
          if (pushErr) {
            console.warn("[SupabaseSync] Syncing words with deck_id failed, retrying without it:", pushErr);
            const fallbackRows = rowsToPush.map(row => {
              const r = { ...row };
              delete r.deck_id;
              return r;
            });
            const { error: fallbackErr } = await this.client
              .from("voc_words")
              .upsert(fallbackRows);
            if (fallbackErr) throw fallbackErr;
          }
        }


        // 2. SYNC FLASHCARD PROGRESS (voc_progress)
        const { data: dbProg, error: errProg } = await this.client
          .from("voc_progress")
          .select("*");
        if (errProg) throw errProg;

        const localProgMap = { ...window.SRS.getCardProgressMap() };
        const dbProgMap = {};
        dbProg.forEach(p => { dbProgMap[p.word_id] = p; });

        const toPushProg = [];

        // Merge local card progress with Supabase
        Object.keys(localProgMap).forEach(wId => {
          const dbP = dbProgMap[wId];
          if (dbP) {
            const dbTime = Date.parse(dbP.updated_at);
            const localTime = localProgMap[wId].updatedAt || 0;

            if (localTime > dbTime) {
              toPushProg.push(localProgMap[wId]);
            } else if (dbTime > localTime) {
              localProgMap[wId] = {
                id: wId,
                box: dbP.box,
                nextReview: Number(dbP.next_review),
                correctCount: dbP.correct_count || 0,
                wrongCount: dbP.wrong_count || 0,
                starred: !!dbP.starred,
                hidden: !!dbP.hidden,
                updatedAt: dbTime
              };
            }
          } else {
            // Exists locally but not in DB
            toPushProg.push(localProgMap[wId]);
          }
        });

        // Add DB cards not present locally
        dbProg.forEach(dbP => {
          if (!localProgMap[dbP.word_id]) {
            localProgMap[dbP.word_id] = {
              id: dbP.word_id,
              box: dbP.box,
              nextReview: Number(dbP.next_review),
              correctCount: dbP.correct_count || 0,
              wrongCount: dbP.wrong_count || 0,
              starred: !!dbP.starred,
              hidden: !!dbP.hidden,
              updatedAt: Date.parse(dbP.updated_at)
            };
          }
        });

        // Push new/updated progress rows
        if (toPushProg.length > 0) {
          const rowsToPush = toPushProg.map(p => ({
            user_id: this.user.id,
            word_id: p.id,
            box: p.box,
            next_review: p.nextReview,
            correct_count: p.correctCount || 0,
            wrong_count: p.wrongCount || 0,
            starred: !!p.starred,
            hidden: !!p.hidden,
            updated_at: new Date(p.updatedAt || Date.now()).toISOString()
          }));

          const { error: pushProgErr } = await this.client
            .from("voc_progress")
            .upsert(rowsToPush);
          if (pushProgErr) throw pushProgErr;
        }


        // 3. SYNC GLOBAL STATS (voc_stats)
        const { data: dbStatsRows, error: errStats } = await this.client
          .from("voc_stats")
          .select("*")
          .match({ user_id: this.user.id });
        if (errStats) throw errStats;

        const localStats = { ...window.SRS.getGlobalStats() };

        if (dbStatsRows.length === 0) {
          // Push local stats to cloud
          localStats.updatedAt = localStats.updatedAt || Date.now();
          const { error: pushStatsErr } = await this.client
            .from("voc_stats")
            .upsert({
              user_id: this.user.id,
              xp: localStats.xp || 0,
              streak: localStats.streak || 0,
              last_active_date: localStats.lastActiveDate,
              total_correct: localStats.totalCorrect || 0,
              total_attempts: localStats.totalAttempts || 0,
              daily_xp_log: localStats.dailyXpLog || {},
              settings: localStats.settings || {},
              updated_at: new Date(localStats.updatedAt).toISOString()
            });
          if (pushStatsErr) throw pushStatsErr;
        } else {
          const dbStats = dbStatsRows[0];
          const dbTime = Date.parse(dbStats.updated_at);
          const localTime = localStats.updatedAt || 0;

          // Merge daily XP logs (take union of dates and maximum of XP per date)
          const mergedDailyXp = { ...(dbStats.daily_xp_log || {}), ...(localStats.dailyXpLog || {}) };
          Object.keys(mergedDailyXp).forEach(date => {
            const dbXp = (dbStats.daily_xp_log && dbStats.daily_xp_log[date]) || 0;
            const localXp = (localStats.dailyXpLog && localStats.dailyXpLog[date]) || 0;
            mergedDailyXp[date] = Math.max(dbXp, localXp);
          });

          localStats.dailyXpLog = mergedDailyXp;

          if (localTime > dbTime) {
            // Local stats are newer - push merged logs
            localStats.updatedAt = Date.now();
            const { error: pushStatsErr } = await this.client
              .from("voc_stats")
              .upsert({
                user_id: this.user.id,
                xp: localStats.xp || 0,
                streak: localStats.streak || 0,
                last_active_date: localStats.lastActiveDate,
                total_correct: localStats.totalCorrect || 0,
                total_attempts: localStats.totalAttempts || 0,
                daily_xp_log: mergedDailyXp,
                settings: localStats.settings || {},
                updated_at: new Date(localStats.updatedAt).toISOString()
              });
            if (pushStatsErr) throw pushStatsErr;
          } else {
            // DB stats are newer or equal - pull down merged stats
            localStats.xp = dbStats.xp;
            localStats.streak = dbStats.streak;
            localStats.last_active_date = dbStats.last_active_date;
            localStats.total_correct = dbStats.total_correct;
            localStats.total_attempts = dbStats.total_attempts;
            localStats.settings = dbStats.settings || {};
            localStats.updatedAt = dbTime;
            
            // Re-upsert immediately to sync the merged daily logs
            const { error: pushStatsErr } = await this.client
              .from("voc_stats")
              .upsert({
                user_id: this.user.id,
                xp: localStats.xp,
                streak: localStats.streak,
                last_active_date: localStats.last_active_date,
                total_correct: localStats.total_correct,
                total_attempts: localStats.total_attempts,
                daily_xp_log: mergedDailyXp,
                settings: localStats.settings || {},
                updated_at: new Date().toISOString()
              });
            if (pushStatsErr) throw pushStatsErr;
          }
        }


        // 4. WRITE BACK TO STORAGE AND REFRESH UI
        window.SRS.setAllData(
          localProgMap,
          Object.values(finalCustomWordsMap),
          localStats,
          finalOverridesMap
        );

        const syncTime = new Date().toLocaleString();
        localStorage.setItem(STORAGE_KEYS.LAST_SYNC, syncTime);
        console.log("[SupabaseSync] Sync completed successfully at:", syncTime);

        // Refresh UI
        if (window.refreshAppUI) {
          window.refreshAppUI();
        }

        this.isSyncing = false;
        this.updateSyncButtonState(false);
        this.updateUI();
        return true;
      } catch (e) {
        console.error("Bidirectional Sync failed:", e);
        alert("Synchronization failed: " + e.message);
        this.isSyncing = false;
        this.updateSyncButtonState(false);
        this.updateUI();
        return false;
      }
    },

    onLoginSuccess: function () {
      console.log("Logged in user:", this.user.email);
      // Run automatic pull/push sync in background on login
      setTimeout(() => {
        this.syncBoth().then((success) => {
          if (success) {
            console.log("Auto-sync on login complete.");
            if (window.syncPushSubscriptionWithCloud) {
              window.syncPushSubscriptionWithCloud();
            }
          }
        });
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
    }
  };

  window.SupabaseSync = SupabaseSync;
})();
