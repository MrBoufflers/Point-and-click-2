import { AMBIENT } from '../render/ambient';
import { Basket } from '../render/basket';
import { confetti } from '../render/confetti';
import { drawBackdrop } from '../render/backdrop';
import { GemBar } from '../render/gems';
import { Lumi } from '../render/lumi';
import { Portraits } from '../render/portraits';
import { createStage, VIEW_H, VIEW_W, type Stage } from '../render/stage';
import { animate, el } from '../render/svg';
import type { Prefs } from '../settings';
import type { GameSettings, PlayerId, SceneDef, TextByPlayer, TurnDefBase } from '../types';
import { Clock } from './clock';
import { GemTouch } from './gemTouch';
import { HintTimer, type HintLevel } from './hints';
import { Input } from './input';
import type { Sfx } from './sfx';
import { TURN_TYPES } from './turns';
import type { HintTarget, Turn, TurnContext } from './turns/types';
import type { SayOptions, Voice } from './voice';

/** États du tableau : intro → <joueur>_turn (un par tour) → gem_appears → celebration → end. */
export type SceneState = 'intro' | `${PlayerId}_turn` | 'gem_appears' | 'celebration' | 'end';

export interface RunnerOptions {
  container: HTMLElement;
  scene: SceneDef;
  settings: GameSettings;
  prefs: Prefs;
  voice: Voice;
  sfx: Sfx;
  debug: boolean;
  /** Gemmes déjà gagnées dans les tableaux précédents. */
  filledGems?: string[];
  /** 'next' : à la fin, Lumi attend la flèche « suivant » ; 'restart' : Lumi s'endort (fin de partie). */
  endMode?: 'next' | 'restart';
  onState?: (s: SceneState) => void;
}

const ABORT = Symbol('abort');

export function resolveText(t: TextByPlayer, player: PlayerId): string {
  if (typeof t === 'string') return t;
  return t[player] ?? Object.values(t)[0] ?? '';
}

/** Machine à états d'un tableau. Un nouveau SceneRunner = une partie neuve. */
export class SceneRunner {
  state: SceneState = 'intro';
  private disposed = false;
  private clock = new Clock();
  private stage: Stage;
  private input: Input;
  private lumi: Lumi;
  private basket: Basket | null;
  private portraits: Portraits;
  private gemBar: GemBar;
  private ambientIds: string[] = [];
  private turns: { turn: Turn; def: TurnDefBase; player: PlayerId; ctx: TurnContext }[] = [];
  private hints: HintTimer | null = null;
  private marked: HintTarget | null = null;
  private memory: TurnContext['memory'] = {};

  constructor(private o: RunnerOptions) {
    const { scene, settings } = o;
    this.stage = createStage(o.container);
    const L = this.stage.layers;
    drawBackdrop(L, scene);
    this.input = new Input(this.stage.svg, settings.touch, o.debug ? L.debug : null);
    this.gemBar = new GemBar(L.hud, settings.level_gems, (o.filledGems ?? []).filter((g) => g !== scene.gem));
    this.portraits = new Portraits(L.hud, settings.players);
    this.basket = scene.basket ? new Basket(L.basket, scene.basket, scene.basket.style) : null;
    this.lumi = new Lumi(L.lumi, scene.lumi.home, { x: VIEW_W + 120, y: -80 });

    for (const def of scene.ambient_hotspots) {
      const make = AMBIENT[def.reaction];
      if (!make) {
        console.warn(`Réaction de décor inconnue : ${def.reaction}`);
        continue;
      }
      const a = make(L.ambient, def);
      const id = `amb_${def.id}`;
      this.ambientIds.push(id);
      this.input.add({ id, cx: a.cx, cy: a.cy, w: a.w, h: a.h, enabled: true, onDown: () => { o.sfx.tap(); a.react(); } });
    }

    // Les objets de tous les tours sont dessinés dès le début (inactifs), comme un vrai décor.
    scene.turns.forEach((raw, i) => {
      const make = TURN_TYPES[raw.type];
      if (!make) throw new Error(`Type de tour inconnu : ${raw.type}`);
      const player = this.playerFor(raw.player);
      // Champs propres au joueur qui joue ce tour (ex. la lettre de son prénom).
      const def = { ...raw, ...(raw.by_player?.[player] ?? {}) } as TurnDefBase;
      const ctx = this.makeContext(player, i);
      this.turns.push({ turn: make(ctx, def), def, player, ctx });
    });
  }

  /** L'ordre de passage choisi par le parent échange les rôles des deux premiers joueurs. */
  private playerFor(scenePlayer: PlayerId): PlayerId {
    const first = this.o.scene.turns[0]?.player;
    const wanted = this.o.prefs.first_player;
    if (!first || first === wanted) return scenePlayer;
    if (scenePlayer === first) return wanted;
    if (scenePlayer === wanted) return first;
    return scenePlayer;
  }

  private makeContext(player: PlayerId, turnIndex: number): TurnContext {
    return {
      player,
      turnIndex,
      scene: this.o.scene,
      settings: this.o.settings,
      layers: this.stage.layers,
      input: this.input,
      sfx: this.o.sfx,
      voice: this.o.voice,
      basket: this.basket,
      clock: this.clock,
      text: (t) => resolveText(t, player),
      say: (t, opts) => this.say(t, opts),
      progress: () => this.progress(),
      memory: this.memory,
    };
  }

  private say(text: string, opts?: SayOptions): Promise<void> {
    if (this.disposed || !text) return Promise.resolve();
    return this.o.voice.say(text, opts);
  }

  /** Attend une promesse puis interrompt tout si la partie a été abandonnée entre-temps. */
  private async step<T>(p: Promise<T>): Promise<T> {
    const v = await p;
    if (this.disposed) throw ABORT;
    return v;
  }

  private setState(s: SceneState): void {
    this.state = s;
    document.body.dataset.state = s;
    this.o.onState?.(s);
  }

  start(): void {
    this.run().catch((e) => {
      if (e !== ABORT) console.error(e);
    });
  }

  private async run(): Promise<void> {
    const { scene } = this.o;
    // --- intro --- (la première phrase part tout de suite : on est encore dans le geste « ▶ »)
    this.setState('intro');
    const intro = this.say(scene.lines.intro, { prompt: true });
    void this.lumi.home();
    await this.step(intro);
    await this.step(this.clock.wait(400));

    // --- un état par tour ---
    for (const t of this.turns) {
      this.setState(`${t.player}_turn`);
      this.portraits.setActive(t.player);
      const prompt = resolveText(t.def.prompt, t.player);
      void this.say(prompt, { prompt: true });
      const result = await this.step(this.withHints(t.turn, prompt));
      t.turn.dispose();
      if (typeof result === 'number') this.memory.previousTurnCount = result;
      await this.step(this.clock.wait(500));
    }
    this.portraits.setActive(null);

    // --- gem_appears ---
    this.setState('gem_appears');
    const gem = new GemTouch(this.stage.layers.gem, scene.gem_position, scene.gem, this.o.settings.gem_touch, this.input, this.o.sfx, this.clock);
    void this.say(scene.lines.gem_touch, { prompt: true });
    const mode = await this.step(this.withHints(gem, scene.lines.gem_touch));

    // --- celebration ---
    this.setState('celebration');
    this.o.sfx.party();
    const L = this.stage.layers;
    confetti(L.fx, scene.gem_position, mode === 'together' ? 140 : 100);
    this.clock.setTimeout(() => confetti(L.fx, { x: 250, y: 820 }, 60), 300);
    this.clock.setTimeout(() => confetti(L.fx, { x: 1350, y: 820 }, 60), 450);
    const line = this.say(scene.lines.celebration);
    await this.step(this.clock.wait(600));
    await this.step(gem.flyTo(this.gemBar.slotPosition(scene.gem), this.gemBar.slotScale));
    this.gemBar.fill(scene.gem);
    this.o.sfx.success();
    await this.step(line);
    await this.step(this.clock.wait(800));

    // --- end ---
    this.setState('end');
    this.input.disableAll();
    const dim = el('rect', { x: -800, y: -400, width: VIEW_W + 1600, height: VIEW_H + 800, fill: '#0b1026', opacity: 0 }, L.dim);
    if (this.o.endMode === 'next') {
      // Pause entre deux tableaux : Lumi attend près de la grosse flèche.
      void animate(dim, [{ opacity: 0 }, { opacity: 0.35 }], { duration: 1200, fill: 'forwards' });
      void this.lumi.flyTo(800, 250, 1200);
      if (scene.lines.next) void this.say(scene.lines.next, { prompt: true });
    } else {
      void animate(dim, [{ opacity: 0 }, { opacity: 0.55 }], { duration: 1500, fill: 'forwards' });
      void this.lumi.sleep(scene.lumi.sleep_spot ?? { x: 800, y: 250 });
    }
  }

  /** Lance un tour avec l'aide progressive de Lumi ; se résout quand le tour est réussi. */
  private async withHints<T>(turn: Turn<T>, prompt: string): Promise<T> {
    const { scene } = this.o;
    this.hints = new HintTimer(this.clock, scene.hint_delays_s, scene.auto_solve_after_s, (level) => this.onHint(level, turn, prompt));
    this.hints.start();
    try {
      return await turn.run();
    } finally {
      this.hints.stop();
      this.hints = null;
      this.clearMark();
      void this.lumi.home();
    }
  }

  private onHint<T>(level: HintLevel, turn: Turn<T>, prompt: string): void {
    const target = turn.hintTarget();
    if (level === 0) {
      void this.say(prompt, { prompt: true });
    } else if (level === 1) {
      if (target) void this.lumi.hoverNear(target);
    } else if (level === 2) {
      if (target) {
        void this.lumi.landOn(target);
        this.clearMark();
        target.mark(true);
        this.marked = target;
      }
    } else {
      // Personne n'a trouvé : Lumi montre la réponse et fait l'action, pour que le tableau se termine toujours.
      if (this.o.scene.lines.auto_help) void this.say(this.o.scene.lines.auto_help);
      turn.autoSolve();
    }
  }

  private clearMark(): void {
    this.marked?.mark(false);
    this.marked = null;
  }

  /** Action réussie : l'aide repart de zéro et Lumi retourne à sa place. */
  private progress(): void {
    this.hints?.reset();
    this.clearMark();
    void this.lumi.home();
  }

  setSpeaking(b: boolean): void {
    this.lumi.setSpeaking(b);
  }

  dispose(): void {
    this.disposed = true;
    this.clock.dispose();
    this.hints?.stop();
    this.o.voice.clear();
    this.o.voice.resetMemory();
    this.lumi.dispose();
    this.turns.forEach((t) => t.turn.dispose());
    this.input.dispose();
    this.o.container.textContent = '';
  }
}
