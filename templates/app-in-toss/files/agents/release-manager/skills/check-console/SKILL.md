---
name: check-console
summary: 콘솔 MCP 로 검수 상태·번들·반려 사유를 조회한다.
when: 검수 진행 상황을 확인할 때, 반려 사유를 명세로 되돌릴 때, 출시 후 지표를 볼 때.
---

# check-console

## 준비

```bash
pnpm check      # "MCP: apps-in-toss-console" 항목 확인
```

미등록이면 출력된 명령으로 등록한다. 등록 뒤 **인증은 사람이** 한다 —
`/mcp` → `apps-in-toss-console` → Authenticate → Toss SSO + 비즈 로그인 → `Connected` 확인.

MCP 가 없으면 이 스킬을 건너뛰고 사람에게 콘솔에서 확인해 달라고 요청한다.
**콘솔 정보를 추측해서 보고하지 않는다.**

## 상태 확인

```
miniapp_get_status      지금 검수·운영 상태
review_list             진행 중인 검수
bundle_get_live_version 라이브 버전
```

보고할 때 **언제 조회한 값인지** 함께 적는다. 콘솔 상태는 사람이 버튼을 누르면 바뀐다.

## 반려 사유를 명세로 되돌리기

```
review_get_feedback
```

반려 사유를 받으면:

1. `release/<버전>.md` 에 원문 그대로 기록한다
2. 어느 명세의 수용 기준으로 들어가야 하는지 판단한다
3. **`spec-writer` 에 넘긴다** — 직접 명세를 고치지 않는다

같은 이유로 두 번 반려되지 않게 하는 유일한 방법은 수용 기준에 넣는 것이다.

## 출시 후

```
dashboard_dau           일간 활성 유저
dashboard_session       세션 수·길이
dashboard_retention     리텐션
event_log_search        특정 이벤트 추적
```

수익화를 붙였다면 `dashboard_revenue_iap` · `dashboard_revenue_iaa`.

## 부르지 않는 도구

| 도구 | 왜 |
| --- | --- |
| `review_submit` · `review_cancel` | 검수 신청은 사람의 행위 |
| `bundle_rollback` | 되돌리기는 사람의 판단 |
| 출시 계열 | 출고 버튼은 사람이 누른다 |
| `promotion_money_charge` | 돈이 나간다 |
| `push_send_scheduled` | 사용자에게 알림이 나간다 |

이 도구들이 필요한 상황이면 **무엇을 왜 눌러야 하는지 정리해서 사람에게 넘긴다.**

## 출력

- 조회한 값과 조회 시각
- 반려 사유가 있으면 원문 + 넘길 곳
- 사람이 눌러야 하는 버튼이 있으면 무엇을 왜
