# VibeContest dashboard

Web dashboard for the BBplay vibe-coding contest review. It imports the public Google Sheet, inspects submitted GitHub repositories, checks APK availability, and shows a preliminary expert ranking.

## Run

```bash
npm install
npm run analyze
npm run dev
```

## Build

```bash
npm run lint
npm run build
```

## Data pipeline

`npm run analyze` writes:

- `data/raw/submissions.csv` - raw Google Sheet export
- `.cache/repos` - shallow clones of submissions
- `.cache/apks` - downloaded APK files where possible
- `.cache/analysis-full.json` - private local analysis with text excerpts
- `src/data/analysis.json` - public dashboard facts without large copied prompt/doc excerpts

The manual scoring matrix lives in `src/data/evaluations.ts`.

## APK checks

This machine did not have Android SDK tools installed during implementation. The script is ready for a machine with `adb`:

```bash
npm run apk:smoke -- .cache/apks/калинин-михаил-павлович.apk
```

See `docs/apk-emulator.md` for emulator setup and the manual review checklist.

## Current preliminary winners

1. Калинин Михаил Павлович
2. Меркурьев Ярослав Ван Хиеу
3. Инжутов Дмитрий Сергеевич

Special engineering award: Черкасов Кирилл Константинович.
