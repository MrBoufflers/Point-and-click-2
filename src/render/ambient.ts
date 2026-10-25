import type { AmbientDef } from '../types';
import { animate, easeOut, el, lerp, place, tween } from './svg';

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
  for (let i = 0; i < 6; i++) {
    el('ellipse', { cx: 0, cy: -30, rx: 16, ry: 28, fill: i % 2 ? '#f48fb1' : '#ec407a', transform: `rotate(${i * 60})` }, head);
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

/** Le champ « reaction » de la scène choisit le dessin et l'animation. */
export const AMBIENT: Record<string, Factory> = {
  fly_away_and_back: bird,
  shiver: bush,
  blink: owl,
  bloom: flower,
};
