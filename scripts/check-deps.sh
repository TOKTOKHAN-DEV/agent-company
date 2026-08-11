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

printf '%s\n' "${BOLD}Agent Company — 환경 검사${RESET}"
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

if [ -f .env ]; then
  pass ".env" "존재"
else
  warn ".env" "없음 → 'cp .env.example .env' (기본값으로도 동작합니다)"
fi

# ── 현재 회사 (템플릿) ────────────────────────────────────────
# 무엇을 검사할지는 템플릿이 정합니다. 여기에 apps/web 을 박아두면
# 다른 템플릿을 고른 사람에게 없는 것을 없다고 혼내게 됩니다.
section "현재 회사 (템플릿)"

TEMPLATE_SH="scripts/template.sh"
tmeta() { bash "$TEMPLATE_SH" meta "$CURRENT_TEMPLATE" "$1" 2>/dev/null; }

CURRENT_TEMPLATE="$(bash "$TEMPLATE_SH" current 2>/dev/null || printf 'none')"

if [ "$CURRENT_TEMPLATE" = "none" ]; then
  warn "적용된 템플릿" "없음 → 'pnpm company-setup' 또는 'pnpm template apply <id>'"
else
  pass "$CURRENT_TEMPLATE" "$(tmeta name | head -n1) · $(tmeta status | head -n1)"

  while IFS= read -r w; do
    [ -n "$w" ] || continue
    if [ -d "$w/node_modules" ] || [ -L "$w/node_modules" ]; then
      pass "$w 의존성" "연결됨"
    elif [ -d "$w" ]; then
      fail "$w 의존성" "없음 → 'pnpm install'"
    else
      fail "$w" "워크스페이스가 없습니다 → 'pnpm template apply $CURRENT_TEMPLATE --force'"
    fi
  done < <(tmeta verify-workspace)

  while IFS= read -r d; do
    [ -n "$d" ] || continue
    if [ -d "$d" ]; then
      pass "$d" "$(find "$d" -type f 2>/dev/null | wc -l | tr -d ' ')개 파일"
    else
      fail "$d" "없음 → 'mkdir -p $d'"
    fi
  done < <(tmeta verify-dir)

  while IFS= read -r p; do
    [ -n "$p" ] || continue
    [ -e "$p" ] && pass "$p" "있음" || warn "$p" "없음 (선택 항목)"
  done < <(tmeta verify-optional)

  # verify-env: VAR=없을 때 무엇이 꺼지는지
  while IFS= read -r line; do
    [ -n "$line" ] || continue
    v="${line%%=*}"; why="${line#*=}"
    if grep -qE "^[[:space:]]*$v=\S" .env 2>/dev/null; then
      pass "$v" "설정됨"
    else
      warn "$v" "미설정 — $why"
    fi
  done < <(tmeta verify-env)

  # note-env: 비어 있는 게 정상인 값. 경고로 세지 않습니다.
  while IFS= read -r line; do
    [ -n "$line" ] || continue
    v="${line%%=*}"; why="${line#*=}"
    if grep -qE "^[[:space:]]*$v=\S" .env 2>/dev/null; then
      note "$v" "설정됨"
    else
      note "$v" "$why"
    fi
  done < <(tmeta note-env)

  # ── mcp: 이 템플릿이 쓰는 MCP 서버 ─────────────────────────
  # 등록 여부만 봅니다. 인증(OAuth)까지는 확인할 수 없습니다 — 확인하려면
  # 네트워크를 타야 하고, 그러면 이 검사가 결정적이지 않게 됩니다.
  MCP_LINES="$(tmeta mcp)"
  if [ -n "$MCP_LINES" ]; then
    MCP_NAMES="$(printf '%s\n' "$MCP_LINES" | cut -d= -f1 | tr '\n' ' ')"
    # shellcheck disable=SC2086
    MCP_STATUS="$(node scripts/mcp-status.mjs $MCP_NAMES 2>/dev/null)"
    while IFS= read -r line; do
      [ -n "$line" ] || continue
      name="${line%%=*}"; why="${line#*=}"
      state="$(printf '%s\n' "$MCP_STATUS" | awk -F'\t' -v n="$name" '$1==n {print $2; exit}')"
      scope="$(printf '%s\n' "$MCP_STATUS" | awk -F'\t' -v n="$name" '$1==n {print $3; exit}')"
      if [ "$state" = "registered" ]; then
        pass "MCP: $name" "등록됨 ($scope)"
      else
        warn "MCP: $name" "미등록 — $why"
        add_cmd="$(tmeta mcp-claude | awk -F= -v n="$name" '$1==n {sub(/^[^=]*=/,""); print; exit}')"
        [ -n "$add_cmd" ] && printf '      %s%s%s\n' "$DIM" "$add_cmd" "$RESET"
      fi
    done < <(printf '%s\n' "$MCP_LINES")
  fi
fi

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

for s in company-setup save-memory create-agent; do
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
elif [ "$CURRENT_TEMPLATE" = "none" ]; then
  # 템플릿을 아직 안 펼쳤으면 레지스트리가 없는 게 정상입니다.
  note "agents/registry.yaml" "아직 없음 — 템플릿을 적용하면 생깁니다"
else
  fail "agents/registry.yaml" "없음 — 런타임·모델 매핑을 알 수 없습니다 → 'pnpm template apply $CURRENT_TEMPLATE --force'"
fi

# ── 커뮤니티 ──────────────────────────────────────────────────
# company-setup 의 6단계는 **선택**입니다. 그래서 여기서도 경고를 세지 않습니다 —
# 건너뛰기를 선택한 사람에게 매번 노란 느낌표를 보여주는 건 "다시 묻지 않는다"는
# 약속을 어기는 것입니다. 상태만 담백하게 보여줍니다.
section "커뮤니티 (선택)"

case "$(bash scripts/community.sh status)" in
  unavailable) note "GitHub 응원" "gh 미설치 또는 미인증 — 확인할 수 없습니다" ;;
  done)        pass "GitHub 응원" "팔로우 · 스타 완료 — 고맙습니다" ;;
  optout)      note "GitHub 응원" "건너뛰기를 선택하셨습니다" ;;
  pending)     note "GitHub 응원" "아직 → 'pnpm company-setup' 또는 'bash scripts/community.sh apply'" ;;
esac

# ── 타입 검사 ─────────────────────────────────────────────────
if [ "${COMPANY_SKIP_TYPECHECK:-0}" != "1" ] && [ -d node_modules ]; then
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

# 다음에 뭘 할지는 템플릿이 정합니다 (company-setup.sh 의 완료 메시지와 같은 규칙).
# 값은 .env 가 진실이고, 없으면 .env.example 을 봅니다.
env_value() {
  local v
  v="$(sed -n "s/^[[:space:]]*$1=//p" .env 2>/dev/null | tail -1)"
  [ -n "$v" ] || v="$(sed -n "s/^[[:space:]]*$1=//p" .env.example 2>/dev/null | tail -1)"
  v="${v%\"}"; v="${v#\"}"
  printf '%s' "$v"
}
subst_env() {
  local line="$1" name val
  while [[ "$line" =~ \$\{([A-Za-z_][A-Za-z0-9_]*)\} ]]; do
    name="${BASH_REMATCH[1]}"
    val="$(env_value "$name")"
    line="${line//\$\{$name\}/$val}"
  done
  printf '%s' "$line"
}

if [ "$CURRENT_TEMPLATE" = "none" ]; then
  printf '다음: %spnpm company-setup%s — 어떤 회사를 차릴지 고릅니다\n' "$BOLD" "$RESET"
else
  printf '다음:\n'
  while IFS= read -r line; do
    [ -n "$line" ] && printf '  %s\n' "$(subst_env "$line")"
  done < <(bash "$TEMPLATE_SH" meta "$CURRENT_TEMPLATE" next 2>/dev/null)
fi
exit 0
