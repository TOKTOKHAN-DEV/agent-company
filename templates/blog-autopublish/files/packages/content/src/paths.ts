import fs from 'node:fs';
import path from 'node:path';

/**
 * Walk up from the current working directory until we find the workspace
 * root (the directory holding `pnpm-workspace.yaml`). Apps run from
 * `apps/web` or `apps/admin`, so relative content paths must resolve
 * against the repo root, not the app directory.
 */
export function findRepoRoot(startDir: string = process.cwd()): string {
  let dir = path.resolve(startDir);
  for (;;) {
    if (fs.existsSync(path.join(dir, 'pnpm-workspace.yaml'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return path.resolve(startDir);
    dir = parent;
  }
}

/** Root of the markdown content tree. Override with `CONTENT_DIR`. */
export function contentDir(): string {
  const configured = process.env.CONTENT_DIR ?? 'content';
  return path.isAbsolute(configured) ? configured : path.join(findRepoRoot(), configured);
}

export function postsDir(): string {
  return path.join(contentDir(), 'posts');
}

export function postPath(slug: string): string {
  return path.join(postsDir(), `${slug}.md`);
}

/** Directory generated cover images are written to, from repo root. */
export function imageOutputDir(): string {
  const configured = process.env.IMAGE_OUTPUT_DIR ?? 'apps/web/public/images/posts';
  return path.isAbsolute(configured) ? configured : path.join(findRepoRoot(), configured);
}
