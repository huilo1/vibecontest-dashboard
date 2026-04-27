#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

IMAGE_NAME="${ANDROID_EMULATOR_IMAGE:-vibecontest/android-emulator:local}"
CONTAINER_NAME="${ANDROID_EMULATOR_CONTAINER:-vibecontest-emulator}"
SDK_DIR="${ANDROID_HOME:-$HOME/Android/Sdk}"
JDK_DIR="${JAVA_HOME:-$HOME/.local/jdks/temurin-17}"
DOCKER_ROOT="${ANDROID_DOCKER_ROOT:-$REPO_ROOT/.cache/android-docker-root}"
AVD_NAME="${ANDROID_AVD_NAME:-vibecontest-api35-kvm}"
SYSTEM_IMAGE="${ANDROID_SYSTEM_IMAGE:-system-images;android-35;google_apis;x86_64}"
DEVICE="${ANDROID_AVD_DEVICE:-pixel_6}"
BOOT_TIMEOUT="${ANDROID_BOOT_TIMEOUT:-180}"
FORCE_BUILD=0

if [[ "${1:-}" == "--build" ]]; then
  FORCE_BUILD=1
fi

require_bin() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 127
  fi
}

require_file() {
  if [[ ! -e "$1" ]]; then
    echo "$2" >&2
    exit 2
  fi
}

require_bin docker
require_file /dev/kvm "Missing /dev/kvm. Enable KVM on the host or run the regular Android Studio emulator elsewhere."
require_file "$SDK_DIR/emulator/emulator" "Android emulator not found in $SDK_DIR. Install Android SDK first."
require_file "$SDK_DIR/cmdline-tools/latest/bin/avdmanager" "avdmanager not found in $SDK_DIR/cmdline-tools/latest/bin."
require_file "$SDK_DIR/platform-tools/adb" "adb not found in $SDK_DIR/platform-tools."
require_file "$JDK_DIR/bin/java" "Java not found in $JDK_DIR. Set JAVA_HOME or install JDK 17."

mkdir -p "$DOCKER_ROOT"

if [[ "$FORCE_BUILD" == "1" ]] || ! docker image inspect "$IMAGE_NAME" >/dev/null 2>&1; then
  docker build -t "$IMAGE_NAME" -f "$REPO_ROOT/scripts/apk/Dockerfile.emulator" "$REPO_ROOT/scripts/apk"
fi

docker_args=(
  --network host
  --device /dev/kvm
  -e AVD_NAME="$AVD_NAME"
  -e SYSTEM_IMAGE="$SYSTEM_IMAGE"
  -e DEVICE="$DEVICE"
  -v "$SDK_DIR:/opt/android-sdk"
  -v "$JDK_DIR:/opt/jdk:ro"
  -v "$DOCKER_ROOT:/root"
  -v "$REPO_ROOT:/work"
  -w /work
)

docker run --rm "${docker_args[@]}" "$IMAGE_NAME" bash -lc '
  if ! avdmanager list avd | grep -q "Name: ${AVD_NAME}$"; then
    yes "" | avdmanager create avd -n "$AVD_NAME" -k "$SYSTEM_IMAGE" --device "$DEVICE" --force
  fi
'

if ! docker ps --filter "name=^/${CONTAINER_NAME}$" --format "{{.Names}}" | grep -qx "$CONTAINER_NAME"; then
  docker run -d --rm --name "$CONTAINER_NAME" "${docker_args[@]}" "$IMAGE_NAME" bash -lc '
    exec emulator -avd "$AVD_NAME" \
      -no-window \
      -no-audio \
      -no-boot-anim \
      -gpu swiftshader_indirect \
      -accel on \
      -memory 4096 \
      -cores 4 \
      -no-metrics \
      -no-snapshot-save
  ' >/dev/null
fi

export ANDROID_HOME="$SDK_DIR"
export ANDROID_SDK_ROOT="$SDK_DIR"
export PATH="$SDK_DIR/platform-tools:$PATH"

adb start-server >/dev/null
adb wait-for-device

elapsed=0
while [[ "$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" != "1" ]]; do
  sleep 2
  elapsed=$((elapsed + 2))
  if (( elapsed >= BOOT_TIMEOUT )); then
    echo "Emulator did not finish booting within ${BOOT_TIMEOUT}s." >&2
    exit 1
  fi
done

adb devices -l
echo "Emulator is ready. Run: npm run apk:smoke -- .cache/apks/<file>.apk"
