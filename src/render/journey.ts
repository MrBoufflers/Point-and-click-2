/**
 * Dessins du chapitre 3 (le grand voyage) : Pilou le dragon-nuage, le troll, le pont qui parle,
 * les nénuphars musicaux, les nuages-marches et le château arc-en-ciel.
 */
import type { DecorDef, ItemDef } from '../types';
import { BACKDROPS, DECOR } from './backdrop';
import { drawGemShape } from './gems';
import { DRAWERS } from './items';
import { colorOf, el, place, shade } from './svg';
import { VIEW_W } from './stage';

const g0 = (parent: SVGGElement, d: DecorDef) => {
  const g = el('g', {}, parent);
  place(g, d.x, d.y, d.scale ?? 1);
  return g;
};

BACKDROPS.sky = {
  colors: { sky_top: '#7e57c2', sky_bottom: '#f8bbd0', ground: '#ffffff' },
  draw(bg) {
    for (let i = 0; i < 12; i++) {
      const x = (i * 331) % 1700 - 50;
      const y = 120 + ((i * 173) % 700);
      for (const [dx, dy, r] of [[-50, 0, 40], [0, -18, 55], [55, 0, 40]]) el('circle', { cx: x + dx, cy: y + dy, r, fill: '#fff', opacity: 0.35 }, bg);
    }
    for (let i = 0; i < 30; i++) el('circle', { cx: (i * 211) % VIEW_W, cy: (i * 97) % 500, r: 2 + (i % 3), fill: '#fff', class: 'firefly' }, bg);
  },
};

BACKDROPS.castle = {
  colors: { sky_top: '#64b5f6', sky_bottom: '#fce4ec', ground: '#ffffff' },
  draw(bg) {
    ['#e53935', '#fb8c00', '#fdd835', '#43a047', '#1e88e5', '#8e24aa'].forEach((c, i) => {
      el('path', { d: `M${-100 + i * 30} 900 A ${900 - i * 30} ${700 - i * 30} 0 0 1 ${1700 - i * 30} 900`, stroke: c, 'stroke-width': 30, fill: 'none', opacity: 0.5 }, bg);
    });
    for (const [x, y, s] of [[150, 760, 1.4], [500, 840, 1.2], [1100, 840, 1.3], [1450, 760, 1.5], [800, 880, 1.6]]) {
      for (const [dx, dy, r] of [[-70, 0, 55], [0, -25, 75], [75, 0, 55]]) el('circle', { cx: x + dx * s, cy: y + dy * s, r: r * s, fill: '#fff' }, bg);
    }
  },
};

Object.assign(DECOR, {
  castle(parent: SVGGElement, d: DecorDef) {
    const g = g0(parent, d);
    const tower = (x: number, w: number, h: number, c: string, roof: string) => {
      el('rect', { x: x - w / 2, y: -h, width: w, height: h, fill: c, stroke: shade(c, -0.3), 'stroke-width': 5 }, g);
      el('polygon', { points: `${x - w / 2 - 14},${-h} ${x + w / 2 + 14},${-h} ${x},${-h - w * 1.2}`, fill: roof, stroke: shade(roof, -0.3), 'stroke-width': 5 }, g);
      el('rect', { x: x - 12, y: -h + 40, width: 24, height: 34, rx: 12, fill: '#fff59d', stroke: shade(c, -0.3), 'stroke-width': 3 }, g);
      el('path', { d: `M${x} ${-h - w * 1.2} v -40 l 34 12 l -34 12`, fill: '#ffeb3b', stroke: '#f9a825', 'stroke-width': 3 }, g);
    };
    tower(-230, 110, 300, '#f8bbd0', '#ab47bc');
    tower(230, 110, 300, '#b3e5fc', '#42a5f5');
    tower(-110, 130, 400, '#fff9c4', '#ef5350');
    tower(110, 130, 400, '#c8e6c9', '#fb8c00');
    tower(0, 160, 500, '#e1bee7', '#ffca28');
    el('rect', { x: -260, y: -170, width: 520, height: 170, fill: '#fce4ec', stroke: '#ad7a99', 'stroke-width': 6 }, g);
    el('path', { d: 'M-60 0 V -100 A 60 60 0 0 1 60 -100 V 0 Z', fill: '#8d6e63', stroke: '#5d4037', 'stroke-width': 6 }, g);
  },
  cloud_floor(parent: SVGGElement, d: DecorDef) {
    const g = g0(parent, d);
    for (let i = -8; i <= 8; i++) el('circle', { cx: i * 110, cy: (i % 2) * 20, r: 90, fill: '#fff' }, g);
  },
});

Object.assign(DRAWERS, {
  /** Pilou, petit dragon-nuage (tourné vers la droite). */
  dragon(body: SVGGElement, d: ItemDef) {
    const c = colorOf(d.color ?? '#b3e5fc');
    const line = shade(c, -0.4);
    const g = el('g', d.flip ? { transform: 'scale(-1 1)' } : {}, body);
    el('path', { d: 'M-70 -60 Q -150 -40 -140 -110 Q -120 -80 -90 -95', fill: c, stroke: line, 'stroke-width': 4 }, g);
    const wing = el('g', { class: 'dragon-wing anim-base' }, g);
    el('path', { d: 'M-20 -140 Q -60 -230 10 -210 Q 0 -180 30 -170 Z', fill: shade(c, 0.4), stroke: line, 'stroke-width': 4 }, wing);
    el('ellipse', { cx: 0, cy: -80, rx: 85, ry: 70, fill: c, stroke: line, 'stroke-width': 5 }, g);
    el('ellipse', { cx: 15, cy: -65, rx: 50, ry: 45, fill: '#fff', opacity: 0.8 }, g);
    for (const x of [-40, 30]) el('ellipse', { cx: x, cy: -8, rx: 24, ry: 14, fill: c, stroke: line, 'stroke-width': 4 }, g);
    el('circle', { cx: 75, cy: -160, r: 60, fill: c, stroke: line, 'stroke-width': 5 }, g);
    el('path', { d: 'M45 -210 L 40 -250 L 65 -218 Z M95 -212 L 105 -250 L 112 -208 Z', fill: '#fff59d', stroke: '#f9a825', 'stroke-width': 3 }, g);
    for (const x of [60, 100]) {
      el('circle', { cx: x, cy: -168, r: 13, fill: '#fff' }, g);
      el('circle', { cx: x + 3, cy: -166, r: 8, fill: '#263238' }, g);
      el('circle', { cx: x + 6, cy: -170, r: 3, fill: '#fff' }, g);
    }
    el('ellipse', { cx: 45, cy: -140, rx: 10, ry: 6, fill: '#f48fb1', opacity: 0.7 }, g);
    el('ellipse', { cx: 118, cy: -140, rx: 10, ry: 6, fill: '#f48fb1', opacity: 0.7 }, g);
    el('path', { d: 'M68 -135 Q 82 -122 98 -135', stroke: line, 'stroke-width': 4, fill: 'none', 'stroke-linecap': 'round' }, g);
    for (const [x, y] of [[-40, -150], [-80, -120], [-60, -170]]) el('circle', { cx: x, cy: y, r: 12, fill: shade(c, 0.5), stroke: line, 'stroke-width': 3 }, g);
    return { w: 260, h: 250 };
  },

  /** Le troll gourmand (gentil !). `scale` plus petit pour son petit frère. */
  troll(body: SVGGElement, d: ItemDef) {
    const c = colorOf(d.color ?? '#81c784');
    const line = shade(c, -0.45);
    for (const x of [-40, 40]) el('rect', { x: x - 22, y: -70, width: 44, height: 70, rx: 18, fill: shade(c, -0.1), stroke: line, 'stroke-width': 4 }, body);
    el('ellipse', { cx: 0, cy: -150, rx: 110, ry: 100, fill: c, stroke: line, 'stroke-width': 5 }, body);
    el('ellipse', { cx: 0, cy: -130, rx: 70, ry: 65, fill: shade(c, 0.35) }, body);
    el('path', { d: 'M-50 -110 Q 0 -90 50 -110', stroke: '#8d6e63', 'stroke-width': 10, fill: 'none' }, body);
    el('circle', { cx: 0, cy: -290, r: 78, fill: c, stroke: line, 'stroke-width': 5 }, body);
    for (const s of [-1, 1]) el('ellipse', { cx: s * 78, cy: -300, rx: 22, ry: 34, fill: c, stroke: line, 'stroke-width': 4, transform: `rotate(${s * 25} ${s * 78} -300)` }, body);
    for (const x of [-28, 28]) {
      el('circle', { cx: x, cy: -315, r: 15, fill: '#fff' }, body);
      el('circle', { cx: x, cy: -313, r: 8, fill: '#263238' }, body);
    }
    el('ellipse', { cx: 0, cy: -285, rx: 22, ry: 18, fill: shade(c, -0.15), stroke: line, 'stroke-width': 3 }, body);
    el('path', { d: 'M-40 -255 Q 0 -225 40 -255', stroke: line, 'stroke-width': 5, fill: '#fff', 'stroke-linecap': 'round' }, body);
    el('path', { d: 'M-24 -252 L -18 -238 L -12 -249 Z M12 -249 L 18 -238 L 24 -252 Z', fill: '#fff' }, body);
    el('path', { d: 'M-30 -362 Q -20 -390 0 -368 Q 20 -392 30 -362', stroke: shade(c, -0.3), 'stroke-width': 8, fill: 'none', 'stroke-linecap': 'round' }, body);
    return { w: 260, h: 380 };
  },

  plate(body: SVGGElement) {
    el('ellipse', { cx: 0, cy: -16, rx: 95, ry: 24, fill: '#fafafa', stroke: '#90a4ae', 'stroke-width': 5 }, body);
    el('ellipse', { cx: 0, cy: -18, rx: 62, ry: 14, fill: 'none', stroke: '#cfd8dc', 'stroke-width': 3 }, body);
    return { w: 200, h: 50 };
  },

  slice(body: SVGGElement, d: ItemDef) {
    const c = colorOf(d.color ?? '#f8bbd0');
    el('path', { d: 'M-40 0 L 40 0 L 40 -40 L -40 -55 Z', fill: shade(c, -0.08), stroke: shade(c, -0.4), 'stroke-width': 4, 'stroke-linejoin': 'round' }, body);
    el('path', { d: 'M-40 -55 L 40 -40 L 50 -48 L -30 -64 Z', fill: c, stroke: shade(c, -0.4), 'stroke-width': 4, 'stroke-linejoin': 'round' }, body);
    el('line', { x1: -40, y1: -28, x2: 40, y2: -20, stroke: '#fff', 'stroke-width': 6 }, body);
    el('circle', { cx: 6, cy: -64, r: 9, fill: '#e53935' }, body);
    return { w: 100, h: 75 };
  },

  /** Nénuphar musical : la fleur prend la couleur de la note. */
  pad(body: SVGGElement, d: ItemDef) {
    const c = colorOf(d.color ?? '#f48fb1');
    el('path', { d: 'M0 -40 A 95 40 0 1 1 -10 -40 L 0 0 Z', fill: '#66bb6a', stroke: '#2e7d32', 'stroke-width': 5, transform: 'translate(0 0)' }, body);
    el('ellipse', { cx: 0, cy: -40, rx: 95, ry: 40, fill: '#66bb6a', stroke: '#2e7d32', 'stroke-width': 5 }, body);
    el('path', { d: 'M0 -40 L 60 -60', stroke: '#2e7d32', 'stroke-width': 4 }, body);
    for (let i = 0; i < 6; i++) {
      el('ellipse', { cx: 0, cy: -78, rx: 14, ry: 28, fill: i % 2 ? shade(c, 0.3) : c, stroke: shade(c, -0.35), 'stroke-width': 3, transform: `rotate(${i * 60} 0 -60)` }, body);
    }
    el('circle', { cx: 0, cy: -60, r: 12, fill: '#fff59d', stroke: '#f9a825', 'stroke-width': 3 }, body);
    return { w: 200, h: 110 };
  },

  /** Nuage-marche pour monter au château. */
  cloud_step(body: SVGGElement) {
    for (const [cx, cy, r] of [[-70, -30, 42], [0, -50, 58], [70, -30, 42], [0, -18, 44]]) el('circle', { cx, cy, r, fill: '#fff', stroke: '#e1bee7', 'stroke-width': 4 }, body);
    return { w: 230, h: 110 };
  },

  /** Le pont qui parle : yeux et bouche (data-role pour les animer). */
  bridge_face(body: SVGGElement) {
    el('path', { d: 'M-480 0 V -140 Q 0 -330 480 -140 V 0 H 330 Q 0 -170 -330 0 Z', fill: '#a1887f', stroke: '#5d4037', 'stroke-width': 8, 'stroke-linejoin': 'round' }, body);
    for (let i = -4; i <= 4; i++) el('line', { x1: i * 100, y1: -150 - 60 * (1 - (i / 5) ** 2), x2: i * 100, y2: -120 - 30 * (1 - (i / 5) ** 2), stroke: '#795548', 'stroke-width': 5 }, body);
    for (const x of [-90, 90]) {
      el('ellipse', { cx: x, cy: -205, rx: 30, ry: 26, fill: '#fff', stroke: '#5d4037', 'stroke-width': 5 }, body);
      el('circle', { cx: x + 4, cy: -200, r: 13, fill: '#263238' }, body);
    }
    el('path', { d: 'M-60 -150 Q 0 -110 60 -150', stroke: '#4e342e', 'stroke-width': 9, fill: '#6d4c41', 'stroke-linecap': 'round', class: 'bridge-mouth anim-center' }, body);
    el('path', { d: 'M-130 -250 Q -90 -270 -50 -248 M50 -248 Q 90 -270 130 -250', stroke: '#5d4037', 'stroke-width': 9, fill: 'none', 'stroke-linecap': 'round' }, body);
    return { w: 960, h: 300 };
  },

  /** Glace grise sur la rivière endormie (disparaît avec la potion). */
  ice(body: SVGGElement) {
    el('path', { d: 'M-1000 -130 Q -300 -170 0 -140 T 1000 -140 V 0 Q 300 20 0 -5 T -1000 5 Z', fill: '#cfd8dc', opacity: 0.92 }, body);
    el('path', { d: 'M-600 -80 l 60 -30 l 40 25 l 70 -35 M200 -60 l 50 -40 l 50 30 M-200 -40 l 40 20 l 60 -30', stroke: '#90a4ae', 'stroke-width': 5, fill: 'none' }, body);
    for (const x of [-500, -100, 300, 650]) el('text', { x, y: -60, 'font-size': 40, fill: '#78909c', 'font-family': 'Verdana, sans-serif' }, body).textContent = 'z';
    return { w: 2000, h: 160 };
  },

  /** Carte de mémoire (dos) — la face est dessinée par l'étape. */
  card_back(body: SVGGElement) {
    el('rect', { x: -85, y: -180, width: 170, height: 170, rx: 22, fill: '#7e57c2', stroke: '#4527a0', 'stroke-width': 6 }, body);
    el('path', { d: 'M0 -130 l 12 26 h 28 l -22 18 l 8 28 l -26 -16 l -26 16 l 8 -28 l -22 -18 h 28 z', fill: '#ffd54f' }, body);
    return { w: 170, h: 170 };
  },
});

// ---------------- Prologue : le vieux parchemin ----------------

Object.assign(DRAWERS, {
  parchment(body: SVGGElement) {
    el('rect', { x: -470, y: -560, width: 940, height: 540, rx: 16, fill: '#f3e2b8', stroke: '#b08d57', 'stroke-width': 6 }, body);
    el('rect', { x: -440, y: -530, width: 880, height: 480, rx: 10, fill: 'none', stroke: '#c9a66b', 'stroke-width': 3, 'stroke-dasharray': '14 10' }, body);
    for (const y of [-575, -25]) {
      el('rect', { x: -500, y: y - 18, width: 1000, height: 36, rx: 18, fill: '#c9a66b', stroke: '#8d6e63', 'stroke-width': 5 }, body);
      for (const x of [-500, 500]) el('circle', { cx: x, cy: y, r: 22, fill: '#a1784a', stroke: '#6d4c41', 'stroke-width': 5 }, body);
    }
    return { w: 1000, h: 600 };
  },
  gem(body: SVGGElement, d: ItemDef) {
    const g = el('g', { transform: 'translate(0 -60) scale(55)' }, body);
    drawGemShape(g, d.color ?? 'red');
    return { w: 110, h: 120 };
  },
  door_icon(body: SVGGElement) {
    el('path', { d: 'M-90 0 V -150 A 90 90 0 0 1 90 -150 V 0 Z', fill: '#8d6e63', stroke: '#4e342e', 'stroke-width': 8 }, body);
    el('path', { d: 'M-60 0 V -140 A 60 60 0 0 1 60 -140 V 0 Z', fill: '#ffe082', class: 'door-glow' }, body);
    el('line', { x1: 0, y1: -200, x2: 0, y2: 0, stroke: '#4e342e', 'stroke-width': 6 }, body);
    return { w: 180, h: 240 };
  },
});

