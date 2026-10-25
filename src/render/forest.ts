import type { DecorDef, SceneDef } from '../types';
import { el, place } from './svg';
import { VIEW_H, VIEW_W, type Layers } from './stage';

/** Décor fixe (non interactif) : ciel, sol, arbres, buissons... tout vient de la scène. */
export function drawForest(layers: Layers, scene: SceneDef): void {
  const bg = layers.bg;
  const colors = scene.background ?? { sky_top: '#123d3a', sky_bottom: '#2f6b4f', ground: '#3b7a3a' };
  const sky = el('linearGradient', { id: 'sky', x1: 0, y1: 0, x2: 0, y2: 1 }, bg);
  el('stop', { offset: 0, 'stop-color': colors.sky_top }, sky);
  el('stop', { offset: 1, 'stop-color': colors.sky_bottom }, sky);
  // On déborde du viewBox pour remplir les bandes de letterbox.
  el('rect', { x: -800, y: -400, width: VIEW_W + 1600, height: VIEW_H + 800, fill: 'url(#sky)' }, bg);

  // Rayons de lumière
  for (const [x, w] of [[300, 120], [700, 80], [1150, 140]] as const) {
    el('polygon', {
      points: `${x},0 ${x + w},0 ${x + w * 2.4},${VIEW_H} ${x + w * 1.2},${VIEW_H}`,
      fill: '#fffde7', opacity: 0.06,
    }, bg);
  }
  // Collines lointaines
  el('path', { d: `M-800 520 Q 200 380 600 470 T 1300 440 T 2400 480 V 1300 H -800 Z`, fill: '#24573f' }, bg);
  // Sol
  el('path', { d: `M-800 560 Q 300 470 800 520 T 2400 540 V 1300 H -800 Z`, fill: colors.ground }, bg);
  el('path', { d: `M-800 700 Q 400 640 900 700 T 2400 690 V 1300 H -800 Z`, fill: '#2f6a30', opacity: 0.55 }, bg);

  for (const d of scene.decor) DECOR[d.type]?.(layers.decor, d);

  // Lucioles
  for (let i = 0; i < 14; i++) {
    const c = el('circle', {
      cx: 80 + ((i * 397) % 1440), cy: 160 + ((i * 211) % 420), r: 4 + (i % 3),
      fill: '#fff59d', class: 'firefly',
    }, layers.decor);
    c.style.animationDelay = `${(i * 0.37) % 3}s`;
  }
}

type DecorFn = (parent: SVGGElement, d: DecorDef) => void;

const DECOR: Record<string, DecorFn> = {
  tree(parent, d) {
    const g = el('g', {}, parent);
    place(g, d.x, d.y, d.scale ?? 1);
    el('path', { d: 'M-26 0 Q -18 -140 -14 -260 L 14 -260 Q 18 -140 30 0 Z', fill: '#6d4c41' }, g);
    el('path', { d: 'M-4 -120 Q 30 -150 60 -150', stroke: '#6d4c41', 'stroke-width': 12, fill: 'none', 'stroke-linecap': 'round' }, g);
    const leaves: [number, number, number, string][] = [
      [0, -300, 110, '#2e7d32'], [-80, -250, 80, '#2e7d32'], [85, -250, 80, '#388e3c'],
      [-40, -350, 75, '#388e3c'], [45, -345, 80, '#43a047'], [-20, -300, 40, '#66bb6a'],
    ];
    for (const [cx, cy, r, fill] of leaves) el('circle', { cx, cy, r, fill }, g);
  },
  pine(parent, d) {
    const g = el('g', { opacity: 0.85 }, parent);
    place(g, d.x, d.y, d.scale ?? 1);
    el('rect', { x: -12, y: -40, width: 24, height: 40, fill: '#4e342e' }, g);
    for (const [y, w, h] of [[-40, 110, 120], [-120, 90, 110], [-195, 66, 100]] as const) {
      el('polygon', { points: `${-w},${y} ${w},${y} 0,${y - h}`, fill: '#1b5e20' }, g);
    }
  },
  branch(parent, d) {
    const g = el('g', {}, parent);
    const len = Number(d.length ?? 140);
    g.setAttribute('transform', `translate(${d.x} ${d.y}) rotate(${Number(d.angle ?? 0)})`);
    el('path', { d: `M0 0 Q ${len * 0.5} -10 ${len} 0`, stroke: '#5d4037', 'stroke-width': 16, fill: 'none', 'stroke-linecap': 'round' }, g);
    el('ellipse', { cx: len * 0.85, cy: -12, rx: 26, ry: 12, fill: '#43a047' }, g);
  },
  bush(parent, d) {
    const g = el('g', {}, parent);
    place(g, d.x, d.y, d.scale ?? 1);
    for (const [cx, cy, r, fill] of [[-60, 0, 55, '#2e7d32'], [60, 0, 55, '#2e7d32'], [0, -30, 70, '#388e3c'], [-20, -50, 25, '#66bb6a']] as const) {
      el('circle', { cx, cy, r, fill }, g);
    }
  },
  rock(parent, d) {
    const g = el('g', {}, parent);
    place(g, d.x, d.y, d.scale ?? 1);
    el('ellipse', { cx: 0, cy: 0, rx: 60, ry: 34, fill: '#78909c' }, g);
    el('ellipse', { cx: -15, cy: -12, rx: 26, ry: 10, fill: '#b0bec5' }, g);
  },
  grass(parent, d) {
    const g = el('g', {}, parent);
    place(g, d.x, d.y, d.scale ?? 1);
    el('path', { d: 'M-30 0 Q -26 -30 -34 -50 M-10 0 Q -6 -40 0 -60 M10 0 Q 16 -30 28 -46', stroke: '#7cb342', 'stroke-width': 7, fill: 'none', 'stroke-linecap': 'round' }, g);
  },
};
