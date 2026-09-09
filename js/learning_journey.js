/* Learning plans and evidence summaries. No UI or network dependencies. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.LearningJourney = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  const DAY = 86400000;
  const SESSION_KEY = "voc_russian_session_v1";
  function dateKey(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }
  function eventsFor(progress) {
    return (progress.reviewEvents || []).filter(e => Number.isFinite(e.at)).slice().sort((a, b) => a.at - b.at);
  }
  function needsPractice(progress) {
    const events = eventsFor(progress);
    return events.length > 0 && events[events.length - 1].correct === false;
  }
  function mission(words, progress, now = Date.now(), limit = 8) {
    const buckets = { review: [], tricky: [], fresh: [] };
    words.forEach(word => {
      const p = progress[word.id] || {};
      if (p.hidden) return;
      const seen = (p.correctCount || 0) + (p.wrongCount || 0) > 0;
      if (needsPractice(p)) buckets.tricky.push(word);
      else if (!seen) buckets.fresh.push(word);
      else if ((p.nextReview || 0) <= now) buckets.review.push(word);
    });
    buckets.review.sort((a, b) => (progress[a.id].nextReview || 0) - (progress[b.id].nextReview || 0));
    buckets.tricky.sort((a, b) => eventsFor(progress[b.id]).at(-1).at - eventsFor(progress[a.id]).at(-1).at);
    const selected = [];
    function take(type, count) {
      buckets[type].splice(0, count).forEach(word => selected.push({ id: word.id, type }));
    }
    take("review", Math.min(4, limit));
    take("tricky", Math.min(2, limit - selected.length));
    take("fresh", Math.min(2, limit - selected.length));
    for (const type of ["review", "tricky", "fresh"]) take(type, limit - selected.length);
    return { items: selected, minutes: Math.max(1, Math.ceil(selected.length * 20 / 60)), counts: {
      review: selected.filter(x => x.type === "review").length,
      tricky: selected.filter(x => x.type === "tricky").length,
      fresh: selected.filter(x => x.type === "fresh").length
    } };
  }
  function weekly(progress, stats, now = Date.now()) {
    const start = new Date(now); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - 6);
    const remembered = new Set(), recovered = new Set(), practiced = new Set(), skills = new Set();
    Object.entries(progress).forEach(([id, p]) => {
      if (p.hidden) return;
      const events = eventsFor(p);
      events.forEach((event, index) => {
        if (event.at < start.getTime() || event.at > now) return;
        practiced.add(id);
        if (event.mode) skills.add(event.mode);
        const previous = events[index - 1];
        if (event.correct && previous && event.at - previous.at >= 2 * DAY) remembered.add(id);
        if (event.correct && previous && previous.correct === false && event.at > previous.at) recovered.add(id);
      });
    });
    const activeDays = Object.entries(stats.dailyXpLog || {}).filter(([date, xp]) => date >= dateKey(start) && date <= dateKey(new Date(now)) && xp > 0).length;
    for (const activity of stats.activityLog || []) {
      if (activity.occurredAt >= start.getTime() && activity.occurredAt <= now && activity.source !== "vocab_review") skills.add(activity.source);
    }
    // Repeating a challenge is still practice even though its one-time XP reward
    // no longer creates an activity entry.
    for (const completion of Object.values(stats.settings?.journeyChallenges || {})) {
      if (completion.completedAt >= start.getTime() && completion.completedAt <= now) skills.add("challenge");
    }
    return { remembered: remembered.size, recovered: recovered.size, practiced: practiced.size,
      rememberedIds: [...remembered], recoveredIds: [...recovered], activeDays, skills: [...skills] };
  }
  function normalizeAnswer(value) {
    return String(value).normalize("NFC").toLowerCase().replace(/\u0301/g, "").replace(/ё/g, "е").replace(/[.,!?—–:;"«»]/g, "").replace(/\s+/g, " ").trim();
  }
  function readSession(storage) {
    try {
      const s = JSON.parse(storage.getItem(SESSION_KEY));
      if (!s || s.version !== 1 || typeof s.id !== "string" || typeof s.db !== "string" || !["flashcard", "choice", "writing", "visual", "pronunciation"].includes(s.mode)) return null;
      if (!Array.isArray(s.ids) || !s.ids.length || s.ids.length > 999 || !s.ids.every(id => typeof id === "string") || new Set(s.ids).size !== s.ids.length) return null;
      if (!Array.isArray(s.history) || s.history.length > s.ids.length || !s.history.every((h, i) => h.wordId === s.ids[i] && typeof h.isCorrect === "boolean" && Number.isFinite(h.xp))) return null;
      return s;
    } catch { return null; }
  }
  return { DAY, SESSION_KEY, dateKey, eventsFor, needsPractice, mission, weekly, normalizeAnswer, readSession };
});
