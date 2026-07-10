import { CONFIG } from '@12tails/shared/config';
import type { ChatMessage } from '@12tails/shared/events';

const LOG_MAX_LINES = 10;

// Palette copied from 12 Tails Online's global chat.
const COLOR_TAG = '#ffd23e'; // [ALL]
const COLOR_NAME = '#7fd6ff'; // player name
const COLOR_TEXT = '#ffffff'; // message body
const TEXT_SHADOW = '1px 1px 0 rgba(0,0,0,0.9), -1px 1px 0 rgba(0,0,0,0.6)';

interface ChatOverlayOptions {
  onSend: (text: string) => void;
  onFocusChange: (focused: boolean) => void;
}

/**
 * HTML chat UI over the canvas, styled after the game: a transparent
 * message log + input stacked above the PlayerHUD (bottom-left). ตำแหน่ง
 * อยู่ใน ui.css (.chat-log / .chat-input-wrap) เพื่อคุม responsive;
 * ตัวนี้ถูกแทนด้วย ChatPanel ใน U2. Enter focuses the input / sends;
 * Esc cancels. All text is inserted with textContent, so nothing the
 * server relays can inject markup.
 */
export class ChatOverlay {
  private root: HTMLDivElement;
  private log: HTMLDivElement;
  private input: HTMLInputElement;
  private readonly onWindowKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && document.activeElement !== this.input) {
      e.preventDefault();
      this.input.focus();
    }
  };

  constructor(private opts: ChatOverlayOptions) {
    this.root = document.createElement('div');
    this.root.style.cssText =
      'position:fixed;inset:0;pointer-events:none;z-index:10;' +
      'font-family:Tahoma,"Leelawadee UI",sans-serif;';

    this.log = document.createElement('div');
    this.log.className = 'chat-log';
    this.log.style.cssText =
      'display:flex;flex-direction:column;align-items:flex-start;gap:2px;' +
      `font-size:13px;line-height:1.35;text-shadow:${TEXT_SHADOW};` +
      'user-select:none;';

    const inputWrap = document.createElement('div');
    inputWrap.className = 'chat-input-wrap';

    this.input = document.createElement('input');
    this.input.maxLength = CONFIG.CHAT_MAX_LEN;
    this.input.placeholder = 'กด Enter เพื่อพิมพ์…';
    this.input.style.cssText =
      'width:300px;padding:7px 12px;font-size:13px;color:#fff;outline:none;' +
      'background:rgba(20,18,30,0.55);border:1px solid rgba(201,164,92,0.8);' +
      'border-radius:8px;font-family:inherit;';

    this.input.addEventListener('keydown', (e) => {
      e.stopPropagation(); // keep WASD/arrows from reaching Phaser while typing
      if (e.key === 'Enter') {
        const text = this.input.value.trim();
        if (text) this.opts.onSend(text);
        this.input.value = '';
        this.input.blur();
      } else if (e.key === 'Escape') {
        this.input.value = '';
        this.input.blur();
      }
    });
    this.input.addEventListener('focus', () => this.opts.onFocusChange(true));
    this.input.addEventListener('blur', () => this.opts.onFocusChange(false));
    window.addEventListener('keydown', this.onWindowKeyDown);

    inputWrap.appendChild(this.input);
    this.root.appendChild(this.log);
    this.root.appendChild(inputWrap);
    document.body.appendChild(this.root);
  }

  addMessage(m: ChatMessage) {
    const line = document.createElement('div');

    const tag = document.createElement('span');
    tag.textContent = '[ALL] ';
    tag.style.color = COLOR_TAG;

    const name = document.createElement('span');
    name.textContent = `${m.name} `;
    name.style.color = COLOR_NAME;

    const text = document.createElement('span');
    text.textContent = m.text;
    text.style.color = COLOR_TEXT;

    line.append(tag, name, text);
    this.log.appendChild(line);

    while (this.log.children.length > LOG_MAX_LINES) {
      this.log.firstChild?.remove();
    }
  }

  destroy() {
    window.removeEventListener('keydown', this.onWindowKeyDown);
    this.root.remove();
  }
}
