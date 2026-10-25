export const SVG_NS = 'http://www.w3.org/2000/svg';

type Attrs = Record<string, string | number>;

export function el<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Attrs = {},
  parent?: Element | null,
): SVGElementTagNameMap[K] {
  const e = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  if (parent) parent.appendChild(e);
  return e;
}

/** Place un groupe (la position passe par l'attribut transform ; les animations, par un groupe intérieur). */
export function place(g: SVGElement, x: number, y: number, s = 1, flipX = false): void {
  g.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${(flipX ? -s : s).toFixed(3)} ${s.toFixed(3)})`);
}

export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
export const easeOut = (t: number) => 1 - (1 - t) ** 3;

/** Interpolation pilotée par requestAnimationFrame. */
export function tween(ms: number, step: (k: number) => void, ease = easeInOut): Promise<void> {
  return new Promise((resolve) => {
    const t0 = performance.now();
    const frame = (now: number) => {
      const t = Math.min(1, (now - t0) / ms);
      step(ease(t));
      if (t < 1) requestAnimationFrame(frame);
      else resolve();
    };
    requestAnimationFrame(frame);
  });
}

/** Animation ponctuelle (Web Animations API), sans jamais lever d'erreur. */
export function animate(target: Element, keyframes: Keyframe[], opts: KeyframeAnimationOptions): Promise<void> {
  if (typeof (target as Element & { animate?: unknown }).animate !== 'function') return Promise.resolve();
  try {
    return target.animate(keyframes, opts).finished.then(
      () => undefined,
      () => undefined,
    );
  } catch {
    return Promise.resolve();
  }
}

export const PALETTE: Record<string, string> = {
  red: '#e53935',
  blue: '#1e88e5',
  yellow: '#fdd835',
  green: '#43a047',
  orange: '#fb8c00',
  purple: '#8e24aa',
  pink: '#ec407a',
  white: '#fafafa',
};

export const colorOf = (c: string) => PALETTE[c] ?? c;

/** Éclaircit (amt > 0) ou assombrit (amt < 0) une couleur #rrggbb. */
export function shade(hex: string, amt: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) =>
    Math.round(amt >= 0 ? c + (255 - c) * amt : c * (1 + amt)),
  );
  return `#${ch.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}
