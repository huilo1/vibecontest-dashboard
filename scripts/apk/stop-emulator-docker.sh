#!/usr/bin/env bash
set -euo pipefail

CONTAINER_NAME="${ANDROID_EMULATOR_CONTAINER:-vibecontest-emulator}"
SDK_DIR="${ANDROID_HOME:-$HOME/Android/Sdk}"

if [[ -x "$SDK_DIR/platform-tools/adb" ]]; then
  export ANDROID_HOME="$SDK_DIR"
  export ANDROID_SDK_ROOT="$SDK_DIR"
  export PATH="$SDK_DIR/platform-tools:$PATH"
  adb emu kill >/dev/null 2>&1 || true
fi

if docker ps --filter "name=^/${CONTAINER_NAME}$" --format "{{.Names}}" | grep -qx "$CONTAINER_NAME"; then
  docker stop "$CONTAINER_NAME" >/dev/null
  echo "Stopped $CONTAINER_NAME"
else
  echo "No running $CONTAINER_NAME container"
fi
