import { createServer } from 'node:http';
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '@12tails/shared/events';
import { CONFIG } from '@12tails/shared/config';

const PORT = Number(process.env.PORT ?? 3001);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173';

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN }));

const httpServer = createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: CLIENT_ORIGIN, methods: ['GET', 'POST'] },
});

app.get('/health', (_req, res) => {
  res.json({ ok: true, players: io.engine.clientsCount });
});

io.on('connection', (socket) => {
  console.log('[server] client connected:', socket.id);

  socket.on('disconnect', (reason) => {
    console.log('[server] client disconnected:', socket.id, '·', reason);
  });
});

httpServer.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT} · spawn =`, CONFIG.SPAWN);
});
