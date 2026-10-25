import type { Point } from '../types';
import { animate, colorOf, el, place, shade } from './svg';

/** Gemme taillée, centrée en (0,0), de « rayon » 1 (à mettre à l'échelle). */
export function drawGemShape(parent: SVGGElement, color: string): SVGGElement {
  const c = colorOf(color);
  const g = el('g', {}, parent);
  const sw = 0.045;
  el('polygon', { points: '-0.55,-0.75 0.55,-0.75 1,-0.25 0,1 -1,-0.25', fill: c, stroke: shade(c, -0.45), 'stroke-width': sw, 'stroke-linejoin': 'round' }, g);
  el('polygon', { points: '-0.55,-0.75 0.55,-0.75 1,-0.25 -1,-0.25', fill: shade(c, 0.18) }, g);
  el('polygon', { points: '-0.3,-0.75 0.3,-0.75 0.45,-0.25 -0.45,-0.25', fill: shade(c, 0.4) }, g);
  el('polygon', { points: '-1,-0.25 -0.4,-0.25 0,1', fill: shade(c, -0.08) }, g);
  el('polygon', { points: '1,-0.25 0.4,-0.25 0,1', fill: shade(c, -0.22) }, g);
  el('polygon', { points: '-0.55,-0.75 0.55,-0.75 1,-0.25 0,1 -1,-0.25', fill: 'none', stroke: shade(c, -0.45), 'stroke-width': sw, 'stroke-linejoin': 'round' }, g);
  el('polygon', { points: '-0.42,-0.62 -0.18,-0.62 -0.35,-0.36', fill: '#fff', opacity: 0.8 }, g);
  return g;
}

const SLOT_R = 36;

/** Bandeau du haut : les 5 creux de gemmes du niveau. */
export class GemBar {
  private slots = new Map<string, { pos: Point; g: SVGGElement; gem?: SVGGElement }>();

  /** `filled` : gemmes déjà gagnées (tableaux précédents). */
  constructor(parent: SVGGElement, colors: string[], filled: string[] = []) {
    const n = colors.length;
    const step = 100;
    const width = n * step + 40;
    const cx = 800;
    const cy = 62;
    el('rect', { x: cx - width / 2, y: cy - 50, width, height: 100, rx: 50, fill: '#1a237e', 'fill-opacity': 0.45, stroke: '#ffd54f', 'stroke-opacity': 0.6, 'stroke-width': 4 }, parent);
    colors.forEach((color, i) => {
      const pos = { x: cx + (i - (n - 1) / 2) * step, y: cy };
      const g = el('g', {}, parent);
      place(g, pos.x, pos.y);
      const hollow = el('g', { opacity: 0.35 }, g);
      el('polygon', { points: '-0.55,-0.75 0.55,-0.75 1,-0.25 0,1 -1,-0.25', transform: `scale(${SLOT_R})`, fill: '#0d1440', stroke: colorOf(color), 'stroke-width': 0.08, 'stroke-dasharray': '0.18 0.12' }, hollow);
      this.slots.set(color, { pos, g });
    });
    filled.forEach((c) => this.showGem(c));
  }

  /** Dessine directement une gemme gagnée dans son creux. */
  showGem(color: string): void {
    const s = this.slots.get(color);
    if (!s || s.gem) return;
    s.gem = el('g', { transform: `scale(${SLOT_R})` }, s.g);
    drawGemShape(s.gem, color);
  }

  /** Retire la gemme de son creux (pour l'animer ailleurs) et renvoie sa position. */
  takeGem(color: string): Point | null {
    const s = this.slots.get(color);
    if (!s?.gem) return null;
    s.gem.remove();
    s.gem = undefined;
    return s.pos;
  }

  slotPosition(color: string): Point {
    return this.slots.get(color)?.pos ?? { x: 800, y: 62 };
  }

  get slotScale(): number {
    return SLOT_R;
  }

  fill(color: string): void {
    const s = this.slots.get(color);
    if (!s) return;
    const glow = el('circle', { r: SLOT_R * 1.6, fill: 'url(#halo-white)', class: 'anim-center' }, s.g);
    void animate(glow, [{ transform: 'scale(0.3)', opacity: 1 }, { transform: 'scale(1.6)', opacity: 0 }], { duration: 900, easing: 'ease-out' }).then(() => glow.remove());
  }
}
