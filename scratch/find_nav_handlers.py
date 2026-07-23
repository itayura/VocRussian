import os

base_dir = r"C:\Users\Itayu-PC\OneDrive\שולחן העבודה\Antigravity\VocRussian"
js_path = os.path.join(base_dir, "js", "app.js")

with open(js_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

print("Navigation / view switching handlers in app.js:")
for i, line in enumerate(lines, 1):
    if "showview" in line.lower() or "switchview" in line.lower() or "nav-item" in line.lower() or ("active" in line.lower() and "target" in line.lower()):
        start = max(0, i-4)
        end = min(len(lines), i+4)
        print(f"--- Line {i} ---")
        for j in range(start, end):
            print(f"{j+1}: {lines[j].strip()}")
