import { useMemo, useState, type ReactNode } from 'react'
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Code2,
  ExternalLink,
  FileText,
  ListFilter,
  Medal,
  PackageCheck,
  Smartphone,
  TestTube2,
  Trophy,
} from 'lucide-react'
import analysis from './data/analysis.json'
import { apkSmokeBySlug, type ApkSmokeResult } from './data/apkSmoke'
import { evaluations, evaluationsBySlug, rubric, type Evaluation, type ScoreKey } from './data/evaluations'
import './App.css'

type ApkInfo = {
  status: string
  source?: string
  size?: number
  localPath?: string
  downloadUrl?: string
  artifactUrl?: string
  note?: string
  hasManifest?: boolean
  nestedApks?: string[]
}

type Submission = {
  slug: string
  name: string
  timestamp: string
  repoUrl: string
  apkUrl: string
  promptsUrl: string
  architectureUrl: string
  repo: {
    status: string
    frameworks: string[]
    docs: string[]
    prompts: string[]
    tests: string[]
    ci: string[]
    metrics: {
      fileCount: number
      codeFiles: number
      codeLines: number
      markdownLines: number
      repoLastCommit: string
      defaultBranch: string
    }
  }
  promptDoc: { status: string; source: string; excerptLength?: number }
  architectureDoc: { status: string; source: string; excerptLength?: number }
  apk: ApkInfo
}

type AnalysisData = {
  generatedAt: string
  source: { sheet: string }
  submissions: Submission[]
}

type Filter = 'all' | 'winners' | 'apk' | 'risk'

const scoreKeys: ScoreKey[] = ['product', 'prompts', 'engineering', 'delivery']
const data = analysis as AnalysisData

const totalScore = (evaluation: Evaluation) => scoreKeys.reduce((sum, key) => sum + evaluation.scores[key], 0)

const formatBytes = (value?: number) => {
  if (!value) return 'нет'
  return `${Math.round(value / 1024 / 1024)} MB`
}

const apkLabel = (apk: ApkInfo) => {
  if (apk.status === 'verified-apk') return 'APK проверен'
  if (apk.status === 'apk-archive') return 'архив с APK'
  if (apk.status === 'built-local') return 'APK собран локально'
  if (apk.status === 'downloaded-not-apk') return 'не APK'
  if (apk.status === 'restricted') return 'закрытая ссылка'
  if (apk.status === 'missing') return 'APK не приложен'
  if (apk.status === 'error') return 'ошибка APK'
  return apk.status
}

const apkTone = (apk: ApkInfo) => {
  if (apk.status === 'verified-apk') return 'good'
  if (apk.status === 'built-local') return 'good'
  if (apk.status === 'apk-archive') return 'warn'
  if (apk.status === 'missing' || apk.status === 'restricted' || apk.status === 'error') return 'bad'
  return 'warn'
}

const isInstallableApk = (apk: ApkInfo) => apk.status === 'verified-apk' || apk.status === 'apk-archive' || apk.status === 'built-local'

const docStatus = (status: string) => (status === 'ok' || status === 'note' ? 'ok' : 'bad')

const smokeLabel = (smoke?: ApkSmokeResult) => {
  if (!smoke) return 'не запускали'
  if (smoke.status === 'pass') return 'runtime ok'
  if (smoke.status === 'fail') return 'runtime fail'
  if (smoke.status === 'missing') return 'нет APK'
  return 'runtime риск'
}

const smokeTone = (smoke?: ApkSmokeResult) => {
  if (!smoke) return 'warn'
  if (smoke.status === 'pass') return 'good'
  if (smoke.status === 'fail' || smoke.status === 'missing') return 'bad'
  return 'warn'
}

const compactName = (name: string) => {
  const [lastName, firstName] = name.split(' ')
  return `${lastName} ${firstName}`
}

function App() {
  const [filter, setFilter] = useState<Filter>('all')
  const [selectedSlug, setSelectedSlug] = useState(evaluations[0].slug)

  const rows = useMemo(
    () =>
      data.submissions
        .map((submission) => ({ submission, evaluation: evaluationsBySlug[submission.slug] }))
        .filter((row): row is { submission: Submission; evaluation: Evaluation } => Boolean(row.evaluation))
        .sort((a, b) => a.evaluation.rank - b.evaluation.rank),
    [],
  )

  const visibleRows = rows.filter(({ submission, evaluation }) => {
    if (filter === 'winners') return evaluation.rank <= 3 || Boolean(evaluation.award)
    if (filter === 'apk') return isInstallableApk(submission.apk)
    if (filter === 'risk') return submission.apk.status !== 'verified-apk' || evaluation.scores.delivery < 11
    return true
  })

  const selected = rows.find((row) => row.submission.slug === selectedSlug) ?? rows[0]
  const verifiedApks = rows.filter(({ submission }) => submission.apk.status === 'verified-apk').length
  const archiveApks = rows.filter(({ submission }) => submission.apk.status === 'apk-archive').length
  const localApks = rows.filter(({ submission }) => submission.apk.status === 'built-local').length
  const installableApks = rows.filter(({ submission }) => isInstallableApk(submission.apk)).length
  const promptDocs = rows.filter(({ submission }) => docStatus(submission.promptDoc.status) === 'ok').length
  const averageScore = Math.round(rows.reduce((sum, row) => sum + totalScore(row.evaluation), 0) / rows.length)
  const winnerRows = rows.filter(({ evaluation }) => evaluation.rank <= 3)
  const specialAward = rows.find(({ evaluation }) => evaluation.award === 'Спецприз за инженерию')

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">BBplay Vibe Contest</p>
          <h1>Оценка студенческих работ</h1>
          <p className="lead">
            Предварительный рейтинг по качеству продукта, промптам, инженерии и готовности к ручной проверке.
            Данные обновлены {new Date(data.generatedAt).toLocaleString('ru-RU')}.
          </p>
        </div>
        <a className="icon-link" href={data.source.sheet} target="_blank" rel="noreferrer">
          <FileText size={18} />
          Таблица
          <ExternalLink size={15} />
        </a>
      </header>

      <section className="metric-grid" aria-label="Сводка">
        <Metric icon={<Trophy />} label="Лидер" value={compactName(winnerRows[0].submission.name)} note={`${totalScore(winnerRows[0].evaluation)} / 100`} />
        <Metric
          icon={<Smartphone />}
          label="APK доступны"
          value={`${installableApks} из ${rows.length}`}
          note={`${verifiedApks} прямых, ${archiveApks} архив, ${localApks} локально`}
        />
        <Metric icon={<FileText />} label="Промпты доступны" value={`${promptDocs} из ${rows.length}`} note="GitHub, Drive или inline note" />
        <Metric icon={<BarChart3 />} label="Средний балл" value={`${averageScore}`} note="по экспертной матрице" />
      </section>

      <section className="winner-band" aria-label="Победители">
        {winnerRows.map(({ submission, evaluation }) => (
          <article className="winner-card" key={submission.slug}>
            <div className="winner-rank">
              <Medal size={18} />
              #{evaluation.rank}
            </div>
            <h2>{compactName(submission.name)}</h2>
            <p>{evaluation.award ?? 'Финалист'}</p>
            <strong>{totalScore(evaluation)} / 100</strong>
          </article>
        ))}
        {specialAward ? (
          <article className="winner-card muted">
            <div className="winner-rank">
              <TestTube2 size={18} />
              спец
            </div>
            <h2>{compactName(specialAward.submission.name)}</h2>
            <p>{specialAward.evaluation.award}</p>
            <strong>{totalScore(specialAward.evaluation)} / 100</strong>
          </article>
        ) : null}
      </section>

      <section className="toolbar" aria-label="Фильтры">
        <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')} type="button">
          <ListFilter size={17} />
          все
        </button>
        <button className={filter === 'winners' ? 'active' : ''} onClick={() => setFilter('winners')} type="button">
          <Trophy size={17} />
          лидеры
        </button>
        <button className={filter === 'apk' ? 'active' : ''} onClick={() => setFilter('apk')} type="button">
          <PackageCheck size={17} />
          APK есть
        </button>
        <button className={filter === 'risk' ? 'active' : ''} onClick={() => setFilter('risk')} type="button">
          <AlertTriangle size={17} />
          риски
        </button>
      </section>

      <section className="workbench">
        <aside className="ranking" aria-label="Рейтинг">
          {visibleRows.map(({ submission, evaluation }) => {
            const selectedRow = selectedSlug === submission.slug
            const score = totalScore(evaluation)
            return (
              <button
                className={`rank-row ${selectedRow ? 'selected' : ''}`}
                key={submission.slug}
                onClick={() => setSelectedSlug(submission.slug)}
                type="button"
              >
                <span className="rank-number">#{evaluation.rank}</span>
                <span className="rank-main">
                  <strong>{compactName(submission.name)}</strong>
                  <span>{evaluation.award ?? apkLabel(submission.apk)}</span>
                  <span className="rank-bar" aria-hidden="true">
                    <span style={{ width: `${score}%` }} />
                  </span>
                </span>
                <span className="rank-score">{score}</span>
              </button>
            )
          })}
        </aside>

        <SubmissionDetail row={selected} />
      </section>

      <section className="method-grid">
        <article className="method-panel">
          <h2>Рубрика</h2>
          <div className="rubric-list">
            {rubric.map((item) => (
              <div className="rubric-row" key={item.key}>
                <div>
                  <strong>{item.label}</strong>
                  <span>{item.description}</span>
                </div>
                <b>{item.max}</b>
              </div>
            ))}
          </div>
        </article>

        <article className="method-panel">
          <h2>APK workflow</h2>
          <div className="apk-workflow">
            <p>Автопроверка скачивает доступные APK в `.cache/apks`, включая GitHub Release, raw blob, Expo artifact, Google Drive и Git LFS.</p>
            <pre>
              <code>{'npm run analyze\nnpm run apk:emulator:start\nnpm run apk:smoke -- .cache/apks/калинин-михаил-павлович.apk'}</code>
            </pre>
            <p>Локальный SDK установлен в `~/Android/Sdk`; запуск эмулятора и smoke-тест описаны в `docs/apk-emulator.md`.</p>
          </div>
        </article>
      </section>
    </main>
  )
}

function Metric({ icon, label, value, note }: { icon: ReactNode; label: string; value: string; note: string }) {
  return (
    <article className="metric">
      <span className="metric-icon">{icon}</span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <span>{note}</span>
      </div>
    </article>
  )
}

function SubmissionDetail({ row }: { row: { submission: Submission; evaluation: Evaluation } }) {
  const { submission, evaluation } = row
  const score = totalScore(evaluation)
  const smoke = apkSmokeBySlug[submission.slug]

  return (
    <article className="detail-panel">
      <div className="detail-head">
        <div>
          <span className="rank-chip">#{evaluation.rank}</span>
          <h2>{submission.name}</h2>
          <p>{evaluation.summary}</p>
        </div>
        <div className="score-dial">
          <strong>{score}</strong>
          <span>из 100</span>
        </div>
      </div>

      <div className="score-grid">
        {rubric.map((item) => (
          <div className="score-item" key={item.key}>
            <span>
              {item.label}
              <b>
                {evaluation.scores[item.key]} / {item.max}
              </b>
            </span>
            <div className="score-line" aria-hidden="true">
              <i style={{ width: `${(evaluation.scores[item.key] / item.max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="status-grid">
        <StatusPill tone={apkTone(submission.apk)} icon={<Smartphone size={16} />} label={apkLabel(submission.apk)} value={formatBytes(submission.apk.size)} />
        <StatusPill tone={smokeTone(smoke)} icon={<Smartphone size={16} />} label="APK smoke" value={smokeLabel(smoke)} />
        <StatusPill
          tone={docStatus(submission.promptDoc.status)}
          icon={<FileText size={16} />}
          label="Промпты"
          value={`${submission.promptDoc.status}, ${submission.promptDoc.source}`}
        />
        <StatusPill
          tone={docStatus(submission.architectureDoc.status)}
          icon={<FileText size={16} />}
          label="Архитектура"
          value={`${submission.architectureDoc.status}, ${submission.architectureDoc.source}`}
        />
        <StatusPill
          tone={submission.repo.tests.length > 0 ? 'good' : 'warn'}
          icon={<TestTube2 size={16} />}
          label="Тесты"
          value={submission.repo.tests.length ? `${submission.repo.tests.length} найдено` : 'не найдены'}
        />
      </div>

      <div className="detail-columns">
        <TextList title="Сильные стороны" items={evaluation.strengths} />
        <TextList title="Риски" items={evaluation.risks} />
      </div>

      <div className="evidence">
        <div>
          <h3>Следующая проверка</h3>
          <p>{evaluation.nextCheck}</p>
          {smoke ? <p className="smoke-note">Smoke: {smoke.screen}</p> : null}
        </div>
        <div className="repo-facts">
          <span>{submission.repo.frameworks.join(', ') || 'стек не определён автоматически'}</span>
          <span>{submission.repo.metrics.codeFiles} code files, {submission.repo.metrics.codeLines.toLocaleString('ru-RU')} LOC</span>
          <span>{submission.repo.docs.length} docs, {submission.repo.prompts.length} prompt files</span>
          <span>commit {submission.repo.metrics.repoLastCommit ? new Date(submission.repo.metrics.repoLastCommit).toLocaleDateString('ru-RU') : 'n/a'}</span>
        </div>
      </div>

      <div className="links">
        <a href={submission.repoUrl} target="_blank" rel="noreferrer">
          <Code2 size={16} />
          GitHub
        </a>
        <a href={submission.apkUrl} target="_blank" rel="noreferrer">
          <Smartphone size={16} />
          APK
        </a>
        {submission.apk.artifactUrl ? (
          <a href={submission.apk.artifactUrl} target="_blank" rel="noreferrer">
            <PackageCheck size={16} />
            Собранный APK
          </a>
        ) : null}
        <a href={submission.promptsUrl} target="_blank" rel="noreferrer">
          <FileText size={16} />
          Промпты
        </a>
        <a href={submission.architectureUrl} target="_blank" rel="noreferrer">
          <FileText size={16} />
          Архитектура
        </a>
      </div>
    </article>
  )
}

function StatusPill({ tone, icon, label, value }: { tone: string; icon: ReactNode; label: string; value: string }) {
  return (
    <div className={`status-pill ${tone}`}>
      {tone === 'good' ? <CheckCircle2 size={16} /> : icon}
      <span>
        <strong>{label}</strong>
        <small>{value}</small>
      </span>
    </div>
  )
}

function TextList({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="text-list">
      <h3>{title}</h3>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  )
}

export default App
