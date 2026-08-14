# 06 — 결정 히스토리

가장 최근 항목이 위로 옵니다. **되돌리기 어려운 결정**은 여기에 요약하고, 상세 근거는 `decisions/`의 ADR에
남깁니다.

---

## 2026-08-14 — 인계(intake)를 코어에, 에셋 에이전트를 app-in-toss 에

- **무엇**
  - 코어에 `pnpm intake <zip · tar.gz · 폴더>` 추가. `inbox/<이름>/` 에 풀고
    목차(`INVENTORY.md`)를 만든다. `inbox/` 는 gitignore.
  - `app-in-toss` 에 `asset-maker` (codex) 추가. 로고·썸네일·IAP 아이콘을 만들고
    콘솔에 올린다. `pnpm assets` · `pnpm imagegen` 이 함께 들어왔다.
- **왜 인계가 코어인가**
  남의 워크스페이스에서 뭔가를 받는 일은 도메인과 무관하게 생긴다. blog 라면 초안 뭉치,
  app-in-toss 라면 옮겨올 기존 서비스. 템플릿마다 따로 만들면 세 번 만들게 된다.
  대신 **도메인 지식은 스킬로** 갈랐다 — `spec-writer/from-intake` 는 "SSR 은 못 옮긴다"를
  알고, `asset-maker/from-intake` 는 "600×600 보다 작은 로고는 못 쓴다"를 안다.
- **왜 `inbox/` 를 버전 관리하지 않는가**
  하드 룰 3번은 "진실은 저장소 파일" 이지 "받은 것을 다 넣는다"가 아니다. 받은 zip 은
  재료다. 남의 코드와 `.env` 가 통째로 커밋되는 것을 막는 효과도 있다.
  대신 **에이전트가 근거를 인용할 때 경로만 적지 않고 내용을 옮겨 적도록** 스킬에 못박았다 —
  `inbox/` 가 없는 사람에게 경로는 빈 참조다.
- **왜 asset-maker 가 별도 에이전트인가**
  에이전트를 늘리는 기준은 역할이 아니라 런타임과 병렬성이다. 이미지 생성 경로가 codex
  뿐이라(하드 룰 1) claude 에이전트가 대신할 수 없다. 쓰기 범위(`assets/`)가 앱 코드와
  겹치지 않아 화면 작업과 동시에 돈다. release-manager 도 codex 지만 쓰는 곳이 다르다.
- **왜 에셋에 결정적 게이트를 붙였나**
  콘솔은 리사이즈도 크롭도 하지 않고 **1px 만 달라도 거부한다.** 그런데 거부는 업로드가
  아니라 그 URL 을 쓰는 `miniapp_update_*` 에서 일어나고, 그건 검토 요청과 같이 나가는
  호출이라 실패를 늦게 안다. 반려되면 영업일 3일이다. `scripts/asset-spec.ts` 를
  `pnpm assets` 와 `pnpm preflight` 가 함께 읽어 판정이 갈리지 않게 했다.
- **스크린샷은 생성하지 않기로 했다.** 실제 화면이어야 한다. `imagegen --kind screenshot` 은
  거부하고 찍는 방법을 안내한다. 규격 맞추기(`assets fit`)만 돕는다.
- **`miniapp_update_*` 를 금지 목록에 넣었다.** 이름은 값을 바꾸는 것처럼 보이지만 실제로는
  앱정보 검토 요청이 함께 나간다. 반면 `image_upload_url` + PUT 은 아무것도 신청하지 않아
  에이전트가 해도 된다 — **바이트를 올리는 것과 버튼을 누르는 것의 경계**를 여기에 그었다.
- **영향** — 코어: `scripts/intake.sh` · `scripts/intake-inventory.mjs` · `package.json` ·
  `.gitignore` · README · CLAUDE.md · `wiki/01`. 템플릿: `agents/asset-maker/` ·
  `scripts/{asset-spec,assets}.ts` · `scripts/codex-imagegen.sh` · `assets/` ·
  `wiki/09-store-assets.md` · 매니페스트(`script:` 2개 · `rule:` 3개).
- **되돌리려면** — 에셋 쪽은 매니페스트에서 `script:` 와 `rule:` 을 빼고 registry 에서
  `asset-maker` 를 지우면 된다(`preflight.ts` 의 import 도 함께). 인계는 `package.json` 의
  `intake` 키를 빼면 죽는다. 다만 되돌리기 전에 확인할 것 — 에셋 규격 검사를 빼면
  **반려를 3일 뒤에 알게 된다.**

---

## 2026-08-12 — 정리(prune)를 셋업에 편입, 템플릿 이름을 blog · blank 로

- **무엇**
  - `pnpm company-setup` 이 템플릿을 적용하면 **정리까지 바로 진행**한다. 더 이상 묻지 않는다.
  - `blog-autopublish` → `blog`, `bare` → `blank`. 매니페스트에 `order:` 를 추가해 목록
    순서를 정하고 빈 템플릿을 맨 끝(`order: 90`)에 뒀다.
- **왜 — prune 이 도달 불가능한 코드였다**
  원인이 둘 겹쳐 있었고 둘 다 우리가 만든 것이다.
  1. `.company/PRODUCT` 를 **커밋했다.** 이 마커가 저장소에 들어가 있으니 `git clone` 한
     모든 사람이 갖게 되고, `company-setup` 의 `[ ! -f .company/PRODUCT ]` 가 항상 거짓이라
     정리 블록이 통째로 건너뛰어졌다. INSTALL.md 가 안내하는 설치 경로가 clone 이라
     **모든 사용자가 100% 이 경로로 막혔다.**
  2. `/company-setup` 스킬이 `--no-prune` 을 항상 붙였다. 슬래시 커맨드로 설치해도 막혔다.

  마커는 이제 **gitignore** 한다. 유지보수자의 로컬 작업 사본에만 두고 배포하지 않는다.
  제품 레포에서 실수로 지워도 `templates/` 와 `site/` 는 git 추적 파일이라 되돌릴 수 있다.
- **왜 — 묻지 않기로 했나**
  확인 질문은 tty 를 요구해서 비대화형 설치에서 조용히 건너뛰어진다. "조용히 아무것도 안 함"이
  가장 나쁜 결과다. 회사를 고르는 행위 자체가 이미 의사 표시이므로 묻지 않고 진행하고,
  남기려면 `--no-prune` 을 쓴다.
- **왜 — 이름을 바꿨나**
  `bare` 가 무슨 뜻인지 바로 읽히지 않는다는 지적. `blank` 로 바꾸고 설명도
  "사업 없는 조직" 에서 "빈 템플릿. 코어만 있고 로스터와 게이트는 직접 채웁니다" 로 고쳤다.
  `blog-autopublish` 도 `blog` 로 줄였다.
- **새 규칙** — 목록 순서는 알파벳이 아니라 매니페스트의 `order:` 가 정한다. 알파벳에 맡기면
  `app-in-toss · blank · blog` 가 되어 빈 템플릿이 가운데로 온다.
- **영향**
  - 랜딩의 app-in-toss 카드가 아직 "Granite 런타임 · 작업 중" 이라고 하고 있어 함께 고쳤다.
    실제 구현은 WebView(Vite · React · TDS)이고 상태는 preview 다.
  - `--prune` 플래그는 남겼지만 이제 기본값이라 붙일 일이 없다.
- **되돌리려면** — `company-setup.sh` 의 3-b 블록을 묻는 방식으로 되돌리면 된다. 다만
  되돌리기 전에 "비대화형에서 조용히 건너뛰어도 괜찮은가"를 먼저 답할 것.

---

## 2026-08-11 — app-in-toss 템플릿 구현, 매니페스트에 MCP 검사 추가

- **무엇**
  - `app-in-toss` 를 `planned` → `preview` 로. Vite + React 18 + TDS 스캐폴드, 명세 구조,
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
- **되돌리려면** — `templates/app-in-toss/files/` 를 지우고 매니페스트를 `planned` 로
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
  블로그는 `blog` 라는 템플릿 하나가 됐다.
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
  - `pnpm imagegen` 이 코어에서 빠지고 `blog` 로 이동. `codex-imagegen.sh` 가
    `content/posts/<slug>.md` 와 `scripts/set-cover.mjs` 에 의존하기 때문. **정책은 코어로
    남는다** — PreToolUse 훅은 템플릿과 무관하게 계속 차단한다.
  - 하드 룰 문구를 도메인 중립으로 다시 씀 ("발행" → "출고", "콘텐츠의 진실은 파일" →
    "진실은 저장소 파일").
  - `docs/i18n/` 의 영어 외 7개 번역은 이전 구조를 설명하고 있어 상단에 안내를 붙였다.
    재생성 필요.
- **되돌리려면** — `templates/blog/files/` 를 루트로 옮기고 매니페스트의 `script:`
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
