import { drawBackdrop } from '../../render/backdrop';
import { Bag, type RewardLook } from '../../render/bag';
import { Lumi } from '../../render/lumi';
import { Portraits } from '../../render/portraits';
import { createStage, VIEW_W, type Stage } from '../../render/stage';
import type { Prefs } from '../../settings';
import type { GameSettings, PlayerId, Point, StepPlayer, TextByPlayer, ViewDef } from '../../types';
import { Clock } from '../clock';
import { HintTimer, type HintLevel } from '../hints';
import { Input } from '../input';
import { resolveText } from '../sceneRunner';
import type { Sfx } from '../sfx';
import type { HintTarget } from '../turns/types';
import type { SayOptions, Voice } from '../voice';

export const ABORT = Symbol('abort');

/** Ce que le jeu fournit aux écrans du village. */
export interface VillageCommon {
  container: HTMLElement;
  settings: GameSettings;
  prefs: Prefs;
  voice: Voice;
  sfx: Sfx;
  debug: boolean;
  /** Cases du sac et récompenses déjà gagnées. */
  bagIds: string[];
  rewards: string[];
  look: RewardLook;
  onState?: (s: string) => void;
}

/** Une action à faire, avec ce qu'il faut pour que Lumi aide. */
export interface Interactive<T> {
  done: Promise<T>;
  hintTarget(): HintTarget | null;
  autoSolve?(): void;
}

/** Socle commun : scène SVG, Lumi, portraits, sac, voix, aide progressive. */
export class PlaceBase {
  protected disposed = false;
  protected clock = new Clock();
  protected stage: Stage;
  protected input: Input;
  protected lumi: Lumi;
  protected portraits: Portraits;
  protected bag: Bag;
  private marked: HintTarget | null = null;
  protected hints: HintTimer | null = null;

  constructor(protected c: VillageCommon, view: ViewDef, lumiHome: Point) {
    this.stage = createStage(c.container);
    drawBackdrop(this.stage.layers, view);
    this.input = new Input(this.stage.svg, c.settings.touch, c.debug ? this.stage.layers.debug : null);
    this.bag = new Bag(this.stage.layers.hud, c.bagIds, c.look);
    c.rewards.forEach((r) => this.bag.fill(r));
    this.portraits = new Portraits(this.stage.layers.hud, c.settings.players);
    this.lumi = new Lumi(this.stage.layers.lumi, lumiHome, { x: VIEW_W + 120, y: -80 });
  }

  protected say(text: string, opts?: SayOptions): Promise<void> {
    if (this.disposed || !text) return Promise.resolve();
    return this.c.voice.say(text, opts);
  }

  protected async step<T>(p: Promise<T>): Promise<T> {
    const v = await p;
    if (this.disposed) throw ABORT;
    return v;
  }

  protected setState(s: string): void {
    document.body.dataset.state = s;
    this.c.onState?.(s);
  }

  /** Ordre de passage choisi par le parent. */
  protected order(): [PlayerId, PlayerId] {
    const ids = this.c.settings.players.map((p) => p.id);
    const first = ids.includes(this.c.prefs.first_player) ? this.c.prefs.first_player : ids[0];
    return [first, ids.find((i) => i !== first) ?? first];
  }

  protected resolvePlayer(p: StepPlayer | undefined, ctx?: PlayerId): PlayerId | 'both' {
    if (!p) return ctx ?? 'both';
    if (p === 'first') return this.order()[0];
    if (p === 'second') return this.order()[1];
    return p;
  }

  /** Texte pour un joueur (ou pour le 1er joueur si c'est « les deux »). */
  protected text(t: TextByPlayer | undefined, player: PlayerId | 'both'): string {
    if (!t) return '';
    // Un texte peut prévoir une version « both » (les deux enfants ensemble)
    if (player === 'both' && typeof t === 'object' && t.both) return t.both;
    return resolveText(t, player === 'both' ? this.order()[0] : player);
  }

  /** Attend une action avec l'aide progressive de Lumi (répéter, voleter, se poser, aider). */
  protected async withHints<T>(action: Interactive<T>, prompt: string | (() => string), delays: number[], autoS?: number): Promise<T> {
    this.hints = new HintTimer(this.clock, delays, action.autoSolve ? autoS : undefined, (level: HintLevel) => {
      const target = action.hintTarget();
      if (level === 0) void this.say(typeof prompt === 'function' ? prompt() : prompt, { prompt: true });
      else if (level === 1) {
        if (target) void this.lumi.hoverNear(target);
      } else if (level === 2) {
        if (target) {
          void this.lumi.landOn(target);
          this.clearMark();
          target.mark(true);
          this.marked = target;
        }
      } else action.autoSolve?.();
    });
    this.hints.start();
    try {
      return await this.step(action.done);
    } finally {
      this.hints?.stop();
      this.hints = null;
      this.clearMark();
      void this.lumi.home();
    }
  }

  /** Action réussie : l'aide repart de zéro. */
  protected progress(): void {
    this.hints?.reset();
    this.clearMark();
    void this.lumi.home();
  }

  private clearMark(): void {
    this.marked?.mark(false);
    this.marked = null;
  }

  setSpeaking(b: boolean): void {
    this.lumi.setSpeaking(b);
  }

  dispose(): void {
    this.disposed = true;
    this.clock.dispose();
    this.hints?.stop();
    this.c.voice.clear();
    this.c.voice.resetMemory();
    this.lumi.dispose();
    this.input.dispose();
    this.c.container.textContent = '';
  }
}
