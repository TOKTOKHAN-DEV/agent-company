import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // @repo/content ships raw TypeScript — no build step in the workspace.
  transpilePackages: ['@repo/content'],
  // Content lives at the repo root, outside this app directory.
  outputFileTracingRoot: path.join(import.meta.dirname, '../..'),
  // Promoted out of `experimental` in Next.js 16.
  typedRoutes: true,
};

export default nextConfig;
