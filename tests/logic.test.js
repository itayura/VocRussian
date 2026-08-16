const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function makeStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
    clear: () => values.clear()
  };
}

function loadSRS() {
  const localStorage = makeStorage();
  const context = {
    window: { defaultVocabulary: [{ id: "w1", word: "test", translation: "test", level: "A1" }], expandedVocabulary: [] },
    localStorage, console: { ...console, error() {} }, Intl, Date, Math, JSON, setTimeout, clearTimeout
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync("js/srs.js", "utf8"), context);
  context.window.SRS.init();
  return { SRS: context.window.SRS, localStorage };
}

function loadGrammar() {
  const localStorage = makeStorage();
  const document = {
    readyState: "loading",
    addEventListener() {},
    getElementById() { return null; },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    createElement() { return { innerHTML: "", content: { querySelectorAll: () => [] } }; }
  };
  const context = {
    window: { SRS: { addActivityXP() {} } }, localStorage, document,
    console, Date, Math, JSON, setTimeout, clearTimeout, alert() {}
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync("js/grammar.js", "utf8"), context);
  context.window.GrammarManager.loadFromStorage();
  return context.window.GrammarManager;
}

test("streak starts at the documented 20 XP goal and only increments once per day", () => {
  const { SRS } = loadSRS();
  SRS.addActivityXP(10, "test");
  assert.equal(SRS.getStatsSummary().streak, 0);
  SRS.addActivityXP(10, "test");
  assert.equal(SRS.getStatsSummary().streak, 1);
  SRS.addActivityXP(50, "test");
  assert.equal(SRS.getStatsSummary().streak, 1);
  assert.equal(SRS.getGlobalStats().settings.maxStreak, 1);
});

test("SRS ratings use distinct intervals and non-due reviews cannot farm XP", () => {
  const goodContext = loadSRS();
  const good = goodContext.SRS.scoreCard("w1", true, "good");
  assert.equal(good.newBox, 2);
  assert.equal(good.xpGained, 15);
  assert.ok(good.nextReview - Date.now() > 1.9 * 86400000);
  const repeated = goodContext.SRS.scoreCard("w1", true, "good");
  assert.equal(repeated.newBox, 2);
  assert.equal(repeated.xpGained, 0);

  const easyContext = loadSRS();
  const easy = easyContext.SRS.scoreCard("w1", true, "easy");
  assert.equal(easy.newBox, 3);
  assert.ok(easy.nextReview - Date.now() > 3.9 * 86400000);

  const hardContext = loadSRS();
  hardContext.SRS.setCardBox("w1", 4);
  hardContext.SRS.getCardProgress("w1").nextReview = Date.now() - 1;
  const hard = hardContext.SRS.scoreCard("w1", false, "hard");
  assert.equal(hard.newBox, 1);
  assert.equal(hard.xpGained, 5);
});

test("backup import is validated before state is changed", () => {
  const { SRS } = loadSRS();
  SRS.addActivityXP(20, "test");
  const before = SRS.exportJSON();
  assert.equal(SRS.importJSON('{"progress":[]}'), false);
  assert.equal(SRS.getStatsSummary().xp, 20);
  assert.equal(SRS.importJSON(before), true);
  assert.equal(SRS.getStatsSummary().xp, 20);
});

test("grammar mastery is evidence-based and lesson completion is not treated as proficiency", () => {
  const grammar = loadGrammar();
  assert.equal(grammar.recordLessonCompleted("nominative_case"), true);
  assert.equal(grammar.recordLessonCompleted("nominative_case"), false);
  assert.equal(grammar.getTopicMastery("nominative_case", "A1"), 0);

  assert.equal(grammar.recordQuizCompleted("nominative_case", "A1", 5, 5), true);
  assert.equal(grammar.getTopicMastery("nominative_case", "A1"), 75);
  assert.equal(grammar.getTopicMastery("nominative_case"), 26);

  grammar.recordQuizCompleted("nominative_case", "A1", 0, 3);
  const progress = grammar.getGrammarProgressMap().nominative_case_A1;
  assert.equal(progress.totalCorrect, 5);
  assert.equal(progress.totalQuestions, 8);
  assert.equal(progress.avgScore, 63);
  assert.equal(grammar.getTopicMastery("nominative_case", "A1"), 40);
  assert.equal(grammar.getGrammarLevel(), "Pre-A1");
  assert.equal(grammar.recordQuizCompleted("nominative_case", "A1", 6, 5), false);
});

test("grammar CEFR requires breadth and discounts stale evidence", () => {
  const grammar = loadGrammar();
  const topics = [
    "nominative_case", "accusative_case", "genitive_case", "dative_case",
    "instrumental_case", "prepositional_case", "verb_aspects"
  ];
  topics.slice(0, 6).forEach(topic => grammar.recordQuizCompleted(topic, "A1", 9, 10));
  assert.equal(grammar.getGrammarLevel(), "Pre-A1");
  assert.ok(grammar.getGrammarProficiency().readiness.A1.progress < 100);

  grammar.recordQuizCompleted(topics[6], "A1", 9, 10);
  assert.equal(grammar.getGrammarLevel(), "A1");
  assert.equal(grammar.getGrammarProficiency().targetLevel, "A2");

  const now = Date.now();
  grammar.setGrammarProgressMap({
    nominative_case_A1: {
      topicId: "nominative_case_A1",
      attempts: [{ id: "old", correct: 40, total: 40, at: now - (360 * 86400000) }]
    }
  });
  const staleMastery = grammar.getTopicMastery("nominative_case", "A1");
  grammar.setGrammarProgressMap({
    nominative_case_A1: {
      topicId: "nominative_case_A1",
      attempts: [{ id: "recent", correct: 40, total: 40, at: now }]
    }
  });
  assert.ok(grammar.getTopicMastery("nominative_case", "A1") > staleMastery);
});

test("placement creates an estimate without inventing topic mastery", () => {
  const grammar = loadGrammar();
  assert.equal(grammar.recordPlacementAssessment("B1", [
    { level: "A1", correct: 5, total: 5 },
    { level: "A2", correct: 4, total: 5 },
    { level: "B1", correct: 3, total: 5 }
  ]), true);
  const proficiency = grammar.getGrammarProficiency();
  assert.equal(proficiency.level, "B1");
  assert.equal(proficiency.basis, "placement");
  assert.equal(grammar.getTopicMastery("nominative_case"), 0);
  assert.equal(grammar.getGrammarProgressMap().nominative_case, undefined);

  const beginner = loadGrammar();
  assert.equal(beginner.recordPlacementAssessment("Pre-A1", [
    { level: "A1", correct: 2, total: 5 }
  ]), true);
  assert.equal(beginner.getGrammarProficiency().level, "Pre-A1");
  assert.equal(beginner.getGrammarProficiency().basis, "placement");
});

test("placement question source and generated JSON stay valid and in sync", () => {
  const source = fs.readFileSync("js/placement.js", "utf8");
  const start = source.indexOf("const PLACEMENT_QUESTIONS = ");
  const end = source.indexOf("];", start);
  const questions = vm.runInNewContext(source.slice(start + "const PLACEMENT_QUESTIONS = ".length, end + 1));
  const snapshot = JSON.parse(fs.readFileSync("placement_questions.json", "utf8"));
  assert.equal(JSON.stringify(questions), JSON.stringify(snapshot));
  for (const level of ["A1", "A2", "B1", "B2", "C1", "C2"]) {
    assert.ok(questions.filter(question => question.level === level).length >= 5);
  }
  questions.forEach(question => assert.ok(question.choices.includes(question.answer), "Question " + question.id + " is missing its answer choice"));
});

test("expanded vocabulary does not contain indistinguishable duplicate cards", () => {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync("js/db_expanded.js", "utf8"), context);
  const keys = context.window.expandedVocabulary.map(word => word.word.normalize("NFC").toLowerCase() + "|" + word.translation.toLowerCase());
  assert.equal(new Set(keys).size, keys.length);
});

test("AI quiz validation rejects malformed and ambiguous questions", () => {
  const grammar = loadGrammar();
  const validQuestion = {
    topicId: "pronouns_declension",
    sentencePattern: "Это [blank] (твой) имя?",
    answer: "твоё",
    choices: ["твоё", "твоя", "твои", "твоей"],
    translation: "Is this your name?",
    transliteration: "Eto tvoyo imya?",
    explanation: "Имя is neuter, so твоё is required."
  };
  const malformedNameQuestion = {
    ...validQuestion,
    sentencePattern: "Как [blank] (имя) тебя зовут?",
    translation: "What is your name?"
  };
  const duplicateChoices = {
    ...validQuestion,
    choices: ["твоё", "твоя", "твои", "твоё"]
  };

  assert.equal(grammar.isValidQuizQuestion(validQuestion, ["pronouns_declension"]), true);
  assert.equal(grammar.isValidQuizQuestion(malformedNameQuestion, ["pronouns_declension"]), false);
  assert.equal(grammar.isValidQuizQuestion(duplicateChoices, ["pronouns_declension"]), false);
  assert.equal(grammar.filterQuizQuestions([validQuestion, malformedNameQuestion], ["pronouns_declension"]).length, 1);
});

test("example vocabulary deck loads, contains unique cards, and integrates with SRS", () => {
  const context = { window: {}, localStorage: {
    data: {},
    getItem: function(k) { return this.data[k] || null; },
    setItem: function(k, v) { this.data[k] = String(v); },
    removeItem: function(k) { delete this.data[k]; }
  } };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync("js/db_example.js", "utf8"), context);
  const words = context.window.exampleVocabulary;
  assert.ok(Array.isArray(words));
  assert.ok(words.length >= 500, `Expected at least 500 words, got ${words.length}`);
  
  const keys = words.map(w => w.word.normalize("NFC").toLowerCase());
  assert.equal(new Set(keys).size, keys.length, "Example vocabulary contains duplicate Russian words");

    words.forEach(w => {
    assert.ok(w.id && w.id.startsWith("vx_"), `Word ${w.word} has invalid ID`);
    assert.ok(w.word && w.word.length > 0, "Word is missing Russian text");
    assert.ok(w.translation && w.translation.length > 0, `Word ${w.word} is missing translation`);
    assert.ok(w.category && w.category.length > 0, `Word ${w.word} is missing category`);
    assert.ok(w.level && ["A1", "A2", "B1", "B2", "C1", "C2"].includes(w.level), `Word ${w.word} has invalid level`);
    assert.ok(w.exampleRu && w.exampleRu.length > 15, `Word ${w.word} is missing valid Russian example sentence`);
    assert.ok(w.exampleEn && w.exampleEn.length > 15, `Word ${w.word} is missing valid English example sentence`);
    assert.ok(!w.exampleRu.startsWith("Пример:"), `Word ${w.word} still has placeholder example`);
    assert.ok(!w.exampleEn.startsWith("Example:"), `Word ${w.word} still has placeholder English example`);
  });

  // Test SRS integration with activeDb = "example"
  vm.runInContext(fs.readFileSync("js/srs.js", "utf8"), context);
  context.window.SRS.setActiveDb("example");
  const srsWords = context.window.SRS.getAllWords();
  assert.equal(srsWords.length, words.length);
  assert.equal(context.window.SRS.getWord(words[0].id).word, words[0].word);
});

test("offline grammar engine provides 14 structured lessons, validated question bank, and matrix drills", () => {
  const grammar = loadGrammar();
  const { GrammarOffline, QUESTIONS } = require("../js/grammar_offline.js");
  
  assert.ok(GrammarOffline, "GrammarOffline failed to load");

  const topics = GrammarOffline.getAllTopics();
  assert.equal(topics.length, 14, "Expected 14 offline grammar topics");

  topics.forEach(topicId => {
    const lesson = GrammarOffline.getLesson(topicId);
    assert.ok(lesson, `Missing lesson for topic ${topicId}`);
    assert.ok(lesson.title && lesson.title.length > 5, `Topic ${topicId} missing title`);
    assert.ok(lesson.description && lesson.description.length > 20, `Topic ${topicId} missing description`);
    assert.ok(Array.isArray(lesson.rules) && lesson.rules.length >= 2, `Topic ${topicId} missing rules`);
    assert.ok(Array.isArray(lesson.examples) && lesson.examples.length >= 2, `Topic ${topicId} missing examples`);
  });

  // Verify all questions pass isValidQuizQuestion
  assert.ok(Array.isArray(QUESTIONS) && QUESTIONS.length >= 140, "Expected at least 140 curated questions");
  
  QUESTIONS.forEach(q => {
    assert.equal(grammar.isValidQuizQuestion(q, [q.topicId]), true, `Question ${q.id} failed validation: ${JSON.stringify(q)}`);
  });

  // Verify Matrix Drills
  const endingDrill = GrammarOffline.getEndingPickerDrill();
  assert.ok(endingDrill && endingDrill.stem && endingDrill.targetEnding && Array.isArray(endingDrill.choices));
  assert.equal(endingDrill.choices.includes(endingDrill.targetEnding), true);

  const detectiveDrill = GrammarOffline.getCaseDetectiveDrill();
  assert.ok(detectiveDrill && detectiveDrill.sentence && detectiveDrill.correctCase && Array.isArray(detectiveDrill.choices));
  assert.equal(detectiveDrill.choices.includes(detectiveDrill.correctCase), true);

  const aspectRound = GrammarOffline.getAspectMatchingRound(5);
  assert.equal(aspectRound.pairs.length, 5);
  assert.equal(aspectRound.left.length, 5);
  assert.equal(aspectRound.right.length, 5);
});
