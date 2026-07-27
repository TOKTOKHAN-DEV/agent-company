# 06 — 결정 히스토리

가장 최근 항목이 위로 옵니다. **되돌리기 어려운 결정**은 여기에 요약하고, 상세 근거는 `decisions/`의 ADR에
남깁니다.

---

## 2026-07-28 — 에이전트를 독립 프로세스로 재편, 8개 → 2개

- **무엇** — `.claude/agents/`의 Claude 서브에이전트 8개를 폐기하고, 자기 런타임으로 도는 독립 프로세스
  2개(`blog-writer`/claude·opus, `image-maker`/codex)로 재편.
  각 에이전트는 `agents/<id>/AGENT.md` + `skills/`를 갖고, `scripts/run-agent.sh`가 띄운다.
- **왜**
  - Orca는 에이전트를 **멀티 터미널의 별도 프로세스**로 굴린다. 서브에이전트는 한 Claude 세션 안에서만
    위임되므로 이 실행 모델과 맞지 않았다.
  - 이미지 에이전트는 codex 런타임이어야 한다(ADR-0002). Claude 서브에이전트로는 **표현 자체가 불가능**했다.
  - 8개는 과했다. 콘텐츠 파이프라인 네 단계는 모두 같은 파일을 순차로 건드려 병렬 실행이 불가능하므로
    프로세스를 나눌 이유가 없었다. 단계는 **스킬**로 분리했다.
- **새 기준** — 에이전트를 나누는 근거는 역할이 아니라 **런타임과 병렬성**이다. 기존 에이전트가 할 수
  있는 일이면 에이전트 대신 스킬을 추가한다.
- **영향** — `.claude/agents/` 삭제. `/write-post`·`/generate-image` 슬래시 커맨드는 에이전트 스킬로
  흡수되어 삭제. `.claude/skills/`에는 사람용 커맨드 3개만 남음. `check-deps.sh`의 정합성 검사가
  새 레이아웃(AGENT.md + skills/ + 런타임 유효성)을 검사하도록 교체.
- **되돌리려면** — registry.yaml이 단일 진실 공급원이므로 항목을 늘리고 `/create-agent`로 파일을
  생성하면 된다. 다만 되돌리기 전에 "그 단계가 정말 병렬로 도는가"를 먼저 확인할 것.

---

## 2026-07-27 — 템플릿 초기 구축

- 모노레포를 pnpm workspaces + Turborepo로 구성. Next.js 16 App Router, React 19, Tailwind 4.
- 콘텐츠 저장소로 DB 대신 마크다운 파일 선택 → [ADR-0001](./decisions/ADR-0001-file-based-content.md)
- 이미지 생성을 Codex `imagegen`으로 단일화하고 Claude 이미지 합성을 금지 →
  [ADR-0002](./decisions/ADR-0002-codex-only-image-generation.md)
- 컨텍스트 소실 대응으로 SessionStart 훅 + 2단 메모리 도입 →
  [ADR-0003](./decisions/ADR-0003-session-context-loading.md)
- 발행 게이트를 결정적 규칙 함수(`auditPost`)로 구현. 모델 판단을 게이트에 넣지 않기로 결정.
- `apps/admin`을 클라이언트 상태 없이 서버 액션 기반 폼으로 구현. 운영 도구에 SPA 복잡도가 불필요하다고 판단.

---

<!--
새 항목 템플릿:

## YYYY-MM-DD — 제목

- 무엇을 결정했나
- 왜 (대안과 트레이드오프)
- 영향받는 곳
- 되돌리려면 무엇을 해야 하나
-->
