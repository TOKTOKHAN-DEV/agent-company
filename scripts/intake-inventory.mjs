#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
// intake-inventory.mjs — 들여온 폴더의 목차를 만든다.
//
// 사용: node scripts/intake-inventory.mjs inbox/<이름> [원본경로]
//       (직접 부를 일은 없습니다. intake.sh 가 마지막에 호출합니다.)
//
// 왜 목차가 필요한가 — 에이전트에게 폴더 하나를 통째로 던지면 파일을 하나씩
// 열어보며 컨텍스트를 태웁니다. 무엇이 어디 있는지 먼저 알려주면 필요한 것만
// 엽니다. 그래서 이 파일은 **읽을 순서**를 정해 주는 것이 목적입니다.
//
// 결정적입니다. 파일 시스템만 읽고, 네트워크도 모델 호출도 없습니다.
// ─────────────────────────────────────────────────────────────
import { readdirSync, readFileSync, statSync, writeFileSync, existsSync, openSync, readSync, closeSync } from 'node:fs';
import { join, relative, extname, basename } from 'node:path';

const target = process.argv[2];
const origin = process.argv[3] ?? '(알 수 없음)';

if (!target || !existsSync(target)) {
  console.error(`대상을 찾을 수 없습니다: ${target}`);
  process.exit(1);
}

/** 목차를 만들 때만 쓰는 상한. 넘으면 "외 N개" 로 접습니다. */
const LIST_LIMIT = 25;
const TREE_DEPTH = 2;

// ── 파일 훑기 ─────────────────────────────────────────────────
/** @type {{path: string, rel: string, size: number}[]} */
const files = [];

function walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) {
      walk(full);
    } else if (entry.isFile()) {
      let size = 0;
      try {
        size = statSync(full).size;
      } catch {
        continue;
      }
      files.push({ path: full, rel: relative(target, full), size });
    }
  }
}
walk(target);

const totalBytes = files.reduce((sum, f) => sum + f.size, 0);

function human(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${bytes}B`;
}

// ── 이미지 해상도 ─────────────────────────────────────────────
// PNG · JPEG 헤더만 직접 읽습니다. 의존성을 붙이지 않기 위해서입니다.
//
// 템플릿 쪽(app-in-toss 의 asset-spec.ts)에도 비슷한 리더가 있습니다. 일부러
// 나눠 두었습니다 — 코어는 템플릿 파일에 의존할 수 없습니다. 템플릿은 prune 으로
// 사라질 수 있고, 그때 코어가 같이 죽으면 안 됩니다.
function imageSize(path) {
  let fd;
  try {
    fd = openSync(path, 'r');
    const head = Buffer.alloc(65536);
    const read = readSync(fd, head, 0, head.length, 0);
    const buf = head.subarray(0, read);

    // PNG: 89 50 4E 47 → IHDR 의 width/height 는 고정 오프셋
    if (buf.length > 24 && buf.toString('hex', 0, 4) === '89504e47') {
      return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
    }

    // JPEG: SOF 마커를 찾아 들어간다
    if (buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8) {
      let i = 2;
      while (i < buf.length - 9) {
        if (buf[i] !== 0xff) {
          i += 1;
          continue;
        }
        const marker = buf[i + 1];
        // SOF0~SOF3, SOF5~SOF7, SOF9~SOF11, SOF13~SOF15 (DHT/DAC/RST 는 제외)
        if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
          return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
        }
        i += 2 + buf.readUInt16BE(i + 2);
      }
    }

    // GIF
    if (buf.length > 10 && buf.toString('ascii', 0, 3) === 'GIF') {
      return { w: buf.readUInt16LE(6), h: buf.readUInt16LE(8) };
    }

    // WebP (VP8X / VP8 / VP8L 중 VP8X 만 간단히)
    if (buf.length > 30 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
      if (buf.toString('ascii', 12, 16) === 'VP8X') {
        return {
          w: 1 + (buf[24] | (buf[25] << 8) | (buf[26] << 16)),
          h: 1 + (buf[27] | (buf[28] << 8) | (buf[29] << 16)),
        };
      }
    }
    return null;
  } catch {
    return null;
  } finally {
    if (fd !== undefined) closeSync(fd);
  }
}

// ── 분류 ──────────────────────────────────────────────────────
const byExt = new Map();
for (const f of files) {
  const ext = extname(f.rel).toLowerCase() || '(확장자 없음)';
  const cur = byExt.get(ext) ?? { count: 0, bytes: 0 };
  cur.count += 1;
  cur.bytes += f.size;
  byExt.set(ext, cur);
}

const docs = files.filter((f) => /\.(md|mdx|txt|rst|adoc)$/i.test(f.rel));
const images = files.filter((f) => /\.(png|jpe?g|gif|webp|svg|avif)$/i.test(f.rel));
const designFiles = files.filter((f) => /\.(fig|sketch|xd|psd|ai|afdesign)$/i.test(f.rel));
const code = files.filter((f) => /\.(tsx?|jsx?|vue|svelte|py|go|rs|java|kt|swift|rb|php)$/i.test(f.rel));

// 남의 워크스페이스에는 키가 딸려 옵니다. 지우지는 않고 — 원본을 건드리지 않는
// 것이 원칙이므로 — 눈에 띄게 알려서 사람이 판단하게 합니다.
const secretish = files.filter((f) => {
  const name = basename(f.rel).toLowerCase();
  return (
    /^\.env($|\.)/.test(name) ||
    /\.(pem|key|p12|keystore|jks|mobileprovision)$/.test(name) ||
    /^id_(rsa|ed25519|ecdsa)$/.test(name) ||
    /(credential|secret|serviceaccount)/.test(name)
  );
});

// ── 스택 감지 ─────────────────────────────────────────────────
/** @type {string[]} */
const stack = [];

function relOf(name) {
  return files.find((f) => basename(f.rel).toLowerCase() === name.toLowerCase());
}

const pkg = relOf('package.json');
if (pkg) {
  try {
    const json = JSON.parse(readFileSync(pkg.path, 'utf8'));
    const deps = { ...(json.dependencies ?? {}), ...(json.devDependencies ?? {}) };
    const names = Object.keys(deps);
    stack.push(`\`package.json\` — ${json.name ?? '(이름 없음)'}${json.version ? ` v${json.version}` : ''}`);

    const marks = [
      ['next', 'Next.js'],
      ['vite', 'Vite'],
      ['react', 'React'],
      ['vue', 'Vue'],
      ['svelte', 'Svelte'],
      ['@toss/tds-mobile', 'TDS (토스 디자인 시스템)'],
      ['@apps-in-toss/web-framework', 'Apps in Toss WebView'],
      ['tailwindcss', 'Tailwind CSS'],
      ['styled-components', 'styled-components'],
      ['@emotion/react', 'Emotion'],
    ];
    const found = marks.filter(([dep]) => names.includes(dep)).map(([, label]) => label);
    if (found.length > 0) stack.push(`감지된 스택 — ${found.join(' · ')}`);
    stack.push(`의존성 ${names.length}개`);
  } catch {
    stack.push('`package.json` — 파싱 실패 (직접 열어보세요)');
  }
}

for (const [name, label] of [
  ['granite.config.ts', 'Apps in Toss 설정'],
  ['next.config.js', 'Next.js 설정'],
  ['vite.config.ts', 'Vite 설정'],
  ['tailwind.config.js', 'Tailwind 설정'],
  ['requirements.txt', 'Python'],
  ['pyproject.toml', 'Python'],
  ['go.mod', 'Go'],
  ['Cargo.toml', 'Rust'],
  ['Podfile', 'iOS'],
  ['build.gradle', 'Android'],
]) {
  const hit = relOf(name);
  if (hit) stack.push(`\`${hit.rel}\` — ${label}`);
}

// ── 트리 ──────────────────────────────────────────────────────
function tree(dir, depth = 0, prefix = '') {
  if (depth > TREE_DEPTH) return [];
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true })
      .filter((e) => !e.isSymbolicLink() && e.name !== 'INVENTORY.md')
      .sort((a, b) => Number(b.isDirectory()) - Number(a.isDirectory()) || a.name.localeCompare(b.name));
  } catch {
    return [];
  }

  const lines = [];
  const shown = entries.slice(0, LIST_LIMIT);
  for (const entry of shown) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      const inside = files.filter((f) => f.rel.startsWith(`${relative(target, full)}/`)).length;
      lines.push(`${prefix}${entry.name}/  ${inside}개`);
      lines.push(...tree(full, depth + 1, `${prefix}  `));
    } else {
      let size = 0;
      try {
        size = statSync(full).size;
      } catch {
        /* 지워졌으면 0 으로 둔다 */
      }
      lines.push(`${prefix}${entry.name}  ${human(size)}`);
    }
  }
  if (entries.length > shown.length) {
    lines.push(`${prefix}… 외 ${entries.length - shown.length}개`);
  }
  return lines;
}

// ── 쓰기 ──────────────────────────────────────────────────────
const out = [];
const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');

out.push(`# 인계 목차 — ${basename(target)}`);
out.push('');
out.push('> `pnpm intake` 가 만든 파일입니다. 손으로 고쳐도 다시 들여오면 덮어써집니다.');
out.push('> **여기 있는 것은 재료입니다.** 저장소의 진실이 아닙니다 — 뽑아낸 것만 남기세요.');
out.push('');
out.push(`| | |`);
out.push(`| --- | --- |`);
out.push(`| 원본 | \`${origin}\` |`);
out.push(`| 들여온 시각 | ${stamp} |`);
out.push(`| 파일 | ${files.length}개 · ${human(totalBytes)} |`);
out.push('');

if (secretish.length > 0) {
  out.push('## ⚠ 비밀이 섞여 있을 수 있습니다');
  out.push('');
  out.push('아래 파일은 이름만 보고 골라낸 것입니다. **읽거나 커밋하기 전에 사람이 확인하세요.**');
  out.push('`inbox/` 는 버전 관리하지 않지만, 내용을 다른 데로 옮기면 그때부터는 새어 나갑니다.');
  out.push('');
  for (const f of secretish.slice(0, LIST_LIMIT)) out.push(`- \`${f.rel}\``);
  if (secretish.length > LIST_LIMIT) out.push(`- … 외 ${secretish.length - LIST_LIMIT}개`);
  out.push('');
}

if (stack.length > 0) {
  out.push('## 무엇으로 만들어진 것인가');
  out.push('');
  for (const line of stack) out.push(`- ${line}`);
  out.push('');
}

out.push('## 먼저 읽을 것');
out.push('');
if (docs.length === 0) {
  out.push('문서가 없습니다. 코드와 이미지에서 의도를 읽어내야 합니다.');
} else {
  // README 를 맨 위로 올립니다. 사람이 남긴 의도가 대개 거기 있습니다.
  const sorted = [...docs].sort((a, b) => {
    const score = (f) => (/readme/i.test(basename(f.rel)) ? 0 : 1);
    return score(a) - score(b) || a.rel.localeCompare(b.rel);
  });
  for (const f of sorted.slice(0, LIST_LIMIT)) out.push(`- \`${f.rel}\`  ${human(f.size)}`);
  if (sorted.length > LIST_LIMIT) out.push(`- … 외 ${sorted.length - LIST_LIMIT}개`);
}
out.push('');

if (images.length > 0) {
  out.push('## 이미지');
  out.push('');
  out.push('해상도는 파일 헤더에서 직접 읽었습니다. SVG 는 벡터라 해상도가 없습니다.');
  out.push('');
  out.push('| 파일 | 해상도 | 크기 |');
  out.push('| --- | --- | --- |');
  for (const f of images.slice(0, LIST_LIMIT)) {
    const size = /\.svg$/i.test(f.rel) ? null : imageSize(f.path);
    const dim = size ? `${size.w}×${size.h}` : /\.svg$/i.test(f.rel) ? '벡터' : '—';
    out.push(`| \`${f.rel}\` | ${dim} | ${human(f.size)} |`);
  }
  if (images.length > LIST_LIMIT) out.push(`| … 외 ${images.length - LIST_LIMIT}개 | | |`);
  out.push('');
}

if (designFiles.length > 0) {
  out.push('## 디자인 원본 파일');
  out.push('');
  out.push('**이 파일들은 열 수 없습니다.** 텍스트가 아니라 바이너리입니다.');
  out.push('필요하면 사람에게 PNG 로 내보내 달라고 하거나, Figma MCP 로 접근하세요.');
  out.push('');
  for (const f of designFiles.slice(0, LIST_LIMIT)) out.push(`- \`${f.rel}\`  ${human(f.size)}`);
  out.push('');
}

out.push('## 구성');
out.push('');
out.push('```');
out.push(...tree(target));
out.push('```');
out.push('');

out.push('## 확장자별');
out.push('');
const exts = [...byExt.entries()].sort((a, b) => b[1].count - a[1].count).slice(0, 15);
out.push('| 확장자 | 개수 | 크기 |');
out.push('| --- | --- | --- |');
for (const [ext, v] of exts) out.push(`| \`${ext}\` | ${v.count} | ${human(v.bytes)} |`);
out.push('');

out.push('## 여기서 무엇을 할 것인가');
out.push('');
out.push('이 폴더는 **읽기 전용 재료**입니다. 안의 파일을 고치지 말고, 실행하지도 마세요.');
out.push('남이 준 zip 은 읽을거리이지 실행할 것이 아닙니다.');
out.push('');
out.push(`- 코드 ${code.length}개 · 문서 ${docs.length}개 · 이미지 ${images.length}개`);
out.push('- 여기서 얻은 결론은 저장소 쪽에 씁니다 — 명세는 `specs/`, 에셋은 `assets/`, 근거는 `wiki/`');
out.push('');

writeFileSync(join(target, 'INVENTORY.md'), `${out.join('\n')}\n`, 'utf8');

console.log(`  문서 ${docs.length} · 이미지 ${images.length} · 코드 ${code.length}${secretish.length > 0 ? ` · ⚠ 비밀 의심 ${secretish.length}` : ''}`);
