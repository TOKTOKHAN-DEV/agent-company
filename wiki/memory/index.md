# 장기 메모리 인덱스

> SessionStart 훅이 이 파일을 읽습니다. **한 메모리당 한 줄**을 유지하세요. 내용을 여기에 쓰지 말고 파일로
> 분리한 뒤 링크만 남깁니다.

## 프로젝트 불변 사항

- [project-invariants.md](./long-term/project-invariants.md) — 바꾸려면 ADR이 필요한 5가지 규칙
- [image-generation-policy.md](./long-term/image-generation-policy.md) — 이미지는 Codex imagegen 전용, Claude 생성 금지
- [publish-gate.md](./long-term/publish-gate.md) — 출고는 사람만, 에이전트는 in_review까지
- [agent-granularity.md](./long-term/agent-granularity.md) — 에이전트는 역할이 아니라 런타임·병렬성으로 나눈다 (Claude 서브에이전트 아님)
- [tool-side-effects-not-names.md](./long-term/tool-side-effects-not-names.md) — 도구는 이름이 아니라 부작용으로 판단한다 (바이트 업로드는 에이전트, 버튼은 사람)

## 팀 · 선호

- [user-preferences.md](./long-term/user-preferences.md) — 언어, 커뮤니케이션, 작업 스타일

## 현재 상태

- 활성 단기 메모리: `short-term/` 참조
- 마지막 갱신: 2026-08-25
