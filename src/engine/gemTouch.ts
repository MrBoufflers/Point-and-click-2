import { drawGemShape } from '../render/gems';
import { animate, el, lerp, place, tween } from '../render/svg';
import type { GameSettings, Point } from '../types';
import type { Clock } from './clock';
import type { Input } from './input';
import type { Sfx } from './sfx';
import type { HintTarget, Turn } from './turns/types';

const GEM_R = 110;

export type GemTouchMode = 'together' | 'single' | 'hold' | 'auto';

/**
 * La gemme à toucher à deux.
 * Deux doigts (deux pointerId) dans la fenêtre → fête immédiate.
 * Un seul doigt : la fête vient quand même après un appui maintenu ou plusieurs taps. On ne bloque jamais.
 */
export class GemTouch implements Turn<GemTouchMode> {
  readonly root: SVGGElement;
  /** Groupe réservé aux animations CSS/WAAPI. */
  private anim: SVGGElement;
  /** Dessin mis à l'échelle (attribut transform). */
  private body: SVGGElement;
  private recent: { id: number; t: number }[] = [];
  private held = new Map<number, number>();
  private taps = 0;
  private done = false;
  private finish: ((m: GemTouchMode) => void) | null = null;
  mode: GemTouchMode | null = null;

  constructor(
    parent: SVGGElement,
    private pos: Point,
    private color: string,
    private cfg: GameSettings['gem_touch'],
    private input: Input,
    private sfx: Sfx,
    private clock: Clock,
  ) {
    this.root = el('g', {}, parent);
    place(this.root, pos.x, pos.y);
    this.anim = el('g', { class: 'anim-center' }, this.root);
    this.body = el('g', {}, this.anim);
    el('circle', { r: 2.1, fill: 'url(#halo-white)', class: 'gem-halo anim-center' }, this.body);
    drawGemShape(this.body, color);
    this.body.setAttribute('transform', `scale(${GEM_R})`);
    this.root.style.display = 'none';
  }

  run(): Promise<GemTouchMode> {
    this.root.style.display = '';
    this.sfx.success();
    void animate(this.anim, [{ transform: 'scale(0) rotate(-40deg)' }, { transform: 'scale(1.2) rotate(8deg)', offset: 0.7 }, { transform: 'scale(1) rotate(0)' }], { duration: 800, easing: 'ease-out' });
    this.input.add({
      id: 'gem',
      cx: this.pos.x,
      cy: this.pos.y + 0.12 * GEM_R,
      w: 2 * GEM_R,
      h: 1.75 * GEM_R,
      enabled: true,
      onDown: (id) => this.down(id),
      onUp: (id) => this.held.delete(id),
    });
    return new Promise((resolve) => (this.finish = resolve));
  }

  private down(pointerId: number): void {
    if (this.done) return;
    const now = performance.now();
    this.held.set(pointerId, now);
    this.recent = this.recent.filter((r) => now - r.t <= this.cfg.two_finger_window_ms && r.id !== pointerId);
    this.recent.push({ id: pointerId, t: now });
    // Réaction immédiate au toucher
    this.sfx.tap();
    void animate(this.anim, [{ transform: 'scale(1)' }, { transform: 'scale(1.12) rotate(-6deg)' }, { transform: 'scale(1) rotate(0)' }], { duration: 350, easing: 'ease-out' });
    if (this.recent.length >= 2) return this.end('together');
    this.taps += 1;
    if (this.taps >= this.cfg.single_taps) return this.end('single');
    this.clock.setTimeout(() => {
      if (this.held.get(pointerId) === now) this.end('hold');
    }, this.cfg.single_hold_ms);
  }

  private end(mode: GemTouchMode): void {
    if (this.done) return;
    this.done = true;
    this.mode = mode;
    this.input.remove('gem');
    this.finish?.(mode);
  }

  /** Vol de la gemme jusqu'à son creux dans le bandeau. */
  async flyTo(to: Point, toScale: number): Promise<void> {
    const halo = this.body.querySelector('.gem-halo');
    halo?.remove();
    const from = this.pos;
    await tween(1300, (k) => {
      place(this.root, lerp(from.x, to.x, k), lerp(from.y, to.y, k) - Math.sin(k * Math.PI) * 120, 1);
      this.body.setAttribute('transform', `scale(${lerp(GEM_R, toScale, k)}) rotate(${k * 360})`);
    });
  }

  hintTarget(): HintTarget | null {
    if (this.done) return null;
    return {
      x: this.pos.x,
      y: this.pos.y,
      top: this.pos.y - 0.75 * GEM_R,
      mark: (on) => this.anim.classList.toggle('hint-sparkle', on),
    };
  }

  autoSolve(): void {
    this.end('auto');
  }

  dispose(): void {
    this.input.remove('gem');
  }

  get gemColor(): string {
    return this.color;
  }
}
