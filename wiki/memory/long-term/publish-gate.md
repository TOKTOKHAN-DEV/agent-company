---
date: 2026-07-27
type: decision
topic: publish-gate
tags: [workflow, review, hard-rule]
confidence: high
promoted: true
---

# 발행 게이트

**에이전트는 글을 발행할 수 없다.** `status`를 `in_review`까지만 올린다. `published`로의 전환은 사람이
admin 검수 화면에서 수행한다.

## 상태 흐름

```
draft ──▶ in_review ──▶ (사람) ──▶ published
   ▲          │                       │
   └──────────┴───────────────────────┘
        검수에서 반려 시 되돌림
```

## 게이트 조건

`auditPost()`가 반환하는 issue 중 `severity: 'error'`가 하나라도 있으면 admin의 발행 옵션이 비활성화됩니다.
이 검사는 순수 규칙 기반이라 사람이 보는 화면과 `blog-writer` 가 `pnpm audit:content` 로 보는 결과가
항상 일치합니다.

대표적인 error 조건:

- 커버 이미지에 alt 텍스트 없음
- 커버 이미지 출처(`cover.source`)가 `none`
- 웹에서 가져온 이미지에 라이선스 미기록
- 메타 설명 없음
- `description` 비어 있음

## 왜

에이전트 결과물을 검토 없이 프로덕션에 내보내지 않기 위해서입니다. 게이트를 결정적으로 만든 이유는, 모델이
스스로를 평가하게 하면 통과시키고 싶은 방향으로 판단이 기울기 때문입니다.

## 도구 호출에 적용할 때

이 규칙을 **도구 이름으로** 적용하면 뚫린다. `miniapp_update_icon` 처럼 setter 로 보이는
이름이 실제로는 검토 요청을 함께 보내는 경우가 있다. 판단 기준은
[[tool-side-effects-not-names]] 에 있다.
