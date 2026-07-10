#!/usr/bin/env node
/**
 * Phase 5 smoke test — emotes against a running server.
 *
 *   node tools/smoke/phase5.mjs
 *
 * Asserts: emote:played reaches everyone (sender included), emote before
 * join is dropped, the EMOTE_COOLDOWN_MS spam guard blocks rapid emotes
 * and lifts after the window, and emoteId is relayed as a capped string.
 */
import { io } from 'socket.io-client';

const URL = process.env.SERVER_URL ?? 'http://localhost:3001';
const EMOTE_COOLDOWN_MS = 3000;
const failures = [];

function check(label, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures.push(label);
}

const connect = () => io(URL, { transports: ['websocket'] });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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
    const onEvt = () => {
      clearTimeout(t);
      socket.off(event, onEvt);
      resolve(false);
    };
    const t = setTimeout(() => {
      socket.off(event, onEvt);
      resolve(true);
    }, ms);
    socket.on(event, onEvt);
  });
}

try {
  const A = connect();
  await waitFor(A, 'connect');
  A.emit('player:join', { characterId: 'dog', name: 'เอ', x: 400, y: 300, dir: 'down' });
  await waitFor(A, 'world:snapshot');

  // emote before join is dropped
  const C = connect();
  await waitFor(C, 'connect');
  const preJoinSilence = expectSilence(A, 'emote:played');
  C.emit('emote:send', { emoteId: 'happy' });
  check('emote before join is dropped', await preJoinSilence);
  C.close();

  const B = connect();
  await waitFor(B, 'connect');
  const bId = B.id;
  B.emit('player:join', { characterId: 'sheep', name: 'บี', x: 400, y: 300, dir: 'down' });
  await waitFor(B, 'world:snapshot');

  // --- emote reaches everyone ---------------------------------------------
  const atA = waitFor(A, 'emote:played');
  const atB = waitFor(B, 'emote:played');
  B.emit('emote:send', { emoteId: 'happy' });
  const [eA, eB] = await Promise.all([atA, atB]);
  check('A receives emote:played from B', eA.id === bId && eA.emoteId === 'happy');
  check('B (sender) also receives it', eB.id === bId && eB.emoteId === 'happy');

  // --- cooldown blocks rapid emotes ----------------------------------------
  const silent = expectSilence(A, 'emote:played');
  B.emit('emote:send', { emoteId: 'sad' });
  check('second emote within cooldown is dropped', await silent);

  // --- cooldown lifts -------------------------------------------------------
  await sleep(EMOTE_COOLDOWN_MS - 800 + 150); // total elapsed > cooldown
  const afterCd = waitFor(A, 'emote:played');
  B.emit('emote:send', { emoteId: 'laugh' });
  const e2 = await afterCd;
  check('emote after cooldown goes through', e2.id === bId && e2.emoteId === 'laugh');

  // --- oversized emoteId is capped ------------------------------------------
  await sleep(EMOTE_COOLDOWN_MS + 100);
  const capped = waitFor(A, 'emote:played');
  B.emit('emote:send', { emoteId: 'x'.repeat(100) });
  const e3 = await capped;
  check('emoteId capped at 32 chars', e3.emoteId.length === 32, `len=${e3.emoteId.length}`);

  A.close();
  B.close();
} catch (err) {
  check('smoke sequence completed', false, err.message);
}

console.log(failures.length ? `\n${failures.length} failure(s)` : '\nall good ✓');
process.exit(failures.length ? 1 : 0);
