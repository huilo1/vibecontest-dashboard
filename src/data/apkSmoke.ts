export type ApkSmokeStatus = 'pass' | 'warn' | 'fail' | 'missing'

export type ApkSmokeResult = {
  slug: string
  status: ApkSmokeStatus
  screen: string
  evidence: string
}

export const apkSmokeResults: ApkSmokeResult[] = [
  {
    slug: 'калинин-михаил-павлович',
    status: 'pass',
    screen: 'Логин после выдачи location permission.',
    evidence: '.cache/emulator/калинин-михаил-павлович.com.bbplay.app.png',
  },
  {
    slug: 'меркурьев-ярослав-ван-хиеу',
    status: 'pass',
    screen: 'Логин/основной shell с нижней навигацией.',
    evidence: '.cache/emulator/меркурьев-ярослав-ван-хиеу.com.blackbears.bbplay.png',
  },
  {
    slug: 'тоскин-ярослав-николаевич',
    status: 'pass',
    screen: 'Логин с русской локализацией.',
    evidence: '.cache/emulator/тоскин-ярослав-николаевич.com.example.test1.png',
  },
  {
    slug: 'черкасов-кирилл-константинович',
    status: 'missing',
    screen: 'APK не предоставлен участником.',
    evidence: 'В таблице указано ограничение dev-сервисами и VK token.',
  },
  {
    slug: 'ломакин-максим-андреевич',
    status: 'pass',
    screen: 'Логин; APK извлечен из вложенного BBPlay.apk внутри Drive-архива.',
    evidence: '.cache/emulator/ломакин-максим-андреевич.com.example.bbplay_app.png',
  },
  {
    slug: 'бирюков-владислав-сергеевич',
    status: 'pass',
    screen: 'Логин после повторного ручного запуска; первый batch поймал системный ANR эмулятора.',
    evidence: '.cache/emulator/biryukov-manual-30s.png',
  },
  {
    slug: 'кулаков-вадим-евгеньевич',
    status: 'pass',
    screen: 'Логин с русской локализацией.',
    evidence: '.cache/emulator/кулаков-вадим-евгеньевич.com.archvnx.bbplayapp.png',
  },
  {
    slug: 'глинкин-александр-михайлович',
    status: 'pass',
    screen: 'Логин; на экране видны тестовые аккаунты.',
    evidence: '.cache/emulator/глинкин-александр-михайлович.com.example.bb_play.png',
  },
  {
    slug: 'инжутов-дмитрий-сергеевич',
    status: 'fail',
    screen: 'После 60 секунд остается splash screen.',
    evidence: 'logcat: Flutter/JNI ClassNotFoundException io/flutter/util/PathUtils.',
  },
  {
    slug: 'харин-иван-александрович',
    status: 'missing',
    screen: 'APK не предоставлен, указан путь сборки.',
    evidence: 'В таблице: "Как собрать описано в README".',
  },
  {
    slug: 'жиронкин-василий-михайлович',
    status: 'pass',
    screen: 'Логин/авторизация, форма открывается после запуска.',
    evidence: '.cache/emulator/жиронкин-василий-михайлович.com.vasilizxt.bbplayreact.png',
  },
]

export const apkSmokeBySlug = Object.fromEntries(apkSmokeResults.map((result) => [result.slug, result]))
