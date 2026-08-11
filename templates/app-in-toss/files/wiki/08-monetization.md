# 08 — 수익화

인앱 결제 · 인앱 광고 · 토스페이. **셋 다 심사 항목이 따로 붙습니다.**

공식 문서: https://developers-apps-in-toss.toss.im/guide/monetization.md

---

## 무엇을 고를 것인가

| | 인앱 결제 (IAP) | 인앱 광고 (IAA) | 토스페이 |
| --- | --- | --- | --- |
| 파는 것 | 디지털 재화·구독 | 없음 (노출로 수익) | 실물·서비스 |
| 정산 | 토스 정산 | 토스 정산 | 가맹점 정산 |
| 심사 부담 | 높음 (상품별 검수) | 중간 | 높음 |

디지털 재화는 IAP, 실물은 토스페이입니다. 섞어 쓰면 심사에서 걸립니다.

---

## 인앱 결제

```tsx
import { IAP } from '@apps-in-toss/web-framework';

const products = await IAP.getProductItemList();
const order = await IAP.createOneTimePurchaseOrder({ /* ... */ });
// 지급이 끝나면 반드시 완료 처리한다
await IAP.completeProductGrant({ /* ... */ });
```

구독은 `createSubscriptionPurchaseOrder` · `getSubscriptionInfo`.

**미지급 주문을 반드시 처리하세요.** 앱이 죽거나 네트워크가 끊기면 결제는 됐는데 지급이 안 된
주문이 남습니다.

```tsx
const pending = await IAP.getPendingOrders();
```

### 심사 항목

- [ ] 결제 중 배경음이 멈춘다
- [ ] 주문 금액과 결제창 금액이 일치한다
- [ ] 취소하면 주문 화면으로 돌아온다
- [ ] 실패 사유가 사용자에게 전달된다
- [ ] 환불이 정상 처리된다
- [ ] 구매 내역을 볼 수 있다
- [ ] 기기를 바꿔도 데이터가 유지된다

상품은 콘솔에서 **개별 검수**를 받습니다 (`iap_product_create_inspection`). 앱 검수와 별개라
상품이 통과하지 않으면 판매가 시작되지 않습니다.

---

## 인앱 광고

```tsx
import { TossAds } from '@apps-in-toss/web-framework';

// 반드시 미리 로드한다 — 실시간 로딩은 반려 사유다
await TossAds.loadFullScreenAd();
await TossAds.showFullScreenAd();
```

배너는 웹과 RN 이 다릅니다. WebView 는 웹 배너를 씁니다.

### 심사 항목

- [ ] **미리 로드한다** (실시간 로딩 금지)
- [ ] 광고 재생 중 배경음이 멈춘다
- [ ] 광고가 예기치 않게 뜨지 않는다
- [ ] 광고 종료 후 정상 복귀한다
- [ ] 리워드 광고가 보상을 정상 지급한다
- [ ] 배너가 상·중·하 적절한 위치에 있다
- [ ] **배너는 스크롤 가능한 화면에만 표시한다**
- [ ] **인트로·로딩·컷신·팝업 같은 임시 화면에 넣지 않는다**

마지막 항목이 자주 걸립니다. "로딩 중에 광고를 보여주자" 는 반려됩니다.

---

## 토스페이

```tsx
import { TossPay } from '@apps-in-toss/web-framework';

await TossPay.authorize({ /* ... */ });
```

**토스페이가 유일한 결제 수단이어야 합니다.** 다른 PG 를 함께 붙이면 반려됩니다.

### 심사 항목

- [ ] 결제 중 배경음이 멈춘다
- [ ] 금액이 결제창과 일치한다
- [ ] 실패 메시지가 원인을 알려준다
- [ ] 결제 전 취소 시 이전 화면으로 돌아온다
- [ ] 결제 중 취소 시 주문 화면으로 돌아온다

---

## 지표 확인

콘솔 MCP 로 조회합니다 (`07-console-mcp.md`).

```
dashboard_revenue_iap      인앱 결제 매출
dashboard_revenue_iaa      인앱 광고 매출
iap_order_list             주문 내역
iap_refund_list            환불 요청
iaa_settlement_summary_v2  광고 정산 요약
```

**`iap_product_change_status` 는 에이전트가 부르지 않습니다.** 판매 시작·중지는 사업 결정이고
사람이 누릅니다.

---

## 명세에 반영하기

수익화를 붙이는 기능은 `specs/<기능>.md` 의 「심사 관련」에 해당 항목을 옮겨 적으세요.
`spec-writer` 가 이 문서를 보고 씁니다.

서버 연동(주문 검증·정산)은 서버 API 문서를 따로 보세요:
https://developers-apps-in-toss.toss.im/documentation/api/iap.md
