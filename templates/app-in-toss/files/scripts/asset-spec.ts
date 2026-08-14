// ─────────────────────────────────────────────────────────────
// asset-spec.ts — 콘솔이 받아 주는 이미지 규격. 단일 진실 공급원.
//
// 읽는 쪽: scripts/assets.ts (CLI) · scripts/preflight.ts (게이트)
//
// **여기 숫자는 협상 대상이 아닙니다.** 콘솔은 리사이즈도 크롭도 하지 않고,
// 1px 이라도 다르면 업로드한 이미지를 거부합니다. 반려되면 다시 영업일 3일을
// 기다립니다 — 그래서 올리기 전에 기계로 잡습니다 (코어 하드 룰 4).
//
// 출처: apps-in-toss-console MCP 의 image_upload_url · miniapp_update_icon ·
//       miniapp_update_screenshots 도구 설명. 콘솔 웹의 파일 선택 규칙과 같습니다.
// ─────────────────────────────────────────────────────────────
import { existsSync, openSync, readSync, closeSync, statSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export type AssetKind =
  | 'icon'
  | 'icon-dark'
  | 'thumbnail'
  | 'screenshot'
  | 'screenshot-landscape'
  | 'iap-icon';

export type AssetSpec = {
  kind: AssetKind;
  label: string;
  width: number;
  height: number;
  /** 콘솔이 받는 확장자. 로고·썸네일은 PNG 만입니다. */
  formats: ('png' | 'jpg')[];
  /** 이 규격의 파일이 놓이는 곳. 디렉터리면 그 안의 파일이 모두 이 규격입니다. */
  path: string;
  dir: boolean;
  /** 없어도 되는 것인지 */
  optional: boolean;
  /** 콘솔에서 어디에 들어가는 값인지 */
  slot: string;
};

/** 파일당 상한. image_upload_url 단계에서 거부됩니다. */
export const MAX_BYTES = 5 * 1024 * 1024;

export const ASSET_SPECS: AssetSpec[] = [
  {
    kind: 'icon',
    label: '앱 로고',
    width: 600,
    height: 600,
    formats: ['png'],
    path: 'assets/icon.png',
    dir: false,
    optional: false,
    slot: 'miniApp.iconUri',
  },
  {
    // 앱 UI 는 라이트 모드만 지원하지만(이 회사의 하드 룰), 로고는 다릅니다.
    // 토스 앱 자체가 다크 모드를 지원해서 목록에 얹힐 로고가 따로 필요합니다.
    kind: 'icon-dark',
    label: '다크모드 로고',
    width: 600,
    height: 600,
    formats: ['png'],
    path: 'assets/icon-dark.png',
    dir: false,
    optional: true,
    slot: 'miniApp.darkModeIconUri',
  },
  {
    kind: 'thumbnail',
    label: '가로 썸네일',
    width: 1932,
    height: 828,
    formats: ['png'],
    path: 'assets/thumbnail.png',
    dir: false,
    optional: false,
    slot: 'images[] imageType=THUMBNAIL · orientation=HORIZONTAL',
  },
  {
    kind: 'screenshot',
    label: '세로 스크린샷',
    width: 636,
    height: 1048,
    formats: ['png', 'jpg'],
    path: 'assets/screenshots',
    dir: true,
    optional: false,
    slot: 'images[] imageType=PREVIEW · orientation=VERTICAL',
  },
  {
    kind: 'screenshot-landscape',
    label: '가로 스크린샷',
    width: 1504,
    height: 741,
    formats: ['png', 'jpg'],
    path: 'assets/screenshots-landscape',
    dir: true,
    optional: true,
    slot: 'images[] imageType=PREVIEW · orientation=HORIZONTAL',
  },
  {
    kind: 'iap-icon',
    label: 'IAP 상품 아이콘',
    width: 1024,
    height: 1024,
    formats: ['png'],
    path: 'assets/iap',
    dir: true,
    optional: true,
    slot: 'iap_product_create_inspection 의 iconImgUrl',
  },
];

export function specOf(kind: string): AssetSpec | undefined {
  return ASSET_SPECS.find((s) => s.kind === kind);
}

/**
 * 받침에 따라 조사를 고른다. "가로 썸네일는" 같은 문장이 나오면 사람이 게이트를
 * 대충 만든 것으로 읽습니다 — 읽기 싫은 출력은 안 읽힙니다.
 */
export function josa(word: string, withBatchim: string, without: string): string {
  const last = word.trim().at(-1) ?? '';
  const code = last.charCodeAt(0);
  // 한글 음절이 아니면(숫자 · 영문 등) 판정할 수 없으니 받침 없는 쪽으로 둡니다.
  if (code < 0xac00 || code > 0xd7a3) return without;
  return (code - 0xac00) % 28 === 0 ? without : withBatchim;
}

// ── 해상도 읽기 ───────────────────────────────────────────────
// PNG · JPEG 헤더를 직접 읽습니다. 의존성을 붙이지 않기 위해서입니다 —
// 게이트가 설치 상태에 따라 다르게 동작하면 결정적이지 않습니다.

export type Size = { w: number; h: number; format: 'png' | 'jpg' };

export function imageSize(path: string): Size | null {
  let fd: number | undefined;
  try {
    fd = openSync(path, 'r');
    const head = Buffer.alloc(65536);
    const read = readSync(fd, head, 0, head.length, 0);
    const buf = head.subarray(0, read);

    // PNG — IHDR 이 시그니처 바로 뒤에 오므로 오프셋이 고정입니다.
    if (buf.length > 24 && buf.toString('hex', 0, 4) === '89504e47') {
      return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20), format: 'png' };
    }

    // JPEG — 마커를 따라가며 SOF 를 찾습니다.
    if (buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8) {
      let i = 2;
      while (i < buf.length - 9) {
        if (buf[i] !== 0xff) {
          i += 1;
          continue;
        }
        const marker = buf[i + 1] ?? 0;
        // SOF0~SOF15 중 DHT(c4) · JPG(c8) · DAC(cc) 는 프레임 헤더가 아닙니다.
        if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
          return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7), format: 'jpg' };
        }
        i += 2 + buf.readUInt16BE(i + 2);
      }
    }
    return null;
  } catch {
    return null;
  } finally {
    if (fd !== undefined) closeSync(fd);
  }
}

// ── 검사 ──────────────────────────────────────────────────────

export type AssetFinding = {
  level: 'error' | 'warn';
  file: string;
  spec: AssetSpec;
  message: string;
};

export type AssetReport = {
  findings: AssetFinding[];
  /** 규격을 통과한 파일 수 */
  passed: number;
  /** 하나라도 파일이 있었는지. 없으면 "아직 안 만든 것"과 구분합니다. */
  any: boolean;
};

function filesFor(root: string, spec: AssetSpec): string[] {
  const full = join(root, spec.path);
  if (!existsSync(full)) return [];
  if (!spec.dir) return [spec.path];
  try {
    return readdirSync(full)
      .filter((n) => /\.(png|jpe?g)$/i.test(n))
      .sort()
      .map((n) => `${spec.path}/${n}`);
  } catch {
    return [];
  }
}

/**
 * assets/ 를 규격과 대조한다. 파일 시스템만 읽고 네트워크도 모델 호출도 없다.
 *
 * 없는 파일은 error 로 잡지 않는다 — 아직 안 만든 것과 잘못 만든 것은 다르다.
 * 필수 항목이 비었는지는 호출하는 쪽에서 판단한다 (`missingRequired`).
 */
export function checkAssets(root: string): AssetReport {
  const findings: AssetFinding[] = [];
  let passed = 0;
  let any = false;

  for (const spec of ASSET_SPECS) {
    for (const rel of filesFor(root, spec)) {
      any = true;
      const full = join(root, rel);
      const ext = rel.toLowerCase().replace(/^.*\./, '').replace('jpeg', 'jpg');

      if (!spec.formats.includes(ext as 'png' | 'jpg')) {
        findings.push({
          level: 'error',
          file: rel,
          spec,
          message: `${spec.label}${josa(spec.label, '은', '는')} ${spec.formats.join('·').toUpperCase()} 만 받습니다 (지금 ${ext.toUpperCase()}).`,
        });
        continue;
      }

      const bytes = statSync(full).size;
      if (bytes > MAX_BYTES) {
        findings.push({
          level: 'error',
          file: rel,
          spec,
          message: `${(bytes / 1024 / 1024).toFixed(1)}MB — 상한은 5MB 입니다. image_upload_url 단계에서 거부됩니다.`,
        });
        continue;
      }

      const size = imageSize(full);
      if (size == null) {
        findings.push({
          level: 'error',
          file: rel,
          spec,
          message: '해상도를 읽을 수 없습니다. 손상됐거나 PNG·JPEG 가 아닙니다.',
        });
        continue;
      }

      // 확장자와 실제 포맷이 다른 경우. PNG 를 .jpg 로 이름만 바꾼 파일이 흔합니다.
      // 콘솔은 확장자로 contentType 을 정하고, PUT 은 그 헤더가 발급 조건과 다르면
      // 거부합니다 — 겉보기엔 멀쩡한데 업로드만 실패해서 원인을 찾기 어렵습니다.
      if (size.format !== ext) {
        findings.push({
          level: 'error',
          file: rel,
          spec,
          message: `확장자는 ${ext.toUpperCase()} 인데 실제로는 ${size.format.toUpperCase()} 입니다. 이름만 바꾸지 말고 변환하세요.`,
        });
        continue;
      }

      if (size.w !== spec.width || size.h !== spec.height) {
        findings.push({
          level: 'error',
          file: rel,
          spec,
          message: `${size.w}×${size.h} — ${spec.label}${josa(spec.label, '은', '는')} 정확히 ${spec.width}×${spec.height} 여야 합니다. 1px 만 달라도 거부됩니다.`,
        });
        continue;
      }

      passed += 1;
    }
  }

  return { findings, passed, any };
}

/** 필수인데 파일이 하나도 없는 규격. */
export function missingRequired(root: string): AssetSpec[] {
  return ASSET_SPECS.filter((s) => !s.optional && filesFor(root, s).length === 0);
}

export { filesFor };
