import { el, shade } from './svg';

/** Taille du dessin d'un champignon (échelle 1), ancré au pied. */
export const MUSHROOM_W = 120;
export const MUSHROOM_H = 115;

export interface MushroomShape {
  /** Groupe positionné (attribut transform). */
  root: SVGGElement;
  /** Groupe intérieur, réservé aux animations. */
  body: SVGGElement;
}

export function drawMushroom(parent: SVGGElement, color: string): MushroomShape {
  const root = el('g', {}, parent);
  const body = el('g', { class: 'anim-base' }, root);
  el('ellipse', { cx: 0, cy: 2, rx: 46, ry: 9, fill: '#000', opacity: 0.2 }, body);
  el('path', { d: 'M-20 0 Q -24 -36 -16 -58 L 16 -58 Q 24 -36 20 0 Z', fill: '#fff3e0', stroke: '#bcaaa4', 'stroke-width': 4 }, body);
  el('path', {
    d: 'M-60 -50 Q -62 -115 0 -115 Q 62 -115 60 -50 Q 0 -38 -60 -50 Z',
    fill: color, stroke: shade(color, -0.35), 'stroke-width': 5, 'stroke-linejoin': 'round',
  }, body);
  for (const [cx, cy, r] of [[-30, -80, 10], [8, -98, 8], [32, -72, 11], [-4, -68, 6]] as const) {
    el('circle', { cx, cy, r, fill: '#fff', opacity: 0.92 }, body);
  }
  el('path', { d: 'M-40 -95 Q -30 -108 -12 -110', stroke: '#fff', 'stroke-width': 5, fill: 'none', opacity: 0.5, 'stroke-linecap': 'round' }, body);
  return { root, body };
}
