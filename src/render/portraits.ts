import type { PlayerDef, PlayerId } from '../types';
import { el, place, shade } from './svg';

/** Portraits des deux enfants dans les coins du bas. */
export class Portraits {
  private items = new Map<PlayerId, SVGGElement>();

  constructor(parent: SVGGElement, players: PlayerDef[]) {
    for (const p of players) {
      const root = el('g', {}, parent);
      place(root, p.side === 'left' ? 110 : 1490, 790);
      const inner = el('g', { class: 'portrait anim-center' }, root);
      el('circle', { r: 86, fill: 'none', stroke: '#fff59d', 'stroke-width': 10, class: 'portrait-ring' }, inner);
      el('circle', { r: 74, fill: p.color, stroke: shade(p.color, -0.35), 'stroke-width': 6 }, inner);
      el('circle', { cx: -26, cy: -30, r: 18, fill: '#fff', opacity: 0.25 }, inner);
      const t = el('text', {
        x: 0, y: 6, 'text-anchor': 'middle', 'dominant-baseline': 'central',
        'font-size': 96, 'font-weight': 800, 'font-family': 'Verdana, "DejaVu Sans", Arial, sans-serif', fill: '#fff',
      }, inner);
      t.textContent = p.initial;
      this.items.set(p.id, inner);
    }
  }

  /** null : les deux portraits au repos. */
  setActive(id: PlayerId | null): void {
    for (const [pid, g] of this.items) {
      g.classList.toggle('active', id === pid);
      g.classList.toggle('dim', id !== null && id !== pid);
    }
  }
}
