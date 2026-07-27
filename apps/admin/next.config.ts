import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@orca/content'],
  outputFileTracingRoot: path.join(import.meta.dirname, '../..'),
};

export default nextConfig;
