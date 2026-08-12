#!/usr/bin/env bash
# 파일 기반 글을 Supabase 로 이관합니다.
#
# 사용: pnpm --filter @repo/supabase migrate
#
# 파일은 지우지 않습니다. 이관이 잘못돼도 되돌릴 수 있어야 하기 때문입니다.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$ROOT"

exec node --experimental-strip-types --no-warnings packages/supabase/scripts/migrate-content.ts "$@"
