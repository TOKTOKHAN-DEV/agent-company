import { createAdminSupabase, isSupabaseWritable } from '@repo/supabase';
import type { PostRow } from '@repo/supabase';

import { readingTime } from '../posts.ts';
import {
  type Post,
  type PostFrontmatterInput,
  PostFrontmatterSchema,
} from '../schema.ts';
import type { ContentRepository } from './types.ts';

/**
 * Postgres driver. Inactive until Supabase keys are set and the migration in
 * `packages/supabase/migrations` has been applied.
 *
 * Reads go through the service-role client so the admin can see drafts. The
 * public site's RLS policy (published + not noindex) is the safety net for
 * anon access — see `0001_init.sql`.
 */

/** DB row → validated domain object. Throws with the slug on schema violation. */
function toPost(row: PostRow): Post {
  const parsed = PostFrontmatterSchema.safeParse({
    title: row.title,
    slug: row.slug,
    description: row.description,
    status: row.status,
    author: row.author,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at ?? undefined,
    tags: row.tags,
    category: row.category,
    cover: row.cover ?? undefined,
    seo: row.seo,
    geo: row.geo,
    review: row.review,
  });

  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`);
    throw new Error(`Invalid record for slug "${row.slug}"\n  - ${issues.join('\n  - ')}`);
  }

  return {
    ...parsed.data,
    body: row.body,
    filePath: '',
    readingTimeMinutes: readingTime(row.body),
  };
}

/** Domain object → DB row. */
function toRow(frontmatter: PostFrontmatterInput, body: string) {
  const v = PostFrontmatterSchema.parse({ ...frontmatter, updatedAt: new Date().toISOString() });
  return {
    slug: v.slug,
    title: v.title,
    description: v.description,
    body: body.trim(),
    status: v.status,
    author: v.author,
    category: v.category,
    tags: v.tags,
    created_at: v.createdAt,
    updated_at: v.updatedAt,
    published_at: v.publishedAt ?? null,
    cover: v.cover ?? null,
    seo: v.seo,
    geo: v.geo,
    review: v.review,
  };
}

export const supabaseRepository: ContentRepository = {
  driver: 'supabase',

  async getAll() {
    const supabase = createAdminSupabase();
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('updated_at', { ascending: false });

    if (error) throw new Error(`Supabase 조회 실패: ${error.message}`);

    const posts: Post[] = [];
    const errors: string[] = [];
    for (const row of data ?? []) {
      try {
        posts.push(toPost(row));
      } catch (e) {
        errors.push(e instanceof Error ? e.message : String(e));
      }
    }
    return { posts, errors };
  },

  async getPublished() {
    const supabase = createAdminSupabase();
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('status', 'published')
      .or(`published_at.is.null,published_at.lte.${now}`)
      .order('published_at', { ascending: false, nullsFirst: false });

    if (error) throw new Error(`Supabase 조회 실패: ${error.message}`);

    return (data ?? [])
      .map(toPost)
      // noindex is stored inside the seo jsonb, so it is filtered here rather
      // than in SQL. The RLS policy enforces the same rule for anon reads.
      .filter((post) => !post.seo.noindex);
  },

  async getBySlug(slug: string) {
    const supabase = createAdminSupabase();
    const { data, error } = await supabase.from('posts').select('*').eq('slug', slug).maybeSingle();
    if (error) throw new Error(`Supabase 조회 실패: ${error.message}`);
    return data ? toPost(data) : null;
  },

  async save(frontmatter: PostFrontmatterInput, body: string) {
    if (!isSupabaseWritable()) {
      throw new Error(
        'Supabase 쓰기가 비활성입니다. SUPABASE_SERVICE_ROLE_KEY 를 .env 에 넣으세요.',
      );
    }
    const supabase = createAdminSupabase();
    const row = toRow(frontmatter, body);
    const { error } = await supabase.from('posts').upsert(row, { onConflict: 'slug' });
    if (error) throw new Error(`Supabase 저장 실패: ${error.message}`);
    return row.slug;
  },

  async remove(slug: string) {
    const supabase = createAdminSupabase();
    const { error, count } = await supabase
      .from('posts')
      .delete({ count: 'exact' })
      .eq('slug', slug);
    if (error) throw new Error(`Supabase 삭제 실패: ${error.message}`);
    return (count ?? 0) > 0;
  },
};
