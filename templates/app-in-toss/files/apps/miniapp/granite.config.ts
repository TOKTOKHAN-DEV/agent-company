import { defineConfig } from '@apps-in-toss/web-framework/config';

/**
 * 미니앱 매니페스트. `ait build` 와 `ait deploy` 가 이 파일을 읽습니다.
 *
 * `appName` 은 콘솔에 등록한 미니앱 식별자와 **정확히 같아야** 합니다.
 * 샌드박스 딥링크(`intoss://<appName>`)와 번들 업로드가 이 값으로 붙습니다.
 * `.env` 의 `TOSS_MINIAPP_NAME` 과도 맞춰야 하고, 어긋나면 preflight 가 잡습니다.
 *
 * 이름·아이콘·스크린샷 같은 스토어 정보는 여기가 아니라 **콘솔**에서 관리합니다
 * (`miniapp_update_basic_info` · `miniapp_update_icon` — wiki/07-console-mcp.md).
 *
 * 문서: https://developers-apps-in-toss.toss.im/ai-vibe-coding/tutorials/webview.md
 */
export default defineConfig({
  appName: 'my-miniapp',
  brand: {
    primaryColor: '#3182F6',
  },
  // 실제로 쓰는 권한만 적으세요. 쓰지 않는 권한을 요청하면 심사에서 반려됩니다.
  // 가능한 값: clipboard · geolocation · contacts · photos · camera · microphone
  permissions: [],
  navigationBar: {
    withBackButton: true,
    withTitle: true,
    // 라이트 모드만 지원합니다. 심사 항목입니다.
    theme: 'light',
  },
});
