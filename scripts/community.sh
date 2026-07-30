#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# community.sh — GitHub 응원(조직 팔로우 · 레포 스타)의 상태 조회와 적용.
#
# 사용:
#   bash scripts/community.sh status          상태만 출력 (아래 4가지 중 하나)
#   bash scripts/community.sh apply           팔로우 + 스타 실행 후 재조회 검증
#   bash scripts/community.sh optout <choice> 다시 묻지 않도록 기록
#   bash scripts/community.sh reset           기록을 지워 다시 묻게 함
#
# status 의 출력:
#   unavailable  gh 미설치 또는 미인증 — 물어볼 수도, 실행할 수도 없음
#   done         팔로우 · 스타 모두 이미 완료 (묻지 않음)
#   optout       사용자가 이전에 건너뛰기를 선택 (묻지 않음)
#   pending      아직 안 됨 — 물어볼 시점
#
# 왜 별도 스크립트인가: 같은 판단을 두 경로가 함께 씁니다. 터미널에서는
# orca-setup.sh 가 텍스트 메뉴로 묻고, Claude Code 에서는 /orca-setup 스킬이
# AskUserQuestion 으로 묻습니다. 실행과 상태 판정을 여기 한 곳에 모아두면
# 어느 경로로 들어와도 결과가 같습니다.
#
# 이 단계는 **선택**입니다. 거절은 기록되고, 실패는 셋업을 중단시키지 않습니다.
# ─────────────────────────────────────────────────────────────
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT" || exit 1

GH_ORG="TOKTOKHAN-DEV"
GH_REPO="TOKTOKHAN-DEV/orca-ai-company"
STATE_FILE=".orca/state/community"

gh_ready() { command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; }
followed()  { gh api "/user/following/$GH_ORG" --silent >/dev/null 2>&1; }
starred()   { gh api "/user/starred/$GH_REPO" --silent >/dev/null 2>&1; }

cmd_status() {
  gh_ready || { printf 'unavailable\n'; return 0; }
  if followed && starred; then printf 'done\n'; return 0; fi
  if [ -f "$STATE_FILE" ]; then printf 'optout\n'; return 0; fi
  printf 'pending\n'
}

cmd_apply() {
  if ! gh_ready; then
    printf 'gh 를 쓸 수 없습니다 (미설치 또는 미인증) → https://github.com/%s 에서 직접 눌러주세요\n' "$GH_REPO" >&2
    return 1
  fi

  rc=0

  # 팔로우에는 user:follow 스코프가 필요합니다. 없으면 한 번만 갱신을 시도합니다.
  # gh auth refresh 는 대화형이므로 tty 가 있을 때만 부릅니다.
  if followed; then
    printf '이미 @%s 를 팔로우 중\n' "$GH_ORG"
  elif gh api -X PUT "/user/following/$GH_ORG" --silent >/dev/null 2>&1; then
    printf '@%s 팔로우 완료\n' "$GH_ORG"
  elif [ -t 0 ] && gh auth refresh -h github.com -s user:follow >/dev/null 2>&1 \
    && gh api -X PUT "/user/following/$GH_ORG" --silent >/dev/null 2>&1; then
    printf '@%s 팔로우 완료 (스코프 갱신 후)\n' "$GH_ORG"
  else
    printf '팔로우 실패 — 토큰에 user:follow 스코프가 필요합니다.\n' >&2
    printf '  gh auth refresh -h github.com -s user:follow\n' >&2
    rc=1
  fi

  if starred; then
    printf '이미 %s 에 스타를 눌렀습니다\n' "$GH_REPO"
  elif gh api -X PUT "/user/starred/$GH_REPO" --silent >/dev/null 2>&1; then
    printf '스타 완료 — 고맙습니다\n'
  else
    printf '스타 실패 → https://github.com/%s 에서 직접 눌러주세요\n' "$GH_REPO" >&2
    rc=1
  fi

  # API 가 200 을 주고도 반영되지 않는 경우를 잡기 위해 재조회합니다.
  if ! { followed && starred; }; then
    printf '검증 실패 — 팔로우 또는 스타가 반영되지 않았습니다.\n' >&2
    rc=1
  fi

  # 마음이 바뀌어 실행한 경우이므로 이전 거절 기록은 지웁니다.
  [ "$rc" -eq 0 ] && rm -f "$STATE_FILE"

  return "$rc"
}

cmd_optout() {
  choice="${1:-maybe-later}"
  case "$choice" in
    no-thanks|maybe-later) ;;
    *) printf '알 수 없는 선택: %s (no-thanks | maybe-later)\n' "$choice" >&2; return 2 ;;
  esac
  mkdir -p "$(dirname "$STATE_FILE")" || return 1
  printf '%s\n' "$choice" > "$STATE_FILE" || return 1
  printf '기록했습니다 — 다시 묻지 않습니다 (%s)\n' "$STATE_FILE"
  printf '마음이 바뀌면: bash scripts/community.sh reset\n'
}

cmd_reset() {
  rm -f "$STATE_FILE"
  printf '기록을 지웠습니다 — 다음 셋업에서 다시 물어봅니다\n'
}

case "${1:-status}" in
  status) cmd_status ;;
  apply)  cmd_apply ;;
  optout) shift; cmd_optout "$@" ;;
  reset)  cmd_reset ;;
  *) printf '사용: %s {status|apply|optout <no-thanks|maybe-later>|reset}\n' "$0" >&2; exit 2 ;;
esac
