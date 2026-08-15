const fs = require("fs");
const path = require("path");

const brainDir = "C:/Users/Itayu-PC/.gemini/antigravity/brain/b67c7246-dbae-4d9f-97d9-d03c635100eb";
if (fs.existsSync(brainDir)) {
  const files = fs.readdirSync(brainDir).filter(f => f.endsWith(".jpg"));
  files.forEach(f => {
    if (f.startsWith("style_3d_clay")) {
      fs.copyFileSync(path.join(brainDir, f), path.join(__dirname, "../assets/images/words/clay/v_32.jpg"));
    }
    if (f.startsWith("style_flat_vector")) {
      fs.copyFileSync(path.join(brainDir, f), path.join(__dirname, "../assets/images/words/vector/v_32.jpg"));
    }
    if (f.startsWith("style_storybook")) {
      fs.copyFileSync(path.join(brainDir, f), path.join(__dirname, "../assets/images/words/storybook/v_32.jpg"));
    }
    if (f.startsWith("style_glossy_3d")) {
      fs.copyFileSync(path.join(brainDir, f), path.join(__dirname, "../assets/images/words/glossy/v_32.jpg"));
    }
  });
  console.log("Successfully copied custom AI renders for v_32.");
}
