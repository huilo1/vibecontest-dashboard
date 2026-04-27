#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'csv-parse/sync';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const sheetCsvUrl =
  'https://docs.google.com/spreadsheets/d/1_tPa-pdwsPMnMfQ85kkywOZWBOCyUyda8v8B4iJbhp0/gviz/tq?tqx=out:csv&gid=0';

const dirs = {
  raw: join(root, 'data', 'raw'),
  generated: join(root, 'data', 'generated'),
  repos: join(root, '.cache', 'repos'),
  apks: join(root, '.cache', 'apks'),
  srcData: join(root, 'src', 'data'),
};

for (const dir of Object.values(dirs)) {
  mkdirSync(dir, { recursive: true });
}

const exec = (cmd, args, options = {}) =>
  execFileSync(cmd, args, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  });

const safeExec = (cmd, args, options = {}) => {
  try {
    return { ok: true, stdout: exec(cmd, args, options).trim(), stderr: '' };
  } catch (error) {
    return {
      ok: false,
      stdout: error.stdout?.toString().trim() ?? '',
      stderr: error.stderr?.toString().trim() || error.message,
    };
  }
};

const fetchText = async (url, timeoutMs = 20_000) => {
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        'user-agent': 'VibeContest-dashboard/1.0',
      },
    });
    const text = await response.text();
    return {
      ok: response.ok,
      status: response.status,
      contentType: response.headers.get('content-type') ?? '',
      size: Buffer.byteLength(text),
      text,
      url: response.url,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      contentType: '',
      size: 0,
      text: '',
      url,
      error: error.message,
    };
  }
};

const fetchBinary = async (url, target, timeoutMs = 180_000) => {
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        'user-agent': 'VibeContest-dashboard/1.0',
      },
    });
    const buffer = Buffer.from(await response.arrayBuffer());
    writeFileSync(target, buffer);
    return {
      ok: response.ok,
      status: response.status,
      contentType: response.headers.get('content-type') ?? '',
      size: buffer.length,
      url: response.url,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      contentType: '',
      size: 0,
      url,
      error: error.message,
    };
  }
};

const normalizeHeader = (value) => value.replace(/\s+/g, ' ').trim();
const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/ё/g, 'e')
    .replace(/[^a-z0-9а-я]+/g, '-')
    .replace(/^-+|-+$/g, '');

const parseGithubRepo = (url) => {
  const match = url.match(/github\.com\/([^/\s]+)\/([^/\s#?]+)/i);
  if (!match) return null;
  return {
    owner: match[1],
    repo: match[2].replace(/\.git$/, ''),
    httpsUrl: `https://github.com/${match[1]}/${match[2].replace(/\.git$/, '')}.git`,
    webUrl: `https://github.com/${match[1]}/${match[2].replace(/\.git$/, '')}`,
  };
};

const parseGithubBlob = (url) => {
  const match = url.match(/github\.com\/([^/\s]+)\/([^/\s]+)\/blob\/([^/\s]+)\/(.+)$/i);
  if (!match) return null;
  return {
    owner: match[1],
    repo: match[2],
    branch: match[3],
    path: decodeURIComponent(match[4]),
    raw: `https://raw.githubusercontent.com/${match[1]}/${match[2]}/${match[3]}/${match[4]}`,
  };
};

const parseGithubRelease = (url) => {
  const match = url.match(/github\.com\/([^/\s]+)\/([^/\s]+)\/releases\/tag\/([^/\s#?]+)/i);
  if (!match) return null;
  return { owner: match[1], repo: match[2], tag: decodeURIComponent(match[3]) };
};

const parseDriveId = (url) => {
  const match = url.match(/drive\.google\.com\/file\/d\/([^/\s]+)/i);
  return match?.[1] ?? null;
};

const parseGoogleDocId = (url) => {
  const match = url.match(/docs\.google\.com\/document\/d\/([^/\s]+)/i);
  return match?.[1] ?? null;
};

const readMaybe = (path) => {
  try {
    return readFileSync(path, 'utf8');
  } catch {
    return '';
  }
};

const walkFiles = (baseDir, dir = baseDir, output = []) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (
      entry.name === '.git' ||
      entry.name === 'node_modules' ||
      entry.name === 'dist' ||
      entry.name === 'build' ||
      entry.name === '.gradle' ||
      entry.name === '.idea' ||
      entry.name === '.expo'
    ) {
      continue;
    }

    const absolute = join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(baseDir, absolute, output);
    } else {
      output.push(relative(baseDir, absolute));
    }
  }
  return output;
};

const textExtensions = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.json',
  '.md',
  '.yml',
  '.yaml',
  '.kt',
  '.java',
  '.dart',
  '.xml',
  '.gradle',
  '.properties',
  '.css',
  '.scss',
  '.html',
  '.txt',
]);

const codeExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.kt', '.java', '.dart', '.xml', '.css']);

const summarizeRepo = (repoDir, repo) => {
  if (!existsSync(repoDir)) {
    return {
      status: 'unavailable',
      files: [],
      metrics: {},
      frameworks: [],
      docs: [],
      prompts: [],
      tests: [],
      ci: [],
      packageScripts: {},
      excerpts: {},
    };
  }

  const files = walkFiles(repoDir).sort();
  const frameworks = new Set();
  const docs = files.filter((file) =>
    /(readme|architecture|presentation|development|production|overview|заметки|zametki)/i.test(basename(file)),
  );
  const prompts = files.filter((file) => /(prompt|prompts|USER_PROMPTS|archive)/i.test(basename(file)));
  const tests = files.filter((file) => /(__tests__|\.test\.|\.spec\.|jest|vitest|detox|playwright)/i.test(file));
  const ci = files.filter((file) => file.startsWith('.github/workflows/'));
  const packageFiles = files.filter((file) => file.endsWith('package.json'));
  const packageScripts = {};

  for (const packageFile of packageFiles) {
    try {
      const pkg = JSON.parse(readFileSync(join(repoDir, packageFile), 'utf8'));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      if (deps.expo || pkg.scripts?.start?.includes('expo')) frameworks.add('Expo');
      if (deps['react-native']) frameworks.add('React Native');
      if (deps.react) frameworks.add('React');
      if (deps.typescript || files.some((file) => file.endsWith('.ts') || file.endsWith('.tsx'))) frameworks.add('TypeScript');
      if (deps.vite) frameworks.add('Vite');
      if (deps['@react-navigation/native'] || deps['expo-router']) frameworks.add('Navigation');
      if (deps.zustand || deps.redux || deps['@reduxjs/toolkit']) frameworks.add('State management');
      if (deps.axios || deps['@tanstack/react-query'] || deps['react-query']) frameworks.add('API client');
      packageScripts[packageFile] = pkg.scripts ?? {};
    } catch {
      packageScripts[packageFile] = {};
    }
  }

  if (files.some((file) => file.endsWith('build.gradle') || file.endsWith('build.gradle.kts'))) frameworks.add('Android Gradle');
  if (files.some((file) => file.endsWith('.kt'))) frameworks.add('Kotlin');
  if (files.some((file) => file.endsWith('.java'))) frameworks.add('Java');
  if (files.some((file) => /app\.json|app\.config\.(js|ts)/i.test(file))) frameworks.add('App config');

  const metrics = {
    fileCount: files.length,
    codeFiles: 0,
    codeLines: 0,
    markdownLines: 0,
    byExtension: {},
    repoLastCommit: safeExec('git', ['-C', repoDir, 'log', '-1', '--format=%cI']).stdout,
    defaultBranch: safeExec('git', ['-C', repoDir, 'branch', '--show-current']).stdout,
  };

  for (const file of files) {
    const extension = extname(file).toLowerCase();
    metrics.byExtension[extension || '[none]'] = (metrics.byExtension[extension || '[none]'] ?? 0) + 1;
    if (!textExtensions.has(extension)) continue;
    const absolute = join(repoDir, file);
    if (statSync(absolute).size > 1_500_000) continue;
    const lines = readFileSync(absolute, 'utf8').split(/\r?\n/).length;
    if (codeExtensions.has(extension)) {
      metrics.codeFiles += 1;
      metrics.codeLines += lines;
    }
    if (extension === '.md' || extension === '.txt') {
      metrics.markdownLines += lines;
    }
  }

  const interesting = [...new Set([...docs.slice(0, 8), ...prompts.slice(0, 8), 'README.md', 'readme.md'])];
  const excerpts = {};
  for (const file of interesting) {
    const absolute = join(repoDir, file);
    if (!existsSync(absolute) || statSync(absolute).size > 500_000) continue;
    excerpts[file] = readFileSync(absolute, 'utf8').slice(0, 12_000);
  }

  return {
    status: 'ok',
    repo,
    files,
    metrics,
    frameworks: [...frameworks].sort(),
    docs,
    prompts,
    tests,
    ci,
    packageScripts,
    excerpts,
  };
};

const resolveLinkedText = async (url, repoDir) => {
  const githubBlob = parseGithubBlob(url);
  if (githubBlob) {
    const localPath = join(repoDir, githubBlob.path);
    if (existsSync(localPath)) {
      return {
        status: 'ok',
        source: 'github-local',
        path: githubBlob.path,
        size: statSync(localPath).size,
        excerpt: readMaybe(localPath).slice(0, 12_000),
      };
    }
    const result = await fetchText(githubBlob.raw);
    return {
      status: result.ok ? 'ok' : 'error',
      source: 'github-raw',
      path: githubBlob.path,
      statusCode: result.status,
      contentType: result.contentType,
      size: result.size,
      excerpt: result.text.slice(0, 12_000),
    };
  }

  const googleDocId = parseGoogleDocId(url);
  if (googleDocId) {
    const result = await fetchText(`https://docs.google.com/document/d/${googleDocId}/export?format=txt`);
    return {
      status: result.ok && !result.text.includes('DOCTYPE html') ? 'ok' : 'restricted',
      source: 'google-doc',
      statusCode: result.status,
      contentType: result.contentType,
      size: result.size,
      excerpt: result.text.slice(0, 12_000),
    };
  }

  const driveId = parseDriveId(url);
  if (driveId) {
    const result = await fetchText(`https://drive.google.com/uc?export=download&id=${driveId}`);
    const blocked =
      result.text.includes('ServiceLogin') ||
      result.text.includes('storage_access') ||
      result.text.includes('Google Drive') ||
      result.contentType.includes('text/html');
    return {
      status: result.ok && !blocked ? 'ok' : 'restricted',
      source: 'google-drive',
      statusCode: result.status,
      contentType: result.contentType,
      size: result.size,
      excerpt: blocked ? '' : result.text.slice(0, 12_000),
    };
  }

  if (/^https?:\/\//.test(url)) {
    const result = await fetchText(url);
    return {
      status: result.ok ? 'ok' : 'error',
      source: 'url',
      statusCode: result.status,
      contentType: result.contentType,
      size: result.size,
      excerpt: result.text.slice(0, 12_000),
    };
  }

  return { status: 'note', source: 'inline-note', excerpt: url };
};

const githubApi = async (path) => {
  const result = await fetchText(`https://api.github.com${path}`);
  if (!result.ok) return { ok: false, status: result.status, data: null };
  return { ok: true, status: result.status, data: JSON.parse(result.text) };
};

const rawGithubUrlFromBlob = (url) => parseGithubBlob(url)?.raw ?? null;

const decodeHtmlAttribute = (value) =>
  value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

const extractInputValue = (html, name) => {
  const input = html.match(new RegExp(`<input[^>]+name="${name}"[^>]*>`, 'i'))?.[0];
  const value = input?.match(/value="([^"]*)"/i)?.[1];
  return value ? decodeHtmlAttribute(value) : null;
};

const extractDriveConfirmUrl = (html, driveId) => {
  const form = html.match(/<form[^>]+id="download-form"[^>]*>/i)?.[0] ?? '';
  const action = form.match(/action="([^"]+)"/i)?.[1];
  const confirm = extractInputValue(html, 'confirm');
  const uuid = extractInputValue(html, 'uuid');
  const id = extractInputValue(html, 'id') ?? driveId;

  if (!action || !confirm || !uuid || !id) return null;

  const url = new URL(decodeHtmlAttribute(action));
  url.searchParams.set('id', id);
  url.searchParams.set('export', 'download');
  url.searchParams.set('confirm', confirm);
  url.searchParams.set('uuid', uuid);
  return url.toString();
};

const parseGitLfsPointer = (path) => {
  if (!existsSync(path)) return null;
  const content = readFileSync(path, 'utf8');
  if (!content.startsWith('version https://git-lfs.github.com/spec/v1')) return null;
  const oid = content.match(/oid sha256:([a-f0-9]+)/)?.[1];
  const size = Number(content.match(/size (\d+)/)?.[1]);
  if (!oid || !Number.isFinite(size)) return null;
  return { oid, size };
};

const resolveGitLfsObject = async (githubBlob, pointer) => {
  try {
    const response = await fetch(`https://github.com/${githubBlob.owner}/${githubBlob.repo}.git/info/lfs/objects/batch`, {
      method: 'POST',
      redirect: 'follow',
      signal: AbortSignal.timeout(20_000),
      headers: {
        accept: 'application/vnd.git-lfs+json',
        'content-type': 'application/vnd.git-lfs+json',
        'user-agent': 'VibeContest-dashboard/1.0',
      },
      body: JSON.stringify({
        operation: 'download',
        transfers: ['basic'],
        objects: [{ oid: pointer.oid, size: pointer.size }],
      }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.objects?.[0]?.actions?.download?.href ?? null;
  } catch {
    return null;
  }
};

const verifyApkDownload = async ({ downloadUrl, target, source, driveId }) => {
  const result = await fetchBinary(downloadUrl, target);
  if (!result.ok) {
    return {
      status: 'error',
      source,
      statusCode: result.status,
      contentType: result.contentType,
      size: result.size,
      downloadUrl,
      error: result.error,
    };
  }
  const isHtml = result.contentType.includes('text/html') || readFileSync(target).subarray(0, 64).toString('utf8').includes('<!DOCTYPE');
  if (isHtml && source === 'google-drive' && driveId) {
    const warningHtml = readFileSync(target, 'utf8');
    const confirmUrl = extractDriveConfirmUrl(warningHtml, driveId);
    if (confirmUrl) {
      const confirmed = await verifyApkDownload({
        downloadUrl: confirmUrl,
        target,
        source: 'google-drive-confirmed',
      });
      return {
        ...confirmed,
        source: 'google-drive',
        confirmedDownload: true,
      };
    }
  }
  if (!result.ok || isHtml || result.size < 100_000) {
    return {
      status: isHtml ? 'restricted' : 'error',
      source,
      statusCode: result.status,
      contentType: result.contentType,
      size: result.size,
      downloadUrl,
    };
  }

  const zip = safeExec('unzip', ['-t', target]);
  const entryList = safeExec('unzip', ['-Z1', target]);
  const entries = entryList.ok ? entryList.stdout.split(/\r?\n/).filter(Boolean) : [];
  const hasManifest = entries.includes('AndroidManifest.xml');
  const nestedApks = entries.filter((entry) => /\.apk$/i.test(entry));
  const status = zip.ok
    ? hasManifest
      ? 'verified-apk'
      : nestedApks.length
        ? 'apk-archive'
        : 'downloaded-not-apk'
    : 'downloaded-not-verified';

  return {
    status,
    source,
    statusCode: result.status,
    contentType: result.contentType,
    size: result.size,
    downloadUrl,
    localPath: relative(root, target),
    zipStatus: zip.ok ? 'ok' : zip.stderr,
    hasManifest,
    nestedApks,
  };
};

const resolveApk = async (submission, repoDir) => {
  const url = submission.apkUrl;
  const slug = submission.slug;
  const target = join(dirs.apks, `${slug}.apk`);

  if (!url || !/^https?:\/\//.test(url)) {
    return { status: 'missing', note: url || 'APK URL is empty' };
  }

  const githubBlob = parseGithubBlob(url);
  let downloadUrl = githubBlob?.raw ?? null;
  let source = downloadUrl ? 'github-raw' : 'direct';
  let driveId = null;

  const release = parseGithubRelease(url);
  if (release) {
    const api = await githubApi(`/repos/${release.owner}/${release.repo}/releases/tags/${release.tag}`);
    if (api.ok) {
      const apkAsset = api.data.assets?.find((asset) => /\.apk$/i.test(asset.name));
      if (apkAsset) {
        downloadUrl = apkAsset.browser_download_url;
        source = 'github-release-asset';
        return {
          ...(await verifyApkDownload({ downloadUrl, target, source })),
          tag: release.tag,
          releaseName: api.data.name,
          releaseUrl: api.data.html_url,
          assetName: apkAsset.name,
          assetSize: apkAsset.size,
        };
      }
      return {
        status: 'release-without-apk-asset',
        source: 'github-release',
        tag: release.tag,
        releaseName: api.data.name,
        releaseUrl: api.data.html_url,
        assetName: null,
        downloadUrl: null,
        assetSize: null,
      };
    }
    return { status: 'error', source: 'github-release', statusCode: api.status, downloadUrl: null };
  }

  if (!downloadUrl && /expo\.dev\/artifacts\/eas\/.+\.apk/i.test(url)) {
    downloadUrl = url;
    source = 'expo-artifact';
  }

  if (!downloadUrl && parseDriveId(url)) {
    driveId = parseDriveId(url);
    downloadUrl = `https://drive.google.com/uc?export=download&id=${driveId}`;
    source = 'google-drive';
  }

  if (!downloadUrl) {
    return { status: 'unknown-link', source: 'unknown', downloadUrl: null, note: url };
  }

  const verified = await verifyApkDownload({ downloadUrl, target, source, driveId });
  const pointer = source === 'github-raw' ? parseGitLfsPointer(target) : null;
  if (pointer && githubBlob) {
    const lfsUrl = await resolveGitLfsObject(githubBlob, pointer);
    if (lfsUrl) {
      return {
        ...(await verifyApkDownload({ downloadUrl: lfsUrl, target, source: 'github-lfs' })),
        lfsPointer: pointer,
      };
    }
    return { ...verified, lfsPointer: pointer, lfsStatus: 'lfs-url-unavailable' };
  }
  return verified;
};

const stripPrivateText = (submission) => {
  const stripDoc = (doc) => {
    const { excerpt, ...rest } = doc;
    return {
      ...rest,
      excerptLength: excerpt?.length ?? 0,
    };
  };
  const { excerpts, files, ...repo } = submission.repo;
  const { vk, ...publicSubmission } = submission;
  return {
    ...publicSubmission,
    repo: {
      ...repo,
      files: files?.slice(0, 80) ?? [],
      fileCountTotal: files?.length ?? 0,
      excerptFiles: Object.keys(excerpts ?? {}),
    },
    promptDoc: stripDoc(submission.promptDoc),
    architectureDoc: stripDoc(submission.architectureDoc),
  };
};

const rowKeys = {
  timestamp: 'Отметка времени',
  name: 'ФИО',
  vk: 'Контакт ( ссылка на VK)',
  repoUrl: 'Ссылка на git',
  apkUrl: 'Ссылка на apk',
  promptsUrl: 'Ссылка на файл с запросами к ИИ',
  architectureUrl:
    'Ссылка на документ с описанием проекта (особенности, на что обратить внимание, описание архитектуры и использованных инструментов (библиотеки, AI-сервисы, подходы) )',
};

const main = async () => {
  const csvResult = await fetchText(sheetCsvUrl);
  if (!csvResult.ok) {
    throw new Error(`Could not fetch sheet CSV: ${csvResult.status}`);
  }
  writeFileSync(join(dirs.raw, 'submissions.csv'), csvResult.text);

  const parsed = parse(csvResult.text, {
    columns: (headers) => headers.map(normalizeHeader),
    skip_empty_lines: true,
    bom: true,
    relax_quotes: true,
  });

  const submissions = [];

  for (const row of parsed) {
    const name = row[rowKeys.name]?.trim();
    if (!name) continue;
    const github = parseGithubRepo(row[rowKeys.repoUrl]?.trim() ?? '');
    const slug = slugify(name);
    const repoDir = github ? join(dirs.repos, `${github.owner}__${github.repo}`) : '';

    if (github && !existsSync(repoDir)) {
      const clone = safeExec('git', ['clone', '--depth=1', github.httpsUrl, repoDir], { stdio: ['ignore', 'pipe', 'pipe'] });
      if (!clone.ok) {
        console.error(`Clone failed for ${github.webUrl}: ${clone.stderr}`);
      }
    }

    const repoSummary = github ? summarizeRepo(repoDir, github) : summarizeRepo('', null);
    const promptsLink = row[rowKeys.promptsUrl]?.trim() ?? '';
    const architectureLink = row[rowKeys.architectureUrl]?.trim() ?? '';
    const [promptDoc, architectureDoc, apk] = await Promise.all([
      resolveLinkedText(promptsLink, repoDir),
      resolveLinkedText(architectureLink, repoDir),
      resolveApk(
        {
          apkUrl: row[rowKeys.apkUrl]?.trim() ?? '',
          slug,
        },
        repoDir,
      ),
    ]);

    submissions.push({
      slug,
      name,
      timestamp: row[rowKeys.timestamp]?.trim() ?? '',
      vk: row[rowKeys.vk]?.trim() ?? '',
      repoUrl: row[rowKeys.repoUrl]?.trim() ?? '',
      apkUrl: row[rowKeys.apkUrl]?.trim() ?? '',
      promptsUrl: promptsLink,
      architectureUrl: architectureLink,
      github,
      repo: repoSummary,
      promptDoc,
      architectureDoc,
      apk,
    });
  }

  const output = {
    generatedAt: new Date().toISOString(),
    source: {
      sheet: 'https://docs.google.com/spreadsheets/d/1_tPa-pdwsPMnMfQ85kkywOZWBOCyUyda8v8B4iJbhp0/edit?usp=sharing',
      csv: sheetCsvUrl,
    },
    submissions,
  };
  const publicOutput = {
    ...output,
    submissions: submissions.map(stripPrivateText),
  };

  writeFileSync(join(root, '.cache', 'analysis-full.json'), `${JSON.stringify(output, null, 2)}\n`);
  writeFileSync(join(dirs.generated, 'analysis.json'), `${JSON.stringify(publicOutput, null, 2)}\n`);
  writeFileSync(join(dirs.srcData, 'analysis.json'), `${JSON.stringify(publicOutput, null, 2)}\n`);
  console.log(`Analyzed ${submissions.length} submissions`);
  console.log(`Wrote ${relative(root, join(dirs.generated, 'analysis.json'))}`);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
