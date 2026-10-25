import type { Point } from '../types';
import { highlightBody } from './items';
import { el, lerp, place, tween } from './svg';

export interface Stored {
  root: SVGGElement;
  body: SVGGElement;
}

/** Fait voler un objet (positionné en from/fromScale) jusqu'à une position. */
export function flyItem(item: Stored, from: Point, fromScale: number, to: Point, toScale: number, ms = 700): Promise<void> {
  return tween(ms, (k) => {
    place(item.root, lerp(from.x, to.x, k), lerp(from.y, to.y, k) - Math.sin(k * Math.PI) * 160, lerp(fromScale, toScale, k));
  });
}

/** Petit panier (ou bocal) en bas au centre où se rangent les objets trouvés. */
export class Basket {
  private items: Stored[] = [];
  private itemsLayer: SVGGElement;
  capacity = 3;
  private readonly jar: boolean;

  constructor(parent: SVGGElement, private pos: Point, style: 'basket' | 'jar' = 'basket') {
    this.jar = style === 'jar';
    const back = el('g', {}, parent);
    place(back, pos.x, pos.y);
    this.itemsLayer = el('g', {}, parent);
    const front = el('g', {}, parent);
    place(front, pos.x, pos.y);
    if (this.jar) {
      el('rect', { x: -95, y: -150, width: 190, height: 175, rx: 40, fill: '#b3e5fc', opacity: 0.25 }, back);
      el('rect', { x: -95, y: -150, width: 190, height: 175, rx: 40, fill: 'none', stroke: '#e1f5fe', 'stroke-width': 7, opacity: 0.9 }, front);
      el('rect', { x: -70, y: -172, width: 140, height: 30, rx: 10, fill: '#8d6e63', stroke: '#5d4037', 'stroke-width': 5 }, front);
      el('path', { d: 'M-70 -120 Q -78 -40 -66 0', stroke: '#fff', 'stroke-width': 8, fill: 'none', opacity: 0.5, 'stroke-linecap': 'round' }, front);
      return;
    }
    el('path', { d: 'M-100 -55 Q 0 -200 100 -55', stroke: '#8d6e63', 'stroke-width': 13, fill: 'none', 'stroke-linecap': 'round' }, back);
    el('ellipse', { cx: 0, cy: -55, rx: 118, ry: 22, fill: '#4e342e' }, back);
    el('path', { d: 'M-118 -55 L 118 -55 L 88 30 Q 0 46 -88 30 Z', fill: '#a1887f', stroke: '#6d4c41', 'stroke-width': 5, 'stroke-linejoin': 'round' }, front);
    for (const y of [-30, -5, 18]) {
      el('path', { d: `M${-110 + (y + 55) * 0.3} ${y} Q 0 ${y + 10} ${110 - (y + 55) * 0.3} ${y}`, stroke: '#795548', 'stroke-width': 4, fill: 'none' }, front);
    }
    el('ellipse', { cx: 0, cy: -55, rx: 120, ry: 14, fill: 'none', stroke: '#6d4c41', 'stroke-width': 9 }, front);
  }

  get count(): number {
    return this.items.length;
  }

  private slot(i: number): Point {
    const n = Math.max(this.capacity, i + 1);
    const step = Math.min(68, 200 / n);
    return { x: this.pos.x + (i - (n - 1) / 2) * step, y: this.pos.y - (this.jar ? 20 : 48) };
  }

  /** Fait voler un objet jusque dans le panier. */
  async add(item: Stored, from: Point, fromScale: number): Promise<void> {
    const i = this.items.length;
    this.items.push(item);
    this.itemsLayer.appendChild(item.root);
    await flyItem(item, from, fromScale, this.slot(i), 0.55);
  }

  highlight(i: number): void {
    const it = this.items[i];
    if (it) highlightBody(it.body);
  }
}
