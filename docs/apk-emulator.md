# APK emulator checklist

This repo supports a local smoke-test loop for downloaded contest APKs. The most reliable setup on the current host is Android SDK on the host plus a headless emulator inside Docker with `/dev/kvm` mounted into the container.

Current machine setup:

- JDK 17: `~/.local/jdks/temurin-17`
- Android SDK: `~/Android/Sdk`
- AVD name: `vibecontest-api35-kvm`
- Docker image: `vibecontest/android-emulator:local`

The host user is not in the `kvm` group, so running the emulator directly on the host falls back to software acceleration and is too slow. Docker works here because the container can receive `/dev/kvm` explicitly.

## Install Android tooling

1. Install Android Studio or command line tools.
2. Add SDK tools to `PATH`:

```bash
export ANDROID_HOME="$HOME/Android/Sdk"
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"
```

3. Create an API 35 emulator:

```bash
sdkmanager "platform-tools" "emulator" "platforms;android-35" "system-images;android-35;google_apis;x86_64"
avdmanager create avd -n vibecontest-api35 -k "system-images;android-35;google_apis;x86_64" --device "pixel_6"
```

The smoke script also uses `aapt` when it is available:

```bash
sdkmanager "build-tools;35.0.0"
export PATH="$ANDROID_HOME/build-tools/35.0.0:$PATH"
```

## Start the Docker/KVM emulator

```bash
export JAVA_HOME="$HOME/.local/jdks/temurin-17"
export ANDROID_HOME="$HOME/Android/Sdk"
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/build-tools/35.0.0:$PATH"
npm run apk:emulator:start
```

Use `npm run apk:emulator:start -- --build` after changing `scripts/apk/Dockerfile.emulator`.

Stop it after review:

```bash
npm run apk:emulator:stop
```

## Run a smoke test

```bash
npm run analyze
npm run apk:emulator:start
npm run apk:smoke -- .cache/apks/калинин-михаил-павлович.apk
```

If package detection fails, pass the package name explicitly:

```bash
npm run apk:smoke -- .cache/apks/инжутов-дмитрий-сергеевич.apk com.example.bbplay
```

The script installs the APK, launches the main activity with `monkey`, waits 8 seconds, then saves a screenshot and the last 400 logcat lines to `.cache/emulator`. If the downloaded file is a ZIP archive with a single nested APK, the script extracts the nested APK to a temp directory and installs that.

Run every downloaded APK:

```bash
APK_SMOKE_WAIT_SECONDS=20 npm run apk:smoke:all
```

For apps that stop on runtime permissions, accept the permission in the emulator and capture one more screenshot:

```bash
adb exec-out screencap -p > .cache/emulator/manual-after-permission.png
```

## Manual review path

Use the same account and network conditions for every APK.

1. First launch: splash, runtime permissions, crash-free startup.
2. Authentication: valid login, invalid login, logout.
3. Core BBplay flow: clubs, seat availability, booking, active bookings, balance or payment entry.
4. Content: news, profile, support/chatbot, food or extra features where present.
5. Failure states: no network, API error, empty clubs, repeated booking.
6. Performance: install time, cold start, visible jank, memory pressure on emulator.
7. Evidence: keep screenshots and logcat for each finalist.
