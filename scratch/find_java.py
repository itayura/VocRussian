import os, glob

base_dir = r"C:\Users\Itayu-PC\OneDrive\שולחן העבודה\Antigravity\VocRussian"
java_files = glob.glob(os.path.join(base_dir, "**", "*.java"), recursive=True) + glob.glob(os.path.join(base_dir, "**", "*.kt"), recursive=True)

print(f"Found {len(java_files)} Java/Kotlin files:")
for f in java_files:
    rel = os.path.relpath(f, base_dir)
    print(rel)
