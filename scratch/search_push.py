import os

base_dir = r"C:\Users\Itayu-PC\OneDrive\שולחן העבודה\Antigravity\VocRussian"
files = [
    os.path.join(base_dir, "js", "app.js"),
    os.path.join(base_dir, "sw.js")
]

for fpath in files:
    filename = os.path.basename(fpath)
    with open(fpath, "r", encoding="utf-8") as f:
        for i, line in enumerate(f, 1):
            if "push" in line.lower() or "notification" in line.lower() or "subscribe" in line.lower():
                print(f"{filename}:{i}: {line.strip()[:100]}")
