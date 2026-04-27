export type ScoreKey = 'product' | 'prompts' | 'engineering' | 'delivery'

export type Evaluation = {
  slug: string
  rank: number
  award?: string
  scores: Record<ScoreKey, number>
  summary: string
  strengths: string[]
  risks: string[]
  nextCheck: string
}

export const rubric = [
  {
    key: 'product' as const,
    label: 'Итоговый продукт',
    max: 40,
    description: 'Полнота сценариев BBplay, качество UX, глубина интеграций, готовность показать рабочий результат.',
  },
  {
    key: 'prompts' as const,
    label: 'Промпты',
    max: 20,
    description: 'Контекст для модели, итеративность, работа с ошибками, полнота истории и критичность к ответам AI.',
  },
  {
    key: 'engineering' as const,
    label: 'Инженерия',
    max: 25,
    description: 'Архитектура, организация кода, типизация, работа с API, тесты, поддерживаемость.',
  },
  {
    key: 'delivery' as const,
    label: 'Поставка',
    max: 15,
    description: 'APK, релизные артефакты, документация запуска, воспроизводимость проверки.',
  },
]

export const evaluations: Evaluation[] = [
  {
    slug: 'калинин-михаил-павлович',
    rank: 1,
    award: 'Предварительный победитель',
    scores: { product: 37, prompts: 19, engineering: 23, delivery: 13 },
    summary:
      'Самая сильная заявка по совокупности: большой React Native/Expo продукт, подробная документация, открытая история промптов, API-слой, локальные знания, уведомления, темы и тестовые сценарии.',
    strengths: [
      'APK скачан через Git LFS, устанавливается на эмулятор и доходит до экрана логина после выдачи location permission.',
      'Очень подробные docs/PROMPTS_ALL.md и архитектурные документы.',
      'Есть типизированные модули API, навигация, i18n, темы, уведомления, knowledge/RAG и unit/api test scripts.',
    ],
    risks: [
      'APK весит около 142 MB, это требует отдельной проверки производительности и времени установки.',
      'Большой объём артефактов и медиа в репозитории усложняет ревью.',
    ],
    nextCheck: 'Установить APK на эмулятор, пройти авторизацию, бронирование, новости, чат и проверить поведение без сети.',
  },
  {
    slug: 'меркурьев-ярослав-ван-хиеу',
    rank: 2,
    award: 'Сильнейший Flutter delivery',
    scores: { product: 35, prompts: 17, engineering: 21, delivery: 14 },
    summary:
      'Зрелая Flutter-заявка с feature-based архитектурой, внятной документацией, скачиваемым APK и хорошим покрытием продуктовых экранов.',
    strengths: [
      'APK лежит в репозитории и проходит проверку.',
      'Архитектура описывает слои domain/data/presentation и стек Flutter/Riverpod.',
      'Видны экраны авторизации, клубов, бронирования, профиля, поддержки, новостей и чат-бота.',
    ],
    risks: [
      'Автоанализ не нашёл тесты.',
      'История промптов оформлена как длинный conversation export, её сложнее быстро аудировать.',
    ],
    nextCheck: 'Проверить на эмуляторе бронь по реальному сценарию и качество обработки API-ошибок.',
  },
  {
    slug: 'инжутов-дмитрий-сергеевич',
    rank: 9,
    scores: { product: 24, prompts: 17, engineering: 18, delivery: 7 },
    summary:
      'Хорошо упакованный Flutter-проект по документам, но release APK на текущем эмуляторе не проходит runtime smoke: после 60 секунд остается splash screen.',
    strengths: [
      'APK из GitHub Release скачан, устанавливается и запускает main activity.',
      'Покрыты базовые сценарии: регистрация, баланс, бронирование, профиль, AI-чат, турниры и заказы еды по документации.',
      'PROMPTS.md показывает поэтапную генерацию и доработку.',
    ],
    risks: [
      'Runtime smoke на Android API 35 не дошел до логина; logcat показывает Flutter/JNI ClassNotFoundException io/flutter/util/PathUtils.',
      'Тесты не обнаружены.',
      'До пересборки или проверки на другом устройстве нельзя подтвердить качество итогового продукта.',
    ],
    nextCheck: 'Пересобрать APK или проверить на физическом устройстве/другой версии Android; затем повторить smoke до логина и core flow.',
  },
  {
    slug: 'тоскин-ярослав-николаевич',
    rank: 3,
    award: 'Третий приз после APK smoke',
    scores: { product: 34, prompts: 16, engineering: 18, delivery: 13 },
    summary:
      'Сильный Flutter-релиз с рабочим APK, дополнительными фичами и подробным описанием процесса, но без найденных тестов.',
    strengths: [
      'APK из релиза скачан и проверен.',
      'Заявлены дополнительные сценарии: мини-игры, меню еды, подбор клуба и бронь через чат-бота.',
      'Архитектура и промпты доступны в репозитории.',
    ],
    risks: [
      'Часть логов ошибок намеренно исключена из prompt history, поэтому аудит AI-процесса неполный.',
      'Нет обнаруженного автоматического тестирования.',
    ],
    nextCheck: 'Пройти дополнительные фичи в APK и проверить, какие сценарии работают на реальных данных.',
  },
  {
    slug: 'черкасов-кирилл-константинович',
    rank: 4,
    award: 'Спецприз за инженерию',
    scores: { product: 28, prompts: 19, engineering: 24, delivery: 8 },
    summary:
      'Технически одна из лучших работ: Expo/React Native, TypeScript, прокси-сервисы, тесты, dev/prod документация. Общий рейтинг снижен из-за отсутствия APK и зависимости от локальных сервисов.',
    strengths: [
      'Лучший набор тестов среди заявок: unit, smoke и integration.',
      'Хорошая dev/prod документация и прозрачное объяснение ограничений с VK token.',
      'Большая история промптов и использование нескольких моделей.',
    ],
    risks: [
      'APK не предоставлен, полноценная проверка продукта требует Expo Go и локальных сервисов.',
      'Есть runtime/proxy зависимость, которую нужно поднимать отдельно.',
    ],
    nextCheck: 'Запустить через Expo Go по DEVELOPMENT.md, затем прогнать npm test и ручной booking flow.',
  },
  {
    slug: 'ломакин-максим-андреевич',
    rank: 5,
    scores: { product: 32, prompts: 17, engineering: 17, delivery: 12 },
    summary:
      'Добротный Flutter-проект с доступным APK внутри Drive-архива, локальными prompt-файлами и архитектурным описанием. По глубине инженерии уступает лидерам.',
    strengths: [
      'Google Drive файл скачан; внутри архива найден вложенный BBPlay.apk для установки.',
      'В репозитории есть promts/bbplay_prompts_log.md, system prompt чат-бота и architecture.md.',
      'Хороший объём Flutter-кода без явного чрезмерного шума.',
    ],
    risks: [
      'APK поставлен не как прямой APK, а как архив с вложенным APK, поэтому smoke-тест требует извлечения.',
      'Drive-документы скачиваются как архивы, их нужно распаковывать для удобного ревью.',
      'Тесты не обнаружены.',
    ],
    nextCheck: 'Проверить APK на ключевых пользовательских сценариях и сопоставить чат-бота с system prompt.',
  },
  {
    slug: 'бирюков-владислав-сергеевич',
    rank: 6,
    scores: { product: 28, prompts: 15, engineering: 17, delivery: 14 },
    summary:
      'Гибридный PWA/Capacitor проект с собственным PHP API и MySQL-слоем. APK из Drive скачивается после подтверждения Google Drive warning и проходит ZIP-проверку.',
    strengths: [
      'APK с Google Drive скачан через confirm-flow и проходит проверку.',
      'Есть архитектура PWA + Capacitor + PHP + MySQL.',
      'Документация и prompt log доступны через Drive.',
      'Виден значительный объём серверного и клиентского кода.',
    ],
    risks: [
      'APK около 4 MB, поэтому нужно вручную проверить, что это полноценная мобильная обёртка, а не только минимальный shell.',
      'Prompt history выглядит как набор коротких команд и логов, меньше проектного планирования.',
    ],
    nextCheck: 'Установить проверенный Drive APK, затем проверить авторизацию, backend-зависимости и сценарий бронирования.',
  },
  {
    slug: 'кулаков-вадим-евгеньевич',
    rank: 7,
    scores: { product: 29, prompts: 17, engineering: 15, delivery: 13 },
    summary:
      'Амбициозная Expo/React Native работа с бонусными сценариями и хорошим prompt-контекстом. APK из Drive скачивается после подтверждения Google Drive warning и проходит ZIP-проверку.',
    strengths: [
      'APK с Google Drive скачан через confirm-flow и проходит проверку.',
      'Промпты показывают передачу API-документации, тестовых аккаунтов и работу по логам.',
      'Заявлены колесо фортуны, активные брони, быстрые действия и отдельный backend.',
      'Стек Expo/TypeScript/React Navigation хорошо читается по коду.',
    ],
    risks: [
      'README/architecture файлы в репозитории не найдены, документы только через Drive.',
      'Автоанализ не нашёл тесты.',
    ],
    nextCheck: 'Установить проверенный Drive APK и перенести README/architecture/prompts в репозиторий для устойчивого ревью.',
  },
  {
    slug: 'харин-иван-александрович',
    rank: 10,
    scores: { product: 25, prompts: 16, engineering: 16, delivery: 9 },
    summary:
      'Интересная monorepo-идея Flutter + Rust BFF, но продукт заметно уходит в BlackBears STRIKE вместо прямого BBplay и не имеет готового APK.',
    strengths: [
      'Есть README, Flutter client и Rust Axum BFF.',
      'Промпт формулирует сильную продуктовую концепцию tactical booking assistant.',
      'Архитектура выглядит самостоятельной, не только набором экранов.',
    ],
    risks: [
      'APK не приложен, указан только путь сборки.',
      'Смещение концепции от исходного BBplay может ухудшить соответствие ТЗ конкурса.',
    ],
    nextCheck: 'Собрать по README и отдельно оценить, какие обязательные BBplay сценарии реально закрыты.',
  },
  {
    slug: 'глинкин-александр-михайлович',
    rank: 8,
    scores: { product: 26, prompts: 15, engineering: 13, delivery: 13 },
    summary:
      'Понятная Flutter-заявка с README, ARCHITECTURE, PROMPTS и проверяемым APK из Google Drive.',
    strengths: [
      'APK с Google Drive скачан через confirm-flow и проходит проверку.',
      'PROMPTS.md хорошо структурирует использованные AI-инструменты и этапы.',
      'ARCHITECTURE.md описывает Flutter/MVVM/Provider структуру.',
      'Кодовая база компактная и читаемая.',
    ],
    risks: [
      'Автоанализ не нашёл тесты.',
      'Меньше доказательств продуктовой глубины, чем у лидеров.',
    ],
    nextCheck: 'Установить проверенный Drive APK и пройти заявленные экраны на эмуляторе.',
  },
  {
    slug: 'жиронкин-василий-михайлович',
    rank: 11,
    scores: { product: 27, prompts: 7, engineering: 12, delivery: 12 },
    summary:
      'APK из Expo доступен и проверяется, но документы Google закрыты, а в репозитории не найдено README/architecture/prompts/test evidence.',
    strengths: [
      'Expo APK скачан и проходит ZIP-проверку.',
      'Проект на React Native/Expo/TypeScript, кодовая база компактная.',
    ],
    risks: [
      'Промпты и архитектура недоступны без авторизации Google.',
      'Недостаточно артефактов для оценки процесса и инженерных решений.',
    ],
    nextCheck: 'Открыть Google Docs на чтение или перенести документы в GitHub, затем провести ручной APK review.',
  },
]

export const evaluationsBySlug = Object.fromEntries(evaluations.map((evaluation) => [evaluation.slug, evaluation]))
