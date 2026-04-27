#!/usr/bin/env bash
set -euo pipefail

APK_PATH="${1:-}"
PACKAGE_NAME="${2:-}"

if [[ -z "$APK_PATH" ]]; then
  echo "Usage: npm run apk:smoke -- <path-to-apk> [package.name]" >&2
  exit 2
fi

if [[ ! -f "$APK_PATH" ]]; then
  echo "APK not found: $APK_PATH" >&2
  exit 2
fi

require_bin() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 127
  fi
}

require_bin adb

if ! adb get-state >/dev/null 2>&1; then
  echo "No booted Android device. Start an emulator first." >&2
  exit 1
fi

if [[ -z "$PACKAGE_NAME" ]]; then
  if command -v aapt >/dev/null 2>&1; then
    PACKAGE_NAME="$(aapt dump badging "$APK_PATH" | sed -n \"s/package: name='\\([^']*\\)'.*/\\1/p\" | head -1)"
  elif command -v apkanalyzer >/dev/null 2>&1; then
    PACKAGE_NAME="$(apkanalyzer manifest application-id "$APK_PATH" | head -1)"
  fi
fi

if [[ -z "$PACKAGE_NAME" ]]; then
  echo "Could not detect package name. Pass it as the second argument." >&2
  exit 2
fi

mkdir -p .cache/emulator

echo "Installing $APK_PATH"
adb install -r "$APK_PATH"

echo "Launching $PACKAGE_NAME"
adb shell monkey -p "$PACKAGE_NAME" -c android.intent.category.LAUNCHER 1 >/dev/null

sleep 8
adb exec-out screencap -p > ".cache/emulator/${PACKAGE_NAME}.png"
adb logcat -d -t 400 > ".cache/emulator/${PACKAGE_NAME}.log"

echo "Screenshot: .cache/emulator/${PACKAGE_NAME}.png"
echo "Logcat: .cache/emulator/${PACKAGE_NAME}.log"
