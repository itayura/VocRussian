#!/usr/bin/env python3
"""
Post-process Bubblewrap-generated Android project for Android 15+ edge-to-edge.

Upgrades android-browser-helper to 2.7.2 (WindowCompat.enableEdgeToEdge, splash
insets, WebView fallback API guards) and removes deprecated status/navigation
bar color manifest metadata that Play Console flags on SDK 35+.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
APP_BUILD_GRADLE = ROOT / "app" / "build.gradle"
MANIFEST = ROOT / "app" / "src" / "main" / "AndroidManifest.xml"
LAUNCHER_ACTIVITY = (
    ROOT / "app" / "src" / "main" / "java" / "com" / "itayura" / "privyetik" / "LauncherActivity.java"
)

ABH_VERSION = "2.7.2"
ABH_COORD = f"com.google.androidbrowserhelper:androidbrowserhelper:{ABH_VERSION}"

DEPRECATED_BAR_META = re.compile(
    r"\s*<meta-data\s+"
    r'android:name="(?:android\.support\.customtabs\.trusted\.(?:STATUS_BAR|NAVIGATION_BAR)[^"]*|'
    r'androix\.browser\.trusted\.NAVIGATION_BAR_DIVIDER[^"]*)"'
    r'\s+android:resource="@color/[^"]*"\s*/>\s*',
    re.MULTILINE,
)

OLD_ABH = re.compile(
    r"com\.google\.androidbrowserhelper:androidbrowserhelper:[\d.]+(?:-alpha\d+)?"
)

PROCESS_TEXT_FILTER = """            <intent-filter>
                <action android:name="android.intent.action.PROCESS_TEXT" />
                <category android:name="android.intent.category.DEFAULT" />
                <data android:mimeType="text/plain" />
            </intent-filter>"""

SEND_TEXT_FILTER = """            <intent-filter>
                <action android:name="android.intent.action.SEND" />
                <category android:name="android.intent.category.DEFAULT" />
                <data android:mimeType="text/plain" />
            </intent-filter>"""


def patch_build_gradle() -> None:
    text = APP_BUILD_GRADLE.read_text(encoding="utf-8")
    if OLD_ABH.search(text):
        text = OLD_ABH.sub(ABH_COORD, text)
    elif ABH_COORD not in text:
        raise RuntimeError(f"Could not find androidbrowserhelper dependency in {APP_BUILD_GRADLE}")

    if ABH_COORD not in text:
        raise RuntimeError("Failed to set androidbrowserhelper version")

    APP_BUILD_GRADLE.write_text(text, encoding="utf-8")
    print(f"Updated app/build.gradle -> {ABH_COORD}")


def patch_manifest() -> None:
    text = MANIFEST.read_text(encoding="utf-8")
    patched, count = DEPRECATED_BAR_META.subn("\n", text)
    patched = re.sub(r"\n{3,}", "\n\n", patched)
    launcher_end = "        </activity>"
    if "android.intent.action.PROCESS_TEXT" not in patched:
        patched = patched.replace(launcher_end, f"{PROCESS_TEXT_FILTER}\n\n{launcher_end}", 1)
    if "android.intent.action.SEND" not in patched:
        patched = patched.replace(launcher_end, f"{SEND_TEXT_FILTER}\n\n{launcher_end}", 1)

    MANIFEST.write_text(patched, encoding="utf-8")
    print(f"Removed {count} deprecated bar-color meta-data entries from AndroidManifest.xml")


def patch_launcher_activity() -> None:
    text = LAUNCHER_ACTIVITY.read_text(encoding="utf-8")
    if "import android.content.Intent;" not in text:
        text = text.replace("package com.itayura.privyetik;", "package com.itayura.privyetik;\n\nimport android.content.Intent;")
    if "import android.net.Uri;" not in text:
        text = text.replace("import android.content.Intent;", "import android.content.Intent;\nimport android.net.Uri;")

    method = """
    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        recreate();
    }

    @Override
    protected Uri getLaunchingUrl() {
        Uri uri = super.getLaunchingUrl();
        Intent intent = getIntent();
        CharSequence sharedText = intent.getCharSequenceExtra(Intent.EXTRA_PROCESS_TEXT);
        if (sharedText == null) {
            sharedText = intent.getCharSequenceExtra(Intent.EXTRA_TEXT);
        }

        if (sharedText != null && !sharedText.toString().trim().isEmpty()) {
            uri = uri.buildUpon()
                    .appendQueryParameter("add_word", sharedText.toString().trim())
                    .build();
        }
        return uri;
    }
"""
    existing = re.compile(
        r"\n\s*(?:@Override\s+protected void onNewIntent\(Intent intent\)\s*\{.*?\}\s*)?"
        r"@Override\s+protected Uri getLaunchingUrl\(\)\s*\{.*?(?=\n\})",
        re.DOTALL,
    )
    if existing.search(text):
        text = existing.sub("\n" + method.rstrip(), text, count=1)
    else:
        text = text.rsplit("}", 1)[0].rstrip() + "\n" + method + "}\n"

    LAUNCHER_ACTIVITY.write_text(text, encoding="utf-8")
    print("Configured PROCESS_TEXT and ACTION_SEND forwarding in LauncherActivity.java")


def main() -> int:
    if not APP_BUILD_GRADLE.is_file():
        print(f"Missing {APP_BUILD_GRADLE}; run bubblewrap update first.", file=sys.stderr)
        return 1
    if not MANIFEST.is_file():
        print(f"Missing {MANIFEST}; run bubblewrap update first.", file=sys.stderr)
        return 1
    if not LAUNCHER_ACTIVITY.is_file():
        print(f"Missing {LAUNCHER_ACTIVITY}; run bubblewrap update first.", file=sys.stderr)
        return 1

    patch_build_gradle()
    patch_manifest()
    patch_launcher_activity()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
