import { defineConfig, type Plugin } from 'vite';
import { fileURLToPath, URL } from 'node:url';
import { writeFileSync } from 'node:fs';

// Dev-only: lets the in-app browser POST a base64 image to be written to disk,
// so headless captures of the WebGL canvas can be read back as files (the
// screenshot tool times out on live WebGL). Body: {name, data} (data = dataURL).
function shotSink(): Plugin {
  return {
    name: 'shot-sink',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__shot', (req, res) => {
        let body = '';
        req.on('data', (c) => (body += c));
        req.on('end', () => {
          try {
            const { name, data } = JSON.parse(body);
            const b64 = String(data).split(',').pop() ?? '';
            const safe = String(name).replace(/[^a-z0-9_.-]/gi, '_');
            writeFileSync(`D:/12tails/_shots/${safe}`, Buffer.from(b64, 'base64'));
            res.statusCode = 200; res.end('ok');
          } catch (e) {
            res.statusCode = 500; res.end(String(e));
          }
        });
      });
    },
  };
}

// Resolve the workspace shared package to its TypeScript source so Vite
// transforms it through its normal pipeline (avoids the "importing .ts from a
// linked dependency" pitfall).
export default defineConfig({
  plugins: [shotSink()],
  resolve: {
    alias: {
      '@12tails/shared': fileURLToPath(new URL('../shared', import.meta.url)),
    },
  },
  server: {
    port: 5173,
  },
});
