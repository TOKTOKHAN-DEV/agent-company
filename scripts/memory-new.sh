#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# memory-new.sh — 템플릿에서 새 메모리 파일을 만든다.
#
# 사용:
#   pnpm memory:new <topic>              # 단기 (기본)
#   pnpm memory:new <topic> --long       # 장기
#
# `/save-memory` 스킬이 내부적으로 이 스크립트를 씁니다.
# ─────────────────────────────────────────────────────────────
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

TOPIC="${1:-}"
KIND="short"
[ "${2:-}" = "--long" ] && KIND="long"

if [ -z "$TOPIC" ]; then
  echo "사용: pnpm memory:new <topic> [--long]" >&2
  echo "  topic 은 kebab-case 로. 예: admin-server-actions" >&2
  exit 2
fi

# kebab-case 정규화
TOPIC="$(printf '%s' "$TOPIC" | tr '[:upper:] ' '[:lower:]-' | sed 's/[^a-z0-9-]//g; s/-\{2,\}/-/g; s/^-//; s/-$//')"
TODAY="$(date +%F)"

if [ "$KIND" = "long" ]; then
  TEMPLATE="wiki/memory/_templates/long-term.md"
  TARGET="wiki/memory/long-term/${TOPIC}.md"
else
  TEMPLATE="wiki/memory/_templates/short-term.md"
  TARGET="wiki/memory/short-term/${TODAY}-${TOPIC}.md"
fi

[ -f "$TEMPLATE" ] || { echo "템플릿 없음: $TEMPLATE" >&2; exit 1; }
[ -e "$TARGET" ] && { echo "이미 존재합니다: $TARGET" >&2; exit 1; }

mkdir -p "$(dirname "$TARGET")"
sed "s/^date: YYYY-MM-DD/date: ${TODAY}/; s/^topic: kebab-case-topic/topic: ${TOPIC}/" "$TEMPLATE" > "$TARGET"

echo "$TARGET"

if [ "$KIND" = "long" ]; then
  echo "" >&2
  echo "장기 메모리를 만들었습니다. wiki/memory/index.md 에 한 줄을 추가하세요:" >&2
  echo "  - [${TOPIC}.md](./long-term/${TOPIC}.md) — <한 줄 요약>" >&2
fi
