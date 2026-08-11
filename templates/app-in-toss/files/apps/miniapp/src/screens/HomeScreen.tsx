import { Button, Top } from '@toss/tds-mobile';

import { closeMiniApp } from '../App.tsx';
import { navigate } from '../router.tsx';

/**
 * 진입 화면.
 *
 * 이 화면이 지키는 심사 항목:
 *   - 첫 화면에서 뒤로가기는 미니앱을 닫는다 (`Screen.close()`)
 *   - 모든 화면에 빠져나갈 방법이 분명하다
 *   - CTA 버튼은 눌렀을 때 무슨 일이 일어나는지 드러낸다
 *   - 색·타이포를 직접 정의하지 않고 TDS 컴포넌트를 쓴다
 */
export function HomeScreen(): JSX.Element {
  return (
    <main style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 24 }}>
      {/* Top 은 children 이 아니라 슬롯(title · subtitleBottom)으로 받습니다. */}
      <Top
        title={<Top.TitleParagraph>내 미니앱</Top.TitleParagraph>}
        subtitleBottom={
          <Top.SubtitleParagraph>
            specs/ 에 수용 기준을 쓰고 나서 화면을 만드세요. 명세 없이 구현으로 넘어가면 pnpm
            preflight 가 막습니다.
          </Top.SubtitleParagraph>
        }
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 20px' }}>
        <Button display="block" size="large" onClick={() => navigate('/sample')}>
          예시 화면 열기
        </Button>

        <Button display="block" size="large" variant="weak" onClick={closeMiniApp}>
          미니앱 닫기
        </Button>
      </div>
    </main>
  );
}
