import type { PlayerState } from '@12tails/shared/events';

/**
 * In-memory world state. The server is a relay, not a physics authority:
 * it stores whatever positions clients report and broadcasts them on.
 */
export class World {
  private players = new Map<string, PlayerState>();

  add(player: PlayerState) {
    this.players.set(player.id, player);
  }

  update(
    id: string,
    patch: Pick<PlayerState, 'x' | 'y' | 'dir' | 'moving'>,
  ): PlayerState | undefined {
    const p = this.players.get(id);
    if (!p) return undefined; // moved before joining — ignore
    p.x = patch.x;
    p.y = patch.y;
    p.dir = patch.dir;
    p.moving = patch.moving;
    return p;
  }

  get(id: string): PlayerState | undefined {
    return this.players.get(id);
  }

  remove(id: string): boolean {
    return this.players.delete(id);
  }

  snapshot(): PlayerState[] {
    return [...this.players.values()];
  }

  get count(): number {
    return this.players.size;
  }
}

export const world = new World();
