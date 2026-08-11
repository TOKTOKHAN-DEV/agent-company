#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# run-agent.sh — 에이전트를 자기 런타임으로 띄운다.
#
# 사용:
#   pnpm agent <id> "<작업>"
#   pnpm agent --list
#   pnpm agent <id> "<작업>" --print      # 비대화형 (CI, 파이프라인)
#   pnpm agent <id> "<작업>" --dry-run    # 명령만 출력 (멀티 터미널용)
#
# 하는 일:
#   1. registry.yaml 에서 런타임과 모델을 읽는다
#   2. AGENT.md + 스킬 인덱스를 시스템 프롬프트로 조립한다
#      (스킬 인덱스는 skills/ 를 스캔해 자동 생성 — 파일을 추가하면 바로 반영)
#   3. 해당 CLI 를 올바른 모델로 실행한다
#
# 에이전트는 Claude 서브에이전트가 아니라 독립 프로세스다. 그래서 런타임이
# 서로 달라도 되고, Orca 같은 ADE 가 멀티 터미널로 병렬 실행할 수 있다.
# ─────────────────────────────────────────────────────────────
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT" || exit 1

REGISTRY="agents/registry.yaml"

RED=$'\033[31m'; GREEN=$'\033[32m'; YELLOW=$'\033[33m'; DIM=$'\033[2m'; BOLD=$'\033[1m'; RESET=$'\033[0m'
[ -t 1 ] || { RED=''; GREEN=''; YELLOW=''; DIM=''; BOLD=''; RESET=''; }

die() { printf '%s✘%s %s\n' "$RED" "$RESET" "$1" >&2; exit 1; }

if [ ! -f "$REGISTRY" ]; then
  printf '%s✘%s %s 가 없습니다 — 아직 로스터가 없습니다.\n\n' "$RED" "$RESET" "$REGISTRY" >&2
  printf '템플릿을 펼치면 그 템플릿의 에이전트가 등록됩니다.\n\n' >&2
  printf '  %spnpm company-setup%s          어떤 회사를 차릴지 고릅니다\n' "$BOLD" "$RESET" >&2
  printf '  %spnpm template list%s          템플릿 목록\n' "$BOLD" "$RESET" >&2
  exit 1
fi

# ── 에이전트 목록 ─────────────────────────────────────────────
list_agents() {
  awk '
    /^  - id:/    { id=$3 }
    /^    runtime:/ { rt=$2 }
    /^    model:/   { model=$2 }
    /^    summary:/ { $1=""; s=$0; sub(/^ +/,"",s);
                      if (id != "") printf "  %-14s %-8s %-8s %s\n", id, rt, model, s; id="" }
  ' "$REGISTRY"
}

# registry 에서 특정 에이전트의 한 필드를 읽는다.
field_of() {
  awk -v target="$1" -v key="$2" '
    /^  - id:/ { cur=$3 }
    cur == target && $1 == key":" { $1=""; v=$0; sub(/^ +/,"",v); print v; exit }
  ' "$REGISTRY"
}

# ── 인자 파싱 ─────────────────────────────────────────────────
AGENT_ID=""
TASK=""
PRINT_MODE=0
DRY_RUN=0

while [ $# -gt 0 ]; do
  case "$1" in
    --list|-l)
      printf '%s등록된 에이전트%s\n\n' "$BOLD" "$RESET"
      printf '  %-14s %-8s %-8s %s\n' "ID" "런타임" "모델" "역할"
      printf '  %s\n' "$(printf '─%.0s' {1..70})"
      list_agents
      printf '\n%s실행:%s pnpm agent <id> "<작업>"\n' "$BOLD" "$RESET"
      exit 0 ;;
    --print|-p) PRINT_MODE=1; shift ;;
    --dry-run)  DRY_RUN=1; shift ;;
    -h|--help)
      sed -n '2,20p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
      exit 0 ;;
    -*) die "알 수 없는 옵션: $1" ;;
    *)
      if [ -z "$AGENT_ID" ]; then AGENT_ID="$1"; else TASK="${TASK:+$TASK }$1"; fi
      shift ;;
  esac
done

if [ -z "$AGENT_ID" ]; then
  printf '%s사용:%s pnpm agent <id> "<작업>"\n\n' "$BOLD" "$RESET"
  printf '%s등록된 에이전트:%s\n' "$BOLD" "$RESET"
  list_agents
  exit 2
fi

# ── 에이전트 설정 로드 ────────────────────────────────────────
RUNTIME="$(field_of "$AGENT_ID" runtime)"
MODEL="$(field_of "$AGENT_ID" model)"
DEFINITION="$(field_of "$AGENT_ID" definition)"
SKILLS_DIR="$(field_of "$AGENT_ID" skills)"

if [ -z "$RUNTIME" ]; then
  printf '%s✘%s 등록되지 않은 에이전트: %s\n\n' "$RED" "$RESET" "$AGENT_ID" >&2
  printf '등록된 에이전트:\n' >&2
  list_agents >&2
  exit 1
fi

[ -f "$DEFINITION" ] || die "정의 파일이 없습니다: $DEFINITION  → '/create-agent' 로 재생성하세요."
[ -n "$TASK" ] || die "작업 내용이 필요합니다. 예: pnpm agent $AGENT_ID \"글 하나 써줘\""

# ── 런타임 가용성 ─────────────────────────────────────────────
if ! command -v "$RUNTIME" >/dev/null 2>&1; then
  printf '%s✘%s %s 런타임(%s)을 찾을 수 없습니다.\n\n' "$RED" "$RESET" "$AGENT_ID" "$RUNTIME" >&2
  case "$RUNTIME" in
    claude) printf '설치: https://claude.com/claude-code\n' >&2 ;;
    codex)  printf '설치: npm i -g @openai/codex  (또는 brew install codex)\n\n' >&2
            printf '%s이미지 에이전트를 쓸 수 없으면 이미지 없이 진행하거나 직접 첨부하세요.%s\n' "$YELLOW" "$RESET" >&2
            printf '다른 이미지 생성 도구를 찾지 마세요 (ADR-0002).\n' >&2 ;;
  esac
  exit 3
fi

# ── 시스템 프롬프트 조립 ──────────────────────────────────────
# AGENT.md + 스킬 인덱스. 스킬 인덱스는 폴더를 스캔해 만들기 때문에
# SKILL.md 를 추가하면 별도 등록 없이 바로 노출된다.
build_prompt() {
  cat "$DEFINITION"

  if [ -d "$SKILLS_DIR" ]; then
    printf '\n\n---\n\n## 사용 가능한 스킬\n\n'
    printf '작업을 시작하기 전에 해당 스킬 파일을 **직접 읽어라.** 요약에 의존하지 마라.\n\n'
    for skill in "$SKILLS_DIR"/*/SKILL.md; do
      [ -e "$skill" ] || continue
      name="$(basename "$(dirname "$skill")")"
      summary="$(grep -m1 '^summary:' "$skill" | sed 's/^summary: *//')"
      when="$(grep -m1 '^when:' "$skill" | sed 's/^when: *//')"
      printf -- '- `%s` — %s\n' "$name" "${summary:-(요약 없음)}"
      [ -n "$when" ] && printf -- '  - 언제: %s\n' "$when"
      printf -- '  - 파일: `%s`\n' "$skill"
    done
  fi

  printf '\n\n---\n\n## 프로젝트 컨텍스트\n\n'
  printf '작업 디렉터리는 `%s` 이다.\n\n' "$ROOT"
  printf '먼저 읽어야 할 것:\n'
  printf -- '- `AGENTS.md` — 모든 에이전트 공통 규칙과 하드 룰\n'
  printf -- '- `wiki/README.md` — wiki 인덱스\n'
  printf -- '- `wiki/memory/index.md` — 장기 메모리\n'
}

PROMPT_FILE="$(mktemp -t agent-XXXXXX)"
trap 'rm -f "$PROMPT_FILE"' EXIT
build_prompt > "$PROMPT_FILE"

# ── 실행 ──────────────────────────────────────────────────────
printf '%s▸ %s%s %s(%s · %s)%s\n' "$BOLD" "$AGENT_ID" "$RESET" "$DIM" "$RUNTIME" "$MODEL" "$RESET"
printf '%s  작업: %s%s\n\n' "$DIM" "$TASK" "$RESET"

case "$RUNTIME" in
  claude)
    # claude 는 시스템 프롬프트를 별도 플래그로 받는다.
    set -- --append-system-prompt "$(cat "$PROMPT_FILE")"
    [ "$MODEL" != "default" ] && set -- "$@" --model "$MODEL"
    [ "$PRINT_MODE" -eq 1 ] && set -- "$@" --print
    set -- "$@" "$TASK"

    if [ "$DRY_RUN" -eq 1 ]; then
      printf '%sclaude --append-system-prompt "$(cat %s)"%s' "$DIM" "$DEFINITION" "$RESET"
      [ "$MODEL" != "default" ] && printf '%s --model %s%s' "$DIM" "$MODEL" "$RESET"
      printf '%s "%s"%s\n' "$DIM" "$TASK" "$RESET"
      exit 0
    fi
    exec claude "$@"
    ;;

  codex)
    # codex 는 별도 시스템 프롬프트 플래그가 없으므로 프롬프트에 합친다.
    FULL_PROMPT="$(cat "$PROMPT_FILE")

---

## 지금 할 작업

$TASK"

    if [ "$PRINT_MODE" -eq 1 ]; then
      set -- exec --sandbox workspace-write --skip-git-repo-check
    else
      set --
    fi
    [ "$MODEL" != "default" ] && set -- "$@" --model "$MODEL"
    set -- "$@" "$FULL_PROMPT"

    if [ "$DRY_RUN" -eq 1 ]; then
      printf '%scodex' "$DIM"
      [ "$PRINT_MODE" -eq 1 ] && printf ' exec --sandbox workspace-write --skip-git-repo-check'
      [ "$MODEL" != "default" ] && printf ' --model %s' "$MODEL"
      printf ' "<AGENT.md + 스킬 인덱스 + 작업>"%s\n' "$RESET"
      exit 0
    fi
    exec codex "$@"
    ;;

  *)
    die "지원하지 않는 런타임: $RUNTIME (claude | codex)"
    ;;
esac
