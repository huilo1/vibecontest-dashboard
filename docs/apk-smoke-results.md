# APK smoke results

Date: 2026-04-27
Device: Android API 35 x86_64 emulator, Docker/KVM, headless mode
Scope: install APK, launch main activity, wait 20 seconds, capture screenshot and clean logcat. This is not a full authenticated product review.

| Participant | Result | Observed screen | Evidence |
| --- | --- | --- | --- |
| Калинин Михаил | Pass | Login after accepting location permission | `.cache/emulator/калинин-михаил-павлович.com.bbplay.app.png` |
| Меркурьев Ярослав | Pass | Login/main shell with bottom navigation | `.cache/emulator/меркурьев-ярослав-ван-хиеу.com.blackbears.bbplay.png` |
| Тоскин Ярослав | Pass | Login screen | `.cache/emulator/тоскин-ярослав-николаевич.com.example.test1.png` |
| Черкасов Кирилл | Missing | APK was not provided | Submission note says the project depends on local services and VK token |
| Ломакин Максим | Pass | Login screen; nested `BBPlay.apk` was extracted from the Drive archive | `.cache/emulator/ломакин-максим-андреевич.com.example.bbplay_app.png` |
| Бирюков Владислав | Pass after retry | Login screen after isolated manual relaunch; first batch caught an emulator System UI ANR dialog | `.cache/emulator/biryukov-manual-30s.png` |
| Кулаков Вадим | Pass | Login screen | `.cache/emulator/кулаков-вадим-евгеньевич.com.archvnx.bbplayapp.png` |
| Глинкин Александр | Pass | Login screen with test accounts visible | `.cache/emulator/глинкин-александр-михайлович.com.example.bb_play.png` |
| Инжутов Дмитрий | Fail | Still on splash screen after 60 seconds | `logcat`: Flutter/JNI `ClassNotFoundException` for `io/flutter/util/PathUtils` |
| Харин Иван | Missing | APK was not provided | Submission note points to README build instructions |
| Жиронкин Василий | Pass | Login/auth screen | `.cache/emulator/жиронкин-василий-михайлович.com.vasilizxt.bbplayreact.png` |

## Notes

- The smoke script now clears `logcat` before each launch and supports `APK_SMOKE_WAIT_SECONDS`.
- Ломакин's downloaded `.apk` is actually a ZIP archive containing `BBPlay.apk`; `npm run apk:smoke` extracts and installs the nested APK automatically.
- Инжутов's APK installs and starts `MainActivity`, but the UI does not progress past splash on the API 35 emulator. Because of this runtime result, the provisional top 3 was adjusted to Калинин, Меркурьев, Тоскин.
