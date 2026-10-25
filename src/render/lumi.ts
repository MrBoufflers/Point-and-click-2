import type { Point } from '../types';
import { el, lerp, place, tween } from './svg';

type Mode = 'hover' | 'landed' | 'sleep';

/** Lumi : petite lumière jaune qui volette, parle et guide. */
export class Lumi {
  readonly root: SVGGElement;
  private bx: number;
  private by: number;
  private mode: Mode = 'hover';
  private raf = 0;
  private moveToken = 0;

  constructor(parent: SVGGElement, private homePos: Point, start: Point) {
    this.bx = start.x;
    this.by = start.y;
    this.root = el('g', { class: 'lumi' }, parent);
    const inner = el('g', { class: 'lumi-inner anim-center' }, this.root);
    el('circle', { r: 72, fill: 'url(#halo-yellow)', class: 'lumi-halo anim-center' }, inner);
    el('ellipse', { cx: -26, cy: -16, rx: 20, ry: 32, fill: '#fff', opacity: 0.6, class: 'lumi-wing wing-l', transform: 'rotate(-35 -26 -16)' }, inner);
    el('ellipse', { cx: 26, cy: -16, rx: 20, ry: 32, fill: '#fff', opacity: 0.6, class: 'lumi-wing wing-r', transform: 'rotate(35 26 -16)' }, inner);
    el('circle', { r: 28, fill: '#fff176', stroke: '#fbc02d', 'stroke-width': 3 }, inner);
    el('ellipse', { cx: -9, cy: -4, rx: 4.5, ry: 6, fill: '#5d4037', class: 'lumi-eye anim-center' }, inner);
    el('ellipse', { cx: 9, cy: -4, rx: 4.5, ry: 6, fill: '#5d4037', class: 'lumi-eye anim-center' }, inner);
    el('circle', { cx: -16, cy: 6, r: 5, fill: '#f48fb1', opacity: 0.6 }, inner);
    el('circle', { cx: 16, cy: 6, r: 5, fill: '#f48fb1', opacity: 0.6 }, inner);
    el('path', { d: 'M-7 9 Q 0 15 7 9', stroke: '#5d4037', 'stroke-width': 2.5, fill: 'none', 'stroke-linecap': 'round' }, inner);
    const z = el('g', { class: 'lumi-zzz' }, this.root);
    for (const [i, r] of [6, 9, 12].entries()) el('circle', { cx: 30 + i * 14, cy: -30 - i * 18, r, fill: '#fff', opacity: 0.7, style: `animation-delay:${i * 0.6}s` }, z);
    this.raf = requestAnimationFrame(this.loop);
  }

  private loop = (now: number): void => {
    const t = now / 1000;
    const amp = this.mode === 'hover' ? 12 : this.mode === 'landed' ? 3 : 1.5;
    place(this.root, this.bx + Math.sin(t * 1.7) * amp * 1.4, this.by + Math.sin(t * 2.3) * amp);
    this.raf = requestAnimationFrame(this.loop);
  };

  flyTo(x: number, y: number, ms = 900): Promise<void> {
    const token = ++this.moveToken;
    const sx = this.bx;
    const sy = this.by;
    const lift = Math.min(60, Math.hypot(x - sx, y - sy) * 0.15);
    return tween(ms, (k) => {
      if (token !== this.moveToken) return;
      this.bx = lerp(sx, x, k);
      this.by = lerp(sy, y, k) - Math.sin(k * Math.PI) * lift;
    });
  }

  home(): Promise<void> {
    this.wake();
    this.mode = 'hover';
    return this.flyTo(this.homePos.x, this.homePos.y);
  }

  /** Volette près d'une cible (2e niveau d'aide). */
  hoverNear(p: Point & { top: number }): Promise<void> {
    this.wake();
    this.mode = 'hover';
    const side = p.x > 1300 ? -1 : 1;
    return this.flyTo(p.x + side * 110, p.top - 40);
  }

  /** Se pose sur une cible (3e niveau d'aide). */
  landOn(p: Point & { top: number }): Promise<void> {
    this.wake();
    this.mode = 'landed';
    return this.flyTo(p.x, p.top - 10);
  }

  sleep(p: Point): Promise<void> {
    this.mode = 'sleep';
    this.root.classList.add('sleeping');
    return this.flyTo(p.x, p.y, 1600);
  }

  private wake(): void {
    this.root.classList.remove('sleeping');
  }

  setSpeaking(b: boolean): void {
    this.root.classList.toggle('speaking', b);
  }

  dispose(): void {
    cancelAnimationFrame(this.raf);
    this.moveToken++;
  }
}
