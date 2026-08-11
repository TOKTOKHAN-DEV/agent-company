# 06 — 결정 히스토리

가장 최근 항목이 위로 옵니다. **되돌리기 어려운 결정**은 여기에 요약하고, 상세 근거는 `decisions/`의 ADR에
남깁니다.

---

## 2026-08-11 — apps-in-toss 템플릿 구현, 매니페스트에 MCP 검사 추가

- **무엇**
  - `apps-in-toss` 를 `planned` → `preview` 로. Vite + React 18 + TDS 스캐폴드, 명세 구조,
    에이전트 3종, 결정적 심사 사전점검(`scripts/preflight.ts`), wiki 4종을 채웠다.
  - 매니페스트에 `mcp:` · `mcp-claude:` · `mcp-codex:` 키를 추가하고 `pnpm check` 가 등록
    여부를 검사하게 했다. 판정은 `scripts/mcp-status.mjs` 가 설정 파일을 읽어서 한다.
- **왜 이 스택인가** — 문서와 심사 기준이 선택지를 좁혔다. 셋 다 조사 결과다.
  - **Next.js 를 안 쓴다.** 사용자 요청은 Next.js App Router 였지만, 심사 체크리스트가
    **CSR·SSG 만 허용**한다. App Router 를 쓰려면 `output: 'export'` 여야 하고 그러면 서버
    컴포넌트·서버 액션·Route Handler 를 못 쓴다. 값어치는 사라지고 툴체인만 공식 경로에서
    벗어나므로 공식 Vite 경로를 택했다.
  - **React 18 고정.** 비게임 WebView 미니앱은 TDS 필수인데 `@toss/tds-mobile` 의 peer 가
    `^16.8.3 || ^17 || ^18` 이다. 공식 예제가 React 19 인 것은 TDS 를 안 쓰기 때문이다.
  - **web-framework v3 기준.** 예제 저장소는 아직 v2 라 `granite dev` 와 config 의
    `web.commands` · `outdir` 를 쓰는데, v3 에서 전부 없어지고 `navigationBar` 가 생겼다.
    타입체크로 확인했다.
- **새 규칙**
  - `preflight` 는 **주석을 걷어내고** 금지 패턴을 검사한다. "eval 을 쓰지 마세요" 같은 주석까지
    error 로 잡으면 규칙을 설명하는 것조차 위반이 되고, 그러면 사람들이 게이트를 무시한다.
  - MCP 검사는 **`claude mcp list` 를 쓰지 않는다.** 그 명령은 헬스체크로 네트워크를 타서
    `pnpm check` 의 결정성을 깬다. 설정 파일만 읽는다.
  - MCP 는 **등록 여부만** 본다. 인증 확인은 네트워크가 필요하므로 사람이 `/mcp` 에서 한다.
  - 콘솔 MCP 의 출고·과금 계열 도구(`review_submit` · `bundle_rollback` ·
    `promotion_money_charge` · `push_send_scheduled` 등)는 **에이전트가 부르지 않는다.**
    코어 하드 룰 2번의 연장이다.
- **영향** — `status: preview` 다. 뼈대는 돌고 빌드·타입체크·게이트가 통과하지만 **실제 심사를
  통과시킨 적이 없다.** 심사 기준은 계속 갱신되므로 제출 전에 원문 확인이 필요하다.
- **되돌리려면** — `templates/apps-in-toss/files/` 를 지우고 매니페스트를 `planned` 로
  되돌리면 된다. `mcp:` 키와 `mcp-status.mjs` 는 코어라 남겨도 무해하다.

---

## 2026-08-07 — 레포명 변경, 정리(prune) 도입, 랜딩을 레포에 편입

- **무엇**
  - `orca-ai-company` → **`agent-company`**. 패키지 스코프는 `@orca/*` → **`@repo/*`** 로,
    레포 이름과 분리했다.
  - `template.sh prune` 추가. 템플릿을 고르고 나면 안 쓰는 카탈로그와 제품 랜딩을 지운다.
  - 랜딩을 `site/index.html` 로 레포에 넣고 Vercel 정적 배포 대상으로 삼았다.
- **왜**
  - "Orca" 는 특정 ADE 이름인데 랜딩은 이미 "모든 ADE" 라고 말하고 있어 어긋났다.
  - 패키지 스코프를 레포명과 묶어 두면 이름을 또 바꿀 때 코드가 흔들린다. `@repo/*` 는
    Turborepo 공식 예제와 next-forge 의 관례이고, 사용자가 안 바꿔도 어색하지 않다.
  - **템플릿을 별도 레포로 쪼개자는 안을 검토했으나 기각했다.** 근거였던 "클론이 무겁다" 가
    사실이 아니었다 — 578M 으로 보이던 것은 전부 gitignore 되는 `.next` 였고, git 이 추적하는
    `templates/` 는 388K 다. 반면 쪼개면 (1) 매니페스트 키와 코어 스크립트의 버전 호환 문제가
    생기고(sed 로 읽으므로 모르는 키는 조용히 무시된다 — 구버전 템플릿이면 검사가 에러 없이
    빠진다), (2) 셋업에 네트워크가 끼어 "두 번 돌려도 같은 상태" 가 깨진다.
    진짜 문제는 무게가 아니라 **안 쓰는 템플릿이 프로젝트에 영구히 남는 것**이었고, 그건
    prune 으로 해결된다.
- **새 규칙**
  - 한 레포가 두 얼굴을 가진다. `.company/PRODUCT` 마커가 있으면 제품 레포이고 prune 이 거부한다.
  - **prune 은 고른 템플릿의 `template.yaml` 을 남긴다.** `check-deps.sh` 의 `verify-*` 와
    `load-context.sh` 의 `rule:` 이 계속 필요하다. 지우면 검사와 하드 룰이 에러 없이 사라진다.
  - 랜딩은 빌드가 없는 정적 HTML 하나로 유지한다. `vercel.json` 은 `site/` 안에 둔다 — 루트에
    두면 prune 이 `site/` 를 지운 뒤에도 남아 사용자 프로젝트의 배포를 깨뜨린다.
- **영향**
  - `scripts/orca-setup.sh` → `scripts/company-setup.sh`, `/orca-setup` → `/company-setup`.
  - `.orca/` → `.company/`, `ORCA_*` 환경 변수 → `COMPANY_*`.
  - `pnpm-lock.yaml` 이 패키지명 변경으로 갱신됨.
  - **GitHub 레포를 실제로 rename 해야 한다.** `raw.githubusercontent.com` 은 리다이렉트하지
    않으므로 INSTALL.md 의 raw URL 과 랜딩의 설치 문구가 rename 전까지 깨진다.
- **되돌리려면** — 치환 목록을 뒤집어 돌리면 된다. 다만 `@repo/*` 는 되돌리지 말 것 — 레포명과
  분리해 둔 것이 이 변경의 요점이다.

---

## 2026-08-07 — 코어와 템플릿을 분리, 블로그를 템플릿 하나로 격하

- **무엇** — 레포를 두 층으로 나눴다. 코어(훅 · 메모리 · 레지스트리 · 런처 · 게이트 패턴 ·
  이미지 정책)는 항상 루트에 있고, 도메인(앱 · 스키마 · 로스터 · 도메인 wiki)은
  `templates/<id>/files/` 에 들어가 `pnpm company-setup` 에서 골라 펼친다.
  블로그는 `blog-autopublish` 라는 템플릿 하나가 됐다.
- **왜**
  - 컨텍스트 유지와 검수 게이트는 **도메인과 무관하게 필요한 것**인데, 스키마 · 앱 · 로스터는
    **무엇을 만드느냐에 따라 완전히 달라진다.** 한 덩어리로 두면 도메인을 바꿀 때 지우면서
    시작해야 했다.
  - `check-deps.sh` 가 `apps/web` 을 박아 두고 있어서, 블로그가 아닌 프로젝트에서는 없는 것을
    없다고 혼내는 상태였다.
- **새 규칙**
  - 코어 스크립트는 도메인 경로를 모른다. `templates/<id>/template.yaml` 매니페스트로만 안다.
  - 도메인 하드 룰은 매니페스트의 `rule:` 에 적고, 세션 시작 시 코어 룰 5개 위에 얹혀 주입된다.
  - 도메인 wiki 문서는 `templates/<id>/files/wiki/` 에 둔다.
  - 매니페스트를 읽는 곳은 `template.sh` · `check-deps.sh` · `load-context.sh` · `company-setup.sh`
    넷뿐이다. 새 키를 추가하면 그중 하나를 함께 고쳐야 한다.
- **영향**
  - `pnpm setup` → `pnpm company-setup`. `setup` 은 pnpm 내장 명령이라 스크립트가 가려지고
    있었다. 이번에 같이 해소.
  - `pnpm imagegen` 이 코어에서 빠지고 `blog-autopublish` 로 이동. `codex-imagegen.sh` 가
    `content/posts/<slug>.md` 와 `scripts/set-cover.mjs` 에 의존하기 때문. **정책은 코어로
    남는다** — PreToolUse 훅은 템플릿과 무관하게 계속 차단한다.
  - 하드 룰 문구를 도메인 중립으로 다시 씀 ("발행" → "출고", "콘텐츠의 진실은 파일" →
    "진실은 저장소 파일").
  - `docs/i18n/` 의 영어 외 7개 번역은 이전 구조를 설명하고 있어 상단에 안내를 붙였다.
    재생성 필요.
- **되돌리려면** — `templates/blog-autopublish/files/` 를 루트로 옮기고 매니페스트의 `script:`
  를 `package.json` 에 병합하면 이전 상태다. 다만 되돌리기 전에 "이 레포로 블로그 말고 다른
  것을 만들 일이 정말 없는가"를 먼저 확인할 것.

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
