---
date: 2026-07-27
type: decision
topic: project-invariants
tags: [architecture, rules]
confidence: high
promoted: true
---

# 프로젝트 불변 사항

이 다섯 가지는 코드보다 오래 갑니다. 바꾸려면 `wiki/decisions/`에 ADR을 먼저 쓰세요.

1. **이미지 생성은 Codex `imagegen` 전용.** → [image-generation-policy.md](./image-generation-policy.md)
2. **발행은 사람만.** 에이전트는 `in_review`까지. → [publish-gate.md](./publish-gate.md)
3. **콘텐츠의 진실은 파일.** `content/posts/*.md`. DB·외부 CMS를 도입하지 않는다. → ADR-0001
4. **검수는 결정적으로.** `auditPost()`에 LLM 호출을 넣지 않는다. 사람과 에이전트가 같은 결과를 봐야 한다.
5. **컨텍스트 로드는 자동.** SessionStart 훅이 처리한다. 사람이 기억해서 시키지 않는다. → ADR-0003
6. **에이전트는 독립 프로세스.** Claude 서브에이전트가 아니다. 나누는 기준은 런타임과 병렬성.
   → [agent-granularity.md](./agent-granularity.md)

## 왜 이걸 메모리에 두는가

wiki에도 있지만, 메모리 인덱스는 세션 시작 시 **항상** 로드됩니다. wiki 문서는 모델이 열어야 읽힙니다.
가장 자주 위반될 위험이 있는 규칙만 여기에 중복해 둡니다.
