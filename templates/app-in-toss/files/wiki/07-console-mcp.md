# 07 — 콘솔 MCP

앱인토스 콘솔 MCP 를 붙이면 콘솔에 들어가지 않고 AI 도구에서 워크스페이스 · 미니앱 · 검수 ·
번들 · 인앱결제 · 인앱광고를 다룰 수 있습니다.

공식 문서: https://developers-apps-in-toss.toss.im/guide/console-mcp.md

---

## 1. 등록

```bash
# Claude Code
claude mcp add --transport http apps-in-toss-console \
  https://mcp.toss.im/adapters/apps-in-toss-console/mcp \
  --client-id mcp-gateway

# Codex
codex mcp add apps-in-toss-console \
    --url https://mcp.toss.im/adapters/apps-in-toss-console/mcp \
    --oauth-client-id mcp-gateway
```

등록 여부는 `pnpm check` 가 확인합니다. 매니페스트(`templates/app-in-toss/template.yaml`)의
`mcp:` 에 선언되어 있어, 미등록이면 경고와 함께 위 명령을 출력합니다.

> `pnpm check` 는 **등록 여부만** 봅니다. 인증까지는 확인하지 않습니다 — 확인하려면 네트워크를
> 타야 하고, 그러면 검사가 결정적이지 않게 됩니다.

## 2. 인증

등록만으로는 동작하지 않습니다. **사람이** 해야 합니다.

1. 새 터미널에서 `claude` 또는 `codex` 실행
2. `/mcp` 입력
3. `apps-in-toss-console` 선택
4. `Authenticate` → Toss SSO + 비즈 로그인
5. 상태가 `Connected` 인지 확인

---

## 에이전트가 쓰는 도구

`release-manager` 가 이 MCP 를 씁니다. **읽기 위주**입니다.

| 도구 | 쓰는 때 |
| --- | --- |
| `miniapp_get_status` | 지금 검수·운영 상태 |
| `review_list` · `review_get` | 진행 중인 검수 |
| `review_get_feedback` | 반려 사유 → 명세의 수용 기준으로 되돌림 |
| `bundle_list` · `bundle_get_live_version` | 라이브 버전 확인 |
| `dashboard_dau` · `dashboard_session` · `dashboard_retention` | 출시 후 지표 |
| `event_log_search` · `event_pageview_stats` | 이벤트 추적 |

## 에이전트가 부르지 않는 도구

**출고와 돈이 걸린 것은 사람이 누릅니다.** 코어 하드 룰 2번입니다.

| 도구 | 왜 |
| --- | --- |
| `review_submit` · `review_cancel` | 검수 신청은 사람의 행위 |
| `bundle_upload` · `bundle_submit_review` · `bundle_rollback` | 출고 · 되돌리기는 사람의 판단 |
| `promotion_money_charge` | 돈이 나감 |
| `push_send_scheduled` | 사용자에게 알림이 나감 |
| `iap_product_change_status` | 판매 시작·중지는 사업 결정 |
| `miniapp_update_icon` · `miniapp_update_screenshots` | **이름과 달리 앱정보 검토를 함께 신청** |
| `miniapp_update_basic_info` · `miniapp_update_category` | 같은 이유 |

이 도구가 필요한 상황이면 에이전트는 **무엇을 왜 눌러야 하는지 정리해서 사람에게 넘깁니다.**

### `miniapp_update_*` 를 조심하는 이유

이름만 보면 값을 바꾸는 도구 같지만, 콘솔 웹의 **"검토 요청" 버튼과 같은 호출**입니다.
불러 놓고 "설정만 바꿨습니다" 라고 보고하면 사실이 아니게 됩니다.

에이전트는 페이로드까지 조립해 `release/` 에 두고 멈춥니다. 사람이 5개 확약 문구를 확인한
뒤 누릅니다 → `wiki/09-store-assets.md`

**이미지 업로드는 다릅니다.** `image_upload_url` + PUT 은 CDN 에 바이트를 올릴 뿐 아무것도
신청하지 않습니다. `asset-maker` 가 여기까지 합니다.

---

## 전체 도구 목록

공식 문서 기준입니다. 갱신될 수 있으니 최신은 위 링크를 보세요.

**워크스페이스 · 미니앱**
`workspace_list` · `workspace_get` · `workspace_create` · `workspace_update` ·
`workspace_members_list` · `miniapp_list` · `miniapp_get` · `miniapp_create` ·
`miniapp_get_status` · `miniapp_update_basic_info` · `miniapp_update_category` ·
`miniapp_update_icon` · `miniapp_update_screenshots` · `miniapp_update_age_rating` ·
`miniapp_update_privacy_policy`

**검수**
`review_list` · `review_get` · `review_submit` · `review_cancel` · `review_get_feedback`

**번들**
`bundle_list` · `bundle_get_live_version` · `bundle_upload` · `bundle_submit_review` ·
`bundle_rollback` · `bundle_set_release_note`

**대시보드 · 분석**
`dashboard_dau` · `dashboard_session` · `dashboard_retention` · `dashboard_conversion` ·
`dashboard_compare_period` · `dashboard_revenue_iap` · `dashboard_revenue_iaa` ·
`dashboard_export_csv`

**이벤트 로그**
`event_log_list` · `event_log_search` · `event_pageview_stats` · `event_act_type_get` ·
`event_act_type_set`

**인앱 결제**
`iap_product_list` · `iap_product_get` · `iap_product_create_inspection` ·
`iap_product_update_inspection` · `iap_product_change_status` · `iap_order_list` ·
`iap_refund_list` · `iap_revenue`

**인앱 광고**
`iaa_ad_unit_group_list` · `iaa_ad_unit_group_get` · `iaa_ad_unit_group_change_status` ·
`iaa_ad_unit_group_delete` · `iaa_mediation_groups` · `iaa_placement_group_list` ·
`iaa_placement_group_get` · `iaa_placement_group_create` · `iaa_placement_group_update` ·
`iaa_dashboard_report` · `iaa_dashboard_report_v2` · `iaa_workspace_dashboard_report_v2` ·
`iaa_settlement_summary` · `iaa_settlement_summary_v2`

**프로모션**
`promotion_list` · `promotion_get` · `promotion_create` · `promotion_modify` ·
`promotion_change_status` · `promotion_money_balance` · `promotion_money_charge` ·
`promotion_money_history` · `promotion_stats` · `promotion_review_comment`

**푸시 알림**
`push_history_list` · `push_stats` · `push_template_list` · `push_template_create` ·
`push_template_update` · `push_target_segment_list` · `push_target_segment_create` ·
`push_send_scheduled` · `push_cancel_scheduled`

**공지 · 기타**
`notice_list` · `notice_get` · `toss_login_get_config` · `toss_login_update_terms`

---

## 다른 템플릿에 MCP 를 붙이려면

매니페스트에 세 줄을 적으면 `pnpm check` 가 검사합니다.

```yaml
mcp: <서버명>=없으면 무엇을 못 하는지
mcp-claude: <서버명>=claude mcp add ...
mcp-codex: <서버명>=codex mcp add ...
```

검사는 설정 파일(`~/.claude.json` · `.mcp.json` · `~/.codex/config.toml`)을 읽습니다.
`scripts/mcp-status.mjs` 참고.
