import { el } from './svg';

const COLORS = ['#e53935', '#fdd835', '#43a047', '#1e88e5', '#fb8c00', '#ec407a', '#fff'];

/** Pluie de confettis (s'auto-détruit). */
export function confetti(layer: SVGGElement, origin: { x: number; y: number }, n = 90): void {
  const g = el('g', {}, layer);
  const parts = Array.from({ length: n }, (_, i) => ({
    el: el('rect', { x: -7, y: -11, width: 14, height: 22, rx: 3, fill: COLORS[i % COLORS.length] }, g),
    x: origin.x + (Math.random() - 0.5) * 120,
    y: origin.y,
    vx: (Math.random() - 0.5) * 1300,
    vy: -400 - Math.random() * 900,
    r: Math.random() * 360,
    vr: (Math.random() - 0.5) * 900,
  }));
  const t0 = performance.now();
  let last = t0;
  const frame = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    for (const p of parts) {
      p.vy += 1300 * dt;
      p.vx *= 0.985;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.r += p.vr * dt;
      p.el.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${p.r.toFixed(0)})`);
    }
    if (now - t0 < 4000 && g.isConnected) requestAnimationFrame(frame);
    else g.remove();
  };
  requestAnimationFrame(frame);
}
