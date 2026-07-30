#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# orca-setup.sh — 프로젝트 실행에 필요한 모든 것을 결정적으로 준비한다.
#
# 사용: pnpm setup   또는   /orca-setup (Claude Code 스킬)
#
# 옵션:
#   --yes                    모든 확인을 자동 승인 (CI 용)
#   --skip-install           pnpm install 을 건너뜀
#   --no-community-prompt    GitHub 응원(6단계)을 묻지 않고 넘어감
#
# GitHub 응원(6단계)은 **선택**입니다. 조직 팔로우 · 레포 스타를 물어보고,
# 거절하면 기록해 두고 다시 묻지 않습니다. 실패해도 셋업을 중단시키지 않습니다.
# 이미 되어 있으면 묻지 않고 조용히 통과합니다 (멱등).
#
# `--no-community-prompt` 은 /orca-setup 스킬이 씁니다. 스킬은 이 텍스트 메뉴
# 대신 AskUserQuestion 으로 묻고, scripts/community.sh 로 결과를 적용합니다.
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
DO_INSTALL=1
COMMUNITY_PROMPT=1

for arg in "$@"; do
  case "$arg" in
    --yes|-y) ASSUME_YES=1 ;;
    --skip-install) DO_INSTALL=0 ;;
    --no-community-prompt) COMMUNITY_PROMPT=0 ;;
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

# ── 2. 도구 상태 ──────────────────────────────────────────────
step "2/6 도구 상태 확인"

if command -v codex >/dev/null 2>&1; then
  ok "codex $(codex --version 2>/dev/null | head -1) — 이미지 생성 가능"
else
  warn "codex 없음 — 이미지 생성이 비활성화됩니다"
  info "폴백 순서: 이미지 생략 → 사용자 직접 첨부 → 웹 검색(라이선스 확인)"
  info "설치: https://developers.openai.com/codex/cli"
  info "Claude 로 이미지를 생성하는 것은 이 프로젝트에서 금지되어 있습니다 (ADR-0002)"
fi

# gh 는 6단계(GitHub 응원)에만 쓰입니다. 선택 단계이므로 여기서 강제하지 않습니다.
if command -v gh >/dev/null 2>&1; then
  gh auth status >/dev/null 2>&1 \
    && ok "gh — 인증됨 ($(gh api user --jq .login 2>/dev/null || echo '?'))" \
    || info "gh 미인증 — 6단계(선택)를 건너뜁니다. 쓰려면 'gh auth login'"
else
  info "gh 없음 — 6단계(선택)를 건너뜁니다. 설치: https://cli.github.com"
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

# stdin 을 넘기지 않습니다. turbo · pnpm 이 상속받은 stdin 을 읽어버리면 6단계의
# 선택 입력이 그 자리에서 사라집니다 (사용자가 고르지도 않은 답이 기록됩니다).
if ORCA_SKIP_TYPECHECK=1 bash scripts/check-deps.sh >/dev/null 2>&1 </dev/null; then
  ok "구조 검사 통과"
else
  warn "구조 검사에 문제가 있습니다 → 'pnpm check' 로 상세 확인"
fi

if pnpm -s typecheck >/dev/null 2>&1 </dev/null; then
  ok "타입 검사 통과"
else
  warn "타입 검사 실패 → 'pnpm typecheck' 로 상세 확인"
fi

# ── 6. GitHub 응원 (선택) ─────────────────────────────────────
# 선택 단계입니다. 거절하면 기록해 두고 다시 묻지 않으며, 실패해도 셋업을
# 실패로 끝내지 않습니다. gh 가 없거나 미인증이면 묻지 않고 넘어갑니다.
# 상태 판정과 실제 실행은 scripts/community.sh 에 있습니다 — 스킬도 같은 것을 씁니다.
step "6/6 GitHub 응원 (선택)"

# 실행 결과를 setup 출력에 맞춰 들여씁니다. pipefail 덕분에 종료 코드는
# sed 가 아니라 community.sh 의 것이 그대로 전달됩니다.
community_apply() {
  if bash scripts/community.sh apply 2>&1 | sed 's/^/    /'; then
    ok "반영 완료 — 고맙습니다"
  else
    warn "응원 단계에서 문제가 있었습니다 — 셋업은 계속됩니다"
    info "직접 눌러주셔도 됩니다: https://github.com/$GH_ORG · https://github.com/$GH_REPO"
  fi
}

community_prompt() {
  printf '\n  %sOrca AI Company 가 도움이 되셨다면, GitHub 에서 응원해 주시겠어요?%s\n\n' "$BOLD" "$RESET"
  printf '    1) Yes, star it!   %s@%s 팔로우 + 레포 스타%s\n' "$DIM" "$GH_ORG" "$RESET"
  printf '    2) No thanks       %s건너뜁니다 (다시 묻지 않습니다)%s\n' "$DIM" "$RESET"
  printf '    3) Maybe later     %s건너뜁니다 (다시 묻지 않습니다)%s\n\n' "$DIM" "$RESET"
  printf '  %s?%s 선택 [1/2/3] (엔터 = 3) ' "$YELLOW" "$RESET"

  # 입력을 못 읽었으면(EOF · tty 없음) **기록하지 않고** 넘어갑니다.
  # 고르지도 않은 거절을 기록해 두면 다시 묻지 않게 되므로, 조용히 다음 기회로 넘깁니다.
  reply=''
  if ! read -r reply </dev/tty; then
    printf '\n'
    info "입력을 읽을 수 없습니다 — 건너뜁니다 (기록하지 않으므로 다음에 다시 물어봅니다)"
    return 0
  fi
  printf '\n'

  reply="$(printf '%s' "$reply" | tr -d '[:space:]')"

  case "$reply" in
    1) community_apply ;;
    2) bash scripts/community.sh optout no-thanks   | sed 's/^/    /' ;;
    3|'') bash scripts/community.sh optout maybe-later | sed 's/^/    /' ;;
    *) info "알 수 없는 입력 '$reply' — 건너뜁니다 (기록하지 않습니다)" ;;
  esac
}

case "$(bash scripts/community.sh status)" in
  unavailable)
    info "gh 미설치 또는 미인증 — 건너뜁니다 (선택 단계입니다)"
    info "응원해 주시려면: https://github.com/$GH_REPO"
    ;;
  done)
    ok "이미 @$GH_ORG 팔로우 · 레포 스타 완료 — 고맙습니다"
    ;;
  optout)
    info "이전에 건너뛰기를 선택하셨습니다 — 묻지 않습니다"
    info "마음이 바뀌면: bash scripts/community.sh apply"
    ;;
  pending)
    if [ "$COMMUNITY_PROMPT" -eq 0 ]; then
      info "--no-community-prompt — 묻지 않고 넘어갑니다"
    elif [ "$ASSUME_YES" -eq 1 ]; then
      community_apply
    elif [ -t 0 ]; then
      community_prompt
    else
      info "비대화형 환경 — 건너뜁니다 (다음에 다시 물어봅니다)"
    fi
    ;;
esac

# ── 완료 ──────────────────────────────────────────────────────
# 포트는 .env 가 진실입니다. 3000/3001 을 박아두면 포트를 바꾼 사람에게 거짓말이 됩니다.
port_from_env() {
  v="$(sed -n "s/^[[:space:]]*$1=\([0-9][0-9]*\).*/\1/p" .env 2>/dev/null | tail -1)"
  printf '%s' "${v:-$2}"
}
WEB_P="$(port_from_env WEB_PORT 3000)"
ADMIN_P="$(port_from_env ADMIN_PORT 3001)"

cat <<EOF

${BOLD}${GREEN}셋업 완료${RESET}

  ${BOLD}pnpm dev${RESET}          web ${DIM}http://localhost:${WEB_P}${RESET} · admin ${DIM}http://localhost:${ADMIN_P}${RESET}
  ${BOLD}pnpm check${RESET}       환경 재검사
  ${BOLD}pnpm context${RESET}      세션 컨텍스트 수동 로드

  ${BOLD}pnpm agent --list${RESET} 에이전트 목록 (별도 터미널에서 실행되는 독립 프로세스)

Claude Code 를 이 디렉터리에서 열면 SessionStart 훅이 wiki 와 메모리를 자동 로드합니다.

  ${DIM}/save-memory${RESET}      세션 내용을 메모리에 저장
  ${DIM}/create-agent${RESET}     새 에이전트 생성

EOF
exit 0
