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

// Comprehensive Semantic Visual Mapping for all 120 words
const semanticVisuals = {
  // Essentials (v_1 - v_11)
  "v_1": { icon: "👋", label: "Wave / Hello", color: "#FF7B54", altColor: "#FFB26B", bg1: "#2C1B18", bg2: "#180F0E" },
  "v_2": { icon: "🤝", label: "Formal Handshake", color: "#4E73DF", altColor: "#224ABE", bg1: "#1A2238", bg2: "#0E1322" },
  "v_3": { icon: "🙏", label: "Thank You", color: "#1CC88A", altColor: "#13855c", bg1: "#142D23", bg2: "#0B1A14" },
  "v_4": { icon: "🤲", label: "Please / Welcome", color: "#F6C23E", altColor: "#dda20a", bg1: "#2E2510", bg2: "#191408" },
  "v_5": { icon: "✅", label: "Yes / Affirmative", color: "#2ECC71", altColor: "#27AE60", bg1: "#122B1E", bg2: "#0A1911" },
  "v_6": { icon: "🚫", label: "No / Negative", color: "#E74C3C", altColor: "#C0392B", bg1: "#301513", bg2: "#1A0A09" },
  "v_7": { icon: "🎩", label: "Goodbye Formal", color: "#8E44AD", altColor: "#9B59B6", bg1: "#251430", bg2: "#140A1B" },
  "v_8": { icon: "✌️", label: "Bye Informal", color: "#E67E22", altColor: "#F39C12", bg1: "#2D1B10", bg2: "#180D07" },
  "v_9": { icon: "👍", label: "Good / Well", color: "#2ECC71", altColor: "#1ABC9C", bg1: "#112B24", bg2: "#0A1B16" },
  "v_10": { icon: "👎", label: "Bad / Poor", color: "#E74C3C", altColor: "#D35400", bg1: "#2D1510", bg2: "#190B08" },
  "v_11": { icon: "🙇", label: "Excuse Me / Sorry", color: "#3498DB", altColor: "#2980B9", bg1: "#132333", bg2: "#09121B" },

  // Pronouns & Questions (v_12 - v_24)
  "v_12": { icon: "🪞", label: "I / Me", color: "#36B9CC", altColor: "#258391", bg1: "#132A2F", bg2: "#09171A" },
  "v_13": { icon: "🫵", label: "You", color: "#4E73DF", altColor: "#2E59D9", bg1: "#17203B", bg2: "#0C1120" },
  "v_14": { icon: "👨", label: "He", color: "#3498DB", altColor: "#1F618D", bg1: "#132333", bg2: "#0A131C" },
  "v_15": { icon: "👩", label: "She", color: "#E84393", altColor: "#D63031", bg1: "#301321", bg2: "#1B0912" },
  "v_16": { icon: "👥", label: "We", color: "#6C5CE7", altColor: "#5842B8", bg1: "#1F1A3B", bg2: "#100D21" },
  "v_17": { icon: "👔", label: "You Plural / Formal", color: "#00CEC9", altColor: "#0984E3", bg1: "#10292E", bg2: "#08171A" },
  "v_18": { icon: "🌐", label: "They", color: "#FD79A8", altColor: "#E84393", bg1: "#311823", bg2: "#1B0B13" },
  "v_19": { icon: "❓", label: "Who", color: "#F39C12", altColor: "#D68910", bg1: "#2D200E", bg2: "#181106" },
  "v_20": { icon: "📦", label: "What", color: "#F1C40F", altColor: "#F39C12", bg1: "#2D240E", bg2: "#191406" },
  "v_21": { icon: "📍", label: "Where", color: "#E74C3C", altColor: "#C0392B", bg1: "#2E1513", bg2: "#190A09" },
  "v_22": { icon: "⏰", label: "When", color: "#3498DB", altColor: "#2980B9", bg1: "#132333", bg2: "#09121B" },
  "v_23": { icon: "🤔", label: "Why", color: "#9B59B6", altColor: "#8E44AD", bg1: "#251430", bg2: "#140A1B" },
  "v_24": { icon: "⚙️", label: "How", color: "#1ABC9C", altColor: "#16A085", bg1: "#102925", bg2: "#081714" },

  // Nouns (v_25 - v_36)
  "v_25": { icon: "🚶", label: "Person", color: "#34495E", altColor: "#2C3E50", bg1: "#1B242E", bg2: "#0E141A" },
  "v_26": { icon: "🫂", label: "Friend", color: "#2ECC71", altColor: "#27AE60", bg1: "#142B1E", bg2: "#0A170F" },
  "v_27": { icon: "👨‍👩‍👧", label: "Family", color: "#E67E22", altColor: "#D35400", bg1: "#2E1C11", bg2: "#190E08" },
  "v_28": { icon: "🏡", label: "House", color: "#E74C3C", altColor: "#C0392B", bg1: "#2E1513", bg2: "#1A0A09" },
  "v_29": { icon: "🏙️", label: "City", color: "#3498DB", altColor: "#2980B9", bg1: "#132435", bg2: "#09131C" },
  "v_30": { icon: "🗺️", label: "Country", color: "#27AE60", altColor: "#1E8449", bg1: "#122A1B", bg2: "#09170E" },
  "v_31": { icon: "💼", label: "Work / Job", color: "#8E44AD", altColor: "#7D3C98", bg1: "#24132F", bg2: "#130919" },
  "v_32": { icon: "📖", label: "Book", color: "#3498DB", altColor: "#2874A6", bg1: "#122333", bg2: "#09121B" },
  "v_33": { icon: "💧", label: "Water", color: "#00A8FF", altColor: "#0097E6", bg1: "#0E2436", bg2: "#06131D" },
  "v_34": { icon: "🍲", label: "Food", color: "#E67E22", altColor: "#D35400", bg1: "#2E1B10", bg2: "#190E08" },
  "v_35": { icon: "☀️", label: "Day", color: "#F39C12", altColor: "#E67E22", bg1: "#2D1E0C", bg2: "#180F05" },
  "v_36": { icon: "⏳", label: "Time", color: "#95A5A6", altColor: "#7F8C8D", bg1: "#222627", bg2: "#111414" },

  // Verbs (v_37 - v_52)
  "v_37": { icon: "🧘", label: "To Be / Exist", color: "#9B59B6", altColor: "#8E44AD", bg1: "#241330", bg2: "#13091B" },
  "v_38": { icon: "🚶‍♂️", label: "To Go Foot", color: "#3498DB", altColor: "#2980B9", bg1: "#132333", bg2: "#09121B" },
  "v_39": { icon: "🚗", label: "To Go Transport", color: "#E74C3C", altColor: "#C0392B", bg1: "#2E1513", bg2: "#1A0908" },
  "v_40": { icon: "🔨", label: "To Do / Make", color: "#F39C12", altColor: "#D68910", bg1: "#2C1E0D", bg2: "#170F06" },
  "v_41": { icon: "🗣️", label: "To Speak", color: "#2ECC71", altColor: "#27AE60", bg1: "#132A1C", bg2: "#09170E" },
  "v_42": { icon: "🧠", label: "To Know", color: "#9B59B6", altColor: "#8E44AD", bg1: "#251430", bg2: "#140A1B" },
  "v_43": { icon: "💭", label: "To Think", color: "#3498DB", altColor: "#2980B9", bg1: "#122333", bg2: "#09121C" },
  "v_44": { icon: "💫", label: "To Want", color: "#E84393", altColor: "#D63031", bg1: "#301321", bg2: "#1A0811" },
  "v_45": { icon: "👁️", label: "To See", color: "#00CEC9", altColor: "#0984E3", bg1: "#10292E", bg2: "#07171A" },
  "v_46": { icon: "👂", label: "To Hear", color: "#F1C40F", altColor: "#F39C12", bg1: "#2D250E", bg2: "#191406" },
  "v_47": { icon: "📚", label: "To Read", color: "#3498DB", altColor: "#2874A6", bg1: "#122333", bg2: "#09121B" },
  "v_48": { icon: "✍️", label: "To Write", color: "#8E44AD", altColor: "#6C3483", bg1: "#23112E", bg2: "#120818" },
  "v_49": { icon: "💡", label: "To Understand", color: "#F39C12", altColor: "#E67E22", bg1: "#2D1D0C", bg2: "#180E05" },
  "v_50": { icon: "💻", label: "To Work", color: "#34495E", altColor: "#2C3E50", bg1: "#1A222B", bg2: "#0D1217" },
  "v_51": { icon: "❤️", label: "To Love", color: "#E74C3C", altColor: "#C0392B", bg1: "#301413", bg2: "#1A0908" },
  "v_52": { icon: "🌿", label: "To Live", color: "#2ECC71", altColor: "#27AE60", bg1: "#122B1E", bg2: "#09170F" },

  // Adjectives (v_53 - v_67)
  "v_53": { icon: "🆕", label: "New", color: "#38BDF8", altColor: "#0284C7", bg1: "#0F2633", bg2: "#07141C" },
  "v_54": { icon: "🏛️", label: "Old", color: "#94A3B8", altColor: "#64748B", bg1: "#212730", bg2: "#10141A" },
  "v_55": { icon: "🌟", label: "Good", color: "#FBBF24", altColor: "#D97706", bg1: "#2D220B", bg2: "#191204" },
  "v_56": { icon: "🥀", label: "Bad", color: "#F87171", altColor: "#DC2626", bg1: "#301515", bg2: "#1B0A0A" },
  "v_57": { icon: "🏔️", label: "Big / Large", color: "#6366F1", altColor: "#4F46E5", bg1: "#1A1A3B", bg2: "#0D0D20" },
  "v_58": { icon: "🐣", label: "Small / Little", color: "#FDE047", altColor: "#CA8A04", bg1: "#2B2609", bg2: "#171403" },
  "v_59": { icon: "🌺", label: "Beautiful", color: "#EC4899", altColor: "#DB2777", bg1: "#311425", bg2: "#1A0913" },
  "v_60": { icon: "⚡", label: "Fast / Quick", color: "#F59E0B", altColor: "#D97706", bg1: "#2D1D09", bg2: "#180E03" },
  "v_61": { icon: "🐌", label: "Slow", color: "#10B981", altColor: "#059669", bg1: "#102920", bg2: "#081711" },
  "v_62": { icon: "💎", label: "Expensive", color: "#818CF8", altColor: "#6366F1", bg1: "#1B1C3D", bg2: "#0D0E22" },
  "v_63": { icon: "🏷️", label: "Cheap", color: "#34D399", altColor: "#10B981", bg1: "#122A21", bg2: "#081711" },
  "v_64": { icon: "❄️", label: "Cold", color: "#67E8F9", altColor: "#06B6D4", bg1: "#102B32", bg2: "#07171B" },
  "v_65": { icon: "🔥", label: "Hot", color: "#FB923C", altColor: "#EA580C", bg1: "#30190D", bg2: "#1B0D05" },
  "v_66": { icon: "🧗", label: "Difficult", color: "#A855F7", altColor: "#9333EA", bg1: "#251338", bg2: "#13081E" },
  "v_67": { icon: "🪶", label: "Easy / Light", color: "#38BDF8", altColor: "#0284C7", bg1: "#102634", bg2: "#07141C" },

  // Travel & Dining (v_68 - v_77)
  "v_68": { icon: "✈️", label: "Airport", color: "#38BDF8", altColor: "#0284C7", bg1: "#0F2533", bg2: "#07131B" },
  "v_69": { icon: "🎫", label: "Ticket", color: "#F59E0B", altColor: "#D97706", bg1: "#2C1E0A", bg2: "#170F04" },
  "v_70": { icon: "🏨", label: "Hotel", color: "#818CF8", altColor: "#4F46E5", bg1: "#1A1B3B", bg2: "#0D0D20" },
  "v_71": { icon: "🍽️", label: "Restaurant", color: "#F43F5E", altColor: "#E11D48", bg1: "#30121A", bg2: "#1A080D" },
  "v_72": { icon: "📋", label: "Menu", color: "#FB923C", altColor: "#EA580C", bg1: "#2E1A0E", bg2: "#190D06" },
  "v_73": { icon: "🧾", label: "Bill / Check", color: "#94A3B8", altColor: "#64748B", bg1: "#1E242C", bg2: "#0F1217" },
  "v_74": { icon: "🏪", label: "Store / Shop", color: "#34D399", altColor: "#059669", bg1: "#122A20", bg2: "#081711" },
  "v_75": { icon: "💰", label: "How Much Cost", color: "#FBBF24", altColor: "#D97706", bg1: "#2D220A", bg2: "#181204" },
  "v_76": { icon: "🆘", label: "Help SOS", color: "#EF4444", altColor: "#DC2626", bg1: "#311313", bg2: "#1C0808" },
  "v_77": { icon: "🧭", label: "Where Located", color: "#2DD4BF", altColor: "#0D9488", bg1: "#112B27", bg2: "#081815" },

  // Numbers & Time (v_78 - v_90)
  "v_78": { icon: "1️⃣", label: "One", color: "#60A5FA", altColor: "#2563EB", bg1: "#132338", bg2: "#08111D" },
  "v_79": { icon: "2️⃣", label: "Two", color: "#34D399", altColor: "#059669", bg1: "#112A20", bg2: "#081710" },
  "v_80": { icon: "3️⃣", label: "Three", color: "#FBBF24", altColor: "#D97706", bg1: "#2C2209", bg2: "#171203" },
  "v_81": { icon: "4️⃣", label: "Four", color: "#FB923C", altColor: "#EA580C", bg1: "#2E1A0C", bg2: "#190D05" },
  "v_82": { icon: "5️⃣", label: "Five", color: "#F43F5E", altColor: "#E11D48", bg1: "#301319", bg2: "#1A080C" },
  "v_83": { icon: "🔟", label: "Ten", color: "#A855F7", altColor: "#9333EA", bg1: "#251338", bg2: "#13081E" },
  "v_84": { icon: "💯", label: "One Hundred", color: "#EF4444", altColor: "#B91C1C", bg1: "#311212", bg2: "#1B0707" },
  "v_85": { icon: "📅", label: "Today", color: "#38BDF8", altColor: "#0284C7", bg1: "#0F2634", bg2: "#07141C" },
  "v_86": { icon: "⏪", label: "Yesterday", color: "#94A3B8", altColor: "#64748B", bg1: "#20252D", bg2: "#0F1217" },
  "v_87": { icon: "⏩", label: "Tomorrow", color: "#FB923C", altColor: "#EA580C", bg1: "#2F190D", bg2: "#190C05" },
  "v_88": { icon: "⏱️", label: "Hour", color: "#FBBF24", altColor: "#D97706", bg1: "#2C2109", bg2: "#171103" },
  "v_89": { icon: "🗓️", label: "Week", color: "#818CF8", altColor: "#4F46E5", bg1: "#1A1A3B", bg2: "#0C0D20" },
  "v_90": { icon: "🌙", label: "Month", color: "#C084FC", altColor: "#9333EA", bg1: "#27163B", bg2: "#140920" },

  // Social & Conversation (v_91 - v_96)
  "v_91": { icon: "💬", label: "How Are You", color: "#38BDF8", altColor: "#0284C7", bg1: "#0F2534", bg2: "#06131D" },
  "v_92": { icon: "🪪", label: "What Is Your Name", color: "#818CF8", altColor: "#4F46E5", bg1: "#191A3A", bg2: "#0B0C1E" },
  "v_93": { icon: "🤝", label: "Nice To Meet You", color: "#34D399", altColor: "#059669", bg1: "#112A20", bg2: "#071711" },
  "v_94": { icon: "🤷", label: "I Don't Understand", color: "#FBBF24", altColor: "#D97706", bg1: "#2C2009", bg2: "#171003" },
  "v_95": { icon: "🇬🇧", label: "Do You Speak English", color: "#60A5FA", altColor: "#2563EB", bg1: "#122238", bg2: "#07111D" },
  "v_96": { icon: "🚻", label: "Where Is Restroom", color: "#2DD4BF", altColor: "#0D9488", bg1: "#102B27", bg2: "#071714" },

  // Additional Common Vocabulary (v_97 - v_120)
  "v_97": { icon: "💖", label: "Love", color: "#EC4899", altColor: "#DB2777", bg1: "#311325", bg2: "#1B0813" },
  "v_98": { icon: "😄", label: "Happiness", color: "#FBBF24", altColor: "#F59E0B", bg1: "#2D2209", bg2: "#181203" },
  "v_99": { icon: "☀️", label: "Sun", color: "#F59E0B", altColor: "#D97706", bg1: "#2E1C08", bg2: "#190E03" },
  "v_100": { icon: "⛅", label: "Weather", color: "#38BDF8", altColor: "#0284C7", bg1: "#102634", bg2: "#07141C" },
  "v_101": { icon: "🎓", label: "Smart / Clever", color: "#818CF8", altColor: "#4F46E5", bg1: "#1A1A3B", bg2: "#0C0C20" },
  "v_102": { icon: "😢", label: "Sad", color: "#64748B", altColor: "#475569", bg1: "#1C212A", bg2: "#0E1116" },
  "v_103": { icon: "🥳", label: "Happy", color: "#F43F5E", altColor: "#E11D48", bg1: "#30131A", bg2: "#1A080E" },
  "v_104": { icon: "😋", label: "Delicious / Tasty", color: "#FB923C", altColor: "#EA580C", bg1: "#2E1A0C", bg2: "#190D05" },
  "v_105": { icon: "🍞", label: "Bread", color: "#D97706", altColor: "#B45309", bg1: "#2B1A08", bg2: "#170D03" },
  "v_106": { icon: "🍵", label: "Tea", color: "#10B981", altColor: "#047857", bg1: "#0F291E", bg2: "#06160F" },
  "v_107": { icon: "☕", label: "Coffee", color: "#78350F", altColor: "#451A03", bg1: "#251408", bg2: "#130903" },
  "v_108": { icon: "🥛", label: "Milk", color: "#CBD5E1", altColor: "#94A3B8", bg1: "#22272E", bg2: "#101418" },
  "v_109": { icon: "🪟", label: "Window", color: "#38BDF8", altColor: "#0284C7", bg1: "#0F2634", bg2: "#07131B" },
  "v_110": { icon: "🚪", label: "Door", color: "#B45309", altColor: "#78350F", bg1: "#291708", bg2: "#150A03" },
  "v_111": { icon: "🚙", label: "Car", color: "#3B82F6", altColor: "#1D4ED8", bg1: "#122137", bg2: "#08101C" },
  "v_112": { icon: "🛣️", label: "Road / Way", color: "#64748B", altColor: "#334155", bg1: "#1B2129", bg2: "#0E1116" },
  "v_113": { icon: "🏷️", label: "Name", color: "#F59E0B", altColor: "#D97706", bg1: "#2D1D09", bg2: "#180E03" },
  "v_114": { icon: "🇷🇺", label: "Speak Russian", color: "#EF4444", altColor: "#1D4ED8", bg1: "#271624", bg2: "#130A14" },
  "v_115": { icon: "🌻", label: "Have A Nice Day", color: "#FBBF24", altColor: "#F59E0B", bg1: "#2E2108", bg2: "#181103" },
  "v_116": { icon: "💡", label: "Understand Russian", color: "#38BDF8", altColor: "#EF4444", bg1: "#161D2B", bg2: "#0A0D15" },
  "v_117": { icon: "🏷️", label: "How Much Is This", color: "#FBBF24", altColor: "#D97706", bg1: "#2D2209", bg2: "#171103" },
  "v_118": { icon: "🚇", label: "Where Is Metro", color: "#EF4444", altColor: "#DC2626", bg1: "#301313", bg2: "#1B0808" },
  "v_119": { icon: "❓", label: "I Don't Know", color: "#94A3B8", altColor: "#64748B", bg1: "#1F252D", bg2: "#0F1217" },
  "v_120": { icon: "🍀", label: "Good Luck", color: "#10B981", altColor: "#059669", bg1: "#10291F", bg2: "#071610" }
};

// SVG Themes Generator - Pure Text-Free Visual Art Filling Full Card
function generateSVG(word, visual, theme) {
  const icon = visual.icon || "📌";
  const primaryColor = visual.color || "#4E73DF";
  const accentColor = visual.altColor || "#224ABE";
  const bg1 = visual.bg1 || "#1F2937";
  const bg2 = visual.bg2 || "#111827";

  // 1. 3D CLAY / TACTILE THEME
  if (theme === "clay") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 480" width="100%" height="100%">
  <defs>
    <radialGradient id="clayBg_${word.id}" cx="35%" cy="30%" r="85%">
      <stop offset="0%" stop-color="${bg1}" />
      <stop offset="60%" stop-color="${bg2}" />
      <stop offset="100%" stop-color="#08060D" />
    </radialGradient>
    <radialGradient id="claySphere_${word.id}" cx="32%" cy="28%" r="70%">
      <stop offset="0%" stop-color="${primaryColor}" />
      <stop offset="55%" stop-color="${accentColor}" />
      <stop offset="100%" stop-color="#0A0812" />
    </radialGradient>
    <radialGradient id="clayHighlight_${word.id}" cx="35%" cy="25%" r="50%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.35" />
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0" />
    </radialGradient>
    <filter id="clayShadow_${word.id}" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="24" stdDeviation="20" flood-color="rgba(0,0,0,0.65)" />
      <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="rgba(0,0,0,0.4)" />
    </filter>
    <filter id="softGlow_${word.id}" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="35" result="blur" />
    </filter>
  </defs>

  <!-- Full Bleed Card Background -->
  <rect width="360" height="480" fill="url(#clayBg_${word.id})" />

  <!-- Ambient Light Backdrop Orb -->
  <circle cx="180" cy="230" r="140" fill="${primaryColor}" opacity="0.18" filter="url(#softGlow_${word.id})" />
  
  <!-- Outer Rounded Podium Ring -->
  <rect x="40" y="80" width="280" height="320" rx="48" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="3" />
  
  <!-- 3D Clay Central Sphere -->
  <g filter="url(#clayShadow_${word.id})">
    <circle cx="180" cy="235" r="105" fill="url(#claySphere_${word.id})" />
    <circle cx="180" cy="235" r="105" fill="url(#clayHighlight_${word.id})" />
  </g>

  <!-- Large Central Semantic Visual Icon -->
  <text x="180" y="248" font-size="92" text-anchor="middle" dominant-baseline="middle" filter="drop-shadow(0 8px 16px rgba(0,0,0,0.4))">${icon}</text>

  <!-- Bottom Visual Anchor Rings -->
  <ellipse cx="180" cy="370" rx="90" ry="16" fill="black" opacity="0.3" filter="url(#softGlow_${word.id})" />
  <circle cx="180" cy="430" r="4" fill="${primaryColor}" opacity="0.4" />
  <circle cx="164" cy="430" r="2.5" fill="${primaryColor}" opacity="0.2" />
  <circle cx="196" cy="430" r="2.5" fill="${primaryColor}" opacity="0.2" />
</svg>`;
  }

  // 2. MODERN FLAT VECTOR THEME
  if (theme === "vector") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 480" width="100%" height="100%">
  <defs>
    <linearGradient id="vecBg_${word.id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${bg1}" />
      <stop offset="100%" stop-color="#0B0F17" />
    </linearGradient>
    <linearGradient id="vecAccent_${word.id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${primaryColor}" />
      <stop offset="100%" stop-color="${accentColor}" />
    </linearGradient>
    <pattern id="vecGrid_${word.id}" width="24" height="24" patternUnits="userSpaceOnUse">
      <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1" />
    </pattern>
  </defs>

  <!-- Full Bleed Background with subtle geometric texture -->
  <rect width="360" height="480" fill="url(#vecBg_${word.id})" />
  <rect width="360" height="480" fill="url(#vecGrid_${word.id})" />

  <!-- Geometric Framed Elements -->
  <rect x="35" y="60" width="290" height="360" rx="32" fill="rgba(255,255,255,0.03)" stroke="${primaryColor}" stroke-opacity="0.25" stroke-width="2" />
  
  <!-- Diagonal accent stripes -->
  <path d="M45,70 L110,70 L70,110 Z" fill="${primaryColor}" opacity="0.15" />
  <path d="M315,410 L250,410 L290,370 Z" fill="${accentColor}" opacity="0.15" />

  <!-- Center Hexagon / Circular Shield -->
  <polygon points="180,125 270,175 270,295 180,345 90,295 90,175" fill="url(#vecAccent_${word.id})" opacity="0.2" stroke="${primaryColor}" stroke-width="2" />
  <circle cx="180" cy="235" r="85" fill="url(#vecAccent_${word.id})" />
  
  <!-- Semantic Icon -->
  <text x="180" y="248" font-size="88" text-anchor="middle" dominant-baseline="middle">${icon}</text>

  <!-- Framing Accents -->
  <circle cx="180" cy="400" r="5" fill="${primaryColor}" />
  <line x1="140" y1="400" x2="165" y2="400" stroke="${primaryColor}" stroke-width="2" opacity="0.5" />
  <line x1="195" y1="400" x2="220" y2="400" stroke="${primaryColor}" stroke-width="2" opacity="0.5" />
</svg>`;
  }

  // 3. STORYBOOK WATERCOLOR THEME
  if (theme === "storybook") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 480" width="100%" height="100%">
  <defs>
    <radialGradient id="storyBg_${word.id}" cx="50%" cy="40%" r="75%">
      <stop offset="0%" stop-color="#2D2138" />
      <stop offset="70%" stop-color="#160F1E" />
      <stop offset="100%" stop-color="#0B0710" />
    </radialGradient>
    <linearGradient id="watercolor_${word.id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FDE68A" stop-opacity="0.85" />
      <stop offset="50%" stop-color="${primaryColor}" stop-opacity="0.9" />
      <stop offset="100%" stop-color="${accentColor}" stop-opacity="0.95" />
    </linearGradient>
    <filter id="inkBleed_${word.id}">
      <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise" />
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="6" />
    </filter>
  </defs>

  <!-- Full Bleed Canvas Background -->
  <rect width="360" height="480" fill="url(#storyBg_${word.id})" />

  <!-- Stars & Fairy Dust in Background -->
  <circle cx="65" cy="75" r="3" fill="#FDE68A" opacity="0.7" />
  <circle cx="295" cy="95" r="2.5" fill="#FDE68A" opacity="0.8" />
  <circle cx="60" cy="400" r="2" fill="#FDE68A" opacity="0.6" />
  <circle cx="300" cy="385" r="3.5" fill="#FDE68A" opacity="0.75" />
  <circle cx="180" cy="55" r="2" fill="#FDE68A" opacity="0.5" />

  <!-- Organic Watercolor Splash Blob -->
  <path d="M180,95 C265,105 295,175 285,245 C275,325 215,355 175,350 C115,345 75,305 75,235 C75,165 115,85 180,95 Z" fill="url(#watercolor_${word.id})" opacity="0.45" filter="url(#inkBleed_${word.id})" />

  <!-- Storybook Ink Circle Frame -->
  <circle cx="180" cy="235" r="95" fill="#FAF5FF" opacity="0.12" stroke="#E9D5FF" stroke-width="2.5" stroke-dasharray="6,4" />
  <circle cx="180" cy="235" r="82" fill="none" stroke="#FDE68A" stroke-width="1" opacity="0.6" />

  <!-- Semantic Visual Icon -->
  <text x="180" y="248" font-size="94" text-anchor="middle" dominant-baseline="middle" filter="drop-shadow(0 6px 12px rgba(0,0,0,0.5))">${icon}</text>

  <!-- Bottom Botanical Motif -->
  <path d="M150,420 Q180,405 210,420 Q180,410 150,420 Z" fill="#FDE68A" opacity="0.6" />
  <circle cx="180" cy="412" r="3" fill="#E9D5FF" />
</svg>`;
  }

  // 4. GLOSSY FROSTED 3D THEME
  if (theme === "glossy") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 480" width="100%" height="100%">
  <defs>
    <linearGradient id="glossyBg_${word.id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#120D24" />
      <stop offset="60%" stop-color="#0A0617" />
      <stop offset="100%" stop-color="#03010A" />
    </linearGradient>
    <linearGradient id="neonGlow_${word.id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${primaryColor}" />
      <stop offset="50%" stop-color="${accentColor}" />
      <stop offset="100%" stop-color="#C084FC" />
    </linearGradient>
    <filter id="glossGlow_${word.id}" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="40" result="blur" />
    </filter>
  </defs>

  <!-- Full Bleed Ultra Dark Background -->
  <rect width="360" height="480" fill="url(#glossyBg_${word.id})" />

  <!-- Vivid Neon Glow Core -->
  <circle cx="180" cy="235" r="120" fill="url(#neonGlow_${word.id})" opacity="0.32" filter="url(#glossGlow_${word.id})" />

  <!-- Frosted Glass Card Container -->
  <rect x="45" y="85" width="270" height="300" rx="36" fill="rgba(255,255,255,0.06)" stroke="url(#neonGlow_${word.id})" stroke-width="2.5" />
  
  <!-- Glass Top Reflection Specular Highlight -->
  <path d="M55,100 Q180,85 305,100 L305,140 Q180,120 55,140 Z" fill="rgba(255,255,255,0.12)" />

  <!-- Frosted Inner Orb -->
  <circle cx="180" cy="235" r="85" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.2)" stroke-width="1.5" />
  
  <!-- Semantic Visual Icon -->
  <text x="180" y="248" font-size="94" text-anchor="middle" dominant-baseline="middle" filter="drop-shadow(0 10px 24px rgba(0,0,0,0.6))">${icon}</text>

  <!-- Bottom Tech Accent -->
  <rect x="150" y="420" width="60" height="4" rx="2" fill="url(#neonGlow_${word.id})" opacity="0.7" />
  <circle cx="135" cy="422" r="2" fill="#C084FC" opacity="0.6" />
  <circle cx="225" cy="422" r="2" fill="#C084FC" opacity="0.6" />
</svg>`;
  }
}

// Generate assets for all 120 words across all 4 themes
let totalGenerated = 0;

vocabulary.forEach((word) => {
  if (!word.id || !word.id.startsWith("v_")) return;
  const num = parseInt(word.id.replace("v_", ""), 10);
  if (isNaN(num) || num > 120) return;

  const visual = semanticVisuals[word.id] || {
    icon: "📌",
    label: word.word,
    color: "#4E73DF",
    altColor: "#224ABE",
    bg1: "#1E293B",
    bg2: "#0F172A"
  };

  themes.forEach(theme => {
    const svgCode = generateSVG(word, visual, theme);
    const filePath = path.join(__dirname, `../assets/images/words/${theme}/${word.id}.svg`);
    fs.writeFileSync(filePath, svgCode, "utf8");
    totalGenerated++;
  });
});

console.log(`Successfully generated ${totalGenerated} semantic visual assets across all 4 themes.`);
