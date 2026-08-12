import { createAdminSupabase } from './client.ts';
import { requireConfig } from './config.ts';

export interface UploadResult {
  /** 브라우저에서 바로 쓸 수 있는 공개 URL. */
  url: string;
  /** 버킷 내부 경로. 삭제할 때 필요합니다. */
  path: string;
}

/**
 * 이미지를 Supabase Storage 에 업로드합니다.
 *
 * 이 함수는 **사용자가 올린 이미지**만 다룹니다 (`source: user-upload`).
 * 이미지 *생성*은 Codex imagegen 전용이라는 하드 룰과 무관합니다 — 업로드는 생성이 아닙니다.
 * ADR-0002 참조.
 */
export async function uploadImage(
  file: ArrayBuffer | Uint8Array,
  options: { path: string; contentType: string; upsert?: boolean },
): Promise<UploadResult> {
  const { bucket } = requireConfig();
  const supabase = createAdminSupabase();

  const { error } = await supabase.storage.from(bucket).upload(options.path, file, {
    contentType: options.contentType,
    upsert: options.upsert ?? true,
  });

  if (error) {
    throw new Error(`Supabase Storage 업로드 실패: ${error.message}`);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(options.path);
  return { url: data.publicUrl, path: options.path };
}

export async function deleteImage(path: string): Promise<void> {
  const { bucket } = requireConfig();
  const supabase = createAdminSupabase();
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw new Error(`Supabase Storage 삭제 실패: ${error.message}`);
}
