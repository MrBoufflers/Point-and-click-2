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
  /** Livre : chiffre sur la couverture. */
  number?: number;
  /** Personnage : apothecary, librarian... */
  npc?: string;
  /** Licorne : initiale de l'enfant monté dessus, et sa couleur. */
  rider?: string;
  rider_color?: string;
  /** Licorne : regarde vers la gauche. */
  flip?: boolean;
  /** Dessiné comme une ombre (silhouette sombre). */
  shadow?: boolean;
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

/** Chapitre 3 : le grand voyage (étapes dans un ordre fixe). */
export interface JourneyDef {
  _meta?: { version: string; description: string };
  id: string;
  /** Fichiers des étapes, dans l'ordre (la dernière est l'arrivée). */
  steps: string[];
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
  /** Chapitre 2 : le village (après la Porte). */
  village?: string;
  /** Chapitre 3 : le grand voyage (après les 5 maisons). */
  journey?: string;
  /** Scène seule (ancien mode, et ?scene=...). */
  scene?: string;
  first_player: PlayerId;
  players: PlayerDef[];
  level_gems: string[];
  voice: { lang: string; rate: number; volume: number; pitch: number; rate_min: number; rate_max: number };
  touch: { min_target_px: number; hit_padding: number };
  gem_touch: { two_finger_window_ms: number; single_hold_ms: number; single_taps: number };
}

// ---------------- Village (chapitre 2) ----------------

/** Une « vue » : un fond et son décor (un lieu peut en changer, ex. la promenade à licorne). */
export interface ViewDef {
  backdrop: string;
  background?: { sky_top?: string; sky_bottom?: string; ground?: string };
  decor: DecorDef[];
}

export interface HouseDef {
  id: string;
  x: number;
  y: number;
  roof: string;
  wall?: string;
  /** Icône de l'enseigne : unicorn, potion, book, lock... */
  sign: string;
  /** Fichier du lieu ; absent = maison fermée pour l'instant. */
  place?: string;
  /** Ce que dit Lumi quand on touche la maison. */
  line: string;
  scale?: number;
}

export interface BagSlotDef {
  /** Récompense : unicorns, potion, grimoire... */
  id: string;
}

export interface VillageDef {
  _meta?: { version: string; description: string };
  id: string;
  view: ViewDef;
  houses: HouseDef[];
  bag: BagSlotDef[];
  /** Place centrale (fontaine) d'où partent les chemins. */
  fountain: Point;
  ambient_hotspots: AmbientDef[];
  hint_delays_s: number[];
  lumi: { home: Point };
  lines: {
    intro: string;
    prompt: string;
    closed: string;
    all_done: string;
    /** Quand les 5 maisons sont finies : Pilou arrive (chapitre 3). */
    journey_call?: string;
    pilou_tap?: string;
  };
}

/** Qui joue une étape : un enfant précis, le 1er / 2e selon l'ordre choisi par le parent, ou les deux. */
export type StepPlayer = PlayerId | 'first' | 'second' | 'both';

export interface Dest extends Point {
  scale?: number;
  /** L'objet disparaît en arrivant (dans le chaudron...). */
  vanish?: boolean;
}

export type StepDef =
  | { type: 'say'; text: TextByPlayer; pitch?: number }
  | { type: 'wait'; ms: number }
  | { type: 'view'; view: ViewDef; trot?: boolean }
  | { type: 'show' | 'hide'; ids: string[] }
  | { type: 'move'; id: string; x: number; y: number; ms?: number; scale?: number; flip?: boolean }
  | {
      type: 'pick';
      player: StepPlayer;
      prompt: TextByPlayer;
      /** Objets acceptés (n'importe lequel convient). */
      accept: string[];
      dest?: Dest;
      success_line?: TextByPlayer;
      retry_line?: TextByPlayer;
      /** Bulle d'un personnage montrant l'objet demandé. */
      bubble?: { x: number; y: number; item: ItemDef };
    }
  | {
      type: 'choose_color';
      player: StepPlayer;
      prompt: TextByPlayer;
      /** Objet à colorier ; {player} est remplacé par l'id du joueur. */
      target: string;
      colors: { color: string; line: string }[];
      y?: number;
    }
  | {
      type: 'fork';
      player: StepPlayer;
      prompt: TextByPlayer;
      options: { id: string; card: DecorDef[]; line: string; view: ViewDef }[];
    }
  | {
      type: 'two_touch';
      prompt: TextByPlayer;
      area: { x: number; y: number; w: number; h: number };
      /** Change la couleur du liquide d'un chaudron. */
      effect?: { target: string; color: string };
      success_line?: TextByPlayer;
    }
  | {
      type: 'collect';
      player: StepPlayer;
      prompt: TextByPlayer;
      /** Objets acceptés ; il faut en prendre `count` (un par emplacement de `dests`). */
      accept: string[];
      count: number;
      dests: Dest[];
      count_words?: string[];
      success_line?: TextByPlayer;
      retry_line?: TextByPlayer;
    }
  | {
      type: 'tap_count';
      player: StepPlayer;
      prompt: TextByPlayer;
      area: { x: number; y: number; w: number; h: number };
      count: number;
      /** Objet qui s'anime à chaque coup (ex. le marteau). */
      tool?: string;
      count_words?: string[];
      success_line?: TextByPlayer;
      /** Objets qui apparaissent à la fin (ex. le fer à cheval terminé). */
      then_show?: string[];
    }
  | { type: 'parts'; parts: Record<PlayerId, StepDef[]> }
  | {
      /** Une récompense du sac sert dans la scène (elle vole du sac jusqu'ici). */
      type: 'use';
      reward: string;
      to: Point;
      scale?: number;
      line?: TextByPlayer;
      then_show?: string[];
      then_hide?: string[];
    }
  | {
      /** Jeu de mémoire : retrouver les paires, chacun son tour. */
      type: 'memory';
      faces: ItemDef[];
      grid: { x: number; y: number; cols: number; cell: number };
      turn: TextByPlayer;
      match_lines: string[];
      miss_line: string;
      done_line?: string;
    }
  | {
      /** Partager : donner autant de parts à chaque assiette. */
      type: 'share';
      player: StepPlayer;
      prompt: TextByPlayer;
      plates: Point[];
      per_plate: number;
      pile: Point;
      full_line: string;
      count_words?: string[];
      success_line?: TextByPlayer;
    }
  | {
      /** Suite de sons et de couleurs à répéter. */
      type: 'simon';
      pads: (Point & { color: string })[];
      rounds: { player: StepPlayer; seq: number[] }[];
      listen: string;
      your_turn: TextByPlayer;
      good_lines: string[];
      retry_line: string;
    }
  | {
      /** Gauche / droite / haut / bas : choisir le bon nuage. */
      type: 'direction';
      walkers: string[];
      start: Point;
      rounds: { player: StepPlayer; dir: 'left' | 'right' | 'up' | 'down'; to: Point; other: Point }[];
      prompts: Record<string, TextByPlayer>;
      wrong: Record<string, string>;
      good_lines: string[];
    }
  | { type: 'reward'; from: Point };

export interface PlaceDef {
  _meta?: { version: string; description: string };
  id: string;
  /** Récompense gagnée à la fin (case du sac). */
  reward: string;
  view: ViewDef;
  items: (ItemDef & { id: string; hidden?: boolean })[];
  steps: StepDef[];
  hint_delays_s: number[];
  auto_solve_after_s?: number;
  lumi: { home: Point };
  ambient_hotspots?: AmbientDef[];
  lines: { done: string };
  /** Contenu tiré au hasard à chaque visite (voir engine/places/generators.ts). */
  generator?: string;
  config?: Record<string, unknown>;
}
