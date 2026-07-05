import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import { RedisService } from '@/infrastructure/database/redis/redis.service';
import { CAPTCHA_PREFIX } from '@/modules/auth/constants/auth.constant';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const TEXT_COLORS = [
  '#8a9ba8',
  '#9b8aa8',
  '#8aa89b',
  '#a89b8a',
  '#9ba88a',
  '#a88a9b',
  '#8a9ba8',
  '#9b8a9b',
];

const DECO_COLORS = [
  '#e8d5b7',
  '#c9e4de',
  '#f2cc8f',
  '#d8e2dc',
  '#fcd5ce',
  '#b8e0d2',
  '#e8e8e4',
  '#ece4db',
  '#ffe5d9',
  '#d5bdaf',
  '#b5e2fa',
  '#a8d5e2',
  '#f9d5e5',
  '#d4c5f9',
  '#c5e7cc',
];

@Injectable()
export class CaptchaService {
  constructor(private readonly redisService: RedisService) {}

  async generate(): Promise<{ id: string; svg: string }> {
    const code = this.randomCode(4);
    const id = uuidv4();

    await this.redisService
      .getClient()
      .set(`${CAPTCHA_PREFIX}${id}`, code, 'EX', 300);

    const svg = this.renderSvg(code);

    return { id, svg };
  }

  async validate(id: string, code: string): Promise<boolean> {
    const stored = await this.redisService
      .getClient()
      .get(`${CAPTCHA_PREFIX}${id}`);
    if (!stored || stored !== code.trim().toUpperCase()) {
      return false;
    }
    await this.redisService.getClient().del(`${CAPTCHA_PREFIX}${id}`);
    return true;
  }

  private randomCode(len: number): string {
    let result = '';
    for (let i = 0; i < len; i++) {
      result += CHARS[Math.floor(Math.random() * CHARS.length)];
    }
    return result;
  }

  private renderSvg(code: string): string {
    const w = 200;
    const h = 60;

    const lines: string[] = [];

    lines.push(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`,
    );

    lines.push(`<rect width="${w}" height="${h}" fill="#f8f9fa" rx="6"/>`);

    this.renderPattern(lines, w, h);
    this.renderChars(lines, code, w);

    lines.push('</svg>');

    return lines.join('\n');
  }

  private renderPattern(lines: string[], w: number, h: number): void {
    const decoCount = 20 + Math.floor(Math.random() * 15);

    for (let i = 0; i < decoCount; i++) {
      const color = DECO_COLORS[Math.floor(Math.random() * DECO_COLORS.length)];
      const type = Math.floor(Math.random() * 6);

      switch (type) {
        case 0: {
          const x = Math.random() * w;
          const y = Math.random() * h;
          const r = 3 + Math.random() * 10;
          lines.push(
            `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${color}" opacity="0.5"/>`,
          );
          break;
        }
        case 1: {
          const x1 = Math.random() * w;
          const y1 = Math.random() * h;
          const x2 = Math.random() * w;
          const y2 = Math.random() * h;
          lines.push(
            `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${color}" stroke-width="${(0.5 + Math.random() * 1.5).toFixed(1)}" opacity="0.4"/>`,
          );
          break;
        }
        case 2: {
          const cx = 20 + Math.random() * (w - 40);
          const cy = 10 + Math.random() * (h - 20);
          const r = 8 + Math.random() * 18;
          lines.push(
            `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="none" stroke="${color}" stroke-width="1" opacity="0.35"/>`,
          );
          break;
        }
        case 3: {
          const x = Math.random() * w;
          const y = 10 + Math.random() * (h - 20);
          const len = 6 + Math.random() * 14;
          const angle = Math.random() * Math.PI * 2;
          lines.push(
            `<line x1="${(x - Math.cos(angle) * len).toFixed(1)}" y1="${(y - Math.sin(angle) * len).toFixed(1)}" x2="${(x + Math.cos(angle) * len).toFixed(1)}" y2="${(y + Math.sin(angle) * len).toFixed(1)}" stroke="${color}" stroke-width="1.5" opacity="0.3"/>`,
          );
          break;
        }
        case 4: {
          const x = Math.random() * w;
          const y = Math.random() * h;
          const size = 4 + Math.random() * 8;
          lines.push(
            `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${size.toFixed(1)}" height="${size.toFixed(1)}" fill="${color}" opacity="0.3" transform="rotate(${(Math.random() * 45).toFixed(1)}, ${x.toFixed(1)}, ${y.toFixed(1)})"/>`,
          );
          break;
        }
        case 5: {
          const x1 = Math.random() * w;
          const y1 = Math.random() * h;
          const x2 = x1 + (Math.random() - 0.5) * 40;
          const y2 = y1 + (Math.random() - 0.5) * 40;
          lines.push(
            `<path d="M ${x1.toFixed(1)} ${y1.toFixed(1)} Q ${((x1 + x2) / 2).toFixed(1)} ${((y1 + y2) / 2 - 10).toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}" stroke="${color}" stroke-width="1.5" fill="none" opacity="0.3"/>`,
          );
          break;
        }
      }
    }
  }

  private renderChars(lines: string[], code: string, w: number): void {
    const padding = 10;
    const usable = w - padding * 2;
    const charWidth = usable / code.length;

    for (let i = 0; i < code.length; i++) {
      const ch = code[i];
      const x = padding + charWidth * (i + 0.5) + (Math.random() - 0.5) * 6;
      const y = 42 + (Math.random() - 0.5) * 8;
      const fontSize = 28 + Math.random() * 6;
      const angle = (Math.random() - 0.5) * 25;
      const color = TEXT_COLORS[Math.floor(Math.random() * TEXT_COLORS.length)];

      lines.push(
        `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="${fontSize.toFixed(1)}" fill="${color}" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle" transform="rotate(${angle.toFixed(1)}, ${x.toFixed(1)}, ${y.toFixed(1)})">${ch}</text>`,
      );
    }
  }
}
