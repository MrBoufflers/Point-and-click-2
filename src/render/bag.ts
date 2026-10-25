import type { Point } from '../types';
import { drawItem } from './items';
import { animate, el, place } from './svg';
import './village';

const SLOT = 92;

/** Ce qu'il faut pour dessiner une récompense (ex. la couleur des licornes). */
export interface RewardLook {
  unicorns?: string[];
}

/** Sac du village : les récompenses gagnées (licornes, potion, grimoire...). */
export class Bag {
  private slots = new Map<string, { pos: Point; g: SVGGElement; filled: boolean }>();

  constructor(parent: SVGGElement, ids: string[], private look: RewardLook = {}) {
    const n = ids.length;
    const width = n * (SLOT + 20) + 120;
    const cx = 800;
    const cy = 62;
    el('rect', { x: cx - width / 2, y: cy - 50, width, height: 100, rx: 30, fill: '#6d4c41', 'fill-opacity': 0.8, stroke: '#ffd54f', 'stroke-opacity': 0.7, 'stroke-width': 4 }, parent);
    // Petit sac à gauche du bandeau
    const sack = el('g', {}, parent);
    place(sack, cx - width / 2 + 50, cy + 30, 0.9);
    el('path', { d: 'M-34 0 Q -44 -50 -16 -62 L 16 -62 Q 44 -50 34 0 Z', fill: '#c8a165', stroke: '#6d4c41', 'stroke-width': 4 }, sack);
    el('path', { d: 'M-20 -62 Q 0 -52 20 -62', stroke: '#6d4c41', 'stroke-width': 5, fill: 'none' }, sack);
    ids.forEach((id, i) => {
      const pos = { x: cx - width / 2 + 110 + SLOT / 2 + i * (SLOT + 20), y: cy };
      const g = el('g', {}, parent);
      place(g, pos.x, pos.y);
      el('rect', { x: -SLOT / 2, y: -SLOT / 2 + 4, width: SLOT, height: SLOT - 8, rx: 18, fill: '#3e2723', opacity: 0.55, stroke: '#a1887f', 'stroke-width': 3, 'stroke-dasharray': '8 6' }, g);
      this.slots.set(id, { pos, g, filled: false });
    });
  }

  slotPosition(id: string): Point {
    return this.slots.get(id)?.pos ?? { x: 800, y: 62 };
  }

  has(id: string): boolean {
    return this.slots.get(id)?.filled ?? false;
  }

  setLook(look: RewardLook): void {
    this.look = { ...this.look, ...look };
  }

  /** Dessine la récompense dans sa case (avec un petit éclat si `flash`). */
  fill(id: string, flash = false): void {
    const s = this.slots.get(id);
    if (!s || s.filled) return;
    s.filled = true;
    const icon = el('g', {}, s.g);
    drawRewardIcon(icon, id, this.look);
    if (flash) {
      const glow = el('circle', { r: 70, fill: 'url(#halo-white)', class: 'anim-center' }, s.g);
      void animate(glow, [{ transform: 'scale(0.3)', opacity: 1 }, { transform: 'scale(1.6)', opacity: 0 }], { duration: 900, easing: 'ease-out' }).then(() => glow.remove());
      void animate(icon, [{ transform: 'scale(0.4)' }, { transform: 'scale(1.3)' }, { transform: 'scale(1)' }], { duration: 600, easing: 'ease-out' });
    }
  }
}

/** Icône d'une récompense, centrée en (0,0), ~80 px. */
export function drawRewardIcon(g: SVGGElement, id: string, look: RewardLook): void {
  if (id === 'unicorns') {
    const colors = look.unicorns?.length ? look.unicorns : ['pink', 'blue'];
    colors.slice(0, 2).forEach((c, i) => drawItem(g, { kind: 'unicorn', color: c, x: i === 0 ? 10 : -8, y: 32 + i * 6, scale: 0.21, flip: i === 0 }));
  } else if (id === 'potion') {
    drawItem(g, { kind: 'bottle', color: '#f06292', x: 0, y: 38, scale: 0.62 });
  } else if (id === 'grimoire') {
    drawItem(g, { kind: 'grimoire', x: 0, y: 30, scale: 0.48 });
  } else if (id === 'cake') {
    drawItem(g, { kind: 'cake', color: '#f8bbd0', x: 0, y: 26, scale: 0.17 });
    drawItem(g, { kind: 'strawberry', x: 0, y: -2, scale: 0.4 });
  } else if (id === 'horseshoes') {
    drawItem(g, { kind: 'horseshoe', color: '#ffca28', x: -14, y: 30, scale: 0.5 });
    drawItem(g, { kind: 'horseshoe', color: '#b0bec5', x: 16, y: 34, scale: 0.5 });
  } else {
    el('circle', { r: 20, fill: '#ffd54f' }, g);
  }
}
