---
name: build-screen
summary: 명세의 화면 하나를 TDS 로 구현하고 라우트에 등록한다.
when: 명세가 확정된 뒤 화면을 만들 때.
---

# build-screen

## 1. 명세를 연다

```bash
ls specs/
```

만들 화면이 「화면」 표에 있는지, 「수용 기준」에 관련 항목이 있는지 확인한다.
**없으면 만들지 않는다.** `spec-writer` 가 먼저 필요하다고 보고한다.

## 2. 화면 파일을 만든다

`apps/miniapp/src/screens/<Name>Screen.tsx`.

```tsx
import { Button, Text } from '@toss/tds-mobile';

import { navigate } from '../router.tsx';

export function <Name>Screen(): JSX.Element {
  return (
    <main style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 제목 · 본문 · 액션 */}
    </main>
  );
}
```

레이아웃 여백 정도는 인라인 스타일로 두되, **색·타이포·컴포넌트는 TDS** 를 쓴다.
`Text` 의 `typography` 와 `color`, `Button` 의 `size` 와 `style` 을 쓰고 직접 색을 넣지 않는다.

## 3. 세 가지 상태를 만든다

빈 상태 · 로딩 · 실패. 명세에 적힌 문구를 그대로 쓴다.

```tsx
if (isLoading) return <LoadingView />;
if (error != null) return <ErrorView onRetry={retry} />;
if (items.length === 0) return <EmptyView />;
```

실패 화면에는 **재시도 수단**이 있어야 한다. "오류가 발생했습니다" 만 띄우고 끝내지 않는다.

## 4. 라우트에 등록한다

`apps/miniapp/src/App.tsx` 의 `routes` 배열에 추가한다.

```tsx
const routes: Route[] = [
  { path: '/', element: () => <HomeScreen /> },
  { path: '/<path>', element: () => <<Name>Screen /> },
];
```

**첫 항목이 진입 화면이자 폴백이다.** 순서를 바꾸지 않는다.

여러 `ui-builder` 가 동시에 돌고 있다면 이 파일에서 충돌한다. 라우트 등록만 한 명이 몰아서
하거나 순서를 정한다.

## 5. 이탈 경로를 확인한다

- 하위 화면이면 → 홈으로 돌아가는 수단
- 첫 화면이면 → `Screen.close()` 로 미니앱을 닫는 수단

```tsx
import { closeMiniApp } from '../App.tsx';
```

## 완료 확인

```bash
pnpm typecheck
pnpm preflight
```

`tds` · `light-only` · `no-eval` 규칙에 걸리면 고치고 다시 돌린다.

## 출력

- 만든 화면과 경로
- 충족한 수용 기준 (명세의 체크박스 기준)
- 사람이 눈으로 봐야 하는 것 (2초 반응, 실기기 레이아웃 등)
