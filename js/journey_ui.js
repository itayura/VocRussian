(function () {
  const J = window.LearningJourney;
  const CHALLENGE_KEY = "voc_russian_challenge_session_v1";
  let actions;
  let retryIds = [];
  let retryDb;
  let challengeState = null;
  let questionAnswered = false;
  const $ = id => document.getElementById(id);
  function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  function savedChallenge() {
    try {
      const saved = JSON.parse(localStorage.getItem(CHALLENGE_KEY));
      const challenge = RussianChallenges.find(c => c.id === saved?.id);
      return challenge && Number.isInteger(saved.step) && saved.step >= 0 && saved.step <= challenge.phrases.length + challenge.questions.length ? saved : null;
    } catch { return null; }
  }
  function missionKey() { return `${J.dateKey()}:${SRS.getActiveDb()}`; }
  function renderDailyGoal(id) {
    const today = SRS.getStatsSummary().dailyXpLog[J.dateKey()] || 0;
    const goal = SRS.getDailyStreakGoal();
    const root = $(id);
    root.replaceChildren();
    const line = element("div", undefined, "daily-goal-label");
    line.append(element("strong", today >= goal ? "✓ Daily goal complete" : "Today's goal"), element("span", `${today} / ${goal} XP`));
    const bar = element("progress"); bar.max = goal; bar.value = Math.min(today, goal);
    bar.setAttribute("aria-label", "Progress toward today's XP goal");
    root.append(line, bar);
    if (id === "complete-daily-goal") root.append(element("p", today >= goal ? "Done for today. Come back when you're ready." : `${goal - today} XP to your daily goal. Every due review counts.`, "journey-muted"));
  }
  function render() {
    const plan = J.mission(SRS.getAllWords(), SRS.getCardProgressMap());
    const completed = (SRS.getSetting("journeyMissions", {}) || {})[missionKey()];
    const button = $("daily-mission-start");
    button.disabled = !plan.items.length || !!completed;
    button.textContent = completed ? "✓ Mission complete" : plan.items.length ? `Start today's mission · ${plan.items.length} words` : "No mission waiting";
    $("daily-mission-summary").textContent = completed
      ? "Your mission is done. Explore a challenge, or enjoy the rest of your day."
      : plan.items.length ? `About ${plan.minutes} min · ${plan.counts.review} reviews · ${plan.counts.tricky} tricky · ${plan.counts.fresh} new` : "You're up to date with this deck. Try a real-life challenge below.";
    renderDailyGoal("dashboard-daily-goal");
    const saved = J.readSession(localStorage);
    $("resume-session-card").hidden = !saved;
    if (saved) {
      const remaining = saved.ids.length - saved.history.length;
      $("resume-session-description").textContent = remaining ? `${remaining} ${remaining === 1 ? "word" : "words"} left · ${saved.mode === "choice" ? "multiple choice" : saved.mode} · saved on this device` : "Your answers are saved. Your session recap is ready.";
      $("resume-session-btn").textContent = remaining ? "Continue session →" : "See session recap →";
    }
    const summary = J.weekly(SRS.getCardProgressMap(), SRS.getGlobalStats());
    const metrics = $("weekly-learning-metrics"); metrics.replaceChildren();
    [[summary.remembered, "Recalled after 2+ days"], [summary.recovered, "Difficult words recovered"], [summary.practiced, "Different words practiced"]].forEach(([count, label]) => {
      const metric = element("div", undefined, "learning-metric");
      metric.append(element("strong", String(count)), element("span", label)); metrics.append(metric);
    });
    const labels = { flashcard: "recall", visual: "visual recall", choice: "recognition", writing: "spelling", pronunciation: "speaking", challenge: "real-life phrases" };
    const skills = [...new Set(summary.skills.map(s => labels[s] || (s.includes("grammar") || s.includes("aspect") ? "grammar" : s.includes("alphabet") ? "alphabet" : "other practice")))];
    $("weekly-learning-story").textContent = summary.practiced || skills.length
      ? `${summary.activeDays} ${summary.activeDays === 1 ? "day" : "days"} with earned XP.${skills.length ? ` You practiced ${skills.join(", ")}.` : " Your word practice is adding up."}`
      : "Your story starts with one session. Return after a few days to see which words stayed with you.";
    const examples = $("weekly-learning-examples"); examples.replaceChildren();
    const vocabulary = new Map([...(window.defaultVocabulary || []), ...(window.expandedVocabulary || []), ...(window.exampleVocabulary || []), ...SRS.getCustomWordsList()].map(word => [word.id, word]));
    [[summary.rememberedIds, "Still with you"], [summary.recoveredIds, "Recalled after a mistake"]].forEach(([ids, label]) => {
      const words = ids.map(id => vocabulary.get(id)).filter(Boolean).slice(0, 4);
      if (!words.length) return;
      const row = element("div", undefined, "weekly-word-examples"); row.append(element("span", label));
      words.forEach(word => { const chip = element("span", word.accented || word.word, "tricky-word-chip"); chip.lang = "ru"; row.append(chip); });
      examples.append(row);
    });
    renderChallengeCards();
  }
  function finish({ history, words, purpose, db }) {
    localStorage.removeItem(J.SESSION_KEY);
    if (purpose?.type === "mission") {
      const records = SRS.getSetting("journeyMissions", {}) || {};
      records[purpose.key] = { completedAt: Date.now(), words: history.length };
      const latest = Object.entries(records).sort((a, b) => b[1].completedAt - a[1].completedAt).slice(0, 30);
      SRS.setSetting("journeyMissions", Object.fromEntries(latest));
    }
    retryIds = [...new Set(history.filter(h => !h.isCorrect).map(h => h.wordId))];
    retryDb = db;
    const correct = history.filter(h => h.isCorrect).length;
    $("complete-learning-summary").textContent = `You recalled ${correct} of ${history.length} ${history.length === 1 ? "word" : "words"}.${retryIds.length ? ` ${retryIds.length === 1 ? "One word needs" : `${retryIds.length} words need`} another look.` : " Every word in this session recalled. Nicely done."}`;
    $("complete-retry-btn").hidden = !retryIds.length;
    $("complete-retry-btn").textContent = retryIds.length === 1 ? "Practice this word →" : `Practice those ${retryIds.length} →`;
    const list = $("complete-tricky-words"); list.replaceChildren();
    retryIds.forEach(id => {
      const word = words.find(w => w.id === id);
      if (word) { const chip = element("span", word.accented || word.word, "tricky-word-chip"); chip.lang = "ru"; list.append(chip); }
    });
    $("complete-retry-note").hidden = !retryIds.length;
    renderDailyGoal("complete-daily-goal");
  }
  function renderChallengeCards() {
    const grid = $("real-life-challenges"); grid.replaceChildren();
    const progress = SRS.getSetting("journeyChallenges", {}) || {};
    const saved = savedChallenge();
    RussianChallenges.forEach(challenge => {
      const button = element("button", undefined, "challenge-card"); button.type = "button";
      button.append(element("span", challenge.icon, "challenge-icon"), element("strong", challenge.title), element("span", challenge.description, "journey-muted"));
      button.append(element("span", saved?.id === challenge.id ? "Continue challenge →" : progress[challenge.id] ? "✓ Completed · Practice again →" : "About 3 min · Try it →", "challenge-card-action"));
      button.addEventListener("click", () => openChallenge(challenge.id)); grid.append(button);
    });
  }
  function openChallenge(id) {
    const saved = savedChallenge();
    challengeState = saved?.id === id ? saved : { id, step: 0 };
    // Each challenge is short; ask before replacing a different paused challenge.
    if (saved && saved.id !== id) {
      window.confirmCustom("Start this challenge? This will replace your paused challenge. Completed challenges stay saved.").then(ok => {
        if (ok) { localStorage.setItem(CHALLENGE_KEY, JSON.stringify(challengeState)); $("challenge-dialog").showModal(); renderChallenge(); }
      });
      return;
    }
    localStorage.setItem(CHALLENGE_KEY, JSON.stringify(challengeState));
    $("challenge-dialog").showModal(); renderChallenge();
  }
  function renderChallenge() {
    const challenge = RussianChallenges.find(c => c.id === challengeState.id);
    const total = challenge.phrases.length + challenge.questions.length;
    $("challenge-title").textContent = challenge.title;
    $("challenge-step-label").textContent = challengeState.step >= total ? "Challenge complete" : `${challengeState.step < challenge.phrases.length ? "Learn" : "Try it"} · ${challengeState.step + 1} of ${total}`;
    $("challenge-progress").max = total; $("challenge-progress").value = challengeState.step;
    const body = $("challenge-body"); body.replaceChildren(); questionAnswered = false;
    $("challenge-next-btn").hidden = false;
    $("challenge-next-btn").disabled = false;
    $("challenge-next-btn").textContent = "Continue →";
    $("challenge-feedback").textContent = "";
    $("challenge-feedback").className = "challenge-feedback";
    if (challengeState.step >= total) {
      const records = SRS.getSetting("journeyChallenges", {}) || {};
      const rewardKey = `challenge_${challenge.id}`;
      const firstCompletion = !SRS.getSetting(rewardKey, false);
      if (firstCompletion) {
        // Persist the claim before granting a one-time completion reward.
        SRS.setSetting(rewardKey, true);
        SRS.addActivityXP(20, "challenge", { challengeId: challenge.id });
      }
      records[challenge.id] = { completedAt: Date.now(), completions: (records[challenge.id]?.completions || 0) + 1 };
      SRS.setSetting("journeyChallenges", records);
      localStorage.removeItem(CHALLENGE_KEY);
      body.append(element("div", "✓", "challenge-success"), element("h3", challenge.outcome), element("p", firstCompletion ? "+20 XP · First completion" : "A useful refresher. Your first-completion reward was already earned.", "journey-muted"));
      challenge.phrases.forEach(p => { const phrase = element("p", p.ru, "challenge-recap-phrase"); phrase.lang = "ru"; body.append(phrase, element("p", p.en, "journey-muted")); });
      body.append(element("p", "Try using one of these phrases in your next conversation.", "journey-muted"));
      $("challenge-next-btn").textContent = "Finish for today";
      render();
    } else if (challengeState.step < challenge.phrases.length) {
      const phrase = challenge.phrases[challengeState.step];
      const ru = element("h3", phrase.ru, "challenge-phrase"); ru.lang = "ru";
      body.append(ru, element("p", phrase.en, "challenge-translation"), element("p", phrase.hint, "journey-muted"));
      const audio = element("div", undefined, "challenge-audio");
      [["Listen", 1], ["Listen slowly", .6]].forEach(([label, rate]) => {
        const button = element("button", `◖)) ${label}`, "btn btn-secondary"); button.type = "button";
        button.addEventListener("click", () => window.AudioEngine.speak(phrase.ru, rate)); audio.append(button);
      });
      body.append(audio, element("p", "Say it aloud once, then continue.", "journey-muted"));
    } else {
      const question = challenge.questions[challengeState.step - challenge.phrases.length];
      body.append(element("h3", question.prompt));
      $("challenge-next-btn").disabled = true;
      if (question.choices) {
        const choices = element("div", undefined, "challenge-choices");
        // Rotate the options deterministically so the answer isn't always first.
        const offset = challengeState.step % question.choices.length;
        const ordered = [...question.choices.slice(offset), ...question.choices.slice(0, offset)];
        ordered.forEach(choice => {
          const button = element("button", choice, "btn btn-secondary"); button.type = "button";
          button.addEventListener("click", () => {
            if (questionAnswered) return;
            const correct = choice === question.answer;
            checkChallengeAnswer(correct, question);
            button.classList.add(correct ? "challenge-correct" : "challenge-incorrect");
            if (correct) choices.querySelectorAll("button").forEach(b => b.disabled = true);
          });
          choices.append(button);
        });
        body.append(choices);
      } else {
        const form = element("form", undefined, "challenge-writing");
        const label = element("label", "Your answer in Russian"); label.htmlFor = "challenge-answer";
        const input = element("input"); input.id = "challenge-answer"; input.className = "filter-input";
        input.lang = "ru"; input.autocomplete = "off"; input.spellcheck = false;
        const submit = element("button", "Check answer", "btn btn-primary"); submit.type = "submit";
        const hint = element("details"); hint.append(element("summary", "Need a hint?"), element("p", question.hint));
        const keyboard = element("details"); keyboard.append(element("summary", "Russian keyboard"));
        const keys = element("div", undefined, "challenge-keyboard");
        [..."йцукенгшщзхъфывапролджэячсмитьбюё", " ", "⌫"].forEach(letter => {
          const key = element("button", letter === " " ? "Space" : letter); key.type = "button";
          key.setAttribute("aria-label", letter === "⌫" ? "Backspace" : letter === " " ? "Space" : letter);
          key.addEventListener("click", () => {
            if (questionAnswered) return;
            const start = input.selectionStart ?? input.value.length, end = input.selectionEnd ?? start;
            input.setRangeText(letter === "⌫" ? "" : letter, letter === "⌫" && start === end ? Math.max(0, start - 1) : start, end, "end");
            input.focus();
          }); keys.append(key);
        });
        keyboard.append(keys);
        form.addEventListener("submit", event => {
          event.preventDefault(); if (questionAnswered) return;
          checkChallengeAnswer(J.normalizeAnswer(input.value) === J.normalizeAnswer(question.answer), question);
          if (questionAnswered) { input.disabled = true; submit.disabled = true; }
        });
        form.append(label, input, submit, hint, keyboard); body.append(form);
      }
    }
    $("challenge-dialog").scrollTop = 0;
    $("challenge-title").focus({ preventScroll: true });
  }
  function checkChallengeAnswer(correct, question) {
    questionAnswered = correct;
    $("challenge-feedback").textContent = correct ? `✓ ${question.explanation}` : "Not quite. Take another look and try again.";
    $("challenge-feedback").className = `challenge-feedback ${correct ? "challenge-correct" : "challenge-incorrect"}`;
    $("challenge-next-btn").disabled = !correct;
  }
  function setup(callbacks) {
    actions = callbacks;
    $("daily-mission-start").addEventListener("click", () => {
      const plan = J.mission(SRS.getAllWords(), SRS.getCardProgressMap());
      if (plan.items.length) actions.start("flashcard", { ids: plan.items.map(x => x.id), purpose: { type: "mission", key: missionKey() } });
    });
    $("resume-session-btn").addEventListener("click", actions.resume);
    $("complete-retry-btn").addEventListener("click", () => {
      if (retryIds.length) {
        SRS.setActiveDb(retryDb);
        actions.start("flashcard", { ids: retryIds, purpose: { type: "retry" } });
      }
    });
    $("challenge-close-btn").addEventListener("click", () => $("challenge-dialog").close());
    $("challenge-dialog").addEventListener("close", () => { window.speechSynthesis?.cancel(); render(); });
    $("challenge-next-btn").addEventListener("click", () => {
      const challenge = RussianChallenges.find(c => c.id === challengeState.id);
      if (challengeState.step >= challenge.phrases.length + challenge.questions.length) { $("challenge-dialog").close(); return; }
      if (challengeState.step >= challenge.phrases.length && !questionAnswered) return;
      challengeState.step++;
      localStorage.setItem(CHALLENGE_KEY, JSON.stringify(challengeState));
      renderChallenge();
    });
    document.addEventListener("visibilitychange", () => { if (!document.hidden) render(); });
  }
  window.JourneyUI = { setup, render, finish };
})();
