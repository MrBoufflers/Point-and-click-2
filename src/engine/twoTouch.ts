import type { GameSettings } from '../types';
import type { Clock } from './clock';

export type TwoTouchMode = 'together' | 'single' | 'hold' | 'auto';

/**
 * « Touchez tous les deux » sans jamais bloquer :
 * deux pointerId dans la fenêtre → 'together' ;
 * un seul doigt → 'hold' après un appui maintenu, ou 'single' au N-ième tap.
 */
export class TwoTouch {
  private recent: { id: number; t: number }[] = [];
  private held = new Map<number, number>();
  private taps = 0;
  done = false;

  constructor(
    private cfg: GameSettings['gem_touch'],
    private clock: Clock,
    private onDone: (mode: TwoTouchMode) => void,
  ) {}

  down(pointerId: number): void {
    if (this.done) return;
    const now = performance.now();
    this.held.set(pointerId, now);
    this.recent = this.recent.filter((r) => now - r.t <= this.cfg.two_finger_window_ms && r.id !== pointerId);
    this.recent.push({ id: pointerId, t: now });
    if (this.recent.length >= 2) return this.end('together');
    this.taps += 1;
    if (this.taps >= this.cfg.single_taps) return this.end('single');
    this.clock.setTimeout(() => {
      if (this.held.get(pointerId) === now) this.end('hold');
    }, this.cfg.single_hold_ms);
  }

  up(pointerId: number): void {
    this.held.delete(pointerId);
  }

  end(mode: TwoTouchMode): void {
    if (this.done) return;
    this.done = true;
    this.onDone(mode);
  }
}
