---
date: 2026-07-27
type: decision
topic: image-generation
tags: [images, codex, hard-rule]
confidence: high
promoted: true
---

# 이미지 생성 정책 (하드 룰)

**이미지는 Codex CLI의 `imagegen`으로만 생성한다. Claude가 이미지를 만드는 것은 금지한다.**

## 절차

```bash
pnpm imagegen --slug <post-slug> --prompt "<설명>"
```

명령은 템플릿이 제공합니다 (`blog` 는 `pnpm imagegen`). 정책은 코어라 템플릿과
무관하게 PreToolUse 훅이 강제합니다. 템플릿에 이미지 명령이 없으면 이미지 없이 진행하는 것이
정답입니다.

내부적으로 `scripts/codex-imagegen.sh`가 `codex`를 호출하고, 결과를 `apps/web/public/images/posts/`에
저장한 뒤 프론트매터의 `cover`를 채웁니다. `cover.origin`에 프롬프트가 기록되어 재생성이 가능합니다.

## Codex가 없을 때 (이 순서로)

1. **이미지 없이 진행** — 기본값. 이미지는 발행 필수 요소가 아닙니다.
2. **사용자에게 요청** — 직접 첨부해 달라고 하고 대기합니다.
3. **웹 검색** — 라이선스를 확인하고 `cover.license`에 기록합니다.

절대 하지 않는 것: Claude로 이미지 생성, 다른 이미지 모델 호출, 출처 불명 이미지 사용.

## 왜

- 스타일 일관성 — 단일 경로에서 나온 이미지만 프리셋을 공유합니다.
- 추적성 — 프롬프트가 남아야 재생성과 감사가 가능합니다.
- 역할 분리 — Claude는 판단과 글, Codex는 이미지.

## 강제 수단

- `ImageSource` 타입에 `claude`가 존재하지 않음 (`packages/content/src/schema.ts`)
- `.claude/hooks/guard-image-generation.sh` — PreToolUse 차단
- `auditPost()` — 출처 미기록 시 error, 발행 불가

상세: [ADR-0002](../../decisions/ADR-0002-codex-only-image-generation.md)
