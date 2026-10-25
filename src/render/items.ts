import type { ItemDef } from '../types';
import { drawMushroom, MUSHROOM_H, MUSHROOM_W } from './mushroom';
import { animate, colorOf, el, place, shade } from './svg';

/**
 * Objets d'énigme. Chaque dessin est ancré au pied (0, 0) et monte vers les y négatifs.
 * root : groupe positionné ; body : groupe intérieur pour les animations.
 */
export interface ItemShape {
  root: SVGGElement;
  body: SVGGElement;
  /** Taille du dessin à l'échelle 1. */
  w: number;
  h: number;
}

const FONT = 'Verdana, "DejaVu Sans", Arial, sans-serif';

/** Dessine une forme géométrique centrée en (cx, cy), de « rayon » r. */
export function drawShapePath(parent: SVGGElement, shape: string, cx: number, cy: number, r: number, attrs: Record<string, string | number>): SVGElement {
  switch (shape) {
    case 'square':
      return el('rect', { x: cx - r * 0.9, y: cy - r * 0.9, width: r * 1.8, height: r * 1.8, rx: r * 0.18, ...attrs }, parent);
    case 'triangle':
      return el('polygon', { points: `${cx},${cy - r} ${cx + r * 1.05},${cy + r * 0.8} ${cx - r * 1.05},${cy + r * 0.8}`, 'stroke-linejoin': 'round', ...attrs }, parent);
    case 'star': {
      const pts: string[] = [];
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        const rr = i % 2 ? r * 0.45 : r;
        pts.push(`${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`);
      }
      return el('polygon', { points: pts.join(' '), 'stroke-linejoin': 'round', ...attrs }, parent);
    }
    case 'heart':
      return el('path', {
        d: `M${cx} ${cy + r * 0.85} C ${cx - r * 1.4} ${cy - r * 0.1}, ${cx - r * 0.7} ${cy - r * 1.2}, ${cx} ${cy - r * 0.45} C ${cx + r * 0.7} ${cy - r * 1.2}, ${cx + r * 1.4} ${cy - r * 0.1}, ${cx} ${cy + r * 0.85} Z`,
        'stroke-linejoin': 'round', ...attrs,
      }, parent);
    default:
      return el('circle', { cx, cy, r, ...attrs }, parent);
  }
}

export type ItemDrawer = (body: SVGGElement, def: ItemDef) => { w: number; h: number };
type Drawer = ItemDrawer;

const shadow = (body: SVGGElement, rx = 44) => el('ellipse', { cx: 0, cy: 2, rx, ry: 9, fill: '#000', opacity: 0.2 }, body);

/** Types d'objets disponibles (d'autres fichiers peuvent en ajouter). */
export const DRAWERS: Record<string, Drawer> = {
  shape(body, d) {
    const c = colorOf(d.color ?? '#90a4ae');
    shadow(body);
    drawShapePath(body, d.shape ?? 'circle', 0, -55, 50, { fill: c, stroke: shade(c, -0.4), 'stroke-width': 6 });
    el('ellipse', { cx: -16, cy: -76, rx: 13, ry: 7, fill: '#fff', opacity: 0.45, transform: 'rotate(-25 -16 -76)' }, body);
    return { w: 112, h: 112 };
  },
  letter(body, d) {
    const c = colorOf(d.color ?? '#fff8e1');
    shadow(body);
    el('circle', { cx: 0, cy: -58, r: 54, fill: c, stroke: shade(c, -0.45), 'stroke-width': 6 }, body);
    el('circle', { cx: 0, cy: -58, r: 44, fill: 'none', stroke: '#fff', 'stroke-width': 3, opacity: 0.5 }, body);
    const t = el('text', {
      x: 0, y: -54, 'text-anchor': 'middle', 'dominant-baseline': 'central',
      'font-size': 74, 'font-weight': 800, 'font-family': FONT, fill: '#3e2723',
    }, body);
    t.textContent = (d.letter ?? '?').toUpperCase();
    return { w: 112, h: 116 };
  },
  flower(body, d) {
    const c = colorOf(d.color ?? 'red');
    shadow(body, 30);
    el('path', { d: 'M0 0 Q -6 -40 0 -70', stroke: '#558b2f', 'stroke-width': 8, fill: 'none' }, body);
    el('ellipse', { cx: -16, cy: -30, rx: 16, ry: 7, fill: '#7cb342', transform: 'rotate(-30 -16 -30)' }, body);
    for (let i = 0; i < 6; i++) {
      el('ellipse', { cx: 0, cy: -122, rx: 15, ry: 25, fill: i % 2 ? c : shade(c, 0.15), stroke: shade(c, -0.3), 'stroke-width': 3, transform: `rotate(${i * 60} 0 -97)` }, body);
    }
    el('circle', { cx: 0, cy: -97, r: 15, fill: '#ffeb3b', stroke: '#f9a825', 'stroke-width': 3 }, body);
    return { w: 110, h: 135 };
  },
  star(body, d) {
    const c = colorOf(d.color ?? '#ffd54f');
    drawShapePath(body, 'star', 0, -55, 56, { fill: c, stroke: shade(c, -0.35), 'stroke-width': 5 });
    el('circle', { cx: -9, cy: -60, r: 4, fill: '#3e2723' }, body);
    el('circle', { cx: 9, cy: -60, r: 4, fill: '#3e2723' }, body);
    el('path', { d: 'M-7 -48 Q 0 -42 7 -48', stroke: '#3e2723', 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round' }, body);
    return { w: 112, h: 110 };
  },
  bird(body, d) {
    const c = colorOf(d.color ?? '#fff');
    el('path', { d: 'M-34 -30 L -56 -42 L -52 -22 Z', fill: shade(c, -0.25) }, body);
    el('ellipse', { cx: 0, cy: -30, rx: 34, ry: 22, fill: c, stroke: shade(c, -0.35), 'stroke-width': 3 }, body);
    el('circle', { cx: 26, cy: -48, r: 16, fill: c, stroke: shade(c, -0.35), 'stroke-width': 3 }, body);
    el('circle', { cx: 31, cy: -51, r: 4, fill: '#263238' }, body);
    el('path', { d: 'M41 -48 L 55 -44 L 41 -40 Z', fill: '#ff9800' }, body);
    el('ellipse', { cx: -4, cy: -36, rx: 20, ry: 11, fill: shade(c, -0.15), class: 'bird-wing flapping anim-center' }, body);
    return { w: 112, h: 72 };
  },
  slot(body) {
    el('circle', { cx: 0, cy: -55, r: 52, fill: '#fff', 'fill-opacity': 0.18, stroke: '#fff', 'stroke-width': 6, 'stroke-dasharray': '14 10' }, body);
    const t = el('text', { x: 0, y: -52, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': 70, 'font-weight': 800, 'font-family': FONT, fill: '#fff', opacity: 0.85 }, body);
    t.textContent = '?';
    return { w: 112, h: 112 };
  },
  hole(body, d) {
    drawShapePath(body, d.shape ?? 'circle', 0, -55, 54, { fill: '#263238', stroke: '#1b2327', 'stroke-width': 8, opacity: 0.9 });
    drawShapePath(body, d.shape ?? 'circle', 0, -50, 46, { fill: 'none', stroke: '#000', 'stroke-width': 6, opacity: 0.35 });
    return { w: 116, h: 116 };
  },
};

export function drawItem(parent: SVGGElement, def: ItemDef, defaultKind = 'mushroom'): ItemShape {
  const kind = def.kind ?? defaultKind;
  const scale = def.scale ?? 1;
  if (kind === 'mushroom') {
    const m = drawMushroom(parent, colorOf(def.color ?? 'red'));
    place(m.root, def.x, def.y, scale);
    if (def.shadow) toShadow(m.body);
    return { ...m, w: MUSHROOM_W, h: MUSHROOM_H };
  }
  const root = el('g', {}, parent);
  place(root, def.x, def.y, scale);
  const body = el('g', { class: 'anim-base' }, root);
  const draw = DRAWERS[kind] ?? DRAWERS.shape;
  const { w, h } = draw(body, def);
  if (def.shadow) toShadow(body);
  return { root, body, w, h };
}

/** Transforme le dessin en ombre (le filtre est sur un groupe intérieur pour ne pas gêner les effets). */
function toShadow(body: SVGGElement): void {
  const inner = el('g', { filter: 'url(#silhouette)' });
  while (body.firstChild) inner.appendChild(body.firstChild);
  body.appendChild(inner);
}

/** Fait briller un objet un instant (pour compter ou montrer). */
export function highlightBody(body: SVGGElement): void {
  body.classList.add('glow');
  void animate(body, [{ transform: 'scale(1)' }, { transform: 'scale(1.4)' }, { transform: 'scale(1)' }], { duration: 650, easing: 'ease-in-out' })
    .then(() => window.setTimeout(() => body.classList.remove('glow'), 250));
}
