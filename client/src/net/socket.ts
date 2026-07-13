import { io, type Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@12tails/shared/events';

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3001';

export type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: GameSocket | null = null;

export function connectSocket(): GameSocket {
  if (socket) return socket;

  socket = io(SERVER_URL, { transports: ['websocket'] });

  socket.on('connect', () => console.log('[client] connected to server:', socket?.id));
  socket.on('disconnect', (reason) => console.log('[client] disconnected:', reason));
  socket.on('connect_error', (err) => console.warn('[client] connect_error:', err.message));

  return socket;
}

export function getSocket(): GameSocket | null {
  return socket;
}

/**
 * Fully drop the connection (leaving the world so the server removes us) and
 * clear the cached instance — the next connectSocket() makes a fresh one. Used
 * when returning from the 3D world to the menu.
 */
export function resetSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}
