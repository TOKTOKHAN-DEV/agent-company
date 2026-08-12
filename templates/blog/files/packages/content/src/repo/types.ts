import type { Post, PostFrontmatterInput } from '../schema.ts';

/**
 * Storage-agnostic content API.
 *
 * Two drivers implement this: `file` (markdown on disk, the default) and
 * `supabase` (Postgres, active once keys are present). Everything above this
 * interface — web pages, admin screens, the audit CLI — is driver-agnostic,
 * so switching backends does not touch app code.
 *
 * The API is async even for the file driver, so the two are interchangeable.
 */
export interface ContentRepository {
  /** Which driver is running. Surfaced in the admin banner and `pnpm check`. */
  readonly driver: 'file' | 'supabase';

  /** Every post, newest first. Invalid records are reported, not swallowed. */
  getAll(): Promise<{ posts: Post[]; errors: string[] }>;

  /** Posts the public site may render: published, not noindex, not future-dated. */
  getPublished(): Promise<Post[]>;

  getBySlug(slug: string): Promise<Post | null>;

  /** Create or overwrite. Returns the stored slug. */
  save(frontmatter: PostFrontmatterInput, body: string): Promise<string>;

  remove(slug: string): Promise<boolean>;
}
