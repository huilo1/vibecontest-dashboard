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

This machine has a local Android SDK and Docker/KVM emulator workflow:

```bash
npm run apk:emulator:start
npm run apk:smoke -- .cache/apks/калинин-михаил-павлович.apk
```

See `docs/apk-emulator.md` for emulator setup and `docs/apk-smoke-results.md` for current runtime evidence. Two originally missing APKs were built locally from source:

- Черкасов: <https://github.com/huilo1/vibecontest-dashboard/releases/download/local-apk-builds-2026-04-27/chirkasov-kirill-built-release.apk>
- Харин: <https://github.com/huilo1/vibecontest-dashboard/releases/download/local-apk-builds-2026-04-27/kharin-ivan-built-debug.apk>

## Current preliminary winners

1. Калинин Михаил Павлович
2. Меркурьев Ярослав Ван Хиеу
3. Тоскин Ярослав Николаевич

Special engineering award: Черкасов Кирилл Константинович.
