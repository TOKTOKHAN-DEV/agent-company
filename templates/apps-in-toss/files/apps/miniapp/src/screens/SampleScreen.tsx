import { Button, Top } from '@toss/tds-mobile';

import { navigate } from '../router.tsx';

/**
 * 두 번째 화면. 명세를 쓰고 나면 이 파일을 지우고 진짜 화면으로 바꾸세요.
 *
 * 여기서 하지 말아야 할 것 (전부 심사 반려 사유입니다):
 *   - 진입하자마자 바텀시트를 자동으로 띄우기
 *   - 다른 앱 설치를 유도하거나 자사 서비스로 보내기
 *   - 2초 안에 반응하지 않는 인터랙션
 */
export function SampleScreen(): JSX.Element {
  return (
    <main style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 24 }}>
      <Top
        title={<Top.TitleParagraph>예시 화면</Top.TitleParagraph>}
        subtitleBottom={
          <Top.SubtitleParagraph>specs/_template.md 를 복사해 명세를 먼저 쓰세요.</Top.SubtitleParagraph>
        }
      />

      <div style={{ padding: '0 20px' }}>
        <Button display="block" size="large" variant="weak" onClick={() => navigate('/')}>
          홈으로
        </Button>
      </div>
    </main>
  );
}
