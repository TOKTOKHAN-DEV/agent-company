---
name: wire-sdk
summary: 앱인토스 SDK(권한·저장소·공유·Safe Area 등)를 화면에 붙인다.
when: 기기 기능이나 토스 기능이 필요한 화면을 만들 때.
---

# wire-sdk

SDK 는 `@apps-in-toss/web-framework` 에서 도메인별로 가져온다.

```tsx
import { Device, Storage, Share, Screen, SafeArea } from '@apps-in-toss/web-framework';
```

전체 목록: https://developers-apps-in-toss.toss.im/documentation/sdk/domains-api.md

## 권한이 필요한 기능

**두 가지를 반드시 지킨다.** 둘 다 심사 항목이다.

1. 권한을 요청하기 전에 **왜 필요한지 먼저 알린다**
2. 권한이 **거부돼도 기능이 끝까지 동작한다** (대체 경로를 만든다)

```tsx
// 위치 권한이 거부되면 수동 입력으로 진행한다
const location = await Device.getLocation().catch(() => null);
if (location == null) {
  navigate('/address-manual');
  return;
}
```

`granite.config.ts` 의 `permissions` 에 **실제로 쓰는 것만** 적는다. 쓰지 않는 권한을 요청하면
반려된다.

## 저장소

```tsx
await Storage.setItem('key', value);
const saved = await Storage.getItem('key');
```

"앱을 재시작해도 유지된다" 는 수용 기준이 있으면 여기에 저장한다. 메모리 상태로는 충족하지
못한다.

## 공유

```tsx
await Share.createLink({ /* ... */ });
```

**`intoss://` 만 쓴다.** `intoss-private://` 는 금지이고 preflight 가 error 로 잡는다.

## Safe Area

CSS 의 `env(safe-area-inset-*)` 로 1차 대응이 되어 있다. 런타임 값이 필요하면:

```tsx
const insets = await SafeArea.getSafeAreaInsets();
```

## 화면 닫기

```tsx
Screen.close();
```

첫 화면의 뒤로가기에 연결한다. 하위 화면에서 부르면 사용자가 흐름 중간에 튕겨 나간다.

## 소켓

`wss://` 만 쓴다. `ws://` 는 preflight 가 error 로 잡는다.

## 하지 말아야 할 것

- 브라우저 히스토리를 조작하는 리다이렉트
- `eval` · `new Function` · 원격 코드 로딩
- 다른 앱 설치 유도, 자사 웹으로 보내기

## 완료 확인

```bash
pnpm typecheck
pnpm preflight
```

## 출력

- 붙인 SDK 도메인과 이유
- `granite.config.ts` 에 추가한 권한 (있다면)
- 권한 거부 시 대체 경로
