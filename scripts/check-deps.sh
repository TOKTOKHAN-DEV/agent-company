#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# check-deps.sh — 결정적 의존성 · 구조 검사.
#
# 사용: pnpm check
# 종료 코드: 0 = 필수 항목 모두 통과, 1 = 필수 항목 실패
#
# "결정적"이 핵심입니다. 모델의 판단이 아니라 셸 검사로 상태를 확인합니다.
# ─────────────────────────────────────────────────────────────
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT" || exit 1

RED=$'\033[31m'; GREEN=$'\033[32m'; YELLOW=$'\033[33m'; DIM=$'\033[2m'; BOLD=$'\033[1m'; RESET=$'\033[0m'
[ -t 1 ] || { RED=''; GREEN=''; YELLOW=''; DIM=''; BOLD=''; RESET=''; }

FAILED=0
WARNED=0

pass() { printf '  %s✔%s %-26s %s%s%s\n' "$GREEN" "$RESET" "$1" "$DIM" "${2:-}" "$RESET"; }
warn() { printf '  %s!%s %-26s %s\n' "$YELLOW" "$RESET" "$1" "${2:-}"; WARNED=$((WARNED + 1)); }
fail() { printf '  %s✘%s %-26s %s\n' "$RED" "$RESET" "$1" "${2:-}"; FAILED=$((FAILED + 1)); }
# 선택 항목의 상태 표시. 경고도 실패도 아니므로 아무것도 세지 않습니다.
note() { printf '  %s·%s %-26s %s%s%s\n' "$DIM" "$RESET" "$1" "$DIM" "${2:-}" "$RESET"; }
section() { printf '\n%s%s%s\n' "$BOLD" "$1" "$RESET"; }

# semver 비교: $1 >= $2 이면 0
version_gte() {
  [ "$(printf '%s\n%s\n' "$2" "$1" | sort -V | head -n1)" = "$2" ]
}

printf '%s\n' "${BOLD}Orca AI Company — 환경 검사${RESET}"
printf '%s%s%s\n' "$DIM" "$ROOT" "$RESET"

# ── 필수 런타임 ───────────────────────────────────────────────
section "필수 런타임"

MIN_NODE="20.11.0"
if command -v node >/dev/null 2>&1; then
  NODE_V="$(node -v | sed 's/^v//')"
  if version_gte "$NODE_V" "$MIN_NODE"; then
    pass "node" "v$NODE_V"
  else
    fail "node" "v$NODE_V — v$MIN_NODE 이상 필요. https://nodejs.org 또는 nvm/fnm 사용"
  fi
else
  fail "node" "설치되지 않음 → https://nodejs.org 또는 'brew install node'"
fi

MIN_PNPM="10.0.0"
if command -v pnpm >/dev/null 2>&1; then
  PNPM_V="$(pnpm -v)"
  if version_gte "$PNPM_V" "$MIN_PNPM"; then
    pass "pnpm" "v$PNPM_V"
  else
    fail "pnpm" "v$PNPM_V — v$MIN_PNPM 이상 필요 → 'corepack enable && corepack prepare pnpm@latest --activate'"
  fi
else
  fail "pnpm" "설치되지 않음 → 'corepack enable pnpm' 또는 'npm i -g pnpm'"
fi

if command -v git >/dev/null 2>&1; then
  pass "git" "$(git --version | awk '{print $3}')"
else
  fail "git" "설치되지 않음 → 'brew install git'"
fi

# ── 선택 도구 ─────────────────────────────────────────────────
section "선택 도구"

if command -v codex >/dev/null 2>&1; then
  pass "codex" "$(codex --version 2>/dev/null | head -1)"
else
  warn "codex" "없음 — 이미지 생성 불가. 폴백: 이미지 생략 / 사용자 첨부 / 웹 검색 (ADR-0002)"
fi

if command -v gh >/dev/null 2>&1; then
  if gh auth status >/dev/null 2>&1; then
    pass "gh (GitHub CLI)" "$(gh --version | head -1 | awk '{print $3}') · 인증됨"
  else
    warn "gh (GitHub CLI)" "설치됨, 미인증 → 'gh auth login'"
  fi
else
  warn "gh (GitHub CLI)" "없음 — 조직 팔로우/스타 단계를 건너뜁니다 → 'brew install gh'"
fi

if command -v claude >/dev/null 2>&1; then
  pass "claude (Claude Code)" "$(claude --version 2>/dev/null | head -1)"
else
  warn "claude (Claude Code)" "없음 — 훅과 스킬을 쓰려면 필요 → https://claude.com/claude-code"
fi

# ── 프로젝트 설치 상태 ────────────────────────────────────────
section "프로젝트 설치 상태"

[ -d node_modules ] && pass "node_modules" "설치됨" || fail "node_modules" "없음 → 'pnpm install'"

for app in web admin; do
  if [ -d "apps/$app/node_modules" ] || [ -L "apps/$app/node_modules" ]; then
    pass "apps/$app 의존성" "연결됨"
  else
    fail "apps/$app 의존성" "없음 → 'pnpm install'"
  fi
done

if [ -f .env ]; then
  pass ".env" "존재"
else
  warn ".env" "없음 → 'cp .env.example .env' (기본값으로도 동작합니다)"
fi

# ── 콘텐츠 ────────────────────────────────────────────────────
section "콘텐츠"

if [ -d content/posts ]; then
  POST_COUNT="$(find content/posts -name '*.md' 2>/dev/null | wc -l | tr -d ' ')"
  pass "content/posts" "${POST_COUNT}개 글"
else
  fail "content/posts" "없음 → 'mkdir -p content/posts'"
fi

# ── 백엔드 ────────────────────────────────────────────────────
# 키가 없는 것은 실패가 아닙니다 — 파일 기반이 정상 동작하는 데모 상태입니다.
section "백엔드"

if [ -n "${NEXT_PUBLIC_SUPABASE_URL:-}" ] || grep -qE '^\s*NEXT_PUBLIC_SUPABASE_URL=\S' .env 2>/dev/null; then
  if grep -qE '^\s*SUPABASE_SERVICE_ROLE_KEY=\S' .env 2>/dev/null || [ -n "${SUPABASE_SERVICE_ROLE_KEY:-}" ]; then
    pass "Supabase" "설정됨 (읽기/쓰기) — 마이그레이션 적용 여부를 확인하세요"
  else
    warn "Supabase" "URL 만 있음 — SUPABASE_SERVICE_ROLE_KEY 가 없어 쓰기 불가"
  fi
else
  pass "파일 기반 드라이버" "content/posts/*.md — Supabase 미설정 (정상 데모 상태)"
fi

[ -f packages/supabase/migrations/0001_init.sql ] \
  && pass "마이그레이션" "0001_init.sql 준비됨" \
  || warn "마이그레이션" "packages/supabase/migrations/0001_init.sql 없음"

# ── 검색엔진 · 애널리틱스 ─────────────────────────────────────
section "검색엔진 · 애널리틱스 (선택)"

check_env() {
  # $1 = 변수명, $2 = 설명
  if grep -qE "^\s*$1=\S" .env 2>/dev/null; then
    pass "$1" "설정됨"
  else
    warn "$1" "미설정 — $2"
  fi
}
check_env NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION "구글 서치콘솔 소유 확인 태그가 출력되지 않습니다"
check_env NEXT_PUBLIC_NAVER_SITE_VERIFICATION "네이버 서치어드바이저 소유 확인 태그가 출력되지 않습니다"
check_env NEXT_PUBLIC_GA4_MEASUREMENT_ID "GA4 트래커가 로드되지 않습니다"

# ── AI 컨텍스트 레이어 ────────────────────────────────────────
section "AI 컨텍스트 레이어"

for f in CLAUDE.md AGENTS.md wiki/README.md wiki/memory/index.md; do
  [ -f "$f" ] && pass "$f" "" || fail "$f" "없음 — 컨텍스트 로드가 불완전해집니다"
done

for d in wiki/memory/short-term wiki/memory/long-term wiki/decisions; do
  [ -d "$d" ] && pass "$d" "$(find "$d" -name '*.md' 2>/dev/null | wc -l | tr -d ' ')개" || warn "$d" "없음 → 'mkdir -p $d'"
done

# ── 훅 ────────────────────────────────────────────────────────
section "Claude Code 훅 · 스킬"

[ -f .claude/settings.json ] && pass ".claude/settings.json" "" || fail ".claude/settings.json" "없음 — 훅이 등록되지 않습니다"

for hook in .claude/hooks/session-start.sh .claude/hooks/guard-image-generation.sh; do
  if [ ! -f "$hook" ]; then
    fail "$hook" "없음"
  elif [ ! -x "$hook" ]; then
    warn "$hook" "실행 권한 없음 → 'chmod +x $hook'"
  elif ! bash -n "$hook" 2>/dev/null; then
    fail "$hook" "셸 문법 오류"
  else
    pass "$hook" "실행 가능"
  fi
done

for s in orca-setup save-memory create-agent; do
  [ -f ".claude/skills/$s/SKILL.md" ] && pass "/$s" "" || warn "/$s" "SKILL.md 없음"
done

# ── 에이전트 레지스트리 정합성 ────────────────────────────────
# 에이전트는 Claude 서브에이전트가 아니라 독립 프로세스입니다.
# registry.yaml 이 런타임·모델의 단일 진실 공급원이고, 각 에이전트는
# AGENT.md 정의와 skills/ 디렉터리를 갖습니다.
section "에이전트 레지스트리"

if [ -f agents/registry.yaml ]; then
  AGENT_IDS="$(awk '/^  - id:/ {print $3}' agents/registry.yaml)"
  AGENT_COUNT="$(printf '%s\n' "$AGENT_IDS" | grep -c . || true)"
  pass "agents/registry.yaml" "${AGENT_COUNT}개 에이전트"

  MISSING=""
  SKILL_TOTAL=0
  for id in $AGENT_IDS; do
    [ -f "agents/$id/AGENT.md" ] || MISSING="$MISSING agents/$id/AGENT.md"
    if [ -d "agents/$id/skills" ]; then
      n="$(find "agents/$id/skills" -name SKILL.md 2>/dev/null | wc -l | tr -d ' ')"
      SKILL_TOTAL=$((SKILL_TOTAL + n))
      [ "$n" -eq 0 ] && MISSING="$MISSING agents/$id/skills/*/SKILL.md"
    else
      MISSING="$MISSING agents/$id/skills/"
    fi

    # 런타임이 실제로 지원되는 값인지 확인
    rt="$(awk -v t="$id" '/^  - id:/{c=$3} c==t && $1=="runtime:"{print $2; exit}' agents/registry.yaml)"
    case "$rt" in
      claude|codex) ;;
      *) MISSING="$MISSING ($id: 알 수 없는 런타임 '$rt')" ;;
    esac
  done

  if [ -n "$MISSING" ]; then
    fail "정의 · 스킬 정합성" "문제:$MISSING → '/create-agent'로 재생성"
  else
    pass "정의 · 스킬 정합성" "AGENT.md + 스킬 ${SKILL_TOTAL}개"
  fi

  # 레지스트리에 없는 고아 디렉터리 탐지
  ORPHANS=""
  for d in agents/*/; do
    [ -d "$d" ] || continue
    id="$(basename "$d")"
    printf '%s\n' "$AGENT_IDS" | grep -qx "$id" || ORPHANS="$ORPHANS $id"
  done
  [ -n "$ORPHANS" ] && warn "고아 디렉터리" "registry.yaml에 없음:$ORPHANS" || pass "고아 디렉터리" "없음"

  # 런타임 가용성 (없어도 실행 자체는 가능하므로 경고)
  for rt in $(awk '/^    runtime:/{print $2}' agents/registry.yaml | sort -u); do
    if command -v "$rt" >/dev/null 2>&1; then
      pass "런타임: $rt" "사용 가능"
    else
      warn "런타임: $rt" "없음 — 해당 에이전트를 띄울 수 없습니다"
    fi
  done
else
  fail "agents/registry.yaml" "없음 — 런타임·모델 매핑을 알 수 없습니다"
fi

# ── 커뮤니티 ──────────────────────────────────────────────────
# orca-setup 의 6단계는 **선택**입니다. 그래서 여기서도 경고를 세지 않습니다 —
# 건너뛰기를 선택한 사람에게 매번 노란 느낌표를 보여주는 건 "다시 묻지 않는다"는
# 약속을 어기는 것입니다. 상태만 담백하게 보여줍니다.
section "커뮤니티 (선택)"

case "$(bash scripts/community.sh status)" in
  unavailable) note "GitHub 응원" "gh 미설치 또는 미인증 — 확인할 수 없습니다" ;;
  done)        pass "GitHub 응원" "팔로우 · 스타 완료 — 고맙습니다" ;;
  optout)      note "GitHub 응원" "건너뛰기를 선택하셨습니다" ;;
  pending)     note "GitHub 응원" "아직 → 'pnpm setup' 또는 'bash scripts/community.sh apply'" ;;
esac

# ── 타입 검사 ─────────────────────────────────────────────────
if [ "${ORCA_SKIP_TYPECHECK:-0}" != "1" ] && [ -d node_modules ]; then
  section "타입 검사"
  if pnpm -s typecheck >/dev/null 2>&1; then
    pass "pnpm typecheck" "통과"
  else
    fail "pnpm typecheck" "실패 → 'pnpm typecheck' 로 상세 확인"
  fi
fi

# ── 요약 ──────────────────────────────────────────────────────
printf '\n%s\n' "──────────────────────────────────────────────"
if [ "$FAILED" -gt 0 ]; then
  printf '%s실패 %d건%s, 경고 %d건\n' "$RED" "$FAILED" "$RESET" "$WARNED"
  printf '위의 %s✘%s 항목을 해결한 뒤 다시 실행하세요: %spnpm check%s\n' "$RED" "$RESET" "$BOLD" "$RESET"
  exit 1
fi

if [ "$WARNED" -gt 0 ]; then
  printf '%s통과%s — 경고 %d건 (선택 항목이라 실행에는 지장 없음)\n' "$GREEN" "$RESET" "$WARNED"
else
  printf '%s모두 통과%s\n' "$GREEN" "$RESET"
fi
# 포트는 .env 가 진실입니다 (orca-setup.sh 의 완료 메시지와 같은 규칙).
port_from_env() {
  v="$(sed -n "s/^[[:space:]]*$1=\([0-9][0-9]*\).*/\1/p" .env 2>/dev/null | tail -1)"
  printf '%s' "${v:-$2}"
}
printf '다음: %spnpm dev%s → web http://localhost:%s · admin http://localhost:%s\n' \
  "$BOLD" "$RESET" "$(port_from_env WEB_PORT 3000)" "$(port_from_env ADMIN_PORT 3001)"
exit 0
