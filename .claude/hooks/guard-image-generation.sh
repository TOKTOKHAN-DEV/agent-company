#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# PreToolUse(Bash) 가드 — 이미지 생성 하드 룰 강제.
#
# 정책(ADR-0002): 이미지 생성은 Codex `imagegen` 전용.
# 다른 이미지 생성 경로로 보이는 명령을 차단한다.
#
# 문서로만 둔 규칙은 지켜지지 않는다. 이 훅은 규칙을 실행 가능한 형태로 만든다.
# ─────────────────────────────────────────────────────────────
set -uo pipefail

INPUT="$(cat)"

deny() {
  # PreToolUse JSON 출력으로 도구 실행을 거부한다.
  cat <<JSON
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": $1
  }
}
JSON
  exit 0
}

# Codex 경유는 언제나 허용. 프로젝트 스크립트도 허용.
if printf '%s' "$INPUT" | grep -qiE 'codex|codex-imagegen\.sh|pnpm +imagegen'; then
  exit 0
fi

# 비-Codex 이미지 생성 경로로 보이는 명령을 차단한다.
FORBIDDEN='dall-?e|images/generations|stability\.ai|stablediffusion|stable-diffusion|midjourney|replicate\.com/.*(flux|sdxl|image)|api\.openai\.com/v1/images|imagen-[0-9]|gemini.*generateImage|/v1/images/generate'

if printf '%s' "$INPUT" | grep -qiE "$FORBIDDEN"; then
  deny '"차단됨: 이미지 생성은 Codex imagegen 전용입니다 (ADR-0002 하드 룰).\n\n허용된 경로:\n  pnpm imagegen --slug <slug> --prompt \"<설명>\"\n\nCodex를 쓸 수 없다면 이 순서로 폴백하세요:\n  1) 이미지 없이 진행 (기본값)\n  2) 사용자에게 직접 첨부 요청\n  3) 웹 검색 후 라이선스를 cover.license에 기록\n\n다른 이미지 생성 모델이나 API를 찾지 마세요."'
fi

exit 0
