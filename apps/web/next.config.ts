import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // @orca/content ships raw TypeScript — no build step in the workspace.
  transpilePackages: ['@orca/content'],
  // Content lives at the repo root, outside this app directory.
  outputFileTracingRoot: path.join(import.meta.dirname, '../..'),
  experimental: {
    typedRoutes: true,
  },
};

export default nextConfig;
