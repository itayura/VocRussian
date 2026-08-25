// Privyetik Offline Grammar Database & Interactive Drill Engine (Strategy A & C)
// Features full structured lessons, curated verified quiz questions, and matrix drills for all 14 Russian grammar topics.

(function () {
  "use strict";

  // --- STRATEGY A: 14 STRUCTURED GRAMMAR LESSONS ---
  const LESSONS = {
    "nominative_case": {
      id: "nominative_case",
      title: "Nominative Case (Именительный падеж)",
      level: "A1",
      questionPrompt: "Кто? (Who?) / Что? (What?)",
      description: "The Nominative case is the dictionary form of words and marks the grammatical subject performing the action. It also acts as the predicate noun in equations (A is B).",
      rules: [
        { ending: "Consonant / -й / -ь (masc)", rule: "Masculine Base", example: "студе́нт (student), музе́й (museum), рубль (ruble)" },
        { ending: "-а / -я / -ь (fem)", rule: "Feminine Base", example: "кни́га (book), неде́ля (week), ночь (night)" },
        { ending: "-о / -е / -мя (neut)", rule: "Neuter Base", example: "окно́ (window), мо́ре (sea), и́мя (name)" },
        { ending: "-ы / -и / -а / -я", rule: "Plural Forms", example: "студе́нты (students), кни́ги (books), дома́ (houses)" }
      ],
      examples: [
        { ru: "Студе́нт чита́ет кни́гу.", en: "The student is reading a book.", explanation: "«Студент» is the subject performing the action." },
        { ru: "Москва́ — краси́вый го́род.", en: "Moscow is a beautiful city.", explanation: "Both «Москва» and «город» are in Nominative." },
        { ru: "На столе́ лежи́т но́вый телефо́н.", en: "A new phone lies on the table.", explanation: "«Телефон» is the grammatical subject." }
      ]
    },

    "accusative_case": {
      id: "accusative_case",
      title: "Accusative Case (Винительный падеж)",
      level: "A1–A2",
      questionPrompt: "Кого? (Whom?) / Что? (What?) / Куда? (Whither/Where to?)",
      description: "Marks the direct object receiving an action (transitive verbs like читать, любить, видеть) and direction/motion towards a destination with prepositions «в» (into) and «на» (onto).",
      rules: [
        { ending: "-у / -ю", rule: "Feminine Inanimate & Animate nouns replace -а/-я with -у/-ю", example: "кни́га → кни́гу, неде́ля → неде́лю" },
        { ending: "-а / -я", rule: "Masculine Animate nouns take Genitive endings", example: "студе́нт → студе́нта, учи́тель → учи́теля" },
        { ending: "No Change", rule: "Masculine Inanimate and all Neuter nouns remain identical to Nominative", example: "телефо́н → телефо́н, окно́ → окно́" },
        { ending: "в / на + Acc", rule: "Direction / Destination motion", example: "Я иду́ в магази́н / на рабо́ту." }
      ],
      examples: [
        { ru: "Я чита́ю интере́сную кни́гу.", en: "I am reading an interesting book.", explanation: "«Книга» becomes «книгу» as the direct object." },
        { ru: "Мы встре́тили на́шего учи́теля.", en: "We met our teacher.", explanation: "Animate masculine takes -а ending in Accusative." },
        { ru: "За́втра мы пое́дем в центр.", en: "Tomorrow we will go to the downtown center.", explanation: "Destination motion with preposition «в»." }
      ]
    },

    "genitive_case": {
      id: "genitive_case",
      title: "Genitive Case (Родительный падеж)",
      level: "A1–A2",
      questionPrompt: "Кого? (Of whom?) / Чего? (Of what?) / Откуда? (Where from?)",
      description: "Expresses possession ('of'), absence/negation ('нет'), quantities (2, 3, 4 + Gen Sg; 5+ + Gen Pl), and origin ('из', 'с', 'от').",
      rules: [
        { ending: "-а / -я", rule: "Masculine & Neuter singular", example: "брат → бра́та, окно́ → окна́, мо́ре → мо́ря" },
        { ending: "-ы / -и", rule: "Feminine singular (use -и after 7-letter spelling rule)", example: "кни́га → кни́ги, сестра́ → сестры́" },
        { ending: "нет / не́ было + Gen", rule: "Absence and negation of possession", example: "У меня́ нет маши́ны и вре́мени." },
        { ending: "из / с / от / для / без", rule: "Key Genitive Prepositions", example: "пода́рок для ма́мы, чай без са́хара" }
      ],
      examples: [
        { ru: "У меня́ нет свобо́дного вре́мени.", en: "I don't have free time.", explanation: "Negation with «нет» requires Genitive." },
        { ru: "Это маши́на моего́ ста́ршего бра́та.", en: "This is the car of my elder brother.", explanation: "Possession: «брата» in Genitive." },
        { ru: "Мы купи́ли два килогра́мма я́блок.", en: "We bought two kilos of apples.", explanation: "Quantifier 2 requires Genitive singular «килограмма»." }
      ]
    },

    "dative_case": {
      id: "dative_case",
      title: "Dative Case (Дательный падеж)",
      level: "A2",
      questionPrompt: "Кому? (To whom?) / Чему? (To what?)",
      description: "Marks the indirect recipient of giving, sending, or communicating (давать, звонить, писать, помогать), age expressions (Мне 25 лет), impersonal feelings (Мне холодно / трудно), and prepositions «к» (towards) and «по» (along/by).",
      rules: [
        { ending: "-у / -ю", rule: "Masculine & Neuter singular", example: "друг → дру́гу, учи́тель → учи́телю, окно́ → окну́" },
        { ending: "-е / -и", rule: "Feminine singular (-и for -ия)", example: "сестра́ → сестре́, Мари́я → Мари́и" },
        { ending: "кому-то + age", rule: "Age constructions", example: "Моему́ бра́ту два́дцать лет." },
        { ending: "помога́ть / звони́ть / нра́виться", rule: "Key Dative verbs", example: "Я звоню́ врачу́. Мне нра́вится фильм." }
      ],
      examples: [
        { ru: "Я позвони́л своему́ лу́чшему дру́гу.", en: "I called my best friend.", explanation: "«Звонить» governs Dative «другу»." },
        { ru: "Студе́нтам ну́жно мно́го чита́ть.", en: "Students need to read a lot.", explanation: "Impersonal construction with «нужно»." },
        { ru: "Мы гуля́ем по краси́вому па́рку.", en: "We are walking along the beautiful park.", explanation: "Preposition «по» requires Dative «парку»." }
      ]
    },

    "instrumental_case": {
      id: "instrumental_case",
      title: "Instrumental Case (Творительный падеж)",
      level: "A2–B1",
      questionPrompt: "Кем? (With whom / By whom?) / Чем? (With what / By what?)",
      description: "Indicates the instrument or means of an action (писать ручкой), companionship with preposition «с / со» (чай с лимоном), professions/states with verbs быть, стать, работать (работать врачом), and spatial prepositions (над, под, перед, за, между).",
      rules: [
        { ending: "-ом / -ем / -ём", rule: "Masculine & Neuter singular", example: "каранда́ш → карандашо́м, брат → бра́том" },
        { ending: "-ой / -ей / -ью", rule: "Feminine singular (-ью for 3rd declension)", example: "кни́га → кни́гой, ночь → но́чью" },
        { ending: "с + Inst", rule: "Companionship ('together with')", example: "ко́фе с молоко́м, гуля́ть с соба́кой" },
        { ending: "рабо́тать / стать + Inst", rule: "Professions & role changes", example: "Она́ рабо́тает инжене́ром." }
      ],
      examples: [
        { ru: "Я люблю́ пить чай с лимо́ном и са́харом.", en: "I like drinking tea with lemon and sugar.", explanation: "Preposition «с» takes Instrumental." },
        { ru: "Мой оте́ц рабо́тает инжене́ром на заво́де.", en: "My father works as an engineer at the plant.", explanation: "Profession with «работать» takes Instrumental." },
        { ru: "Он пи́шет письмо́ си́ней ру́чкой.", en: "He writes the letter with a blue pen.", explanation: "Instrument of action without preposition." }
      ]
    },

    "prepositional_case": {
      id: "prepositional_case",
      title: "Prepositional Case (Предложный падеж)",
      level: "A1",
      questionPrompt: "О ком? (About whom?) / О чём? (About what?) / Где? (Where at?)",
      description: "Always used with a preposition (в, на, о/об, при). Indicates static location (в школе, на работе) and topic of thought or speech (думать о друге).",
      rules: [
        { ending: "-е", rule: "Default singular for Masculine, Feminine, and Neuter", example: "стол → на столе́, Москва́ → в Москве́, окно́ → на окне́" },
        { ending: "-и", rule: "Feminine nouns ending in -ия, -ие, -ь", example: "Росси́я → в Росси́и, зда́ние → в зда́нии, площадь → на пло́щади" },
        { ending: "-у́ / -ю́", rule: "Stressed locative ending for certain masculine nouns after в/на", example: "лес → в лесу́, шкаф → в шкафу́, сад → в саду́" },
        { ending: "о / об / обо", rule: "Thought / Speech topic", example: "ду́мать о семье́, говори́ть об уро́ке" }
      ],
      examples: [
        { ru: "Мы сейча́с живём и рабо́таем в Москве́.", en: "We are currently living and working in Moscow.", explanation: "Static location with preposition «в»." },
        { ru: "Студе́нты говоря́т об экза́мене по исто́рии.", en: "The students are talking about the history exam.", explanation: "Topic of speech with preposition «об»." },
        { ru: "Ле́том мы люби́ли гуля́ть в сосно́вом лесу́.", en: "In summer we loved walking in the pine forest.", explanation: "Special locative ending -у́." }
      ]
    },

    "verb_aspects": {
      id: "verb_aspects",
      title: "Verb Aspects: Imperfective & Perfective (Виды глагола)",
      level: "A2–B1",
      questionPrompt: "Что делать? (НСВ) vs. Что сделать? (СВ)",
      description: "Russian verbs exist in aspectual pairs. Imperfective (НСВ) expresses process, duration, repetition, and general actions. Perfective (СВ) expresses completion, a specific result, or a single one-time event.",
      rules: [
        { ending: "НСВ (Imperfective)", rule: "Process, habit, repeated action, general fact", example: "чита́ть (to be reading / to read generally)" },
        { ending: "СВ (Perfective)", rule: "Result, completed whole action, sequence of steps", example: "прочита́ть (to finish reading / have read)" },
        { ending: "Prefixation", rule: "Adding prefix to create Perfective partner", example: "де́лать → сде́лать, писа́ть → написа́ть" },
        { ending: "Suffixation", rule: "Altering stem/suffix (-ыва-/-ива-)", example: "реши́ть (СВ) → реша́ть (НСВ), откры́ть → открыва́ть" }
      ],
      examples: [
        { ru: "Я вчера́ весь ве́чер чита́л кни́гу (НСВ).", en: "Yesterday I was reading a book all evening.", explanation: "Process/duration across the whole evening." },
        { ru: "Я наконе́ц прочита́л всю кни́гу (СВ).", en: "I finally finished reading the whole book.", explanation: "Completed result achieved." },
        { ru: "Он ка́ждый день звони́т роди́телям (НСВ).", en: "He calls his parents every day.", explanation: "Regular repeated habitual action." }
      ]
    },

    "verbs_of_motion": {
      id: "verbs_of_motion",
      title: "Verbs of Motion: Unidirectional & Multidirectional (Глаголы движения)",
      level: "A2–B1",
      questionPrompt: "Идти / Ехать vs. Ходить / Ездить",
      description: "Unidirectional verbs (идти, ехать, лететь, плыть) describe movement in one direction right now or at a specific moment. Multidirectional verbs (ходить, ездить, летать, плавать) describe round trips, habitual/repeated trips, or movement in multiple directions.",
      rules: [
        { ending: "Идти́ / Е́хать (Unidirectional)", rule: "One direction in progress right now or at specific point", example: "Сейча́с я иду́ в шко́лу. За́втра я е́ду в Рим." },
        { ending: "Ходи́ть / Е́здить (Multidirectional)", rule: "Habitual, regular, round-trip, or general ability", example: "Я ка́ждый день хожу́ на рабо́ту. Мы е́здили на мо́ре." },
        { ending: "Foot vs. Vehicle", rule: "Идти/Ходить (on foot) vs. Ехать/Ездить (by transport)", example: "идти пешко́м vs. е́хать на авто́бусе" },
        { ending: "Prefixes (по-, при-, у-, вы-)", rule: "Change meaning and make verb Perfective", example: "прийти́ (arrive on foot), уе́хать (depart by transport)" }
      ],
      examples: [
        { ru: "Куда́ ты сейча́с идёшь пешко́м?", en: "Where are you walking to right now?", explanation: "Unidirectional movement in progress." },
        { ru: "В про́шлом году́ мы ча́сто е́здили в го́ры.", en: "Last year we often traveled to the mountains.", explanation: "Multidirectional repeated trips." },
        { ru: "По́езд уже́ прие́хал на вокза́л.", en: "The train has already arrived at the station.", explanation: "Prefixed motion verb expressing arrival." }
      ]
    },

    "verb_conjugations": {
      id: "verb_conjugations",
      title: "Verb Conjugations: 1st & 2nd (Спряжение глаголов)",
      level: "A1–A2",
      questionPrompt: "-ешь / -ет vs. -ишь / -ит",
      description: "Russian present tense verbs fall into two primary conjugation classes determining their person/number vowel endings (-е/ё for 1st conjugation, -и for 2nd conjugation).",
      rules: [
        { ending: "1st Conjugation (-ать, -ять, -еть, -ти)", rule: "-ю/-у, -ешь, -ет, -ем, -ете, -ут/-ют", example: "чита́ть: чита́ю, чита́ешь, чита́ет, чита́ем, чита́ют" },
        { ending: "2nd Conjugation (-ить + exceptions)", rule: "-ю/-у, -ишь, -ит, -им, -ите, -ат/-ят", example: "говори́ть: говорю́, говори́шь, говори́т, говори́м, говоря́т" },
        { ending: "Stem Mutations", rule: "Consonant shifts in 1st person or whole paradigm", example: "писа́ть → пишу́, пи́шешь; люби́ть → люблю́, лю́бишь" }
      ],
      examples: [
        { ru: "Они́ хорошо́ понима́ют по-ру́сски.", en: "They understand Russian well.", explanation: "1st conjugation 3rd person plural ending «-ют»." },
        { ru: "Ты говори́шь на англи́йском языке́?", en: "Do you speak English?", explanation: "2nd conjugation 2nd person singular ending «-ишь»." },
        { ru: "Мы пи́шем дикта́нт на уро́ке.", en: "We are writing a dictation in class.", explanation: "Stem shift с → ш in глагол «писать»." }
      ]
    },

    "past_tense": {
      id: "past_tense",
      title: "Past Tense (Прошедшее время)",
      level: "A1",
      questionPrompt: "-л, -ла, -ло, -ли",
      description: "The Russian past tense agrees in grammatical gender and number with the subject rather than person, formed by replacing the infinitive -ть with gender suffixes.",
      rules: [
        { ending: "-л", rule: "Masculine singular subject", example: "Он чита́л, брат рабо́тал, по́езд пришёл" },
        { ending: "-ла", rule: "Feminine singular subject", example: "Она́ чита́ла, сестра́ рабо́тала" },
        { ending: "-ло", rule: "Neuter singular subject", example: "Со́лнце свети́ло, окно́ разби́лось" },
        { ending: "-ли", rule: "Plural subject (all genders)", example: "Мы чита́ли, студе́нты рабо́тали" }
      ],
      examples: [
        { ru: "Вчера́ А́нна написа́ла отли́чное эссе́.", en: "Yesterday Anna wrote an excellent essay.", explanation: "Feminine singular past tense suffix «-ла»." },
        { ru: "Студе́нты до́лго обсужда́ли результа́ты.", en: "The students discussed the results for a long time.", explanation: "Plural past tense suffix «-ли»." },
        { ru: "У́тром со́лнце я́рко свети́ло.", en: "In the morning the sun shone brightly.", explanation: "Neuter subject «солнце» takes «-ло»." }
      ]
    },

    "future_tense": {
      id: "future_tense",
      title: "Future Tense: Compound & Simple (Будущее время)",
      level: "A2",
      questionPrompt: "буду делать vs. сделаю",
      description: "Imperfective verbs form the Compound Future with conjugated 'быть' + infinitive. Perfective verbs form the Simple Future using present-tense endings to express a completed future result.",
      rules: [
        { ending: "бу́ду / бу́дешь + Инфинитив", rule: "Imperfective Compound Future (process/habit)", example: "Я бу́ду чита́ть ка́ждый день." },
        { ending: "Спрягаемый СВ глагол", rule: "Perfective Simple Future (result)", example: "Я прочита́ю эту кни́гу за два дня." },
        { ending: "Forms of Быть", rule: "бу́ду, бу́дешь, бу́дет, бу́дем, бу́дете, бу́дут", example: "Мы бу́дем жить в го́роде." }
      ],
      examples: [
        { ru: "За́втра я бу́ду рабо́тать с утра́ до ве́чера.", en: "Tomorrow I will be working from morning till evening.", explanation: "Imperfective process across time." },
        { ru: "Я обяза́тельно позвоню́ тебе́ ве́чером.", en: "I will definitely call you in the evening.", explanation: "Perfective simple future expressing guaranteed result." },
        { ru: "Что мы бу́дем де́лать в выходны́е?", en: "What will we do on the weekend?", explanation: "Compound future question." }
      ]
    },

    "adjectives_declension": {
      id: "adjectives_declension",
      title: "Adjectives Declension (Склонение прилагательных)",
      level: "A2–B1",
      questionPrompt: "Какой? Какая? Какое? Какие?",
      description: "Russian adjectives decline across all 6 cases, matching their modified noun in gender, number, and case, adhering to the 7-letter and 5-letter spelling rules.",
      rules: [
        { ending: "-ый / -ий / -ой", rule: "Masculine Nominative singular", example: "но́вый дом, си́ний шарф, большо́й стол" },
        { ending: "-ая / -яя", rule: "Feminine Nominative singular", example: "но́вая кни́га, си́няя ру́чка" },
        { ending: "-ого / -его (Gen/Acc anim)", rule: "Genitive & Animate Accusative Masc/Neut (pronounced -ово/-ево)", example: "но́вого студе́нта, си́него мо́ря" },
        { ending: "-ые / -ие", rule: "Plural Nominative", example: "но́вые кни́ги, си́ние карандаши́" }
      ],
      examples: [
        { ru: "Мы живём в большо́м и краси́вом до́ме.", en: "We live in a large and beautiful house.", explanation: "Prepositional masculine ending «-ом»." },
        { ru: "Я купи́л кни́гу изве́стного ру́сского писа́теля.", en: "I bought a book by a famous Russian writer.", explanation: "Genitive masculine ending «-ого»." },
        { ru: "Она́ нарисова́ла я́ркую карти́ну.", en: "She drew a bright picture.", explanation: "Accusative feminine ending «-ую»." }
      ]
    },

    "pronouns_declension": {
      id: "pronouns_declension",
      title: "Pronouns Declension (Склонение местоимений)",
      level: "A2–B1",
      questionPrompt: "меня, мне, мной; тебя, тебе, тобой",
      description: "Personal, possessive, and demonstrative pronouns decline across all cases, often changing stems (я → меня → мне → мной). Third-person pronouns add initial 'н-' after prepositions (у него, к ней, с ними).",
      rules: [
        { ending: "Я / Ты", rule: "меня́/тебя́ (Gen/Acc), мне/тебе́ (Dat/Prep), мной/тобо́й (Inst)", example: "Позвони́ мне. Я горжу́сь тобо́й." },
        { ending: "Он / Она́ / Они́", rule: "его́/её/их (Gen/Acc), ему́/ей/им (Dat), им/ей/и́ми (Inst)", example: "Мы зна́ем его́. Помоги́ ей." },
        { ending: "Prepositional 'н-' prefix", rule: "Add 'н-' after prepositions for 3rd person", example: "у него́, к ней, о нём, с ни́ми" },
        { ending: "Мой / Твой / Наш / Ваш", rule: "Possessives decline like adjectives", example: "в моём до́ме, с на́шей сестро́й" }
      ],
      examples: [
        { ru: "Позвони́ мне, когда́ бу́дешь свобо́ден.", en: "Call me when you are free.", explanation: "Dative personal pronoun «мне»." },
        { ru: "Мы вчера́ до́лго говори́ли о нём.", en: "Yesterday we spoke about him for a long time.", explanation: "Prepositional with 'н-' prefix «о нём»." },
        { ru: "Это кни́га мое́й ста́ршей сестры́.", en: "This is the book of my elder sister.", explanation: "Genitive feminine possessive pronoun «моей»." }
      ]
    },

    "noun_plurals": {
      id: "noun_plurals",
      title: "Noun Plurals & Irregulars (Множественное число)",
      level: "A1–A2",
      questionPrompt: "столы, книги, города, братья, дети",
      description: "Regular nouns form plurals in -ы or -и. Many high-frequency Russian nouns feature irregular plurals (stressed -а/-я endings, stem mutations, or suppletive forms).",
      rules: [
        { ending: "-ы / -и (Regular)", rule: "Hard consonants → -ы; Velars/Sibilants & soft stems → -и", example: "стол → столы́, кни́га → кни́ги, музе́й → музе́и" },
        { ending: "-а́ / -я́ (Stressed)", rule: "Special masculine plural ending with end-stress", example: "го́род → города́, дом → дома́, по́езд → поезда́" },
        { ending: "-ья (Soft collective)", rule: "Plural with soft sign and iotated ending", example: "брат → бра́тья, друг → друзья́, стул → сту́лья" },
        { ending: "Suppletive / Irregular", rule: "Stem alteration in common words", example: "челове́к → лю́ди, ребёнок → де́ти, день → дни" }
      ],
      examples: [
        { ru: "В на́шем го́роде стро́ят но́вые дома́.", en: "In our city they are building new houses.", explanation: "Stressed plural «дома́»." },
        { ru: "Мои́ лу́чшие друзья́ живу́т за грани́цей.", en: "My best friends live abroad.", explanation: "Irregular plural «друзья́» from «друг»." },
        { ru: "Ма́ленькие де́ти игра́ют на площа́дке.", en: "Small children are playing on the playground.", explanation: "Suppletive plural «де́ти» from «ребёнок»." }
      ]
    },

    "numerals_agreement": {
      id: "numerals_agreement",
      title: "Numerals & Case Agreement (Числительные: 1, 2-4, 5+)",
      level: "A2–B1",
      questionPrompt: "один стол, два стола, пять столов",
      description: "Russian numbers govern the case and number of following nouns. 1 takes Nominative singular; 2, 3, 4 take Genitive singular; 5 through 20 and round tens take Genitive plural. Compound numerals follow the final word.",
      rules: [
        { ending: "1 (оди́н / одна́ / одно́)", rule: "Nominative Singular", example: "оди́н рубль, одна́ мину́та, одно́ окно́" },
        { ending: "2, 3, 4 (два/две, три, четы́ре)", rule: "Genitive Singular", example: "два рубля́, три кни́ги, четы́ре часа́" },
        { ending: "5–20, 30, 50... (пять, де́сять...)", rule: "Genitive Plural", example: "пять рубле́й, де́сять мину́т, два́дцать лет" },
        { ending: "Собира́тельные (дво́е, тро́е)", rule: "Used with animate males & pluralia tantum", example: "дво́е друзе́й, тро́е дете́й, дво́е часо́в" }
      ],
      examples: [
        { ru: "В на́шей гру́ппе у́чатся два́дцать три студе́нта.", en: "There are twenty-three students studying in our group.", explanation: "Compound number ending in 3 governs Genitive singular «студента»." },
        { ru: "Биле́т в теа́тр сто́ит пятьсо́т рубле́й.", en: "The theater ticket costs five hundred rubles.", explanation: "Round hundred governs Genitive plural «рублей»." },
        { ru: "Мы жда́ли авто́бус ро́вно две мину́ты.", en: "We waited for the bus for exactly two minutes.", explanation: "Feminine numeral «две» takes Genitive singular «минуты»." }
      ]
    },

    "prefixed_motion_verbs": {
      id: "prefixed_motion_verbs",
      title: "Prefixed Verbs of Motion (Приставочные глаголы движения)",
      level: "A2–B1",
      questionPrompt: "войти, выйти, приехать, уехать, перейти",
      description: "Adding directional prefixes to verbs of motion alters their spatial meaning and aspect. Prefixes usually pair with specific prepositions (при- + к/в, вы- + из, у- + из/с, пере- + через).",
      rules: [
        { ending: "в- / во- (Into / Enter)", rule: "Motion into an interior space (pairs with в + Acc)", example: "войти́ в ко́мнату, въе́хать в го́род" },
        { ending: "вы- (Out / Exit)", rule: "Motion out of an interior space (pairs with из + Gen)", example: "вы́йти из до́ма, вы́ехать со стоя́нки" },
        { ending: "при- (Arrive) / у- (Depart)", rule: "Arrival at destination vs. leaving departure point", example: "прийти́ на рабо́ту, уе́хать из страны́" },
        { ending: "пере- (Cross) / под- (Approach)", rule: "Crossing an obstacle (через) / approaching near (к + Dat)", example: "перейти́ у́лицу, подойти́ к окну́" }
      ],
      examples: [
        { ru: "По́езд прибыва́ет на гла́вный вокза́л то́чно по расписа́нию.", en: "The train arrives at the main station exactly on schedule.", explanation: "Prefix при- denotes arrival." },
        { ru: "Осторо́жно переходи́те доро́гу по пешехо́дному перехо́ду.", en: "Carefully cross the road at the pedestrian crosswalk.", explanation: "Prefix пере- denotes crossing from one side to another." },
        { ru: "Профе́ссор вы́шел из аудито́рии по́сле ле́кции.", en: "The professor exited the auditorium after the lecture.", explanation: "Prefix вы- paired with preposition «из»." }
      ]
    },

    "imperatives": {
      id: "imperatives",
      title: "Imperatives & Commands (Повелительное наклонение)",
      level: "A1–A2",
      questionPrompt: "Читай! Читайте! Скажи! Скажите!",
      description: "Imperatives express direct orders, invitations, requests, and warnings. Endings depend on the present/future stem vowel/consonant (-й/-йте, -и/-ите, -ь/-ьте). Positive commands often use Perfective for specific actions, while prohibitions (Не + verb) almost always use Imperfective.",
      rules: [
        { ending: "-й / -йте", rule: "Stem ends in a vowel", example: "чита́й / чита́йте, де́лай / де́лайте" },
        { ending: "-и / -ите", rule: "Stem ends in consonant with stress on ending (or 2+ consonants)", example: "говори́ / говори́те, пиши́ / пиши́те, посмотри́ / посмотри́те" },
        { ending: "-ь / -ьте", rule: "Stem ends in single consonant with stem-stress", example: "бу́дь / бу́дьте, вста́нь / вста́ньте, гото́вь / гото́вьте" },
        { ending: "Не + НСВ (Prohibition)", rule: "Negative commands / prohibitions use Imperfective", example: "Не открыва́й окно́! Не забыва́йте па́спорт!" }
      ],
      examples: [
        { ru: "Пожа́луйста, переда́йте соль и спе́ции.", en: "Please pass the salt and spices.", explanation: "Polite formal request with «-те»." },
        { ru: "Никогда́ не опа́здывай на у́тренние уро́ки.", en: "Never be late for morning classes.", explanation: "Prohibition with «не» requires Imperfective «опаздывай»." },
        { ru: "Посмотри́ на э́то краси́вое зда́ние.", en: "Look at this beautiful building.", explanation: "Specific single action command in Perfective." }
      ]
    },

    "reflexive_verbs": {
      id: "reflexive_verbs",
      title: "Reflexive Verbs: -ся / -сь (Возвратные глаголы)",
      level: "A2–B1",
      questionPrompt: "учиться, одеваться, встречаться, радоваться",
      description: "Reflexive verbs end in the particle -ся (after consonants) or -сь (after vowels). They express actions done to oneself, reciprocal actions between multiple people, emotional states, or passive processes.",
      rules: [
        { ending: "-ся (After consonants)", rule: "Suffix -ся attaches to consonant verb endings", example: "учи́ться, он у́чится, мы у́чимся, они́ у́чатся" },
        { ending: "-сь (After vowels)", rule: "Suffix -сь attaches to vowel verb endings", example: "я учу́сь, вы у́читесь, она́ учи́лась" },
        { ending: "Взаи́мные (Reciprocal)", rule: "Mutual action between two or more subjects", example: "встреча́ться (meet each other), целова́ться, обнима́ться" },
        { ending: "Состоя́ния и эмо́ции", rule: "Involuntary internal feelings & states", example: "ра́доваться (rejoice), боя́ться (fear), смея́ться (laugh)" }
      ],
      examples: [
        { ru: "Мы ча́сто встреча́емся с колле́гами по́сле рабо́ты.", en: "We often meet with colleagues after work.", explanation: "Reciprocal reflexive verb «встречаемся»." },
        { ru: "Ка́ждое у́тро ребёнок сам одева́ется в шко́лу.", en: "Every morning the child dresses himself for school.", explanation: "True reflexive action on oneself." },
        { ru: "Магази́н закрыва́ется ро́вно в де́вять ве́чера.", en: "The store closes at exactly nine in the evening.", explanation: "Middle/passive voice with inanimate subject." }
      ]
    },

    "subjunctive_conditional": {
      id: "subjunctive_conditional",
      title: "Conditional & Subjunctive Mood (Сослагательное наклонение: бы / чтобы)",
      level: "A2–B1",
      questionPrompt: "Если бы я знал..., Я хочу, чтобы ты...",
      description: "The subjunctive expresses hypothetical situations, counterfactual conditions, polite requests, and desires with different subjects using particle «бы» alongside past tense verbs.",
      rules: [
        { ending: "Е́сли бы + Past, ... Past + бы", rule: "Unreal / Counterfactual conditional sentences", example: "Е́сли бы у меня́ бы́ло вре́мя, я бы помо́г тебе́." },
        { ending: "что́бы + Past tense", rule: "Desire / Request when subjects of clauses differ", example: "Я хочу́, что́бы ты прочита́л э́ту статью́." },
        { ending: "что́бы + Infinitive", rule: "Purpose clause when both actions share the same subject", example: "Я пришёл, что́бы учи́ться." },
        { ending: "Я хоте́л бы / Я бы предпоче́л", rule: "Polite wishes and softened requests", example: "Я бы хоте́л ча́шку ча́я." }
      ],
      examples: [
        { ru: "Е́сли бы пого́да была́ хоро́шей, мы бы пошли́ в парк.", en: "If the weather were good, we would go to the park.", explanation: "Hypothetical condition with «если бы + past»." },
        { ru: "Учи́тель хо́чет, что́бы все ученики́ сдали тест.", en: "The teacher wants all students to pass the test.", explanation: "Clause with «чтобы» and past tense «сдали» for distinct subjects." },
        { ru: "Мы вы́ехали пора́ньше, что́бы не опозда́ть на по́езд.", en: "We departed earlier in order not to be late for the train.", explanation: "Purpose clause with same subject + infinitive." }
      ]
    },

    "impersonal_sentences": {
      id: "impersonal_sentences",
      title: "Impersonal & Dative State Expressions (Безличные предложения)",
      level: "A2–B1",
      questionPrompt: "Мне холодно, можно, нельзя, нужно, нет времени",
      description: "Impersonal sentences describe physical sensations, psychological states, necessity, possibility, and weather without a Nominative grammatical subject. The experiencer stands in the Dative case.",
      rules: [
        { ending: "Да́тельный + катего́рия состоя́ния", rule: "Experiencer in Dative with state adverbs", example: "Мне хо́лодно. Сестре́ ску́чно. Нам ве́село." },
        { ending: "ну́жно / на́до / прихо́дится + Инф.", rule: "Necessity and obligation", example: "Студе́нту ну́жно сдать экза́мен." },
        { ending: "мо́жно / нельзя́ + Инфинитив", rule: "Permission vs. prohibition / impossibility", example: "Здесь мо́жно курить? Тут нельзя́ шуме́ть." },
        { ending: "нет / не́ было / не бу́дет + Gen.", rule: "Existential absence in present, past, and future", example: "У нас нет вре́мени. Не́ было со́лнца." }
      ],
      examples: [
        { ru: "Сего́дня на у́лице о́чень хо́лодно и ве́трено.", en: "Today it is very cold and windy outside.", explanation: "Impersonal meteorological state." },
        { ru: "Моему́ бра́ту прихо́дится мно́го рабо́тать.", en: "My brother has to work a lot.", explanation: "External necessity with Dative experiencer «моему брату»." },
        { ru: "В э́том музе́е нельзя́ фотографи́ровать со вспы́шкой.", en: "In this museum one is not allowed to photograph with a flash.", explanation: "Strict prohibition with «нельзя»." }
      ]
    },

    "comparatives_superlatives": {
      id: "comparatives_superlatives",
      title: "Comparatives & Superlatives (Степени сравнения)",
      level: "A2–B1",
      questionPrompt: "быстрее, дороже, лучше, самый большой",
      description: "Comparatives compare two entities (faster, cheaper, better) using synthetic suffixes (-ее / mutations) or analytic words (более). Superlatives denote the highest degree using «самый» + adjective or prefix/suffix «наи- / -ейший».",
      rules: [
        { ending: "-ее / -ей (Simple Comparative)", rule: "Standard synthetic comparative for most adjectives", example: "бы́стрый → быстрее, краси́вый → краси́вее" },
        { ending: "Чередова́ния согла́сных", rule: "Consonant mutations (г/д/з → ж, к/т → ч, х → ш)", example: "дорого́й → доро́же, молодо́й → моло́же, ти́хий → ти́ше" },
        { ending: "Иррегуля́рные фо́рмы", rule: "Suppletive roots in high frequency words", example: "хоро́ший → лу́чше, плохо́й → ху́же, большо́й → бо́льше" },
        { ending: "са́мый + Прилага́тельное (Superlative)", rule: "Standard superlative agreeing with noun", example: "са́мый высо́кий дом, са́мая интере́сная кни́га" }
      ],
      examples: [
        { ru: "Этот но́вый компью́тер рабо́тает на́много быстрее ста́рого.", en: "This new computer runs much faster than the old one.", explanation: "Comparative adverb «быстрее»." },
        { ru: "Самолёт доро́же по́езда, но значи́тельно комфо́ртнее.", en: "The airplane is more expensive than the train, but significantly more comfortable.", explanation: "Comparative with consonant mutation «дороже» and Genitive comparison." },
        { ru: "Байка́л — са́мое глубо́кое о́зеро в ми́ре.", en: "Baikal is the deepest lake in the world.", explanation: "Superlative «самое глубокое» matching neuter «озеро»." }
      ]
    },

    "time_expressions": {
      id: "time_expressions",
      title: "Time & Frequency Expressions (Выражение времени)",
      level: "A1–B1",
      questionPrompt: "через 5 минут, 2 года назад, за 2 часа, на неделю",
      description: "Expressing time spans, deadlines, schedules, and duration requires specific prepositions and cases: «через» (in X time), «назад» (ago), «за + Acc» (time taken to achieve result), «на + Acc» (intended duration of stay/result).",
      rules: [
        { ending: "че́рез + Accusative (In X time)", rule: "Future point in time relative to now", example: "че́рез пять мину́т, че́рез два дня" },
        { ending: "наза́д (Ago)", rule: "Past time span relative to now", example: "три го́да наза́д, неде́лю наза́д" },
        { ending: "за + Accusative (Time to complete)", rule: "Duration required to finish a completed action", example: "прочита́л кни́гу за два часа́" },
        { ending: "на + Accusative (Intended duration)", rule: "Planned duration of result / stay", example: "пое́хал в о́тпуск на ме́сяц" }
      ],
      examples: [
        { ru: "Наш самолёт вылета́ет че́рез со́рок мину́т.", en: "Our flight takes off in forty minutes.", explanation: "Preposition «через» + Accusative." },
        { ru: "Мы перее́хали в э́тот го́род пять лет наза́д.", en: "We moved to this city five years ago.", explanation: "Time duration with postposition «назад»." },
        { ru: "Студе́нт написа́л всю курсову́ю рабо́ту за одну́ ночь.", en: "The student wrote the entire term paper in one night.", explanation: "Completed result within time span using «за + Acc»." }
      ]
    },

    "relative_clauses_conjunctions": {
      id: "relative_clauses_conjunctions",
      title: "Relative Clauses & Conjunctions (Который, И, А, Но, Потому что, Поэтому)",
      level: "A2–B2",
      questionPrompt: "который, которая, которое; потому что vs. поэтому",
      description: "Subordinate relative clauses use the pronoun «который», agreeing with its antecedent in gender/number and with its clause in case. Coordinating conjunctions distinguish between additive 'и', contrastive 'а', and adversative 'но'. Subordinating conjunctions connect cause (потому что) and consequence (поэтому).",
      rules: [
        { ending: "кото́рый / кото́рая / кото́рое / кото́рые", rule: "Gender/Number from head noun, Case from role in subclause", example: "челове́к, кото́рого я зна́ю; дом, в кото́ром я живу́" },
        { ending: "И vs. А vs. НО", rule: "И (and/addition), А (and/whereas contrast), НО (but/opposition)", example: "Я чита́ю, а брат пи́шет. Я уста́л, но дово́лен." },
        { ending: "потому́ что (Cause)", rule: "Introduces reason/cause", example: "Я оста́лся до́ма, потому́ что заболе́л." },
        { ending: "поэ́тому (Consequence)", rule: "Introduces result/consequence", example: "Я заболе́л, поэ́тому оста́лся до́ма." }
      ],
      examples: [
        { ru: "Это та са́мая кни́га, о кото́рой мы вчера́ говори́ли.", en: "This is the very book about which we were talking yesterday.", explanation: "Pronoun «которой» in Prepositional feminine singular." },
        { ru: "У́тром шёл си́льный дождь, поэ́тому экску́рсию отмени́ли.", en: "In the morning it rained heavily, so the excursion was canceled.", explanation: "Consequence connector «поэтому»." },
        { ru: "Я люблю́ зелёный чай, а моя́ сестра́ предпочита́ет ко́фе.", en: "I like green tea, whereas my sister prefers coffee.", explanation: "Contrastive conjunction «а»." }
      ]
    },

    "participles_gerunds": {
      id: "participles_gerunds",
      title: "Participles & Verbal Adverbs / Gerunds (Причастия и деепричастия)",
      level: "B1–B2",
      questionPrompt: "читающий, прочитанный; читая, прочитав",
      description: "Participles combine verb and adjective features, declining like adjectives to modify nouns. Verbal adverbs (gerunds) combine verb and adverb features to denote secondary parallel actions, never declining.",
      rules: [
        { ending: "-ущ-/-ющ-, -ащ-/-ящ- (Active Present)", rule: "One who is currently doing the action", example: "чита́ющий студе́нт, говоря́щий челове́к" },
        { ending: "-вш-, -ш- (Active Past)", rule: "One who previously performed the action", example: "прочита́вший кни́гу, прише́дший гость" },
        { ending: "-нн-, -т- (Passive Past)", rule: "Object that underwent completed action", example: "напи́санное письмо́, откры́тая дверь" },
        { ending: "-я / -а (Imperfective Gerund) & -в (Perfective)", rule: "Secondary simultaneous vs. completed action", example: "чита́я кни́гу (while reading), прочита́в кни́гу (having read)" }
      ],
      examples: [
        { ru: "Студе́нты, изуча́ющие ру́сский язы́к, посети́ли музе́й.", en: "The students studying the Russian language visited the museum.", explanation: "Present active participle «изучающие» modifying plural «студенты»." },
        { ru: "Письмо́, напи́санное изве́стным поэ́том, храня́т в архи́ве.", en: "The letter written by the famous poet is kept in the archive.", explanation: "Past passive participle «написанное» modifying neuter «письмо»." },
        { ru: "Зако́нчив рабо́ту, он вы́ключил компью́тер и пошёл домо́й.", en: "Having finished work, he turned off the computer and went home.", explanation: "Perfective verbal adverb (gerund) «закончив»." }
      ]
    }
  };

  // --- STRATEGY A: 150+ CURATED, VALIDATED CLOZE QUIZ QUESTIONS ---
  const QUESTIONS = [
    // 1. NOMINATIVE CASE (11 Questions)
    {
      id: "q_nom_1",
      topicId: "nominative_case",
      sentencePattern: "Ка́ждый день [blank] (студент) чита́ет нау́чные статьи́.",
      answer: "студент",
      choices: ["студент", "студента", "студенту", "студентом"],
      translation: "Every day the student reads scientific articles.",
      transliteration: "Kazhdyy den student chitaet nauchnye stati.",
      explanation: "The subject of the sentence requires the Nominative case."
    },
    {
      id: "q_nom_2",
      topicId: "nominative_case",
      sentencePattern: "На столе́ лежи́т но́вая [blank] (книга).",
      answer: "книга",
      choices: ["книга", "книгу", "книги", "книгой"],
      translation: "A new book lies on the table.",
      transliteration: "Na stole lezhit novaya kniga.",
      explanation: "«Книга» is the grammatical subject in the Nominative case."
    },
    {
      id: "q_nom_3",
      topicId: "nominative_case",
      sentencePattern: "Москва́ — э́то столи́ца и крупне́йший [blank] (город) страны́.",
      answer: "город",
      choices: ["город", "города", "городу", "городе"],
      translation: "Moscow is the capital and largest city of the country.",
      transliteration: "Moskva — eto stolitsa i krupneyshiy gorod strany.",
      explanation: "Predicate noun in an equational sentence is in the Nominative case."
    },
    {
      id: "q_nom_4",
      topicId: "nominative_case",
      sentencePattern: "У́тром на́ша [blank] (семья) соберётся за за́втраком.",
      answer: "семья",
      choices: ["семья", "семью", "семьи", "семьёй"],
      translation: "In the morning our family will gather for breakfast.",
      transliteration: "Utrom nasha semya soberyotsya za zavtrakom.",
      explanation: "«Семья» is the subject performing the action."
    },
    {
      id: "q_nom_5",
      topicId: "nominative_case",
      sentencePattern: "Вчера́ э́тот изве́стный [blank] (профессор) прочита́л ле́кцию.",
      answer: "профессор",
      choices: ["профессор", "профессора", "профессору", "профессором"],
      translation: "Yesterday this famous professor delivered a lecture.",
      transliteration: "Vchera etot izvestnyy professor prochital lektsiyu.",
      explanation: "The active agent is the subject in Nominative."
    },
    {
      id: "q_nom_6",
      topicId: "nominative_case",
      sentencePattern: "Э́то краси́вое [blank] (здание) постро́или сто лет наза́д.",
      answer: "здание",
      choices: ["здание", "здания", "зданию", "зданием"],
      translation: "This beautiful building was built a hundred years ago.",
      transliteration: "Eto krasivoe zdanie postroili sto let nazad.",
      explanation: "Neuter noun in Nominative singular is «здание»."
    },
    {
      id: "q_nom_7",
      topicId: "nominative_case",
      sentencePattern: "Мой ста́рший [blank] (брат) рабо́тает инжене́ром.",
      answer: "брат",
      choices: ["брат", "брата", "брату", "братом"],
      translation: "My older brother works as an engineer.",
      transliteration: "Moy starshiy brat rabotaet inzhenerom.",
      explanation: "«Брат» is the subject of the sentence."
    },
    {
      id: "q_nom_8",
      topicId: "nominative_case",
      sentencePattern: "В парке расцвела́ прекра́сная [blank] (роза).",
      answer: "роза",
      choices: ["роза", "розу", "розы", "розой"],
      translation: "A wonderful rose bloomed in the park.",
      transliteration: "V parke rasttsvela prekrasnaya roza.",
      explanation: "Feminine singular subject in Nominative ends in -а."
    },
    {
      id: "q_nom_9",
      topicId: "nominative_case",
      sentencePattern: "Ско́ро насту́пит долгожда́нное [blank] (лето).",
      answer: "лето",
      choices: ["лето", "лета", "лету", "летом"],
      translation: "Soon the long-awaited summer will arrive.",
      transliteration: "Skoro nastupit dolgozhdannoe leto.",
      explanation: "Neuter subject «лето» takes Nominative singular."
    },
    {
      id: "q_nom_10",
      topicId: "nominative_case",
      sentencePattern: "Э́тот ма́ленький [blank] (котёнок) о́чень лю́бит игра́ть.",
      answer: "котёнок",
      choices: ["котёнок", "котёнка", "котёнку", "котёнком"],
      translation: "This little kitten really likes to play.",
      transliteration: "Etot malenkiy kotyonok ochen lyubit igrat.",
      explanation: "Subject performing the action is in Nominative."
    },
    {
      id: "q_nom_11",
      topicId: "nominative_case",
      sentencePattern: "Ру́сский [blank] (язык) о́чень бога́тый и вырази́тельный.",
      answer: "язык",
      choices: ["язык", "языка", "языку", "языком"],
      translation: "The Russian language is very rich and expressive.",
      transliteration: "Russkiy yazyk ochen bogatyy i vyrazitelnyy.",
      explanation: "The noun «язык» is the grammatical subject."
    },

    // 2. ACCUSATIVE CASE (11 Questions)
    {
      id: "q_acc_1",
      topicId: "accusative_case",
      sentencePattern: "Я с удово́льствием чита́ю но́вую [blank] (книга).",
      answer: "книгу",
      choices: ["книгу", "книга", "книге", "книгой"],
      translation: "I am reading the new book with pleasure.",
      transliteration: "Ya s udovolstviem chitayu novuyu knigu.",
      explanation: "Feminine direct object takes the Accusative ending -у."
    },
    {
      id: "q_acc_2",
      topicId: "accusative_case",
      sentencePattern: "Вчера́ на вы́ставке мы встре́тили на́шего [blank] (учитель).",
      answer: "учителя",
      choices: ["учителя", "учитель", "учителю", "учителем"],
      translation: "Yesterday at the exhibition we met our teacher.",
      transliteration: "Vchera na vystavke my vstretili nashego uchitelya.",
      explanation: "Animate masculine direct objects take the Genitive/Accusative ending -я."
    },
    {
      id: "q_acc_3",
      topicId: "accusative_case",
      sentencePattern: "За́втра у́тром мы пое́дем в [blank] (центр) го́рода.",
      answer: "центр",
      choices: ["центр", "центра", "центру", "центре"],
      translation: "Tomorrow morning we will go to the city center.",
      transliteration: "Zavtra utrom my poedem v tsentr goroda.",
      explanation: "Inanimate masculine destination nouns with «в» remain unchanged in Accusative."
    },
    {
      id: "q_acc_4",
      topicId: "accusative_case",
      sentencePattern: "Она́ слу́шает класси́ческую [blank] (музыка) ка́ждый ве́чер.",
      answer: "музыку",
      choices: ["музыку", "музыка", "музыке", "музыкой"],
      translation: "She listens to classical music every evening.",
      transliteration: "Ona slushaet klassicheskuyu muzyku kazhdyy vecher.",
      explanation: "Direct object of «слушать» requires Accusative feminine -у."
    },
    {
      id: "q_acc_5",
      topicId: "accusative_case",
      sentencePattern: "Студе́нт внима́тельно слу́шает своего́ [blank] (профессор).",
      answer: "профессора",
      choices: ["профессора", "профессор", "профессору", "профессором"],
      translation: "The student attentively listens to his professor.",
      transliteration: "Student vnimatelno slushaet svoego professora.",
      explanation: "Animate masculine direct object takes -а ending."
    },
    {
      id: "q_acc_6",
      topicId: "accusative_case",
      sentencePattern: "Мы положи́ли докуме́нты на [blank] (стол).",
      answer: "стол",
      choices: ["стол", "стола", "столу", "столе"],
      translation: "We put the documents on the table.",
      transliteration: "My polozhili dokumenty na stol.",
      explanation: "Direction with preposition «на» + inanimate noun requires Accusative."
    },
    {
      id: "q_acc_7",
      topicId: "accusative_case",
      sentencePattern: "Я хочу́ купи́ть но́вую [blank] (машина) в э́том году́.",
      answer: "машину",
      choices: ["машину", "машина", "машине", "машиной"],
      translation: "I want to buy a new car this year.",
      transliteration: "Ya khochu kupit novuyu mashinu v etom godu.",
      explanation: "Direct object of «купить» takes Accusative feminine -у."
    },
    {
      id: "q_acc_8",
      topicId: "accusative_case",
      sentencePattern: "Де́ти уви́дели в зоопа́рке большо́го [blank] (слон).",
      answer: "слона",
      choices: ["слона", "слон", "слону", "слоном"],
      translation: "Children saw a big elephant in the zoo.",
      transliteration: "Deti uvideli v zooparke bolshogo slona.",
      explanation: "Animate masculine noun takes Accusative ending -а."
    },
    {
      id: "q_acc_9",
      topicId: "accusative_case",
      sentencePattern: "Оте́ц включи́л [blank] (телевизор), что́бы посмотре́ть футбо́л.",
      answer: "телевизор",
      choices: ["телевизор", "телевизора", "телевизору", "телевизоре"],
      translation: "Father turned on the television to watch football.",
      transliteration: "Otets vklyuchil televizor, chtoby posmotret futbol.",
      explanation: "Inanimate masculine direct object is identical to Nominative."
    },
    {
      id: "q_acc_10",
      topicId: "accusative_case",
      sentencePattern: "Мы ждём на́шу люби́мую [blank] (бабушка) в го́сти.",
      answer: "бабушку",
      choices: ["бабушку", "бабушка", "бабушке", "бабушкой"],
      translation: "We are waiting for our beloved grandmother to visit.",
      transliteration: "My zhdyom nashu lyubimuyu babushku v gosti.",
      explanation: "Direct object of «ждать» takes Accusative feminine ending -у."
    },
    {
      id: "q_acc_11",
      topicId: "accusative_case",
      sentencePattern: "Он аккура́тно откры́л [blank] (окно) в ко́мнате.",
      answer: "окно",
      choices: ["окно", "окна", "окну", "окном"],
      translation: "He carefully opened the window in the room.",
      transliteration: "On akkuratno otkryl okno v komnate.",
      explanation: "Neuter direct object remains identical to Nominative «окно»."
    },

    // 3. GENITIVE CASE (11 Questions)
    {
      id: "q_gen_1",
      topicId: "genitive_case",
      sentencePattern: "У меня́ сейча́с совсе́м нет [blank] (время).",
      answer: "времени",
      choices: ["времени", "время", "временем", "времена"],
      translation: "I have no time at all right now.",
      transliteration: "U menya seychas sovsem net vremeni.",
      explanation: "Negation with «нет» requires Genitive. Neuter -мя noun takes «времени»."
    },
    {
      id: "q_gen_2",
      topicId: "genitive_case",
      sentencePattern: "Э́то маши́на моего́ ста́ршего [blank] (брат).",
      answer: "брата",
      choices: ["брата", "брат", "брату", "братом"],
      translation: "This is the car of my older brother.",
      transliteration: "Eto mashina moego starshego brata.",
      explanation: "Possession requires the Genitive case. Masculine takes -а."
    },
    {
      id: "q_gen_3",
      topicId: "genitive_case",
      sentencePattern: "Мы купи́ли два килогра́мма све́жих [blank] (яблоко).",
      answer: "яблок",
      choices: ["яблок", "яблока", "яблоку", "яблоками"],
      translation: "We bought two kilos of fresh apples.",
      transliteration: "My kupili dva kilogramma svezhikh yablok.",
      explanation: "Genitive plural of neuter noun «яблоко» is «яблок»."
    },
    {
      id: "q_gen_4",
      topicId: "genitive_case",
      sentencePattern: "Я пью у́тренний чай без [blank] (сахар).",
      answer: "сахара",
      choices: ["сахара", "сахар", "сахару", "сахаром"],
      translation: "I drink morning tea without sugar.",
      transliteration: "Ya pyu utrenniy chay bez sakhara.",
      explanation: "Preposition «без» strictly takes the Genitive case."
    },
    {
      id: "q_gen_5",
      topicId: "genitive_case",
      sentencePattern: "Э́тот пода́рок пригото́влен для на́шей [blank] (мама).",
      answer: "мамы",
      choices: ["мамы", "мама", "маму", "маме"],
      translation: "This gift is prepared for our mom.",
      transliteration: "Etot podarok prigotovlen dlya nashey mamy.",
      explanation: "Preposition «для» requires Genitive feminine ending -ы."
    },
    {
      id: "q_gen_6",
      topicId: "genitive_case",
      sentencePattern: "Студе́нт верну́лся из [blank] (библиотека) по́здно ве́чером.",
      answer: "библиотеки",
      choices: ["библиотеки", "библиотека", "библиотеку", "библиотеке"],
      translation: "The student returned from the library late in the evening.",
      transliteration: "Student vernulsya iz biblioteki pozdno vecherom.",
      explanation: "Preposition of origin «из» requires Genitive."
    },
    {
      id: "q_gen_7",
      topicId: "genitive_case",
      sentencePattern: "В на́шем го́роде ско́ро не бу́дет э́того ста́рого [blank] (мост).",
      answer: "моста",
      choices: ["моста", "мост", "мосту", "мостом"],
      translation: "Soon in our city there won't be this old bridge.",
      transliteration: "V nashem gorode skoro ne budet etogo starogo mosta.",
      explanation: "Future negation «не будет» takes Genitive case."
    },
    {
      id: "q_gen_8",
      topicId: "genitive_case",
      sentencePattern: "У на́шего но́вого [blank] (друг) о́чень краси́вый дом.",
      answer: "друга",
      choices: ["друга", "друг", "другу", "другом"],
      translation: "Our new friend has a very beautiful house.",
      transliteration: "U nashego novogo druga ochen krasivyy dom.",
      explanation: "Possession construction «У + кого» takes Genitive."
    },
    {
      id: "q_gen_9",
      topicId: "genitive_case",
      sentencePattern: "На у́лице совсе́м нет [blank] (снег) э́той зимо́й.",
      answer: "снега",
      choices: ["снега", "снег", "снегу", "снегом"],
      translation: "There is no snow at all outside this winter.",
      transliteration: "Na ulitse sovsem net snega etoy zimoy.",
      explanation: "Negation with «нет» requires Genitive masculine ending -а."
    },
    {
      id: "q_gen_10",
      topicId: "genitive_case",
      sentencePattern: "После́ уро́ка [blank] (русский язык) мы пошли́ в кафе́.",
      answer: "русского языка",
      choices: ["русского языка", "русский язык", "русскому языку", "русским языком"],
      translation: "After the Russian language lesson we went to a cafe.",
      transliteration: "Posle uroka russkogo yazyka my poshli v kafe.",
      explanation: "Noun-noun modification requires Genitive."
    },
    {
      id: "q_gen_11",
      topicId: "genitive_case",
      sentencePattern: "Около на́шего [blank] (дом) нахо́дится краси́вый парк.",
      answer: "дома",
      choices: ["дома", "дом", "дому", "доме"],
      translation: "Near our house is located a beautiful park.",
      transliteration: "Okolo nashego doma nakhoditsya krasivyy park.",
      explanation: "Preposition «около» takes the Genitive case."
    },

    // 4. DATIVE CASE (11 Questions)
    {
      id: "q_dat_1",
      topicId: "dative_case",
      sentencePattern: "Я ча́сто звоню́ своему́ лу́чшему [blank] (друг).",
      answer: "другу",
      choices: ["другу", "друг", "друга", "другом"],
      translation: "I often call my best friend.",
      transliteration: "Ya chasto zvonyu svoemu luchshemu drugu.",
      explanation: "The verb «звонить» governs the Dative case (кому?)."
    },
    {
      id: "q_dat_2",
      topicId: "dative_case",
      sentencePattern: "Моему́ мла́дшему [blank] (брат) испо́лнилось два́дцать лет.",
      answer: "брату",
      choices: ["брату", "брат", "брата", "братом"],
      translation: "My younger brother turned twenty years old.",
      transliteration: "Moemu mladshemu bratu ispolnilos dvadtsat let.",
      explanation: "Age constructions in Russian require the Dative case."
    },
    {
      id: "q_dat_3",
      topicId: "dative_case",
      sentencePattern: "Преподава́тель помо́г [blank] (студентка) реши́ть зада́чу.",
      answer: "студентке",
      choices: ["студентке", "студентка", "студентку", "студенткой"],
      translation: "The teacher helped the female student solve the problem.",
      transliteration: "Prepodavatel pomog studentke reshit zadachu.",
      explanation: "«Помогать» takes the Dative feminine ending -е."
    },
    {
      id: "q_dat_4",
      topicId: "dative_case",
      sentencePattern: "Мы ве́чером гуля́ли по краси́вому [blank] (парк).",
      answer: "парку",
      choices: ["парку", "парк", "парка", "парке"],
      translation: "In the evening we walked along the beautiful park.",
      transliteration: "My vecherom gulyali po krasivomu parku.",
      explanation: "Preposition «по» (along/through) requires the Dative case."
    },
    {
      id: "q_dat_5",
      topicId: "dative_case",
      sentencePattern: "Студе́нтам о́чень нра́вится э́тот но́вый [blank] (курс).",
      answer: "курс",
      choices: ["курс", "курса", "курсу", "курсом"],
      translation: "Students really like this new course.",
      transliteration: "Studentam ochen nravitsya etot novyy kurs.",
      explanation: "With «нравиться», the liked item is the subject in Nominative."
    },
    {
      id: "q_dat_6",
      topicId: "dative_case",
      sentencePattern: "Врач посове́товал [blank] (пациент) бо́льше отдыха́ть.",
      answer: "пациенту",
      choices: ["пациенту", "пациент", "пациента", "пациентом"],
      translation: "The doctor advised the patient to rest more.",
      transliteration: "Vrach posovetoval patsientu bolshe otdykhat.",
      explanation: "Verb «советовать» takes Dative masculine -у."
    },
    {
      id: "q_dat_7",
      topicId: "dative_case",
      sentencePattern: "Мы идём в го́сти к на́шей [blank] (бабушка).",
      answer: "бабушке",
      choices: ["бабушке", "бабушка", "бабушку", "бабушкой"],
      translation: "We are going to visit our grandmother.",
      transliteration: "My idyom v gosti k nashey babushke.",
      explanation: "Preposition of direction towards person «к» takes Dative."
    },
    {
      id: "q_dat_8",
      topicId: "dative_case",
      sentencePattern: "Мне о́чень [blank] (холодно) на у́лице зимо́й.",
      answer: "холодно",
      choices: ["холодно", "холодный", "холодная", "холодное"],
      translation: "I feel very cold outside in winter.",
      transliteration: "Mne ochen kholodno na ulitse zimoy.",
      explanation: "Impersonal Dative state construction requires adverb form «холодно»."
    },
    {
      id: "q_dat_9",
      topicId: "dative_case",
      sentencePattern: "Она́ написа́ла дли́нное письмо́ свое́й [blank] (сестра).",
      answer: "сестре",
      choices: ["сестре", "сестра", "сестру", "сестрой"],
      translation: "She wrote a long letter to her sister.",
      transliteration: "Ona napisala dlinnoe pismo svoey sestre.",
      explanation: "Indirect recipient of writing requires Dative feminine ending -е."
    },
    {
      id: "q_dat_10",
      topicId: "dative_case",
      sentencePattern: "Нам ну́жно подгото́виться к ва́жному [blank] (экзамен).",
      answer: "экзамену",
      choices: ["экзамену", "экзамен", "экзамена", "экзаменом"],
      translation: "We need to prepare for the important exam.",
      transliteration: "Nam nuzhno podgotovitsya k vazhnomu ekzamenu.",
      explanation: "Preposition «к» requires Dative masculine ending -у."
    },
    {
      id: "q_dat_11",
      topicId: "dative_case",
      sentencePattern: "Тури́сты е́дут по гла́вному [blank] (проспект) го́рода.",
      answer: "проспекту",
      choices: ["проспекту", "проспект", "проспекта", "проспекте"],
      translation: "Tourists are riding along the main avenue of the city.",
      transliteration: "Turisty edut po glavnomu prospektu goroda.",
      explanation: "Preposition «по» governs Dative case."
    },

    // 5. INSTRUMENTAL CASE (11 Questions)
    {
      id: "q_inst_1",
      topicId: "instrumental_case",
      sentencePattern: "Я люблю́ пить горя́чий чай с [blank] (лимон).",
      answer: "лимоном",
      choices: ["лимоном", "лимон", "лимона", "лимону"],
      translation: "I like drinking hot tea with lemon.",
      transliteration: "Ya lyublyu pit goryachiy chay s limonom.",
      explanation: "Preposition «с» takes Instrumental masculine ending -ом."
    },
    {
      id: "q_inst_2",
      topicId: "instrumental_case",
      sentencePattern: "Мой оте́ц рабо́тает гла́вным [blank] (инженер) на заво́де.",
      answer: "инженером",
      choices: ["инженером", "инженер", "инженера", "инженеру"],
      translation: "My father works as chief engineer at the factory.",
      transliteration: "Moy otets rabotaet glavnym inzhenerom na zavode.",
      explanation: "Profession with verb «работать» takes Instrumental case."
    },
    {
      id: "q_inst_3",
      topicId: "instrumental_case",
      sentencePattern: "Студе́нт пи́шет конспе́кт си́ней [blank] (ручка).",
      answer: "ручкой",
      choices: ["ручкой", "ручка", "ручку", "ручке"],
      translation: "The student writes the notes with a blue pen.",
      transliteration: "Student pishet konspekt siney ruchkoy.",
      explanation: "Instrument of action without preposition takes Instrumental -ой."
    },
    {
      id: "q_inst_4",
      topicId: "instrumental_case",
      sentencePattern: "Мы с [blank] (друг) пошли́ в кино́ на но́вый фильм.",
      answer: "другом",
      choices: ["другом", "друг", "друга", "другу"],
      translation: "My friend and I went to the cinema to see a new movie.",
      transliteration: "My s drugom poshli v kino na novyy film.",
      explanation: "Companionship with «с» takes Instrumental masculine -ом."
    },
    {
      id: "q_inst_5",
      topicId: "instrumental_case",
      sentencePattern: "Она́ мечта́ет стать изве́стной [blank] (актриса).",
      answer: "актрисой",
      choices: ["актрисой", "актриса", "актрису", "актрисе"],
      translation: "She dreams of becoming a famous actress.",
      transliteration: "Ona mechtaet stat izvestnoy aktrisoy.",
      explanation: "Predicate with verb «стать» takes Instrumental case."
    },
    {
      id: "q_inst_6",
      topicId: "instrumental_case",
      sentencePattern: "Над на́шим [blank] (город) я́рко све́тит со́лнце.",
      answer: "городом",
      choices: ["городом", "город", "города", "городе"],
      translation: "Above our city the sun shines brightly.",
      transliteration: "Nad nashim gorodom yarko svetit solntse.",
      explanation: "Spatial preposition «над» (above) requires Instrumental case."
    },
    {
      id: "q_inst_7",
      topicId: "instrumental_case",
      sentencePattern: "Маши́на стоя́ла пе́ред краси́вым [blank] (дом).",
      answer: "домом",
      choices: ["домом", "дом", "дома", "доме"],
      translation: "The car was parked in front of the beautiful house.",
      transliteration: "Mashina stoyala pered krasivym domom.",
      explanation: "Spatial preposition «перед» (in front of) takes Instrumental."
    },
    {
      id: "q_inst_8",
      topicId: "instrumental_case",
      sentencePattern: "Учи́тель горди́тся свои́м тала́нтливым [blank] (ученик).",
      answer: "учеником",
      choices: ["учеником", "ученик", "ученика", "ученику"],
      translation: "The teacher is proud of his talented student.",
      transliteration: "Uchitel gorditsya svoim talantlivym uchenikom.",
      explanation: "Verb «гордиться» strictly governs the Instrumental case."
    },
    {
      id: "q_inst_9",
      topicId: "instrumental_case",
      sentencePattern: "Он увлечённо занима́ется [blank] (спорт) ка́ждое у́тро.",
      answer: "спортом",
      choices: ["спортом", "спорт", "спорта", "спорту"],
      translation: "He enthusiastically engages in sport every morning.",
      transliteration: "On uvlechyonno zanimaetsya sportom kazhdoe utro.",
      explanation: "Verb «заниматься» governs the Instrumental case."
    },
    {
      id: "q_inst_10",
      topicId: "instrumental_case",
      sentencePattern: "Ко́шка спря́талась под деревя́нным [blank] (стол).",
      answer: "столом",
      choices: ["столом", "стол", "стола", "столе"],
      translation: "The cat hid under the wooden table.",
      transliteration: "Koshka spryatalas pod derevyannym stolom.",
      explanation: "Static location under object with preposition «под» takes Instrumental."
    },
    {
      id: "q_inst_11",
      topicId: "instrumental_case",
      sentencePattern: "Мы зака́зали пи́ццу с сы́ром и [blank] (гриб).",
      answer: "грибами",
      choices: ["грибами", "грибы", "грибов", "грибам"],
      translation: "We ordered pizza with cheese and mushrooms.",
      transliteration: "My zakazali pittsu s syrom i gribami.",
      explanation: "Instrumental plural ending is «-ами»."
    },

    // 6. PREPOSITIONAL CASE (11 Questions)
    {
      id: "q_prep_1",
      topicId: "prepositional_case",
      sentencePattern: "Сейча́с мы живём и рабо́таем в [blank] (Москва).",
      answer: "Москве",
      choices: ["Москве", "Москва", "Москву", "Москвой"],
      translation: "Currently we live and work in Moscow.",
      transliteration: "Seychas my zhivyom i rabotaem v Moskve.",
      explanation: "Static location with preposition «в» takes Prepositional ending -е."
    },
    {
      id: "q_prep_2",
      topicId: "prepositional_case",
      sentencePattern: "Студе́нты на уро́ке говоря́т о но́вом [blank] (фильм).",
      answer: "фильме",
      choices: ["фильме", "фильм", "фильма", "фильмом"],
      translation: "Students in class talk about the new movie.",
      transliteration: "Studenty na uroke govoryat o novom filme.",
      explanation: "Topic of speech with preposition «о» takes Prepositional ending -е."
    },
    {
      id: "q_prep_3",
      topicId: "prepositional_case",
      sentencePattern: "Ле́том мы люби́ли гуля́ть в сосно́вом [blank] (лес).",
      answer: "лесу",
      choices: ["лесу", "лес", "леса", "лесе"],
      translation: "In summer we loved walking in the pine forest.",
      transliteration: "Letom my lyubili gulyat v sosnovom lesu.",
      explanation: "Certain masculine nouns take the stressed locative ending -у after в/на."
    },
    {
      id: "q_prep_4",
      topicId: "prepositional_case",
      sentencePattern: "Мой друг у́чится в столи́чном [blank] (университет).",
      answer: "университете",
      choices: ["университете", "университет", "университета", "университетом"],
      translation: "My friend studies at the capital university.",
      transliteration: "Moy drug uchitsya v stolichnom universitete.",
      explanation: "Static location in masculine noun takes Prepositional ending -е."
    },
    {
      id: "q_prep_5",
      topicId: "prepositional_case",
      sentencePattern: "Мы провели́ отпуск в прекра́сной [blank] (Италия).",
      answer: "Италии",
      choices: ["Италии", "Италия", "Италию", "Италией"],
      translation: "We spent our vacation in wonderful Italy.",
      transliteration: "My proveli otpusk v prekrasnoy Italii.",
      explanation: "Feminine nouns ending in -ия take the Prepositional ending -и."
    },
    {
      id: "q_prep_6",
      topicId: "prepositional_case",
      sentencePattern: "Кни́ги и тетра́ди лежа́т на пи́сьменном [blank] (стол).",
      answer: "столе",
      choices: ["столе", "стол", "стола", "столом"],
      translation: "Books and notebooks are lying on the desk.",
      transliteration: "Knigi i tetradi lezhat na pismennom stole.",
      explanation: "Static location on surface with «на» takes Prepositional ending -е."
    },
    {
      id: "q_prep_7",
      topicId: "prepositional_case",
      sentencePattern: "Она́ ча́сто ду́мает о свое́й [blank] (семья).",
      answer: "семье",
      choices: ["семье", "семья", "семью", "семьёй"],
      translation: "She often thinks about her family.",
      transliteration: "Ona chasto dumaet o svoey semye.",
      explanation: "Topic of thought with preposition «о» takes Prepositional ending -е."
    },
    {
      id: "q_prep_8",
      topicId: "prepositional_case",
      sentencePattern: "В э́том совреме́нном [blank] (здание) нахо́дится банк.",
      answer: "здании",
      choices: ["здании", "здание", "здания", "зданием"],
      translation: "In this modern building is located a bank.",
      transliteration: "V etom sovremennom zdanii nakhoditsya bank.",
      explanation: "Neuter nouns ending in -ие take Prepositional ending -и."
    },
    {
      id: "q_prep_9",
      topicId: "prepositional_case",
      sentencePattern: "Они́ сейча́с нахо́дятся на гла́вной [blank] (площадь).",
      answer: "площади",
      choices: ["площади", "площадь", "площадью", "площадях"],
      translation: "They are currently on the main square.",
      transliteration: "Oni seychas nakhodyatsya na glavnoy ploshchadi.",
      explanation: "Feminine 3rd declension (-ь) takes Prepositional ending -и."
    },
    {
      id: "q_prep_10",
      topicId: "prepositional_case",
      sentencePattern: "Пальто́ виси́т в деревя́нном [blank] (шкаф).",
      answer: "шкафу",
      choices: ["шкафу", "шкаф", "шкафа", "шкафе"],
      translation: "The coat is hanging in the wooden wardrobe.",
      transliteration: "Palto visit v derevyannom shkafu.",
      explanation: "Locative ending in -у for noun «шкаф» in Prepositional case."
    },
    {
      id: "q_prep_11",
      topicId: "prepositional_case",
      sentencePattern: "Профе́ссор рассказа́л об интерне́сном нау́чном [blank] (открытие).",
      answer: "открытии",
      choices: ["открытии", "открытие", "открытия", "открытием"],
      translation: "The professor told about an interesting scientific discovery.",
      transliteration: "Professor rasskazal ob interesnom nauchnom otkrytii.",
      explanation: "Neuter noun ending in -ие takes Prepositional ending -и."
    },

    // 7. VERB ASPECTS (11 Questions)
    {
      id: "q_asp_1",
      topicId: "verb_aspects",
      sentencePattern: "Вчера́ весь ве́чер я [blank] (читать) истори́ческий рома́н.",
      answer: "читал",
      choices: ["читал", "прочитал", "прочитаю", "прочитать"],
      translation: "Yesterday all evening I was reading a historical novel.",
      transliteration: "Vchera ves vecher ya chital istoricheskiy roman.",
      explanation: "Duration of process ('all evening') requires the Imperfective aspect."
    },
    {
      id: "q_asp_2",
      topicId: "verb_aspects",
      sentencePattern: "Я наконе́ц [blank] (прочитать) всю кни́гу до конца́.",
      answer: "прочитал",
      choices: ["прочитал", "читал", "буду читать", "читаю"],
      translation: "I finally finished reading the whole book to the end.",
      transliteration: "Ya nakonets prochital vsyu knigu do kontsa.",
      explanation: "Completed result with completion marker «наконец» requires Perfective."
    },
    {
      id: "q_asp_3",
      topicId: "verb_aspects",
      sentencePattern: "Он ка́ждое у́тро [blank] (делать) заря́дку.",
      answer: "делает",
      choices: ["делает", "сделает", "сделал", "делать"],
      translation: "He does morning exercise every morning.",
      transliteration: "On kazhdoe utro delaet zaryadku.",
      explanation: "Habitual repeated action requires the Imperfective aspect."
    },
    {
      id: "q_asp_4",
      topicId: "verb_aspects",
      sentencePattern: "Студе́нт бы́стро [blank] (решить) сло́жную зада́чу на экза́мене.",
      answer: "решил",
      choices: ["решил", "решал", "будет решать", "решает"],
      translation: "The student quickly solved the difficult problem on the exam.",
      transliteration: "Student bystro reshil slozhnuyu zadachu na ekzamene.",
      explanation: "Achieved result in past requires Perfective «решил»."
    },
    {
      id: "q_asp_5",
      topicId: "verb_aspects",
      sentencePattern: "Она́ ча́сто [blank] (писать) пи́сьма свои́м друзья́м.",
      answer: "пишет",
      choices: ["пишет", "напишет", "написала", "писать"],
      translation: "She often writes letters to her friends.",
      transliteration: "Ona chasto pishet pisma svoim druzyam.",
      explanation: "Repetition with «часто» requires Imperfective aspect."
    },
    {
      id: "q_asp_6",
      topicId: "verb_aspects",
      sentencePattern: "За́втра я обяза́тельно [blank] (написать) тебе́ отве́т.",
      answer: "напишу",
      choices: ["напишу", "буду писать", "писал", "написал"],
      translation: "Tomorrow I will definitely write you an answer.",
      transliteration: "Zavtra ya obyazatelno napishu tebe otvet.",
      explanation: "One-time completed future action requires Perfective simple future."
    },
    {
      id: "q_asp_7",
      topicId: "verb_aspects",
      sentencePattern: "Мы до́лго [blank] (обсуждать) план на́шего путеше́ствия.",
      answer: "обсуждали",
      choices: ["обсуждали", "обсудили", "обсудят", "обсудим"],
      translation: "We discussed our travel plan for a long time.",
      transliteration: "My dolgo obsuzhdali plan nashego puteshestviya.",
      explanation: "Duration with «долго» requires Imperfective past."
    },
    {
      id: "q_asp_8",
      topicId: "verb_aspects",
      sentencePattern: "Худо́жник наконе́ц [blank] (нарисовать) прекра́сный портре́т.",
      answer: "нарисовал",
      choices: ["нарисовал", "рисовал", "рисует", "будет рисовать"],
      translation: "The artist finally finished drawing a wonderful portrait.",
      transliteration: "Khudozhnik nakonets narisoval prekrasnyy portret.",
      explanation: "Completed outcome requires Perfective «нарисовал»."
    },
    {
      id: "q_asp_9",
      topicId: "verb_aspects",
      sentencePattern: "Ка́ждый день в восемь утра́ звони́л буди́льник, и он [blank] (вставать).",
      answer: "вставал",
      choices: ["вставал", "встал", "встанет", "встать"],
      translation: "Every day at eight in the morning the alarm rang, and he would get up.",
      transliteration: "Kazhdyy den v vosem utra zvonil budilnik, i on vstaval.",
      explanation: "Repeated past routine requires Imperfective «вставал»."
    },
    {
      id: "q_asp_10",
      topicId: "verb_aspects",
      sentencePattern: "Строи́тели [blank] (построить) но́вую шко́лу за оди́н год.",
      answer: "построили",
      choices: ["построили", "строили", "строят", "будут строить"],
      translation: "The builders built the new school in one year.",
      transliteration: "Stroiteli postroili novuyu shkolu za odin god.",
      explanation: "Result completed within a time limit (за год) requires Perfective."
    },
    {
      id: "q_asp_11",
      topicId: "verb_aspects",
      sentencePattern: "Он всегда́ внима́тельно [blank] (проверять) свою́ рабо́ту.",
      answer: "проверяет",
      choices: ["проверяет", "проверит", "проверил", "проверить"],
      translation: "He always checks his work attentively.",
      transliteration: "On vsegda vnimatelno proveryaet svoyu rabotu.",
      explanation: "Regular habitual action with «всегда» requires Imperfective."
    },

    // 8. VERBS OF MOTION (11 Questions)
    {
      id: "q_vom_1",
      topicId: "verbs_of_motion",
      sentencePattern: "Смотри́, куда́ сейча́с [blank] (идти) э́тот челове́к?",
      answer: "идёт",
      choices: ["идёт", "ходит", "пошёл", "ездит"],
      translation: "Look, where is that person walking right now?",
      transliteration: "Smotri, kuda seychas idyot etot chelovek?",
      explanation: "Unidirectional movement on foot in progress right now requires «идёт»."
    },
    {
      id: "q_vom_2",
      topicId: "verbs_of_motion",
      sentencePattern: "Я ка́ждое у́тро [blank] (ходить) на рабо́ту пешко́м.",
      answer: "хожу",
      choices: ["хожу", "иду", "пойду", "еду"],
      translation: "Every morning I walk to work on foot.",
      transliteration: "Ya kazhdoe utro khozhu na rabotu peshkom.",
      explanation: "Repeated regular round-trip movement on foot requires multidirectional «хожу»."
    },
    {
      id: "q_vom_3",
      topicId: "verbs_of_motion",
      sentencePattern: "Сейча́с мы [blank] (ехать) на по́езде в Санкт-Петербу́рг.",
      answer: "едем",
      choices: ["едем", "ездим", "поедем", "ходим"],
      translation: "Right now we are riding on the train to Saint Petersburg.",
      transliteration: "Seychas my edem na poezde v Sankt-Peterburg.",
      explanation: "Unidirectional motion by transport currently underway requires «едем»."
    },
    {
      id: "q_vom_4",
      topicId: "verbs_of_motion",
      sentencePattern: "В про́шлом году́ мы ча́сто [blank] (ездить) за́ город.",
      answer: "ездили",
      choices: ["ездили", "ехали", "поехали", "пойдём"],
      translation: "Last year we often traveled out of town.",
      transliteration: "V proshlom godu my chasto ezdili za gorod.",
      explanation: "Repeated trips by transport in the past require multidirectional «ездили»."
    },
    {
      id: "q_vom_5",
      topicId: "verbs_of_motion",
      sentencePattern: "Самолёт то́лько что [blank] (прилететь) в аэропо́рт.",
      answer: "прилетел",
      choices: ["прилетел", "улетел", "летал", "летит"],
      translation: "The plane just arrived at the airport.",
      transliteration: "Samolyot tolko chto priletel v aeroport.",
      explanation: "Prefix «при-» indicates arrival at destination."
    },
    {
      id: "q_vom_6",
      topicId: "verbs_of_motion",
      sentencePattern: "Пти́цы о́сенью [blank] (улетать) на юг.",
      answer: "улетают",
      choices: ["улетают", "прилетают", "летят", "летали"],
      translation: "Birds fly away to the south in autumn.",
      transliteration: "Ptitsy osenyu uletayut na yug.",
      explanation: "Prefix «у-» denotes departure/moving away."
    },
    {
      id: "q_vom_7",
      topicId: "verbs_of_motion",
      sentencePattern: "Куда́ вы [blank] (ехать) сле́дующим ле́том?",
      answer: "поедете",
      choices: ["поедете", "ездите", "ходили", "едете"],
      translation: "Where will you travel next summer?",
      transliteration: "Kuda vy poedete sleduyushchim letom?",
      explanation: "Future planned trip by vehicle takes Perfective simple future «поедете»."
    },
    {
      id: "q_vom_8",
      topicId: "verbs_of_motion",
      sentencePattern: "Он встал, оде́лся и [blank] (пойти) в магази́н.",
      answer: "пошёл",
      choices: ["пошёл", "ходил", "шёл", "идёт"],
      translation: "He got up, dressed, and set off on foot to the store.",
      transliteration: "On vstal, odelsya i poshol v magazin.",
      explanation: "Prefix «по-» denotes the beginning of motion in a sequence of actions."
    },
    {
      id: "q_vom_9",
      topicId: "verbs_of_motion",
      sentencePattern: "Де́ти лю́бят [blank] (плавать) в тёплом бассéйне.",
      answer: "плавать",
      choices: ["плавать", "плыть", "поплыть", "приплыть"],
      translation: "Children like to swim in the warm pool.",
      transliteration: "Deti lyubyat plavat v tyoplom basseyne.",
      explanation: "General ability/multidirectional recreation requires «плавать»."
    },
    {
      id: "q_vom_10",
      topicId: "verbs_of_motion",
      sentencePattern: "Бе́лый па́русник ме́дленно [blank] (плыть) к берегу.",
      answer: "плывёт",
      choices: ["плывёт", "плавает", "плавал", "поплывёт"],
      translation: "The white sailboat is slowly floating towards the shore.",
      transliteration: "Belyy parusnik medlenno plyvyot k beregu.",
      explanation: "Unidirectional motion in progress towards destination takes «плывёт»."
    },
    {
      id: "q_vom_11",
      topicId: "verbs_of_motion",
      sentencePattern: "Вчера́ мы весь день [blank] (ходить) по музе́ям.",
      answer: "ходили",
      choices: ["ходили", "шли", "пошли", "идём"],
      translation: "Yesterday we walked through museums the whole day.",
      transliteration: "Vchera my ves den khodili po muzeyam.",
      explanation: "Multidirectional movement around different places takes «ходили»."
    },

    // 9. VERB CONJUGATIONS (11 Questions)
    {
      id: "q_conj_1",
      topicId: "verb_conjugations",
      sentencePattern: "Они́ о́чень хорошо́ [blank] (понимать) ру́сскую речь.",
      answer: "понимают",
      choices: ["понимают", "понимает", "понимаем", "понимаешь"],
      translation: "They understand Russian speech very well.",
      transliteration: "Oni ochen khorosho ponimayut russkuyu rech.",
      explanation: "1st conjugation 3rd person plural ending is «-ют»."
    },
    {
      id: "q_conj_2",
      topicId: "verb_conjugations",
      sentencePattern: "Ты свобо́дно [blank] (говорить) по-англи́йски?",
      answer: "говоришь",
      choices: ["говоришь", "говорит", "говорю", "говорят"],
      translation: "Do you speak English fluently?",
      transliteration: "Ty svobodno govorish po-angliyski?",
      explanation: "2nd conjugation 2nd person singular ending is «-ишь»."
    },
    {
      id: "q_conj_3",
      topicId: "verb_conjugations",
      sentencePattern: "Мы ка́ждый день [blank] (читать) но́вые стать́и.",
      answer: "читаем",
      choices: ["читаем", "читает", "читают", "читаешь"],
      translation: "We read new articles every day.",
      transliteration: "My kazhdyy den chitaem novye stati.",
      explanation: "1st conjugation 1st person plural ending is «-ем»."
    },
    {
      id: "q_conj_4",
      topicId: "verb_conjugations",
      sentencePattern: "Студе́нт бы́стро [blank] (писать) конспе́кт ле́кции.",
      answer: "пишет",
      choices: ["пишет", "пишут", "пишешь", "пишем"],
      translation: "The student quickly writes lecture notes.",
      transliteration: "Student bystro pishet konspekt lektsii.",
      explanation: "1st conjugation with consonant shift (с → ш) 3rd person singular is «пишет»."
    },
    {
      id: "q_conj_5",
      topicId: "verb_conjugations",
      sentencePattern: "Я о́чень [blank] (любить) путеше́ствовать по ми́ру.",
      answer: "люблю",
      choices: ["люблю", "любишь", "любит", "любят"],
      translation: "I really love traveling around the world.",
      transliteration: "Ya ochen lyublyu puteshestvovat po miru.",
      explanation: "2nd conjugation 1st person singular with labial mutation takes «люблю»."
    },
    {
      id: "q_conj_6",
      topicId: "verb_conjugations",
      sentencePattern: "Где вы сейча́с [blank] (жить) и рабо́таете?",
      answer: "живёте",
      choices: ["живёте", "живёт", "живём", "живут"],
      translation: "Where do you currently live and work?",
      transliteration: "Gde vy seychas zhivyote i rabotaete?",
      explanation: "1st conjugation with end-stress 2nd person plural ending is «-ёте»."
    },
    {
      id: "q_conj_7",
      topicId: "verb_conjugations",
      sentencePattern: "Они́ ча́сто [blank] (смотреть) познава́тельные переда́чи.",
      answer: "смотрят",
      choices: ["смотрят", "смотрит", "смотрим", "смотришь"],
      translation: "They often watch educational broadcasts.",
      transliteration: "Oni chasto smotryat poznavatelnye peredachi.",
      explanation: "2nd conjugation exception verb «смотреть» takes 3rd plural «смотрят»."
    },
    {
      id: "q_conj_8",
      topicId: "verb_conjugations",
      sentencePattern: "Что ты сейча́с [blank] (делать) в ко́мнате?",
      answer: "делаешь",
      choices: ["делаешь", "делает", "делаю", "делают"],
      translation: "What are you doing in the room right now?",
      transliteration: "Chto ty seychas delaesh v komnate?",
      explanation: "1st conjugation 2nd person singular ending is «-ешь»."
    },
    {
      id: "q_conj_9",
      topicId: "verb_conjugations",
      sentencePattern: "Врач внима́тельно [blank] (слушать) дыха́ние пацие́нта.",
      answer: "слушает",
      choices: ["слушает", "слушают", "слушаешь", "слушаем"],
      translation: "The doctor listens attentively to the patient's breathing.",
      transliteration: "Vrach vnimatelno slushaet dykhanie patsienta.",
      explanation: "1st conjugation 3rd person singular ending is «-ет»."
    },
    {
      id: "q_conj_10",
      topicId: "verb_conjugations",
      sentencePattern: "Мы всегда́ [blank] (помнить) на́ших учителе́й.",
      answer: "помним",
      choices: ["помним", "помнит", "помнят", "помнишь"],
      translation: "We always remember our teachers.",
      transliteration: "My vsegda pomnim nashikh uchiteley.",
      explanation: "2nd conjugation 1st person plural ending is «-им»."
    },
    {
      id: "q_conj_11",
      topicId: "verb_conjugations",
      sentencePattern: "Они́ [blank] (хотеть) поступи́ть в университе́т.",
      answer: "хотят",
      choices: ["хотят", "хочет", "хотим", "хочешь"],
      translation: "They want to enroll in the university.",
      transliteration: "Oni khotyat postupit v universitet.",
      explanation: "Mixed conjugation verb «хотеть» has 3rd plural «хотят»."
    },

    // 10. PAST TENSE (11 Questions)
    {
      id: "q_past_1",
      topicId: "past_tense",
      sentencePattern: "Вчера́ А́нна [blank] (написать) отли́чное сочине́ние.",
      answer: "написала",
      choices: ["написала", "написал", "написало", "написали"],
      translation: "Yesterday Anna wrote an excellent composition.",
      transliteration: "Vchera Anna napisala otlichnoe sochinenie.",
      explanation: "Feminine singular subject requires the past tense ending «-ла»."
    },
    {
      id: "q_past_2",
      topicId: "past_tense",
      sentencePattern: "Студе́нты до́лго [blank] (обсуждать) ито́ги конфере́нции.",
      answer: "обсуждали",
      choices: ["обсуждали", "обсуждал", "обсуждала", "обсуждало"],
      translation: "The students discussed the outcomes of the conference for a long time.",
      transliteration: "Studenty dolgo obsuzhdali itogi konferentsii.",
      explanation: "Plural subject requires the past tense ending «-ли»."
    },
    {
      id: "q_past_3",
      topicId: "past_tense",
      sentencePattern: "У́тром со́лнце я́рко [blank] (светить) в окно́.",
      answer: "светило",
      choices: ["светило", "светил", "светила", "светили"],
      translation: "In the morning the sun shone brightly into the window.",
      transliteration: "Utrom solntse yarko svetilo v okno.",
      explanation: "Neuter subject «солнце» takes the past tense ending «-ло»."
    },
    {
      id: "q_past_4",
      topicId: "past_tense",
      sentencePattern: "Мой брат [blank] (окончить) шко́лу с золо́той меда́лью.",
      answer: "окончил",
      choices: ["окончил", "окончила", "окончило", "окончили"],
      translation: "My brother graduated from school with a gold medal.",
      transliteration: "Moy brat okonchil shkolu s zolotoy medalyu.",
      explanation: "Masculine singular subject takes past tense ending «-л»."
    },
    {
      id: "q_past_5",
      topicId: "past_tense",
      sentencePattern: "В про́шлом году́ семья́ [blank] (купить) но́вую кварти́ру.",
      answer: "купила",
      choices: ["купила", "купил", "купило", "купили"],
      translation: "Last year the family bought a new apartment.",
      transliteration: "V proshlom godu semya kupila novuyu kvartiru.",
      explanation: "Feminine collective subject «семья» takes «-ла»."
    },
    {
      id: "q_past_6",
      topicId: "past_tense",
      sentencePattern: "Окно́ в ко́мнате [blank] (разбиться) от си́льного ве́тра.",
      answer: "разбилось",
      choices: ["разбилось", "разбился", "разбилась", "разбились"],
      translation: "The window in the room shattered from the strong wind.",
      transliteration: "Okno v komnate razbilos ot silnogo vetra.",
      explanation: "Neuter subject «окно» takes reflexive past «-лось»."
    },
    {
      id: "q_past_7",
      topicId: "past_tense",
      sentencePattern: "Мы ве́село [blank] (провести) вре́мя на да́че.",
      answer: "провели",
      choices: ["провели", "провёл", "провела", "провело"],
      translation: "We spent time cheerfully at the country house.",
      transliteration: "My veselo proveli vremya na dache.",
      explanation: "Plural subject «мы» takes past tense «провели»."
    },
    {
      id: "q_past_8",
      topicId: "past_tense",
      sentencePattern: "По́езд [blank] (прийти) на вокза́л то́чно по расписа́нию.",
      answer: "пришёл",
      choices: ["пришёл", "пришла", "пришло", "пришли"],
      translation: "The train arrived at the station strictly on schedule.",
      transliteration: "Poyezd prishol na vokzal tochno po raspisaniyu.",
      explanation: "Masculine irregular past tense from «прийти» is «пришёл»."
    },
    {
      id: "q_past_9",
      topicId: "past_tense",
      sentencePattern: "Она́ бы́стро [blank] (найти) ну́жный докуме́нт в па́пке.",
      answer: "нашла",
      choices: ["нашла", "нашёл", "нашло", "нашли"],
      translation: "She quickly found the needed document in the folder.",
      transliteration: "Ona bystro nashla nuzhnyy dokument v papke.",
      explanation: "Feminine irregular past tense from «найти» is «нашла»."
    },
    {
      id: "q_past_10",
      topicId: "past_tense",
      sentencePattern: "Де́ти с удово́льствием [blank] (играть) в снежки́ на у́лице.",
      answer: "играли",
      choices: ["играли", "играл", "играла", "играло"],
      translation: "Children played snowballs outdoors with pleasure.",
      transliteration: "Deti s udovolstviem igrali v snezhki na ulitse.",
      explanation: "Plural subject «дети» takes past tense «-ли»."
    },
    {
      id: "q_past_11",
      topicId: "past_tense",
      sentencePattern: "Вчера́ весь день [blank] (идти) тёплый весе́нний дождь.",
      answer: "шёл",
      choices: ["шёл", "шла", "шло", "шли"],
      translation: "Yesterday a warm spring rain fell the whole day.",
      transliteration: "Vchera ves den shol tyoplyy vesenniy dozhd.",
      explanation: "Masculine subject «дождь» takes irregular past «шёл»."
    },

    // 11. FUTURE TENSE (11 Questions)
    {
      id: "q_fut_1",
      topicId: "future_tense",
      sentencePattern: "За́втра я [blank] (работать) в библиоте́ке весь день.",
      answer: "буду работать",
      choices: ["буду работать", "поработаю", "работал", "будет работать"],
      translation: "Tomorrow I will be working in the library the whole day.",
      transliteration: "Zavtra ya budu rabotat v biblioteke ves den.",
      explanation: "Imperfective process in the future requires «буду» + infinitive."
    },
    {
      id: "q_fut_2",
      topicId: "future_tense",
      sentencePattern: "Я обяза́тельно [blank] (прочитать) э́ту кни́гу за выходны́е.",
      answer: "прочитаю",
      choices: ["прочитаю", "буду читать", "читал", "прочитал"],
      translation: "I will definitely finish reading this book over the weekend.",
      transliteration: "Ya obyazatelno prochitayu etu knigu za vykhodnye.",
      explanation: "Perfective simple future expresses a completed result."
    },
    {
      id: "q_fut_3",
      topicId: "future_tense",
      sentencePattern: "Мы [blank] (жить) в но́вом ко́мплексе че́рез год.",
      answer: "будем жить",
      choices: ["будем жить", "поживём", "жили", "будут жить"],
      translation: "We will be living in a new complex in a year.",
      transliteration: "My budem zhit v novom komplekse cherez god.",
      explanation: "State/process in the future takes compound future «будем жить»."
    },
    {
      id: "q_fut_4",
      topicId: "future_tense",
      sentencePattern: "Студе́нт [blank] (сдать) экза́мен на вы́сший балл.",
      answer: "сдаст",
      choices: ["сдаст", "будет сдавать", "сдавал", "сдадим"],
      translation: "The student will pass the exam with the highest score.",
      transliteration: "Student sdast ekzamen na vysshiy ball.",
      explanation: "Irregular Perfective future 3rd person singular is «сдаст»."
    },
    {
      id: "q_fut_5",
      topicId: "future_tense",
      sentencePattern: "Что вы [blank] (делать) за́втра ве́чером?",
      answer: "будете делать",
      choices: ["будете делать", "сделаете", "делали", "будем делать"],
      translation: "What will you be doing tomorrow evening?",
      transliteration: "Chto vy budete delat zavtra vecherom?",
      explanation: "2nd person plural compound future is «будете делать»."
    },
    {
      id: "q_fut_6",
      topicId: "future_tense",
      sentencePattern: "Она́ бы́стро [blank] (написать) отве́т на ва́ше письмо́.",
      answer: "напишет",
      choices: ["напишет", "будет писать", "писала", "напишут"],
      translation: "She will quickly write a response to your letter.",
      transliteration: "Ona bystro napishet otvet na vashe pismo.",
      explanation: "Perfective simple future 3rd person singular is «напишет»."
    },
    {
      id: "q_fut_7",
      topicId: "future_tense",
      sentencePattern: "Они́ [blank] (построить) но́вый мост к концу́ го́да.",
      answer: "построят",
      choices: ["построят", "будут строить", "строили", "построит"],
      translation: "They will build the new bridge by the end of the year.",
      transliteration: "Oni postroyat novyy most k kontsu goda.",
      explanation: "Perfective simple future 3rd person plural is «построят»."
    },
    {
      id: "q_fut_8",
      topicId: "future_tense",
      sentencePattern: "В суббо́ту мы [blank] (смотреть) но́вый фильм в кино́.",
      answer: "будем смотреть",
      choices: ["будем смотреть", "посмотрим", "смотрели", "будет смотреть"],
      translation: "On Saturday we will be watching a new movie at the cinema.",
      transliteration: "V subbotu my budem smotret novyy film v kino.",
      explanation: "Compound future 1st person plural is «будем смотреть»."
    },
    {
      id: "q_fut_9",
      topicId: "future_tense",
      sentencePattern: "Преподава́тель [blank] (объяснить) э́то пра́вило ещё раз.",
      answer: "объяснит",
      choices: ["объяснит", "будет объяснять", "объяснял", "объяснят"],
      translation: "The teacher will explain this rule once more.",
      transliteration: "Prepodavatel obyasnit eto pravilo eshchyo raz.",
      explanation: "Perfective simple future 3rd person singular is «объяснит»."
    },
    {
      id: "q_fut_10",
      topicId: "future_tense",
      sentencePattern: "Ско́ро на́ши друзья́ [blank] (приехать) к нам в го́сти.",
      answer: "приедут",
      choices: ["приедут", "будут ехать", "приезжали", "приедет"],
      translation: "Soon our friends will arrive to visit us.",
      transliteration: "Skoro nashi druzya priedut k nam v gosti.",
      explanation: "Perfective motion verb future plural is «приедут»."
    },
    {
      id: "q_fut_11",
      topicId: "future_tense",
      sentencePattern: "Я [blank] (позвонить) тебе́, как то́лько освобожу́сь.",
      answer: "позвоню",
      choices: ["позвоню", "буду звонить", "звонил", "позвонит"],
      translation: "I will call you as soon as I become free.",
      transliteration: "Ya pozvonyu tebe, kak tolko osvobozhus.",
      explanation: "Perfective future 1st person singular is «позвоню»."
    },

    // 12. ADJECTIVES DECLENSION (11 Questions)
    {
      id: "q_adj_1",
      topicId: "adjectives_declension",
      sentencePattern: "Мы живём в [blank] (большой) и краси́вом до́ме.",
      answer: "большом",
      choices: ["большом", "большой", "большого", "большим"],
      translation: "We live in a large and beautiful house.",
      transliteration: "My zhivyom v bolshom i krasivom dome.",
      explanation: "Prepositional masculine adjective takes the ending «-ом»."
    },
    {
      id: "q_adj_2",
      topicId: "adjectives_declension",
      sentencePattern: "Я купи́л кни́гу [blank] (известный) ру́сского писа́теля.",
      answer: "известного",
      choices: ["известного", "известный", "известному", "известным"],
      translation: "I bought a book by a famous Russian writer.",
      transliteration: "Ya kupil knigu izvestnogo russkogo pisatelya.",
      explanation: "Genitive masculine adjective takes the ending «-ого»."
    },
    {
      id: "q_adj_3",
      topicId: "adjectives_declension",
      sentencePattern: "Худо́жница нарисова́ла [blank] (яркая) карти́ну приpóды.",
      answer: "яркую",
      choices: ["яркую", "яркая", "яркой", "яркие"],
      translation: "The artist painted a bright picture of nature.",
      transliteration: "Khudozhnitsa narisovala yarkuyu kartinu prirody.",
      explanation: "Accusative feminine adjective takes the ending «-ую»."
    },
    {
      id: "q_adj_4",
      topicId: "adjectives_declension",
      sentencePattern: "Мы подошли́ к [blank] (высокое) зда́нию университе́та.",
      answer: "высокому",
      choices: ["высокому", "высокое", "высокого", "высоким"],
      translation: "We approached the tall university building.",
      transliteration: "My podoshli k vysokomu zdaniyu universiteta.",
      explanation: "Dative neuter adjective with preposition «к» takes «-ому»."
    },
    {
      id: "q_adj_5",
      topicId: "adjectives_declension",
      sentencePattern: "Студе́нт пи́шет конспе́кт [blank] (синяя) ру́чкой.",
      answer: "синей",
      choices: ["синей", "синяя", "синюю", "синими"],
      translation: "The student writes notes with a blue pen.",
      transliteration: "Student pishet konspekt siney ruchkoy.",
      explanation: "Instrumental feminine soft adjective takes ending «-ей»."
    },
    {
      id: "q_adj_6",
      topicId: "adjectives_declension",
      sentencePattern: "На у́лице стоя́ли [blank] (холодные) осе́нние дни.",
      answer: "холодные",
      choices: ["холодные", "холодный", "холодных", "холодными"],
      translation: "Cold autumn days were outside.",
      transliteration: "Na ulitse stoyali kholodnye osennie dni.",
      explanation: "Nominative plural adjective takes ending «-ые»."
    },
    {
      id: "q_adj_7",
      topicId: "adjectives_declension",
      sentencePattern: "Она́ наде́ла тёплый шарф [blank] (красивый) зелёного цве́та.",
      answer: "красивого",
      choices: ["красивого", "красивый", "красивому", "красивым"],
      translation: "She put on a warm scarf of a beautiful green color.",
      transliteration: "Ona nadela tyoplyy sharf krasivogo zelyonogo tsveta.",
      explanation: "Genitive masculine adjective takes ending «-ого»."
    },
    {
      id: "q_adj_8",
      topicId: "adjectives_declension",
      sentencePattern: "Мы восхища́лись [blank] (древний) собо́ром в це́нтре го́рода.",
      answer: "древним",
      choices: ["древним", "древний", "древнего", "древнем"],
      translation: "We admired the ancient cathedral in the city center.",
      transliteration: "My voskhishchalis drevnim soborom v tsentre goroda.",
      explanation: "Instrumental masculine soft adjective takes ending «-им»."
    },
    {
      id: "q_adj_9",
      topicId: "adjectives_declension",
      sentencePattern: "В библиоте́ке мно́го [blank] (интересные) книг по исто́рии.",
      answer: "интересных",
      choices: ["интересных", "интересные", "интересным", "интересными"],
      translation: "In the library there are many interesting books on history.",
      transliteration: "V biblioteke mnogo interesnykh knig po istorii.",
      explanation: "Genitive plural adjective after quantifier «много» takes «-ых»."
    },
    {
      id: "q_adj_10",
      topicId: "adjectives_declension",
      sentencePattern: "Он подари́л цветы́ свое́й [blank] (любимая) учи́тельнице.",
      answer: "любимой",
      choices: ["любимой", "любимая", "любимую", "любимых"],
      translation: "He presented flowers to his beloved teacher.",
      transliteration: "On podaril tsvety svoey lyubimoy uchitelnitse.",
      explanation: "Dative feminine adjective takes ending «-ой»."
    },
    {
      id: "q_adj_11",
      topicId: "adjectives_declension",
      sentencePattern: "Тури́сты отдыха́ли на [blank] (песчаный) морско́м пля́же.",
      answer: "песчаном",
      choices: ["песчаном", "песчаный", "песчаного", "песчаным"],
      translation: "Tourists were relaxing on the sandy sea beach.",
      transliteration: "Turisty otdykhali na peschanom morskom plyazhe.",
      explanation: "Prepositional masculine adjective takes ending «-ом»."
    },

    // 13. PRONOUNS DECLENSION (11 Questions)
    {
      id: "q_pro_1",
      topicId: "pronouns_declension",
      sentencePattern: "Пожа́луйста, позвони́ [blank] (я), когда́ освободи́шься.",
      answer: "мне",
      choices: ["мне", "меня", "мной", "обо мне"],
      translation: "Please call me when you get free.",
      transliteration: "Pozhaluysta, pozvoni mne, kogda osvobodishsya.",
      explanation: "Verb «звонить» takes Dative pronoun «мне»."
    },
    {
      id: "q_pro_2",
      topicId: "pronouns_declension",
      sentencePattern: "Мы вчера́ до́лго говори́ли о [blank] (он).",
      answer: "нём",
      choices: ["нём", "его", "ему", "им"],
      translation: "Yesterday we talked about him for a long time.",
      transliteration: "My vchera dolgo govorili o nyom.",
      explanation: "Prepositional 3rd person masculine pronoun after «о» is «нём»."
    },
    {
      id: "q_pro_3",
      topicId: "pronouns_declension",
      sentencePattern: "Учи́тель горди́тся [blank] (ты) и твои́ми успе́хами.",
      answer: "тобой",
      choices: ["тобой", "тебя", "тебе", "о тебе"],
      translation: "The teacher is proud of you and your achievements.",
      transliteration: "Uchitel gorditsya toboy i tvoimi uspekhami.",
      explanation: "Verb «гордиться» takes Instrumental pronoun «тобой»."
    },
    {
      id: "q_pro_4",
      topicId: "pronouns_declension",
      sentencePattern: "У [blank] (она) сейча́с нет с собо́й словаря́.",
      answer: "неё",
      choices: ["неё", "ей", "ею", "ней"],
      translation: "She does not have a dictionary with her right now.",
      transliteration: "U neyo seychas net s soboy slovarya.",
      explanation: "Preposition «у» with 3rd person feminine pronoun takes «неё»."
    },
    {
      id: "q_pro_5",
      topicId: "pronouns_declension",
      sentencePattern: "Помоги́ [blank] (мы) перевести́ э́тот тру́дный текст.",
      answer: "нам",
      choices: ["нам", "нас", "нами", "о нас"],
      translation: "Help us translate this difficult text.",
      transliteration: "Pomogi nam perevesti etot trudnyy tekst.",
      explanation: "Verb «помогать» takes Dative plural pronoun «нам»."
    },
    {
      id: "q_pro_6",
      topicId: "pronouns_declension",
      sentencePattern: "Я хочу́ пойти́ в кино́ вме́сте с [blank] (вы).",
      answer: "вами",
      choices: ["вами", "вас", "вам", "о вас"],
      translation: "I want to go to the cinema together with you.",
      transliteration: "Ya khochu poyti v kino vmeste s vami.",
      explanation: "Preposition «с» takes Instrumental pronoun «вами»."
    },
    {
      id: "q_pro_7",
      topicId: "pronouns_declension",
      sentencePattern: "Мы регуля́рно пи́шем пи́сьма [blank] (они).",
      answer: "им",
      choices: ["им", "их", "ними", "о них"],
      translation: "We regularly write letters to them.",
      transliteration: "My regulyarno pishem pisma im.",
      explanation: "Indirect recipient takes Dative 3rd person plural «им»."
    },
    {
      id: "q_pro_8",
      topicId: "pronouns_declension",
      sentencePattern: "В [blank] (мой) ко́мнате всегда́ идеа́льный поря́док.",
      answer: "моей",
      choices: ["моей", "моя", "мою", "моих"],
      translation: "In my room there is always ideal order.",
      transliteration: "V moey komnate vsegda idealnyy poryadok.",
      explanation: "Prepositional feminine possessive pronoun takes «моей»."
    },
    {
      id: "q_pro_9",
      topicId: "pronouns_declension",
      sentencePattern: "Мы встре́тили на́шего дру́га о́коло [blank] (его) до́ма.",
      answer: "его",
      choices: ["его", "него", "ему", "им"],
      translation: "We met our friend near his house.",
      transliteration: "My vstretili nashego druga okolo ego doma.",
      explanation: "Possessive pronoun «его» (his) is indeclinable."
    },
    {
      id: "q_pro_10",
      topicId: "pronouns_declension",
      sentencePattern: "Э́то пода́рок для [blank] (наша) люби́мой ба́бушки.",
      answer: "нашей",
      choices: ["нашей", "наша", "нашу", "нашими"],
      translation: "This is a gift for our beloved grandmother.",
      transliteration: "Eto podarok dlya nashey lyubimoy babushki.",
      explanation: "Preposition «для» requires Genitive feminine possessive «нашей»."
    },
    {
      id: "q_pro_11",
      topicId: "pronouns_declension",
      sentencePattern: "Что ты зна́ешь об [blank] (эти) но́вых пра́вилах?",
      answer: "этих",
      choices: ["этих", "эти", "этим", "этими"],
      translation: "What do you know about these new rules?",
      transliteration: "Chto ty znaesh ob etikh novykh pravilakh?",
      explanation: "Prepositional plural demonstrative pronoun takes «этих»."
    },

    // 14. NOUN PLURALS (11 Questions)
    {
      id: "q_plu_1",
      topicId: "noun_plurals",
      sentencePattern: "В на́шем го́роде стро́ят но́вые совреме́нные [blank] (дом).",
      answer: "дома",
      choices: ["дома", "домы", "домов", "домам"],
      translation: "In our city they are building new modern houses.",
      transliteration: "V nashem gorode stroyat novye sovremennye doma.",
      explanation: "Irregular masculine stressed plural ending is «дома́»."
    },
    {
      id: "q_plu_2",
      topicId: "noun_plurals",
      sentencePattern: "Мои́ лу́чшие [blank] (друг) живу́т в друго́м го́роде.",
      answer: "друзья",
      choices: ["друзья", "други", "друзей", "друзьям"],
      translation: "My best friends live in another city.",
      transliteration: "Moi luchshie druzya zhivut v drugom gorode.",
      explanation: "Irregular soft plural of «друг» is «друзья́»."
    },
    {
      id: "q_plu_3",
      topicId: "noun_plurals",
      sentencePattern: "Ма́ленькие [blank] (ребёнок) ве́село игра́ют на площа́дке.",
      answer: "дети",
      choices: ["дети", "ребёнки", "детей", "детям"],
      translation: "Small children are cheerfully playing on the playground.",
      transliteration: "Malenkie deti veselo igrayut na ploshchadke.",
      explanation: "Suppletive plural of «ребёнок» is «де́ти»."
    },
    {
      id: "q_plu_4",
      topicId: "noun_plurals",
      sentencePattern: "В исто́рии страны́ бы́ли вели́кие [blank] (город).",
      answer: "города",
      choices: ["города", "городы", "городов", "городам"],
      translation: "In the history of the country there were great cities.",
      transliteration: "V istorii strany byli velikie goroda.",
      explanation: "Stressed masculine plural ending is «города́»."
    },
    {
      id: "q_plu_5",
      topicId: "noun_plurals",
      sentencePattern: "Мои́ ста́ршие [blank] (брат) уча́тся в институ́те.",
      answer: "братья",
      choices: ["братья", "браты", "братьев", "братьям"],
      translation: "My older brothers study at the institute.",
      transliteration: "Moi starshie bratya uchyatsya v institute.",
      explanation: "Irregular soft plural of «брат» is «бра́тья»."
    },
    {
      id: "q_plu_6",
      topicId: "noun_plurals",
      sentencePattern: "На полках стоя́т интере́сные [blank] (книга).",
      answer: "книги",
      choices: ["книги", "книгы", "книг", "книгам"],
      translation: "Interesting books stand on the shelves.",
      transliteration: "Na polkakh stoyat interesnye knigi.",
      explanation: "After velar 'г', 7-letter spelling rule requires -и: «кни́ги»."
    },
    {
      id: "q_plu_7",
      topicId: "noun_plurals",
      sentencePattern: "В ко́мнате стоя́т удо́бные деревя́нные [blank] (стул).",
      answer: "стулья",
      choices: ["стулья", "стулы", "стульев", "стульям"],
      translation: "In the room stand comfortable wooden chairs.",
      transliteration: "V komnate stoyat udobnye derevyannye stulya.",
      explanation: "Irregular soft plural of «стул» is «сту́лья»."
    },
    {
      id: "q_plu_8",
      topicId: "noun_plurals",
      sentencePattern: "На пло́щади собрали́сь ты́сячи [blank] (человек).",
      answer: "людей",
      choices: ["людей", "человеков", "люди", "человекам"],
      translation: "Thousands of people gathered on the square.",
      transliteration: "Na ploshchadi sobralis tysyachi lyudey.",
      explanation: "Genitive plural suppletive form of «человек» is «люде́й»."
    },
    {
      id: "q_plu_9",
      topicId: "noun_plurals",
      sentencePattern: "Бы́стро пролете́ли тёплые ле́тние [blank] (день).",
      answer: "дни",
      choices: ["дни", "деня", "дней", "дням"],
      translation: "Warm summer days flew by quickly.",
      transliteration: "Bystro proleteli tyoplye letnie dni.",
      explanation: "Fleeting vowel 'е' drops out in plural: «дни»."
    },
    {
      id: "q_plu_10",
      topicId: "noun_plurals",
      sentencePattern: "Ско́ро на перро́н прибу́дут ско́рые [blank] (поезд).",
      answer: "поезда",
      choices: ["поезда", "поезды", "поездов", "поездам"],
      translation: "Soon fast trains will arrive on the platform.",
      transliteration: "Skoro na perron pribudut skorye poezda.",
      explanation: "Stressed masculine plural ending is «поезда́»."
    },
    {
      id: "q_plu_11",
      topicId: "noun_plurals",
      sentencePattern: "На де́реве появи́лись пе́рвые зелёные [blank] (лист).",
      answer: "листья",
      choices: ["листья", "листы", "листьев", "листьям"],
      translation: "First green leaves appeared on the tree.",
      transliteration: "Na dereve poyavilis pervye zelyonye listya.",
      explanation: "Botanical leaves plural of «лист» is «ли́стья»."
    },

    // 15. NUMERALS & AGREEMENT (11 Questions)
    {
      id: "q_num_1",
      topicId: "numerals_agreement",
      sentencePattern: "В па́рке расту́т два краси́вых [blank] (дерево).",
      answer: "дерева",
      choices: ["дерева", "деревьев", "дерево", "деревом"],
      translation: "In the park two beautiful trees are growing.",
      transliteration: "V parke rastut dva krasivykh dereva.",
      explanation: "After numeral 2 neuter noun takes the Genitive singular: «дерева»."
    },
    {
      id: "q_num_2",
      topicId: "numerals_agreement",
      sentencePattern: "Мы жда́ли по́езд ро́вно пять [blank] (минута).",
      answer: "минут",
      choices: ["минут", "минуты", "минутах", "минуту"],
      translation: "We waited for the train for exactly five minutes.",
      transliteration: "My zhdali poezd rovno pyat minut.",
      explanation: "Numerals from 5 upwards govern the Genitive plural: «минут»."
    },
    {
      id: "q_num_3",
      topicId: "numerals_agreement",
      sentencePattern: "В аудито́рии сиде́ли два́дцать один [blank] (студент).",
      answer: "студент",
      choices: ["студент", "студента", "студентов", "студенты"],
      translation: "Twenty-one students were sitting in the classroom.",
      transliteration: "V auditorii sideli dvadtsat odin student.",
      explanation: "Compound numbers ending in 1 take the Nominative singular: «студент»."
    },
    {
      id: "q_num_4",
      topicId: "numerals_agreement",
      sentencePattern: "На столе́ лежа́т три но́вые [blank] (книга).",
      answer: "книги",
      choices: ["книги", "книг", "книгу", "книгами"],
      translation: "Three new books are lying on the table.",
      transliteration: "Na stole lezhat tri novye knigi.",
      explanation: "Numeral 3 with a feminine noun requires the Genitive singular: «книги»."
    },
    {
      id: "q_num_5",
      topicId: "numerals_agreement",
      sentencePattern: "В на́шем но́вом до́ме де́сять [blank] (этаж).",
      answer: "этажей",
      choices: ["этажей", "этажа", "этажи", "этажами"],
      translation: "In our new building there are ten floors.",
      transliteration: "V nashem novom dome desyat etazhey.",
      explanation: "Numeral 10 governs the Genitive plural: «этажей»."
    },
    {
      id: "q_num_6",
      topicId: "numerals_agreement",
      sentencePattern: "У моего́ дру́га подраста́ют дво́е [blank] (сын).",
      answer: "сыновей",
      choices: ["сыновей", "сыновья", "сына", "сыновьям"],
      translation: "My friend has two sons growing up.",
      transliteration: "U moego druga podrastayut dvoe synovey.",
      explanation: "Collective numeral «двое» takes the Genitive plural: «сыновей»."
    },
    {
      id: "q_num_7",
      topicId: "numerals_agreement",
      sentencePattern: "Биле́т на самолёт сто́ит четы́ре [blank] (тысяча) рублей.",
      answer: "тысячи",
      choices: ["тысячи", "тысяч", "тысяча", "тысячами"],
      translation: "The plane ticket costs four thousand rubles.",
      transliteration: "Bilet na samolyot stoit chetyre tysyachi rubley.",
      explanation: "Numeral 4 requires the Genitive singular: «тысячи»."
    },
    {
      id: "q_num_8",
      topicId: "numerals_agreement",
      sentencePattern: "В музе́е мы провели́ ро́вно два [blank] (час).",
      answer: "часа",
      choices: ["часа", "часов", "час", "часах"],
      translation: "In the museum we spent exactly two hours.",
      transliteration: "V muzee my proveli rovno dva chasa.",
      explanation: "Numeral 2 requires the Genitive singular: «часа»."
    },
    {
      id: "q_num_9",
      topicId: "numerals_agreement",
      sentencePattern: "В ко́мнате бы́ло шестна́дцать [blank] (человек).",
      answer: "человек",
      choices: ["человек", "человека", "людей", "люди"],
      translation: "There were sixteen people in the room.",
      transliteration: "V komnate bylo shestnadtsat chelovek.",
      explanation: "With numerals 5+, «человек» is the counting plural form: «шестнадцать человек»."
    },
    {
      id: "q_num_10",
      topicId: "numerals_agreement",
      sentencePattern: "Мы купи́ли три́дцать две [blank] (тетрадь).",
      answer: "тетради",
      choices: ["тетради", "тетрадей", "тетрадь", "тетрадями"],
      translation: "We bought thirty-two notebooks.",
      transliteration: "My kupili tridtsat dve tetradi.",
      explanation: "Compound number ending in 2 takes the Genitive singular: «тетради»."
    },
    {
      id: "q_num_11",
      topicId: "numerals_agreement",
      sentencePattern: "До нача́ла спекта́кля оста́лось со́рок [blank] (секунда).",
      answer: "секунд",
      choices: ["секунд", "секунды", "секунда", "секундам"],
      translation: "Forty seconds remained until the start of the performance.",
      transliteration: "Do nachala spektaklya ostalos sorok sekund.",
      explanation: "Numeral 40 takes the Genitive plural: «секунд»."
    },

    // 16. PREFIXED VERBS OF MOTION (11 Questions)
    {
      id: "q_pmv_1",
      topicId: "prefixed_motion_verbs",
      sentencePattern: "Студе́нт осторо́жно [blank] (войти) в аудито́рию.",
      answer: "вошёл",
      choices: ["вошёл", "вышел", "дошёл", "перешёл"],
      translation: "The student carefully entered the classroom.",
      transliteration: "Student ostorozhno voshyol v auditoriyu.",
      explanation: "Entering an interior room with preposition «в» requires prefix во-: «вошёл»."
    },
    {
      id: "q_pmv_2",
      topicId: "prefixed_motion_verbs",
      sentencePattern: "По́езд то́чно по расписа́нию [blank] (приехать) на вокза́л.",
      answer: "приехал",
      choices: ["приехал", "уехал", "отъехал", "съехал"],
      translation: "The train arrived at the station right on schedule.",
      transliteration: "Poezd tochno po raspisaniyu priekhal na vokzal.",
      explanation: "Arrival at destination uses prefix при-: «приехал»."
    },
    {
      id: "q_pmv_3",
      topicId: "prefixed_motion_verbs",
      sentencePattern: "У́тром па́па ра́но [blank] (уйти) из до́ма на рабо́ту.",
      answer: "ушёл",
      choices: ["ушёл", "вошёл", "зашёл", "подошёл"],
      translation: "In the morning dad left home early for work.",
      transliteration: "Utrom papa rano ushyol iz doma na rabotu.",
      explanation: "Departure from a place with «из» takes prefix у-: «ушёл»."
    },
    {
      id: "q_pmv_4",
      topicId: "prefixed_motion_verbs",
      sentencePattern: "Пешехо́ды бы́стро [blank] (перейти) у́лицу по зе́бре.",
      answer: "перешли",
      choices: ["перешли", "вошли", "подошли", "отошли"],
      translation: "Pedestrians quickly crossed the street at the crosswalk.",
      transliteration: "Peshehody bystro pereshli ulitsu po zebre.",
      explanation: "Crossing from one side to the other uses prefix пере-: «перешли»."
    },
    {
      id: "q_pmv_5",
      topicId: "prefixed_motion_verbs",
      sentencePattern: "Маши́на аккура́тно [blank] (выехать) из гаража́ на у́лицу.",
      answer: "выехала",
      choices: ["выехала", "въехала", "доехала", "заехала"],
      translation: "The car carefully drove out of the garage into the street.",
      transliteration: "Mashina akkuratno vyekhala iz garazha na ulitsu.",
      explanation: "Exit from inside with «из» requires prefix вы-: «выехала»."
    },
    {
      id: "q_pmv_6",
      topicId: "prefixed_motion_verbs",
      sentencePattern: "Ма́льчик сме́ло [blank] (подойти) к незнако́мой соба́ке.",
      answer: "подошёл",
      choices: ["подошёл", "отошёл", "перешёл", "вошёл"],
      translation: "The boy boldly approached the unfamiliar dog.",
      transliteration: "Malchik smelo podoshyol k neznakomoy sobake.",
      explanation: "Approaching near (paired with preposition «к») uses prefix под-: «подошёл»."
    },
    {
      id: "q_pmv_7",
      topicId: "prefixed_motion_verbs",
      sentencePattern: "Тури́сты наконе́ц [blank] (дойти) до верху́шки горы́.",
      answer: "дошли",
      choices: ["дошли", "ушли", "вышли", "отошли"],
      translation: "The tourists finally reached the mountain summit.",
      transliteration: "Turisty nakonets doshli do verkhushki gory.",
      explanation: "Reaching a final destination boundary (with «до») uses prefix до-: «дошли»."
    },
    {
      id: "q_pmv_8",
      topicId: "prefixed_motion_verbs",
      sentencePattern: "По доро́ге домо́й я [blank] (зайти) в апте́ку за лека́рством.",
      answer: "зашёл",
      choices: ["зашёл", "вышел", "перешёл", "отошёл"],
      translation: "On the way home I dropped by the pharmacy for medicine.",
      transliteration: "Po doroge domoy ya zashyol v apteku za lekarstvom.",
      explanation: "A short incidental stop on the way uses prefix за-: «зашёл»."
    },
    {
      id: "q_pmv_9",
      topicId: "prefixed_motion_verbs",
      sentencePattern: "По́езд ме́дленно [blank] (отойти) от перро́на.",
      answer: "отошёл",
      choices: ["отошёл", "подошёл", "вошёл", "перешёл"],
      translation: "The train slowly moved away from the platform.",
      transliteration: "Poezd medlenno otoshyol ot perrona.",
      explanation: "Moving away (paired with preposition «от») uses prefix от-: «отошёл»."
    },
    {
      id: "q_pmv_10",
      topicId: "prefixed_motion_verbs",
      sentencePattern: "Самолёт бла́гополу́чно [blank] (долететь) до столи́цы.",
      answer: "долетел",
      choices: ["долетел", "улетел", "вылетел", "перелетел"],
      translation: "The plane safely flew all the way to the capital.",
      transliteration: "Samolyot blagopoluchno doletel do stolitsy.",
      explanation: "Reaching destination by air with «до» uses prefix до-: «долетел»."
    },
    {
      id: "q_pmv_11",
      topicId: "prefixed_motion_verbs",
      sentencePattern: "Спортсме́н пе́рвым [blank] (добежать) до фи́нишной ли́нии.",
      answer: "добежал",
      choices: ["добежал", "убежал", "выбежал", "перебежал"],
      translation: "The athlete was the first to run to the finish line.",
      transliteration: "Sportsmen pervym dobezhal do finishnoy linii.",
      explanation: "Reaching finish line by running uses prefix до-: «добежал»."
    },

    // 17. IMPERATIVES (11 Questions)
    {
      id: "q_imp_1",
      topicId: "imperatives",
      sentencePattern: "Пожа́луйста, [blank] (открыть) окно́, здесь о́чень ду́шно.",
      answer: "откройте",
      choices: ["откройте", "открываете", "открыл", "открыли"],
      translation: "Please open the window, it is very stuffy in here.",
      transliteration: "Pozhaluysta, otkroyte okno, zdes ochen dushno.",
      explanation: "Polite formal request in imperative ending in -те: «откройте»."
    },
    {
      id: "q_imp_2",
      topicId: "imperatives",
      sentencePattern: "Никогда́ не [blank] (опаздывать) на ва́жные встре́чи.",
      answer: "опаздывай",
      choices: ["опаздывай", "опоздай", "опаздывал", "опоздал"],
      translation: "Never be late for important meetings.",
      transliteration: "Nikogda ne opazdyvay na vazhnye vstrechi.",
      explanation: "Prohibitions with «не» require the Imperfective imperative: «не опаздывай»."
    },
    {
      id: "q_imp_3",
      topicId: "imperatives",
      sentencePattern: "Друг, [blank] (рассказать) мне всю пра́вду о слу́чившемся.",
      answer: "расскажи",
      choices: ["расскажи", "рассказывай", "рассказал", "расскажешь"],
      translation: "Friend, tell me the whole truth about what happened.",
      transliteration: "Drug, rasskazhi mne vsyu pravdu o sluchivshemsya.",
      explanation: "Informal single action imperative ending in -и: «расскажи»."
    },
    {
      id: "q_imp_4",
      topicId: "imperatives",
      sentencePattern: "Де́ти, [blank] (слушать) учи́теля внима́тельно!",
      answer: "слушайте",
      choices: ["слушайте", "слушай", "слушали", "послушали"],
      translation: "Children, listen to the teacher attentively!",
      transliteration: "Deti, slushayte uchitelya vnimatelno!",
      explanation: "Plural imperative for vowel-stem verb: «слушайте»."
    },
    {
      id: "q_imp_5",
      topicId: "imperatives",
      sentencePattern: "Не [blank] (забывать) брать с собо́й зо́нтик в дождли́вый день.",
      answer: "забывай",
      choices: ["забывай", "забудь", "забывал", "забудешь"],
      translation: "Don't forget to take an umbrella on a rainy day.",
      transliteration: "Ne zabyvay brat s soboy zontik v dozhdlivyy den.",
      explanation: "General reminder prohibition takes Imperfective imperative: «не забывай»."
    },
    {
      id: "q_imp_6",
      topicId: "imperatives",
      sentencePattern: "Пожа́луйста, [blank] (повторить) свой вопро́с ещё раз.",
      answer: "повторите",
      choices: ["повторите", "повторяете", "повторили", "повторишь"],
      translation: "Please repeat your question one more time.",
      transliteration: "Pozhaluysta, povtorite svoy vopros eshchyo raz.",
      explanation: "Polite formal imperative ending in -ите: «повторите»."
    },
    {
      id: "q_imp_7",
      topicId: "imperatives",
      sentencePattern: "Бу́дь добр, [blank] (помочь) мне с э́тим тяжёлым чемода́ном.",
      answer: "помоги",
      choices: ["помоги", "помогай", "помог", "поможешь"],
      translation: "Be kind, help me with this heavy suitcase.",
      transliteration: "Bud dobr, pomogi mne s etim tyazhyolym chemodanom.",
      explanation: "Informal request in single action: «помоги»."
    },
    {
      id: "q_imp_8",
      topicId: "imperatives",
      sentencePattern: "Смотри́, не [blank] (упасть) на ско́льзком льду!",
      answer: "упади",
      choices: ["упади", "падай", "упал", "упадёшь"],
      translation: "Watch out that you don't fall on the slippery ice!",
      transliteration: "Smotri, ne upadi na skolzkom ldu!",
      explanation: "Warning against accidental result («смотри не...») takes Perfective: «упади»."
    },
    {
      id: "q_imp_9",
      topicId: "imperatives",
      sentencePattern: "Скоре́е [blank] (встать), по́езд отправля́ется че́рез де́сять мину́т!",
      answer: "вставай",
      choices: ["вставай", "встань", "встал", "встаёшь"],
      translation: "Get up quickly, the train departs in ten minutes!",
      transliteration: "Skoree vstavay, poezd otpravlyaetsya cherez desyat minut!",
      explanation: "Urgent dynamic call to action uses imperative «вставай»."
    },
    {
      id: "q_imp_10",
      topicId: "imperatives",
      sentencePattern: "Пожа́луйста, [blank] (познакомиться) с на́шим но́вым колле́гой.",
      answer: "познакомьтесь",
      choices: ["познакомьтесь", "познакомились", "знакомьтесь", "познакомитесь"],
      translation: "Please get acquainted with our new colleague.",
      transliteration: "Pozhaluysta, poznakomtes s nashim novym kollegoy.",
      explanation: "Reflexive imperative ending in -ьтесь: «познакомьтесь»."
    },
    {
      id: "q_imp_11",
      topicId: "imperatives",
      sentencePattern: "[blank] (написать) мне письмо́, как то́лько прие́дешь на ме́сто.",
      answer: "напиши",
      choices: ["напиши", "пиши", "написал", "напишешь"],
      translation: "Write me a letter as soon as you arrive at the place.",
      transliteration: "Napishi mne pismo, kak tolko priedesh na mesto.",
      explanation: "Specific future single instruction: «напиши»."
    },

    // 18. REFLEXIVE VERBS (11 Questions)
    {
      id: "q_refl_1",
      topicId: "reflexive_verbs",
      sentencePattern: "Мой мла́дший брат [blank] (учиться) в тре́тьем кла́ссе.",
      answer: "учится",
      choices: ["учится", "учит", "учусь", "учатся"],
      translation: "My younger brother studies in the third grade.",
      transliteration: "Moy mladshiy brat uchitsya v tretyem klasse.",
      explanation: "3rd person singular after consonant ending takes -ся: «учится»."
    },
    {
      id: "q_refl_2",
      topicId: "reflexive_verbs",
      sentencePattern: "Ка́ждое у́тро я ра́но [blank] (просыпаться) и де́лаю заря́дку.",
      answer: "просыпаюсь",
      choices: ["просыпаюсь", "просыпается", "просыпаемся", "просыпаются"],
      translation: "Every morning I wake up early and do exercises.",
      transliteration: "Kazhdoe utro ya rano prosypayus i delayu zaryadku.",
      explanation: "1st person singular vowel ending takes -сь: «просыпаюсь»."
    },
    {
      id: "q_refl_3",
      topicId: "reflexive_verbs",
      sentencePattern: "Мы с колле́гами ча́сто [blank] (встречаться) в ка́фе по суббо́там.",
      answer: "встречаемся",
      choices: ["встречаемся", "встречаетесь", "встречается", "встречаются"],
      translation: "My colleagues and I often meet in a cafe on Saturdays.",
      transliteration: "My s kollegami chasto vstrechaemsya v kafe po subbotam.",
      explanation: "1st person plural reciprocal verb: «встречаемся»."
    },
    {
      id: "q_refl_4",
      topicId: "reflexive_verbs",
      sentencePattern: "Ребёнок о́чень [blank] (бояться) темноты́ и грозы́.",
      answer: "боится",
      choices: ["боится", "боюсь", "боятся", "боимся"],
      translation: "The child is very afraid of the dark and thunderstorm.",
      transliteration: "Rebyonok ochen boitsya temnoty i grozy.",
      explanation: "3rd person singular emotional state verb: «боится»."
    },
    {
      id: "q_refl_5",
      topicId: "reflexive_verbs",
      sentencePattern: "Она́ бы́стро [blank] (одеться) и вы́бежала на у́лицу.",
      answer: "оделась",
      choices: ["оделась", "оделся", "оделись", "оделось"],
      translation: "She quickly got dressed and ran out into the street.",
      transliteration: "Ona bystro odelas i vybezhala na ulitsu.",
      explanation: "Feminine past tense vowel ending takes -сь: «оделась»."
    },
    {
      id: "q_refl_6",
      topicId: "reflexive_verbs",
      sentencePattern: "Студе́нты и́скренне [blank] (радоваться) успе́шной сда́че экза́мена.",
      answer: "радуются",
      choices: ["радуются", "радуется", "радуемся", "радуюсь"],
      translation: "The students genuinely rejoice at successfully passing the exam.",
      transliteration: "Studenty iskrenne raduyutsya uspeshnoy sdache ekzamena.",
      explanation: "3rd person plural present tense: «радуются»."
    },
    {
      id: "q_refl_7",
      topicId: "reflexive_verbs",
      sentencePattern: "Этот совреме́нный музе́й [blank] (открываться) в де́сять часо́в утра́.",
      answer: "открывается",
      choices: ["открывается", "открываюсь", "открываются", "открываемся"],
      translation: "This modern museum opens at ten in the morning.",
      transliteration: "Etot sovremennyy muzey otkryvaetsya v desyat chasov utra.",
      explanation: "Passive/middle voice 3rd person singular: «открывается»."
    },
    {
      id: "q_refl_8",
      topicId: "reflexive_verbs",
      sentencePattern: "Вчера́ ве́чером мы до́лго [blank] (прощаться) на вокза́ле.",
      answer: "прощались",
      choices: ["прощались", "прощался", "прощалась", "прощалось"],
      translation: "Yesterday evening we said goodbye for a long time at the station.",
      transliteration: "Vchera vecherom my dolgo proshchalis na vokzale.",
      explanation: "Plural past tense reciprocal verb ending in vowel + сь: «прощались»."
    },
    {
      id: "q_refl_9",
      topicId: "reflexive_verbs",
      sentencePattern: "Ты всегда́ так ве́село [blank] (смеяться) над шу́тками!",
      answer: "смеёшься",
      choices: ["смеёшься", "смеётся", "смеюсь", "смеются"],
      translation: "You always laugh so cheerfully at jokes!",
      transliteration: "Ty vsegda tak veselo smeyoshsya nad shutkami!",
      explanation: "2nd person singular verb ending in -шься: «смеёшься»."
    },
    {
      id: "q_refl_10",
      topicId: "reflexive_verbs",
      sentencePattern: "Мой де́душка [blank] (родиться) в ма́ленькой дере́вне на се́вере.",
      answer: "родился",
      choices: ["родился", "родилась", "родились", "родилось"],
      translation: "My grandfather was born in a small village in the north.",
      transliteration: "Moy dedushka rodilsya v malenkoy derevne na severe.",
      explanation: "Masculine past tense ending in consonant takes -ся: «родился»."
    },
    {
      id: "q_refl_11",
      topicId: "reflexive_verbs",
      sentencePattern: "Как [blank] (называться) э́та краси́вая у́лица?",
      answer: "называется",
      choices: ["называется", "называюсь", "называются", "называем"],
      translation: "What is this beautiful street called?",
      transliteration: "Kak nazyvaetsya eta krasivaya ulitsa?",
      explanation: "Inanimate 3rd person singular: «называется»."
    },

    // 19. SUBJUNCTIVE & CONDITIONAL MOOD (11 Questions)
    {
      id: "q_subj_1",
      topicId: "subjunctive_conditional",
      sentencePattern: "Е́сли бы у меня́ бы́ло вре́мя, я [blank] (помочь) тебе́ с уро́ками.",
      answer: "помог бы",
      choices: ["помог бы", "помогу", "помогал", "буду помогать"],
      translation: "If I had time, I would help you with your homework.",
      transliteration: "Esli by u menya bylo vremya, ya pomog by tebe s urokami.",
      explanation: "Counterfactual conditional requires past tense + particle бы: «помог бы»."
    },
    {
      id: "q_subj_2",
      topicId: "subjunctive_conditional",
      sentencePattern: "Ма́ма хо́чет, что́бы сын [blank] (поступить) в университе́т.",
      answer: "поступил",
      choices: ["поступил", "поступит", "поступать", "поступает"],
      translation: "Mom wants her son to enter the university.",
      transliteration: "Mama khochet, chtoby syn postupil v universitet.",
      explanation: "Clause with «чтобы» expressing a wish for another subject requires past tense: «поступил»."
    },
    {
      id: "q_subj_3",
      topicId: "subjunctive_conditional",
      sentencePattern: "Я пришёл сюда́, что́бы [blank] (поговорить) с ва́ми.",
      answer: "поговорить",
      choices: ["поговорить", "поговорил", "поговорю", "поговорили"],
      translation: "I came here in order to speak with you.",
      transliteration: "Ya prishyol syuda, chtoby pogovorit s vami.",
      explanation: "Purpose clause sharing the same subject takes «чтобы + infinitive»: «поговорить»."
    },
    {
      id: "q_subj_4",
      topicId: "subjunctive_conditional",
      sentencePattern: "Е́сли бы вчера́ не бы́ло дождя́, мы [blank] (поехать) за́ город.",
      answer: "поехали бы",
      choices: ["поехали бы", "поедем", "поезжали", "будем ехать"],
      translation: "If it had not rained yesterday, we would have gone out of town.",
      transliteration: "Esli by vchera ne bylo dozhdya, my poekhali by za gorod.",
      explanation: "Plural past conditional with particle бы: «поехали бы»."
    },
    {
      id: "q_subj_5",
      topicId: "subjunctive_conditional",
      sentencePattern: "Я [blank] (хотеть) вы́пить ча́шку горя́чего ко́фе.",
      answer: "хотел бы",
      choices: ["хотел бы", "хочу", "хотел", "буду хотеть"],
      translation: "I would like to drink a cup of hot coffee.",
      transliteration: "Ya khotel by vypit chashku goryachego kofe.",
      explanation: "Polite softened wish uses past tense + бы: «хотел бы»."
    },
    {
      id: "q_subj_6",
      topicId: "subjunctive_conditional",
      sentencePattern: "Учи́тель тре́бует, что́бы ученики́ [blank] (сдать) тетра́ди во́время.",
      answer: "сдали",
      choices: ["сдали", "сдадут", "сдавать", "сдают"],
      translation: "The teacher demands that students hand in notebooks on time.",
      transliteration: "Uchitel trebuet, chtoby ucheniki sdali tetradi vovremya.",
      explanation: "Subjunctive clause with «чтобы» takes past tense: «сдали»."
    },
    {
      id: "q_subj_7",
      topicId: "subjunctive_conditional",
      sentencePattern: "Е́сли бы ты сказа́л ра́ньше, я [blank] (купить) два биле́та.",
      answer: "купил бы",
      choices: ["купил бы", "куплю", "покупал", "буду покупать"],
      translation: "If you had told me earlier, I would have bought two tickets.",
      transliteration: "Esli by ty skazal ranshe, ya kupil by dva bileta.",
      explanation: "Past hypothetical result: «купил бы»."
    },
    {
      id: "q_subj_8",
      topicId: "subjunctive_conditional",
      sentencePattern: "Врачи́ сове́туют, что́бы пацие́нт бо́льше [blank] (отдыхать) на све́жем во́здухе.",
      answer: "отдыхал",
      choices: ["отдыхал", "отдыхает", "отдыхать", "отдохнёт"],
      translation: "Doctors advise that the patient rest more in fresh air.",
      transliteration: "Vrachi sovetuyut, chtoby patsient bolshe otdykhal na svezhem vozdukhe.",
      explanation: "Past tense after «чтобы»: «отдыхал»."
    },
    {
      id: "q_subj_9",
      topicId: "subjunctive_conditional",
      sentencePattern: "Мы поспеши́ли на авто́бус, что́бы не [blank] (опоздать) в аэропо́рт.",
      answer: "опоздать",
      choices: ["опоздать", "опоздали", "опаздывать", "опоздает"],
      translation: "We hurried to the bus in order not to be late for the airport.",
      transliteration: "My pospeshili na avtobus, chtoby ne opozdat v aeroport.",
      explanation: "Same-subject purpose clause: «чтобы не опоздать»."
    },
    {
      id: "q_subj_10",
      topicId: "subjunctive_conditional",
      sentencePattern: "Без твое́й по́мощи мы ни за что не [blank] (решить) э́ту зада́чу.",
      answer: "решили бы",
      choices: ["решили бы", "решим", "решали", "будем решать"],
      translation: "Without your help we would never have solved this problem.",
      transliteration: "Bez tvoey pomoshchi my ni za chto ne reshili by etu zadachu.",
      explanation: "Conditional without explicit 'если': «решили бы»."
    },
    {
      id: "q_subj_11",
      topicId: "subjunctive_conditional",
      sentencePattern: "Она́ мечта́ет о том, что́бы мир [blank] (стать) добре́е.",
      answer: "стал",
      choices: ["стал", "станет", "становиться", "становился"],
      translation: "She dreams that the world would become kinder.",
      transliteration: "Ona mechtaet o tom, chtoby mir stal dobree.",
      explanation: "Clause of desire with «чтобы + past»: «стал»."
    },

    // 20. IMPERSONAL SENTENCES (11 Questions)
    {
      id: "q_impn_1",
      topicId: "impersonal_sentences",
      sentencePattern: "Сего́дня ве́чером мне о́чень [blank] (холодно) на у́лице.",
      answer: "холодно",
      choices: ["холодно", "холодный", "холодная", "холодом"],
      translation: "This evening I feel very cold outside.",
      transliteration: "Segodnya vecherom mne ochen kholodno na ulitse.",
      explanation: "Impersonal physical sensation with Dative experiencer: «мне холодно»."
    },
    {
      id: "q_impn_2",
      topicId: "impersonal_sentences",
      sentencePattern: "Студе́нтам [blank] (нужно) внима́тельно прочита́ть э́ту главу́.",
      answer: "нужно",
      choices: ["нужно", "нужный", "нужная", "нужные"],
      translation: "Students need to attentively read this chapter.",
      transliteration: "Studentam nuzhno vnimatelno prochitat etu glavu.",
      explanation: "Impersonal modal category of necessity: «нужно»."
    },
    {
      id: "q_impn_3",
      topicId: "impersonal_sentences",
      sentencePattern: "В э́том чита́льном за́ле [blank] (нельзя) громко разговаривать.",
      answer: "нельзя",
      choices: ["нельзя", "можно", "нужно", "надо"],
      translation: "In this reading hall one is not allowed to speak loudly.",
      transliteration: "V etom chitalnom zale nelzya gromko razgovarivat.",
      explanation: "Strict prohibition word: «нельзя»."
    },
    {
      id: "q_impn_4",
      topicId: "impersonal_sentences",
      sentencePattern: "У меня́ сего́дня соверше́нно нет [blank] (время).",
      answer: "времени",
      choices: ["времени", "время", "временем", "времена"],
      translation: "I have absolutely no time today.",
      transliteration: "U menya segodnya sovershenno net vremeni.",
      explanation: "Negative existential particle «нет» governs the Genitive: «нет времени»."
    },
    {
      id: "q_impn_5",
      topicId: "impersonal_sentences",
      sentencePattern: "Вчера́ на у́лице [blank] (не было) со́лнца, весь день шёл снег.",
      answer: "не было",
      choices: ["не было", "не был", "не была", "не были"],
      translation: "Yesterday there was no sun outside, it snowed all day.",
      transliteration: "Vchera na ulitse ne bylo solntsa, ves den shyol sneg.",
      explanation: "Past tense negative existential verb is always neuter singular: «не было»."
    },
    {
      id: "q_impn_6",
      topicId: "impersonal_sentences",
      sentencePattern: "Моему́ дру́гу [blank] (приходиться) ка́ждый день ра́но встава́ть.",
      answer: "приходится",
      choices: ["приходится", "приходят", "прихожу", "приходим"],
      translation: "My friend has to get up early every day.",
      transliteration: "Moemu drugu prikhoditsya kazhdyy den rano vstavat.",
      explanation: "Impersonal external constraint with Dative: «приходится»."
    },
    {
      id: "q_impn_7",
      topicId: "impersonal_sentences",
      sentencePattern: "В э́том па́рке [blank] (можно) ката́ться на велосипе́дах.",
      answer: "можно",
      choices: ["можно", "нельзя", "нужен", "надо"],
      translation: "In this park one is allowed to ride bicycles.",
      transliteration: "V etom parke mozhno katatsya na velosipedakh.",
      explanation: "Permission modal adverb: «можно»."
    },
    {
      id: "q_impn_8",
      topicId: "impersonal_sentences",
      sentencePattern: "Ма́ленькой сестре́ ста́ло [blank] (скучно) во вре́мя спекта́кля.",
      answer: "скучно",
      choices: ["скучно", "скучный", "скучная", "скучные"],
      translation: "The little sister started feeling bored during the show.",
      transliteration: "Malenkoy sestre stalo skuchno vo vremya spektaklya.",
      explanation: "Impersonal psychological state adverb: «скучно»."
    },
    {
      id: "q_impn_9",
      topicId: "impersonal_sentences",
      sentencePattern: "Зимо́й на се́вере [blank] (рассветать) о́чень по́здно.",
      answer: "рассветает",
      choices: ["рассветает", "рассветают", "рассветал", "рассветёт"],
      translation: "In winter in the north dawn breaks very late.",
      transliteration: "Zimoy na severe rassvetaet ochen pozdno.",
      explanation: "Natural impersonal phenomena 3rd person singular: «рассветает»."
    },
    {
      id: "q_impn_10",
      topicId: "impersonal_sentences",
      sentencePattern: "Пассажи́рам [blank] (следовать) сохрани́ть поса́дочные тало́ны.",
      answer: "следует",
      choices: ["следует", "следуют", "следовал", "следуем"],
      translation: "Passengers ought to retain their boarding passes.",
      transliteration: "Passazhiram sleduet sokhranit posadochnye talony.",
      explanation: "Formal obligation with Dative experiencer: «следует»."
    },
    {
      id: "q_impn_11",
      topicId: "impersonal_sentences",
      sentencePattern: "За́втра у нас [blank] (не будет) свобо́дных уро́ков.",
      answer: "не будет",
      choices: ["не будет", "не будут", "не был", "не есть"],
      translation: "Tomorrow we will have no free periods.",
      transliteration: "Zavtra u nas ne budet svobodnykh urokov.",
      explanation: "Future negative existential takes singular «не будет»."
    },

    // 21. COMPARATIVES & SUPERLATIVES (11 Questions)
    {
      id: "q_comp_1",
      topicId: "comparatives_superlatives",
      sentencePattern: "По́езд е́дет бы́стро, но самолёт лети́т ещё [blank] (быстро).",
      answer: "быстрее",
      choices: ["быстрее", "быстрый", "более быстро", "быстрейший"],
      translation: "The train goes fast, but the plane flies even faster.",
      transliteration: "Poezd edet bystro, no samolyot letit eshchyo bystree.",
      explanation: "Simple comparative adverb ending in -ее: «быстрее»."
    },
    {
      id: "q_comp_2",
      topicId: "comparatives_superlatives",
      sentencePattern: "Золото́е кольцо́ [blank] (дорогой) сере́бряного.",
      answer: "дороже",
      choices: ["дороже", "дорогее", "более дорогой", "самый дорогой"],
      translation: "The gold ring is more expensive than the silver one.",
      transliteration: "Zolotoe koltso dorozhe serebryanogo.",
      explanation: "Comparative with consonant mutation г → ж: «дороже»."
    },
    {
      id: "q_comp_3",
      topicId: "comparatives_superlatives",
      sentencePattern: "Этот но́вый фильм о́казался намно́го [blank] (хороший) преды́дущего.",
      answer: "лучше",
      choices: ["лучше", "хорошее", "более хороший", "самый хороший"],
      translation: "This new movie turned out much better than the previous one.",
      transliteration: "Etot novyy film okazalsya namnogo luchshe predydushchego.",
      explanation: "Suppletive comparative from «хороший»: «лучше»."
    },
    {
      id: "q_comp_4",
      topicId: "comparatives_superlatives",
      sentencePattern: "Эвере́ст — [blank] (высокий) верши́на на Земле́.",
      answer: "самая высокая",
      choices: ["самая высокая", "самый высокий", "самое высокое", "выше"],
      translation: "Everest is the highest peak on Earth.",
      transliteration: "Everest — samaya vysokaya vershina na Zemle.",
      explanation: "Superlative agreeing with feminine noun «вершина»: «самая высокая»."
    },
    {
      id: "q_comp_5",
      topicId: "comparatives_superlatives",
      sentencePattern: "Ста́рший брат на два го́да [blank] (молодой) своего́ дру́га.",
      answer: "моложе",
      choices: ["моложе", "молодее", "более молодой", "младший"],
      translation: "The elder brother is two years younger than his friend.",
      transliteration: "Starshiy brat na dva goda molozhe svoego druga.",
      explanation: "Consonant mutation д → ж: «моложе»."
    },
    {
      id: "q_comp_6",
      topicId: "comparatives_superlatives",
      sentencePattern: "Сего́дня морозная пого́да ста́ла намно́го [blank] (плохой), чем вчера́.",
      answer: "хуже",
      choices: ["хуже", "плохее", "более плохой", "худший"],
      translation: "Today the frosty weather became much worse than yesterday.",
      transliteration: "Segodnya moroznaya pogoda stala namnogo khuzhe, chem vchera.",
      explanation: "Suppletive comparative from «плохой»: «хуже»."
    },
    {
      id: "q_comp_7",
      topicId: "comparatives_superlatives",
      sentencePattern: "В э́том ти́хом переу́лке [blank] (тихий), чем на проспе́кте.",
      answer: "тише",
      choices: ["тише", "тихее", "более тихо", "тишайший"],
      translation: "In this quiet alley it is quieter than on the avenue.",
      transliteration: "V etom tikhom pereulke tishe, chem na prospekte.",
      explanation: "Consonant mutation х → ш: «тише»."
    },
    {
      id: "q_comp_8",
      topicId: "comparatives_superlatives",
      sentencePattern: "В на́шем кла́ссе учи́лся [blank] (умный) ма́льчик в шко́ле.",
      answer: "самый умный",
      choices: ["самый умный", "самая умная", "умнее", "умнейший"],
      translation: "In our class studied the smartest boy in school.",
      transliteration: "V nashem klasse uchilsya samyy umnyy malchik v shkole.",
      explanation: "Superlative masculine form: «самый умный»."
    },
    {
      id: "q_comp_9",
      topicId: "comparatives_superlatives",
      sentencePattern: "Зимо́й но́чи намно́го [blank] (длинный), а дни коро́че.",
      answer: "длиннее",
      choices: ["длиннее", "длинный", "более длинный", "длиннейший"],
      translation: "In winter the nights are much longer, and days are shorter.",
      transliteration: "Zimoy nochi namnogo dlinnee, a dni koroche.",
      explanation: "Comparative ending in -ее: «длиннее»."
    },
    {
      id: "q_comp_10",
      topicId: "comparatives_superlatives",
      sentencePattern: "Чемода́н оказа́лся намно́го [blank] (тяжёлый), чем каза́лся снаружи.",
      answer: "тяжелее",
      choices: ["тяжелее", "тяжеле", "более тяжёлый", "тягчайший"],
      translation: "The suitcase turned out much heavier than it looked from outside.",
      transliteration: "Chemodan okazalsya namnogo tyazhelee, chem kazalsya snaruzhi.",
      explanation: "Comparative ending in -ее: «тяжелее»."
    },
    {
      id: "q_comp_11",
      topicId: "comparatives_superlatives",
      sentencePattern: "Это [blank] (важный) вопро́с на сего́дняшней пове́стке дня.",
      answer: "самый важный",
      choices: ["самый важный", "самая важная", "важнее", "важней"],
      translation: "This is the most important question on today's agenda.",
      transliteration: "Eto samyy vazhnyy vopros na segodnyashney povestke dnya.",
      explanation: "Superlative modifying masculine «вопрос»: «самый важный»."
    },

    // 22. TIME & FREQUENCY EXPRESSIONS (11 Questions)
    {
      id: "q_time_1",
      topicId: "time_expressions",
      sentencePattern: "По́езд на Санкт-Петербу́рг отправля́ется ро́вно [blank] (через) де́сять мину́т.",
      answer: "через",
      choices: ["через", "назад", "за", "на"],
      translation: "The train to Saint Petersburg departs in exactly ten minutes.",
      transliteration: "Poezd na Sankt-Peterburg otpravlyaetsya rovno cherez desyat minut.",
      explanation: "Future time span from now requires «через»: «через десять минут»."
    },
    {
      id: "q_time_2",
      topicId: "time_expressions",
      sentencePattern: "Мы верну́лись из о́тпуска ро́вно две неде́ли [blank] (назад).",
      answer: "назад",
      choices: ["назад", "через", "за", "после"],
      translation: "We returned from vacation exactly two weeks ago.",
      transliteration: "My vernulis iz otpuska rovno dve nedeli nazad.",
      explanation: "Past time duration from now requires postposition «назад»."
    },
    {
      id: "q_time_3",
      topicId: "time_expressions",
      sentencePattern: "Студе́нт реши́л всю сло́жную зада́чу [blank] (за) оди́н час.",
      answer: "за",
      choices: ["за", "на", "через", "в"],
      translation: "The student solved the entire complex problem in one hour.",
      transliteration: "Student reshil vsyu slozhnuyu zadachu za odin chas.",
      explanation: "Time required to complete a result takes «за + Acc»: «за один час»."
    },
    {
      id: "q_time_4",
      topicId: "time_expressions",
      sentencePattern: "Мой колле́га уе́хал в командиро́вку [blank] (на) це́лый ме́сяц.",
      answer: "на",
      choices: ["на", "за", "через", "в"],
      translation: "My colleague left on a business trip for a whole month.",
      transliteration: "Moy kollega uekhal v komandirovku na tselyy mesyats.",
      explanation: "Intended planned duration of stay/result takes «на + Acc»: «на целый месяц»."
    },
    {
      id: "q_time_5",
      topicId: "time_expressions",
      sentencePattern: "[blank] (по) понеде́льникам наш музе́й закры́т для посеще́ния.",
      answer: "По",
      choices: ["По", "В", "На", "За"],
      translation: "On Mondays our museum is closed for visits.",
      transliteration: "Po ponedelnikam nash muzey zakryt dlya poseshcheniya.",
      explanation: "Recurring regular day of the week takes «по + Dat pl»: «По понедельникам»."
    },
    {
      id: "q_time_6",
      topicId: "time_expressions",
      sentencePattern: "Собра́ние зако́нчилось ро́вно [blank] (в) три часа́ дня.",
      answer: "в",
      choices: ["в", "на", "через", "за"],
      translation: "The meeting ended at exactly three o'clock in the afternoon.",
      transliteration: "Sobranie zakonchilos rovno v tri chasa dnya.",
      explanation: "Exact clock hour takes «в + Acc»: «в три часа»."
    },
    {
      id: "q_time_7",
      topicId: "time_expressions",
      sentencePattern: "Врач при́мет сле́дующего пацие́нта [blank] (через) по́лчаса.",
      answer: "через",
      choices: ["через", "назад", "за", "до"],
      translation: "The doctor will see the next patient in half an hour.",
      transliteration: "Vrach primet sleduyushchego patsienta cherez polchasa.",
      explanation: "Future point in time uses «через»."
    },
    {
      id: "q_time_8",
      topicId: "time_expressions",
      sentencePattern: "Они́ постро́или но́вый дом всего́ [blank] (за) одно́ ле́то.",
      answer: "за",
      choices: ["за", "на", "через", "по"],
      translation: "They built the new house in just one summer.",
      transliteration: "Oni postroili novyy dom vsego za odno leto.",
      explanation: "Time frame to complete a construction: «за одно лето»."
    },
    {
      id: "q_time_9",
      topicId: "time_expressions",
      sentencePattern: "Семья́ перее́хала в э́ту кварти́ру пять лет [blank] (назад).",
      answer: "назад",
      choices: ["назад", "через", "за", "на"],
      translation: "The family moved into this apartment five years ago.",
      transliteration: "Semya pereekhala v etu kvartiru pyat let nazad.",
      explanation: "Time span in the past: «пять лет назад»."
    },
    {
      id: "q_time_10",
      topicId: "time_expressions",
      sentencePattern: "Студе́нты взя́ли кни́ги в библиоте́ке [blank] (на) две неде́ли.",
      answer: "на",
      choices: ["на", "за", "через", "в"],
      translation: "The students checked out books from the library for two weeks.",
      transliteration: "Studenty vzyali knigi v biblioteke na dve nedeli.",
      explanation: "Target intended time duration: «на две недели»."
    },
    {
      id: "q_time_11",
      topicId: "time_expressions",
      sentencePattern: "Мы ча́сто гуля́ем по па́рку [blank] (по) ве́черам.",
      answer: "по",
      choices: ["по", "в", "на", "за"],
      translation: "We often walk around the park in the evenings.",
      transliteration: "My chasto gulyaem po parku po vecheram.",
      explanation: "Recurring time of day takes «по + Dat pl»: «по вечерам»."
    },

    // 23. RELATIVE CLAUSES & CONJUNCTIONS (11 Questions)
    {
      id: "q_rel_1",
      topicId: "relative_clauses_conjunctions",
      sentencePattern: "Это тот са́мый челове́к, [blank] (который) помо́г мне вчера́.",
      answer: "который",
      choices: ["который", "которого", "которому", "котором"],
      translation: "This is the very person who helped me yesterday.",
      transliteration: "Eto tot samyy chelovek, kotoryy pomog mne vchera.",
      explanation: "Subject of the relative clause: «который»."
    },
    {
      id: "q_rel_2",
      topicId: "relative_clauses_conjunctions",
      sentencePattern: "Кни́га, [blank] (которую) ты мне посове́товал, о́чень интере́сная.",
      answer: "которую",
      choices: ["которую", "которая", "которой", "которым"],
      translation: "The book which you recommended to me is very interesting.",
      transliteration: "Kniga, kotoruyu ty mne posovetoval, ochen interesnaya.",
      explanation: "Direct object in feminine subclause: «которую»."
    },
    {
      id: "q_rel_3",
      topicId: "relative_clauses_conjunctions",
      sentencePattern: "Го́род, в [blank] (котором) я роди́лся, нахо́дится на ю́ге.",
      answer: "котором",
      choices: ["котором", "который", "которого", "которому"],
      translation: "The city in which I was born is located in the south.",
      transliteration: "Gorod, v kotorom ya rodilsya, nakhoditsya na yuge.",
      explanation: "Location inside masculine noun with «в»: «в котором»."
    },
    {
      id: "q_rel_4",
      topicId: "relative_clauses_conjunctions",
      sentencePattern: "Я не пошёл на трениро́вку, [blank] (потому что) пло́хо себя́ чу́вствовал.",
      answer: "потому что",
      choices: ["потому что", "поэтому", "хотя", "но"],
      translation: "I did not go to training because I was feeling unwell.",
      transliteration: "Ya ne poshyol na trenirovku, potomu chto plokho sebya chuvstvoval.",
      explanation: "Subordinating conjunction of cause: «потому что»."
    },
    {
      id: "q_rel_5",
      topicId: "relative_clauses_conjunctions",
      sentencePattern: "На у́лице начался́ си́льный ли́вень, [blank] (поэтому) мы взяли такси́.",
      answer: "поэтому",
      choices: ["поэтому", "потому что", "хотя", "а"],
      translation: "A heavy downpour began outside, so we took a taxi.",
      transliteration: "Na ulitse nachalsya silnyy liven, poetomu my vzyali taksi.",
      explanation: "Consequence conjunction: «поэтому»."
    },
    {
      id: "q_rel_6",
      topicId: "relative_clauses_conjunctions",
      sentencePattern: "Я люблю́ чита́ть рома́ны, [blank] (а) мой брат предпочита́ет детекти́вы.",
      answer: "а",
      choices: ["а", "и", "но", "или"],
      translation: "I like reading novels, whereas my brother prefers detective stories.",
      transliteration: "Ya lyublyu chitat romany, a moy brat predpochitaet detektivy.",
      explanation: "Contrastive perspective shift: «а»."
    },
    {
      id: "q_rel_7",
      topicId: "relative_clauses_conjunctions",
      sentencePattern: "Мы о́чень уста́ли по́сле похо́да, [blank] (но) оста́лись дово́льны.",
      answer: "но",
      choices: ["но", "а", "и", "или"],
      translation: "We were very tired after the hike, but remained satisfied.",
      transliteration: "My ochen ustali posle pokhoda, no ostalis dovolny.",
      explanation: "Adversative contradiction: «но»."
    },
    {
      id: "q_rel_8",
      topicId: "relative_clauses_conjunctions",
      sentencePattern: "Дом, о́коло [blank] (которого) стоя́ла маши́на, был ста́рым.",
      answer: "которого",
      choices: ["которого", "который", "котором", "которому"],
      translation: "The house near which the car was parked was old.",
      transliteration: "Dom, okolo kotorogo stoyala mashina, byl starym.",
      explanation: "Genitive after preposition «около»: «около которого»."
    },
    {
      id: "q_rel_9",
      topicId: "relative_clauses_conjunctions",
      sentencePattern: "Студе́нты, с [blank] (которыми) мы учи́лись, разье́хались по города́м.",
      answer: "которыми",
      choices: ["которыми", "которые", "которых", "которым"],
      translation: "The students with whom we studied scattered to different cities.",
      transliteration: "Studenty, s kotorymi my uchilis, razehalis po gorodam.",
      explanation: "Plural companionship with «с»: «с которыми»."
    },
    {
      id: "q_rel_10",
      topicId: "relative_clauses_conjunctions",
      sentencePattern: "Она́ зна́ет англи́йский [blank] (и) францу́зский языки́.",
      answer: "и",
      choices: ["и", "а", "но", "потому что"],
      translation: "She knows English and French languages.",
      transliteration: "Ona znaet angliyskiy i frantsuzskiy yazyki.",
      explanation: "Simple additive conjunction: «и»."
    },
    {
      id: "q_rel_11",
      topicId: "relative_clauses_conjunctions",
      sentencePattern: "Де́вушка, [blank] (которой) я подари́л цветы́, улыбну́лась.",
      answer: "которой",
      choices: ["которой", "которая", "которую", "котором"],
      translation: "The girl to whom I gave flowers smiled.",
      transliteration: "Devushka, kotoroy ya podaril tsvety, ulybnulas.",
      explanation: "Indirect object recipient in Dative: «которой»."
    },

    // 24. PARTICIPLES & GERUNDS (11 Questions)
    {
      id: "q_part_1",
      topicId: "participles_gerunds",
      sentencePattern: "Студе́нт, [blank] (читающий) кни́гу у окна́, учи́лся на филфа́ке.",
      answer: "читающий",
      choices: ["читающий", "читавший", "читаемый", "читая"],
      translation: "The student reading a book by the window studied at the philology department.",
      transliteration: "Student, chitayushchiy knigu u okna, uchilsya na filfake.",
      explanation: "Present active participle describing current ongoing action: «читающий»."
    },
    {
      id: "q_part_2",
      topicId: "participles_gerunds",
      sentencePattern: "Письмо́, [blank] (написанное) изве́стным писа́телем, храня́т в музе́е.",
      answer: "написанное",
      choices: ["написанное", "написавший", "пишущее", "написав"],
      translation: "The letter written by the famous writer is kept in the museum.",
      transliteration: "Pismo, napisannoe izvestnym pisatelem, khranyat v muzee.",
      explanation: "Past passive participle modifying neuter «письмо»: «написанное»."
    },
    {
      id: "q_part_3",
      topicId: "participles_gerunds",
      sentencePattern: "[blank] (Прочитав) статью́ до конца́, он сде́лал ва́жные вы́воды.",
      answer: "Прочитав",
      choices: ["Прочитав", "Читая", "Прочитанный", "Прочитавший"],
      translation: "Having read the article to the end, he made important conclusions.",
      transliteration: "Prochitav statyu do kontsa, on sdelal vazhnye vyvody.",
      explanation: "Perfective verbal adverb (gerund) expressing a completed prior action: «Прочитав»."
    },
    {
      id: "q_part_4",
      topicId: "participles_gerunds",
      sentencePattern: "[blank] (Слушая) споко́йную му́зыку, она́ бы́стро усну́ла.",
      answer: "Слушая",
      choices: ["Слушая", "Послушав", "Слушающий", "Слушаемый"],
      translation: "While listening to calm music, she quickly fell asleep.",
      transliteration: "Slushaya spokoynuyu muzyku, ona bystro usnula.",
      explanation: "Imperfective verbal adverb (gerund) expressing simultaneous action: «Слушая»."
    },
    {
      id: "q_part_5",
      topicId: "participles_gerunds",
      sentencePattern: "На столе́ лежа́ла [blank] (открытая) тетра́дь с конспе́ктами.",
      answer: "открытая",
      choices: ["открытая", "открывшая", "открывая", "открыв"],
      translation: "On the table lay an open notebook with notes.",
      transliteration: "Na stole lezhala otkrytaya tetrad s konspektami.",
      explanation: "Passive participle in feminine: «открытая»."
    },
    {
      id: "q_part_6",
      topicId: "participles_gerunds",
      sentencePattern: "Лю́ди, [blank] (живущие) в э́том го́роде, о́чень гостеприи́мны.",
      answer: "живущие",
      choices: ["живущие", "жившие", "живя", "житые"],
      translation: "People living in this city are very hospitable.",
      transliteration: "Lyudi, zhivushchie v etom gorode, ochen gostepriimny.",
      explanation: "Present active participle plural: «живущие»."
    },
    {
      id: "q_part_7",
      topicId: "participles_gerunds",
      sentencePattern: "Все вопро́сы бы́ли [blank] (решены) на вчера́шнем собра́нии.",
      answer: "решены",
      choices: ["решены", "решившие", "решая", "решивши"],
      translation: "All questions were resolved at yesterday's meeting.",
      transliteration: "Vse voprosy byli resheny na vcherashnem sobranii.",
      explanation: "Short form past passive participle plural: «решены»."
    },
    {
      id: "q_part_8",
      topicId: "participles_gerunds",
      sentencePattern: "[blank] (Увидев) ста́рого дру́га, он ра́достно помаха́л руко́й.",
      answer: "Увидев",
      choices: ["Увидев", "Видя", "Увиденный", "Увидевший"],
      translation: "Having seen his old friend, he waved his hand joyfully.",
      transliteration: "Uvidev starogo druga, on radostno pomakhal rukoy.",
      explanation: "Perfective gerund: «Увидев»."
    },
    {
      id: "q_part_9",
      topicId: "participles_gerunds",
      sentencePattern: "Статья́, [blank] (опубликованная) в нау́чном журна́ле, вы́звала спо́ры.",
      answer: "опубликованная",
      choices: ["опубликованная", "опубликовавшая", "публикуя", "опубликовав"],
      translation: "The article published in the scientific journal sparked debate.",
      transliteration: "Statya, opublikovannaya v nauchnom zhurnale, vyzvala spory.",
      explanation: "Past passive participle feminine: «опубликованная»."
    },
    {
      id: "q_part_10",
      topicId: "participles_gerunds",
      sentencePattern: "Челове́к, [blank] (потерявший) па́спорт, обрати́лся в поли́цию.",
      answer: "потерявший",
      choices: ["потерявший", "теряющий", "потеряв", "потерянный"],
      translation: "The person who lost his passport turned to the police.",
      transliteration: "Chelovek, poteryavshiy pasport, obratilsya v politsiyu.",
      explanation: "Past active participle masculine: «потерявший»."
    },
    {
      id: "q_part_11",
      topicId: "participles_gerunds",
      sentencePattern: "Ма́льчик бежа́л по у́лице, [blank] (громко крича) от ра́дости.",
      answer: "громко крича",
      choices: ["громко крича", "кричавший", "закричав", "кричащий"],
      translation: "The boy ran along the street, shouting loudly with joy.",
      transliteration: "Malchik bezhal po ulitse, gromko kricha ot radosti.",
      explanation: "Imperfective gerund of simultaneous action: «громко крича»."
    }
  ];

  // Expand each curated seed into several natural, context-bearing variants.
  // The blank, answer, and distractors remain unchanged; the added context
  // makes each item a distinct learner-facing prompt while keeping the tested
  // grammatical decision deterministic and auditable.
  const QUESTION_CONTEXTS = [
    { ru: "В э́том диало́ге", en: "In this dialogue", tr: "V etom dialoge" },
    { ru: "На сего́дняшнем уро́ке", en: "In today’s lesson", tr: "Na segodnyashnem uroke" },
    { ru: "В письмо́ме дру́гу", en: "In a letter to a friend", tr: "V pisme drugu" },
    { ru: "Во вре́мя пое́здки", en: "During the trip", tr: "Vo vremya poezdki" },
    { ru: "В обы́чной жи́зни", en: "In everyday life", tr: "V obychnoy zhizni" },
    { ru: "В э́том сообще́нии", en: "In this message", tr: "V etom soobshchenii" }
  ];

  function addContextVariants(seedQuestions) {
    const variants = [];
    seedQuestions.forEach(seed => {
      QUESTION_CONTEXTS.forEach((context, index) => {
        const sentence = seed.sentencePattern.trim();
        const sentenceWithContext = `${context.ru}: ${sentence.charAt(0).toLocaleLowerCase("ru-RU")}${sentence.slice(1)}`;
        variants.push({
          ...seed,
          id: `${seed.id}_ctx${index + 1}`,
          sentencePattern: sentenceWithContext,
          translation: `${context.en}: ${seed.translation.charAt(0).toLocaleLowerCase("en-US")}${seed.translation.slice(1)}`,
          transliteration: `${context.tr}: ${seed.transliteration.charAt(0).toLocaleLowerCase("en-US")}${seed.transliteration.slice(1)}`,
          explanation: `${seed.explanation} The added context does not change the grammatical form required by the sentence.`,
          variantOf: seed.id
        });
      });
    });
    return [...seedQuestions, ...variants];
  }

  const QUESTION_BANK = addContextVariants(QUESTIONS);

  // --- STRATEGY C: INTERACTIVE MATRIX DRILL DATA & GENERATORS ---

  // 1. Rapid-fire Ending Picker Drills
  const ENDING_PICKER_DATA = [
    { stem: "студент", word: "студент", gender: "masc", targetCase: "Dative Case", targetEnding: "-у", fullWord: "студенту", choices: ["-у", "-а", "-ом", "-е"], hint: "Masculine Dative singular (кому?)" },
    { stem: "книг", word: "книга", gender: "fem", targetCase: "Accusative Case", targetEnding: "-у", fullWord: "книгу", choices: ["-у", "-ы", "-е", "-ой"], hint: "Feminine Accusative direct object (что?)" },
    { stem: "брат", word: "брат", gender: "masc", targetCase: "Genitive Case", targetEnding: "-а", fullWord: "брата", choices: ["-а", "-у", "-ом", "-е"], hint: "Masculine Genitive possession (кого?)" },
    { stem: "дом", word: "дом", gender: "masc", targetCase: "Prepositional Case", targetEnding: "-е", fullWord: "доме", choices: ["-е", "-у", "-а", "-ом"], hint: "Prepositional location in house (в доме)" },
    { stem: "ручк", word: "ручка", gender: "fem", targetCase: "Instrumental Case", targetEnding: "-ой", fullWord: "ручкой", choices: ["-ой", "-у", "-е", "-ы"], hint: "Feminine Instrumental means/tool (чем?)" },
    { stem: "окн", word: "окно", gender: "neut", targetCase: "Genitive Case", targetEnding: "-а", fullWord: "окна", choices: ["-а", "-у", "-ом", "-е"], hint: "Neuter Genitive singular (чего?)" },
    { stem: "врач", word: "врач", gender: "masc", targetCase: "Instrumental Case", targetEnding: "-ом", fullWord: "врачом", choices: ["-ом", "-а", "-у", "-е"], hint: "Masculine Instrumental profession (кем?)" },
    { stem: "сестр", word: "сестра", gender: "fem", targetCase: "Dative Case", targetEnding: "-е", fullWord: "сестре", choices: ["-е", "-у", "-ы", "-ой"], hint: "Feminine Dative recipient (кому?)" },
    { stem: "лес", word: "лес", gender: "masc", targetCase: "Prepositional (Locative)", targetEnding: "-у", fullWord: "лесу", choices: ["-у", "-е", "-а", "-ом"], hint: "Special locative ending after 'в' (в лесу)" },
    { stem: "стол", word: "стол", gender: "masc", targetCase: "Dative Case", targetEnding: "-у", fullWord: "столу", choices: ["-у", "-а", "-ом", "-е"], hint: "Masculine Dative (к столу)" }
  ];

  // 2. Case Detective / Identifier Drills
  const CASE_DETECTIVE_DATA = [
    { sentence: "Я купил подарок для своей любимой [мамы].", targetWord: "мамы", correctCase: "Genitive Case", choices: ["Genitive Case", "Accusative Case", "Dative Case", "Instrumental Case"], explanation: "After preposition «для» (for), the noun is in the Genitive case." },
    { sentence: "Студент пишет домашнее задание синей [ручкой].", targetWord: "ручкой", correctCase: "Instrumental Case", choices: ["Instrumental Case", "Dative Case", "Genitive Case", "Prepositional Case"], explanation: "Tool of action without preposition takes the Instrumental case." },
    { sentence: "Мы сейчас живём и учимся в [Москве].", targetWord: "Москве", correctCase: "Prepositional Case", choices: ["Prepositional Case", "Dative Case", "Accusative Case", "Genitive Case"], explanation: "Static location with preposition «в» is in the Prepositional case." },
    { sentence: "Она каждый вечер звонит своему старому [другу].", targetWord: "другу", correctCase: "Dative Case", choices: ["Dative Case", "Genitive Case", "Accusative Case", "Instrumental Case"], explanation: "Verb «звонить» (to call) governs the Dative case." },
    { sentence: "Вчера в библиотеке я прочитал интересную [книгу].", targetWord: "книгу", correctCase: "Accusative Case", choices: ["Accusative Case", "Nominative Case", "Genitive Case", "Dative Case"], explanation: "Direct object of transitive verb «прочитать» is in the Accusative case." },
    { sentence: "На столе лежит новый красивый [телефон].", targetWord: "телефон", correctCase: "Nominative Case", choices: ["Nominative Case", "Accusative Case", "Genitive Case", "Prepositional Case"], explanation: "The grammatical subject performing the action is in the Nominative case." },
    { sentence: "У моего брата совсем нет свободного [времени].", targetWord: "времени", correctCase: "Genitive Case", choices: ["Genitive Case", "Dative Case", "Prepositional Case", "Instrumental Case"], explanation: "Negation with «нет» governs the Genitive case." },
    { sentence: "Мы с [учителем] долго обсуждали результаты теста.", targetWord: "учителем", correctCase: "Instrumental Case", choices: ["Instrumental Case", "Prepositional Case", "Dative Case", "Genitive Case"], explanation: "Companionship with preposition «с» requires the Instrumental case." }
  ];

  // 3. Verb Aspect Pairs (100+ CEFR & Formation Categorized)
  const ASPECT_PAIRS = [
    // --- PREFIXATION (A1-B2) ---
    { nsv: "читать", sv: "прочитать", nsvAccented: "чита́ть", svAccented: "прочита́ть", translation: "to read", level: "A1", pattern: "prefix", exampleNsv: "Я весь вечер читал книгу.", exampleSv: "Я наконец прочитал книгу." },
    { nsv: "писать", sv: "написать", nsvAccented: "писа́ть", svAccented: "написа́ть", translation: "to write", level: "A1", pattern: "prefix", exampleNsv: "Он долго писал письмо.", exampleSv: "Он написал и отправил письмо." },
    { nsv: "делать", sv: "сделать", nsvAccented: "де́лать", svAccented: "сде́лать", translation: "to do / make", level: "A1", pattern: "prefix", exampleNsv: "Что ты делал вчера?", exampleSv: "Я сделал всё домашнее задание." },
    { nsv: "звонить", sv: "позвонить", nsvAccented: "звони́ть", svAccented: "позвони́ть", translation: "to call / ring", level: "A1", pattern: "prefix", exampleNsv: "Я звонил тебе три раза.", exampleSv: "Я позвоню тебе завтра вечером." },
    { nsv: "пить", sv: "выпить", nsvAccented: "пить", svAccented: "вы́пить", translation: "to drink", level: "A1", pattern: "prefix", exampleNsv: "Он медленно пил кофе.", exampleSv: "Он выпил стакан воды залпом." },
    { nsv: "есть", sv: "съесть", nsvAccented: "есть", svAccented: "съесть", translation: "to eat", level: "A1", pattern: "prefix", exampleNsv: "Дети с аппетитом ели суп.", exampleSv: "Они быстро съели весь торт." },
    { nsv: "смотреть", sv: "посмотреть", nsvAccented: "смотре́ть", svAccented: "посмотре́ть", translation: "to watch / look", level: "A1", pattern: "prefix", exampleNsv: "Мы смотрели фильм два часа.", exampleSv: "Мы посмотрели новый фильм." },
    { nsv: "слушать", sv: "послушать", nsvAccented: "слу́шать", svAccented: "послу́шать", translation: "to listen", level: "A1", pattern: "prefix", exampleNsv: "Она всегда слушает музыку.", exampleSv: "Послушай эту прекрасную песню." },
    { nsv: "учить", sv: "выучить", nsvAccented: "учи́ть", svAccented: "вы́учить", translation: "to learn / memorize", level: "A1", pattern: "prefix", exampleNsv: "Я каждый день учу слова.", exampleSv: "Я выучил все тридцать слов." },
    { nsv: "готовить", sv: "приготовить", nsvAccented: "гото́вить", svAccented: "пригото́вить", translation: "to cook / prepare", level: "A1", pattern: "prefix", exampleNsv: "Мама готовила ужин весь вечер.", exampleSv: "Мама приготовила вкусный пирог." },
    { nsv: "рисовать", sv: "нарисовать", nsvAccented: "рисова́ть", svAccented: "нарисова́ть", translation: "to draw / paint", level: "A1", pattern: "prefix", exampleNsv: "Художник рисовал портрет.", exampleSv: "Он нарисовал красивый пейзаж." },
    { nsv: "завтракать", sv: "позавтракать", nsvAccented: "за́втракать", svAccented: "поза́втракать", translation: "to have breakfast", level: "A1", pattern: "prefix", exampleNsv: "Я обычно завтракаю в восемь.", exampleSv: "Я быстро позавтракал и вышел." },
    { nsv: "обедать", sv: "пообедать", nsvAccented: "обе́дать", svAccented: "пообе́дать", translation: "to have lunch", level: "A1", pattern: "prefix", exampleNsv: "Мы долго обедали в кафе.", exampleSv: "Давай пообедаем вместе сегодня." },
    { nsv: "ужинать", sv: "поужинать", nsvAccented: "у́жинать", svAccented: "поу́жинать", translation: "to have dinner", level: "A1", pattern: "prefix", exampleNsv: "Семья ужинала в тишине.", exampleSv: "Мы вкусно поужинали в ресторане." },
    { nsv: "гулять", sv: "погулять", nsvAccented: "гуля́ть", svAccented: "погуля́ть", translation: "to walk / stroll", level: "A1", pattern: "prefix", exampleNsv: "Мы гуляли по парку два часа.", exampleSv: "Пойдём погуляем полчаса." },
    { nsv: "спать", sv: "поспать", nsvAccented: "спать", svAccented: "поспа́ть", translation: "to sleep", level: "A1", pattern: "prefix", exampleNsv: "Ребёнок спал всю ночь.", exampleSv: "Мне нужно поспать часок." },
    { nsv: "играть", sv: "поиграть", nsvAccented: "игра́ть", svAccented: "поигра́ть", translation: "to play", level: "A1", pattern: "prefix", exampleNsv: "Дети играли во дворе.", exampleSv: "Мы немного поиграли в шахматы." },
    { nsv: "знать", sv: "узнать", nsvAccented: "знать", svAccented: "узна́ть", translation: "to know / find out", level: "A1", pattern: "prefix", exampleNsv: "Я давно знаю этого человека.", exampleSv: "Вчера я узнал важную новость." },
    { nsv: "думать", sv: "подумать", nsvAccented: "ду́мать", svAccented: "поду́мать", translation: "to think", level: "A1", pattern: "prefix", exampleNsv: "Я долго думал об этом.", exampleSv: "Дай мне подумать одну минуту." },
    { nsv: "видеть", sv: "увидеть", nsvAccented: "ви́деть", svAccented: "уви́деть", translation: "to see / catch sight of", level: "A1", pattern: "prefix", exampleNsv: "Я часто видел его здесь.", exampleSv: "Вдруг я увидел своего друга." },
    { nsv: "слышать", sv: "услышать", nsvAccented: "слы́шать", svAccented: "услы́шать", translation: "to hear", level: "A1", pattern: "prefix", exampleNsv: "Ты слышишь этот странный звук?", exampleSv: "Я сразу услышал его голос." },
    { nsv: "помнить", sv: "запомнить", nsvAccented: "по́мнить", svAccented: "запо́мнить", translation: "to remember / memorize", level: "A2", pattern: "prefix", exampleNsv: "Я хорошо помню этот день.", exampleSv: "Постарайся запомнить это правило." },
    { nsv: "строить", sv: "построить", nsvAccented: "стро́ить", svAccented: "постро́ить", translation: "to build", level: "A2", pattern: "prefix", exampleNsv: "Рабочие строили мост два года.", exampleSv: "Они построили новый дом." },
    { nsv: "чистить", sv: "почистить", nsvAccented: "чи́стить", svAccented: "почи́стить", translation: "to clean / brush", level: "A2", pattern: "prefix", exampleNsv: "Я чищу зубы каждое утро.", exampleSv: "Я быстро почистил ботинки." },
    { nsv: "мыть", sv: "вымыть", nsvAccented: "мыть", svAccented: "вы́мыть", translation: "to wash", level: "A2", pattern: "prefix", exampleNsv: "Она мыла посуду полчаса.", exampleSv: "Она начисто вымыла полы." },
    { nsv: "стирать", sv: "постирать", nsvAccented: "стира́ть", svAccented: "постира́ть", translation: "to launder / wash clothes", level: "A2", pattern: "prefix", exampleNsv: "Машина стирает одежду.", exampleSv: "Я постирал все рубашки." },
    { nsv: "планировать", sv: "запланировать", nsvAccented: "плани́ровать", svAccented: "заплани́ровать", translation: "to plan", level: "A2", pattern: "prefix", exampleNsv: "Мы долго планировали отпуск.", exampleSv: "Мы запланировали поездку на май." },
    { nsv: "советовать", sv: "посоветовать", nsvAccented: "сове́товать", svAccented: "посове́товать", translation: "to advise", level: "A2", pattern: "prefix", exampleNsv: "Врач всегда советует отдыхать.", exampleSv: "Друг посоветовал хорошую книгу." },
    { nsv: "благодарить", sv: "поблагодарить", nsvAccented: "благодари́ть", svAccented: "поблагодари́ть", translation: "to thank", level: "A2", pattern: "prefix", exampleNsv: "Мы искренне благодарили гостей.", exampleSv: "Он тепло поблагодарил учителя." },
    { nsv: "просить", sv: "попросить", nsvAccented: "проси́ть", svAccented: "попроси́ть", translation: "to ask / request", level: "A2", pattern: "prefix", exampleNsv: "Он часто просил о помощи.", exampleSv: "Она попросила стакан воды." },
    { nsv: "платить", sv: "заплатить", nsvAccented: "плати́ть", svAccented: "заплати́ть", translation: "to pay", level: "A2", pattern: "prefix", exampleNsv: "Я всегда плачу картой.", exampleSv: "Он заплатил за весь обед." },
    { nsv: "дарить", sv: "подарить", nsvAccented: "дари́ть", svAccented: "подари́ть", translation: "to gift / give present", level: "A2", pattern: "prefix", exampleNsv: "Он любил дарить цветы.", exampleSv: "Друзья подарили мне часы." },
    { nsv: "варить", sv: "сварить", nsvAccented: "вари́ть", svAccented: "свари́ть", translation: "to boil / cook", level: "A2", pattern: "prefix", exampleNsv: "Суп варился на слабом огне.", exampleSv: "Она сварила вкусный кофе." },
    { nsv: "жарить", sv: "пожарить", nsvAccented: "жа́рить", svAccented: "пожа́рить", translation: "to fry / roast", level: "A2", pattern: "prefix", exampleNsv: "Повар жарил мясо.", exampleSv: "Я пожарил картошку на ужин." },
    { nsv: "печь", sv: "испечь", nsvAccented: "печь", svAccented: "испе́чь", translation: "to bake", level: "B1", pattern: "prefix", exampleNsv: "Бабушка пекла пирожки.", exampleSv: "Она испекла праздничный торт." },
    { nsv: "терять", sv: "потерять", nsvAccented: "теря́ть", svAccented: "потеря́ть", translation: "to lose", level: "A2", pattern: "prefix", exampleNsv: "Он часто теряет ключи.", exampleSv: "Вчера я потерял паспорт." },
    { nsv: "прятать", sv: "спрятать", nsvAccented: "пря́тать", svAccented: "спря́тать", translation: "to hide", level: "B1", pattern: "prefix", exampleNsv: "Собака прятала косточку.", exampleSv: "Он спрятал подарок в шкаф." },
    { nsv: "сушить", sv: "высушить", nsvAccented: "суши́ть", svAccented: "вы́сушить", translation: "to dry", level: "B1", pattern: "prefix", exampleNsv: "Ветер сушил мокрое бельё.", exampleSv: "Она высушила волосы феном." },
    { nsv: "ремонтировать", sv: "отремонтировать", nsvAccented: "ремонти́ровать", svAccented: "отремонти́ровать", translation: "to repair", level: "B1", pattern: "prefix", exampleNsv: "Мастер ремонтировал часы.", exampleSv: "Он быстро отремонтировал мотор." },
    { nsv: "копировать", sv: "скопировать", nsvAccented: "копи́ровать", svAccented: "скопи́ровать", translation: "to copy", level: "B1", pattern: "prefix", exampleNsv: "Студент копировал файлы.", exampleSv: "Я скопировал нужный документ." },
    { nsv: "фотографировать", sv: "сфотографировать", nsvAccented: "фотографи́ровать", svAccented: "сфотографи́ровать", translation: "to photograph", level: "A2", pattern: "prefix", exampleNsv: "Туристы фотографировали город.", exampleSv: "Сфотографируй нас, пожалуйста." },
    { nsv: "контролировать", sv: "проконтролировать", nsvAccented: "контроли́ровать", svAccented: "проконтроли́ровать", translation: "to monitor / check", level: "B2", pattern: "prefix", exampleNsv: "Инспектор контролировал процесс.", exampleSv: "Директор лично проконтролировал сделку." },
    { nsv: "анализировать", sv: "проанализировать", nsvAccented: "анализи́ровать", svAccented: "проанализи́ровать", translation: "to analyze", level: "B2", pattern: "prefix", exampleNsv: "Учёные анализировали данные.", exampleSv: "Мы детально проанализировали отчёт." },
    { nsv: "публиковать", sv: "опубликовать", nsvAccented: "публикова́ть", svAccented: "опубликова́ть", translation: "to publish", level: "B2", pattern: "prefix", exampleNsv: "Журнал регулярно публикует статьи.", exampleSv: "Автор опубликовал новую книгу." },
    { nsv: "организовывать", sv: "организовать", nsvAccented: "организо́вывать", svAccented: "организова́ть", translation: "to organize", level: "B1", pattern: "prefix", exampleNsv: "Комитет организовывал форум.", exampleSv: "Они блестяще организовали встречу." },
    { nsv: "требовать", sv: "потребовать", nsvAccented: "тре́бовать", svAccented: "потре́бовать", translation: "to demand / require", level: "B2", pattern: "prefix", exampleNsv: "Закон строго требует соблюдения норм.", exampleSv: "Клиент потребовал вернуть деньги." },

    // --- SUFFIXATION & STEM ALTERATIONS (A1-B2) ---
    { nsv: "открывать", sv: "открыть", nsvAccented: "открыва́ть", svAccented: "откры́ть", translation: "to open", level: "A1", pattern: "suffix", exampleNsv: "Магазин открывается в 9.", exampleSv: "Он открыл окно настежь." },
    { nsv: "закрывать", sv: "закрыть", nsvAccented: "закрыва́ть", svAccented: "закры́ть", translation: "to close", level: "A1", pattern: "suffix", exampleNsv: "Она всегда закрывает дверь.", exampleSv: "Он закрыл книгу и улыбнулся." },
    { nsv: "покупать", sv: "купить", nsvAccented: "покупа́ть", svAccented: "купи́ть", translation: "to buy", level: "A1", pattern: "suffix", exampleNsv: "Я часто покупаю фрукты здесь.", exampleSv: "Вчера я купил новый ноутбук." },
    { nsv: "решать", sv: "решить", nsvAccented: "реша́ть", svAccented: "реши́ть", translation: "to solve / decide", level: "A1", pattern: "suffix", exampleNsv: "Мы долго решали эту задачу.", exampleSv: "Мы наконец решили эту проблему." },
    { nsv: "помогать", sv: "помочь", nsvAccented: "помога́ть", svAccented: "помо́чь", translation: "to help", level: "A1", pattern: "suffix", exampleNsv: "Он всегда помогает родителям.", exampleSv: "Спасибо, ты очень помог мне." },
    { nsv: "понимать", sv: "понять", nsvAccented: "понима́ть", svAccented: "поня́ть", translation: "to understand", level: "A1", pattern: "suffix", exampleNsv: "Я плохо понимаю по-немецки.", exampleSv: "Я сразу всё понял." },
    { nsv: "вспоминать", sv: "вспомнить", nsvAccented: "вспомина́ть", svAccented: "вспо́мнить", translation: "to recall / recollect", level: "A2", pattern: "suffix", exampleNsv: "Старик часто вспоминал юность.", exampleSv: "Я внезапно вспомнил его имя." },
    { nsv: "изучать", sv: "изучить", nsvAccented: "изуча́ть", svAccented: "изучи́ть", translation: "to study / master", level: "A2", pattern: "suffix", exampleNsv: "Студенты изучают грамматику.", exampleSv: "Он досконально изучил вопрос." },
    { nsv: "давать", sv: "дать", nsvAccented: "дава́ть", svAccented: "дать", translation: "to give", level: "A1", pattern: "suffix", exampleNsv: "Учитель давал полезные советы.", exampleSv: "Дай мне, пожалуйста, ручку." },
    { nsv: "забывать", sv: "забыть", nsvAccented: "забыва́ть", svAccented: "забы́ть", translation: "to forget", level: "A1", pattern: "suffix", exampleNsv: "Не забывай звонить родителям.", exampleSv: "Я совершенно забыл про встречу." },
    { nsv: "начинать", sv: "начать", nsvAccented: "начина́ть", svAccented: "нача́ть", translation: "to begin / start", level: "A1", pattern: "suffix", exampleNsv: "Урок начинается в девять.", exampleSv: "Артист начал выступление." },
    { nsv: "кончать", sv: "кончить", nsvAccented: "конча́ть", svAccented: "ко́нчить", translation: "to end / finish", level: "A2", pattern: "suffix", exampleNsv: "Рабочий день кончается в шесть.", exampleSv: "Я наконец кончил эту работу." },
    { nsv: "получать", sv: "получить", nsvAccented: "получа́ть", svAccented: "получи́ть", translation: "to receive / get", level: "A1", pattern: "suffix", exampleNsv: "Я регулярно получаю письма.", exampleSv: "Вчера я получил визу." },
    { nsv: "посылать", sv: "послать", nsvAccented: "посыла́ть", svAccented: "посла́ть", translation: "to send", level: "A2", pattern: "suffix", exampleNsv: "Она часто посылает открытки.", exampleSv: "Я послал важное сообщение." },
    { nsv: "отправлять", sv: "отправить", nsvAccented: "отправля́ть", svAccented: "отпра́вить", translation: "to dispatch / send", level: "A2", pattern: "suffix", exampleNsv: "Курьер отправляет посылки.", exampleSv: "Я отправил письмо утром." },
    { nsv: "объяснять", sv: "объяснить", nsvAccented: "объясня́ть", svAccented: "объясни́ть", translation: "to explain", level: "A2", pattern: "suffix", exampleNsv: "Учитель терпеливо объяснял тему.", exampleSv: "Он понятно объяснил задачу." },
    { nsv: "повторять", sv: "повторить", nsvAccented: "повторя́ть", svAccented: "повтори́ть", translation: "to repeat / review", level: "A2", pattern: "suffix", exampleNsv: "Мы повторяем слова каждый день.", exampleSv: "Повторите, пожалуйста, ещё раз." },
    { nsv: "проверять", sv: "проверить", nsvAccented: "проверя́ть", svAccented: "прове́рить", translation: "to check / test", level: "A2", pattern: "suffix", exampleNsv: "Профессор проверяет тесты.", exampleSv: "Я уже проверил баланс карты." },
    { nsv: "отвечать", sv: "ответить", nsvAccented: "отвеча́ть", svAccented: "отве́тить", translation: "to answer / reply", level: "A1", pattern: "suffix", exampleNsv: "Студент уверенно отвечал на вопросы.", exampleSv: "Он сразу ответил на звонок." },
    { nsv: "спрашивать", sv: "спросить", nsvAccented: "спра́шивать", svAccented: "спроси́ть", translation: "to ask a question", level: "A1", pattern: "suffix", exampleNsv: "Дети часто спрашивают обо всём.", exampleSv: "Я спросил прохожего о дороге." },
    { nsv: "приглашать", sv: "пригласить", nsvAccented: "приглаша́ть", svAccented: "пригласи́ть", translation: "to invite", level: "A2", pattern: "suffix", exampleNsv: "Мы всегда приглашаем друзей.", exampleSv: "Они пригласили нас на свадьбу." },
    { nsv: "выбирать", sv: "выбрать", nsvAccented: "выбира́ть", svAccented: "вы́брать", translation: "to choose / select", level: "A2", pattern: "suffix", exampleNsv: "Она долго выбирала платье.", exampleSv: "Я выбрал самый лучший вариант." },
    { nsv: "собирать", sv: "собрать", nsvAccented: "собира́ть", svAccented: "собра́ть", translation: "to gather / pack", level: "A2", pattern: "suffix", exampleNsv: "Осенью люди собирают грибы.", exampleSv: "Я быстро собрал чемодан." },
    { nsv: "продавать", sv: "продать", nsvAccented: "продава́ть", svAccented: "прода́ть", translation: "to sell", level: "A2", pattern: "suffix", exampleNsv: "Магазин продаёт сувениры.", exampleSv: "Он выгодно продал машину." },
    { nsv: "передавать", sv: "передать", nsvAccented: "передава́ть", svAccented: "переда́ть", translation: "to pass / transmit", level: "B1", pattern: "suffix", exampleNsv: "Радио передавало новости.", exampleSv: "Передайте соль, пожалуйста." },
    { nsv: "вставать", sv: "встать", nsvAccented: "встава́ть", svAccented: "встать", translation: "to stand up / get up", level: "A1", pattern: "suffix", exampleNsv: "Я обычно встаю в 7 утра.", exampleSv: "Сегодня я встал очень рано." },
    { nsv: "уставать", sv: "устать", nsvAccented: "устава́ть", svAccented: "уста́ть", translation: "to get tired", level: "A2", pattern: "suffix", exampleNsv: "К вечеру я сильно устаю.", exampleSv: "После пробежки я ужасно устал." },
    { nsv: "оставаться", sv: "остаться", nsvAccented: "остава́ться", svAccented: "оста́ться", translation: "to stay / remain", level: "A2", pattern: "suffix", exampleNsv: "Мы часто оставались дома.", exampleSv: "Я остался в городе на выходные." },
    { nsv: "одеваться", sv: "одеться", nsvAccented: "одева́ться", svAccented: "оде́ться", translation: "to get dressed", level: "A2", pattern: "suffix", exampleNsv: "Она долго одевается перед зеркалом.", exampleSv: "Оденься теплее, на улице мороз." },
    { nsv: "раздеваться", sv: "раздеться", nsvAccented: "раздева́ться", svAccented: "разде́ться", translation: "to undress / take off coat", level: "B1", pattern: "suffix", exampleNsv: "Гости раздевались в прихожей.", exampleSv: "Разденьтесь и проходите в зал." },
    { nsv: "обуваться", sv: "обуться", nsvAccented: "обува́ться", svAccented: "обу́ться", translation: "to put on shoes", level: "B1", pattern: "suffix", exampleNsv: "Малыш учился обуваться сам.", exampleSv: "Он быстро обулся и выбежал." },
    { nsv: "опаздывать", sv: "опоздать", nsvAccented: "опа́здывать", svAccented: "опозда́ть", translation: "to be late", level: "A2", pattern: "suffix", exampleNsv: "Он никогда не опаздывает на работу.", exampleSv: "Из-за пробки я опоздал на поезд." },
    { nsv: "успевать", sv: "успеть", nsvAccented: "успева́ть", svAccented: "успе́ть", translation: "to manage in time / catch", level: "A2", pattern: "suffix", exampleNsv: "Я всегда успеваю сделать отчёт.", exampleSv: "Мы успели на последний автобус." },
    { nsv: "привыкать", sv: "привыкнуть", nsvAccented: "привыка́ть", svAccented: "привы́кнуть", translation: "to get used to", level: "B1", pattern: "suffix", exampleNsv: "Я постепенно привыкаю к климату.", exampleSv: "Я уже привык к новому расписанию." },
    { nsv: "отвыкать", sv: "отвыкнуть", nsvAccented: "отвыка́ть", svAccented: "отвы́кнуть", translation: "to unlearn / get out of habit", level: "B2", pattern: "suffix", exampleNsv: "Он отвыкает от сладкого.", exampleSv: "Я совершенно отвык от морозов." },
    { nsv: "исчезать", sv: "исчезнуть", nsvAccented: "исчеза́ть", svAccented: "исче́знуть", translation: "to disappear", level: "B1", pattern: "suffix", exampleNsv: "Солнце медленно исчезало за горами.", exampleSv: "Туман внезапно исчез." },
    { nsv: "возникать", sv: "возникнуть", nsvAccented: "возника́ть", svAccented: "возни́кнуть", translation: "to arise / emerge", level: "B2", pattern: "suffix", exampleNsv: "Часто возникают вопросы.", exampleSv: "У нас внезапно возникла проблема." },
    { nsv: "достигать", sv: "достичь", nsvAccented: "достига́ть", svAccented: "дости́чь", translation: "to reach / achieve", level: "B2", pattern: "suffix", exampleNsv: "Спортсмены достигают рекордов.", exampleSv: "Команда достигла поставленной цели." },
    { nsv: "соглашаться", sv: "согласиться", nsvAccented: "соглаша́ться", svAccented: "согласи́ться", translation: "to agree", level: "B1", pattern: "suffix", exampleNsv: "Он редко соглашался на уступки.", exampleSv: "Директор согласился с нашим планом." },
    { nsv: "отказываться", sv: "отказаться", nsvAccented: "отка́зываться", svAccented: "отказа́ться", translation: "to refuse / decline", level: "B1", pattern: "suffix", exampleNsv: "Она всегда отказывается от сахара.", exampleSv: "Он наотрез отказался от предложения." },
    { nsv: "обещать", sv: "пообещать", nsvAccented: "обеща́ть", svAccented: "пообеща́ть", translation: "to promise", level: "A2", pattern: "suffix", exampleNsv: "Политики много обещают.", exampleSv: "Он пообещал приехать вовремя." },
    { nsv: "замечать", sv: "заметить", nsvAccented: "замеча́ть", svAccented: "заме́тить", translation: "to notice", level: "B1", pattern: "suffix", exampleNsv: "Она замечает каждую мелочь.", exampleSv: "Я сразу заметил ошибку в тексте." },
    { nsv: "разрешать", sv: "разрешить", nsvAccented: "разреша́ть", svAccented: "разреши́ть", translation: "to permit / allow", level: "B1", pattern: "suffix", exampleNsv: "Закон разрешает мирные собрания.", exampleSv: "Врач разрешил пациенту вставать." },
    { nsv: "запрещать", sv: "запретить", nsvAccented: "запреща́ть", svAccented: "запрети́ть", translation: "to forbid / prohibit", level: "B1", pattern: "suffix", exampleNsv: "Знак запрещает парковку.", exampleSv: "Отец строго запретил трогать прибор." },
    { nsv: "предупреждать", sv: "предупредить", nsvAccented: "предупрежда́ть", svAccented: "предупреди́ть", translation: "to warn in advance", level: "B1", pattern: "suffix", exampleNsv: "Синоптики предупреждают о шторме.", exampleSv: "Я предупредил друга об опасности." },
    { nsv: "спасать", sv: "спасти", nsvAccented: "спаса́ть", svAccented: "спасти́", translation: "to save / rescue", level: "B1", pattern: "suffix", exampleNsv: "Врачи спасают человеческие жизни.", exampleSv: "Пожарный спас ребёнка из огня." },
    { nsv: "встречать", sv: "встретить", nsvAccented: "встреча́ть", svAccented: "встре́тить", translation: "to meet / greet", level: "A2", pattern: "suffix", exampleNsv: "Я каждый день встречаю её в метро.", exampleSv: "Вчера на вокзале я встретил брата." },

    // --- SUPPLETIVE & IRREGULAR (A1-B2) ---
    { nsv: "говорить", sv: "сказать", nsvAccented: "говори́ть", svAccented: "сказа́ть", translation: "to speak / say", level: "A1", pattern: "suppletive", exampleNsv: "Он долго говорил по телефону.", exampleSv: "Он сказал мне всю правду." },
    { nsv: "брать", sv: "взять", nsvAccented: "брать", svAccented: "взять", translation: "to take", level: "A1", pattern: "suppletive", exampleNsv: "Я всегда беру с собой зонт.", exampleSv: "Он взял ключ со стола." },
    { nsv: "класть", sv: "положить", nsvAccented: "класть", svAccented: "положи́ть", translation: "to put / lay horizontally", level: "A1", pattern: "suppletive", exampleNsv: "Она обычно кладёт телефон сюда.", exampleSv: "Положи книгу на полку." },
    { nsv: "ложиться", sv: "лечь", nsvAccented: "ложи́ться", svAccented: "лечь", translation: "to lie down / go to bed", level: "A2", pattern: "suppletive", exampleNsv: "Я обычно ложусь спать в полночь.", exampleSv: "Больной лёг в постель." },
    { nsv: "садиться", sv: "сесть", nsvAccented: "сади́ться", svAccented: "сесть", translation: "to sit down / board", level: "A2", pattern: "suppletive", exampleNsv: "Пассажиры садятся в поезд.", exampleSv: "Садитесь, пожалуйста, на этот стул." },
    { nsv: "становиться", sv: "стать", nsvAccented: "станови́ться", svAccented: "стать", translation: "to become / stand", level: "A2", pattern: "suppletive", exampleNsv: "Погода становится теплее.", exampleSv: "Он стал известным учёным." },
    { nsv: "возвращаться", sv: "вернуться", nsvAccented: "возвраща́ться", svAccented: "верну́ться", translation: "to return / come back", level: "A2", pattern: "suppletive", exampleNsv: "Отец поздно возвращается с работы.", exampleSv: "Мы благополучно вернулись домой." },
    { nsv: "находить", sv: "найти", nsvAccented: "находи́ть", svAccented: "найти́", translation: "to find", level: "A2", pattern: "suppletive", exampleNsv: "Детектив часто находит улики.", exampleSv: "Я наконец нашёл свои очки." },
    { nsv: "ловить", sv: "поймать", nsvAccented: "лови́ть", svAccented: "пойма́ть", translation: "to catch", level: "B1", pattern: "suppletive", exampleNsv: "Рыбак всё утро ловил рыбу.", exampleSv: "Кот ловко поймал мышь." },
    { nsv: "вешать", sv: "повесить", nsvAccented: "ве́шать", svAccented: "пове́сить", translation: "to hang up", level: "B1", pattern: "suppletive", exampleNsv: "Она вешала картины на стену.", exampleSv: "Повесь пальто на вешалку." },
    { nsv: "умирать", sv: "умереть", nsvAccented: "умира́ть", svAccented: "умере́ть", translation: "to die", level: "B1", pattern: "suppletive", exampleNsv: "Растение медленно умирало без воды.", exampleSv: "Поэт умер в молодом возрасте." },

    // --- STRESS SHIFT PAIRS (B1-B2) ---
    { nsv: "отреза́ть", sv: "отре́зать", nsvAccented: "отреза́ть", svAccented: "отре́зать", translation: "to cut off / slice", level: "B1", pattern: "stress", exampleNsv: "Повар медленно отреза́л хлеб.", exampleSv: "Отре́жь мне кусочек сыра." },
    { nsv: "засыпа́ть", sv: "засы́пать", nsvAccented: "засыпа́ть", svAccented: "засы́пать", translation: "to cover with sand/earth / fall asleep", level: "B1", pattern: "stress", exampleNsv: "Снег постепенно засыпа́л дорогу.", exampleSv: "Яма была быстро засы́пана землёй." },
    { nsv: "избега́ть", sv: "избежа́ть", nsvAccented: "избега́ть", svAccented: "избежа́ть", translation: "to avoid / escape", level: "B2", pattern: "stress", exampleNsv: "Он старательно избега́ет конфликтов.", exampleSv: "Водителю удалось избежа́ть аварии." }
  ];

  // --- TRIGGER DRILLS DATA (30+ High-Yield Sentences with Clue Highlighting) ---
  const ASPECT_TRIGGER_DATA = [
    {
      id: "trig_1",
      sentencePattern: "Вчера вечером я долго [blank] интересную книгу.",
      nsv: "читал",
      sv: "прочитал",
      answer: "читал",
      aspect: "Imperfective (НСВ)",
      trigger: "долго",
      translation: "Yesterday evening I was reading an interesting book for a long time.",
      explanation: "Trigger word «долго» (for a long time) indicates duration of an ongoing process → Imperfective (НСВ).",
      level: "A1"
    },
    {
      id: "trig_2",
      sentencePattern: "Я [blank] эту книгу за два часа и пошёл гулять.",
      nsv: "читал",
      sv: "прочитал",
      answer: "прочитал",
      aspect: "Perfective (СВ)",
      trigger: "за два часа",
      translation: "I finished reading this book in two hours and went for a walk.",
      explanation: "Timeframe construction «за + Accusative» (in / within 2 hours) denotes a completed result → Perfective (СВ).",
      level: "A1"
    },
    {
      id: "trig_3",
      sentencePattern: "Каждое утро он [blank] чашку крепкого кофе.",
      nsv: "пьёт",
      sv: "выпьет",
      answer: "пьёт",
      aspect: "Imperfective (НСВ)",
      trigger: "Каждое утро",
      translation: "Every morning he drinks a cup of strong coffee.",
      explanation: "Habitual repetition with «каждое утро» (every morning) requires the Imperfective (НСВ) aspect.",
      level: "A1"
    },
    {
      id: "trig_4",
      sentencePattern: "Вдруг в коридоре [blank] телефон.",
      nsv: "звонил",
      sv: "позвонил",
      answer: "позвонил",
      aspect: "Perfective (СВ)",
      trigger: "Вдруг",
      translation: "Suddenly the telephone rang in the hallway.",
      explanation: "Sudden one-time events triggered by «вдруг» (suddenly) require the Perfective (СВ) aspect.",
      level: "A1"
    },
    {
      id: "trig_5",
      sentencePattern: "Студенты [blank] сложную задачу весь урок.",
      nsv: "решали",
      sv: "решили",
      answer: "решали",
      aspect: "Imperfective (НСВ)",
      trigger: "весь урок",
      translation: "The students were solving the difficult problem the whole lesson.",
      explanation: "Continuous duration expressions like «весь урок» (the whole lesson) demand the Imperfective (НСВ).",
      level: "A1"
    },
    {
      id: "trig_6",
      sentencePattern: "После долгих споров мы наконец [blank] проблему.",
      nsv: "решали",
      sv: "решили",
      answer: "решили",
      aspect: "Perfective (СВ)",
      trigger: "наконец",
      translation: "After long arguments we finally resolved the problem.",
      explanation: "The trigger «наконец» (at last / finally) emphasizes achieving a conclusive result → Perfective (СВ).",
      level: "A1"
    },
    {
      id: "trig_7",
      sentencePattern: "Он часто [blank] ключи от квартиры.",
      nsv: "забывает",
      sv: "забудет",
      answer: "забывает",
      aspect: "Imperfective (НСВ)",
      trigger: "часто",
      translation: "He often forgets the apartment keys.",
      explanation: "Recurrent frequency indicated by «часто» (often) requires the Imperfective (НСВ).",
      level: "A1"
    },
    {
      id: "trig_8",
      sentencePattern: "Смотри не [blank] паспорт дома!",
      nsv: "забывай",
      sv: "забудь",
      answer: "забудь",
      aspect: "Perfective (СВ)",
      trigger: "Смотри не",
      translation: "Watch out that you don't forget your passport at home!",
      explanation: "Warning against a single undesirable event («Смотри не... / Не... случайно») uses the Perfective (СВ).",
      level: "A2"
    },
    {
      id: "trig_9",
      sentencePattern: "Пока мама готовила ужин, папа [blank] телевизор.",
      nsv: "смотрел",
      sv: "посмотрел",
      answer: "смотрел",
      aspect: "Imperfective (НСВ)",
      trigger: "Пока (simultaneous)",
      translation: "While mom was cooking dinner, dad was watching TV.",
      explanation: "Parallel simultaneous actions introduced by «пока» (while) require the Imperfective (НСВ).",
      level: "A2"
    },
    {
      id: "trig_10",
      sentencePattern: "Он вошёл в комнату, снял пальто и [blank] на диван.",
      nsv: "садился",
      sv: "сел",
      answer: "сел",
      aspect: "Perfective (СВ)",
      trigger: "Sequence of actions",
      translation: "He entered the room, took off his coat, and sat down on the sofa.",
      explanation: "A sequence of consecutive completed actions in the past always takes the Perfective (СВ).",
      level: "A2"
    },
    {
      id: "trig_11",
      sentencePattern: "Обычно мы [blank] продукты в супермаркете возле дома.",
      nsv: "покупаем",
      sv: "купим",
      answer: "покупаем",
      aspect: "Imperfective (НСВ)",
      trigger: "Обычно",
      translation: "Usually we buy groceries at the supermarket near our house.",
      explanation: "Habitual regular routine with «обычно» (usually) uses the Imperfective (НСВ).",
      level: "A1"
    },
    {
      id: "trig_12",
      sentencePattern: "Вчера в торговом центре я [blank] отличный подарок другу.",
      nsv: "покупал",
      sv: "купил",
      answer: "купил",
      aspect: "Perfective (СВ)",
      trigger: "Specific completed purchase",
      translation: "Yesterday at the mall I bought a great gift for my friend.",
      explanation: "A concrete completed transaction achieving a result uses the Perfective (СВ).",
      level: "A1"
    },
    {
      id: "trig_13",
      sentencePattern: "По выходным мы всегда [blank] по старым улицам города.",
      nsv: "гуляем",
      sv: "погуляем",
      answer: "гуляем",
      aspect: "Imperfective (НСВ)",
      trigger: "По выходным / всегда",
      translation: "On weekends we always stroll along the old streets of the city.",
      explanation: "Recurring time markers («по выходным», «всегда») demand the Imperfective (НСВ).",
      level: "A1"
    },
    {
      id: "trig_14",
      sentencePattern: "Погода наладилась, давай [blank] полчаса на свежем воздухе.",
      nsv: "гулять",
      sv: "погуляем",
      answer: "погуляем",
      aspect: "Perfective (СВ)",
      trigger: "давай (single joint event)",
      translation: "The weather improved, let's take a walk for half an hour in the fresh air.",
      explanation: "Delimitative prefix «по-» expressing a single brief session («погуляем полчаса») takes the Perfective (СВ).",
      level: "A2"
    },
    {
      id: "trig_15",
      sentencePattern: "Ученик [blank] стихотворение наизусть за один вечер.",
      nsv: "учил",
      sv: "выучил",
      answer: "выучил",
      aspect: "Perfective (СВ)",
      trigger: "за один вечер",
      translation: "The pupil memorized the poem by heart in one evening.",
      explanation: "Reaching 100% completion in a timeframe («за один вечер») requires Perfective (СВ) «выучил».",
      level: "A2"
    },
    {
      id: "trig_16",
      sentencePattern: "Никогда не [blank] чужие вещи без спроса!",
      nsv: "бери",
      sv: "возьми",
      answer: "бери",
      aspect: "Imperfective (НСВ)",
      trigger: "Никогда не (general prohibition)",
      translation: "Never take other people's belongings without asking!",
      explanation: "Universal prohibitions with «никогда не» require the Imperfective (НСВ) imperative.",
      level: "A2"
    },
    {
      id: "trig_17",
      sentencePattern: "Пожалуйста, [blank] со стола этот документ и передай директору.",
      nsv: "бери",
      sv: "возьми",
      answer: "возьми",
      aspect: "Perfective (СВ)",
      trigger: "Specific single request",
      translation: "Please take this document from the table and hand it to the director.",
      explanation: "A specific single request to perform an action to completion takes the Perfective (СВ) imperative.",
      level: "A1"
    },
    {
      id: "trig_18",
      sentencePattern: "Профессор начал [blank] новую тему.",
      nsv: "объяснять",
      sv: "объяснить",
      answer: "объяснять",
      aspect: "Imperfective (НСВ)",
      trigger: "Phasal verb: начал",
      translation: "The professor began explaining the new topic.",
      explanation: "Phasal verbs expressing the start, continuation, or end of an action (начать, продолжать, закончить) always require an Imperfective (НСВ) infinitive.",
      level: "A2"
    },
    {
      id: "trig_19",
      sentencePattern: "Мы уже закончили [blank] проект.",
      nsv: "писать",
      sv: "написать",
      answer: "писать",
      aspect: "Imperfective (НСВ)",
      trigger: "Phasal verb: закончили",
      translation: "We have already finished writing the project.",
      explanation: "Verb «закончить» (to finish) is a phasal verb and exclusively governs the Imperfective (НСВ) infinitive.",
      level: "A2"
    },
    {
      id: "trig_20",
      sentencePattern: "Она внезапно [blank] и побледнела.",
      nsv: "вставала",
      sv: "встала",
      answer: "встала",
      aspect: "Perfective (СВ)",
      trigger: "внезапно",
      translation: "She abruptly stood up and turned pale.",
      explanation: "Abrupt single events triggered by «внезапно» (abruptly) require the Perfective (СВ).",
      level: "B1"
    }
  ];

  // --- NUANCE CONTRAST DATA (Process vs. Result / Situational Scenarios) ---
  const ASPECT_NUANCE_DATA = [
    {
      id: "nuance_1",
      title: "General Fact vs. Total Completion",
      sentenceA: "Ты читал эту книгу?",
      meaningA: "Have you read / are you familiar with this book? (General fact / experience)",
      aspectA: "Imperfective (НСВ)",
      sentenceB: "Ты прочитал эту книгу?",
      meaningB: "Did you finish reading the book to the very end? (Total completion / result)",
      aspectB: "Perfective (СВ)",
      explanation: "In questions, the Imperfective «читал» simply inquires about knowledge of the book, whereas the Perfective «прочитал» checks whether you completed reading all of it.",
      level: "A1"
    },
    {
      id: "nuance_2",
      title: "Attempted Action vs. Successful Result",
      sentenceA: "Я долго сдавал экзамен по вождению.",
      meaningA: "I was taking the driving test / attempted it multiple times (process / attempts).",
      aspectA: "Imperfective (НСВ)",
      sentenceB: "Я наконец сдал экзамен по вождению!",
      meaningB: "I finally passed the driving test! (Successful achievement / result).",
      aspectB: "Perfective (СВ)",
      explanation: "«Сдавать» (НСВ) refers to the process or attempt of taking an exam; «сдать» (СВ) signifies successfully passing it.",
      level: "A2"
    },
    {
      id: "nuance_3",
      title: "Calling Attempt vs. Reaching the Person",
      sentenceA: "Я звонил тебе вчера вечером.",
      meaningA: "I placed calls to you yesterday evening (fact of dialing / calling).",
      aspectA: "Imperfective (НСВ)",
      sentenceB: "Я наконец дозвонился до тебя!",
      meaningB: "I finally reached you / got through on the phone (successful connection).",
      aspectB: "Perfective (СВ)",
      explanation: "«Звонить» (НСВ) states the general activity of calling; «дозвониться» (СВ) expresses overcoming obstacles and getting an answer.",
      level: "B1"
    },
    {
      id: "nuance_4",
      title: "General Invitation vs. Specific Prompt",
      sentenceA: "Проходите, садитесь, пожалуйста.",
      meaningA: "Come in and sit down, please (Polite, welcoming general invitation).",
      aspectA: "Imperfective (НСВ)",
      sentenceB: "Сядь ровно и не крутись!",
      meaningB: "Sit straight and don't fidget! (Direct command / specific physical movement).",
      aspectB: "Perfective (СВ)",
      explanation: "Imperfective imperatives («садитесь», «проходите») express welcoming courtesy, while Perfective imperatives («сядь») demand immediate execution.",
      level: "A2"
    },
    {
      id: "nuance_5",
      title: "General Prohibition vs. Negative Warning",
      sentenceA: "Не открывай окно, в комнате сквозняк.",
      meaningA: "Do not open the window (Prohibition of action / do not do it).",
      aspectA: "Imperfective (НСВ)",
      sentenceB: "Смотри не урони тарелку!",
      meaningB: "Watch out that you don't accidentally drop the plate! (Warning against mishap).",
      aspectB: "Perfective (СВ)",
      explanation: "Negative particle «не» with Imperfective means 'don't do this action (prohibition)'; with Perfective, it warns against an accidental unintended outcome.",
      level: "B1"
    },
    {
      id: "nuance_6",
      title: "Process Duration vs. Speed of Completion",
      sentenceA: "Художник рисовал картину два года.",
      meaningA: "The artist worked on the painting for two years (lengthy process).",
      aspectA: "Imperfective (НСВ)",
      sentenceB: "Художник нарисовал картину за два дня.",
      meaningB: "The artist finished painting the entire canvas in two days (speedy result).",
      aspectB: "Perfective (СВ)",
      explanation: "«Два года» without prepositions indicates time spent doing the activity (НСВ); «за два дня» indicates the timeframe needed to deliver the result (СВ).",
      level: "A2"
    }
  ];

  // --- TRANSFORMATION DRILLS DATA (Conjugation & Aspect Shifts) ---
  const ASPECT_TRANSFORM_DATA = [
    {
      id: "trans_1",
      title: "Past Process → Past Completed Result",
      sourceSentence: "Вчера мы долго решали сложную задачу.",
      sourceAspect: "Imperfective Past (НСВ - process)",
      instruction: "Convert the sentence into a completed action with the result «наконец»:",
      targetSentencePattern: "Вчера мы наконец [blank] сложную задачу.",
      answer: "решили",
      choices: ["решили", "решали", "решим", "будем решать"],
      explanation: "When switching from prolonged process to finalized result, use the Perfective past: «решили».",
      level: "A1"
    },
    {
      id: "trans_2",
      title: "Compound Future (НСВ) → Simple Future (СВ)",
      sourceSentence: "Завтра я буду писать письма весь день.",
      sourceAspect: "Compound Future (НСВ - duration)",
      instruction: "Convert into a single completed action taking place tomorrow morning:",
      targetSentencePattern: "Завтра утром я [blank] важное письмо и отправлю его.",
      answer: "напишу",
      choices: ["напишу", "буду писать", "писал", "написал"],
      explanation: "A one-time completed action in the future uses the Simple Future formed with the Perfective verb: «напишу».",
      level: "A1"
    },
    {
      id: "trans_3",
      title: "Phasal Verb Rule (начать / закончить + Infinitive)",
      sourceSentence: "Студент внимательно читает текст.",
      sourceAspect: "Present Tense (НСВ)",
      instruction: "Insert the phasal verb «начал» (began). Remember the phasal verb rule for the infinitive:",
      targetSentencePattern: "Студент вчера начал [blank] этот сложный текст.",
      answer: "читать",
      choices: ["читать", "прочитать", "прочитал", "читал"],
      explanation: "Phasal verbs (начать, стать, продолжать, кончить) MUST always be followed by an Imperfective (НСВ) infinitive: «читать».",
      level: "A2"
    },
    {
      id: "trans_4",
      title: "General Prohibition (Не + Imperative)",
      sourceSentence: "Ты открыл дверь настежь.",
      sourceAspect: "Perfective Past (СВ)",
      instruction: "Form a general prohibition command (Do not open!):",
      targetSentencePattern: "Пожалуйста, не [blank] дверь, на улице мороз.",
      answer: "открывай",
      choices: ["открывай", "открой", "откроешь", "открывал"],
      explanation: "Prohibiting an action («не делай этого») requires the Imperfective imperative: «не открывай».",
      level: "A2"
    },
    {
      id: "trans_5",
      title: "Accidental Mishap Warning (Смотри не + Imperative)",
      sourceSentence: "Осторожно, чашка очень горячая!",
      sourceAspect: "Warning context",
      instruction: "Warn the person not to accidentally drop the cup:",
      targetSentencePattern: "Смотри не [blank] чашку на пол!",
      answer: "урони",
      choices: ["урони", "роняй", "уронишь", "уронял"],
      explanation: "Warning against an accidental result («смотри не...») takes the Perfective imperative: «урони».",
      level: "B1"
    },
    {
      id: "trans_6",
      title: "Habitual Routine → Single Specific Instance",
      sourceSentence: "По вечерам я обычно покупаю свежий хлеб.",
      sourceAspect: "Habitual Present (НСВ)",
      instruction: "Express that yesterday you bought a delicious cake for the party:",
      targetSentencePattern: "Вчера к празднику я [blank] большой шоколадный торт.",
      answer: "купил",
      choices: ["купил", "покупал", "куплю", "буду покупать"],
      explanation: "A single concrete purchase completing the action requires the Perfective past: «купил».",
      level: "A1"
    }
  ];

  const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

  function getTopicLevels(topicId) {
    const configuredLevel = LESSONS[topicId]?.level || "";
    return configuredLevel.match(/A1|A2|B1|B2|C1|C2/g) || [];
  }

  // Keep learner-facing prompts free of labels that disclose the answer.
  // Topic/rule names belong in metadata and post-answer explanations only.
  function validateQuestion(question, seenIds, seenPrompts) {
    if (!question || typeof question !== "object") return "question is not an object";
    if (typeof question.id !== "string" || !question.id.trim()) return "missing id";
    if (seenIds.has(question.id)) return "duplicate id";
    if (!LESSONS[question.topicId]) return "unknown topicId";
    if (typeof question.sentencePattern !== "string" || !/^.*\[blank\].*$/u.test(question.sentencePattern)) return "invalid sentencePattern";
    if (typeof question.answer !== "string" || !question.answer.trim()) return "missing answer";
    if (!Array.isArray(question.choices) || question.choices.length !== 4) return "choices must contain four options";
    const normalizedChoices = question.choices.map(choice => String(choice).trim().toLocaleLowerCase("ru-RU"));
    if (new Set(normalizedChoices).size !== 4) return "duplicate choices";
    if (!normalizedChoices.includes(question.answer.trim().toLocaleLowerCase("ru-RU"))) return "answer is not a choice";
    for (const field of ["translation", "transliteration", "explanation"]) {
      if (typeof question[field] !== "string" || !question[field].trim()) return `missing ${field}`;
    }
    const promptKey = question.sentencePattern.trim().toLocaleLowerCase("ru-RU");
    if (seenPrompts.has(promptKey)) return "duplicate prompt";
    // A case/aspect label in the learner prompt is usually answer leakage.
    if (/(?:nominative|accusative|genitive|dative|instrumental|prepositional|именительн|винительн|родительн|дательн|творительн|предложн|perfective|imperfective|совершенн(?:ый|ого)|несовершенн(?:ый|ого))/iu.test(promptKey)) {
      return "learner prompt contains a grammar label";
    }
    seenIds.add(question.id);
    seenPrompts.add(promptKey);
    return null;
  }

  function validateQuestionBank() {
    const seenIds = new Set();
    const seenPrompts = new Set();
    const errors = [];
    QUESTION_BANK.forEach((question, index) => {
      const error = validateQuestion(question, seenIds, seenPrompts);
      if (error) errors.push({ index, id: question?.id || null, error });
    });
    return {
      valid: errors.length === 0,
      total: QUESTION_BANK.length,
      errors,
      byLevel: CEFR_LEVELS.reduce((counts, level) => {
        counts[level] = QUESTION_BANK.filter(question => getTopicLevels(question.topicId).includes(level)).length;
        return counts;
      }, {})
    };
  }

  // --- PUBLIC API ---
  const GrammarOffline = {
    getAllTopics: function () {
      return Object.keys(LESSONS);
    },

    getLesson: function (topicId) {
      const lesson = LESSONS[topicId] || LESSONS["nominative_case"];
      return {
        ...lesson,
        explanation: lesson.explanation || lesson.description
      };
    },

    getQuestions: function (topicIds = [], count = 5, level = "all") {
      const allowed = Array.isArray(topicIds) && topicIds.length > 0
        ? topicIds
        : Object.keys(LESSONS);
      const requestedLevel = typeof level === "string" && CEFR_LEVELS.includes(level.toUpperCase())
        ? level.toUpperCase()
        : "all";
      const requestedCount = Math.max(0, Math.floor(Number(count) || 0));

      const pool = QUESTION_BANK.filter(q => (
        allowed.includes(q.topicId) &&
        (requestedLevel === "all" || getTopicLevels(q.topicId).includes(requestedLevel))
      ));

      // Shuffle pool
      const shuffled = [...pool].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, requestedCount).map(question => ({
        ...question,
        cefr: requestedLevel === "all"
          ? (getTopicLevels(question.topicId)[0] || "A1")
          : requestedLevel
      }));
    },

    validateQuestionBank: validateQuestionBank,

    getEndingPickerDrill: function () {
      const shuffled = [...ENDING_PICKER_DATA].sort(() => 0.5 - Math.random());
      return shuffled[0];
    },

    getCaseDetectiveDrill: function () {
      const shuffled = [...CASE_DETECTIVE_DATA].sort(() => 0.5 - Math.random());
      return shuffled[0];
    },

    getAspectPairs: function (filter = {}) {
      const { level = "all", pattern = "all", search = "" } = filter;
      return ASPECT_PAIRS.filter(p => {
        if (level !== "all" && p.level.toLowerCase() !== level.toLowerCase()) return false;
        if (pattern !== "all" && p.pattern.toLowerCase() !== pattern.toLowerCase()) return false;
        if (search) {
          const q = search.toLowerCase().trim();
          const matchNsv = p.nsv.toLowerCase().includes(q);
          const matchSv = p.sv.toLowerCase().includes(q);
          const matchTrans = p.translation.toLowerCase().includes(q);
          if (!matchNsv && !matchSv && !matchTrans) return false;
        }
        return true;
      });
    },

    getAspectMatchingRound: function (pairCount = 5, level = "all", pattern = "all") {
      let pool = ASPECT_PAIRS;
      if (level && level !== "all") {
        pool = pool.filter(p => p.level.toLowerCase() === level.toLowerCase());
      }
      if (pattern && pattern !== "all") {
        pool = pool.filter(p => p.pattern.toLowerCase() === pattern.toLowerCase());
      }
      if (pool.length < pairCount) {
        pool = ASPECT_PAIRS; // Fallback to entire bank if filter is too narrow
      }
      const shuffled = [...pool].sort(() => 0.5 - Math.random()).slice(0, pairCount);
      const leftItems = shuffled.map((p, idx) => ({
        id: `nsv_${idx}`,
        text: p.nsv,
        accented: p.nsvAccented,
        pairId: idx,
        aspect: "Imperfective (НСВ)",
        translation: p.translation,
        pattern: p.pattern,
        level: p.level,
        example: p.exampleNsv
      }));
      const rightItems = shuffled.map((p, idx) => ({
        id: `sv_${idx}`,
        text: p.sv,
        accented: p.svAccented,
        pairId: idx,
        aspect: "Perfective (СВ)",
        translation: p.translation,
        pattern: p.pattern,
        level: p.level,
        example: p.exampleSv
      }));
      return {
        pairs: shuffled,
        left: leftItems.sort(() => 0.5 - Math.random()),
        right: rightItems.sort(() => 0.5 - Math.random())
      };
    },

    getAspectTriggerDrill: function (level = "all") {
      let pool = ASPECT_TRIGGER_DATA;
      if (level && level !== "all") {
        const filtered = pool.filter(d => d.level.toLowerCase() === level.toLowerCase());
        if (filtered.length > 0) pool = filtered;
      }
      const shuffled = [...pool].sort(() => 0.5 - Math.random());
      return shuffled[0];
    },

    getAspectNuanceDrill: function (level = "all") {
      let pool = ASPECT_NUANCE_DATA;
      if (level && level !== "all") {
        const filtered = pool.filter(d => d.level.toLowerCase() === level.toLowerCase());
        if (filtered.length > 0) pool = filtered;
      }
      const shuffled = [...pool].sort(() => 0.5 - Math.random());
      return shuffled[0];
    },

    getAspectTransformDrill: function (level = "all") {
      let pool = ASPECT_TRANSFORM_DATA;
      if (level && level !== "all") {
        const filtered = pool.filter(d => d.level.toLowerCase() === level.toLowerCase());
        if (filtered.length > 0) pool = filtered;
      }
      const shuffled = [...pool].sort(() => 0.5 - Math.random());
      return shuffled[0];
    }
  };

  // Export to window and CommonJS
  if (typeof window !== "undefined") {
    window.GrammarOffline = GrammarOffline;
  }
  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      GrammarOffline,
      LESSONS,
      QUESTIONS: QUESTION_BANK,
      ENDING_PICKER_DATA,
      CASE_DETECTIVE_DATA,
      ASPECT_PAIRS,
      ASPECT_TRIGGER_DATA,
      ASPECT_NUANCE_DATA,
      ASPECT_TRANSFORM_DATA
    };
  }
})();
