#!/usr/bin/env bash
# SessionStart 훅 — 프로젝트 컨텍스트를 세션에 주입한다.
#
# 조용히 실패하지 않는 것이 중요하다. 이 훅이 깨지면 컨텍스트 로드가 통째로
# 사라지고, 그 사실을 아무도 모른 채 세션이 진행된다.
set -uo pipefail

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
LOADER="$PROJECT_DIR/scripts/load-context.sh"

if [ ! -f "$LOADER" ]; then
  echo "[orca] 경고: scripts/load-context.sh 를 찾을 수 없습니다. 프로젝트 컨텍스트가 로드되지 않았습니다."
  echo "[orca] 이 세션은 wiki/memory 없이 시작됩니다. 필요하면 wiki/README.md 를 직접 읽으세요."
  exit 0
fi

if ! bash "$LOADER"; then
  echo "[orca] 경고: 컨텍스트 로더가 실패했습니다. \`pnpm context\` 로 수동 확인하세요."
fi

exit 0
