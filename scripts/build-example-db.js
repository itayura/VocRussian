const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Load default and expanded vocabulary to cross-reference accents
const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/db.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/db_expanded.js'), 'utf8'), context);

const knownAccents = new Map();
(context.window.defaultVocabulary || []).forEach(w => {
  if (w.word && w.accented) {
    knownAccents.set(w.word.toLowerCase(), w.accented);
  }
});
(context.window.expandedVocabulary || []).forEach(w => {
  if (w.word && w.accented) {
    knownAccents.set(w.word.toLowerCase(), w.accented);
  }
});

console.log(`Loaded ${knownAccents.size} known accented words for cross-referencing.`);

const htmlPath = 'C:/Users/Itayu-PC/Documents/antigravity/mysterious-einstein/preply_russian_vocabulary.html';
const html = fs.readFileSync(htmlPath, 'utf8');

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

const sectionRegex = /<h3>(.*?)<\/h3>\s*<table class="vocab-table">.*?<tbody>(.*?)<\/tbody>\s*<\/table>/gs;
let match;
const rawEntries = [];

while ((match = sectionRegex.exec(html)) !== null) {
  const sectionTitle = match[1].trim();
  const tbody = match[2];
  const rows = [...tbody.matchAll(/<tr>\s*<td class="ru">(.*?)<\/td>\s*<td class="en">(.*?)<\/td>\s*<\/tr>/gs)];
  
  rows.forEach(r => {
    rawEntries.push({
      section: sectionTitle,
      ru: r[1].trim(),
      en: r[2].trim()
    });
  });
}

function getCategoryAndPos(section, ru, en) {
  let category = "General";
  let pos = "phrase";
  let level = "B1";

  const isMultiWord = ru.includes(' ');

  if (section.includes('Verbs & Aspect Pairs')) {
    category = "Verbs & Aspect Pairs";
    pos = isMultiWord ? "phrase" : "verb";
    level = "B1";
  } else if (section.includes('Idiomatic Expressions')) {
    category = "Idioms & Expressions";
    pos = isMultiWord ? "phrase" : (en.startsWith('to ') ? "verb" : "noun");
    level = "B2";
  } else if (section.includes('Nouns')) {
    category = "Nouns & Concepts";
    pos = isMultiWord ? "phrase" : "noun";
    level = "A2";
  } else if (section.includes('Adjectives & Adverbs')) {
    category = "Adjectives & Adverbs";
    if (ru.endsWith('о') || ru.endsWith('е') || en.includes('ly')) {
      pos = "adverb";
    } else {
      pos = isMultiWord ? "phrase" : "adjective";
    }
    level = "B1";
  }

  const cleanWord = ru.charAt(0).toUpperCase() + ru.slice(1);
  return { category, pos, level, cleanWord };
}

const entryMap = new Map();

rawEntries.forEach(entry => {
  const key = entry.ru.toLowerCase().trim();
  const { category, pos, level, cleanWord } = getCategoryAndPos(entry.section, entry.ru, entry.en);
  
  if (entryMap.has(key)) {
    const existing = entryMap.get(key);
    if (!existing.translation.toLowerCase().includes(entry.en.toLowerCase())) {
      if (existing.translation.length < entry.en.length) {
        existing.translation = entry.en + ' / ' + existing.translation;
      } else {
        existing.translation = existing.translation + ' / ' + entry.en;
      }
    }
  } else {
    entryMap.set(key, {
      word: cleanWord,
      translation: entry.en,
      category,
      pos,
      level
    });
  }
});

const finalWords = [];
let idCounter = 1;

entryMap.forEach((item) => {
  const translit = transliterateWord(item.word);
  
  // Try to find accent
  let accented = item.word;
  const lower = item.word.toLowerCase();
  if (knownAccents.has(lower)) {
    const acc = knownAccents.get(lower);
    // preserve original casing
    if (item.word[0] === item.word[0].toUpperCase()) {
      accented = acc.charAt(0).toUpperCase() + acc.slice(1);
    } else {
      accented = acc;
    }
  }

  finalWords.push({
    id: `vx_${idCounter++}`,
    word: item.word,
    accented: accented,
    translation: item.translation,
    transliteration: translit,
    pos: item.pos,
    category: item.category,
    level: item.level,
    exampleRu: `Пример: ${item.word}.`,
    exampleEn: `Example: ${item.translation}.`
  });
});

console.log(`Generated ${finalWords.length} words for Example Deck.`);

const fileContent = `// Example Russian Vocabulary Database (Preply Master Reference)
// ${finalWords.length} words and phrases curated from Preply lessons.

const exampleVocabulary = ${JSON.stringify(finalWords, null, 2)};

// Expose to window for app usage
if (typeof window !== "undefined") {
  window.exampleVocabulary = exampleVocabulary;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { exampleVocabulary };
}
`;

fs.writeFileSync(path.join(__dirname, '../js/db_example.js'), fileContent, 'utf8');
console.log('Successfully wrote js/db_example.js');
