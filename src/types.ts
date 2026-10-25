export type PlayerId = string;

/** Texte simple, ou un texte par joueur (utile quand l'ordre de passage est inversé). */
export type TextByPlayer = string | Record<PlayerId, string>;

export interface Point {
  x: number;
  y: number;
}

export interface PlacedObjectDef {
  id: string;
  x: number;
  y: number;
  color: string;
  scale?: number;
}

export interface TurnDefBase {
  player: PlayerId;
  type: string;
  prompt: TextByPlayer;
  [key: string]: unknown;
}

export interface FindObjectsTurnDef extends TurnDefBase {
  type: 'find_objects';
  success_line: TextByPlayer;
  count_aloud?: boolean;
  targets: PlacedObjectDef[];
  distractors: PlacedObjectDef[];
}

export interface ChooseNumberTurnDef extends TurnDefBase {
  type: 'choose_number';
  success_line: TextByPlayer;
  retry_line: TextByPlayer;
  answer_from?: 'previous_turn_count';
  answer?: number;
  choices: number[];
  layout?: { y: number; spacing: number };
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
}

export interface SceneLines {
  intro: string;
  gem_touch: string;
  celebration: string;
  count: string[];
  auto_help?: string;
  voice_test?: string;
}

export interface SceneDef {
  _meta?: { version: string; description: string };
  id: string;
  gem: string;
  hint_delays_s: number[];
  auto_solve_after_s?: number;
  background?: { sky_top: string; sky_bottom: string; ground: string };
  gem_position: Point;
  basket: Point;
  lumi: { home: Point; sleep_spot: Point };
  decor: DecorDef[];
  turns: TurnDefBase[];
  ambient_hotspots: AmbientDef[];
  lines: SceneLines;
}

export interface PlayerDef {
  id: PlayerId;
  name: string;
  initial: string;
  color: string;
  side: 'left' | 'right';
}

export interface GameSettings {
  scene: string;
  first_player: PlayerId;
  players: PlayerDef[];
  level_gems: string[];
  voice: { lang: string; rate: number; volume: number; pitch: number; rate_min: number; rate_max: number };
  touch: { min_target_px: number; hit_padding: number };
  gem_touch: { two_finger_window_ms: number; single_hold_ms: number; single_taps: number };
}
