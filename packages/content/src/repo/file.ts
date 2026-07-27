import {
  deletePost,
  getAllPosts,
  getPostBySlug,
  getPublishedPosts,
  writePost,
} from '../posts.ts';
import type { PostFrontmatterInput } from '../schema.ts';
import type { ContentRepository } from './types.ts';

/**
 * Markdown-on-disk driver. The default, and the one the template ships with.
 *
 * Everything is synchronous underneath; the async surface exists so the
 * Supabase driver can be swapped in without touching call sites.
 */
export const fileRepository: ContentRepository = {
  driver: 'file',

  async getAll() {
    return getAllPosts();
  },

  async getPublished() {
    return getPublishedPosts();
  },

  async getBySlug(slug: string) {
    return getPostBySlug(slug);
  },

  async save(frontmatter: PostFrontmatterInput, body: string) {
    writePost(frontmatter, body);
    return frontmatter.slug;
  },

  async remove(slug: string) {
    return deletePost(slug);
  },
};
