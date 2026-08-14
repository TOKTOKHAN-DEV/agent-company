#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
// assets.ts — 스토어 에셋 게이트.
//
// 사용:
//   pnpm assets            지금 상태 (규격 대조)
//   pnpm assets fit <파일> --kind <종류>    규격 해상도로 맞춤
//
// 왜 있는가 — 콘솔은 리사이즈도 크롭도 하지 않습니다. 600×601 을 올리면
// 거부되고, 그걸 검수 신청 단계에서 알게 되면 영업일 3일을 날립니다.
// 올리기 전에 여기서 잡습니다.
//
// **모델 호출이 없습니다.** 코어 하드 룰 4번입니다 — 사람과 에이전트가 같은
// 판정을 봐야 합니다. 이미지가 예쁜지는 판정하지 않습니다. 규격만 봅니다.
// ─────────────────────────────────────────────────────────────
import { execFileSync } from 'node:child_process';
import { existsSync, renameSync, unlinkSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import {
  ASSET_SPECS,
  checkAssets,
  imageSize,
  missingRequired,
  specOf,
  filesFor,
  type AssetSpec,
} from './asset-spec.ts';

const ROOT = process.cwd();

const color = process.stdout.isTTY;
const red = color ? '\u001b[31m' : '';
const yellow = color ? '\u001b[33m' : '';
const green = color ? '\u001b[32m' : '';
const dim = color ? '\u001b[2m' : '';
const bold = color ? '\u001b[1m' : '';
const reset = color ? '\u001b[0m' : '';

// ─────────────────────────────────────────────────────────────
// fit — 규격 해상도로 맞춘다
// ─────────────────────────────────────────────────────────────

/**
 * 이미지 도구를 찾는다.
 *
 * macOS 는 sips 가 기본 탑재라 아무것도 설치하지 않아도 됩니다. 그 외에는
 * ImageMagick 을 씁니다. 둘 다 없으면 **추측해서 진행하지 않고 멈춥니다** —
 * 규격이 어긋난 파일을 만들어 두면 나중에 콘솔이 반려합니다.
 */
function findTool(): { name: 'sips' | 'magick' | 'convert' } | null {
  for (const name of ['sips', 'magick', 'convert'] as const) {
    try {
      execFileSync('command', ['-v', name], { shell: '/bin/sh', stdio: 'ignore' });
      return { name };
    } catch {
      /* 다음 것을 본다 */
    }
  }
  return null;
}

/**
 * 잘라 채우기(cover). 비율을 유지한 채 목표를 덮을 만큼 키운 뒤 가운데를 자릅니다.
 *
 * 늘리지 않는(stretch) 이유: 로고를 1932×828 에 욱여넣으면 찌그러진 채로
 * 심사에 올라갑니다. 규격은 맞지만 반려 사유가 됩니다.
 */
function fit(file: string, spec: AssetSpec): void {
  const src = imageSize(file);
  if (src == null) {
    fail(`해상도를 읽을 수 없습니다: ${file}`);
  }

  if (src.w === spec.width && src.h === spec.height) {
    console.log(`  ${green}✔${reset} 이미 ${spec.width}×${spec.height} 입니다 — 건드리지 않습니다.`);
    return;
  }

  const tool = findTool();
  if (tool == null) {
    console.error(`
${red}✘${reset} 이미지 도구를 찾을 수 없습니다.

  ${bold}macOS${reset}  sips 가 기본 탑재입니다. 여기서 못 찾는다면 PATH 를 확인하세요.
  ${bold}그 외${reset}  ImageMagick 을 설치하세요 → ${dim}apt install imagemagick${reset} · ${dim}brew install imagemagick${reset}

설치하고 싶지 않다면 ${bold}${spec.width}×${spec.height}${reset} 로 직접 만들어 주세요.
${dim}콘솔은 1px 만 달라도 거부합니다 — 대충 맞춘 것을 올리면 반려됩니다.${reset}
`);
    process.exit(3);
  }

  // 목표를 덮을 만큼 키운다. 짧은 쪽 기준(=큰 배율)을 씁니다.
  const scale = Math.max(spec.width / src.w, spec.height / src.h);
  const midW = Math.max(spec.width, Math.round(src.w * scale));
  const midH = Math.max(spec.height, Math.round(src.h * scale));

  const tmp = join(dirname(file), `.fit-${basename(file)}`);

  try {
    if (tool.name === 'sips') {
      // sips -z 는 높이·너비 순서입니다. 위에서 비율을 계산했으므로 왜곡되지 않습니다.
      execFileSync('sips', ['-z', String(midH), String(midW), file, '--out', tmp], { stdio: 'ignore' });
      // -c 는 가운데를 기준으로 자릅니다.
      execFileSync('sips', ['-c', String(spec.height), String(spec.width), tmp], { stdio: 'ignore' });
    } else {
      execFileSync(
        tool.name,
        [file, '-resize', `${midW}x${midH}!`, '-gravity', 'center', '-extent', `${spec.width}x${spec.height}`, tmp],
        { stdio: 'ignore' },
      );
    }
  } catch {
    if (existsSync(tmp)) unlinkSync(tmp);
    fail(`${tool.name} 이 실패했습니다: ${file}`);
  }

  const out = imageSize(tmp);
  if (out == null || out.w !== spec.width || out.h !== spec.height) {
    if (existsSync(tmp)) unlinkSync(tmp);
    fail(
      `맞추지 못했습니다 — ${out ? `${out.w}×${out.h}` : '읽기 실패'} 가 나왔습니다 (목표 ${spec.width}×${spec.height}). 직접 만들어 주세요.`,
    );
  }

  renameSync(tmp, file);
  console.log(
    `  ${green}✔${reset} ${src.w}×${src.h} → ${bold}${spec.width}×${spec.height}${reset} ${dim}(${tool.name} · 가운데 기준 잘라 채움)${reset}`,
  );
}

function fail(message: string): never {
  console.error(`${red}✘${reset} ${message}`);
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────
// check — 규격 대조
// ─────────────────────────────────────────────────────────────

function check(): void {
  const report = checkAssets(ROOT);
  const missing = missingRequired(ROOT);

  console.log(`${bold}스토어 에셋${reset}`);
  console.log(`${dim}콘솔이 받아 주는 규격인지만 봅니다. 잘 만들었는지는 사람이 봅니다.${reset}\n`);

  for (const spec of ASSET_SPECS) {
    const files = filesFor(ROOT, spec);
    const bad = report.findings.filter((f) => f.spec.kind === spec.kind);
    const tag = `${spec.width}×${spec.height}`;

    if (files.length === 0) {
      const mark = spec.optional ? `${dim}·${reset}` : `${yellow}!${reset}`;
      const note = spec.optional ? '없음 (선택)' : '없음 — 심사 전에 만들어야 합니다';
      console.log(`  ${mark} ${bold}${spec.label}${reset} ${dim}${tag}${reset}  ${note}`);
      console.log(`      ${dim}${spec.path}${reset}`);
      continue;
    }

    if (bad.length === 0) {
      console.log(`  ${green}✔${reset} ${bold}${spec.label}${reset} ${dim}${tag}${reset}  ${files.length}개`);
      continue;
    }

    console.log(`  ${red}✘${reset} ${bold}${spec.label}${reset} ${dim}${tag}${reset}`);
    for (const f of bad) {
      console.log(`      ${red}${f.file}${reset}`);
      console.log(`      ${dim}${f.message}${reset}`);
      console.log(`      ${dim}고치기: pnpm assets fit ${f.file} --kind ${spec.kind}${reset}`);
    }
  }

  const errors = report.findings.length;

  console.log('\n──────────────────────────────────────────────');
  if (errors > 0) {
    console.log(`${red}규격에 맞지 않는 파일 ${errors}개${reset} — 올리면 거부됩니다.`);
  } else if (missing.length > 0) {
    console.log(
      `${yellow}필수 에셋 ${missing.length}종이 비었습니다${reset} — ${missing.map((s) => s.label).join(' · ')}`,
    );
    console.log(`${dim}pnpm agent asset-maker "<무엇을 만들지>" 로 시작하세요.${reset}`);
  } else {
    console.log(`${green}규격 통과${reset} — 파일 ${report.passed}개.`);
    console.log(`${dim}업로드는 asset-maker 가, 검토 요청 버튼은 사람이 누릅니다.${reset}`);
  }

  process.exit(errors > 0 ? 1 : 0);
}

// ─────────────────────────────────────────────────────────────

const [command, ...rest] = process.argv.slice(2);

if (command === undefined || command === 'check') {
  check();
} else if (command === 'fit') {
  const file = rest.find((a) => !a.startsWith('--'));
  const kindIndex = rest.indexOf('--kind');
  const kind = kindIndex >= 0 ? rest[kindIndex + 1] : undefined;

  if (file === undefined) fail('파일 경로가 필요합니다. 예: pnpm assets fit assets/icon.png --kind icon');
  if (!existsSync(file)) fail(`파일이 없습니다: ${file}`);

  // --kind 를 안 줬으면 경로에서 알아냅니다. 규격은 경로가 정하기 때문입니다.
  const resolved =
    kind !== undefined
      ? specOf(kind)
      : ASSET_SPECS.find((s) => (s.dir ? file.startsWith(s.path) : file === s.path));

  if (resolved === undefined) {
    fail(
      `종류를 알 수 없습니다. --kind 로 지정하세요: ${ASSET_SPECS.map((s) => s.kind).join(' · ')}`,
    );
  }

  fit(file, resolved);
} else {
  console.log(`${bold}사용${reset}

  pnpm assets                              규격 대조
  pnpm assets fit <파일> [--kind <종류>]    규격 해상도로 맞춤

${bold}종류${reset}
`);
  for (const s of ASSET_SPECS) {
    console.log(
      `  ${s.kind.padEnd(20)} ${String(`${s.width}×${s.height}`).padEnd(10)} ${s.label}${s.optional ? ` ${dim}(선택)${reset}` : ''}`,
    );
  }
  console.log();
  process.exit(2);
}
