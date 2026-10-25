import type { AmbientDef } from '../types';
import { animate, colorOf, easeOut, el, lerp, place, shade, tween } from './svg';

/** Élément de décor qui réagit au tap (sans lien avec l'énigme). */
export interface Ambient {
  cx: number;
  cy: number;
  w: number;
  h: number;
  react(): void;
}

type Factory = (parent: SVGGElement, def: AmbientDef) => Ambient;

const bird: Factory = (parent, def) => {
  const s = def.scale ?? 1;
  const root = el('g', {}, parent);
  place(root, def.x, def.y, s);
  const body = el('g', {}, root);
  el('path', { d: 'M-34 6 L -62 -6 L -58 14 Z', fill: '#0277bd' }, body);
  el('ellipse', { cx: 0, cy: 6, rx: 36, ry: 25, fill: '#29b6f6' }, body);
  el('ellipse', { cx: 4, cy: 14, rx: 22, ry: 14, fill: '#e1f5fe' }, body);
  el('circle', { cx: 28, cy: -14, r: 19, fill: '#29b6f6' }, body);
  el('circle', { cx: 34, cy: -18, r: 4.5, fill: '#263238' }, body);
  el('path', { d: 'M45 -14 L 60 -9 L 45 -5 Z', fill: '#ff9800' }, body);
  el('path', { d: 'M-4 30 L -6 40 M 8 30 L 6 40', stroke: '#ff9800', 'stroke-width': 4, 'stroke-linecap': 'round' }, body);
  const wing = el('ellipse', { cx: -6, cy: 0, rx: 22, ry: 14, fill: '#0288d1', class: 'bird-wing anim-center' }, body);
  let busy = false;
  return {
    cx: def.x, cy: def.y, w: 120 * s, h: 90 * s,
    react() {
      if (busy) return;
      busy = true;
      wing.classList.add('flapping');
      const far = { x: def.x + 520, y: def.y - 380 };
      void tween(1100, (k) => place(root, lerp(def.x, far.x, k), lerp(def.y, far.y, k), s), easeOut)
        .then(() => new Promise((r) => window.setTimeout(r, 1500)))
        .then(() => tween(1400, (k) => place(root, lerp(far.x, def.x, k), lerp(far.y, def.y, k) - Math.sin(k * Math.PI) * 60, s, k < 0.97)))
        .then(() => {
          place(root, def.x, def.y, s);
          wing.classList.remove('flapping');
          busy = false;
        });
    },
  };
};

const bush: Factory = (parent, def) => {
  const s = def.scale ?? 1;
  const root = el('g', {}, parent);
  place(root, def.x, def.y, s);
  const body = el('g', { class: 'anim-base' }, root);
  for (const [cx, cy, r, fill] of [[-55, 20, 50, '#2e7d32'], [55, 20, 50, '#2e7d32'], [0, -10, 65, '#43a047'], [-25, -35, 22, '#81c784']] as const) {
    el('circle', { cx, cy, r, fill }, body);
  }
  for (const [cx, cy] of [[-40, 0], [30, -30], [50, 25]]) el('circle', { cx, cy, r: 8, fill: '#f06292' }, body);
  return {
    cx: def.x, cy: def.y, w: 210 * s, h: 140 * s,
    react() {
      void animate(body, [
        { transform: 'rotate(0) scale(1)' }, { transform: 'rotate(-5deg) scale(1.05,0.96)' }, { transform: 'rotate(5deg) scale(0.97,1.04)' },
        { transform: 'rotate(-3deg)' }, { transform: 'rotate(3deg)' }, { transform: 'rotate(0) scale(1)' },
      ], { duration: 650, easing: 'ease-in-out' });
      for (let i = 0; i < 3; i++) {
        const leaf = el('ellipse', { rx: 9, ry: 5, fill: '#66bb6a' }, parent);
        const x0 = def.x + (i - 1) * 50 * s;
        const y0 = def.y - 40 * s;
        void tween(1200 + i * 200, (k) => {
          leaf.setAttribute('transform', `translate(${x0 + Math.sin(k * 9 + i) * 25} ${y0 - Math.sin(k * Math.PI) * 50 + k * 140}) rotate(${k * 300})`);
          leaf.setAttribute('opacity', String(1 - k));
        }, (t) => t).then(() => leaf.remove());
      }
    },
  };
};

const owl: Factory = (parent, def) => {
  const s = def.scale ?? 1;
  const root = el('g', {}, parent);
  place(root, def.x, def.y, s);
  const body = el('g', { class: 'anim-base' }, root);
  el('path', { d: 'M-40 -40 L -30 -70 L -14 -48 Z M40 -40 L 30 -70 L 14 -48 Z', fill: '#6d4c41' }, body);
  el('ellipse', { cx: 0, cy: 0, rx: 44, ry: 56, fill: '#8d6e63' }, body);
  el('ellipse', { cx: 0, cy: 20, rx: 28, ry: 30, fill: '#d7ccc8' }, body);
  for (const x of [-18, 18]) {
    el('circle', { cx: x, cy: -18, r: 16, fill: '#fff', stroke: '#5d4037', 'stroke-width': 3 }, body);
    el('circle', { cx: x, cy: -18, r: 7, fill: '#263238' }, body);
  }
  const lids = [-18, 18].map((x) => el('ellipse', { cx: x, cy: -18, rx: 17.5, ry: 17.5, fill: '#8d6e63', class: 'anim-top', style: 'transform: scaleY(0)' }, body));
  el('path', { d: 'M-6 -4 L 0 8 L 6 -4 Z', fill: '#ffb300' }, body);
  el('path', { d: 'M-16 56 l -6 8 M-10 56 l 0 9 M10 56 l 0 9 M16 56 l 6 8', stroke: '#ffb300', 'stroke-width': 4, 'stroke-linecap': 'round' }, body);
  el('path', { d: 'M-80 62 L 80 58', stroke: '#5d4037', 'stroke-width': 14, 'stroke-linecap': 'round' }, root);
  return {
    cx: def.x, cy: def.y, w: 110 * s, h: 130 * s,
    react() {
      for (const lid of lids) {
        void animate(lid, [
          { transform: 'scaleY(0)' }, { transform: 'scaleY(1)', offset: 0.2 }, { transform: 'scaleY(0)', offset: 0.4 },
          { transform: 'scaleY(1)', offset: 0.6 }, { transform: 'scaleY(0)' },
        ], { duration: 900 });
      }
      void animate(body, [{ transform: 'rotate(0)' }, { transform: 'rotate(-10deg)' }, { transform: 'rotate(8deg)' }, { transform: 'rotate(0)' }], { duration: 900, easing: 'ease-in-out' });
    },
  };
};

const flower: Factory = (parent, def) => {
  const s = def.scale ?? 1;
  const root = el('g', {}, parent);
  place(root, def.x, def.y, s);
  el('path', { d: 'M0 75 Q -8 30 0 -20', stroke: '#558b2f', 'stroke-width': 8, fill: 'none' }, root);
  el('ellipse', { cx: -18, cy: 40, rx: 18, ry: 8, fill: '#7cb342', transform: 'rotate(-30 -18 40)' }, root);
  el('ellipse', { cx: 18, cy: 20, rx: 18, ry: 8, fill: '#7cb342', transform: 'rotate(30 18 20)' }, root);
  const headPos = el('g', { transform: 'translate(0 -30)' }, root);
  const head = el('g', { class: 'anim-center' }, headPos);
  head.style.transform = 'scale(0.4)';
  const petal = colorOf(def.color ?? '#ec407a');
  for (let i = 0; i < 6; i++) {
    el('ellipse', { cx: 0, cy: -30, rx: 16, ry: 28, fill: i % 2 ? shade(petal, 0.35) : petal, stroke: shade(petal, -0.2), 'stroke-width': 2, transform: `rotate(${i * 60})` }, head);
  }
  el('circle', { r: 16, fill: '#ffeb3b', stroke: '#f9a825', 'stroke-width': 3 }, head);
  let open = false;
  let closeTimer = 0;
  const setOpen = (o: boolean) => {
    open = o;
    const from = o ? 'scale(0.4) rotate(0deg)' : 'scale(1) rotate(60deg)';
    const to = o ? 'scale(1) rotate(60deg)' : 'scale(0.4) rotate(0deg)';
    head.style.transform = to;
    void animate(head, [{ transform: from }, ...(o ? [{ transform: 'scale(1.25) rotate(40deg)' }] : []), { transform: to }], { duration: o ? 700 : 900, easing: 'ease-out' });
  };
  return {
    cx: def.x, cy: def.y, w: 110 * s, h: 170 * s,
    react() {
      window.clearTimeout(closeTimer);
      setOpen(!open);
      if (open) closeTimer = window.setTimeout(() => setOpen(false), 6000);
    },
  };
};


const wiggle = (body: Element, deg = 10, ms = 700) =>
  animate(body, [{ transform: 'rotate(0)' }, { transform: `rotate(${-deg}deg)` }, { transform: `rotate(${deg}deg)` }, { transform: `rotate(${-deg / 2}deg)` }, { transform: 'rotate(0)' }], { duration: ms, easing: 'ease-in-out' });

const frog: Factory = (parent, def) => {
  const s = def.scale ?? 1;
  const root = el('g', {}, parent);
  place(root, def.x, def.y, s);
  const body = el('g', { class: 'anim-base' }, root);
  el('ellipse', { cx: 0, cy: 0, rx: 46, ry: 30, fill: '#66bb6a', stroke: '#2e7d32', 'stroke-width': 4 }, body);
  el('ellipse', { cx: 0, cy: 10, rx: 30, ry: 16, fill: '#c5e1a5' }, body);
  for (const x of [-20, 20]) {
    el('circle', { cx: x, cy: -28, r: 15, fill: '#66bb6a', stroke: '#2e7d32', 'stroke-width': 4 }, body);
    el('circle', { cx: x, cy: -30, r: 8, fill: '#fff' }, body);
    el('circle', { cx: x + 2, cy: -30, r: 4.5, fill: '#263238' }, body);
  }
  el('path', { d: 'M-16 -6 Q 0 6 16 -6', stroke: '#1b5e20', 'stroke-width': 4, fill: 'none', 'stroke-linecap': 'round' }, body);
  let busy = false;
  return {
    cx: def.x, cy: def.y - 10 * s, w: 110 * s, h: 90 * s,
    react() {
      if (busy) return;
      busy = true;
      void animate(body, [
        { transform: 'translateY(0) scale(1)' }, { transform: 'translateY(0) scale(1.2,0.8)', offset: 0.15 },
        { transform: 'translateY(-110px) scale(0.9,1.15) rotate(-10deg)', offset: 0.5 }, { transform: 'translateY(0) scale(1.15,0.85)', offset: 0.85 },
        { transform: 'translateY(0) scale(1)' },
      ], { duration: 800, easing: 'ease-in-out' }).then(() => (busy = false));
    },
  };
};

const fish: Factory = (parent, def) => {
  const s = def.scale ?? 1;
  const root = el('g', {}, parent);
  place(root, def.x, def.y, s);
  const ripple = el('ellipse', { cx: 0, cy: 10, rx: 50, ry: 12, fill: 'none', stroke: '#e3f6ff', 'stroke-width': 4, opacity: 0.8, class: 'anim-center' }, root);
  const body = el('g', {}, root);
  const c = colorOf(def.color ?? 'orange');
  el('path', { d: 'M30 0 L 58 -20 L 58 20 Z', fill: shade(c, -0.15) }, body);
  el('ellipse', { cx: 0, cy: 0, rx: 40, ry: 24, fill: c, stroke: shade(c, -0.4), 'stroke-width': 4 }, body);
  el('circle', { cx: -20, cy: -5, r: 5, fill: '#263238' }, body);
  body.style.display = 'none';
  let busy = false;
  return {
    cx: def.x, cy: def.y, w: 120 * s, h: 80 * s,
    react() {
      if (busy) return;
      busy = true;
      body.style.display = '';
      void animate(ripple, [{ transform: 'scale(0.6)', opacity: 1 }, { transform: 'scale(1.6)', opacity: 0 }], { duration: 900 });
      void tween(1000, (k) => {
        body.setAttribute('transform', `translate(${lerp(-60, 60, k)} ${-Math.sin(k * Math.PI) * 150}) rotate(${lerp(-40, 40, k)})`);
      }, (t) => t).then(() => {
        body.style.display = 'none';
        void animate(ripple, [{ transform: 'scale(0.6)', opacity: 1 }, { transform: 'scale(1.6)', opacity: 0 }], { duration: 900 });
        busy = false;
      });
    },
  };
};

const butterfly: Factory = (parent, def) => {
  const s = def.scale ?? 1;
  const root = el('g', {}, parent);
  place(root, def.x, def.y, s);
  const body = el('g', {}, root);
  const c = colorOf(def.color ?? '#ab47bc');
  for (const side of [-1, 1]) {
    const wing = el('g', { class: 'bfly-wing anim-center' }, body);
    el('ellipse', { cx: side * 22, cy: -12, rx: 22, ry: 26, fill: c, stroke: shade(c, -0.4), 'stroke-width': 3 }, wing);
    el('ellipse', { cx: side * 18, cy: 18, rx: 15, ry: 17, fill: shade(c, 0.3), stroke: shade(c, -0.4), 'stroke-width': 3 }, wing);
    el('circle', { cx: side * 24, cy: -14, r: 7, fill: '#fff', opacity: 0.8 }, wing);
  }
  el('ellipse', { cx: 0, cy: 0, rx: 6, ry: 28, fill: '#4e342e' }, body);
  el('path', { d: 'M-3 -26 Q -10 -44 -16 -46 M3 -26 Q 10 -44 16 -46', stroke: '#4e342e', 'stroke-width': 3, fill: 'none' }, body);
  let busy = false;
  return {
    cx: def.x, cy: def.y, w: 100 * s, h: 90 * s,
    react() {
      if (busy) return;
      busy = true;
      root.classList.add('fluttering');
      void tween(2400, (k) => {
        const a = k * Math.PI * 2;
        place(root, def.x + Math.sin(a) * 160, def.y - Math.sin(a * 2) * 70 - Math.sin(k * Math.PI) * 60, s);
      }, (t) => t).then(() => {
        place(root, def.x, def.y, s);
        root.classList.remove('fluttering');
        busy = false;
      });
    },
  };
};

const bat: Factory = (parent, def) => {
  const s = def.scale ?? 1;
  const root = el('g', {}, parent);
  place(root, def.x, def.y, s);
  const body = el('g', { class: 'anim-center' }, root);
  el('line', { x1: 0, y1: -60, x2: 0, y2: -34, stroke: '#2d2240', 'stroke-width': 5 }, body);
  const wings = el('g', { class: 'bat-wings anim-center' }, body);
  el('path', { d: 'M-8 -10 Q -40 -40 -70 -14 Q -55 -10 -50 4 Q -38 -6 -28 8 Q -18 -2 -8 10 Z', fill: '#5e35b1', stroke: '#311b92', 'stroke-width': 3 }, wings);
  el('path', { d: 'M8 -10 Q 40 -40 70 -14 Q 55 -10 50 4 Q 38 -6 28 8 Q 18 -2 8 10 Z', fill: '#5e35b1', stroke: '#311b92', 'stroke-width': 3 }, wings);
  el('ellipse', { cx: 0, cy: 0, rx: 18, ry: 26, fill: '#7e57c2', stroke: '#311b92', 'stroke-width': 3 }, body);
  el('path', { d: 'M-14 -20 L -10 -38 L -2 -24 Z M14 -20 L 10 -38 L 2 -24 Z', fill: '#7e57c2' }, body);
  for (const x of [-7, 7]) el('circle', { cx: x, cy: -8, r: 4.5, fill: '#fff59d' }, body);
  wings.style.transform = 'scaleX(0.35)';
  let busy = false;
  return {
    cx: def.x, cy: def.y - 10 * s, w: 110 * s, h: 100 * s,
    react() {
      if (busy) return;
      busy = true;
      void animate(wings, [{ transform: 'scaleX(0.35)' }, { transform: 'scaleX(1)', offset: 0.15 }, { transform: 'scaleX(0.6)', offset: 0.3 }, { transform: 'scaleX(1)', offset: 0.45 }, { transform: 'scaleX(0.6)', offset: 0.6 }, { transform: 'scaleX(1)', offset: 0.75 }, { transform: 'scaleX(0.35)' }], { duration: 1300 });
      void wiggle(body, 18, 1300).then(() => (busy = false));
    },
  };
};

const crystal: Factory = (parent, def) => {
  const s = def.scale ?? 1;
  const root = el('g', {}, parent);
  place(root, def.x, def.y, s);
  const c = colorOf(def.color ?? '#4dd0e1');
  const glow = el('circle', { cx: 0, cy: -60, r: 80, fill: c, opacity: 0.15, class: 'anim-center' }, root);
  const body = el('g', { class: 'anim-base' }, root);
  for (const [x, h, r] of [[-30, 90, -15], [0, 140, 0], [32, 100, 14]]) {
    el('polygon', { points: `${x - 16},0 ${x - 14},${-h * 0.75} ${x},${-h} ${x + 14},${-h * 0.75} ${x + 16},0`, fill: c, stroke: shade(c, -0.4), 'stroke-width': 4, transform: `rotate(${r} ${x} 0)` }, body);
    el('line', { x1: x - 4, y1: -10, x2: x - 6, y2: -h * 0.7, stroke: '#fff', 'stroke-width': 3, opacity: 0.6, transform: `rotate(${r} ${x} 0)` }, body);
  }
  return {
    cx: def.x, cy: def.y - 70 * s, w: 110 * s, h: 140 * s,
    react() {
      void animate(glow, [{ transform: 'scale(1)', opacity: 0.15 }, { transform: 'scale(1.6)', opacity: 0.6 }, { transform: 'scale(1)', opacity: 0.15 }], { duration: 900, easing: 'ease-out' });
      void animate(body, [{ transform: 'scale(1)' }, { transform: 'scale(1.1,0.92)' }, { transform: 'scale(0.96,1.06)' }, { transform: 'scale(1)' }], { duration: 600 });
    },
  };
};

const snail: Factory = (parent, def) => {
  const s = def.scale ?? 1;
  const root = el('g', {}, parent);
  place(root, def.x, def.y, s);
  const head = el('g', { class: 'anim-base' }, root);
  el('path', { d: 'M-50 0 Q -60 -40 -40 -46 Q -30 -40 -30 -10 L 40 -6 L 40 0 Z', fill: '#ffcc80', stroke: '#e65100', 'stroke-width': 3 }, head);
  el('path', { d: 'M-46 -44 L -54 -70 M-38 -44 L -36 -72', stroke: '#e65100', 'stroke-width': 3 }, head);
  el('circle', { cx: -54, cy: -72, r: 5, fill: '#263238' }, head);
  el('circle', { cx: -36, cy: -74, r: 5, fill: '#263238' }, head);
  const shell = el('g', { class: 'anim-base' }, root);
  el('circle', { cx: 10, cy: -38, r: 36, fill: '#a1887f', stroke: '#5d4037', 'stroke-width': 5 }, shell);
  el('path', { d: 'M10 -38 m -6 0 a 6 6 0 1 1 12 0 a 12 12 0 1 1 -24 0 a 20 20 0 1 1 40 0', stroke: '#5d4037', 'stroke-width': 4, fill: 'none' }, shell);
  let busy = false;
  return {
    cx: def.x, cy: def.y - 38 * s, w: 120 * s, h: 90 * s,
    react() {
      if (busy) return;
      busy = true;
      void animate(head, [{ transform: 'translateX(0) scale(1)', opacity: 1 }, { transform: 'translateX(40px) scale(0.2)', opacity: 0, offset: 0.25 }, { transform: 'translateX(40px) scale(0.2)', opacity: 0, offset: 0.75 }, { transform: 'translateX(0) scale(1)', opacity: 1 }], { duration: 2400, easing: 'ease-in-out' });
      void wiggle(shell, 6, 600).then(() => window.setTimeout(() => (busy = false), 1800));
    },
  };
};

const cloud: Factory = (parent, def) => {
  const s = def.scale ?? 1;
  const root = el('g', {}, parent);
  place(root, def.x, def.y, s);
  const body = el('g', { class: 'anim-center' }, root);
  for (const [cx, cy, r] of [[-60, 0, 42], [0, -22, 58], [62, 0, 42], [0, 14, 40]]) el('circle', { cx, cy, r, fill: '#fff' }, body);
  for (const x of [-18, 18]) el('circle', { cx: x, cy: -6, r: 5, fill: '#546e7a' }, body);
  el('path', { d: 'M-12 12 Q 0 22 12 12', stroke: '#546e7a', 'stroke-width': 4, fill: 'none', 'stroke-linecap': 'round' }, body);
  return {
    cx: def.x, cy: def.y, w: 200 * s, h: 110 * s,
    react() {
      void animate(body, [{ transform: 'scale(1)' }, { transform: 'scale(1.18,0.86)' }, { transform: 'scale(0.92,1.1)' }, { transform: 'scale(1)' }], { duration: 650, easing: 'ease-in-out' });
      for (let i = 0; i < 6; i++) {
        const drop = el('ellipse', { rx: 5, ry: 9, fill: '#81d4fa' }, parent);
        const x0 = def.x + (i - 2.5) * 26 * s;
        const y0 = def.y + 40 * s;
        void tween(700 + i * 60, (k) => {
          drop.setAttribute('transform', `translate(${x0} ${y0 + k * 220})`);
          drop.setAttribute('opacity', String(1 - k));
        }, (t) => t * t).then(() => drop.remove());
      }
    },
  };
};

const snowman: Factory = (parent, def) => {
  const s = def.scale ?? 1;
  const root = el('g', {}, parent);
  place(root, def.x, def.y, s);
  const body = el('g', { class: 'anim-base' }, root);
  el('circle', { cx: 0, cy: -50, r: 50, fill: '#fff', stroke: '#b0bec5', 'stroke-width': 4 }, body);
  el('circle', { cx: 0, cy: -128, r: 36, fill: '#fff', stroke: '#b0bec5', 'stroke-width': 4 }, body);
  for (const y of [-70, -45]) el('circle', { cx: 0, cy: y, r: 5, fill: '#37474f' }, body);
  for (const x of [-12, 12]) el('circle', { cx: x, cy: -136, r: 5, fill: '#37474f' }, body);
  el('polygon', { points: '0,-128 30,-122 0,-118', fill: '#ff7043' }, body);
  el('path', { d: 'M-40 -100 Q 0 -86 40 -100', stroke: '#e53935', 'stroke-width': 12, fill: 'none', 'stroke-linecap': 'round' }, body);
  const hat = el('g', {}, body);
  el('rect', { x: -32, y: -166, width: 64, height: 9, rx: 3, fill: '#37474f' }, hat);
  el('rect', { x: -22, y: -204, width: 44, height: 40, rx: 4, fill: '#37474f' }, hat);
  return {
    cx: def.x, cy: def.y - 90 * s, w: 110 * s, h: 190 * s,
    react() {
      void wiggle(body, 8, 700);
      void animate(hat, [{ transform: 'translateY(0)' }, { transform: 'translateY(-50px) rotate(20deg)', offset: 0.4 }, { transform: 'translateY(0)', offset: 0.8 }, { transform: 'translateY(0)' }], { duration: 900, easing: 'ease-in-out' });
    },
  };
};

/** Le champ « reaction » de la scène choisit le dessin et l'animation. */
export const AMBIENT: Record<string, Factory> = {
  fly_away_and_back: bird,
  shiver: bush,
  blink: owl,
  bloom: flower,
  jump: frog,
  splash: fish,
  flutter: butterfly,
  flap: bat,
  shine: crystal,
  hide: snail,
  puff: cloud,
  wobble: snowman,
};
