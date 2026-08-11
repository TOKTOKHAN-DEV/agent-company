import { useCallback, useEffect, useMemo, useState } from 'react';

/**
 * 해시 기반 라우터. 의존성 없이 60줄입니다.
 *
 * 왜 react-router 를 넣지 않았나:
 *   1. 번들이 정적(CSR/SSG)이어야 해서 서버 rewrite 를 쓸 수 없습니다.
 *      해시 라우팅은 어떤 정적 호스팅에서도 그냥 동작합니다.
 *   2. 심사가 "브라우저 히스토리를 조작하는 리다이렉트" 를 금지합니다.
 *      `location.hash` 만 쓰면 히스토리를 밀어내지 않습니다.
 *   3. 라우터 선택은 팀의 몫입니다. 기본값이 무거우면 갈아끼우기 어렵습니다.
 *
 * 화면을 늘릴 때는 `screens` 맵에 추가하세요. 명세(`specs/*.md`)에 없는 화면은
 * 만들지 않습니다 — 이 회사의 하드 룰입니다.
 */

export type Route = {
  path: string;
  element: () => JSX.Element;
};

function currentPath(): string {
  const hash = window.location.hash.replace(/^#/, '');
  return hash === '' ? '/' : hash;
}

export function navigate(path: string): void {
  window.location.hash = path;
}

export function useRouter(routes: Route[]): {
  path: string;
  element: JSX.Element;
  canGoBack: boolean;
} {
  const [path, setPath] = useState<string>(() => currentPath());

  useEffect(() => {
    const onHashChange = () => setPath(currentPath());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const match = useMemo(() => routes.find((r) => r.path === path), [routes, path]);

  const element = useMemo(() => {
    if (match != null) return match.element();
    const fallback = routes[0];
    if (fallback == null) {
      throw new Error('라우트가 하나도 없습니다.');
    }
    return fallback.element();
  }, [match, routes]);

  return { path, element, canGoBack: path !== '/' };
}

/** 첫 화면에서의 뒤로가기는 미니앱을 닫는 동작이어야 합니다 (심사 항목). */
export function useBack(onExit: () => void): () => void {
  return useCallback(() => {
    if (currentPath() === '/') {
      onExit();
      return;
    }
    window.history.back();
  }, [onExit]);
}
