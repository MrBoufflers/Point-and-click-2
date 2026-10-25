import type { DecorDef, SceneDef } from '../types';
import { colorOf, el, place, shade } from './svg';
import { VIEW_H, VIEW_W, type Layers } from './stage';

// On déborde du viewBox pour remplir les bandes de letterbox.
const FULL = { x: -800, y: -400, width: VIEW_W + 1600, height: VIEW_H + 800 };

interface Colors {
  sky_top: string;
  sky_bottom: string;
  ground: string;
}

/** Fond fixe (non interactif) selon `backdrop`, puis le décor de la scène. */
export function drawBackdrop(layers: Layers, scene: SceneDef): void {
  const kind = scene.backdrop ?? 'forest';
  const base = BACKDROPS[kind] ?? BACKDROPS.forest;
  const colors = { ...base.colors, ...scene.background };
  const bg = layers.bg;
  const sky = el('linearGradient', { id: 'sky', x1: 0, y1: 0, x2: 0, y2: 1 }, bg);
  el('stop', { offset: 0, 'stop-color': colors.sky_top }, sky);
  el('stop', { offset: 1, 'stop-color': colors.sky_bottom }, sky);
  el('rect', { ...FULL, fill: 'url(#sky)' }, bg);
  base.draw(bg, colors);
  for (const d of scene.decor) DECOR[d.type]?.(layers.decor, d);
  if (base.fireflies) {
    for (let i = 0; i < 14; i++) {
      const c = el('circle', {
        cx: 80 + ((i * 397) % 1440), cy: 160 + ((i * 211) % 420), r: 4 + (i % 3),
        fill: base.fireflies, class: 'firefly',
      }, layers.decor);
      c.style.animationDelay = `${(i * 0.37) % 3}s`;
    }
  }
}

const rays = (bg: SVGGElement, opacity: number) => {
  for (const [x, w] of [[300, 120], [700, 80], [1150, 140]] as const) {
    el('polygon', { points: `${x},0 ${x + w},0 ${x + w * 2.4},${VIEW_H} ${x + w * 1.2},${VIEW_H}`, fill: '#fffde7', opacity }, bg);
  }
};

const BACKDROPS: Record<string, { colors: Colors; fireflies?: string; draw: (bg: SVGGElement, c: Colors) => void }> = {
  forest: {
    colors: { sky_top: '#123d3a', sky_bottom: '#2f6b4f', ground: '#3b7a3a' },
    fireflies: '#fff59d',
    draw(bg, c) {
      rays(bg, 0.06);
      el('path', { d: 'M-800 520 Q 200 380 600 470 T 1300 440 T 2400 480 V 1300 H -800 Z', fill: '#24573f' }, bg);
      el('path', { d: 'M-800 560 Q 300 470 800 520 T 2400 540 V 1300 H -800 Z', fill: c.ground }, bg);
      el('path', { d: 'M-800 700 Q 400 640 900 700 T 2400 690 V 1300 H -800 Z', fill: '#2f6a30', opacity: 0.55 }, bg);
    },
  },
  river: {
    colors: { sky_top: '#4fa3c7', sky_bottom: '#bfe6d8', ground: '#5c9e3c' },
    draw(bg, c) {
      el('path', { d: 'M-800 470 Q 200 380 700 440 T 2400 430 V 1300 H -800 Z', fill: '#3f7f3a' }, bg);
      el('path', { d: 'M-800 520 Q 400 480 900 520 T 2400 510 V 1300 H -800 Z', fill: c.ground }, bg);
      // Rivière
      el('path', { d: 'M-800 575 Q 300 545 800 570 T 2400 565 V 705 Q 1300 725 800 700 T -800 710 Z', fill: '#2b8fd6' }, bg);
      el('path', { d: 'M-800 590 Q 300 565 800 588 T 2400 582', stroke: '#7fd0ff', 'stroke-width': 6, fill: 'none', opacity: 0.6 }, bg);
      for (const [x, y] of [[150, 640], [480, 615], [880, 655], [1240, 625], [1480, 670]]) {
        el('path', { d: `M${x} ${y} q 20 -10 40 0 t 40 0`, stroke: '#e3f6ff', 'stroke-width': 5, fill: 'none', 'stroke-linecap': 'round', class: 'wave' }, bg);
      }
      el('path', { d: 'M-800 700 Q 300 725 800 702 T 2400 705 V 1300 H -800 Z', fill: '#8bc34a' }, bg);
      el('path', { d: 'M-800 700 Q 300 725 800 702 T 2400 705', stroke: '#c5a26b', 'stroke-width': 18, fill: 'none' }, bg);
    },
  },
  cave: {
    colors: { sky_top: '#1c1530', sky_bottom: '#3a2b4f', ground: '#4a3b5c' },
    fireflies: '#b388ff',
    draw(bg, c) {
      // Entrée lumineuse au fond
      el('ellipse', { cx: 800, cy: 420, rx: 260, ry: 210, fill: '#5e4a7a' }, bg);
      el('ellipse', { cx: 800, cy: 440, rx: 170, ry: 150, fill: '#ffe9a8', opacity: 0.25 }, bg);
      el('path', { d: 'M-800 -400 H 2400 V 260 Q 1500 120 1300 300 Q 1100 120 800 170 Q 450 110 300 300 Q 120 140 -800 260 Z', fill: '#241a35' }, bg);
      el('path', { d: 'M-800 560 Q 300 500 800 540 T 2400 545 V 1300 H -800 Z', fill: c.ground }, bg);
      el('path', { d: 'M-800 720 Q 400 660 900 710 T 2400 700 V 1300 H -800 Z', fill: '#3b2f4a', opacity: 0.7 }, bg);
    },
  },
  meadow: {
    colors: { sky_top: '#64b5f6', sky_bottom: '#e1f5fe', ground: '#7cc443' },
    draw(bg, c) {
      el('circle', { cx: 1380, cy: 150, r: 70, fill: '#fff176', class: 'sun' }, bg);
      el('circle', { cx: 1380, cy: 150, r: 100, fill: '#fff59d', opacity: 0.35 }, bg);
      el('path', { d: 'M-800 470 Q 0 360 600 450 T 1500 420 T 2400 450 V 1300 H -800 Z', fill: '#9ccc65' }, bg);
      el('path', { d: 'M-800 540 Q 300 470 800 520 T 2400 520 V 1300 H -800 Z', fill: c.ground }, bg);
      el('path', { d: 'M-800 720 Q 400 670 900 715 T 2400 705 V 1300 H -800 Z', fill: '#6aae37', opacity: 0.6 }, bg);
    },
  },
  mountain: {
    colors: { sky_top: '#1e5aa8', sky_bottom: '#a7d3f5', ground: '#e8f1f8' },
    draw(bg, c) {
      el('polygon', { points: '-200,560 250,200 650,560', fill: '#7e97b8' }, bg);
      el('polygon', { points: '160,275 250,200 340,275 300,260 250,290 200,262', fill: '#fff' }, bg);
      el('polygon', { points: '900,560 1300,160 1800,560', fill: '#6c86aa' }, bg);
      el('polygon', { points: '1210,250 1300,160 1390,250 1345,235 1300,270 1255,238', fill: '#fff' }, bg);
      el('polygon', { points: '450,560 800,300 1150,560', fill: '#8aa3c2' }, bg);
      el('path', { d: 'M-800 560 Q 300 500 800 545 T 2400 540 V 1300 H -800 Z', fill: c.ground }, bg);
      el('path', { d: 'M-800 720 Q 400 670 900 715 T 2400 705 V 1300 H -800 Z', fill: '#cfe0ee', opacity: 0.8 }, bg);
    },
  },
};

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
    const leaf = String(d.color ?? '#1b5e20');
    for (const [y, w, h] of [[-40, 110, 120], [-120, 90, 110], [-195, 66, 100]] as const) {
      el('polygon', { points: `${-w},${y} ${w},${y} 0,${y - h}`, fill: leaf }, g);
    }
    if (d.snow) el('polygon', { points: '-30,-255 30,-255 0,-295', fill: '#fff' }, g);
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
    el('ellipse', { cx: 0, cy: 0, rx: 60, ry: 34, fill: String(d.color ?? '#78909c') }, g);
    el('ellipse', { cx: -15, cy: -12, rx: 26, ry: 10, fill: '#b0bec5', opacity: 0.8 }, g);
  },
  bigrock(parent, d) {
    const g = el('g', {}, parent);
    place(g, d.x, d.y, d.scale ?? 1);
    el('path', { d: 'M-190 0 Q -210 -150 -110 -230 Q 0 -290 120 -225 Q 215 -150 190 0 Z', fill: '#8d9aa5', stroke: '#5f6d78', 'stroke-width': 8 }, g);
    el('path', { d: 'M-120 -190 Q -60 -240 20 -235', stroke: '#c5cfd6', 'stroke-width': 10, fill: 'none', 'stroke-linecap': 'round' }, g);
  },
  grass(parent, d) {
    const g = el('g', {}, parent);
    place(g, d.x, d.y, d.scale ?? 1);
    el('path', { d: 'M-30 0 Q -26 -30 -34 -50 M-10 0 Q -6 -40 0 -60 M10 0 Q 16 -30 28 -46', stroke: String(d.color ?? '#7cb342'), 'stroke-width': 7, fill: 'none', 'stroke-linecap': 'round' }, g);
  },
  reed(parent, d) {
    const g = el('g', {}, parent);
    place(g, d.x, d.y, d.scale ?? 1);
    for (const [x, h] of [[-14, 130], [0, 160], [16, 120]]) {
      el('path', { d: `M${x} 0 Q ${x + 4} ${-h / 2} ${x} ${-h}`, stroke: '#558b2f', 'stroke-width': 6, fill: 'none' }, g);
      el('rect', { x: x - 6, y: -h - 6, width: 12, height: 36, rx: 6, fill: '#6d4c41' }, g);
    }
  },
  flowers(parent, d) {
    const g = el('g', {}, parent);
    place(g, d.x, d.y, d.scale ?? 1);
    const colors = ['#ef5350', '#ffee58', '#ab47bc', '#fff'];
    for (let i = 0; i < 5; i++) {
      const x = (i - 2) * 26;
      const y = -18 - (i % 2) * 14;
      el('line', { x1: x, y1: 0, x2: x, y2: y, stroke: '#558b2f', 'stroke-width': 4 }, g);
      el('circle', { cx: x, cy: y, r: 9, fill: colors[i % colors.length] }, g);
      el('circle', { cx: x, cy: y, r: 3.5, fill: '#fbc02d' }, g);
    }
  },
  crystal(parent, d) {
    const g = el('g', {}, parent);
    place(g, d.x, d.y, d.scale ?? 1);
    const c = colorOf(String(d.color ?? '#b388ff'));
    for (const [x, h, r] of [[-30, 90, -15], [0, 140, 0], [32, 100, 14]]) {
      el('polygon', { points: `${x - 16},0 ${x - 14},${-h * 0.75} ${x},${-h} ${x + 14},${-h * 0.75} ${x + 16},0`, fill: c, stroke: shade(c, -0.4), 'stroke-width': 4, transform: `rotate(${r} ${x} 0)`, opacity: 0.9 }, g);
    }
    el('ellipse', { cx: 0, cy: -60, rx: 70, ry: 80, fill: c, opacity: 0.12 }, g);
  },
  stalactite(parent, d) {
    const g = el('g', {}, parent);
    place(g, d.x, d.y, d.scale ?? 1);
    el('polygon', { points: '-30,0 30,0 4,140 -4,140', fill: '#2d2240' }, g);
    el('polygon', { points: '40,0 80,0 62,90', fill: '#2d2240' }, g);
  },
  cloud(parent, d) {
    const g = el('g', { opacity: 0.9 }, parent);
    place(g, d.x, d.y, d.scale ?? 1);
    for (const [cx, cy, r] of [[-60, 0, 40], [0, -20, 55], [60, 0, 40]]) el('circle', { cx, cy, r, fill: '#fff' }, g);
  },
  snowman(parent, d) {
    const g = el('g', {}, parent);
    place(g, d.x, d.y, d.scale ?? 1);
    el('circle', { cx: 0, cy: -50, r: 50, fill: '#fff', stroke: '#cfd8dc', 'stroke-width': 4 }, g);
    el('circle', { cx: 0, cy: -130, r: 36, fill: '#fff', stroke: '#cfd8dc', 'stroke-width': 4 }, g);
  },
};
