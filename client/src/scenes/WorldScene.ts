import Phaser from 'phaser';
import { CONFIG } from '@12tails/shared/config';
import type { Direction, PlayerState, ServerToClientEvents } from '@12tails/shared/events';
import { LocalPlayer } from '../entities/LocalPlayer';
import { RemotePlayer } from '../entities/RemotePlayer';
import { connectSocket, type GameSocket } from '../net/socket';
import { ChatBubble } from '../ui/ChatBubble';
import { ChatOverlay } from '../ui/ChatOverlay';

interface WorldInit {
  characterId: string;
  name: string;
}

/** Last movement state we broadcast — used to skip redundant sends. */
interface SentState {
  x: number;
  y: number;
  dir: Direction;
  moving: boolean;
}

/**
 * The shared map. Local player walks with keyboard; everyone else arrives
 * over Socket.IO as RemotePlayers (created/removed by presence events,
 * positions lerped between 10 Hz updates).
 */
export class WorldScene extends Phaser.Scene {
  private player!: LocalPlayer;
  private nameTag!: Phaser.GameObjects.Text;
  private socket!: GameSocket;
  private remotes = new Map<string, RemotePlayer>();
  private sendAccum = 0;
  private lastSent: SentState | null = null;
  private chat!: ChatOverlay;
  private bubbles = new Map<string, ChatBubble>();

  constructor() {
    super('World');
  }

  create(init: WorldInit) {
    const map = this.make.tilemap({ key: 'novice-camp' });
    const tileset = map.addTilesetImage('novice-camp', 'tiles');
    if (!tileset) throw new Error('Failed to load tileset "novice-camp"');

    const ground = map.createLayer('ground', tileset, 0, 0);
    const objects = map.createLayer('objects', tileset, 0, 0);
    if (!ground || !objects) throw new Error('Failed to create map layers');

    // Tiles flagged `collides` in the tileset become solid.
    ground.setCollisionByProperty({ collides: true });
    objects.setCollisionByProperty({ collides: true });

    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    this.player = new LocalPlayer(this, CONFIG.SPAWN.x, CONFIG.SPAWN.y, init.characterId);
    this.physics.add.collider(this.player, ground);
    this.physics.add.collider(this.player, objects);

    // Camera follows the player, clamped to the map bounds.
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setZoom(1.5);
    this.cameras.main.roundPixels = true;

    this.nameTag = this.add
      .text(0, 0, init.name, {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#ffffff',
        backgroundColor: '#00000066',
        padding: { x: 3, y: 1 },
      })
      .setOrigin(0.5, 1)
      .setDepth(1000);

    this.setupNetwork(init);
    this.setupChat();
  }

  // ------------------------------------------------------------------ chat

  private setupChat() {
    const keyboard = this.input.keyboard!;
    this.chat = new ChatOverlay({
      onSend: (text) => this.socket.emit('chat:send', { text }),
      onFocusChange: (focused) => {
        // Freeze movement keys while typing; clear stuck key state both ways.
        keyboard.resetKeys();
        keyboard.enabled = !focused;
      },
    });

    const onChat: ServerToClientEvents['chat:message'] = (m) => {
      this.chat.addMessage(m);
      this.showBubble(m.id, m.text);
    };
    this.socket.on('chat:message', onChat);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.socket.off('chat:message', onChat);
      for (const b of this.bubbles.values()) b.destroy();
      this.bubbles.clear();
      this.chat.destroy();
      keyboard.enabled = true;
    });
  }

  private showBubble(playerId: string, text: string) {
    const isLocal = playerId === this.socket.id;
    if (!isLocal && !this.remotes.has(playerId)) return; // speaker not visible

    this.bubbles.get(playerId)?.destroy();
    this.bubbles.set(playerId, new ChatBubble(this, text));
  }

  /** Anchor each live bubble just above its speaker's name tag. */
  private updateBubbles() {
    for (const [id, bubble] of this.bubbles) {
      if (!bubble.active) {
        this.bubbles.delete(id); // expired (BUBBLE_MS)
        continue;
      }
      const target = id === this.socket.id ? this.player : this.remotes.get(id);
      if (!target) {
        bubble.destroy();
        this.bubbles.delete(id);
        continue;
      }
      bubble.setPosition(target.x, target.y - CONFIG.FRAME.H * 0.55 - 18);
    }
  }

  // ------------------------------------------------------------ networking

  private setupNetwork(init: WorldInit) {
    this.socket = connectSocket();

    const join = () => {
      this.socket.emit('player:join', {
        characterId: init.characterId,
        name: init.name,
        x: Math.round(this.player.x),
        y: Math.round(this.player.y),
        dir: this.player.direction,
      });
      this.lastSent = null; // force a fresh move send after (re)join
    };

    const onSnapshot: ServerToClientEvents['world:snapshot'] = ({ players }) => {
      // Reconcile: the snapshot is the full truth (also heals reconnects).
      const seen = new Set<string>();
      for (const p of players) {
        if (p.id === this.socket.id) continue;
        seen.add(p.id);
        const existing = this.remotes.get(p.id);
        if (existing) existing.applyMove(p);
        else this.addRemote(p);
      }
      for (const [id, r] of this.remotes) {
        if (!seen.has(id)) {
          r.destroy();
          this.remotes.delete(id);
        }
      }
    };

    const onJoined: ServerToClientEvents['player:joined'] = ({ player }) => {
      if (player.id !== this.socket.id) this.addRemote(player);
    };

    const onMoved: ServerToClientEvents['player:moved'] = (p) => {
      this.remotes.get(p.id)?.applyMove(p);
    };

    const onLeft: ServerToClientEvents['player:left'] = ({ id }) => {
      this.remotes.get(id)?.destroy();
      this.remotes.delete(id);
    };

    this.socket.on('world:snapshot', onSnapshot);
    this.socket.on('player:joined', onJoined);
    this.socket.on('player:moved', onMoved);
    this.socket.on('player:left', onLeft);
    this.socket.on('connect', join); // rejoin after any reconnect

    // Buffered by socket.io if the connection isn't up yet.
    join();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.socket.off('world:snapshot', onSnapshot);
      this.socket.off('player:joined', onJoined);
      this.socket.off('player:moved', onMoved);
      this.socket.off('player:left', onLeft);
      this.socket.off('connect', join);
      for (const r of this.remotes.values()) r.destroy();
      this.remotes.clear();
    });
  }

  private addRemote(state: PlayerState) {
    if (this.remotes.has(state.id)) return;
    this.remotes.set(state.id, new RemotePlayer(this, state));
  }

  /** Broadcast our movement at most CONFIG.MOVE_SEND_HZ times per second. */
  private sendMove(delta: number) {
    this.sendAccum += delta;
    const interval = 1000 / CONFIG.MOVE_SEND_HZ;
    if (this.sendAccum < interval) return;
    this.sendAccum %= interval;

    const state: SentState = {
      x: Math.round(this.player.x),
      y: Math.round(this.player.y),
      dir: this.player.direction,
      moving: this.player.isMoving,
    };
    const prev = this.lastSent;
    if (
      prev &&
      prev.x === state.x &&
      prev.y === state.y &&
      prev.dir === state.dir &&
      prev.moving === state.moving
    ) {
      return; // nothing changed — stay quiet
    }
    this.socket.emit('player:move', state);
    this.lastSent = state;
  }

  update(_time: number, delta: number) {
    this.player.update();
    this.nameTag.setPosition(this.player.x, this.player.y - CONFIG.FRAME.H * 0.55);
    for (const r of this.remotes.values()) r.update();
    this.updateBubbles();
    this.sendMove(delta);
  }
}
