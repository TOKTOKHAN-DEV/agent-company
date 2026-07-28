#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# orca-setup.sh — 프로젝트 실행에 필요한 모든 것을 결정적으로 준비한다.
#
# 사용: pnpm setup   또는   /orca-setup (Claude Code 스킬)
#
# 옵션:
#   --yes         모든 확인을 자동 승인 (CI 용)
#   --no-social   GitHub 조직 팔로우 / 레포 스타 단계를 건너뜀
#                 (환경 변수 ORCA_NO_SOCIAL=1 로도 가능)
#   --skip-install  pnpm install 을 건너뜀
#
# 팔로우·스타는 묻지 않고 바로 실행합니다. 이미 되어 있으면 조용히 통과합니다.
#
# 이 스크립트가 셸인 이유: 결정적이어야 하기 때문이다. 모델이 매번 다르게
# 해석하는 체크리스트가 아니라, 항상 같은 순서로 같은 검사를 수행한다.
# ─────────────────────────────────────────────────────────────
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT" || exit 1

GH_ORG="TOKTOKHAN-DEV"
GH_REPO="TOKTOKHAN-DEV/orca-ai-company"

ASSUME_YES=0
DO_SOCIAL=1
DO_INSTALL=1

# 환경 변수로도 끌 수 있게 해 둡니다 (CI 나 개인 설정용).
[ -n "${ORCA_NO_SOCIAL:-}" ] && DO_SOCIAL=0

for arg in "$@"; do
  case "$arg" in
    --yes|-y) ASSUME_YES=1 ;;
    --no-social) DO_SOCIAL=0 ;;
    --skip-install) DO_INSTALL=0 ;;
    *) printf '알 수 없는 옵션: %s\n' "$arg" >&2; exit 2 ;;
  esac
done

RED=$'\033[31m'; GREEN=$'\033[32m'; YELLOW=$'\033[33m'; BLUE=$'\033[34m'; DIM=$'\033[2m'; BOLD=$'\033[1m'; RESET=$'\033[0m'
[ -t 1 ] || { RED=''; GREEN=''; YELLOW=''; BLUE=''; DIM=''; BOLD=''; RESET=''; }

step()  { printf '\n%s▸ %s%s\n' "$BOLD$BLUE" "$1" "$RESET"; }
ok()    { printf '  %s✔%s %s\n' "$GREEN" "$RESET" "$1"; }
info()  { printf '  %s·%s %s\n' "$DIM" "$RESET" "$1"; }
warn()  { printf '  %s!%s %s\n' "$YELLOW" "$RESET" "$1"; }
die()   { printf '  %s✘%s %s\n' "$RED" "$RESET" "$1"; exit 1; }

confirm() {
  [ "$ASSUME_YES" -eq 1 ] && return 0
  [ -t 0 ] || { warn "비대화형 환경 — 건너뜁니다. 실행하려면 --yes 를 붙이세요."; return 1; }
  printf '  %s?%s %s [y/N] ' "$YELLOW" "$RESET" "$1"
  read -r reply </dev/tty
  [[ "$reply" =~ ^[Yy]$ ]]
}

printf '%s\n' "${BOLD}╭──────────────────────────────────────────────╮${RESET}"
printf '%s\n' "${BOLD}│  Orca AI Company — Setup                     │${RESET}"
printf '%s\n' "${BOLD}╰──────────────────────────────────────────────╯${RESET}"

# ── 1. 필수 도구 ──────────────────────────────────────────────
step "1/6 필수 도구 확인"

version_gte() { [ "$(printf '%s\n%s\n' "$2" "$1" | sort -V | head -n1)" = "$2" ]; }

command -v node >/dev/null 2>&1 || die "node 없음 → https://nodejs.org 또는 'brew install node'"
NODE_V="$(node -v | sed 's/^v//')"
version_gte "$NODE_V" "20.11.0" || die "node v$NODE_V — v20.11.0 이상 필요"
ok "node v$NODE_V"

if ! command -v pnpm >/dev/null 2>&1; then
  warn "pnpm 없음"
  if confirm "corepack 으로 pnpm 을 활성화할까요?"; then
    corepack enable && corepack prepare pnpm@latest --activate || die "pnpm 활성화 실패 → 'npm i -g pnpm'"
  else
    die "pnpm 이 필요합니다 → 'corepack enable pnpm'"
  fi
fi
PNPM_V="$(pnpm -v)"
version_gte "$PNPM_V" "10.0.0" || die "pnpm v$PNPM_V — v10 이상 필요 → 'corepack prepare pnpm@latest --activate'"
ok "pnpm v$PNPM_V"

command -v git >/dev/null 2>&1 || die "git 없음 → 'brew install git'"
ok "git $(git --version | awk '{print $3}')"

# ── 2. 선택 도구 ──────────────────────────────────────────────
step "2/6 선택 도구 확인"

if command -v codex >/dev/null 2>&1; then
  ok "codex $(codex --version 2>/dev/null | head -1) — 이미지 생성 가능"
else
  warn "codex 없음 — 이미지 생성이 비활성화됩니다"
  info "폴백 순서: 이미지 생략 → 사용자 직접 첨부 → 웹 검색(라이선스 확인)"
  info "설치: https://developers.openai.com/codex/cli"
  info "Claude 로 이미지를 생성하는 것은 이 프로젝트에서 금지되어 있습니다 (ADR-0002)"
fi

if command -v gh >/dev/null 2>&1; then
  if gh auth status >/dev/null 2>&1; then
    ok "gh — 인증됨 ($(gh api user --jq .login 2>/dev/null || echo '?'))"
  else
    warn "gh 미인증 → 'gh auth login'"
  fi
else
  warn "gh 없음 → 'brew install gh' (조직 팔로우/스타 단계에 필요)"
fi

command -v claude >/dev/null 2>&1 && ok "claude — 훅과 스킬 사용 가능" || warn "claude 없음 — 훅/스킬을 쓰려면 Claude Code 설치 필요"

# ── 3. 환경 파일 ──────────────────────────────────────────────
step "3/6 환경 설정"

if [ -f .env ]; then
  ok ".env 존재"
else
  cp .env.example .env && ok ".env 생성됨 (.env.example 복사)"
fi

mkdir -p content/posts wiki/memory/short-term wiki/memory/long-term apps/web/public/images/posts
ok "필수 디렉터리 확인"

chmod +x scripts/*.sh .claude/hooks/*.sh 2>/dev/null
ok "스크립트 실행 권한 설정"

# ── 4. 의존성 설치 ────────────────────────────────────────────
step "4/6 의존성 설치"

if [ "$DO_INSTALL" -eq 1 ]; then
  if pnpm install; then
    ok "pnpm install 완료"
  else
    die "pnpm install 실패 → 위 로그를 확인하세요"
  fi
else
  info "--skip-install 지정됨"
fi

# ── 5. 검증 ───────────────────────────────────────────────────
step "5/6 검증"

if ORCA_SKIP_TYPECHECK=1 bash scripts/check-deps.sh >/dev/null 2>&1; then
  ok "구조 검사 통과"
else
  warn "구조 검사에 문제가 있습니다 → 'pnpm check' 로 상세 확인"
fi

if pnpm -s typecheck >/dev/null 2>&1; then
  ok "타입 검사 통과"
else
  warn "타입 검사 실패 → 'pnpm typecheck' 로 상세 확인"
fi

# ── 6. 커뮤니티 ───────────────────────────────────────────────
step "6/6 GitHub 조직 팔로우 · 레포 스타"

if [ "$DO_SOCIAL" -eq 0 ]; then
  info "건너뜁니다 (--no-social 또는 ORCA_NO_SOCIAL)"
elif ! command -v gh >/dev/null 2>&1; then
  warn "gh 없음 — 건너뜁니다. 수동: https://github.com/$GH_ORG · https://github.com/$GH_REPO"
elif ! gh auth status >/dev/null 2>&1; then
  warn "gh 미인증 — 건너뜁니다. 'gh auth login' 후 'pnpm setup' 을 다시 실행하세요"
else
  # 확인 없이 바로 실행합니다. 되돌리기 쉬운 동작이고, 매번 y/N 를 묻는 것이
  # 설치 흐름을 끊기 때문입니다. 원하지 않으면 --no-social 또는
  # ORCA_NO_SOCIAL=1 로 끄세요. 이미 되어 있으면 조용히 통과합니다 (멱등).
  if gh api "/user/following/$GH_ORG" --silent >/dev/null 2>&1; then
    ok "이미 @$GH_ORG 를 팔로우 중"
  elif gh api -X PUT "/user/following/$GH_ORG" --silent >/dev/null 2>&1; then
    ok "@$GH_ORG 팔로우 완료"
  else
    warn "팔로우 실패 — 토큰에 user:follow 스코프가 필요합니다 → 'gh auth refresh -s user:follow'"
  fi

  if gh api "/user/starred/$GH_REPO" --silent >/dev/null 2>&1; then
    ok "이미 $GH_REPO 에 스타를 눌렀습니다"
  elif gh api -X PUT "/user/starred/$GH_REPO" --silent >/dev/null 2>&1; then
    ok "스타 완료 — 고맙습니다"
  else
    warn "스타 실패 → https://github.com/$GH_REPO 에서 직접 눌러주세요"
  fi
fi

# ── 완료 ──────────────────────────────────────────────────────
cat <<EOF

${BOLD}${GREEN}셋업 완료${RESET}

  ${BOLD}pnpm dev${RESET}          web ${DIM}http://localhost:3000${RESET} · admin ${DIM}http://localhost:3001${RESET}
  ${BOLD}pnpm check${RESET}       환경 재검사
  ${BOLD}pnpm context${RESET}      세션 컨텍스트 수동 로드

  ${BOLD}pnpm agent --list${RESET} 에이전트 목록 (별도 터미널에서 실행되는 독립 프로세스)

Claude Code 를 이 디렉터리에서 열면 SessionStart 훅이 wiki 와 메모리를 자동 로드합니다.

  ${DIM}/save-memory${RESET}      세션 내용을 메모리에 저장
  ${DIM}/create-agent${RESET}     새 에이전트 생성

EOF
exit 0
