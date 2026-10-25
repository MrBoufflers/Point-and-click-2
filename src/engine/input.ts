import { el } from '../render/svg';
import { VIEW_H, VIEW_W } from '../render/stage';

/**
 * Zones de tap calculées à partir de la taille RENDUE à l'écran :
 * au moins `minPx` px CSS, et au moins le dessin agrandi de `padding` (25 %).
 * Les zones sont invisibles ; en cas de chevauchement, la cible dont le centre est le plus proche gagne.
 */
export interface HitTarget {
  id: string;
  /** Centre et taille du dessin, en unités du viewBox. */
  cx: number;
  cy: number;
  w: number;
  h: number;
  enabled: boolean;
  onDown: (pointerId: number) => void;
  onUp?: (pointerId: number) => void;
}

export interface Zone {
  x: number;
  y: number;
  w: number;
  h: number;
}

export class Input {
  private targets = new Map<string, HitTarget>();
  private owners = new Map<number, HitTarget>();
  private scale = 1;
  private offX = 0;
  private offY = 0;
  private raf = 0;

  constructor(
    private svg: SVGSVGElement,
    private cfg: { min_target_px: number; hit_padding: number },
    private debugLayer: SVGGElement | null,
  ) {
    svg.addEventListener('pointerdown', this.down);
    window.addEventListener('pointerup', this.up);
    window.addEventListener('pointercancel', this.up);
    if (debugLayer) this.raf = requestAnimationFrame(this.drawDebug);
  }

  add(t: HitTarget): HitTarget {
    this.targets.set(t.id, t);
    return t;
  }

  remove(id: string): void {
    this.targets.delete(id);
  }

  setEnabled(id: string, enabled: boolean): void {
    const t = this.targets.get(id);
    if (t) t.enabled = enabled;
  }

  disableAll(): void {
    this.targets.forEach((t) => (t.enabled = false));
  }

  dispose(): void {
    this.svg.removeEventListener('pointerdown', this.down);
    window.removeEventListener('pointerup', this.up);
    window.removeEventListener('pointercancel', this.up);
    cancelAnimationFrame(this.raf);
    this.targets.clear();
    this.owners.clear();
  }

  /** Taille d'un pixel CSS en unités du viewBox. */
  private measure(): void {
    const r = this.svg.getBoundingClientRect();
    this.scale = Math.min(r.width / VIEW_W, r.height / VIEW_H) || 1;
    this.offX = r.left + (r.width - VIEW_W * this.scale) / 2;
    this.offY = r.top + (r.height - VIEW_H * this.scale) / 2;
  }

  zoneOf(t: HitTarget): Zone {
    const min = this.cfg.min_target_px / this.scale;
    const grow = 1 + this.cfg.hit_padding;
    const w = Math.max(t.w * grow, min);
    const h = Math.max(t.h * grow, min);
    return { x: t.cx - w / 2, y: t.cy - h / 2, w, h };
  }

  private down = (e: PointerEvent): void => {
    e.preventDefault();
    this.measure();
    const px = (e.clientX - this.offX) / this.scale;
    const py = (e.clientY - this.offY) / this.scale;
    let best: HitTarget | null = null;
    let bestD = Infinity;
    for (const t of this.targets.values()) {
      if (!t.enabled) continue;
      const z = this.zoneOf(t);
      if (px < z.x || px > z.x + z.w || py < z.y || py > z.y + z.h) continue;
      const d = ((px - t.cx) / z.w) ** 2 + ((py - t.cy) / z.h) ** 2;
      if (d < bestD) {
        bestD = d;
        best = t;
      }
    }
    if (best) {
      this.owners.set(e.pointerId, best);
      best.onDown(e.pointerId);
    }
  };

  private up = (e: PointerEvent): void => {
    const t = this.owners.get(e.pointerId);
    if (!t) return;
    this.owners.delete(e.pointerId);
    t.onUp?.(e.pointerId);
  };

  /** ?debug=1 : dessine chaque zone tactile avec sa taille réelle en px CSS. */
  private drawDebug = (): void => {
    const layer = this.debugLayer;
    if (!layer) return;
    this.measure();
    layer.textContent = '';
    const fs = 13 / this.scale;
    for (const t of this.targets.values()) {
      const z = this.zoneOf(t);
      const wPx = Math.round(z.w * this.scale);
      const hPx = Math.round(z.h * this.scale);
      const ok = wPx >= this.cfg.min_target_px && hPx >= this.cfg.min_target_px;
      const color = !t.enabled ? '#9e9e9e' : ok ? '#00e676' : '#ff1744';
      el('rect', {
        x: z.x, y: z.y, width: z.w, height: z.h,
        fill: color, 'fill-opacity': t.enabled ? 0.18 : 0.05,
        stroke: color, 'stroke-width': 2 / this.scale, 'stroke-dasharray': t.enabled ? '' : `${6 / this.scale}`,
      }, layer);
      const label = el('text', { x: z.x + 3 / this.scale, y: z.y + fs, 'font-size': fs, fill: color, 'font-family': 'monospace' }, layer);
      label.textContent = `${t.id} ${wPx}×${hPx}px`;
    }
    const info = el('text', { x: 8, y: VIEW_H - 8, 'font-size': fs, fill: '#fff', 'font-family': 'monospace' }, layer);
    info.textContent = `état: ${document.body.dataset.state ?? '-'} · 1 px CSS = ${(1 / this.scale).toFixed(2)} u · écran ${innerWidth}×${innerHeight}`;
    this.raf = requestAnimationFrame(this.drawDebug);
  };
}
