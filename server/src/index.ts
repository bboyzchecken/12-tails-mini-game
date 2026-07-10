import { createServer } from 'node:http';
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '@12tails/shared/events';
import { CONFIG } from '@12tails/shared/config';
import { world } from './world';
import { registerHandlers } from './handlers';

const PORT = Number(process.env.PORT ?? 3001);
// Comma-separated allowlist, e.g. "https://12tails.vercel.app,http://localhost:5173"
const CLIENT_ORIGINS = (process.env.CLIENT_ORIGIN ?? 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const app = express();
app.use(cors({ origin: CLIENT_ORIGINS }));

const httpServer = createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: CLIENT_ORIGINS, methods: ['GET', 'POST'] },
});

app.get('/health', (_req, res) => {
  res.json({ ok: true, players: world.count });
});

io.on('connection', (socket) => {
  console.log('[server] client connected:', socket.id);
  registerHandlers(io, socket);

  socket.on('disconnect', (reason) => {
    console.log('[server] client disconnected:', socket.id, '·', reason);
  });
});

httpServer.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT} · spawn =`, CONFIG.SPAWN);
  console.log('[server] allowed origins:', CLIENT_ORIGINS.join(', '));
});
