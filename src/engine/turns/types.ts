import type { Basket } from '../../render/basket';
import type { Layers } from '../../render/stage';
import type { GameSettings, PlayerId, Point, SceneDef, TextByPlayer, TurnDefBase } from '../../types';
import type { Clock } from '../clock';
import type { Input } from '../input';
import type { Sfx } from '../sfx';
import type { SayOptions, Voice } from '../voice';

/** Ce qu'un tour reçoit du moteur. */
export interface TurnContext {
  player: PlayerId;
  scene: SceneDef;
  settings: GameSettings;
  layers: Layers;
  input: Input;
  sfx: Sfx;
  voice: Voice;
  basket: Basket;
  clock: Clock;
  /** Résout un texte « par joueur » pour le joueur de ce tour. */
  text(t: TextByPlayer): string;
  /** Lumi parle (file d'attente). Muet si le tableau a été abandonné. */
  say(text: string, opts?: SayOptions): Promise<void>;
  /** Signale une action réussie : remet l'aide progressive à zéro. */
  progress(): void;
  /** Mémoire partagée entre les tours d'un tableau. */
  memory: { previousTurnCount?: number };
}

/** Bonne cible désignée par l'aide (centre + haut du dessin, pour que Lumi s'y pose). */
export interface HintTarget extends Point {
  top: number;
  mark(on: boolean): void;
}

export interface Turn<R = number | void> {
  /** Active le tour ; se résout quand il est réussi (avec un résultat éventuel, ex. nombre d'objets trouvés). */
  run(): Promise<R>;
  hintTarget(): HintTarget | null;
  /** Dernier recours de l'aide : Lumi fait l'action à la place de l'enfant. */
  autoSolve(): void;
  /** Désactive les cibles du tour (les dessins peuvent rester). */
  dispose(): void;
}

/** Le constructeur dessine les objets (inactifs) ; run() les active. */
export type TurnFactory = (ctx: TurnContext, def: TurnDefBase) => Turn;
