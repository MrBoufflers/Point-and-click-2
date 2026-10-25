import type { Clock } from './clock';

/** 0 = répéter la consigne, 1 = Lumi volette près de la cible, 2 = Lumi se pose et la cible scintille, 'auto' = Lumi aide. */
export type HintLevel = 0 | 1 | 2 | 'auto';

/**
 * Aide progressive : les délais partent de la dernière action réussie.
 * reset() à chaque réussite ; stop() en fin de tour.
 */
export class HintTimer {
  private ids: number[] = [];

  constructor(
    private clock: Clock,
    private delaysS: number[],
    private autoSolveS: number | undefined,
    private onLevel: (level: HintLevel) => void,
  ) {}

  start(): void {
    this.stop();
    this.delaysS.forEach((s, i) => {
      const level = Math.min(i, 2) as 0 | 1 | 2;
      this.ids.push(this.clock.setTimeout(() => this.onLevel(level), s * 1000));
    });
    // Filet de sécurité : le tableau se termine même si personne ne touche l'écran.
    if (this.autoSolveS && this.autoSolveS > 0) {
      this.ids.push(this.clock.setTimeout(() => this.onLevel('auto'), this.autoSolveS * 1000));
    }
  }

  reset(): void {
    this.start();
  }

  stop(): void {
    this.ids.forEach((id) => this.clock.clearTimeout(id));
    this.ids = [];
  }
}
