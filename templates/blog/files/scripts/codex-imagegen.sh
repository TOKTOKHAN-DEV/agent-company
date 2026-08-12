#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# codex-imagegen.sh — 이 프로젝트에서 이미지를 만드는 유일한 경로.
#
# 사용:
#   pnpm imagegen --slug <post-slug> --prompt "<장면 설명>"
#   pnpm imagegen --slug <post-slug> --prompt "..." --alt "대체 텍스트"
#
# 정책 (ADR-0002 · 하드 룰):
#   이미지 생성은 Codex `imagegen` 으로만 한다. Claude 의 이미지 생성은 금지.
#   Codex 부재 시: 이미지 생략 → 사용자 직접 첨부 → 웹 검색(라이선스 확인) 순.
#
# Codex CLI 의 이미지 생성 호출 방식이 환경마다 다를 수 있으므로,
# CODEX_IMAGEGEN_CMD 환경 변수로 명령을 덮어쓸 수 있게 열어 두었다.
#   예: CODEX_IMAGEGEN_CMD='codex imagegen --out {out} "{prompt}"'
#       ({out} 과 {prompt} 가 치환됩니다)
# ─────────────────────────────────────────────────────────────
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT" || exit 1

RED=$'\033[31m'; GREEN=$'\033[32m'; YELLOW=$'\033[33m'; DIM=$'\033[2m'; BOLD=$'\033[1m'; RESET=$'\033[0m'
[ -t 1 ] || { RED=''; GREEN=''; YELLOW=''; DIM=''; BOLD=''; RESET=''; }

ok()   { printf '%s✔%s %s\n' "$GREEN" "$RESET" "$1"; }
warn() { printf '%s!%s %s\n' "$YELLOW" "$RESET" "$1"; }
die()  { printf '%s✘%s %s\n' "$RED" "$RESET" "$1"; exit 1; }

SLUG=""; PROMPT=""; ALT=""; STYLE="clean editorial illustration, flat vector, muted palette, no text, no lettering"

while [ $# -gt 0 ]; do
  case "$1" in
    --slug)   SLUG="${2:-}"; shift 2 ;;
    --prompt) PROMPT="${2:-}"; shift 2 ;;
    --alt)    ALT="${2:-}"; shift 2 ;;
    --style)  STYLE="${2:-}"; shift 2 ;;
    *) die "알 수 없는 옵션: $1" ;;
  esac
done

[ -n "$SLUG" ]   || die "--slug 는 필수입니다. 예: pnpm imagegen --slug my-post --prompt \"...\""
[ -n "$PROMPT" ] || die "--prompt 는 필수입니다."

POST_FILE="content/posts/${SLUG}.md"
[ -f "$POST_FILE" ] || die "글을 찾을 수 없습니다: $POST_FILE"

OUT_DIR="${IMAGE_OUTPUT_DIR:-apps/web/public/images/posts}"
mkdir -p "$OUT_DIR"
OUT_FILE="$OUT_DIR/${SLUG}.png"
# web/public 기준 URL 경로 (Next.js Image 가 사용)
PUBLIC_SRC="/${OUT_DIR#apps/web/public/}/${SLUG}.png"
PUBLIC_SRC="${PUBLIC_SRC//\/\//\/}"

FULL_PROMPT="${PROMPT}. Style: ${STYLE}."

# ── Codex 가용성 확인 ─────────────────────────────────────────
if ! command -v codex >/dev/null 2>&1; then
  cat <<EOF

${YELLOW}${BOLD}Codex 를 찾을 수 없습니다 — 이미지를 생성하지 않습니다.${RESET}

이 프로젝트는 이미지 생성을 Codex \`imagegen\` 으로만 합니다 (ADR-0002).
Claude 로 이미지를 만드는 것은 금지되어 있습니다.

${BOLD}폴백 (이 순서로):${RESET}

  1. ${BOLD}이미지 없이 진행${RESET} — 기본값. 커버는 발행 필수 요소가 아닙니다.

  2. ${BOLD}직접 첨부${RESET} — 이미지를 아래 경로에 두고 프론트매터를 갱신하세요.
     ${DIM}cp <이미지> $OUT_FILE${RESET}
     ${DIM}node scripts/set-cover.mjs --slug $SLUG --src "$PUBLIC_SRC" \\
       --alt "설명" --source user-upload${RESET}

  3. ${BOLD}웹 검색${RESET} — 라이선스가 명확한 이미지만. 라이선스 기록이 필수입니다.
     ${DIM}node scripts/set-cover.mjs --slug $SLUG --src "$PUBLIC_SRC" \\
       --alt "설명" --source web-search --origin "<원본 URL>" --license "<라이선스>"${RESET}

Codex 설치: ${DIM}https://developers.openai.com/codex/cli${RESET}

EOF
  exit 3
fi

# ── 생성 ──────────────────────────────────────────────────────
printf '%s생성 중%s  slug=%s\n' "$BOLD" "$RESET" "$SLUG"
printf '%s  프롬프트: %s%s\n' "$DIM" "$FULL_PROMPT" "$RESET"
printf '%s  출력:     %s%s\n\n' "$DIM" "$OUT_FILE" "$RESET"

if [ -n "${CODEX_IMAGEGEN_CMD:-}" ]; then
  # 사용자 지정 명령. {out} 과 {prompt} 를 치환한다.
  CMD="${CODEX_IMAGEGEN_CMD//\{out\}/$OUT_FILE}"
  CMD="${CMD//\{prompt\}/$FULL_PROMPT}"
  eval "$CMD"
else
  # 기본 경로: codex 에게 imagegen 도구로 파일을 만들라고 지시한다.
  codex exec --sandbox workspace-write --skip-git-repo-check \
    "Use your image generation tool (imagegen) to create one image and save it to the absolute path ${ROOT}/${OUT_FILE}. Overwrite if it exists. Image description: ${FULL_PROMPT}. Output nothing but the saved file path when done."
fi
GEN_STATUS=$?

if [ "$GEN_STATUS" -ne 0 ] || [ ! -s "$OUT_FILE" ]; then
  warn "이미지가 생성되지 않았습니다 (종료 코드 $GEN_STATUS)."
  cat <<EOF

Codex 호출이 실패했습니다. 확인할 것:

  · ${DIM}codex login${RESET} — 인증 상태
  · Codex 계정에 이미지 생성 권한이 있는지
  · 다른 호출 방식이 필요하다면 환경 변수로 지정하세요:
    ${DIM}CODEX_IMAGEGEN_CMD='codex imagegen --out {out} "{prompt}"' pnpm imagegen --slug $SLUG --prompt "..."${RESET}

${BOLD}다른 이미지 생성 모델을 찾지 마세요.${RESET} 이미지 없이 진행하거나 사용자에게 요청하세요.

EOF
  exit 3
fi

ok "이미지 생성 완료: $OUT_FILE ($(du -h "$OUT_FILE" | cut -f1))"

# ── 프론트매터 갱신 ───────────────────────────────────────────
[ -n "$ALT" ] || ALT="$PROMPT"

if node scripts/set-cover.mjs \
  --slug "$SLUG" \
  --src "$PUBLIC_SRC" \
  --alt "$ALT" \
  --source "codex-imagegen" \
  --origin "$FULL_PROMPT"; then
  ok "프론트매터 cover 갱신 완료"
else
  warn "프론트매터 갱신 실패 — 수동으로 cover 를 설정하세요."
  exit 1
fi

printf '\n%s다음:%s admin 검수 화면에서 확인하세요 → %shttp://localhost:3001/review/%s%s\n\n' \
  "$BOLD" "$RESET" "$DIM" "$SLUG" "$RESET"
