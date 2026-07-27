import { createBrowserClient, createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

import { requireConfig } from './config.ts';
import type { Database } from './types.ts';

/** 브라우저용 클라이언트. anon 키만 사용하므로 RLS 가 반드시 켜져 있어야 합니다. */
export function createBrowserSupabase() {
  const { url, anonKey } = requireConfig();
  return createBrowserClient<Database>(url, anonKey);
}

export interface CookieAdapter {
  getAll(): { name: string; value: string }[];
  setAll(cookies: { name: string; value: string; options?: Record<string, unknown> }[]): void;
}

/**
 * 서버 컴포넌트 · 서버 액션용 클라이언트.
 * Next.js 의 `cookies()` 를 어댑터로 넘겨 세션을 유지합니다.
 */
export function createServerSupabase(cookies: CookieAdapter) {
  const { url, anonKey } = requireConfig();
  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll: () => cookies.getAll(),
      setAll: (list) => {
        try {
          cookies.setAll(list);
        } catch {
          // 서버 컴포넌트에서는 쿠키를 쓸 수 없습니다. 미들웨어가 갱신을 담당하므로 무시해도 됩니다.
        }
      },
    },
  });
}

/**
 * service role 클라이언트 — RLS 를 우회합니다.
 *
 * **서버에서만** 사용하세요. 이 키가 브라우저 번들에 들어가면 데이터베이스 전체가 노출됩니다.
 * 어드민의 쓰기 작업(서버 액션)에서만 씁니다.
 */
export function createAdminSupabase() {
  const { url, serviceRoleKey } = requireConfig();
  if (!serviceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY 가 없습니다. 어드민 쓰기 작업에는 service role 키가 필요합니다.',
    );
  }
  return createClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
