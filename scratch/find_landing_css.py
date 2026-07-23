import os

base_dir = r"C:\Users\Itayu-PC\OneDrive\שולחן העבודה\Antigravity\VocRussian"
css_path = os.path.join(base_dir, "css", "styles.css")

with open(css_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines, 1):
    if "landing" in line.lower() and "display" in line.lower():
        print(f"Line {i}: {line.strip()}")
