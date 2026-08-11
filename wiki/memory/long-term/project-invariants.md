---
date: 2026-07-27
type: decision
topic: project-invariants
tags: [architecture, rules]
confidence: high
promoted: true
---

# 프로젝트 불변 사항

**템플릿과 무관하게** 항상 참입니다. 코드보다 오래 갑니다. 바꾸려면 `wiki/decisions/`에 ADR을
먼저 쓰세요.

1. **이미지 생성 경로는 하나.** Codex `imagegen` 만. 다른 모델도, SVG 대체도 금지.
   → [image-generation-policy.md](./image-generation-policy.md)
2. **출고는 사람만.** 에이전트는 검수 대기(`in_review`)까지. → [publish-gate.md](./publish-gate.md)
3. **진실은 저장소 파일.** 결과물도 결정도 코드와 같은 저장소에서 버전 관리한다. DB 를 붙여도
   원본은 파일 쪽이다. → ADR-0001
4. **검수는 결정적으로.** 게이트 함수에 LLM 호출을 넣지 않는다. 사람과 에이전트가 같은 결과를 봐야 한다.
5. **컨텍스트 로드는 자동.** SessionStart 훅이 처리한다. 사람이 기억해서 시키지 않는다. → ADR-0003
6. **에이전트는 독립 프로세스.** Claude 서브에이전트가 아니다. 나누는 기준은 런타임과 병렬성.
   → [agent-granularity.md](./agent-granularity.md)

도메인 규칙(스키마, 저장 경로, 프레임워크 관례)은 여기가 아니라
`templates/<id>/template.yaml` 의 `rule:` 에 적습니다. 여기 두면 템플릿을 갈아탄 사람에게
남의 회사 사규가 됩니다.

## 왜 이걸 메모리에 두는가

wiki에도 있지만, 메모리 인덱스는 세션 시작 시 **항상** 로드됩니다. wiki 문서는 모델이 열어야 읽힙니다.
가장 자주 위반될 위험이 있는 규칙만 여기에 중복해 둡니다.
