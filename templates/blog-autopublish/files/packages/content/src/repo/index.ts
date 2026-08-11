import { describeStatus, isSupabaseConfigured } from '@repo/supabase';

import { fileRepository } from './file.ts';
import { supabaseRepository } from './supabase.ts';
import type { ContentRepository } from './types.ts';

export * from './types.ts';
export { fileRepository } from './file.ts';
export { supabaseRepository } from './supabase.ts';

/**
 * Pick the active driver.
 *
 * No keys → file driver, and the whole app works. That is the demo state the
 * template ships in. Add keys + run the migration → Supabase takes over with
 * no app-code change.
 *
 * `CONTENT_DRIVER=file` forces the file driver even when keys are present,
 * which is useful while migrating.
 */
export function getRepository(): ContentRepository {
  const forced = process.env.CONTENT_DRIVER;
  if (forced === 'file') return fileRepository;
  if (forced === 'supabase') return supabaseRepository;
  return isSupabaseConfigured() ? supabaseRepository : fileRepository;
}

/** Human-readable backend status for the admin banner and `pnpm check`. */
export function describeBackend(): { driver: 'file' | 'supabase'; message: string } {
  const repo = getRepository();
  if (repo.driver === 'file') {
    return {
      driver: 'file',
      message: describeStatus().message,
    };
  }
  return { driver: 'supabase', message: describeStatus().message };
}
