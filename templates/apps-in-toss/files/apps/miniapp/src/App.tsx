import { Screen } from '@apps-in-toss/web-framework';

import { HomeScreen } from './screens/HomeScreen.tsx';
import { SampleScreen } from './screens/SampleScreen.tsx';
import { useRouter, type Route } from './router.tsx';

/**
 * 화면 목록. 명세(`specs/*.md`)에 수용 기준이 있는 화면만 등록합니다.
 * 첫 항목이 진입 화면이자 폴백입니다.
 */
const routes: Route[] = [
  { path: '/', element: () => <HomeScreen /> },
  { path: '/sample', element: () => <SampleScreen /> },
];

export function App(): JSX.Element {
  const { element } = useRouter(routes);
  return element;
}

/**
 * 미니앱을 닫습니다. 첫 화면의 뒤로가기는 닫기여야 한다는 심사 항목 때문에
 * 화면 쪽에서 이 함수를 씁니다.
 */
export function closeMiniApp(): void {
  Screen.close();
}
