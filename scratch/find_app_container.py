import os

base_dir = r"C:\Users\Itayu-PC\OneDrive\שולחן העבודה\Antigravity\VocRussian"
css_path = os.path.join(base_dir, "css", "styles.css")

with open(css_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

print("App Container / Body styles:")
for i, line in enumerate(lines, 1):
    if "app-container" in line.lower() or "body" in line.lower():
        start = max(0, i-3)
        end = min(len(lines), i+3)
        print(f"--- Line {i} ---")
        for j in range(start, end):
            print(f"{j+1}: {lines[j].strip()}")
