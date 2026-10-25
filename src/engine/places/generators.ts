/**
 * Contenu tiré au hasard à chaque visite d'un lieu du village.
 * Les listes (ingrédients, couleurs, chemins, phrases...) viennent du JSON du lieu (`config`) ;
 * ici on ne fait que tirer, placer, et construire les étapes.
 * `memory` = ce qui est sorti à la visite précédente : on évite de le reproposer.
 */
import type { Dest, DecorDef, ItemDef, PlaceDef, PlayerDef, StepDef, TextByPlayer } from '../../types';

type Item = ItemDef & { id: string; hidden?: boolean; tap?: boolean };
type Cfg = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export interface GenContext {
  players: PlayerDef[];
  /** Tirage de la visite précédente. */
  memory: string[];
  /** Le lieu a déjà été terminé une fois. */
  again: boolean;
}

export interface GenResult {
  place: PlaceDef;
  memory: string[];
}

// ---------------- Outils ----------------

const rnd = (n: number) => Math.floor(Math.random() * n);
export function shuffle<T>(a: readonly T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = rnd(i + 1);
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}
const pickOne = <T>(a: readonly T[]): T => a[rnd(a.length)];
/** Tire `n` éléments en évitant ceux de `avoid` tant que c'est possible. */
function pickFresh<T>(pool: readonly T[], n: number, key: (t: T) => string, avoid: string[]): T[] {
  const fresh = shuffle(pool.filter((p) => !avoid.includes(key(p))));
  const old = shuffle(pool.filter((p) => avoid.includes(key(p))));
  return [...fresh, ...old].slice(0, n);
}
/** Un entier dans [min, max], différent de `avoid` si possible. */
function intFresh(min: number, max: number, avoid?: number): number {
  const all = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  const ok = all.filter((v) => v !== avoid);
  return pickOne(ok.length ? ok : all);
}
const fill = (tpl: string, vars: Record<string, string | number>) =>
  tpl.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
/** Texte par joueur : {name} = prénom de l'enfant qui joue. */
function per(players: PlayerDef[], tpl: string, vars: Record<string, string | number> = {}): TextByPlayer {
  return Object.fromEntries(players.map((p) => [p.id, fill(tpl, { ...vars, name: p.name })]));
}
const memNum = (memory: string[], key: string) => {
  const m = memory.find((x) => x.startsWith(`${key}:`));
  return m ? Number(m.split(':')[1]) : undefined;
};

/** Remplace les étapes `{ "type": "slot", "name": ... }` par les étapes générées. */
function expand(steps: StepDef[], slots: Record<string, StepDef[]>): StepDef[] {
  return steps.flatMap((s) => {
    const raw = s as unknown as { type: string; name?: string; parts?: Record<string, StepDef[]> };
    if (raw.type === 'slot' && raw.name) return slots[raw.name] ?? [];
    if (raw.type === 'parts' && raw.parts) {
      return [{ type: 'parts', parts: Object.fromEntries(Object.entries(raw.parts).map(([k, v]) => [k, expand(v, slots)])) } as StepDef];
    }
    return [s];
  });
}

function finish(def: PlaceDef, items: Item[], slots: Record<string, StepDef[]>, memory: string[], decor?: DecorDef[]): GenResult {
  return {
    place: {
      ...def,
      view: decor ? { ...def.view, decor } : def.view,
      items: [...def.items, ...items],
      steps: expand(def.steps, slots),
    },
    memory,
  };
}

// ---------------- Écurie : 4 croisements tirés parmi une liste ----------------

function stable(def: PlaceDef, c: Cfg, g: GenContext): GenResult {
  const pairs: Cfg[] = pickFresh(c.pairs as Cfg[], 4, (p) => p.id, g.memory);
  const steps: StepDef[] = pairs.map((p, i) => ({
    type: 'fork',
    player: i % 2 ? 'second' : 'first',
    prompt: per(g.players, p.prompt),
    options: shuffle(p.options),
  }) as StepDef);
  return finish(def, [], { forks: steps }, pairs.map((p) => p.id));
}

// ---------------- Apothicaire : 3 nouveaux ingrédients ----------------

function potions(def: PlaceDef, c: Cfg, g: GenContext): GenResult {
  const pool: Cfg[] = c.pool;
  // 3 ingrédients de sortes différentes, jamais ceux de la dernière fois
  const targets: Cfg[] = [];
  for (const it of pickFresh(pool, pool.length, (p) => p.id, g.memory)) {
    if (targets.length < 3 && !targets.some((t) => t.kind === it.kind) && !g.memory.includes(it.id)) targets.push(it);
  }
  for (const it of shuffle(pool)) if (targets.length < 3 && !targets.includes(it) && !targets.some((t) => t.kind === it.kind)) targets.push(it);
  // Distracteurs : d'abord les « cousins » (même sorte, autre couleur), puis le reste
  const slotsXY: Cfg[] = c.shelf_slots;
  const cousins = shuffle(pool.filter((p) => !targets.includes(p) && targets.some((t) => t.kind === p.kind)));
  const others = shuffle(pool.filter((p) => !targets.includes(p) && !cousins.includes(p)));
  const shown = shuffle([...targets, ...[...cousins, ...others].slice(0, slotsXY.length - 3)]);
  const items: Item[] = shown.map((p, i) => ({
    id: `ing_${p.id}`, kind: p.kind, color: p.color, x: slotsXY[i].x, y: slotsXY[i].y, scale: p.scale ?? 0.85, tap: true,
  }));
  const dest: Dest = c.cauldron_dest;
  const who = ['first', 'second', 'both'] as const;
  const L: Cfg = c.lines;
  const steps: StepDef[] = targets.map((t, i) => ({
    type: 'pick',
    player: who[i],
    // « une plume » → « d'une plume » (après « a besoin »)
    prompt: per(g.players, L[`ask_${who[i]}`], { ingredient: t.label, it: t.it, of: String(t.label).replace(/^(un|une) /, "d'$1 ") }),
    accept: [`ing_${t.id}`],
    dest,
    bubble: { x: c.bubble.x, y: c.bubble.y, item: { kind: t.kind, color: t.color, x: 0, y: 0, scale: t.bubble_scale ?? 1 } },
    success_line: fill(pickOne(L.plouf as string[]), { ingredient: t.label }),
    retry_line: L.retry,
  }) as StepDef);
  const potion: Cfg = pickOne(c.potion_colors);
  steps.push({
    type: 'two_touch', prompt: L.stir, area: c.stir_area, effect: { target: 'cauldron', color: potion.color },
    success_line: fill(L.stir_done, { potion: potion.name }),
  });
  const outro = g.again ? L.outro_again : L.outro;
  return finish(def, items, { ingredients: steps, outro: [{ type: 'say', pitch: c.npc_pitch, text: outro }] }, targets.map((t) => t.id));
}

// ---------------- Librairie : couleurs, tailles, chiffres ----------------

function library(def: PlaceDef, c: Cfg, g: GenContext): GenResult {
  const L: Cfg = c.lines;
  const palette: Cfg[] = c.palette;
  const rows: Cfg = c.rows;
  const tableY: number = c.table_y;
  const items: Item[] = [];
  const memory: string[] = [];

  // Couleurs : 3 couleurs (pas les mêmes que la dernière fois si possible), 2 livres chacune
  const colors = pickFresh(palette, 3, (p) => `c:${p.id}`, g.memory);
  colors.forEach((p) => memory.push(`c:${p.id}`));
  const rowNames = ['top', 'mid', 'low'];
  const colorBooks = shuffle(colors.flatMap((p) => [`${p.id}_1`, `${p.id}_2`]));
  colorBooks.forEach((id, i) => {
    const p = colors.find((x) => id.startsWith(`${x.id}_`))!;
    items.push({ id: `cb_${id}`, kind: 'book', color: p.color, x: 560 + i * 130, y: tableY, scale: 0.9, tap: true, hidden: true });
  });
  const colorSteps: StepDef[] = [{ type: 'show', ids: colorBooks.map((id) => `cb_${id}`) }];
  colors.forEach((p, ci) => {
    const accept = [`cb_${p.id}_1`, `cb_${p.id}_2`];
    const v = { m: p.m, f: p.f };
    const first = ci === 0 ? per(g.players, L.color_first, v) : fill(L.color_next, v);
    colorSteps.push({ type: 'pick', player: 'elea', prompt: first, accept, dest: { x: 520, y: rows[rowNames[ci]] }, retry_line: fill(L.color_retry, v) } as StepDef);
    colorSteps.push({
      type: 'pick', player: 'elea', prompt: fill(L.color_more, v), accept, dest: { x: 600, y: rows[rowNames[ci]] }, retry_line: fill(L.color_retry, v),
      ...(ci === 2 ? { success_line: per(g.players, L.color_done) } : {}),
    } as StepDef);
  });
  // Marqueurs de couleur des étagères
  const decor = def.view.decor.filter((d) => d.type !== 'marker');
  (c.markers as Cfg[]).forEach((m, i) => decor.push({ type: 'marker', x: m.x, y: m.y, color: colors[i].color }));

  // Tailles : une autre couleur, sens tiré au hasard (et différent de la dernière fois si possible)
  const sizeColor = pickOne(palette.filter((p) => !colors.includes(p)));
  const lastDir = g.memory.find((m) => m.startsWith('dir:'))?.split(':')[1];
  const dir = lastDir === 'up' ? 'down' : lastDir === 'down' ? 'up' : pickOne(['up', 'down']);
  memory.push(`dir:${dir}`);
  const sizes = [{ id: 'small', s: 0.7 }, { id: 'mid', s: 1 }, { id: 'big', s: 1.3 }];
  const sizeX = shuffle([650, 880, 1110]);
  sizes.forEach((sz, i) => items.push({ id: `sb_${sz.id}`, kind: 'book', color: sizeColor.color, x: sizeX[i], y: tableY, scale: sz.s, tap: true, hidden: true }));
  const order = dir === 'up' ? sizes : [...sizes].reverse();
  const dx = [760, 850, 960];
  const sv = { mp: sizeColor.mp };
  const sizeSteps: StepDef[] = [{ type: 'show', ids: sizes.map((s) => `sb_${s.id}`) }];
  order.forEach((sz, i) => {
    const prompt = i === 0 ? per(g.players, L[`size_${dir}`], sv) : i === 1 ? L.size_mid : L[`size_last_${dir}`];
    sizeSteps.push({
      type: 'pick', player: 'elea', prompt, accept: [`sb_${sz.id}`], dest: { x: dx[i], y: rows.top, scale: sz.s },
      retry_line: L[`retry_${sz.id}`], ...(i === 2 ? { success_line: per(g.players, L[`size_done_${dir}`]) } : {}),
    } as StepDef);
  });

  // Chiffres : de 4 à 6 livres, parfois en compte à rebours
  const n = intFresh(c.numbers_min ?? 4, c.numbers_max ?? 6, memNum(g.memory, 'n'));
  memory.push(`n:${n}`);
  const down = Math.random() < (c.countdown_chance ?? 0.3);
  const numCols = shuffle(c.number_colors as string[]);
  const spread = Math.min(165, 820 / n);
  const numX = shuffle(Array.from({ length: n }, (_, i) => 880 + (i - (n - 1) / 2) * spread));
  for (let k = 1; k <= n; k++) items.push({ id: `nb_${k}`, kind: 'book', color: numCols[(k - 1) % numCols.length], number: k, x: numX[k - 1], y: tableY, scale: 1, tap: true, hidden: true });
  const seq = Array.from({ length: n }, (_, i) => (down ? n - i : i + 1));
  const numSteps: StepDef[] = [{ type: 'show', ids: seq.map((k) => `nb_${k}`) }];
  seq.forEach((k, i) => {
    const prompt = i === 0 ? per(g.players, down ? L.num_down : L.num_up, { n, k }) : fill(i === n - 1 ? L.num_last : L.num_next, { k });
    numSteps.push({
      type: 'pick', player: 'isao', prompt, accept: [`nb_${k}`], dest: { x: 760 + i * 80, y: rows.mid, scale: 1 },
      retry_line: fill(L.num_retry, { k }),
      ...(i === n - 1 ? { success_line: per(g.players, down ? L.num_done_down : L.num_done_up, { n }) } : {}),
    } as StepDef);
  });

  return finish(def, items, { colors: colorSteps, sizes: sizeSteps, numbers: numSteps }, memory, decor);
}

// ---------------- Boulangerie : décorer le gâteau ----------------

function bakery(def: PlaceDef, c: Cfg, g: GenContext): GenResult {
  const L: Cfg = c.lines;
  const memory: string[] = [];
  const fruit = pickFresh(c.fruits as Cfg[], 1, (f) => `f:${f.id}`, g.memory)[0];
  memory.push(`f:${fruit.id}`);
  const nFruit = intFresh(c.fruit_min, c.fruit_max, memNum(g.memory, 'nf'));
  const nCandle = intFresh(c.candle_min, c.candle_max, memNum(g.memory, 'nc'));
  memory.push(`nf:${nFruit}`, `nc:${nCandle}`);
  const cakeColor: Cfg = pickOne(c.cake_colors);
  const items: Item[] = [];
  items.push({ id: 'cake', kind: 'cake', color: cakeColor.color, x: c.cake.x, y: c.cake.y });

  // Fruits : la bonne sorte (n + 2) mélangée à d'autres fruits
  const others = (c.fruits as Cfg[]).filter((f) => f.id !== fruit.id);
  const fruitSpots = shuffle(c.fruit_spots as Cfg[]);
  const fruitList = [...Array(nFruit + 2).fill(fruit), ...Array(fruitSpots.length - nFruit - 2).fill(null).map(() => pickOne(others))];
  const accept: string[] = [];
  fruitList.slice(0, fruitSpots.length).forEach((f: Cfg, i: number) => {
    const id = `fr_${i}`;
    if (f === fruit) accept.push(id);
    items.push({ id, kind: f.kind, color: f.color, x: fruitSpots[i].x, y: fruitSpots[i].y, scale: f.scale ?? 0.9, tap: true });
  });
  const top: Cfg = c.cake_top;
  const fruitDests: Dest[] = Array.from({ length: nFruit }, (_, k) => ({
    x: top.x + (k - (nFruit - 1) / 2) * Math.min(70, 300 / nFruit), y: top.y + 22 + (k % 2) * 10, scale: (fruit.scale ?? 0.9) * 0.8,
  }));

  // Bougies : n + 2 bougies, on en met n
  const candleSpots = shuffle(c.candle_spots as Cfg[]);
  const candleColors = shuffle(c.candle_colors as string[]);
  const candleIds: string[] = [];
  for (let i = 0; i < Math.min(nCandle + 2, candleSpots.length); i++) {
    candleIds.push(`cd_${i}`);
    items.push({ id: `cd_${i}`, kind: 'candle', color: candleColors[i % candleColors.length], x: candleSpots[i].x, y: candleSpots[i].y, scale: 0.9, tap: true });
  }
  const candleDests: Dest[] = Array.from({ length: nCandle }, (_, k) => ({ x: top.x + (k - (nCandle - 1) / 2) * Math.min(60, 320 / nCandle), y: top.y + 4, scale: 0.8 }));
  // Flammes (cachées) au-dessus de chaque bougie posée
  const flames = candleDests.map((d, k) => ({ id: `flame_${k}`, kind: 'flame', x: d.x, y: d.y - 74, scale: 0.9, hidden: true }) as Item);
  items.push(...flames);

  const words: string[] = c.count_words;
  const fv = { n: nFruit, fruits: fruit.plural };
  const slots: Record<string, StepDef[]> = {
    fruits: [{
      type: 'collect', player: 'elea', prompt: per(g.players, L.fruits, fv), accept, count: nFruit, dests: fruitDests, count_words: words,
      retry_line: fill(L.fruits_retry, fv), success_line: per(g.players, L.fruits_done, fv),
    } as StepDef],
    candles: [{
      type: 'collect', player: 'isao', prompt: per(g.players, L.candles, { n: nCandle }), accept: candleIds, count: nCandle, dests: candleDests,
      count_words: words, success_line: per(g.players, L.candles_done, { n: nCandle }),
    } as StepDef],
    light: [
      { type: 'two_touch', prompt: L.light, area: c.light_area },
      { type: 'show', ids: flames.map((f) => f.id) },
      { type: 'say', text: fill(L.light_done, { cake: cakeColor.name }) },
    ],
    outro: [{ type: 'say', pitch: c.npc_pitch, text: g.again ? L.outro_again : L.outro }],
  };
  return finish(def, items, slots, memory);
}

// ---------------- Forge : souffler, frapper, trouver les clous ----------------

function forge(def: PlaceDef, c: Cfg, g: GenContext): GenResult {
  const L: Cfg = c.lines;
  const memory: string[] = [];
  const taps = intFresh(c.tap_min, c.tap_max, memNum(g.memory, 't'));
  const nails = intFresh(c.nail_min, c.nail_max, memNum(g.memory, 'nn'));
  const nailColor = pickFresh(c.nail_colors as Cfg[], 1, (n) => `nc:${n.id}`, g.memory)[0];
  const shoe: Cfg = pickOne(c.shoe_colors);
  memory.push(`t:${taps}`, `nn:${nails}`, `nc:${nailColor.id}`);
  const items: Item[] = [{ id: 'shoe', kind: 'horseshoe', color: shoe.color, x: c.shoe.x, y: c.shoe.y, scale: 0.75, hidden: true }];
  // Clous : la bonne couleur (n + 2) et d'autres couleurs
  const spots = shuffle(c.nail_spots as Cfg[]);
  const otherColors = (c.nail_colors as Cfg[]).filter((n) => n !== nailColor);
  const accept: string[] = [];
  spots.forEach((s, i) => {
    const good = i < nails + 2;
    const col = good ? nailColor : otherColors[i % otherColors.length];
    if (good) accept.push(`nail_${i}`);
    items.push({ id: `nail_${i}`, kind: 'nail', color: col.color, x: s.x, y: s.y, scale: 0.9, tap: true });
  });
  const crate: Cfg = c.crate;
  const dests: Dest[] = Array.from({ length: nails }, (_, k) => ({ x: crate.x + (k - (nails - 1) / 2) * 34, y: crate.y - 30, scale: 0.7 }));
  const words: string[] = c.count_words;
  const slots: Record<string, StepDef[]> = {
    hammer: [{
      type: 'tap_count', player: 'first', prompt: per(g.players, L.hammer, { n: taps }), area: c.anvil_area, count: taps, tool: 'hammer',
      count_words: words, then_show: ['shoe'], success_line: fill(L.hammer_done, { shoe: shoe.name }),
    } as StepDef],
    nails: [{
      type: 'collect', player: 'second', prompt: per(g.players, L.nails, { n: nails, color: nailColor.name }), accept, count: nails, dests,
      count_words: words, retry_line: fill(L.nails_retry, { color: nailColor.name }), success_line: per(g.players, L.nails_done, { n: nails }),
    } as StepDef],
    outro: [{ type: 'say', pitch: c.npc_pitch, text: g.again ? L.outro_again : L.outro }],
  };
  return finish(def, items, slots, memory);
}

// ================= Chapitre 3 : le grand voyage =================

/** Forêt : jeu de mémoire avec 3 ou 4 paires tirées au hasard. */
function tracks(def: PlaceDef, c: Cfg, g: GenContext): GenResult {
  const n = intFresh(c.pairs_min ?? 3, c.pairs_max ?? 4, memNum(g.memory, 'p'));
  const faces: Cfg[] = pickFresh(c.faces as Cfg[], n, (f) => f.id, g.memory);
  const step = {
    type: 'memory', faces: faces.map(({ id: _id, ...f }) => f), grid: { ...c.grid, cols: n <= 3 ? 3 : 4 }, turn: per(g.players, c.lines.turn),
    match_lines: c.lines.match, miss_line: c.lines.miss, done_line: c.lines.done,
  } as unknown as StepDef;
  return finish(def, [], { memory: [step] }, [`p:${n}`, ...faces.map((f) => f.id)]);
}

/** Pont qui parle : 3 ombres à reconnaître (un objet + 2 autres de formes différentes). */
function bridge(def: PlaceDef, c: Cfg, g: GenContext): GenResult {
  const pool: Cfg[] = c.objects;
  const targets = pickFresh(pool, 3, (o) => o.id, g.memory);
  const who = ['first', 'second', 'both'] as const;
  const xs: number[] = c.choice_xs;
  const items: Item[] = [];
  const steps: StepDef[] = [];
  targets.forEach((t, r) => {
    const others = shuffle(pool.filter((o) => o.kind !== t.kind && !targets.slice(r).includes(o))).slice(0, 2);
    const choices = shuffle([t, ...others]);
    const ids = choices.map((o, i) => `r${r}_${i}_${o.id}`);
    choices.forEach((o, i) => items.push({ id: ids[i], kind: o.kind, color: o.color, x: xs[i], y: c.choice_y, scale: o.scale ?? 1, tap: true, hidden: true }));
    steps.push({ type: 'show', ids });
    steps.push({
      type: 'pick', player: who[r], prompt: per(g.players, c.lines[`ask_${who[r]}`]), accept: [ids[choices.indexOf(t)]],
      dest: { x: c.bubble.x, y: c.bubble.y + 40, scale: 0.8, vanish: true },
      bubble: { x: c.bubble.x, y: c.bubble.y, item: { kind: t.kind, color: t.color, x: 0, y: 0, scale: (t.scale ?? 1) * 0.9, shadow: true } },
      retry_line: c.lines.retry, success_line: fill(pickOne(c.lines.good as string[]), { thing: t.label }),
    } as StepDef);
    steps.push({ type: 'hide', ids });
  });
  return finish(def, items, { shadows: steps }, targets.map((t) => t.id));
}

/** Troll : partager les parts de gâteau (2 puis 3 assiettes). */
function troll(def: PlaceDef, c: Cfg, g: GenContext): GenResult {
  const a = intFresh(c.per_min ?? 1, c.per_max ?? 3, memNum(g.memory, 'a'));
  const b = intFresh(c.per_min ?? 1, c.per_max ?? 3, memNum(g.memory, 'b'));
  const mk = (player: string, plates: Cfg[], per_plate: number, tpl: string, done: string): StepDef => ({
    type: 'share', player, prompt: per(g.players, tpl, { n: per_plate * plates.length, k: per_plate }), plates, per_plate,
    pile: c.pile, full_line: c.lines.full, count_words: c.count_words, success_line: per(g.players, done, { k: per_plate }),
  } as StepDef);
  const slots = {
    share_first: [mk('first', c.plates2, a, c.lines.share2, c.lines.done2)],
    share_second: [mk('second', c.plates3, b, c.lines.share3, c.lines.done3)],
  };
  return finish(def, [], slots, [`a:${a}`, `b:${b}`]);
}

/** Rivière : suites de notes de plus en plus longues. */
function river(def: PlaceDef, c: Cfg, g: GenContext): GenResult {
  const pads: Cfg[] = c.pads;
  const seq = (len: number) => {
    const r: number[] = [];
    while (r.length < len) {
      const v = rnd(pads.length);
      if (r[r.length - 1] !== v) r.push(v);
    }
    return r;
  };
  const rounds = (c.rounds as Cfg[]).map((r) => ({ player: r.player, seq: seq(r.length) }));
  const step = { type: 'simon', pads, rounds, listen: c.lines.listen, your_turn: { ...(per(g.players, c.lines.your_turn) as Record<string, string>), both: c.lines.your_turn_both }, good_lines: c.lines.good, retry_line: c.lines.retry } as unknown as StepDef;
  return finish(def, [], { simon: [step] }, rounds.map((r) => r.seq.join('')));
}

/** Escalier de nuages : une suite de directions, en restant dans l'écran. */
function stairs(def: PlaceDef, c: Cfg, g: GenContext): GenResult {
  const start: Cfg = c.start;
  const dx: number = c.dx;
  const dy: number = c.dy;
  const n: number = c.rounds;
  let at: Cfg = { x: start.x, y: start.y };
  const rounds: Cfg[] = [];
  for (let i = 0; i < n; i++) {
    const useUpDown = i === n - 2 && c.up_down;
    let dir: string;
    let to: Cfg;
    let other: Cfg;
    if (useUpDown) {
      dir = 'up';
      to = { x: at.x, y: at.y - dy * 1.4 };
      other = { x: at.x + (at.x < 800 ? dx : -dx), y: at.y + dy * 0.2 };
    } else {
      const canL = at.x - dx >= c.min_x;
      const canR = at.x + dx <= c.max_x;
      dir = canL && canR ? pickOne(['left', 'right']) : canL ? 'left' : 'right';
      const sign = dir === 'left' ? -1 : 1;
      to = { x: at.x + sign * dx, y: at.y - dy };
      other = { x: at.x - sign * dx, y: at.y - dy };
    }
    rounds.push({ player: i % 2 ? 'second' : 'first', dir, to, other });
    at = to;
  }
  const L: Cfg = c.lines;
  const step = {
    type: 'direction', walkers: c.walkers, start, rounds,
    prompts: Object.fromEntries(['left', 'right', 'up', 'down'].map((d) => [d, per(g.players, L[`go_${d}`])])),
    wrong: { left: L.wrong_left, right: L.wrong_right, up: L.wrong_up, down: L.wrong_down }, good_lines: L.good,
  } as unknown as StepDef;
  return finish(def, [], { stairs: [step] }, rounds.map((r) => r.dir));
}

const GENERATORS: Record<string, (def: PlaceDef, c: Cfg, g: GenContext) => GenResult> = {
  stable, potions, library, bakery, forge, tracks, bridge, troll, river, stairs,
};

/** Prépare une visite : tire le contenu si le lieu a un générateur, sinon renvoie le lieu tel quel. */
export function buildPlace(def: PlaceDef, g: GenContext): GenResult {
  const gen = def.generator ? GENERATORS[def.generator] : undefined;
  if (!gen) return { place: def, memory: g.memory };
  return gen(def, (def.config ?? {}) as Cfg, g);
}
