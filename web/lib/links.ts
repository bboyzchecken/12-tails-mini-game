/**
 * Outbound destinations from the landing. Set the real values via env at build
 * time (Cloudflare Pages, Phase 6); the dev defaults point at the local game
 * client (client port 8080) so "enter the community" works end-to-end locally.
 */
export const GAME_URL = process.env.NEXT_PUBLIC_GAME_URL ?? 'http://localhost:8080';
export const DISCORD_URL = process.env.NEXT_PUBLIC_DISCORD_URL ?? '';
