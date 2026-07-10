#!/usr/bin/env node
/**
 * Phase 4 smoke test — global chat against a running server.
 *
 *   node tools/smoke/phase4.mjs
 *
 * Asserts: chat:message reaches everyone (sender included), server strips
 * HTML + collapses whitespace, drops empty/whitespace-only messages, caps
 * length at CONFIG.CHAT_MAX_LEN, and ignores chat before player:join.
 */
import { io } from 'socket.io-client';

const URL = process.env.SERVER_URL ?? 'http://localhost:3001';
const CHAT_MAX_LEN = 200;
const failures = [];

function check(label, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures.push(label);
}

const connect = () => io(URL, { transports: ['websocket'] });

function waitFor(socket, event, ms = 3000) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`timeout waiting for ${event}`)), ms);
    socket.once(event, (payload) => {
      clearTimeout(t);
      resolve(payload);
    });
  });
}

/** Resolves true if the event does NOT arrive within ms. */
function expectSilence(socket, event, ms = 800) {
  return new Promise((resolve) => {
    const done = () => {
      socket.off(event, onEvt);
      resolve(true);
    };
    const onEvt = () => {
      clearTimeout(t);
      socket.off(event, onEvt);
      resolve(false);
    };
    const t = setTimeout(done, ms);
    socket.on(event, onEvt);
  });
}

try {
  const A = connect();
  await waitFor(A, 'connect');

  // chat before join must be ignored
  const silentPreJoin = expectSilence(A, 'chat:message');
  A.emit('chat:send', { text: 'ยังไม่ join นะ' });
  check('chat before join is dropped', await silentPreJoin);

  A.emit('player:join', { characterId: 'dog', name: 'เอ', x: 400, y: 300, dir: 'down' });
  await waitFor(A, 'world:snapshot');

  const B = connect();
  await waitFor(B, 'connect');
  const bId = B.id;
  B.emit('player:join', { characterId: 'sheep', name: 'บี', x: 400, y: 300, dir: 'down' });
  await waitFor(B, 'world:snapshot');

  // --- normal message reaches both, sanitized -----------------------------
  const atA = waitFor(A, 'chat:message');
  const atB = waitFor(B, 'chat:message');
  B.emit('chat:send', { text: '  สวัสดี <b>ชาวโลก</b> \n ครับ  ' });
  const [mA, mB] = await Promise.all([atA, atB]);
  check(
    'A receives sanitized chat from B',
    mA.id === bId && mA.name === 'บี' && mA.text === 'สวัสดี ชาวโลก ครับ' && typeof mA.ts === 'number',
    JSON.stringify(mA.text),
  );
  check('B (sender) also receives the message', mB.id === bId && mB.text === mA.text);

  // --- whitespace-only is dropped -----------------------------------------
  const silent = expectSilence(A, 'chat:message');
  B.emit('chat:send', { text: '   \n\t  ' });
  check('whitespace-only message is dropped', await silent);

  // --- over-long text capped ----------------------------------------------
  const longAtA = waitFor(A, 'chat:message');
  B.emit('chat:send', { text: 'ก'.repeat(300) });
  const long = await longAtA;
  check(`long message capped at ${CHAT_MAX_LEN}`, long.text.length === CHAT_MAX_LEN, `len=${long.text.length}`);

  A.close();
  B.close();
} catch (err) {
  check('smoke sequence completed', false, err.message);
}

console.log(failures.length ? `\n${failures.length} failure(s)` : '\nall good ✓');
process.exit(failures.length ? 1 : 0);
