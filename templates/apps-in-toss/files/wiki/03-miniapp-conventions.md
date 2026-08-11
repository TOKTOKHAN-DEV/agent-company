# 03 — 미니앱 규칙

`apps/miniapp` 을 만질 때의 규약입니다. 심사 항목은 `04-review-checklist.md`.

---

## 왜 Vite + React 18 인가

공식 WebView 경로가 Vite 입니다. `ait init` 이 `granite.config.ts` 를 만들고, `ait build` 가
vite 산출물로 `.ait` 아티팩트를 만듭니다.

**`@apps-in-toss/web-framework` v3 기준**입니다. 공식 예제 저장소는 아직 v2 라 다르게 보입니다.

| | v2 (예제 저장소) | v3 (이 템플릿) |
| --- | --- | --- |
| dev | `granite dev` | `vite dev` |
| build | `ait build` | `ait build` |
| config 의 `web.commands` · `outdir` | 있음 | **없음** |
| config 의 `navigationBar` | 없음 | 있음 (`theme: 'light'` 를 여기서 강제) |

v3 config 가 받는 키: `appName` · `brand.primaryColor` · `permissions` · `navigationBar` ·
`webView` · `webBundleDir`. **미니앱 이름·아이콘·스크린샷은 config 가 아니라 콘솔**에서
관리합니다.

**React 18 에 고정된 이유**는 TDS 입니다. `@toss/tds-mobile` 의 peer 가
`react ^16.8.3 || ^17 || ^18` 이고, 비게임 WebView 미니앱은 TDS 사용이 필수입니다.
공식 예제가 React 19 를 쓰는 것은 TDS 를 쓰지 않기 때문입니다.

**Next.js 를 쓰지 않는 이유**는 심사가 CSR·SSG 만 허용하기 때문입니다. App Router 를 쓰더라도
`output: 'export'` 여야 하고, 그러면 서버 컴포넌트·서버 액션·Route Handler 를 못 씁니다.
Next.js 의 값어치가 사라진 상태로 툴체인만 공식 경로에서 벗어납니다.

## 명령

```bash
pnpm dev:miniapp      # vite dev — 개발 서버
pnpm build:miniapp    # ait build — .ait 아티팩트 생성
pnpm preflight        # 심사 사전점검 (출고 게이트)
```

**빌드는 `vite build` 가 아니라 `ait build` 입니다.** vite 산출물만으로는 `.ait` 아티팩트가
되지 않습니다. 배포는 `ait deploy` 지만, **출고는 사람이 콘솔에서** 누릅니다.

## granite.config.ts

`appName` 은 콘솔에 등록한 식별자와 **정확히 같아야** 합니다. 번들 업로드가 이 값으로 붙습니다.
`.env` 의 `TOSS_MINIAPP_NAME` 과도 맞춰야 하고, 어긋나면 preflight 가 error 로 잡습니다.

`permissions` 에는 **실제로 쓰는 것만** 적습니다. 쓰지 않는 권한을 요청하면 반려됩니다.
가능한 값: `clipboard` · `geolocation` · `contacts` · `photos` · `camera` · `microphone`.

`navigationBar.theme` 은 `'light'` 로 둡니다. 심사가 라이트 모드만 허용하고, preflight 가
`'dark'` 를 error 로 잡습니다.

## 라우팅

의존성 없는 해시 라우터가 `src/router.tsx` 에 있습니다.

```tsx
// 화면 추가
// 1. src/screens/<Name>Screen.tsx
// 2. src/App.tsx 의 routes 배열에 등록
const routes: Route[] = [
  { path: '/', element: () => <HomeScreen /> },   // 첫 항목 = 진입 화면 + 폴백
];
```

**라우터를 새로 들이지 않습니다.** 정적 번들이라 서버 rewrite 를 못 쓰고, 심사가 브라우저
히스토리 조작을 금지합니다. 해시 라우팅은 둘 다 피해 갑니다.

`src/App.tsx` 는 모든 `ui-builder` 가 건드리는 파일입니다. 병렬로 돌릴 때는 라우트 등록을
한 명이 몰아서 하세요.

## 스타일

- **TDS 컴포넌트를 씁니다.** 색·타이포를 직접 정의하지 않습니다.
- 레이아웃 여백 정도는 인라인 스타일로 둡니다.
- **라이트 모드만.** `prefers-color-scheme: dark` 를 넣으면 preflight 가 잡습니다.
- Safe Area 는 CSS `env(safe-area-inset-*)` 로 1차 대응돼 있습니다. 런타임 값이 필요하면
  `SafeArea.getSafeAreaInsets()`.

## 화면이 항상 갖춰야 하는 것

- 빈 상태 · 로딩 · 실패 (셋 다 없으면 미완성)
- 실패 화면에는 재시도 수단
- 이탈 경로 (첫 화면은 `Screen.close()`)

## 번들

- 압축 해제 기준 **100MB 이하**
- 큰 에셋은 번들에 넣지 말고 CDN 에서 지연 로딩
- `sourcemap: false` (번들 크기)

preflight 가 `apps/miniapp/dist` 크기를 재고, `dist/index.html` 이 없으면 정적 산출물이
아니라고 판단합니다.

## SDK

```tsx
import { Device, Storage, Share, Screen, SafeArea } from '@apps-in-toss/web-framework';
```

전체 목록: https://developers-apps-in-toss.toss.im/documentation/sdk/domains-api.md

권한이 거부돼도 기능이 끝까지 동작해야 합니다. 대체 경로를 만드세요.

## 테스트

1. `pnpm dev:miniapp` — vite 개발 서버가 뜹니다
2. 샌드박스(테스트) 앱으로 연결합니다
3. 실기기에서 보려면 `vite dev --host` 로 띄우고 같은 네트워크에서 접근합니다

연결 절차는 SDK 버전에 따라 달라집니다. **원문을 보세요**:
https://developers-apps-in-toss.toss.im/development/test/sandbox.md
