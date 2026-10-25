export type PlayerId = string;

/** Texte simple, ou un texte par joueur (utile quand l'ordre de passage est inversé). */
export type TextByPlayer = string | Record<PlayerId, string>;

export interface Point {
  x: number;
  y: number;
}

/**
 * Objet dessiné dans la scène (champignon, pierre, lettre, fleur, étoile...).
 * x, y = pied de l'objet (milieu du bas).
 */
export interface ItemDef {
  id?: string;
  /** mushroom (défaut), shape, letter, flower, star, bird, slot, hole */
  kind?: string;
  x: number;
  y: number;
  color?: string;
  /** Pour kind = shape / hole : circle, square, triangle, star, heart */
  shape?: string;
  /** Pour kind = letter */
  letter?: string;
  scale?: number;
  /** Ce que dit Lumi quand elle montre l'objet en aidant (ex. « rouge »). */
  say?: string;
}

/** Ancien nom, gardé pour compatibilité. */
export type PlacedObjectDef = ItemDef & { id: string };

export interface TurnDefBase {
  player: PlayerId;
  type: string;
  prompt: TextByPlayer;
  /** Champs remplacés quand ce tour est joué par un joueur donné (ex. la lettre de son prénom). */
  by_player?: Record<PlayerId, Record<string, unknown>>;
  [key: string]: unknown;
}

export interface FindObjectsTurnDef extends TurnDefBase {
  type: 'find_objects';
  success_line: TextByPlayer;
  count_aloud?: boolean;
  /** Type d'objet par défaut des cibles et distracteurs. */
  object_kind?: string;
  targets: ItemDef[];
  distractors: ItemDef[];
  /** Nombre d'objets à trouver (défaut : toutes les cibles). Sert aux consignes « donne-en 2 ». */
  need?: number;
  /** basket (défaut) : dans le panier ; slots : vers les positions `slots` ; glow : restent sur place et brillent. */
  collect?: 'basket' | 'slots' | 'glow';
  slots?: (Point & { scale?: number })[];
  /** false : les objets n'apparaissent qu'au début du tour. */
  show_from_start?: boolean;
  /** true : les objets non ramassés disparaissent à la fin du tour. */
  hide_after?: boolean;
}

export interface ChooseNumberTurnDef extends TurnDefBase {
  type: 'choose_number';
  success_line: TextByPlayer;
  retry_line: TextByPlayer;
  /** previous_turn_count : objets trouvés au tour précédent ; count_items : objets `count_items` affichés. */
  answer_from?: 'previous_turn_count' | 'count_items';
  answer?: number;
  count_items?: ItemDef[];
  choices: number[];
  layout?: { y: number; spacing: number };
}

export interface ChooseOneTurnDef extends TurnDefBase {
  type: 'choose_one';
  success_line: TextByPlayer;
  retry_line: TextByPlayer;
  /** Ce qu'on regarde (une suite, un trou...). Un élément `missing: true` reçoit la bonne réponse. */
  display: (ItemDef & { missing?: boolean })[];
  choices: (ItemDef & { id: string })[];
  answer: string;
}

export interface DecorDef {
  type: string;
  x: number;
  y: number;
  scale?: number;
  [key: string]: unknown;
}

export interface AmbientDef {
  id: string;
  x: number;
  y: number;
  reaction: string;
  scale?: number;
  color?: string;
}

export interface SceneLines {
  intro: string;
  gem_touch: string;
  celebration: string;
  count: string[];
  auto_help?: string;
  voice_test?: string;
  next?: string;
}

export interface SceneDef {
  _meta?: { version: string; description: string };
  id: string;
  gem: string;
  hint_delays_s: number[];
  auto_solve_after_s?: number;
  /** forest (défaut), river, cave, meadow, mountain */
  backdrop?: string;
  background?: { sky_top: string; sky_bottom: string; ground: string };
  gem_position: Point;
  basket?: Point & { style?: 'basket' | 'jar' };
  lumi: { home: Point; sleep_spot?: Point };
  decor: DecorDef[];
  turns: TurnDefBase[];
  ambient_hotspots: AmbientDef[];
  lines: SceneLines;
}

export interface FinaleDef {
  door: Point;
  lines: {
    intro: string;
    touch: string;
    celebration: string;
  };
  hint_delays_s: number[];
  auto_solve_after_s?: number;
  lumi: { home: Point; sleep_spot: Point };
}

export interface LevelDef {
  _meta?: { version: string; description: string };
  id: string;
  /** Fichiers de scène, dans l'ordre. */
  scenes: string[];
  /** Phrases communes à toutes les scènes (une scène peut les remplacer). */
  lines: Partial<SceneLines>;
  finale: FinaleDef;
}

export interface PlayerDef {
  id: PlayerId;
  name: string;
  initial: string;
  color: string;
  side: 'left' | 'right';
}

export interface GameSettings {
  level: string;
  /** Scène seule (ancien mode, et ?scene=...). */
  scene?: string;
  first_player: PlayerId;
  players: PlayerDef[];
  level_gems: string[];
  voice: { lang: string; rate: number; volume: number; pitch: number; rate_min: number; rate_max: number };
  touch: { min_target_px: number; hit_padding: number };
  gem_touch: { two_finger_window_ms: number; single_hold_ms: number; single_taps: number };
}
