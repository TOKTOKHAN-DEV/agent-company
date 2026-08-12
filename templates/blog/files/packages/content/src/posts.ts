import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

import { postPath, postsDir } from './paths.ts';
import { type Post, type PostFrontmatterInput, PostFrontmatterSchema } from './schema.ts';

const WORDS_PER_MINUTE = 400; // tuned for mixed Korean/English prose

/** Shared by both drivers so reading time is identical regardless of backend. */
export function readingTime(body: string): number {
  const units = body.trim().split(/\s+/).length + (body.match(/[ㄱ-힝]/g)?.length ?? 0) / 2;
  return Math.max(1, Math.round(units / WORDS_PER_MINUTE));
}

/** Parse one markdown file into a validated Post. Throws on schema violation. */
export function parsePost(filePath: string): Post {
  const raw = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(raw);
  const parsed = PostFrontmatterSchema.safeParse(data);

  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`);
    throw new Error(`Invalid frontmatter in ${path.basename(filePath)}\n  - ${issues.join('\n  - ')}`);
  }

  return {
    ...parsed.data,
    body: content.trim(),
    filePath,
    readingTimeMinutes: readingTime(content),
  };
}

/** Every post on disk, newest first. Invalid files are reported, not swallowed. */
export function getAllPosts(): { posts: Post[]; errors: string[] } {
  const dir = postsDir();
  if (!fs.existsSync(dir)) return { posts: [], errors: [] };

  const posts: Post[] = [];
  const errors: string[] = [];

  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.md')) continue;
    try {
      posts.push(parsePost(path.join(dir, file)));
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  posts.sort((a, b) => (b.publishedAt ?? b.updatedAt).localeCompare(a.publishedAt ?? a.updatedAt));
  return { posts, errors };
}

/** Posts the public site is allowed to render. */
export function getPublishedPosts(): Post[] {
  const now = new Date().toISOString();
  return getAllPosts().posts.filter(
    (post) => post.status === 'published' && !post.seo.noindex && (post.publishedAt ?? now) <= now,
  );
}

export function getPostBySlug(slug: string): Post | null {
  const file = postPath(slug);
  return fs.existsSync(file) ? parsePost(file) : null;
}

/** Serialize frontmatter + body back to disk. Used by the admin editor. */
export function writePost(frontmatter: PostFrontmatterInput, body: string): string {
  const validated = PostFrontmatterSchema.parse({
    ...frontmatter,
    updatedAt: new Date().toISOString(),
  });

  const dir = postsDir();
  fs.mkdirSync(dir, { recursive: true });

  const file = postPath(validated.slug);
  fs.writeFileSync(file, matter.stringify(`\n${body.trim()}\n`, validated), 'utf8');
  return file;
}

export function deletePost(slug: string): boolean {
  const file = postPath(slug);
  if (!fs.existsSync(file)) return false;
  fs.unlinkSync(file);
  return true;
}

/**
 * Build a natural-language slug.
 *
 * Non-ASCII is deliberately preserved: keeping the target keyword in the URL
 * is a real ranking and click-through signal, and a Korean reader seeing
 * `/blog/캐시-컴포넌트` beats `/blog/kaesi-keomponeonteu`. Browsers
 * percent-encode on the wire and display it decoded.
 *
 * Truncation happens before hyphen-trimming so a cut never leaves a trailing
 * separator, which would fail `SLUG_PATTERN`.
 */
export function slugify(input: string): string {
  return input
    .normalize('NFC')
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .slice(0, 100)
    .replace(/^-+|-+$/g, '');
}

/**
 * Distinct tags ordered by frequency.
 *
 * Takes the post list rather than reading from disk so it works with either
 * driver, and so callers control whether drafts are included.
 */
export function getAllTags(posts: Post[]): { tag: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const post of posts) {
    for (const tag of post.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}
