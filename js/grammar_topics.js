// Privyetik grammar curriculum metadata.
// This is the single source of truth for Learn navigation, practice targets,
// recommendations, and learner-facing topic labels.

(function () {
  "use strict";

  const GROUPS = [
    {
      id: "foundations",
      title: "Foundations",
      icon: "🌱",
      description: "Build the forms that every Russian sentence depends on."
    },
    {
      id: "cases",
      title: "Cases",
      icon: "🧩",
      description: "Learn how noun endings express a word's role in a sentence."
    },
    {
      id: "verbs",
      title: "Verbs & tenses",
      icon: "⚡",
      description: "Choose the right verb form, time, aspect, and direction."
    },
    {
      id: "sentences",
      title: "Sentence building",
      icon: "🧱",
      description: "Connect ideas and express quantity, time, comparison, and conditions."
    },
    {
      id: "advanced",
      title: "Advanced patterns",
      icon: "🗺️",
      description: "Handle denser written Russian and higher-level verb patterns."
    }
  ];

  const TOPICS = [
    {
      id: "nominative_case", group: "foundations", level: "A1",
      title: "Nominative Case", russian: "Именительный падеж",
      summary: "Identify the subject and the dictionary form of a noun.",
      tip: "Ask who or what performs the action before changing any endings."
    },
    {
      id: "noun_plurals", group: "foundations", level: "A1–A2",
      title: "Noun Plurals", russian: "Множественное число",
      summary: "Form regular and common irregular plurals.",
      tip: "Russian plurals are not always formed with one predictable ending."
    },
    {
      id: "pronouns_declension", group: "foundations", level: "A2–B1",
      title: "Pronoun Declension", russian: "Склонение местоимений",
      summary: "Use personal and possessive pronouns in every case.",
      tip: "Third-person pronouns often add н- after a preposition."
    },
    {
      id: "adjectives_declension", group: "foundations", level: "A2–B1",
      title: "Adjective Agreement", russian: "Склонение прилагательных",
      summary: "Match adjectives with a noun's gender, number, and case.",
      tip: "Find the noun's case first, then choose the matching adjective ending."
    },
    {
      id: "accusative_case", group: "cases", level: "A1–A2",
      title: "Accusative Case", russian: "Винительный падеж",
      summary: "Mark direct objects and motion toward a destination.",
      tip: "Masculine animate nouns behave differently from inanimate nouns."
    },
    {
      id: "genitive_case", group: "cases", level: "A1–A2",
      title: "Genitive Case", russian: "Родительный падеж",
      summary: "Express possession, absence, quantity, and origin.",
      tip: "After нет, the missing thing normally moves into the Genitive."
    },
    {
      id: "dative_case", group: "cases", level: "A2",
      title: "Dative Case", russian: "Дательный падеж",
      summary: "Name a recipient and express age, feelings, or movement toward.",
      tip: "Think 'to or for whom?' when choosing a Dative form."
    },
    {
      id: "instrumental_case", group: "cases", level: "A2–B1",
      title: "Instrumental Case", russian: "Творительный падеж",
      summary: "Express means, accompaniment, roles, and position.",
      tip: "The preposition с meaning 'with' requires the Instrumental."
    },
    {
      id: "prepositional_case", group: "cases", level: "A1–A2",
      title: "Prepositional Case", russian: "Предложный падеж",
      summary: "Talk about location and the subject of thoughts or speech.",
      tip: "Location with в or на is different from motion toward a place."
    },
    {
      id: "verb_conjugations", group: "verbs", level: "A1–A2",
      title: "Verb Conjugations", russian: "Спряжение глаголов",
      summary: "Choose present-tense endings for person and number.",
      tip: "Learn the я and они forms together to notice stem changes."
    },
    {
      id: "past_tense", group: "verbs", level: "A1",
      title: "Past Tense", russian: "Прошедшее время",
      summary: "Form past actions with gender and number agreement.",
      tip: "Past-tense verbs agree with gender, not grammatical person."
    },
    {
      id: "future_tense", group: "verbs", level: "A2",
      title: "Future Tense", russian: "Будущее время",
      summary: "Contrast compound imperfective and simple perfective futures.",
      tip: "Choose process or result before choosing a future construction."
    },
    {
      id: "verb_aspects", group: "verbs", level: "A2–B1",
      title: "Verb Aspects", russian: "Виды глагола",
      summary: "Choose between process, repetition, and completed result.",
      tip: "Aspect describes how an action unfolds, not simply when it occurs.",
      hasTrainingHub: true
    },
    {
      id: "reflexive_verbs", group: "verbs", level: "A2–B1",
      title: "Reflexive Verbs", russian: "Возвратные глаголы",
      summary: "Use -ся and -сь for reflexive, reciprocal, and state meanings.",
      tip: "The reflexive suffix remains attached after the verb is conjugated."
    },
    {
      id: "imperatives", group: "verbs", level: "A1–A2",
      title: "Imperatives & Commands", russian: "Повелительное наклонение",
      summary: "Make commands, requests, invitations, and prohibitions.",
      tip: "Negative commands usually prefer an imperfective verb."
    },
    {
      id: "verbs_of_motion", group: "verbs", level: "A2–B1",
      title: "Verbs of Motion", russian: "Глаголы движения",
      summary: "Distinguish one-direction and multidirectional movement.",
      tip: "First decide whether the movement is one-way or repeated/general."
    },
    {
      id: "numerals_agreement", group: "sentences", level: "A2–B1",
      title: "Numerals & Agreement", russian: "Числительные",
      summary: "Choose noun forms after one, two-to-four, and five or more.",
      tip: "For compound numbers, the final number controls the noun form."
    },
    {
      id: "comparatives_superlatives", group: "sentences", level: "A2–B1",
      title: "Comparatives & Superlatives", russian: "Степени сравнения",
      summary: "Compare people, objects, and qualities naturally.",
      tip: "Short comparative forms do not agree for gender or number."
    },
    {
      id: "time_expressions", group: "sentences", level: "A1–A2",
      title: "Time & Frequency", russian: "Выражение времени",
      summary: "Tell time and describe dates, duration, and frequency.",
      tip: "Time expressions often use a case even when no preposition appears."
    },
    {
      id: "subjunctive_conditional", group: "sentences", level: "A2–B1",
      title: "Conditional & Subjunctive", russian: "Условное наклонение",
      summary: "Express wishes, hypotheticals, purposes, and polite requests.",
      tip: "The particle бы works with a past-tense form even for present wishes."
    },
    {
      id: "impersonal_sentences", group: "sentences", level: "A2–B1",
      title: "Impersonal Sentences", russian: "Безличные предложения",
      summary: "Describe states, needs, possibility, and weather without a subject.",
      tip: "The experiencer is often expressed in the Dative."
    },
    {
      id: "relative_clauses_conjunctions", group: "sentences", level: "A2–B1",
      title: "Clauses & Conjunctions", russian: "Который и союзы",
      summary: "Connect ideas and describe nouns with который.",
      tip: "Который agrees with its noun but takes the case required inside its clause."
    },
    {
      id: "prefixed_motion_verbs", group: "advanced", level: "A2–B1",
      title: "Prefixed Motion Verbs", russian: "Приставочные глаголы движения",
      summary: "Add direction, arrival, departure, entry, and crossing to motion verbs.",
      tip: "Learn each prefix together with its usual preposition and case."
    },
    {
      id: "participles_gerunds", group: "advanced", level: "B1–B2",
      title: "Participles & Gerunds", russian: "Причастия и деепричастия",
      summary: "Condense descriptions and secondary actions in written Russian.",
      tip: "The subject of a gerund must also perform the main verb's action."
    }
  ];

  const byId = Object.fromEntries(TOPICS.map(topic => [topic.id, Object.freeze({ ...topic })]));
  const groupById = Object.fromEntries(GROUPS.map(group => [group.id, Object.freeze({ ...group })]));

  function getTopic(topicId) {
    return byId[topicId] || byId.nominative_case;
  }

  function getGroup(groupId) {
    return groupById[groupId] || groupById.foundations;
  }

  function getTopicsForGroup(groupId) {
    return TOPICS.filter(topic => topic.group === groupId);
  }

  function getPrimaryLevel(level) {
    const match = String(level || "").match(/A1|A2|B1|B2|C1|C2/);
    return match ? match[0] : "A1";
  }

  function getAdjacentTopic(topicId, direction) {
    const index = TOPICS.findIndex(topic => topic.id === topicId);
    if (index < 0) return TOPICS[0];
    const nextIndex = Math.min(TOPICS.length - 1, Math.max(0, index + direction));
    return TOPICS[nextIndex];
  }

  const GrammarCatalog = Object.freeze({
    groups: Object.freeze(GROUPS.map(group => Object.freeze({ ...group }))),
    topics: Object.freeze(TOPICS.map(topic => Object.freeze({ ...topic }))),
    byId: Object.freeze(byId),
    getTopic,
    getGroup,
    getTopicsForGroup,
    getPrimaryLevel,
    getPreviousTopic: topicId => getAdjacentTopic(topicId, -1),
    getNextTopic: topicId => getAdjacentTopic(topicId, 1)
  });

  if (typeof window !== "undefined") window.GrammarCatalog = GrammarCatalog;
  if (typeof module !== "undefined" && module.exports) module.exports = GrammarCatalog;
})();
