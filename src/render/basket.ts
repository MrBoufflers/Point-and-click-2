import type { Point } from '../types';
import { animate, el, lerp, place, tween } from './svg';

interface Stored {
  root: SVGGElement;
  body: SVGGElement;
}

/** Petit panier en bas au centre où se rangent les objets trouvés. */
export class Basket {
  private items: Stored[] = [];
  private itemsLayer: SVGGElement;
  capacity = 3;

  constructor(parent: SVGGElement, private pos: Point) {
    const g = el('g', {}, parent);
    place(g, pos.x, pos.y);
    el('path', { d: 'M-100 -55 Q 0 -200 100 -55', stroke: '#8d6e63', 'stroke-width': 13, fill: 'none', 'stroke-linecap': 'round' }, g);
    el('ellipse', { cx: 0, cy: -55, rx: 118, ry: 22, fill: '#4e342e' }, g);
    this.itemsLayer = el('g', {}, parent);
    const front = el('g', {}, parent);
    place(front, pos.x, pos.y);
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
    return { x: this.pos.x + (i - (n - 1) / 2) * step, y: this.pos.y - 48 };
  }

  /** Fait voler un objet (positionné en (x, y, échelle)) jusque dans le panier. */
  async add(item: Stored, from: Point, fromScale: number): Promise<void> {
    const i = this.items.length;
    this.items.push(item);
    this.itemsLayer.appendChild(item.root);
    const to = this.slot(i);
    const toScale = 0.55;
    await tween(700, (k) => {
      place(item.root, lerp(from.x, to.x, k), lerp(from.y, to.y, k) - Math.sin(k * Math.PI) * 160, lerp(fromScale, toScale, k));
    });
  }

  /** Fait briller l'objet n° i (pour compter). */
  highlight(i: number): void {
    const it = this.items[i];
    if (!it) return;
    it.body.classList.add('glow');
    void animate(it.body, [{ transform: 'scale(1)' }, { transform: 'scale(1.45)' }, { transform: 'scale(1)' }], { duration: 650, easing: 'ease-in-out' })
      .then(() => window.setTimeout(() => it.body.classList.remove('glow'), 250));
  }

  highlightAll(): void {
    this.items.forEach((_, i) => window.setTimeout(() => this.highlight(i), i * 120));
  }
}
