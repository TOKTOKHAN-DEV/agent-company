#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# with-env.sh — 루트 .env 를 프로세스 환경으로 로드한 뒤 명령을 실행합니다.
#
# 사용: bash scripts/with-env.sh <명령> [인자...]
#
# 왜 필요한가: Next.js 도 .env 를 읽지만 그건 프로세스가 시작된 **뒤**입니다.
# `--port ${ADMIN_PORT:-3001}` 같은 CLI 인자는 그보다 먼저 셸에서 확정되므로,
# .env 를 미리 로드해 두지 않으면 항상 기본값이 쓰입니다.
#
# .env 에 공백이 들어간 값은 반드시 따옴표로 감싸세요 (셸 문법으로 읽습니다).
#   NEXT_PUBLIC_SITE_NAME="Agent Blog"
# ─────────────────────────────────────────────────────────────
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT/.env"

if [ -f "$ENV_FILE" ]; then
  # 문법 오류가 있으면 조용히 넘어가지 않고 무엇이 문제인지 알립니다.
  if bash -n "$ENV_FILE" 2>/dev/null; then
    set -a
    # shellcheck disable=SC1090
    . "$ENV_FILE"
    set +a
  else
    printf '[with-env] 경고: .env 를 셸 문법으로 읽을 수 없습니다.\n' >&2
    printf '[with-env] 공백이 포함된 값은 따옴표로 감싸세요. 기본값으로 진행합니다.\n' >&2
  fi
fi

exec "$@"
