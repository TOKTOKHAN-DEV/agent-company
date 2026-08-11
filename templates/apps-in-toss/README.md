# apps-in-toss

토스 앱 안에서 도는 **WebView 미니앱**. 명세 → 화면 → 심사 사전점검까지 가는 회사입니다.

```bash
pnpm template apply apps-in-toss
pnpm install
pnpm dev:miniapp        # vite 개발 서버 (샌드박스 연결은 wiki/03 참고)
```

| | |
| --- | --- |
| 상태 | `preview` — 뼈대는 돌지만 **실제 심사를 통과시킨 적이 없습니다** |
| 만드는 것 | 미니앱 · 심사 사전점검 |
| 로스터 | `spec-writer` (claude·opus) · `ui-builder` (claude·sonnet) · `release-manager` (codex) |
| 게이트 | `pnpm preflight` → 사람이 콘솔에서 검수 신청 |
| 추가되는 스크립트 | `dev:miniapp` · `build:miniapp` · `preflight` |
| MCP | `apps-in-toss-console` |

---

## 스택이 이렇게 정해진 이유

공식 문서와 심사 기준이 선택지를 좁힙니다. 셋 다 근거가 있습니다.

**Vite + React** — 공식 WebView 경로입니다. `ait init` 이 `granite.config.ts` 를 만들고,
`ait build` 가 vite 산출물로 `.ait` 아티팩트를 만듭니다.

> `@apps-in-toss/web-framework` **v3 기준**으로 맞춰져 있습니다. 공식 예제 저장소는 아직
> v2(`^2.10.6`)라 다르게 보입니다 — v2 의 `granite dev` 명령과 `granite.config.ts` 의
> `web.commands` · `outdir` 는 v3 에서 없어졌고, dev 는 평범한 `vite dev` 입니다.
> v3 config 는 `appName` · `brand.primaryColor` · `permissions` · `navigationBar` · `webView` ·
> `webBundleDir` 만 받습니다.

**React 18 고정** — `@toss/tds-mobile` 의 peer 가 `^16.8.3 || ^17 || ^18` 입니다. 비게임
WebView 미니앱은 **TDS 사용이 필수**라 여기에 묶입니다. 공식 예제가 React 19 인 것은 TDS 를
쓰지 않기 때문입니다.

**Next.js 아님** — 심사가 **CSR·SSG 만 허용**합니다. App Router 를 쓰려면 `output: 'export'`
여야 하고, 그러면 서버 컴포넌트·서버 액션·Route Handler 를 못 씁니다. Next.js 의 값어치는
사라지는데 툴체인만 공식 경로에서 벗어납니다.

---

## 펼쳐지는 것

```
apps/miniapp/          Vite + React 18 + TDS
├── granite.config.ts  미니앱 매니페스트 (appName · 권한 · 빌드 명령)
├── index.html         확대 차단 · 라이트 모드 meta
└── src/
    ├── router.tsx     의존성 없는 해시 라우터
    ├── App.tsx        라우트 등록 (첫 항목 = 진입 화면)
    └── screens/       화면
specs/                 기능 명세 — 화면보다 먼저 쓴다
scripts/preflight.ts   심사 사전점검 (출고 게이트)
agents/                spec-writer · ui-builder · release-manager
wiki/03,04,07,08       미니앱 규칙 · 심사 체크리스트 · 콘솔 MCP · 수익화
```

---

## 이 회사의 하드 룰

매니페스트의 `rule:` 에 있고 세션 시작마다 코어 룰 위에 주입됩니다.

1. **SSR 을 쓰지 않는다.** 심사가 CSR·SSG 만 허용한다.
2. **명세에 없는 화면을 만들지 않는다.** 수용 기준이 먼저다.
3. **TDS 를 쓴다.** 자체 디자인 시스템으로 대체하지 않는다.
4. **라이트 모드만.** 다크 모드 분기를 넣지 않는다.
5. **`eval` 금지.** 심사에서 바로 반려된다.
6. **`wss://` 만, 공유는 `intoss://` 만.**
7. **검수 신청과 출시 버튼은 사람이 누른다.**

---

## 파이프라인

```
spec-writer (opus)          ui-builder (sonnet)        release-manager (codex)   사람
──────────────────          ───────────────────        ───────────────────────   ────
write-spec  →  review-spec  →  build-screen  →  wire-sdk  →  run-preflight   →  콘솔 검수 신청
     ↓                              ↑                            ↓                    ↓
specs/<기능>.md              화면마다 병렬 가능           check-console          출시 버튼
```

```bash
pnpm agent spec-writer "포인트 적립 화면"
pnpm agent ui-builder "포인트 적립 화면"      # 화면마다 병렬로 띄울 수 있음
pnpm agent release-manager "v0.2 심사 준비"
```

### 왜 셋인가

역할이 아니라 **런타임과 병렬성** 기준입니다.

- `spec-writer` 는 기능 하나의 맥락을 통째로 쥐고 판단합니다 (opus)
- `ui-builder` 는 명세 확정 후 **화면마다 따로** 돌 수 있습니다. 서로 다른
  `src/screens/*.tsx` 를 건드리므로 진짜 병렬입니다 (sonnet)
- `release-manager` 는 **런타임이 다릅니다** (codex)

단, `src/App.tsx` 의 라우트 배열은 모두가 건드립니다. 병렬로 돌릴 때는 등록을 한 명이
몰아서 하세요.

---

## 게이트

```bash
pnpm build:miniapp && pnpm preflight
```

`preflight` 는 심사 체크리스트 중 **기계로 판정 가능한 것만** 봅니다. error 1개면 종료 코드 1
이라 CI 게이트로 그대로 씁니다.

| 잡는 것 | 규칙 |
| --- | --- |
| `eval` · `new Function` | `no-eval` |
| `ws://` | `wss-only` |
| `intoss-private://` | `share-scheme` |
| 다크 모드 분기 | `light-only` |
| TDS 미사용 | `tds` |
| `user-scalable=no` 누락 | `no-zoom` |
| appName 기본값 · `.env` 불일치 | `config` |
| 개인정보처리방침 URL 없음 | `privacy` |
| 수용 기준 없는 명세 | `specs` |
| 번들 100MB 초과 · 비정적 산출물 | `bundle-size` · `static-only` |

**통과했다고 심사를 통과하는 게 아닙니다.** "2초 안에 반응하는가" 같은 항목은 사람이 실기기에서
봐야 합니다 → `wiki/04-review-checklist.md`

---

## 콘솔 MCP

```bash
claude mcp add --transport http apps-in-toss-console \
  https://mcp.toss.im/adapters/apps-in-toss-console/mcp \
  --client-id mcp-gateway
```

`pnpm check` 가 등록 여부를 확인하고, 미등록이면 위 명령을 출력합니다. **인증(Toss SSO +
비즈 로그인)은 사람이** `/mcp` 에서 합니다.

`release-manager` 가 검수 상태·번들·반려 사유·지표를 조회합니다. `review_submit` 이나 출시
계열 도구는 **부르지 않습니다** → `wiki/07-console-mcp.md`

---

## 시작하기 전에

1. 콘솔에서 워크스페이스와 미니앱을 만듭니다 (MCP 로도 가능: `miniapp_create`)
2. `granite.config.ts` 의 `appName` 을 콘솔 식별자로 바꿉니다
3. `.env` 의 `TOSS_MINIAPP_NAME` 을 같은 값으로 맞춥니다
4. `TOSS_PRIVACY_POLICY_URL` 을 채웁니다 (없으면 preflight 가 막습니다)
5. `pnpm agent spec-writer "<첫 기능>"`

> **심사 기준은 계속 갱신됩니다.** 제출 전에 원문을 다시 확인하세요.
> https://developers-apps-in-toss.toss.im/checklist/app-nongame.md
