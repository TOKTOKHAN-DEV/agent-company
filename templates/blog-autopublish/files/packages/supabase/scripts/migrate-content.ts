#!/usr/bin/env node --experimental-strip-types
/**
 * content/posts/*.md → Supabase `posts` 테이블 이관.
 *
 * 멱등적입니다. 슬러그가 같으면 덮어씁니다(upsert). 여러 번 실행해도 안전합니다.
 * 파일은 삭제하지 않습니다 — 되돌릴 수 있어야 합니다.
 *
 * 사전 조건
 *   1. .env 에 Supabase 키 3개
 *   2. migrations/0001_init.sql 적용 완료
 */
import { fileRepository, supabaseRepository } from '../../content/src/index.ts';
import { describeStatus, isSupabaseWritable } from '../src/index.ts';

const dryRun = process.argv.includes('--dry-run');

const status = describeStatus();
console.log(`Supabase 상태: ${status.message}\n`);

if (!isSupabaseWritable()) {
  console.error(
    '이관하려면 쓰기 권한이 필요합니다.\n' +
      '.env 에 NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,\n' +
      'SUPABASE_SERVICE_ROLE_KEY 를 모두 채운 뒤 다시 실행하세요.',
  );
  process.exit(1);
}

const { posts, errors } = await fileRepository.getAll();

for (const error of errors) {
  console.error(`파싱 실패 (건너뜀): ${error}`);
}

if (posts.length === 0) {
  console.log('이관할 글이 없습니다.');
  process.exit(0);
}

console.log(`${posts.length}개 글을 이관합니다${dryRun ? ' (dry run)' : ''}.\n`);

let ok = 0;
let failed = 0;

for (const post of posts) {
  const { body, filePath: _filePath, readingTimeMinutes: _readingTime, ...frontmatter } = post;
  try {
    if (!dryRun) await supabaseRepository.save(frontmatter, body);
    console.log(`  ✔ ${post.slug}`);
    ok++;
  } catch (error) {
    console.error(`  ✘ ${post.slug} — ${error instanceof Error ? error.message : String(error)}`);
    failed++;
  }
}

console.log(`\n성공 ${ok}건, 실패 ${failed}건.`);

if (failed > 0) process.exit(1);

if (!dryRun) {
  console.log(
    '\n다음: .env 에서 CONTENT_DRIVER 를 비워두면 자동으로 Supabase 를 사용합니다.\n' +
      '파일은 그대로 두었습니다. 동작을 확인한 뒤 정리하세요.',
  );
}
