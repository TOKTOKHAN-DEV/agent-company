/**
 * Supabase 설정 감지.
 *
 * 이 템플릿은 **키가 없는 상태로도 완전히 동작**해야 합니다 (데모 상태).
 * 키가 채워지고 마이그레이션이 끝나면 그때 Supabase 드라이버가 활성화됩니다.
 *
 * 따라서 여기서는 절대 throw 하지 않습니다. 설정 여부를 boolean 으로만 알려주고,
 * 실제 클라이언트 생성 시점에만 오류를 냅니다.
 */

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  /** 서버 전용. 브라우저 번들에 절대 들어가면 안 됩니다. */
  serviceRoleKey?: string;
  /** 이미지 업로드용 스토리지 버킷 이름. */
  bucket: string;
}

function env(key: string): string | undefined {
  const value = process.env[key];
  return value && value.trim() !== '' ? value.trim() : undefined;
}

/** 브라우저·서버 양쪽에서 읽을 수 있는 공개 설정. */
export function getPublicConfig(): { url?: string; anonKey?: string; bucket: string } {
  return {
    url: env('NEXT_PUBLIC_SUPABASE_URL'),
    anonKey: env('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    bucket: env('NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET') ?? 'post-images',
  };
}

/**
 * Supabase 를 쓸 수 있는 상태인가.
 *
 * 이 값이 false 면 파일 기반 드라이버가 계속 쓰입니다. 앱은 정상 동작합니다.
 */
export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getPublicConfig();
  return Boolean(url && anonKey);
}

/** 서버에서 쓰기 작업까지 가능한 상태인가 (service role 키 존재). */
export function isSupabaseWritable(): boolean {
  return isSupabaseConfigured() && Boolean(env('SUPABASE_SERVICE_ROLE_KEY'));
}

/**
 * 설정을 가져옵니다. 설정되지 않았으면 무엇이 빠졌는지 알려주는 오류를 던집니다.
 * 호출 전에 `isSupabaseConfigured()` 로 반드시 먼저 확인하세요.
 */
export function requireConfig(): SupabaseConfig {
  const { url, anonKey, bucket } = getPublicConfig();
  const missing: string[] = [];
  if (!url) missing.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!anonKey) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');

  if (missing.length > 0) {
    throw new Error(
      `Supabase 가 설정되지 않았습니다. 누락된 환경 변수: ${missing.join(', ')}\n` +
        `.env 에 값을 채운 뒤 packages/supabase/migrations 를 적용하세요.\n` +
        `자세한 절차: wiki/07-supabase.md`,
    );
  }

  return {
    url: url!,
    anonKey: anonKey!,
    serviceRoleKey: env('SUPABASE_SERVICE_ROLE_KEY'),
    bucket,
  };
}

/** 사람이 읽을 수 있는 현재 상태 요약. `pnpm check` 와 어드민 배너가 씁니다. */
export function describeStatus(): {
  configured: boolean;
  writable: boolean;
  message: string;
} {
  const configured = isSupabaseConfigured();
  const writable = isSupabaseWritable();

  if (!configured) {
    return {
      configured: false,
      writable: false,
      message:
        'Supabase 미설정 — 파일 기반(content/posts/*.md)으로 동작 중입니다. ' +
        '.env 에 NEXT_PUBLIC_SUPABASE_URL 과 NEXT_PUBLIC_SUPABASE_ANON_KEY 를 넣으면 전환됩니다.',
    };
  }
  if (!writable) {
    return {
      configured: true,
      writable: false,
      message:
        'Supabase 읽기 전용 — SUPABASE_SERVICE_ROLE_KEY 가 없어 서버 쓰기가 비활성입니다.',
    };
  }
  return { configured: true, writable: true, message: 'Supabase 활성 (읽기/쓰기)' };
}
