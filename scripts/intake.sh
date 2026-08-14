#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# intake.sh — 다른 워크스페이스에서 만든 것을 이 회사로 들여온다.
#
# 사용:
#   pnpm intake <경로> [--as <이름>] [--max-mb N] [--force]
#
#   pnpm intake ~/Downloads/design-kit.zip
#   pnpm intake ~/Downloads/old-project.tar.gz --as legacy
#   pnpm intake ~/work/other-repo --as reference
#
# 하는 일:
#   1. zip · tar.gz · 디렉터리를 inbox/<이름>/ 에 푼다
#   2. 쓰레기(node_modules · .git · 빌드 산출물)를 걷어낸다
#   3. INVENTORY.md 를 쓴다 — 에이전트가 읽는 목차
#
# 하지 않는 일:
#   **압축을 푼 것을 실행하지 않는다.** 스크립트도, 설치도, 빌드도 하지 않는다.
#   남이 준 zip 은 읽을거리이지 실행할 것이 아니다.
#
# inbox/ 는 .gitignore 에 있습니다. 받은 원본은 저장소의 진실이 아니라 **재료**입니다
# (코어 하드 룰 3). 여기서 뽑아낸 명세·에셋만 저장소에 남기세요.
# ─────────────────────────────────────────────────────────────
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT" || exit 1

RED=$'\033[31m'; GREEN=$'\033[32m'; YELLOW=$'\033[33m'; DIM=$'\033[2m'; BOLD=$'\033[1m'; RESET=$'\033[0m'
[ -t 1 ] || { RED=''; GREEN=''; YELLOW=''; DIM=''; BOLD=''; RESET=''; }

ok()   { printf '%s✔%s %s\n' "$GREEN" "$RESET" "$1"; }
info() { printf '%s·%s %s\n' "$DIM" "$RESET" "$1"; }
warn() { printf '%s!%s %s\n' "$YELLOW" "$RESET" "$1"; }
die()  { printf '%s✘%s %s\n' "$RED" "$RESET" "$1" >&2; exit 1; }

SRC=""
SLUG=""
MAX_MB=300
FORCE=0

while [ $# -gt 0 ]; do
  case "$1" in
    --as)     SLUG="${2:-}"; shift 2 ;;
    --max-mb) MAX_MB="${2:-}"; shift 2 ;;
    --force)  FORCE=1; shift ;;
    -h|--help)
      sed -n '2,25p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
      exit 0 ;;
    -*) die "알 수 없는 옵션: $1" ;;
    *)  [ -z "$SRC" ] && SRC="$1" || die "경로는 하나만 받습니다: $1"; shift ;;
  esac
done

if [ -z "$SRC" ]; then
  printf '%s사용:%s pnpm intake <zip · tar.gz · 디렉터리> [--as <이름>]\n\n' "$BOLD" "$RESET"
  if [ -d inbox ] && [ -n "$(ls -A inbox 2>/dev/null)" ]; then
    printf '%s들여온 것:%s\n' "$BOLD" "$RESET"
    for d in inbox/*/; do
      [ -d "$d" ] || continue
      printf '  %-20s %s\n' "$(basename "$d")" "$(du -sh "$d" 2>/dev/null | cut -f1)"
    done
    printf '\n'
  fi
  exit 2
fi

[ -e "$SRC" ] || die "찾을 수 없습니다: $SRC"

# ── 이름 정하기 ───────────────────────────────────────────────
# 파일명에서 유도합니다. 확장자를 떼고, 영숫자와 하이픈만 남깁니다.
if [ -z "$SLUG" ]; then
  SLUG="$(basename "$SRC")"
  SLUG="${SLUG%.zip}"; SLUG="${SLUG%.tar.gz}"; SLUG="${SLUG%.tgz}"; SLUG="${SLUG%.tar}"
  SLUG="$(printf '%s' "$SLUG" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9가-힣]\{1,\}/-/g; s/^-//; s/-$//')"
fi
[ -n "$SLUG" ] || die "이름을 정할 수 없습니다. --as <이름> 으로 직접 주세요."
case "$SLUG" in
  */*|.*) die "이름에 / 나 . 을 쓸 수 없습니다: $SLUG" ;;
esac

DEST="inbox/$SLUG"

if [ -e "$DEST" ]; then
  if [ "$FORCE" -eq 1 ]; then
    warn "$DEST 를 덮어씁니다."
    rm -rf "$DEST"
  else
    die "$DEST 가 이미 있습니다. 덮어쓰려면 --force, 따로 두려면 --as <다른이름>."
  fi
fi

STAGE="inbox/.staging-$SLUG"
rm -rf "$STAGE"
mkdir -p "$STAGE"
# 실패하면 반쯤 푼 디렉터리를 남기지 않습니다.
trap 'rm -rf "$STAGE"' EXIT

printf '\n%s들여오는 중%s  %s → %s\n\n' "$BOLD" "$RESET" "$SRC" "$DEST"

# ── 풀기 ──────────────────────────────────────────────────────
case "$SRC" in
  *.zip)
    command -v unzip >/dev/null 2>&1 || die "unzip 이 없습니다 → 'brew install unzip' 또는 'apt install unzip'"
    # -q 조용히 · -o 덮어쓰기 · -DD 타임스탬프 복원 안 함(결정적)
    unzip -q -o -DD "$SRC" -d "$STAGE" || die "압축을 풀지 못했습니다: $SRC"
    ;;
  *.tar.gz|*.tgz)
    tar -xzf "$SRC" -C "$STAGE" || die "압축을 풀지 못했습니다: $SRC"
    ;;
  *.tar)
    tar -xf "$SRC" -C "$STAGE" || die "압축을 풀지 못했습니다: $SRC"
    ;;
  *)
    [ -d "$SRC" ] || die "지원하지 않는 형식입니다: $SRC (zip · tar.gz · 디렉터리)"
    # -R 링크를 따라가지 않고 복사. 워크스페이스 밖으로 새는 심볼릭 링크를 막습니다.
    cp -R "$SRC/." "$STAGE/" || die "복사하지 못했습니다: $SRC"
    ;;
esac

# ── 심볼릭 링크 제거 ──────────────────────────────────────────
# 압축 파일 안의 링크는 이 저장소 밖(예: /etc/passwd)을 가리킬 수 있습니다.
# 읽을거리로 들여오는 것이므로 링크는 필요 없습니다. 세어서 알려주고 지웁니다.
LINKS="$(find "$STAGE" -type l 2>/dev/null | wc -l | tr -d ' ')"
if [ "$LINKS" -gt 0 ]; then
  find "$STAGE" -type l -delete 2>/dev/null
  warn "심볼릭 링크 ${LINKS}개를 지웠습니다 (저장소 밖을 가리킬 수 있습니다)."
fi

# ── 쓰레기 걷어내기 ───────────────────────────────────────────
# 남의 워크스페이스에는 node_modules 가 딸려 옵니다. 읽을 것도 아니고
# 용량의 대부분이라, 여기서 걷어내지 않으면 목차가 쓰레기로 덮입니다.
PRUNED=0
for junk in node_modules .git .next .turbo dist build out coverage \
            __pycache__ .venv venv .gradle .idea .vscode target Pods; do
  while IFS= read -r hit; do
    [ -n "$hit" ] || continue
    rm -rf "$hit"
    PRUNED=$((PRUNED + 1))
  done <<EOF
$(find "$STAGE" -name "$junk" -maxdepth 6 2>/dev/null)
EOF
done
find "$STAGE" \( -name '.DS_Store' -o -name '*.log' -o -name 'Thumbs.db' \) -type f -delete 2>/dev/null
[ "$PRUNED" -gt 0 ] && info "빌드 산출물 · 의존성 디렉터리 ${PRUNED}개를 걷어냈습니다."

# 최상위가 폴더 하나뿐이면 한 겹 벗깁니다 (zip 은 보통 이렇게 만들어집니다).
TOP_COUNT="$(find "$STAGE" -mindepth 1 -maxdepth 1 | wc -l | tr -d ' ')"
if [ "$TOP_COUNT" -eq 1 ]; then
  ONLY="$(find "$STAGE" -mindepth 1 -maxdepth 1)"
  if [ -d "$ONLY" ]; then
    mv "$ONLY" "$STAGE/.unwrapped" && mv "$STAGE/.unwrapped"/* "$STAGE"/ 2>/dev/null
    mv "$STAGE/.unwrapped"/.[!.]* "$STAGE"/ 2>/dev/null
    rmdir "$STAGE/.unwrapped" 2>/dev/null
    info "최상위 폴더 한 겹을 벗겼습니다: $(basename "$ONLY")"
  fi
fi

# ── 크기 확인 ─────────────────────────────────────────────────
SIZE_KB="$(du -sk "$STAGE" 2>/dev/null | cut -f1)"
SIZE_MB=$((SIZE_KB / 1024))
if [ "$SIZE_MB" -gt "$MAX_MB" ]; then
  die "정리 후에도 ${SIZE_MB}MB 입니다 (상한 ${MAX_MB}MB).
    필요한 부분만 다시 묶어 주시거나, 상한을 올리세요: --max-mb $((SIZE_MB + 1))"
fi

FILE_COUNT="$(find "$STAGE" -type f 2>/dev/null | wc -l | tr -d ' ')"
[ "$FILE_COUNT" -gt 0 ] || die "쓸 만한 파일이 없습니다. 걷어낸 것만 들어 있었을 수 있습니다."

# ── 자리 잡기 ─────────────────────────────────────────────────
mkdir -p inbox
mv "$STAGE" "$DEST" || die "옮기지 못했습니다: $DEST"
trap - EXIT

ok "$DEST — 파일 ${FILE_COUNT}개 · $(du -sh "$DEST" 2>/dev/null | cut -f1 | tr -d ' ')"

# ── 목차 ──────────────────────────────────────────────────────
if node scripts/intake-inventory.mjs "$DEST" "$SRC"; then
  ok "$DEST/INVENTORY.md"
else
  warn "목차를 만들지 못했습니다. 파일은 들어와 있으니 직접 훑어보세요."
fi

cat <<EOF

${BOLD}다음${RESET}

  ${DIM}1.${RESET} 목차를 먼저 봅니다 — 무엇이 들어왔고 무엇이 쓸 만한지
     ${DIM}$DEST/INVENTORY.md${RESET}

  ${DIM}2.${RESET} 에이전트에 넘깁니다. 경로를 작업 문장에 넣으세요.
     ${DIM}pnpm agent <id> "$DEST 를 읽고 <할 일>"${RESET}

  ${DIM}3.${RESET} 여기서 뽑아낸 것만 저장소에 남깁니다.
     ${DIM}inbox/ 는 버전 관리하지 않습니다 — 재료이지 결과물이 아닙니다.${RESET}

EOF
