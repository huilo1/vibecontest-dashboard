#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SDK_DIR="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-$HOME/Android/Sdk}}"
BATCH_DIR="${APK_SMOKE_BATCH_DIR:-$REPO_ROOT/.cache/emulator/batch-$(date +%Y%m%d-%H%M%S)}"

export ANDROID_HOME="$SDK_DIR"
export ANDROID_SDK_ROOT="$SDK_DIR"
export PATH="$SDK_DIR/platform-tools:$PATH"

mkdir -p "$BATCH_DIR"

if [[ "$#" -gt 0 ]]; then
  apks=("$@")
else
  shopt -s nullglob
  apks=("$REPO_ROOT"/.cache/apks/*.apk)
fi

if [[ "${#apks[@]}" -eq 0 ]]; then
  echo "No APK files found. Run npm run analyze first." >&2
  exit 2
fi

printf 'Batch: %s\n' "$BATCH_DIR" | tee "$BATCH_DIR/summary.txt"

for apk in "${apks[@]}"; do
  name="$(basename "$apk" .apk)"
  output="$BATCH_DIR/$name.out"

  printf '\n=== %s ===\n' "$name" | tee -a "$BATCH_DIR/summary.txt"
  if bash "$REPO_ROOT/scripts/apk/smoke-emulator.sh" "$apk" > "$output" 2>&1; then
    printf 'OK %s\n' "$name" | tee -a "$BATCH_DIR/summary.txt"
    rg 'Screenshot:|Logcat:|Launching' "$output" | tee -a "$BATCH_DIR/summary.txt" || true
  else
    code=$?
    printf 'FAIL %s code=%s\n' "$name" "$code" | tee -a "$BATCH_DIR/summary.txt"
    tail -80 "$output" | tee -a "$BATCH_DIR/summary.txt"
  fi

  adb shell input keyevent KEYCODE_HOME >/dev/null 2>&1 || true
  sleep 2
done

printf '\nDONE\n' | tee -a "$BATCH_DIR/summary.txt"
echo "$BATCH_DIR"
