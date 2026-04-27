#!/usr/bin/env bash
set -euo pipefail

APK_PATH="${1:-}"
PACKAGE_NAME="${2:-}"
SDK_DIR="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-$HOME/Android/Sdk}}"
WORK_APK="$APK_PATH"
TEMP_DIR=""

cleanup() {
  if [[ -n "$TEMP_DIR" && -d "$TEMP_DIR" ]]; then
    rm -rf "$TEMP_DIR"
  fi
}
trap cleanup EXIT

if [[ -d "$SDK_DIR" ]]; then
  export ANDROID_HOME="$SDK_DIR"
  export ANDROID_SDK_ROOT="$SDK_DIR"
  export PATH="$SDK_DIR/platform-tools:$SDK_DIR/emulator:$SDK_DIR/cmdline-tools/latest/bin:$PATH"

  if [[ -d "$SDK_DIR/build-tools" ]]; then
    LATEST_BUILD_TOOLS="$(find "$SDK_DIR/build-tools" -mindepth 1 -maxdepth 1 -type d | sort -V | tail -1)"
    if [[ -n "$LATEST_BUILD_TOOLS" ]]; then
      export PATH="$LATEST_BUILD_TOOLS:$PATH"
    fi
  fi
fi

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

detect_package_name() {
  if command -v aapt >/dev/null 2>&1; then
    aapt dump badging "$1" 2>/dev/null | sed -n "s/package: name='\([^']*\)'.*/\1/p" | head -1 || true
  elif command -v apkanalyzer >/dev/null 2>&1; then
    apkanalyzer manifest application-id "$1" 2>/dev/null | head -1 || true
  fi
}

if [[ -z "$PACKAGE_NAME" ]]; then
  PACKAGE_NAME="$(detect_package_name "$WORK_APK")"
fi

if [[ -z "$PACKAGE_NAME" ]] && command -v unzip >/dev/null 2>&1; then
  NESTED_APK="$(unzip -Z1 "$APK_PATH" 2>/dev/null | grep -Ei '\.apk$' | head -1 || true)"
  if [[ -n "$NESTED_APK" ]]; then
    TEMP_DIR="$(mktemp -d)"
    WORK_APK="$TEMP_DIR/$(basename "$NESTED_APK")"
    unzip -p "$APK_PATH" "$NESTED_APK" > "$WORK_APK"
    PACKAGE_NAME="$(detect_package_name "$WORK_APK")"
  fi
fi

if [[ -z "$PACKAGE_NAME" ]]; then
  echo "Could not detect package name. Pass it as the second argument." >&2
  exit 2
fi

mkdir -p .cache/emulator
ARTIFACT_NAME="$(basename "$APK_PATH")"
ARTIFACT_NAME="${ARTIFACT_NAME%.*}"

echo "Installing $WORK_APK"
adb install -r "$WORK_APK"

echo "Launching $PACKAGE_NAME"
adb shell monkey -p "$PACKAGE_NAME" -c android.intent.category.LAUNCHER 1 >/dev/null

sleep 8
adb exec-out screencap -p > ".cache/emulator/${ARTIFACT_NAME}.${PACKAGE_NAME}.png"
adb logcat -d -t 400 > ".cache/emulator/${ARTIFACT_NAME}.${PACKAGE_NAME}.log"

echo "Screenshot: .cache/emulator/${ARTIFACT_NAME}.${PACKAGE_NAME}.png"
echo "Logcat: .cache/emulator/${ARTIFACT_NAME}.${PACKAGE_NAME}.log"
