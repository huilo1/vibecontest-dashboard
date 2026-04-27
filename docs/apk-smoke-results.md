# APK smoke results

Date: 2026-04-27
Device: Android API 35 x86_64 emulator, Docker/KVM, headless mode
Scope: install APK, launch main activity, wait 20-35 seconds, capture screenshot and clean logcat. This is not a full authenticated product review.

| Participant | Result | Observed screen | Evidence |
| --- | --- | --- | --- |
| Калинин Михаил | Pass | Login after accepting location permission | `.cache/emulator/калинин-михаил-павлович.com.bbplay.app.png` |
| Меркурьев Ярослав | Pass | Login/main shell with bottom navigation | `.cache/emulator/меркурьев-ярослав-ван-хиеу.com.blackbears.bbplay.png` |
| Тоскин Ярослав | Pass | Login screen | `.cache/emulator/тоскин-ярослав-николаевич.com.example.test1.png` |
| Черкасов Кирилл | Pass, locally built | Release APK built from source reaches login screen; notification permission dialog is visible | `.cache/emulator/черкасов-кирилл-константинович-built-release.ru.blackbearsplay.app.png` |
| Ломакин Максим | Pass | Login screen; nested `BBPlay.apk` was extracted from the Drive archive | `.cache/emulator/ломакин-максим-андреевич.com.example.bbplay_app.png` |
| Бирюков Владислав | Pass after retry | Login screen after isolated manual relaunch; first batch caught an emulator System UI ANR dialog | `.cache/emulator/biryukov-manual-30s.png` |
| Кулаков Вадим | Pass | Login screen | `.cache/emulator/кулаков-вадим-евгеньевич.com.archvnx.bbplayapp.png` |
| Глинкин Александр | Pass | Login screen with test accounts visible | `.cache/emulator/глинкин-александр-михайлович.com.example.bb_play.png` |
| Инжутов Дмитрий | Fail | Still on splash screen after 60 seconds | `logcat`: Flutter/JNI `ClassNotFoundException` for `io/flutter/util/PathUtils` |
| Харин Иван | Pass, locally built | Flutter debug APK built after `flutter create --platforms=android .` reaches login screen with QA accounts | `.cache/emulator/харин-иван-александрович-built-debug.com.example.blackbears_strike.png` |
| Жиронкин Василий | Pass | Login/auth screen | `.cache/emulator/жиронкин-василий-михайлович.com.vasilizxt.bbplayreact.png` |

## Notes

- The smoke script now clears `logcat` before each launch and supports `APK_SMOKE_WAIT_SECONDS`.
- Ломакин's downloaded `.apk` is actually a ZIP archive containing `BBPlay.apk`; `npm run apk:smoke` extracts and installs the nested APK automatically.
- Инжутов's APK installs and starts `MainActivity`, but the UI does not progress past splash on the API 35 emulator. Because of this runtime result, the provisional top 3 was adjusted to Калинин, Меркурьев, Тоскин.
- Черкасов's original submission did not include APK. A standalone Expo/React Native release APK was built locally from source in mock mode; the first debug APK was not standalone because it required Metro.
- Харин's original submission did not include APK or Android platform folder. `flutter create --platforms=android .` plus `flutter build apk --debug --dart-define=VIBE_API_BASE_URL=http://10.0.2.2:8080` produced an installable APK.
- During the two new smoke runs the emulator showed a System UI ANR dialog after long installs, but both apps were visibly rendered behind the dialog and app logs did not show fatal crashes.
