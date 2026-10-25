import { el, place } from './svg';

export const SIGN_W = 220;
export const SIGN_H = 190;

export interface SignShape {
  root: SVGGElement;
  body: SVGGElement;
}

/** Panneau de bois avec un grand chiffre (centré sur la planche). */
export function drawSign(parent: SVGGElement, value: number, x: number, y: number): SignShape {
  const root = el('g', {}, parent);
  place(root, x, y);
  const body = el('g', { class: 'anim-center' }, root);
  el('rect', { x: -14, y: 40, width: 28, height: 120, fill: '#795548', rx: 6 }, body);
  el('rect', { x: -SIGN_W / 2, y: -SIGN_H / 2, width: SIGN_W, height: SIGN_H, rx: 22, fill: 'url(#wood)', stroke: '#6d4c41', 'stroke-width': 7 }, body);
  for (const yy of [-30, 30]) el('line', { x1: -SIGN_W / 2 + 12, y1: yy, x2: SIGN_W / 2 - 12, y2: yy, stroke: '#a1743f', 'stroke-width': 3, opacity: 0.6 }, body);
  for (const [cx, cy] of [[-88, -70], [88, -70], [-88, 70], [88, 70]]) el('circle', { cx, cy, r: 6, fill: '#5d4037' }, body);
  const t = el('text', {
    x: 0, y: 8, 'text-anchor': 'middle', 'dominant-baseline': 'central',
    'font-size': 165, 'font-weight': 800, 'font-family': 'Verdana, "DejaVu Sans", Arial, sans-serif',
    fill: '#3e2723', stroke: '#fff8e1', 'stroke-width': 4, 'paint-order': 'stroke',
  }, body);
  t.textContent = String(value);
  return { root, body };
}
