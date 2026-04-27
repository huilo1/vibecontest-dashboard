# APK emulator checklist

Local machine status during implementation: `adb`, `emulator` and `avdmanager` were not installed, so APKs were downloaded and ZIP-verified only.

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

## Run a smoke test

```bash
npm run analyze
emulator -avd vibecontest-api35
adb wait-for-device
npm run apk:smoke -- .cache/apks/калинин-михаил-павлович.apk
```

If package detection fails, pass the package name explicitly:

```bash
npm run apk:smoke -- .cache/apks/инжутов-дмитрий-сергеевич.apk com.example.bbplay
```

The script installs the APK, launches the main activity with `monkey`, waits 8 seconds, then saves a screenshot and the last 400 logcat lines to `.cache/emulator`.

## Manual review path

Use the same account and network conditions for every APK.

1. First launch: splash, runtime permissions, crash-free startup.
2. Authentication: valid login, invalid login, logout.
3. Core BBplay flow: clubs, seat availability, booking, active bookings, balance or payment entry.
4. Content: news, profile, support/chatbot, food or extra features where present.
5. Failure states: no network, API error, empty clubs, repeated booking.
6. Performance: install time, cold start, visible jank, memory pressure on emulator.
7. Evidence: keep screenshots and logcat for each finalist.
