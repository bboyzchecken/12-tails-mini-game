import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

// Resolve the workspace shared package to its TypeScript source so Vite
// transforms it through its normal pipeline (avoids the "importing .ts from a
// linked dependency" pitfall).
export default defineConfig({
  resolve: {
    alias: {
      '@12tails/shared': fileURLToPath(new URL('../shared', import.meta.url)),
    },
  },
  server: {
    port: 5173,
  },
});
