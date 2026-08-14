#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
// preflight.ts — 심사 사전점검. 이 템플릿의 출고 게이트.
//
// 사용:
//   pnpm preflight              모든 항목
//   pnpm preflight --errors     error 만
//
// 종료 코드 1 = 제출을 막는 error 가 남아 있음. CI 게이트로 그대로 씁니다.
//
// **여기에 모델 호출을 넣지 마세요.** 코어 하드 룰 4번입니다. 사람과 에이전트가
// 같은 판정을 봐야 하고, 같은 입력이면 언제 돌려도 같은 결과가 나와야 합니다.
//
// 이 파일이 검사하는 것은 공식 체크리스트 중 **기계로 판정 가능한 것뿐**입니다.
// "인터랙션이 2초 안에 반응하는가" 같은 항목은 사람이 봐야 합니다.
// 전체 목록: https://developers-apps-in-toss.toss.im/checklist/app-nongame.md
// ─────────────────────────────────────────────────────────────
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { checkAssets, missingRequired, josa } from './asset-spec.ts';

type Level = 'error' | 'warn';

type Finding = {
  level: Level;
  rule: string;
  message: string;
  where?: string;
};

const ROOT = process.cwd();
const MINIAPP = join(ROOT, 'apps', 'miniapp');
const SRC = join(MINIAPP, 'src');
const SPECS = join(ROOT, 'specs');
const DIST = join(MINIAPP, 'dist');

/** 번들 상한. 압축 해제 기준입니다. */
const BUNDLE_LIMIT_BYTES = 100 * 1024 * 1024;

const findings: Finding[] = [];

function report(level: Level, rule: string, message: string, where?: string): void {
  findings.push({ level, rule, message, where });
}

function read(path: string): string {
  try {
    return readFileSync(path, 'utf8');
  } catch {
    return '';
  }
}

/** 디렉터리를 재귀로 훑어 파일 경로를 모은다. */
function walk(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist') continue;
      walk(full, out);
    } else {
      out.push(full);
    }
  }
  return out;
}

function dirSize(dir: string): number {
  return walk(dir).reduce((sum, f) => {
    try {
      return sum + statSync(f).size;
    } catch {
      return sum;
    }
  }, 0);
}

/** .env 는 셸 문법입니다. 값만 뽑는 최소 파서로 충분합니다. */
function envValue(name: string): string {
  for (const file of ['.env', '.env.example']) {
    const line = read(join(ROOT, file))
      .split('\n')
      .find((l) => new RegExp(`^\\s*${name}=`).test(l));
    if (line == null) continue;
    const raw = line.slice(line.indexOf('=') + 1).trim();
    const value = raw.replace(/^["']|["']$/g, '');
    if (value !== '' && file === '.env') return value;
    if (value !== '') return value;
  }
  return '';
}

// ── 1. granite.config.ts ──────────────────────────────────────
const configPath = join(MINIAPP, 'granite.config.ts');
const config = read(configPath);

if (config === '') {
  report('error', 'config', 'apps/miniapp/granite.config.ts 가 없습니다. 번들을 만들 수 없습니다.');
} else {
  const appName = /appName:\s*['"]([^'"]+)['"]/.exec(config)?.[1] ?? '';

  if (appName === '' || appName === 'my-miniapp') {
    report(
      'error',
      'config',
      `appName 이 기본값입니다 ('${appName || '(비어 있음)'}'). 콘솔에 등록한 식별자로 바꾸세요.`,
      'apps/miniapp/granite.config.ts',
    );
  }

  const envName = envValue('TOSS_MINIAPP_NAME');
  if (appName !== '' && envName !== '' && appName !== envName) {
    report(
      'error',
      'config',
      `appName('${appName}') 과 .env 의 TOSS_MINIAPP_NAME('${envName}') 이 다릅니다. 번들 업로드가 엉뚱한 미니앱에 붙습니다.`,
      'apps/miniapp/granite.config.ts',
    );
  }

  // 내비게이션 바 테마는 라이트여야 합니다. 심사 항목입니다.
  // (미니앱 이름·아이콘 같은 스토어 정보는 config 가 아니라 콘솔에서 관리합니다.)
  const navTheme = /theme:\s*['"]([^'"]+)['"]/.exec(config)?.[1];
  if (navTheme != null && navTheme !== 'light') {
    report(
      'error',
      'light-only',
      `navigationBar.theme 이 '${navTheme}' 입니다. 라이트 모드만 지원합니다.`,
      'apps/miniapp/granite.config.ts',
    );
  }
}

// ── 2. 개인정보처리방침 ───────────────────────────────────────
if (envValue('TOSS_PRIVACY_POLICY_URL') === '') {
  report(
    'error',
    'privacy',
    'TOSS_PRIVACY_POLICY_URL 이 비어 있습니다. 개인정보처리방침은 심사 필수 항목입니다.',
    '.env',
  );
}

// ── 3. 소스 스캔 ──────────────────────────────────────────────
// 심사에서 바로 반려되는 패턴들.
//
// **주석은 걷어내고 봅니다.** "eval 을 쓰지 마세요" 같은 주석까지 잡으면 규칙을
// 설명하는 것조차 error 가 되고, 그러면 사람들이 게이트를 무시하기 시작합니다.
const sourceFiles = [
  ...walk(SRC),
  join(MINIAPP, 'index.html'),
  join(MINIAPP, 'vite.config.ts'),
].filter((f) => existsSync(f) && /\.(tsx?|jsx?|css|html)$/.test(f));

/**
 * 주석 제거. 완전한 파서는 아니지만 오탐을 없애기엔 충분합니다.
 * `//` 는 앞에 `:` 가 없을 때만 주석으로 봅니다 — `https://` 를 지우지 않기 위해서입니다.
 */
function stripComments(source: string): string {
  return source
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

const BANNED: { pattern: RegExp; rule: string; message: string }[] = [
  {
    pattern: /\beval\s*\(|new\s+Function\s*\(/,
    rule: 'no-eval',
    message: '외부 코드 실행(eval / new Function)은 금지입니다.',
  },
  {
    pattern: /(?<!w)ws:\/\//,
    rule: 'wss-only',
    message: '평문 소켓(ws://)은 금지입니다. wss:// 만 허용됩니다.',
  },
  {
    pattern: /intoss-private:\/\//,
    rule: 'share-scheme',
    message: '공유는 intoss:// 를 씁니다. intoss-private:// 는 금지입니다.',
  },
  {
    pattern: /prefers-color-scheme\s*:\s*dark/,
    rule: 'light-only',
    message: '라이트 모드만 지원합니다. 다크 모드 분기를 넣지 마세요.',
  },
];

const stripped = new Map(sourceFiles.map((f) => [f, stripComments(read(f))]));

for (const file of sourceFiles) {
  const content = stripped.get(file) ?? '';
  const where = relative(ROOT, file);
  for (const { pattern, rule, message } of BANNED) {
    if (pattern.test(content)) {
      report('error', rule, message, where);
    }
  }
}

// ── 4. TDS 사용 (비게임 미니앱 필수) ──────────────────────────
// import 문은 코드라 주석을 걷어내도 남습니다.
const usesTds = [...stripped.values()].some((c) => /@toss\/tds-mobile/.test(c));
if (!usesTds) {
  report(
    'error',
    'tds',
    '@toss/tds-mobile 을 쓰지 않습니다. 비게임 WebView 미니앱은 TDS 사용이 필수입니다.',
    'apps/miniapp/src',
  );
}

// ── 5. 확대 제스처 차단 ───────────────────────────────────────
const html = read(join(MINIAPP, 'index.html'));
if (html !== '' && !/user-scalable\s*=\s*no/.test(html)) {
  report(
    'error',
    'no-zoom',
    'viewport 에 user-scalable=no 가 없습니다. 확대 제스처는 꺼야 합니다(지도 등 예외 제외).',
    'apps/miniapp/index.html',
  );
}

// ── 6. 명세 ───────────────────────────────────────────────────
// "명세에 없는 화면을 만들지 않는다" 가 이 회사의 하드 룰이라, 명세가 하나도
// 없으면 구현이 근거 없이 진행된 것입니다.
const specFiles = existsSync(SPECS)
  ? readdirSync(SPECS).filter((f) => f.endsWith('.md') && !f.startsWith('_') && f !== 'README.md')
  : [];

if (specFiles.length === 0) {
  report('warn', 'specs', 'specs/ 에 명세가 없습니다. 화면을 만들기 전에 수용 기준을 쓰세요.');
}

for (const name of specFiles) {
  const spec = read(join(SPECS, name));
  if (!/##\s*수용 기준/.test(spec)) {
    report('error', 'specs', '"## 수용 기준" 섹션이 없습니다.', `specs/${name}`);
  }
  if (!/##\s*화면/.test(spec)) {
    report('warn', 'specs', '"## 화면" 섹션이 없습니다.', `specs/${name}`);
  }
}

// ── 7. 번들 ───────────────────────────────────────────────────
if (existsSync(DIST)) {
  const size = dirSize(DIST);
  const mb = (size / 1024 / 1024).toFixed(1);
  if (size > BUNDLE_LIMIT_BYTES) {
    report(
      'error',
      'bundle-size',
      `번들이 ${mb}MB 입니다. 상한은 100MB(압축 해제 기준)입니다. 큰 에셋은 CDN 으로 빼세요.`,
      'apps/miniapp/dist',
    );
  }
  if (!existsSync(join(DIST, 'index.html'))) {
    report(
      'error',
      'static-only',
      'dist/index.html 이 없습니다. 심사는 CSR·SSG 만 허용합니다 — 정적 산출물이어야 합니다.',
      'apps/miniapp/dist',
    );
  }
} else {
  report('warn', 'bundle', '빌드 산출물이 없습니다. `pnpm build:miniapp` 뒤에 다시 돌리세요.');
}

// ── 8. 스토어 에셋 ────────────────────────────────────────────
// 규격 판정은 scripts/asset-spec.ts 가 합니다. `pnpm assets` 와 같은 모듈을 쓰므로
// 두 명령이 다른 답을 내놓을 수 없습니다 — 판정이 갈리면 사람은 게이트를 믿지 않습니다.
//
// 아직 안 만든 것은 warn 입니다. 화면을 만드는 중에 로고가 없다고 빌드를 막으면
// 사람들이 --errors 만 보기 시작하고, 그러면 게이트가 죽습니다.
for (const finding of checkAssets(ROOT).findings) {
  report(finding.level, 'store-assets', finding.message, finding.file);
}

for (const spec of missingRequired(ROOT)) {
  report(
    'warn',
    'store-assets',
    `${spec.label}(${spec.width}×${spec.height})${josa(spec.label, '이', '가')} 없습니다. 검수 신청에 필요합니다.`,
    spec.path,
  );
}

// ── 출력 ──────────────────────────────────────────────────────
const onlyErrors = process.argv.includes('--errors');
const shown = onlyErrors ? findings.filter((f) => f.level === 'error') : findings;

const errors = findings.filter((f) => f.level === 'error').length;
const warns = findings.filter((f) => f.level === 'warn').length;

const color = process.stdout.isTTY;
const red = color ? '\u001b[31m' : '';
const yellow = color ? '\u001b[33m' : '';
const green = color ? '\u001b[32m' : '';
const dim = color ? '\u001b[2m' : '';
const bold = color ? '\u001b[1m' : '';
const reset = color ? '\u001b[0m' : '';

console.log(`${bold}심사 사전점검${reset}`);
console.log(`${dim}기계로 판정 가능한 항목만 봅니다. 나머지는 사람이 확인해야 합니다.${reset}\n`);

for (const f of shown) {
  const mark = f.level === 'error' ? `${red}✘${reset}` : `${yellow}!${reset}`;
  console.log(`  ${mark} ${bold}${f.rule}${reset}  ${f.message}`);
  if (f.where != null) console.log(`      ${dim}${f.where}${reset}`);
}

if (shown.length === 0) {
  console.log(`  ${green}✔${reset} 걸리는 항목이 없습니다.`);
}

console.log('\n──────────────────────────────────────────────');
if (errors > 0) {
  console.log(`${red}error ${errors}건${reset}, warn ${warns}건 — 제출할 수 없습니다.`);
} else {
  console.log(`${green}error 없음${reset}, warn ${warns}건 — 기계 검사는 통과했습니다.`);
  console.log(
    `${dim}사람이 확인할 항목이 남아 있습니다. wiki/04-review-checklist.md 를 보세요.${reset}`,
  );
}

process.exit(errors > 0 ? 1 : 0);
