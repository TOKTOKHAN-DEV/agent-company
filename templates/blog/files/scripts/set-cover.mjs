#!/usr/bin/env node
/**
 * set-cover.mjs — 글의 프론트매터 `cover` 블록을 갱신한다.
 *
 * codex-imagegen.sh 가 이미지 생성 후 호출한다. 직접 실행할 일은 드물다.
 *
 * 사용:
 *   node scripts/set-cover.mjs --slug <slug> --src <path> --alt <text>
 *        --source <codex-imagegen|user-upload|web-search|none> [--origin <text>]
 *        [--credit <text>] [--license <text>]
 *
 * gray-matter 는 packages/content 의 의존성에서 해석한다. 루트에 중복
 * 설치하지 않기 위해서다.
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(ROOT, 'packages/content/package.json'));

let matter;
try {
  matter = require('gray-matter');
} catch {
  console.error('[set-cover] gray-matter 를 찾을 수 없습니다. `pnpm install` 을 먼저 실행하세요.');
  process.exit(1);
}

const ALLOWED_SOURCES = ['codex-imagegen', 'user-upload', 'web-search', 'none'];

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i];
    if (!key?.startsWith('--')) {
      console.error(`[set-cover] 알 수 없는 인자: ${key}`);
      process.exit(2);
    }
    args[key.slice(2)] = argv[i + 1] ?? '';
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));

for (const required of ['slug', 'src', 'alt', 'source']) {
  if (!args[required]) {
    console.error(`[set-cover] --${required} 는 필수입니다.`);
    process.exit(2);
  }
}

// 하드 룰의 마지막 방어선: 허용된 출처만 기록할 수 있다.
if (!ALLOWED_SOURCES.includes(args.source)) {
  console.error(
    `[set-cover] 허용되지 않은 출처: "${args.source}"\n` +
      `허용값: ${ALLOWED_SOURCES.join(', ')}\n` +
      `이미지 생성은 Codex imagegen 전용입니다 (ADR-0002).`,
  );
  process.exit(1);
}

if (args.source === 'web-search' && !args.license) {
  console.error('[set-cover] web-search 출처에는 --license 가 필수입니다.');
  process.exit(1);
}

const contentDir = process.env.CONTENT_DIR
  ? path.resolve(ROOT, process.env.CONTENT_DIR)
  : path.join(ROOT, 'content');
const file = path.join(contentDir, 'posts', `${args.slug}.md`);

if (!fs.existsSync(file)) {
  console.error(`[set-cover] 글을 찾을 수 없습니다: ${file}`);
  process.exit(1);
}

const parsed = matter(fs.readFileSync(file, 'utf8'));

parsed.data.cover = {
  src: args.src,
  alt: args.alt,
  source: args.source,
  ...(args.origin ? { origin: args.origin } : {}),
  ...(args.credit ? { credit: args.credit } : {}),
  ...(args.license ? { license: args.license } : {}),
};
parsed.data.updatedAt = new Date().toISOString();

fs.writeFileSync(file, matter.stringify(parsed.content, parsed.data), 'utf8');
console.log(`[set-cover] ${args.slug} 의 cover 갱신 완료 (source: ${args.source})`);
