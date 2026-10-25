/**
 * Dessins du village : fonds intérieurs, décor, personnages, licornes, livres, chaudron, ingrédients.
 * Ils s'ajoutent aux registres existants (BACKDROPS, DECOR, DRAWERS).
 */
import type { DecorDef, ItemDef } from '../types';
import { BACKDROPS, DECOR, drawDecor } from './backdrop';
import { DRAWERS } from './items';
import { colorOf, el, place, shade } from './svg';
import { VIEW_W } from './stage';

const FONT = 'Verdana, "DejaVu Sans", Arial, sans-serif';
const num = (v: unknown, d: number) => (typeof v === 'number' ? v : d);
const str = (v: unknown, d: string) => (typeof v === 'string' ? v : d);

// ---------------- Fonds ----------------

BACKDROPS.village = {
  colors: { sky_top: '#7cb342', sky_bottom: '#8bc34a', ground: '#7cb342' },
  draw(bg) {
    for (let i = 0; i < 26; i++) {
      el('ellipse', { cx: (i * 263) % 1700 - 50, cy: (i * 151) % 950, rx: 70 + (i % 4) * 20, ry: 30 + (i % 3) * 10, fill: '#9ccc65', opacity: 0.45 }, bg);
    }
  },
};

BACKDROPS.stable = {
  colors: { sky_top: '#8d6e63', sky_bottom: '#795548', ground: '#e6c35c' },
  draw(bg, c) {
    for (let x = -40; x < VIEW_W + 40; x += 70) el('line', { x1: x, y1: -400, x2: x, y2: 640, stroke: '#6d4c41', 'stroke-width': 4, opacity: 0.6 }, bg);
    el('rect', { x: -800, y: 70, width: VIEW_W + 1600, height: 34, fill: '#5d4037' }, bg);
    el('path', { d: `M-800 620 H ${VIEW_W + 800} V 1300 H -800 Z`, fill: c.ground }, bg);
    for (let i = 0; i < 40; i++) {
      const x = (i * 97) % 1600;
      const y = 640 + ((i * 53) % 240);
      el('path', { d: `M${x} ${y} l 24 -8`, stroke: '#c9a33d', 'stroke-width': 4, 'stroke-linecap': 'round' }, bg);
    }
  },
};

BACKDROPS.shop = {
  colors: { sky_top: '#4a3f63', sky_bottom: '#5c4d78', ground: '#8d6e63' },
  draw(bg, c) {
    for (let y = 0; y < 640; y += 60) {
      for (let x = (y / 60) % 2 ? -50 : 0; x < VIEW_W; x += 100) {
        el('rect', { x: x + 3, y: y + 3, width: 94, height: 54, rx: 6, fill: '#574a73', opacity: 0.7 }, bg);
      }
    }
    el('path', { d: `M-800 640 H ${VIEW_W + 800} V 1300 H -800 Z`, fill: c.ground }, bg);
    for (let x = -60; x < VIEW_W + 60; x += 120) el('line', { x1: x, y1: 640, x2: x - 80, y2: 1000, stroke: '#6d4c41', 'stroke-width': 4 }, bg);
  },
};

BACKDROPS.library = {
  colors: { sky_top: '#6d2e3a', sky_bottom: '#7b3443', ground: '#a1887f' },
  draw(bg, c) {
    for (let x = 0; x < VIEW_W; x += 80) el('rect', { x, y: -400, width: 40, height: 1040, fill: '#7f3a48', opacity: 0.5 }, bg);
    el('path', { d: `M-800 650 H ${VIEW_W + 800} V 1300 H -800 Z`, fill: c.ground }, bg);
    el('rect', { x: 500, y: 700, width: 600, height: 170, rx: 80, fill: '#c62828', opacity: 0.35 }, bg);
  },
};

// ---------------- Décor ----------------

const g0 = (parent: SVGGElement, d: DecorDef) => {
  const g = el('g', {}, parent);
  place(g, d.x, d.y, d.scale ?? 1);
  return g;
};

Object.assign(DECOR, {
  window(parent: SVGGElement, d: DecorDef) {
    const g = g0(parent, d);
    el('path', { d: 'M-80 0 V -140 A 80 80 0 0 1 80 -140 V 0 Z', fill: '#bbdefb', stroke: '#5d4037', 'stroke-width': 12 }, g);
    el('line', { x1: 0, y1: 0, x2: 0, y2: -220, stroke: '#5d4037', 'stroke-width': 8 }, g);
    el('line', { x1: -80, y1: -110, x2: 80, y2: -110, stroke: '#5d4037', 'stroke-width': 8 }, g);
  },
  stall(parent: SVGGElement, d: DecorDef) {
    const g = g0(parent, d);
    el('rect', { x: -170, y: -150, width: 340, height: 150, fill: '#a1887f', stroke: '#5d4037', 'stroke-width': 8 }, g);
    for (const x of [-85, 0, 85]) el('line', { x1: x, y1: -150, x2: x, y2: 0, stroke: '#795548', 'stroke-width': 5 }, g);
    el('path', { d: 'M-170 -150 L 170 0 M170 -150 L -170 0', stroke: '#6d4c41', 'stroke-width': 8 }, g);
  },
  hay(parent: SVGGElement, d: DecorDef) {
    const g = g0(parent, d);
    el('rect', { x: -90, y: -80, width: 180, height: 80, rx: 14, fill: '#f2cf5b', stroke: '#c9a33d', 'stroke-width': 5 }, g);
    for (const y of [-55, -30]) el('line', { x1: -90, y1: y, x2: 90, y2: y, stroke: '#c9a33d', 'stroke-width': 4 }, g);
  },
  lantern(parent: SVGGElement, d: DecorDef) {
    const g = g0(parent, d);
    el('line', { x1: 0, y1: -60, x2: 0, y2: -20, stroke: '#3e2723', 'stroke-width': 4 }, g);
    el('circle', { cx: 0, cy: 10, r: 50, fill: '#ffe082', opacity: 0.3 }, g);
    el('rect', { x: -18, y: -20, width: 36, height: 46, rx: 6, fill: '#ffca28', stroke: '#3e2723', 'stroke-width': 4 }, g);
  },
  shelf(parent: SVGGElement, d: DecorDef) {
    const g = g0(parent, d);
    const w = num(d.width, 400);
    el('rect', { x: -w / 2, y: 0, width: w, height: 18, rx: 4, fill: '#8d6e63', stroke: '#5d4037', 'stroke-width': 4 }, g);
    for (const x of [-w / 2 + 30, w / 2 - 30]) el('path', { d: `M${x} 18 l 0 30 l 20 -30 z`, fill: '#5d4037' }, g);
  },
  bookcase(parent: SVGGElement, d: DecorDef) {
    const g = g0(parent, d);
    const w = num(d.width, 900);
    const h = num(d.height, 480);
    const n = num(d.shelves, 3);
    el('rect', { x: -w / 2 - 20, y: -h - 20, width: w + 40, height: h + 20, fill: '#5d4037' }, g);
    el('rect', { x: -w / 2, y: -h, width: w, height: h, fill: '#3e2723' }, g);
    for (let i = 1; i <= n; i++) {
      const y = -h + (i * h) / n;
      el('rect', { x: -w / 2 - 10, y: y - 14, width: w + 20, height: 18, fill: '#8d6e63', stroke: '#5d4037', 'stroke-width': 3 }, g);
    }
  },
  marker(parent: SVGGElement, d: DecorDef) {
    const g = g0(parent, d);
    const c = colorOf(str(d.color, 'red'));
    el('path', { d: 'M-30 0 H 30 V 46 L 0 32 L -30 46 Z', fill: c, stroke: shade(c, -0.4), 'stroke-width': 4 }, g);
  },
  counter(parent: SVGGElement, d: DecorDef) {
    const g = g0(parent, d);
    const w = num(d.width, 500);
    el('rect', { x: -w / 2, y: -150, width: w, height: 150, fill: '#795548', stroke: '#4e342e', 'stroke-width': 6 }, g);
    el('rect', { x: -w / 2 - 15, y: -165, width: w + 30, height: 22, rx: 6, fill: '#a1887f', stroke: '#4e342e', 'stroke-width': 5 }, g);
  },
  jars(parent: SVGGElement, d: DecorDef) {
    const g = g0(parent, d);
    const colors = ['#ef9a9a', '#a5d6a7', '#90caf9', '#fff59d'];
    colors.forEach((c, i) => {
      const x = (i - 1.5) * 50;
      el('rect', { x: x - 18, y: -60, width: 36, height: 60, rx: 10, fill: c, opacity: 0.8, stroke: '#455a64', 'stroke-width': 3 }, g);
      el('rect', { x: x - 12, y: -70, width: 24, height: 12, rx: 3, fill: '#8d6e63' }, g);
    });
  },
  rainbow(parent: SVGGElement, d: DecorDef) {
    const g = g0(parent, d);
    ['#e53935', '#fb8c00', '#fdd835', '#43a047', '#1e88e5', '#8e24aa'].forEach((c, i) => {
      el('path', { d: `M${-300 + i * 22} 0 A ${300 - i * 22} ${300 - i * 22} 0 0 1 ${300 - i * 22} 0`, stroke: c, 'stroke-width': 22, fill: 'none' }, g);
    });
  },
  waterfall(parent: SVGGElement, d: DecorDef) {
    const g = g0(parent, d);
    el('path', { d: 'M-160 -330 L 160 -330 L 120 0 L -120 0 Z', fill: '#78909c' }, g);
    el('path', { d: 'M-70 -330 L 70 -330 L 80 0 L -80 0 Z', fill: '#4fc3f7' }, g);
    for (const x of [-40, 0, 40]) el('line', { x1: x, y1: -320, x2: x * 1.1, y2: -10, stroke: '#e1f5fe', 'stroke-width': 8, class: 'falling', opacity: 0.8 }, g);
    el('ellipse', { cx: 0, cy: 0, rx: 160, ry: 30, fill: '#b3e5fc' }, g);
  },
  bridge(parent: SVGGElement, d: DecorDef) {
    const g = g0(parent, d);
    el('path', { d: 'M-300 0 Q 0 -140 300 0', stroke: '#8d6e63', 'stroke-width': 30, fill: 'none' }, g);
    for (let i = -5; i <= 5; i++) {
      const x = i * 55;
      const y = -140 * (1 - (x / 300) ** 2) * 0.5;
      el('line', { x1: x, y1: y, x2: x, y2: y - 60, stroke: '#6d4c41', 'stroke-width': 8 }, g);
    }
    el('path', { d: 'M-300 -60 Q 0 -200 300 -60', stroke: '#6d4c41', 'stroke-width': 8, fill: 'none' }, g);
  },
  stepping(parent: SVGGElement, d: DecorDef) {
    const g = g0(parent, d);
    for (const [x, y] of [[-200, 10], [-70, -10], [60, 12], [190, -6]]) el('ellipse', { cx: x, cy: y, rx: 55, ry: 22, fill: '#90a4ae', stroke: '#607d8b', 'stroke-width': 4 }, g);
  },
  sun(parent: SVGGElement, d: DecorDef) {
    const g = g0(parent, d);
    el('circle', { r: 100, fill: '#fff59d', opacity: 0.4 }, g);
    el('circle', { r: 65, fill: '#ffee58' }, g);
  },
  water(parent: SVGGElement, d: DecorDef) {
    const g = g0(parent, d);
    const w = num(d.width, 600);
    el('rect', { x: -w / 2, y: -50, width: w, height: 100, rx: 40, fill: '#4fc3f7' }, g);
    el('path', { d: `M${-w / 3} 0 q 20 -10 40 0 t 40 0 M${w / 8} 10 q 20 -10 40 0 t 40 0`, stroke: '#e1f5fe', 'stroke-width': 5, fill: 'none' }, g);
  },
  cave_mouth(parent: SVGGElement, d: DecorDef) {
    const g = g0(parent, d);
    el('path', { d: 'M-260 0 Q -260 -300 0 -320 Q 260 -300 260 0 Z', fill: '#5d4e6d' }, g);
    el('path', { d: 'M-160 0 Q -160 -200 0 -210 Q 160 -200 160 0 Z', fill: '#1c1530' }, g);
    for (const x of [-80, 20, 90]) el('circle', { cx: x, cy: -100 - (x % 30), r: 6, fill: '#b388ff' }, g);
  },
  mountain_peak(parent: SVGGElement, d: DecorDef) {
    const g = g0(parent, d);
    el('polygon', { points: '-300,0 0,-360 300,0', fill: '#7e97b8' }, g);
    el('polygon', { points: '-80,-262 0,-360 80,-262 40,-280 0,-250 -40,-280', fill: '#fff' }, g);
  },
});

// ---------------- Objets ----------------

const SKIN = '#ffccbc';

Object.assign(DRAWERS, {
  /** Licorne vue de profil (tournée vers la droite), crinière et queue de la couleur choisie. */
  unicorn(body: SVGGElement, d: ItemDef) {
    const main = d.color ? colorOf(d.color) : '#e0e0e0';
    const coat = d.color ? shade(main, 0.78) : '#fafafa';
    const line = shade(main, -0.35);
    const g = el('g', d.flip ? { transform: 'scale(-1 1)' } : {}, body);
    for (const [x, back] of [[-70, true], [50, true], [-45, false], [75, false]] as const) {
      el('rect', { x: x - 12, y: -95, width: 24, height: 95, rx: 10, fill: back ? shade(coat, -0.08) : coat, stroke: line, 'stroke-width': 3 }, g);
      el('rect', { x: x - 13, y: -16, width: 26, height: 16, rx: 5, fill: '#ffd54f' }, g);
    }
    el('path', { d: 'M-105 -125 Q -170 -110 -150 -30 Q -130 -80 -100 -95 Z', fill: main, stroke: line, 'stroke-width': 3 }, g);
    el('ellipse', { cx: 0, cy: -125, rx: 112, ry: 55, fill: coat, stroke: line, 'stroke-width': 4 }, g);
    el('path', { d: 'M60 -150 L 95 -235 L 140 -215 L 110 -120 Z', fill: coat, stroke: line, 'stroke-width': 4, 'stroke-linejoin': 'round' }, g);
    el('ellipse', { cx: 140, cy: -228, rx: 55, ry: 34, fill: coat, stroke: line, 'stroke-width': 4, transform: 'rotate(18 140 -228)' }, g);
    el('polygon', { points: '118,-258 136,-262 150,-330', fill: '#ffd54f', stroke: '#f9a825', 'stroke-width': 3, 'stroke-linejoin': 'round' }, g);
    el('path', { d: 'M110 -266 l -10 -26 l 22 14 z', fill: coat, stroke: line, 'stroke-width': 3 }, g);
    for (const [cx, cy, r] of [[105, -255, 20], [88, -225, 22], [76, -192, 22], [66, -160, 20]]) el('circle', { cx, cy, r, fill: main, stroke: line, 'stroke-width': 3 }, g);
    el('circle', { cx: 150, cy: -236, r: 6, fill: '#263238' }, g);
    el('circle', { cx: 152, cy: -238, r: 2, fill: '#fff' }, g);
    el('circle', { cx: 180, cy: -218, r: 4, fill: shade(coat, -0.3) }, g);
    el('ellipse', { cx: 160, cy: -214, rx: 10, ry: 6, fill: '#f8bbd0', opacity: 0.8 }, g);
    if (d.rider) {
      el('ellipse', { cx: -10, cy: -170, rx: 60, ry: 18, fill: shade(main, -0.1), opacity: 0.9 }, g);
      el('circle', { cx: -10, cy: -215, r: 40, fill: colorOf(str(d.rider_color, '#9e9e9e')), stroke: '#fff', 'stroke-width': 5 }, g);
      const t = el('text', { x: -10, y: -212, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': 46, 'font-weight': 800, 'font-family': FONT, fill: '#fff', transform: d.flip ? 'scale(-1 1) translate(20 0)' : '' }, g);
      t.textContent = d.rider;
    }
    return { w: 300, h: 300 };
  },

  npc(body: SVGGElement, d: ItemDef) {
    if (d.npc === 'librarian') {
      el('path', { d: 'M-80 0 L -70 -220 Q 0 -250 70 -220 L 80 0 Z', fill: '#558b2f', stroke: '#33691e', 'stroke-width': 5 }, body);
      el('path', { d: 'M-20 -230 L 0 -150 L 20 -230 Z', fill: '#fff' }, body);
      el('circle', { cx: 0, cy: -270, r: 46, fill: SKIN, stroke: '#d7a28f', 'stroke-width': 3 }, body);
      el('path', { d: 'M-46 -280 Q -50 -240 -36 -232 M46 -280 Q 50 -240 36 -232', stroke: '#bdbdbd', 'stroke-width': 14, fill: 'none', 'stroke-linecap': 'round' }, body);
      for (const x of [-17, 17]) {
        el('circle', { cx: x, cy: -275, r: 14, fill: '#fff', opacity: 0.6, stroke: '#5d4037', 'stroke-width': 4 }, body);
        el('circle', { cx: x, cy: -275, r: 4, fill: '#263238' }, body);
      }
      el('line', { x1: -3, y1: -275, x2: 3, y2: -275, stroke: '#5d4037', 'stroke-width': 4 }, body);
      el('path', { d: 'M-14 -246 Q 0 -236 14 -246', stroke: '#5d4037', 'stroke-width': 4, fill: 'none', 'stroke-linecap': 'round' }, body);
      el('path', { d: 'M-60 -130 L 0 -150 L 60 -130 L 60 -80 L 0 -100 L -60 -80 Z', fill: '#fff8e1', stroke: '#8d6e63', 'stroke-width': 4 }, body);
      el('line', { x1: 0, y1: -150, x2: 0, y2: -100, stroke: '#8d6e63', 'stroke-width': 3 }, body);
      return { w: 180, h: 320 };
    }
    // Apothicaire
    el('path', { d: 'M-90 0 L -62 -230 Q 0 -250 62 -230 L 90 0 Z', fill: '#7e57c2', stroke: '#4527a0', 'stroke-width': 5 }, body);
    for (const [x, y] of [[-40, -60], [30, -120], [-10, -180], [45, -40]]) el('circle', { cx: x, cy: y, r: 7, fill: '#ffd54f' }, body);
    el('circle', { cx: 0, cy: -268, r: 44, fill: SKIN, stroke: '#d7a28f', 'stroke-width': 3 }, body);
    el('path', { d: 'M-38 -255 Q -40 -170 0 -150 Q 40 -170 38 -255 Q 0 -230 -38 -255 Z', fill: '#fafafa', stroke: '#bdbdbd', 'stroke-width': 3 }, body);
    for (const x of [-15, 15]) el('circle', { cx: x, cy: -275, r: 5, fill: '#263238' }, body);
    el('ellipse', { cx: 0, cy: -258, rx: 9, ry: 7, fill: '#f8a58f' }, body);
    el('ellipse', { cx: 0, cy: -300, rx: 80, ry: 16, fill: '#5e35b1', stroke: '#4527a0', 'stroke-width': 4 }, body);
    el('path', { d: 'M-50 -305 Q -10 -350 30 -440 Q 40 -360 52 -305 Z', fill: '#5e35b1', stroke: '#4527a0', 'stroke-width': 4 }, body);
    for (const [x, y] of [[0, -340], [20, -380], [-20, -315]]) el('circle', { cx: x, cy: y, r: 6, fill: '#ffd54f' }, body);
    return { w: 190, h: 440 };
  },

  /** Livre debout (couverture), avec un chiffre éventuel. */
  book(body: SVGGElement, d: ItemDef) {
    const c = colorOf(d.color ?? 'red');
    el('rect', { x: -38, y: -110, width: 76, height: 110, rx: 6, fill: c, stroke: shade(c, -0.45), 'stroke-width': 5 }, body);
    el('rect', { x: -38, y: -110, width: 14, height: 110, rx: 4, fill: shade(c, -0.25) }, body);
    el('rect', { x: -14, y: -96, width: 42, height: 8, rx: 3, fill: '#fff', opacity: 0.6 }, body);
    if (d.number != null) {
      el('circle', { cx: 7, cy: -52, r: 27, fill: '#fff8e1', stroke: shade(c, -0.45), 'stroke-width': 3 }, body);
      const t = el('text', { x: 7, y: -50, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': 40, 'font-weight': 800, 'font-family': FONT, fill: '#3e2723' }, body);
      t.textContent = String(d.number);
    }
    return { w: 80, h: 112 };
  },

  cauldron(body: SVGGElement, d: ItemDef) {
    for (const x of [-60, 0, 60]) el('path', { d: `M${x - 20} 0 Q ${x} -60 ${x + 20} 0 Z`, fill: '#ff7043', class: 'flame' }, body);
    for (const x of [-90, 90]) el('rect', { x: x - 8, y: -50, width: 16, height: 50, fill: '#37474f' }, body);
    el('path', { d: 'M-140 -190 Q -150 -40 0 -30 Q 150 -40 140 -190 Z', fill: '#37474f', stroke: '#263238', 'stroke-width': 6 }, body);
    const c = colorOf(d.color ?? '#66bb6a');
    el('ellipse', { cx: 0, cy: -190, rx: 140, ry: 30, fill: c, stroke: '#263238', 'stroke-width': 8, 'data-role': 'liquid' }, body);
    for (const [x, r] of [[-50, 12], [10, 16], [60, 10]]) el('circle', { cx: x, cy: -200, r, fill: '#fff', opacity: 0.5, class: 'bubble', 'data-role': 'bubble' }, body);
    return { w: 300, h: 230 };
  },

  feather(body: SVGGElement, d: ItemDef) {
    const c = colorOf(d.color ?? 'blue');
    el('path', { d: 'M0 0 Q -10 -60 10 -130 Q 50 -80 20 -20 Z', fill: c, stroke: shade(c, -0.4), 'stroke-width': 4 }, body);
    el('path', { d: 'M0 0 Q 4 -60 10 -125', stroke: shade(c, -0.5), 'stroke-width': 3, fill: 'none' }, body);
    return { w: 70, h: 130 };
  },

  bottle(body: SVGGElement, d: ItemDef) {
    const c = colorOf(d.color ?? 'pink');
    el('circle', { cx: 0, cy: -45, r: 42, fill: '#e3f2fd', opacity: 0.6, stroke: '#90a4ae', 'stroke-width': 4 }, body);
    el('path', { d: 'M-40 -40 A 40 40 0 0 0 40 -40 Z', fill: c }, body);
    el('rect', { x: -14, y: -112, width: 28, height: 32, fill: '#e3f2fd', stroke: '#90a4ae', 'stroke-width': 4 }, body);
    el('rect', { x: -12, y: -124, width: 24, height: 16, rx: 4, fill: '#8d6e63' }, body);
    el('circle', { cx: -14, cy: -60, r: 7, fill: '#fff', opacity: 0.8 }, body);
    return { w: 90, h: 125 };
  },

  crystal(body: SVGGElement, d: ItemDef) {
    const c = colorOf(d.color ?? '#4dd0e1');
    for (const [x, h, r] of [[-22, 70, -15], [0, 110, 0], [24, 80, 14]]) {
      el('polygon', { points: `${x - 13},0 ${x - 11},${-h * 0.75} ${x},${-h} ${x + 11},${-h * 0.75} ${x + 13},0`, fill: c, stroke: shade(c, -0.4), 'stroke-width': 4, transform: `rotate(${r} ${x} 0)` }, body);
    }
    return { w: 90, h: 115 };
  },

  leaf(body: SVGGElement, d: ItemDef) {
    const c = colorOf(d.color ?? 'green');
    el('path', { d: 'M0 0 Q -55 -50 0 -110 Q 55 -50 0 0 Z', fill: c, stroke: shade(c, -0.4), 'stroke-width': 4 }, body);
    el('path', { d: 'M0 0 L 0 -100 M0 -40 L -20 -60 M0 -40 L 20 -60 M0 -70 L -15 -85 M0 -70 L 15 -85', stroke: shade(c, -0.4), 'stroke-width': 3, fill: 'none' }, body);
    return { w: 90, h: 110 };
  },

  grimoire(body: SVGGElement) {
    el('rect', { x: -80, y: -110, width: 160, height: 110, rx: 10, fill: '#6d4c41', stroke: '#3e2723', 'stroke-width': 6 }, body);
    el('rect', { x: -70, y: -100, width: 140, height: 90, rx: 6, fill: '#8d6e63' }, body);
    for (const [x, y] of [[-80, -110], [80, -110], [-80, 0], [80, 0]]) el('circle', { cx: x, cy: y, r: 12, fill: '#ffd54f', stroke: '#f9a825', 'stroke-width': 3 }, body);
    el('circle', { cx: 0, cy: -55, r: 24, fill: '#ffd54f', stroke: '#f9a825', 'stroke-width': 4 }, body);
    el('path', { d: 'M0 -70 l 6 12 h 12 l -10 8 l 4 12 l -12 -7 l -12 7 l 4 -12 l -10 -8 h 12 z', fill: '#f57f17' }, body);
    return { w: 170, h: 115 };
  },
});

// ---------------- Bulle, vignette, maison ----------------

/** Bulle de personnage qui montre un objet (pas de texte à lire). */
export function drawBubble(parent: SVGGElement, x: number, y: number, item: ItemDef, drawItem: (p: SVGGElement, d: ItemDef) => void): SVGGElement {
  const g = el('g', { class: 'bubble-pop anim-center' }, parent);
  place(g, x, y);
  el('path', { d: 'M-100 -95 H 100 Q 120 -95 120 -75 V 55 Q 120 75 100 75 H -30 L -80 115 L -60 75 H -100 Q -120 75 -120 55 V -75 Q -120 -95 -100 -95 Z', fill: '#fff', stroke: '#455a64', 'stroke-width': 6 }, g);
  drawItem(g, { ...item, x: 0, y: 55, scale: item.scale ?? 1 });
  return g;
}

/** Vignette de chemin : un cadre avec une petite scène dessinée. */
export function drawCard(parent: SVGGElement, x: number, y: number, decor: DecorDef[]): { root: SVGGElement; body: SVGGElement } {
  const root = el('g', {}, parent);
  place(root, x, y);
  const body = el('g', { class: 'anim-center' }, root);
  el('rect', { x: -170, y: -130, width: 340, height: 260, rx: 30, fill: '#fff8e1', stroke: '#8d6e63', 'stroke-width': 10 }, body);
  const clipId = `card-${Math.random().toString(36).slice(2, 8)}`;
  const clip = el('clipPath', { id: clipId }, body);
  el('rect', { x: -160, y: -120, width: 320, height: 240, rx: 22 }, clip);
  const inner = el('g', { 'clip-path': `url(#${clipId})` }, body);
  el('rect', { x: -160, y: -120, width: 320, height: 240, fill: '#b3e5fc' }, inner);
  el('rect', { x: -160, y: 40, width: 320, height: 80, fill: '#8bc34a' }, inner);
  drawDecor(inner, decor);
  return { root, body };
}

export const HOUSE_W = 250;
export const HOUSE_H = 250;

/** Maison du village vue d'en haut (3/4), ancrée au milieu du bas. */
export function drawHouse(parent: SVGGElement, x: number, y: number, roof: string, wall: string, sign: string, scale = 1, closed = false): { root: SVGGElement; body: SVGGElement; star: SVGGElement; lock: SVGGElement | null } {
  const root = el('g', {}, parent);
  place(root, x, y, scale);
  const body = el('g', { class: 'anim-base' }, root);
  const r = colorOf(roof);
  el('ellipse', { cx: 0, cy: 6, rx: 135, ry: 20, fill: '#000', opacity: 0.15 }, body);
  el('rect', { x: -110, y: -120, width: 220, height: 120, fill: wall, stroke: shade(wall, -0.35), 'stroke-width': 6 }, body);
  el('path', { d: 'M-135 -110 L -90 -230 H 90 L 135 -110 Z', fill: r, stroke: shade(r, -0.35), 'stroke-width': 6, 'stroke-linejoin': 'round' }, body);
  el('line', { x1: -90, y1: -230, x2: 90, y2: -230, stroke: shade(r, -0.45), 'stroke-width': 8 }, body);
  for (let i = 0; i < 3; i++) el('line', { x1: -120 + i * 8, y1: -140 - i * 30, x2: 120 - i * 8, y2: -140 - i * 30, stroke: shade(r, -0.2), 'stroke-width': 4 }, body);
  el('path', { d: 'M-30 0 V -60 A 30 30 0 0 1 30 -60 V 0 Z', fill: closed ? '#5d4037' : '#8d6e63', stroke: '#3e2723', 'stroke-width': 5 }, body);
  for (const wx of [-75, 75]) el('rect', { x: wx - 20, y: -95, width: 40, height: 36, rx: 4, fill: closed ? '#78909c' : '#fff59d', stroke: '#5d4037', 'stroke-width': 4 }, body);
  // Enseigne ronde au-dessus de la porte
  el('circle', { cx: 0, cy: -150, r: 44, fill: '#fff8e1', stroke: '#5d4037', 'stroke-width': 6 }, body);
  const icon = el('g', { transform: 'translate(0 -150)' }, body);
  drawSignIcon(icon, sign);
  const star = el('g', { transform: 'translate(95 -230)', class: 'house-star' }, body);
  el('path', { d: 'M0 -34 L 10 -10 L 34 -10 L 14 6 L 22 30 L 0 15 L -22 30 L -14 6 L -34 -10 L -10 -10 Z', fill: '#ffd54f', stroke: '#f57f17', 'stroke-width': 4, 'stroke-linejoin': 'round' }, star);
  star.style.display = 'none';
  let lock: SVGGElement | null = null;
  if (closed) {
    lock = el('g', { transform: 'translate(0 -30)', class: 'anim-center' }, body);
    el('path', { d: 'M-14 -10 V -24 A 14 14 0 0 1 14 -24 V -10', stroke: '#9e9e9e', 'stroke-width': 7, fill: 'none' }, lock);
    el('rect', { x: -22, y: -12, width: 44, height: 34, rx: 6, fill: '#ffca28', stroke: '#f57f17', 'stroke-width': 4 }, lock);
  }
  return { root, body, star, lock };
}

/** Petites icônes d'enseigne (centrées en 0,0, ~60 px). */
export function drawSignIcon(g: SVGGElement, sign: string): void {
  switch (sign) {
    case 'unicorn':
      el('path', { d: 'M-20 25 L -10 -10 Q 0 -25 18 -18 L 24 -5 L 8 0 L 6 25 Z', fill: '#f8bbd0', stroke: '#ad1457', 'stroke-width': 3 }, g);
      el('polygon', { points: '4,-22 12,-20 14,-42', fill: '#ffd54f', stroke: '#f9a825', 'stroke-width': 2 }, g);
      el('circle', { cx: 8, cy: -10, r: 3, fill: '#263238' }, g);
      break;
    case 'potion':
      el('circle', { cx: 0, cy: 8, r: 20, fill: '#ce93d8', stroke: '#6a1b9a', 'stroke-width': 3 }, g);
      el('rect', { x: -7, y: -24, width: 14, height: 16, fill: '#e1bee7', stroke: '#6a1b9a', 'stroke-width': 3 }, g);
      break;
    case 'book':
      el('rect', { x: -24, y: -20, width: 48, height: 40, rx: 4, fill: '#ef5350', stroke: '#b71c1c', 'stroke-width': 3 }, g);
      el('line', { x1: 0, y1: -20, x2: 0, y2: 20, stroke: '#b71c1c', 'stroke-width': 3 }, g);
      break;
    case 'bread':
      el('ellipse', { cx: 0, cy: 4, rx: 26, ry: 16, fill: '#ffb74d', stroke: '#e65100', 'stroke-width': 3 }, g);
      break;
    case 'hammer':
      el('rect', { x: -4, y: -10, width: 8, height: 36, fill: '#8d6e63' }, g);
      el('rect', { x: -20, y: -24, width: 40, height: 16, rx: 3, fill: '#90a4ae', stroke: '#455a64', 'stroke-width': 3 }, g);
      break;
    default:
      el('circle', { r: 16, fill: '#bdbdbd' }, g);
  }
}

// ---------------- Boulangerie et forge ----------------

BACKDROPS.bakery = {
  colors: { sky_top: '#ffe0b2', sky_bottom: '#ffcc80', ground: '#d7ccc8' },
  draw(bg, c) {
    for (let x = 0; x < VIEW_W; x += 60) el('rect', { x, y: -400, width: 30, height: 1040, fill: '#ffd59a', opacity: 0.6 }, bg);
    el('path', { d: `M-800 640 H ${VIEW_W + 800} V 1300 H -800 Z`, fill: c.ground }, bg);
    for (let x = -800; x < VIEW_W + 800; x += 80) {
      for (let y = 640; y < 960; y += 80) if (((x + y) / 80) % 2 === 0) el('rect', { x, y, width: 80, height: 80, fill: '#bcaaa4' }, bg);
    }
  },
};

BACKDROPS.forge = {
  colors: { sky_top: '#3e2f2a', sky_bottom: '#5d4037', ground: '#4e403a' },
  draw(bg, c) {
    for (let y = 0; y < 640; y += 70) {
      for (let x = (y / 70) % 2 ? -60 : 0; x < VIEW_W; x += 120) el('rect', { x: x + 4, y: y + 4, width: 112, height: 62, rx: 10, fill: '#5a4640' }, bg);
    }
    el('ellipse', { cx: 1150, cy: 520, rx: 420, ry: 260, fill: '#ff8a65', opacity: 0.12 }, bg);
    el('path', { d: `M-800 640 H ${VIEW_W + 800} V 1300 H -800 Z`, fill: c.ground }, bg);
  },
};

Object.assign(DECOR, {
  oven(parent: SVGGElement, d: DecorDef) {
    const g = g0(parent, d);
    el('path', { d: 'M-170 0 V -220 Q 0 -360 170 -220 V 0 Z', fill: '#d84315', stroke: '#8d3a1a', 'stroke-width': 8 }, g);
    for (let y = -40; y > -220; y -= 45) el('line', { x1: -170, y1: y, x2: 170, y2: y, stroke: '#bf360c', 'stroke-width': 4 }, g);
    el('path', { d: 'M-80 -10 V -110 A 80 70 0 0 1 80 -110 V -10 Z', fill: '#3e2723' }, g);
    el('path', { d: 'M-60 -10 Q 0 -90 60 -10 Z', fill: '#ff9800', class: 'flame' }, g);
  },
  tools(parent: SVGGElement, d: DecorDef) {
    const g = g0(parent, d);
    el('rect', { x: -150, y: -10, width: 300, height: 16, fill: '#6d4c41' }, g);
    for (const [x, len] of [[-110, 120], [-40, 150], [30, 110], [100, 140]]) {
      el('line', { x1: x, y1: 0, x2: x, y2: len, stroke: '#8d6e63', 'stroke-width': 10 }, g);
      el('rect', { x: x - 18, y: len - 10, width: 36, height: 26, rx: 4, fill: '#78909c' }, g);
    }
  },
  breads(parent: SVGGElement, d: DecorDef) {
    const g = g0(parent, d);
    for (const x of [-120, -40, 40, 120]) el('ellipse', { cx: x, cy: -22, rx: 36, ry: 22, fill: '#e0a050', stroke: '#a0632a', 'stroke-width': 4 }, g);
  },
});

Object.assign(DRAWERS, {
  cake(body: SVGGElement, d: ItemDef) {
    const c = colorOf(d.color ?? '#f8bbd0');
    el('ellipse', { cx: 0, cy: 0, rx: 230, ry: 30, fill: '#eceff1', stroke: '#b0bec5', 'stroke-width': 5 }, body);
    el('rect', { x: -190, y: -150, width: 380, height: 150, rx: 20, fill: shade(c, -0.08), stroke: shade(c, -0.4), 'stroke-width': 6 }, body);
    el('ellipse', { cx: 0, cy: -150, rx: 190, ry: 36, fill: c, stroke: shade(c, -0.4), 'stroke-width': 6 }, body);
    el('path', { d: 'M-190 -140 Q -170 -100 -150 -135 Q -130 -100 -110 -135 Q -90 -100 -70 -135 Q -50 -100 -30 -135 Q -10 -100 10 -135 Q 30 -100 50 -135 Q 70 -100 90 -135 Q 110 -100 130 -135 Q 150 -100 170 -135 Q 180 -110 190 -140', fill: '#fff', opacity: 0.85 }, body);
    return { w: 460, h: 190 };
  },
  strawberry(body: SVGGElement) {
    el('path', { d: 'M0 0 Q -38 -40 -26 -62 Q 0 -74 26 -62 Q 38 -40 0 0 Z', fill: '#e53935', stroke: '#b71c1c', 'stroke-width': 4 }, body);
    for (const [x, y] of [[-10, -40], [10, -30], [-4, -20], [12, -52], [-16, -54]]) el('circle', { cx: x, cy: y, r: 2.5, fill: '#ffeb3b' }, body);
    el('path', { d: 'M-22 -64 L 0 -76 L 22 -64 L 8 -60 L 0 -70 L -8 -60 Z', fill: '#43a047' }, body);
    return { w: 70, h: 78 };
  },
  cherry(body: SVGGElement) {
    el('path', { d: 'M-14 -30 Q -6 -70 14 -84 M14 -30 Q 12 -60 14 -84', stroke: '#558b2f', 'stroke-width': 4, fill: 'none' }, body);
    for (const x of [-14, 14]) {
      el('circle', { cx: x, cy: -20, r: 20, fill: '#c62828', stroke: '#7f0000', 'stroke-width': 4 }, body);
      el('circle', { cx: x - 6, cy: -26, r: 5, fill: '#fff', opacity: 0.6 }, body);
    }
    return { w: 76, h: 86 };
  },
  candle(body: SVGGElement, d: ItemDef) {
    const c = colorOf(d.color ?? '#4fc3f7');
    el('rect', { x: -10, y: -80, width: 20, height: 80, rx: 5, fill: c, stroke: shade(c, -0.4), 'stroke-width': 3 }, body);
    for (const y of [-64, -40, -16]) el('line', { x1: -10, y1: y, x2: 10, y2: y - 8, stroke: '#fff', 'stroke-width': 4, opacity: 0.8 }, body);
    el('line', { x1: 0, y1: -80, x2: 0, y2: -92, stroke: '#3e2723', 'stroke-width': 3 }, body);
    return { w: 40, h: 92 };
  },
  flame(body: SVGGElement) {
    const g = el('g', { class: 'flame' }, body);
    el('path', { d: 'M0 0 Q -16 -18 0 -44 Q 16 -18 0 0 Z', fill: '#ffb300' }, g);
    el('path', { d: 'M0 -4 Q -7 -14 0 -28 Q 7 -14 0 -4 Z', fill: '#fff59d' }, g);
    el('circle', { cx: 0, cy: -20, r: 26, fill: '#ffe082', opacity: 0.35 }, g);
    return { w: 40, h: 46 };
  },
  anvil(body: SVGGElement) {
    el('path', { d: 'M-60 0 L -40 -50 H 40 L 60 0 Z', fill: '#455a64', stroke: '#263238', 'stroke-width': 5 }, body);
    el('rect', { x: -26, y: -95, width: 52, height: 50, fill: '#546e7a', stroke: '#263238', 'stroke-width': 5 }, body);
    el('path', { d: 'M-140 -95 Q -150 -125 -110 -130 H 120 V -95 Z', fill: '#607d8b', stroke: '#263238', 'stroke-width': 5 }, body);
    el('line', { x1: -100, y1: -122, x2: 110, y2: -122, stroke: '#90a4ae', 'stroke-width': 4 }, body);
    return { w: 280, h: 135 };
  },
  hammer(body: SVGGElement) {
    // Pivot en bas du manche (pour l'animation de frappe)
    el('rect', { x: -7, y: -150, width: 14, height: 150, rx: 6, fill: '#8d6e63', stroke: '#5d4037', 'stroke-width': 3 }, body);
    el('rect', { x: -40, y: -180, width: 80, height: 40, rx: 6, fill: '#78909c', stroke: '#37474f', 'stroke-width': 4 }, body);
    return { w: 90, h: 180 };
  },
  bellows(body: SVGGElement) {
    el('path', { d: 'M-90 -20 L 60 -70 L 60 30 Z', fill: '#8d6e63', stroke: '#4e342e', 'stroke-width': 5 }, body);
    for (const x of [-40, 0, 30]) el('line', { x1: x, y1: -20 - (x + 90) * 0.33, x2: x, y2: -20 + (x + 90) * 0.33, stroke: '#5d4037', 'stroke-width': 4 }, body);
    el('rect', { x: 60, y: -36, width: 70, height: 32, rx: 6, fill: '#6d4c41', stroke: '#3e2723', 'stroke-width': 4 }, body);
    el('rect', { x: -130, y: -30, width: 44, height: 18, rx: 4, fill: '#90a4ae' }, body);
    return { w: 270, h: 110 };
  },
  forge_fire(body: SVGGElement, d: ItemDef) {
    el('path', { d: 'M-180 0 V -120 H 180 V 0 Z', fill: '#6d4c41', stroke: '#3e2723', 'stroke-width': 8 }, body);
    el('rect', { x: -150, y: -150, width: 300, height: 34, rx: 10, fill: '#3e2723' }, body);
    const c = colorOf(d.color ?? '#ff7043');
    for (const [x, h] of [[-90, 110], [-30, 160], [30, 140], [90, 100]]) {
      el('path', { d: `M${x - 40} -140 Q ${x - 30} ${-140 - h * 0.7} ${x} ${-140 - h} Q ${x + 30} ${-140 - h * 0.7} ${x + 40} -140 Z`, fill: c, 'data-role': 'liquid', class: 'flame' }, body);
    }
    el('ellipse', { cx: 0, cy: -150, rx: 140, ry: 22, fill: '#ffcc80', opacity: 0.7 }, body);
    return { w: 360, h: 300 };
  },
  nail(body: SVGGElement, d: ItemDef) {
    const c = colorOf(d.color ?? '#ffca28');
    el('rect', { x: -6, y: -70, width: 12, height: 62, fill: c, stroke: shade(c, -0.45), 'stroke-width': 3 }, body);
    el('path', { d: 'M-6 -8 L 0 6 L 6 -8 Z', fill: c, stroke: shade(c, -0.45), 'stroke-width': 3 }, body);
    el('rect', { x: -22, y: -82, width: 44, height: 14, rx: 6, fill: c, stroke: shade(c, -0.45), 'stroke-width': 3 }, body);
    return { w: 50, h: 90 };
  },
  horseshoe(body: SVGGElement, d: ItemDef) {
    const c = colorOf(d.color ?? '#b0bec5');
    el('path', { d: 'M-50 0 V -55 A 50 50 0 0 1 50 -55 V 0 H 26 V -55 A 26 26 0 0 0 -26 -55 V 0 Z', fill: c, stroke: shade(c, -0.45), 'stroke-width': 5, 'stroke-linejoin': 'round' }, body);
    for (const [x, y] of [[-38, -30], [38, -30], [-30, -80], [30, -80]]) el('circle', { cx: x, cy: y, r: 4, fill: shade(c, -0.5) }, body);
    return { w: 110, h: 110 };
  },
  crate(body: SVGGElement) {
    el('rect', { x: -110, y: -80, width: 220, height: 80, fill: '#a1887f', stroke: '#5d4037', 'stroke-width': 6 }, body);
    el('line', { x1: -110, y1: -40, x2: 110, y2: -40, stroke: '#795548', 'stroke-width': 4 }, body);
    return { w: 220, h: 80 };
  },
});

/** Personnages ajoutés : boulanger et forgeron (les autres sont dans DRAWERS.npc). */
const baseNpc = DRAWERS.npc;
DRAWERS.npc = (body: SVGGElement, d: ItemDef) => {
  if (d.npc === 'baker') {
    el('path', { d: 'M-85 0 L -70 -220 Q 0 -245 70 -220 L 85 0 Z', fill: '#fafafa', stroke: '#bdbdbd', 'stroke-width': 5 }, body);
    el('path', { d: 'M-55 -170 H 55 L 65 0 H -65 Z', fill: '#ffcc80', stroke: '#e0a050', 'stroke-width': 4 }, body);
    el('circle', { cx: 0, cy: -265, r: 46, fill: SKIN, stroke: '#d7a28f', 'stroke-width': 3 }, body);
    el('path', { d: 'M-30 -248 Q -15 -236 0 -246 Q 15 -236 30 -248', stroke: '#6d4c41', 'stroke-width': 8, fill: 'none', 'stroke-linecap': 'round' }, body);
    for (const x of [-15, 15]) el('circle', { cx: x, cy: -275, r: 5, fill: '#263238' }, body);
    el('path', { d: 'M-12 -232 Q 0 -222 12 -232', stroke: '#5d4037', 'stroke-width': 4, fill: 'none', 'stroke-linecap': 'round' }, body);
    for (const [cx, cy, r] of [[-30, -330, 34], [0, -350, 40], [30, -330, 34]]) el('circle', { cx, cy, r, fill: '#fff', stroke: '#bdbdbd', 'stroke-width': 4 }, body);
    el('rect', { x: -48, y: -320, width: 96, height: 30, fill: '#fff', stroke: '#bdbdbd', 'stroke-width': 4 }, body);
    return { w: 180, h: 390 };
  }
  if (d.npc === 'smith') {
    el('path', { d: 'M-95 0 L -80 -220 Q 0 -250 80 -220 L 95 0 Z', fill: '#546e7a', stroke: '#263238', 'stroke-width': 5 }, body);
    el('path', { d: 'M-60 -190 H 60 L 70 0 H -70 Z', fill: '#795548', stroke: '#4e342e', 'stroke-width': 5 }, body);
    el('circle', { cx: 0, cy: -265, r: 48, fill: SKIN, stroke: '#d7a28f', 'stroke-width': 3 }, body);
    el('path', { d: 'M-44 -255 Q -46 -180 0 -168 Q 46 -180 44 -255 Q 0 -232 -44 -255 Z', fill: '#bf6f2f', stroke: '#8d4a1a', 'stroke-width': 3 }, body);
    for (const x of [-16, 16]) el('circle', { cx: x, cy: -275, r: 5, fill: '#263238' }, body);
    el('path', { d: 'M-46 -290 Q 0 -330 46 -290', stroke: '#bf6f2f', 'stroke-width': 14, fill: 'none', 'stroke-linecap': 'round' }, body);
    return { w: 200, h: 320 };
  }
  return baseNpc(body, d);
};
