#!/usr/bin/env node
/**
 * Phase 3 smoke test — two headless Socket.IO clients exercise the full
 * presence flow against a running server (default http://localhost:3001).
 *
 *   node tools/smoke/phase3.mjs
 *
 * Asserts: join → snapshot, player:joined broadcast, player:moved relay,
 * player:left on disconnect, and server-side name sanitizing.
 */
import { io } from 'socket.io-client';

const URL = process.env.SERVER_URL ?? 'http://localhost:3001';
const failures = [];

function check(label, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures.push(label);
}

function connect() {
  return io(URL, { transports: ['websocket'] });
}

function waitFor(socket, event, ms = 3000) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`timeout waiting for ${event}`)), ms);
    socket.once(event, (payload) => {
      clearTimeout(t);
      resolve(payload);
    });
  });
}

try {
  // --- A joins an empty world -------------------------------------------
  const A = connect();
  await waitFor(A, 'connect');
  const snapA = waitFor(A, 'world:snapshot');
  A.emit('player:join', { characterId: 'dog', name: 'ผู้เล่น A', x: 400, y: 300, dir: 'down' });
  const sA = await snapA;
  // Real players may be online — assert membership, not exact counts.
  check('A snapshot contains A', sA.players.some((p) => p.id === A.id));

  // --- B joins; A hears about it ----------------------------------------
  const joinedAtA = waitFor(A, 'player:joined');
  const B = connect();
  await waitFor(B, 'connect');
  const bId = B.id;
  const snapB = waitFor(B, 'world:snapshot');
  B.emit('player:join', {
    characterId: 'sheep',
    name: '  <b>ชื่อที่ยาวเกินสิบหกตัวอักษรแน่นอน</b>  ',
    x: 400, y: 300, dir: 'down',
  });
  const sB = await snapB;
  check(
    'B snapshot contains A and B',
    sB.players.some((p) => p.id === A.id) && sB.players.some((p) => p.id === bId),
  );
  const j = await joinedAtA;
  check('A receives player:joined for B', j.player.id === bId && j.player.characterId === 'sheep');
  check(
    'name is sanitized (no <>, trimmed, <=16 chars)',
    !/[<>]/.test(j.player.name) && j.player.name.length <= 16 && j.player.name === j.player.name.trim(),
    JSON.stringify(j.player.name),
  );

  // --- B moves; A sees it ------------------------------------------------
  const movedAtA = waitFor(A, 'player:moved');
  B.emit('player:move', { x: 512, y: 288, dir: 'left', moving: true });
  const m = await movedAtA;
  check(
    'A receives player:moved with B state',
    m.id === bId && m.x === 512 && m.y === 288 && m.dir === 'left' && m.moving === true,
  );

  // --- B leaves; A hears about it ----------------------------------------
  const leftAtA = waitFor(A, 'player:left');
  B.close();
  const l = await leftAtA;
  check('A receives player:left for B', l.id === bId);

  A.close();
} catch (err) {
  check('smoke sequence completed', false, err.message);
}

console.log(failures.length ? `\n${failures.length} failure(s)` : '\nall good ✓');
process.exit(failures.length ? 1 : 0);
