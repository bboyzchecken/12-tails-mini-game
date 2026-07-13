import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export — landing (SSG, for SEO) + admin (client SPA) deployed to
  // Cloudflare Pages. No Next server routes/SSR (all data comes from the Go API).
  // See 12tails-web-BUILD-PLAN.md §10 "Deploy targets".
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  // This app is its own project inside the game monorepo (its own lockfile).
  // Pin the tracing root to /web so Next doesn't climb to the repo root.
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
