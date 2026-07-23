import os

base_dir = r"C:\Users\Itayu-PC\OneDrive\שולחן העבודה\Antigravity\VocRussian"
css_path = os.path.join(base_dir, "css", "styles.css")

with open(css_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

print("CSS Aside / Nav styles:")
for i, line in enumerate(lines, 1):
    if "aside" in line.lower() or "bottom" in line.lower() or "nav" in line.lower() or "fixed" in line.lower() or "absolute" in line.lower() or "z-index" in line.lower():
        # print line and surrounding 2 lines if possible
        start = max(0, i-2)
        end = min(len(lines), i+2)
        print(f"--- Line {i} ---")
        for j in range(start, end):
            print(f"{j+1}: {lines[j].strip()}")
