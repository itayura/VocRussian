const fs = require("fs");
const path = require("path");
const vm = require("vm");

// Load vocabulary from db.js
const dbContent = fs.readFileSync(path.join(__dirname, "../js/db.js"), "utf8");
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(dbContent, sandbox);
const vocabulary = sandbox.window.defaultVocabulary || [];

const themes = ["clay", "vector", "storybook", "glossy"];

// Ensure directories exist
themes.forEach(theme => {
  const dir = path.join(__dirname, `../assets/images/words/${theme}`);
  fs.mkdirSync(dir, { recursive: true });
});

// Semantic visual mapper for vocabulary words
const semanticVisuals = {
  "v_1": { icon: "👋", label: "Wave / Hello", color: "#FF7B54", altColor: "#FFB26B" },
  "v_2": { icon: "🤝", label: "Handshake", color: "#4E73DF", altColor: "#224ABE" },
  "v_3": { icon: "🙏", label: "Thank you", color: "#1CC88A", altColor: "#13855c" },
  "v_4": { icon: "🎁", label: "Please / Gift", color: "#F6C23E", altColor: "#dda20a" },
  "v_5": { icon: "✅", label: "Yes / Check", color: "#2ECC71", altColor: "#27AE60" },
  "v_6": { icon: "❌", label: "No / Cross", color: "#E74C3C", altColor: "#C0392B" },
  "v_7": { icon: "🎩", label: "Goodbye formal", color: "#8E44AD", altColor: "#9B59B6" },
  "v_8": { icon: "✨", label: "Bye informal", color: "#E67E22", altColor: "#F39C12" },
  "v_9": { icon: "👍", label: "Good / Well", color: "#2ECC71", altColor: "#1ABC9C" },
  "v_10": { icon: "👎", label: "Bad / Poor", color: "#E74C3C", altColor: "#D35400" },
  "v_11": { icon: "🙇", label: "Excuse me", color: "#3498DB", altColor: "#2980B9" },
  "v_12": { icon: "👤", label: "I / Myself", color: "#36B9CC", altColor: "#258391" },
  "v_13": { icon: "👉", label: "You", color: "#4E73DF", altColor: "#2E59D9" },
  "v_14": { icon: "👨", label: "He", color: "#3498DB", altColor: "#1F618D" },
  "v_15": { icon: "👩", label: "She", color: "#E84393", altColor: "#D63031" },
  "v_16": { icon: "👥", label: "We", color: "#6C5CE7", altColor: "#5842B8" },
  "v_17": { icon: "👥", label: "You plural", color: "#00CEC9", altColor: "#0984E3" },
  "v_18": { icon: "🌐", label: "They", color: "#FD79A8", altColor: "#E84393" },
  "v_19": { icon: "❓", label: "Who", color: "#F39C12", altColor: "#D68910" },
  "v_20": { icon: "💡", label: "What", color: "#F1C40F", altColor: "#F39C12" },
  "v_21": { icon: "📍", label: "Where", color: "#E74C3C", altColor: "#C0392B" },
  "v_22": { icon: "⏰", label: "When", color: "#3498DB", altColor: "#2980B9" },
  "v_23": { icon: "🤔", label: "Why", color: "#9B59B6", altColor: "#8E44AD" },
  "v_24": { icon: "⚙️", label: "How", color: "#1ABC9C", altColor: "#16A085" },
  "v_25": { icon: "🚶", label: "Person", color: "#34495E", altColor: "#2C3E50" },
  "v_26": { icon: "🫂", label: "Friend", color: "#2ECC71", altColor: "#27AE60" },
  "v_27": { icon: "🏡", label: "Family", color: "#E67E22", altColor: "#D35400" },
  "v_28": { icon: "🏠", label: "House", color: "#E74C3C", altColor: "#C0392B" },
  "v_29": { icon: "🏙️", label: "City", color: "#3498DB", altColor: "#2980B9" },
  "v_30": { icon: "🗺️", label: "Country", color: "#27AE60", altColor: "#1E8449" },
  "v_31": { icon: "💼", label: "Work", color: "#8E44AD", altColor: "#7D3C98" },
  "v_32": { icon: "📖", label: "Book", color: "#3498DB", altColor: "#2874A6" },
  "v_33": { icon: "💧", label: "Water", color: "#00A8FF", altColor: "#0097E6" },
  "v_34": { icon: "🍎", label: "Food / Apple", color: "#E74C3C", altColor: "#C0392B" },
  "v_35": { icon: "☕", label: "Tea / Coffee", color: "#D35400", altColor: "#BA4A00" },
  "v_36": { icon: "☀️", label: "Day / Sun", color: "#F39C12", altColor: "#E67E22" },
  "v_37": { icon: "🌙", label: "Night / Moon", color: "#34495E", altColor: "#2C3E50" },
  "v_38": { icon: "🐱", label: "Cat", color: "#E67E22", altColor: "#D35400" },
  "v_39": { icon: "🐶", label: "Dog", color: "#95A5A6", altColor: "#7F8C8D" },
  "v_40": { icon: "🚗", label: "Car", color: "#E74C3C", altColor: "#C0392B" },
  "v_41": { icon: "✈️", label: "Airplane", color: "#3498DB", altColor: "#2980B9" },
  "v_42": { icon: "🚆", label: "Train", color: "#16A085", altColor: "#117864" },
  "v_43": { icon: "🚪", label: "Door", color: "#D35400", altColor: "#A04000" },
  "v_44": { icon: "🪟", label: "Window", color: "#3498DB", altColor: "#2E86C1" },
  "v_45": { icon: "🪑", label: "Chair", color: "#8E44AD", altColor: "#6C3483" },
  "v_46": { icon: "🛋️", label: "Table / Room", color: "#E67E22", altColor: "#AF601A" },
  "v_47": { icon: "🛏️", label: "Bed", color: "#34495E", altColor: "#1C2833" },
  "v_48": { icon: "🔑", label: "Key", color: "#F1C40F", altColor: "#B7950B" },
  "v_49": { icon: "📱", label: "Phone", color: "#2ECC71", altColor: "#1E8449" },
  "v_50": { icon: "💻", label: "Computer", color: "#3498DB", altColor: "#1B4F72" }
};

// SVG Themes Generator
function generateSVG(word, visual, theme) {
  const icon = visual.icon || "📌";
  const primaryColor = visual.color || "#4E73DF";
  const accentColor = visual.altColor || "#224ABE";
  const wordText = word.word || "";
  const enText = (word.translation || "").replace(/&/g, "&amp;");

  if (theme === "clay") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" width="100%" height="100%">
  <defs>
    <radialGradient id="clayBg_${word.id}" cx="30%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#2D3748" />
      <stop offset="100%" stop-color="#1A202C" />
    </radialGradient>
    <radialGradient id="pillGrad_${word.id}" cx="35%" cy="30%" r="65%">
      <stop offset="0%" stop-color="${primaryColor}" />
      <stop offset="70%" stop-color="${accentColor}" />
      <stop offset="100%" stop-color="#111827" />
    </radialGradient>
    <filter id="clayShadow_${word.id}" x="-20%" y="-20%" width="150%" height="150%">
      <feDropShadow dx="0" dy="16" stdDeviation="16" flood-color="rgba(0,0,0,0.55)" />
      <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="rgba(0,0,0,0.3)" />
    </filter>
  </defs>
  <rect width="320" height="320" rx="36" fill="url(#clayBg_${word.id})" />
  <g filter="url(#clayShadow_${word.id})">
    <circle cx="160" cy="135" r="80" fill="url(#pillGrad_${word.id})" />
    <ellipse cx="140" cy="95" rx="36" ry="14" fill="#ffffff" opacity="0.28" />
  </g>
  <text x="160" y="156" font-size="70" text-anchor="middle" dominant-baseline="middle">${icon}</text>
  <g transform="translate(160, 255)">
    <rect x="-95" y="-20" width="190" height="40" rx="20" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.18)" stroke-width="1.5" />
    <text x="0" y="6" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="700" fill="#F7FAFC" text-anchor="middle">${wordText}</text>
  </g>
</svg>`;
  }

  if (theme === "vector") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" width="100%" height="100%">
  <defs>
    <linearGradient id="vectorBg_${word.id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1E293B" />
      <stop offset="100%" stop-color="#0F172A" />
    </linearGradient>
    <linearGradient id="vectorAccent_${word.id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${primaryColor}" />
      <stop offset="100%" stop-color="${accentColor}" />
    </linearGradient>
  </defs>
  <rect width="320" height="320" rx="28" fill="url(#vectorBg_${word.id})" stroke="#334155" stroke-width="2" />
  <polygon points="160,50 250,140 160,230 70,140" fill="url(#vectorAccent_${word.id})" opacity="0.15" />
  <rect x="90" y="70" width="140" height="140" rx="20" fill="none" stroke="${primaryColor}" stroke-width="3" stroke-dasharray="6,6" />
  <circle cx="160" cy="140" r="58" fill="url(#vectorAccent_${word.id})" />
  <text x="160" y="152" font-size="56" text-anchor="middle" dominant-baseline="middle">${icon}</text>
  <text x="160" y="265" font-family="'Courier New', Courier, monospace" font-size="20" font-weight="bold" fill="#38BDF8" text-anchor="middle" letter-spacing="1.5">${wordText}</text>
  <text x="160" y="290" font-family="system-ui, sans-serif" font-size="13" font-weight="500" fill="#94A3B8" text-anchor="middle">${enText}</text>
</svg>`;
  }

  if (theme === "storybook") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" width="100%" height="100%">
  <defs>
    <radialGradient id="storyBg_${word.id}" cx="50%" cy="45%" r="65%">
      <stop offset="0%" stop-color="#2C243B" />
      <stop offset="100%" stop-color="#14101D" />
    </radialGradient>
    <linearGradient id="watercolor_${word.id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FDE68A" stop-opacity="0.8" />
      <stop offset="50%" stop-color="${primaryColor}" stop-opacity="0.85" />
      <stop offset="100%" stop-color="${accentColor}" stop-opacity="0.9" />
    </linearGradient>
  </defs>
  <rect width="320" height="320" rx="32" fill="url(#storyBg_${word.id})" stroke="#4C3A69" stroke-width="2" />
  <circle cx="80" cy="70" r="2.5" fill="#FDE68A" opacity="0.8" />
  <circle cx="240" cy="85" r="3.5" fill="#FDE68A" opacity="0.9" />
  <circle cx="75" cy="210" r="2" fill="#FDE68A" opacity="0.6" />
  <circle cx="245" cy="205" r="3" fill="#FDE68A" opacity="0.8" />
  <path d="M160,60 Q215,80 225,135 Q235,190 160,215 Q85,190 95,135 Q105,80 160,60 Z" fill="url(#watercolor_${word.id})" opacity="0.6" />
  <circle cx="160" cy="140" r="65" fill="#FAF5FF" opacity="0.12" stroke="#E9D5FF" stroke-width="1.5" />
  <text x="160" y="152" font-size="64" text-anchor="middle" dominant-baseline="middle">${icon}</text>
  <text x="160" y="260" font-family="Georgia, serif" font-size="22" font-weight="600" fill="#FEF08A" text-anchor="middle">${wordText}</text>
  <text x="160" y="285" font-family="Georgia, serif" font-style="italic" font-size="14" fill="#E9D5FF" text-anchor="middle">${enText}</text>
</svg>`;
  }

  if (theme === "glossy") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" width="100%" height="100%">
  <defs>
    <linearGradient id="glossyBg_${word.id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0F0C20" />
      <stop offset="100%" stop-color="#05030A" />
    </linearGradient>
    <linearGradient id="neonGlow_${word.id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#C084FC" />
      <stop offset="50%" stop-color="#38BDF8" />
      <stop offset="100%" stop-color="#818CF8" />
    </linearGradient>
  </defs>
  <rect width="320" height="320" rx="36" fill="url(#glossyBg_${word.id})" />
  <circle cx="160" cy="135" r="90" fill="url(#neonGlow_${word.id})" opacity="0.25" />
  <rect x="75" y="55" width="170" height="160" rx="28" fill="rgba(255,255,255,0.06)" stroke="url(#neonGlow_${word.id})" stroke-width="2" />
  <line x1="80" y1="60" x2="240" y2="60" stroke="rgba(255,255,255,0.4)" stroke-width="1.5" stroke-linecap="round" />
  <text x="160" y="148" font-size="68" text-anchor="middle" dominant-baseline="middle">${icon}</text>
  <g transform="translate(160, 260)">
    <rect x="-90" y="-18" width="180" height="36" rx="18" fill="rgba(192, 132, 252, 0.12)" stroke="rgba(192, 132, 252, 0.3)" />
    <text x="0" y="5" font-family="system-ui, sans-serif" font-size="18" font-weight="700" fill="#E879F9" text-anchor="middle">${wordText}</text>
  </g>
</svg>`;
  }
}

// Generate assets for all 120 words across all 4 themes
let count = 0;
const defaultIcons = ["✨", "🌟", "📚", "🎯", "💬", "💡", "🚀", "🏷️", "🔥", "💎", "⭐", "🎉", "🏆", "🎨", "🍀", "🌸"];
const palette = [
  ["#4E73DF", "#224ABE"],
  ["#1CC88A", "#13855c"],
  ["#36B9CC", "#258391"],
  ["#F6C23E", "#dda20a"],
  ["#E74C3C", "#C0392B"],
  ["#6C5CE7", "#5842B8"],
  ["#E84393", "#D63031"],
  ["#00CEC9", "#0984E3"],
  ["#FD79A8", "#E84393"],
  ["#00B894", "#00A884"]
];

vocabulary.forEach((word, index) => {
  const pal = palette[index % palette.length];
  const visual = semanticVisuals[word.id] || {
    icon: defaultIcons[index % defaultIcons.length],
    color: pal[0],
    altColor: pal[1]
  };

  themes.forEach(theme => {
    const svgContent = generateSVG(word, visual, theme);
    const filePath = path.join(__dirname, `../assets/images/words/${theme}/${word.id}.svg`);
    fs.writeFileSync(filePath, svgContent, "utf8");
    count++;
  });
});

console.log(`Successfully generated ${count} multi-theme visual assets across ${themes.length} themes.`);
