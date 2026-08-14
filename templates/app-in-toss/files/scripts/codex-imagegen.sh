#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# codex-imagegen.sh — 이 회사에서 이미지를 만드는 유일한 경로.
#
# 사용:
#   pnpm imagegen --kind icon --prompt "<장면 설명>"
#   pnpm imagegen --kind thumbnail --prompt "..." --style "..."
#   pnpm imagegen --kind iap-icon --name gold-pack --prompt "..."
#
# 하는 일: codex 로 생성 → 규격 해상도로 맞춤 → 출처 기록.
#
# 정책 (ADR-0002 · 코어 하드 룰 1):
#   이미지 생성은 Codex `imagegen` 으로만 한다. Claude 의 이미지 생성은 금지.
#   Codex 부재 시: 이미지 생략 → 사용자에게 직접 요청 → 웹 검색(라이선스 확인) 순.
#
# 스크린샷은 여기서 만들지 않습니다. 실제 화면을 찍어야 합니다 — 아래 참고.
#
# 호출 방식이 환경마다 다를 수 있어 CODEX_IMAGEGEN_CMD 로 덮어쓸 수 있습니다.
#   예: CODEX_IMAGEGEN_CMD='codex imagegen --out {out} "{prompt}"'
# ─────────────────────────────────────────────────────────────
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT" || exit 1

RED=$'\033[31m'; GREEN=$'\033[32m'; YELLOW=$'\033[33m'; DIM=$'\033[2m'; BOLD=$'\033[1m'; RESET=$'\033[0m'
[ -t 1 ] || { RED=''; GREEN=''; YELLOW=''; DIM=''; BOLD=''; RESET=''; }

ok()   { printf '%s✔%s %s\n' "$GREEN" "$RESET" "$1"; }
warn() { printf '%s!%s %s\n' "$YELLOW" "$RESET" "$1"; }
die()  { printf '%s✘%s %s\n' "$RED" "$RESET" "$1" >&2; exit 1; }

ASSETS="node --experimental-strip-types --no-warnings scripts/assets.ts"

KIND=""; PROMPT=""; NAME=""
# 토스 앱 안에 얹히는 것이라 TDS 결이어야 합니다. 튀는 그림은 심사에서 지적받습니다.
STYLE="clean flat vector, simple geometric shapes, generous padding, single focal subject, light background, no text, no lettering, no watermark"

while [ $# -gt 0 ]; do
  case "$1" in
    --kind)   KIND="${2:-}"; shift 2 ;;
    --prompt) PROMPT="${2:-}"; shift 2 ;;
    --name)   NAME="${2:-}"; shift 2 ;;
    --style)  STYLE="${2:-}"; shift 2 ;;
    -h|--help) sed -n '2,20p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) die "알 수 없는 옵션: $1" ;;
  esac
done

# ── 스크린샷은 생성하지 않습니다 ──────────────────────────────
# 실제 앱 화면과 다른 이미지를 스토어에 올리면 심사에서 반려됩니다.
# 규격에 맞추는 것은 도와줄 수 있지만, 그림을 지어내는 것은 다른 문제입니다.
case "$KIND" in
  screenshot|screenshot-landscape)
    cat <<EOF

${YELLOW}${BOLD}스크린샷은 만들어 드리지 않습니다.${RESET}

스토어 스크린샷은 ${BOLD}실제 화면${RESET}이어야 합니다. 앱에 없는 화면을 그려서 올리면
심사에서 반려되고, 통과하더라도 받은 사람이 속습니다.

${BOLD}이렇게 하세요${RESET}

  ${DIM}1.${RESET} 샌드박스 앱이나 브라우저에서 화면을 띄우고 찍습니다
  ${DIM}2.${RESET} assets/screenshots/ 에 넣습니다 ${DIM}(01-home.png 처럼 순서를 앞에)${RESET}
  ${DIM}3.${RESET} 규격에 맞춥니다
     ${DIM}pnpm assets fit assets/screenshots/01-home.png${RESET}
  ${DIM}4.${RESET} 확인합니다
     ${DIM}pnpm assets${RESET}

${DIM}세로 636×1048 · 가로 1504×741 · PNG 또는 JPG · 파일당 5MB 이하${RESET}

EOF
    exit 2 ;;
esac

[ -n "$KIND" ]   || die "--kind 는 필수입니다 (icon · icon-dark · thumbnail · iap-icon)."
[ -n "$PROMPT" ] || die "--prompt 는 필수입니다."

case "$KIND" in
  icon)      OUT="assets/icon.png";      LABEL="앱 로고";        DIMS="600x600" ;;
  icon-dark) OUT="assets/icon-dark.png"; LABEL="다크모드 로고";  DIMS="600x600" ;;
  thumbnail) OUT="assets/thumbnail.png"; LABEL="가로 썸네일";    DIMS="1932x828" ;;
  iap-icon)
    [ -n "$NAME" ] || die "--kind iap-icon 은 --name <상품키> 가 필요합니다."
    OUT="assets/iap/${NAME}.png"; LABEL="IAP 상품 아이콘"; DIMS="1024x1024" ;;
  *) die "알 수 없는 종류: $KIND (icon · icon-dark · thumbnail · iap-icon)" ;;
esac

mkdir -p "$(dirname "$OUT")"

# 이미지 모델은 임의 해상도를 잘 내지 못합니다. 비율만 맞춰 뽑고, 정확한 픽셀은
# assets.ts fit 이 맞춥니다 — 콘솔이 1px 도 봐주지 않기 때문입니다.
FULL_PROMPT="${PROMPT}. Aspect ratio ${DIMS//x/:}. Style: ${STYLE}."

# ── Codex 가용성 ──────────────────────────────────────────────
if ! command -v codex >/dev/null 2>&1; then
  cat <<EOF

${YELLOW}${BOLD}Codex 를 찾을 수 없습니다 — 이미지를 생성하지 않습니다.${RESET}

이 프로젝트는 이미지 생성을 Codex \`imagegen\` 으로만 합니다 (ADR-0002).
Claude 로 만드는 것도, 다른 이미지 모델을 부르는 것도 금지되어 있습니다.

${BOLD}폴백 (이 순서로)${RESET}

  1. ${BOLD}이미지 없이 진행${RESET} — 지금 당장 필요한 것이 아니면 나중으로 미룹니다.
     ${DIM}단, 앱 로고와 가로 썸네일은 심사 신청에 필수입니다.${RESET}

  2. ${BOLD}직접 첨부${RESET} — ${LABEL}를 아래 경로에 두고 규격을 맞추세요.
     ${DIM}cp <이미지> $OUT${RESET}
     ${DIM}pnpm assets fit $OUT --kind $KIND${RESET}

  3. ${BOLD}웹 검색${RESET} — 라이선스가 명확한 것만. assets/SOURCES.md 에 출처를 남기세요.

Codex 설치: ${DIM}https://developers.openai.com/codex/cli${RESET}

EOF
  exit 3
fi

# ── 생성 ──────────────────────────────────────────────────────
printf '\n%s생성 중%s  %s (%s)\n' "$BOLD" "$RESET" "$LABEL" "$DIMS"
printf '%s  프롬프트: %s%s\n' "$DIM" "$FULL_PROMPT" "$RESET"
printf '%s  출력:     %s%s\n\n' "$DIM" "$OUT" "$RESET"

if [ -n "${CODEX_IMAGEGEN_CMD:-}" ]; then
  CMD="${CODEX_IMAGEGEN_CMD//\{out\}/$OUT}"
  CMD="${CMD//\{prompt\}/$FULL_PROMPT}"
  eval "$CMD"
else
  codex exec --sandbox workspace-write --skip-git-repo-check \
    "Use your image generation tool (imagegen) to create one image and save it to the absolute path ${ROOT}/${OUT}. Overwrite if it exists. Image description: ${FULL_PROMPT}. Output nothing but the saved file path when done."
fi
GEN_STATUS=$?

if [ "$GEN_STATUS" -ne 0 ] || [ ! -s "$OUT" ]; then
  warn "이미지가 생성되지 않았습니다 (종료 코드 $GEN_STATUS)."
  cat <<EOF

확인할 것:

  · ${DIM}codex login${RESET} — 인증 상태
  · Codex 계정에 이미지 생성 권한이 있는지
  · 호출 방식이 다르다면 환경 변수로 지정하세요:
    ${DIM}CODEX_IMAGEGEN_CMD='codex imagegen --out {out} "{prompt}"' pnpm imagegen --kind $KIND --prompt "..."${RESET}

${BOLD}다른 이미지 생성 모델을 찾지 마세요.${RESET} 이미지 없이 진행하거나 사용자에게 요청하세요.

EOF
  exit 3
fi

ok "생성 완료: $OUT ($(du -h "$OUT" | cut -f1))"

# ── 규격 맞추기 ───────────────────────────────────────────────
if ! $ASSETS fit "$OUT" --kind "$KIND"; then
  warn "규격을 맞추지 못했습니다. 파일은 남아 있으니 직접 맞추거나 다시 생성하세요."
  exit 1
fi

# ── 출처 기록 ─────────────────────────────────────────────────
# 프롬프트가 남아야 재생성과 감사가 됩니다 (ADR-0002). 에셋에는 프론트매터를
# 붙일 데가 없어서 로그 파일에 씁니다.
SOURCES="assets/SOURCES.md"
if [ ! -f "$SOURCES" ]; then
  cat > "$SOURCES" <<'EOF'
# 에셋 출처

`pnpm imagegen` 이 덧붙이는 기록입니다. 프롬프트가 남아야 다시 만들 수 있고,
"이 그림 어디서 났냐"는 질문에 답할 수 있습니다 (ADR-0002).

직접 첨부하거나 웹에서 가져온 이미지는 **손으로 한 줄 추가하세요.** 웹에서
가져온 것은 라이선스를 반드시 적습니다.

| 파일 | 출처 | 프롬프트 · 라이선스 | 시각 |
| --- | --- | --- | --- |
EOF
fi
printf '| `%s` | codex-imagegen | %s | %s |\n' \
  "$OUT" "${FULL_PROMPT//|/\\|}" "$(date +%Y-%m-%d\ %H:%M)" >> "$SOURCES"
ok "출처 기록: $SOURCES"

printf '\n%s다음%s  %spnpm assets%s — 전체 규격을 확인합니다\n\n' "$BOLD" "$RESET" "$DIM" "$RESET"
