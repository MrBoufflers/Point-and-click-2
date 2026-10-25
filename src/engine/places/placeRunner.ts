import { drawBackdrop } from '../../render/backdrop';
import { flyItem } from '../../render/basket';
import { drawRewardIcon } from '../../render/bag';
import { confetti } from '../../render/confetti';
import { drawItem, type ItemShape } from '../../render/items';
import { animate, colorOf, el, lerp, place, tween } from '../../render/svg';
import { drawBubble, drawCard } from '../../render/village';
import '../../render/journey';
import { AMBIENT } from '../../render/ambient';
import type { ItemDef, PlaceDef, PlayerId, StepDef } from '../../types';
import { TwoTouch } from '../twoTouch';
import { ABORT, PlaceBase, type Interactive, type VillageCommon } from './base';

export interface PlaceOptions extends VillageCommon {
  place: PlaceDef;
  onUnicorn?: (player: PlayerId, color: string) => void;
  onReward?: (id: string) => void;
}

type PlaceItem = ItemDef & { id: string; hidden?: boolean; tap?: boolean };

interface Live {
  def: PlaceItem;
  shape: ItemShape;
  used: boolean;
}

const wobble = (body: Element) =>
  animate(body, [
    { transform: 'rotate(0)' }, { transform: 'rotate(-12deg) scale(1.05,0.95)' }, { transform: 'rotate(10deg)' },
    { transform: 'rotate(-6deg)' }, { transform: 'rotate(0)' },
  ], { duration: 600, easing: 'ease-in-out' });

const hop = (body: Element) =>
  animate(body, [
    { transform: 'translateY(0) scale(1)' }, { transform: 'translateY(-50px) scale(1.12,0.92)', offset: 0.4 },
    { transform: 'translateY(0) scale(0.95,1.05)', offset: 0.8 }, { transform: 'translateY(0) scale(1)' },
  ], { duration: 500, easing: 'ease-out' });

/** Un lieu du village : une suite d'étapes décrite dans un fichier JSON. */
export class PlaceRunner extends PlaceBase {
  private items = new Map<string, Live>();
  /** Objet touchable → ce qu'il fait pendant l'étape en cours. */
  private onPick: ((live: Live) => void) | null = null;

  constructor(private o: PlaceOptions) {
    super(o, o.place.view, o.place.lumi.home);
    const L = this.stage.layers;
    for (const def of o.place.ambient_hotspots ?? []) {
      const make = AMBIENT[def.reaction];
      if (!make) continue;
      const a = make(L.ambient, def);
      this.input.add({ id: `amb_${def.id}`, cx: a.cx, cy: a.cy, w: a.w, h: a.h, enabled: true, onDown: () => { o.sfx.tap(); a.react(); } });
    }
    for (const def of o.place.items) this.addItem(def as PlaceItem);
  }

  /** Remplit le cavalier des licornes et la couleur déjà choisie. */
  private prepare(def: PlaceItem): PlaceItem {
    const d = { ...def };
    const m = /^unicorn_(.+)$/.exec(d.id);
    const p = m && this.o.settings.players.find((x) => x.id === m[1]);
    if (p && d.rider === 'auto') {
      d.rider = p.initial;
      d.rider_color = p.color;
    }
    if (p && !d.color && this.o.prefs.village.unicorns[p.id]) d.color = this.o.prefs.village.unicorns[p.id];
    return d;
  }

  private addItem(raw: PlaceItem): Live {
    const def = this.prepare(raw);
    const shape = drawItem(this.stage.layers.objects, def, 'shape');
    if (def.hidden) shape.root.style.display = 'none';
    const live: Live = { def, shape, used: false };
    this.items.set(def.id, live);
    if (def.tap) {
      const s = def.scale ?? 1;
      this.input.add({
        id: `it_${def.id}`, cx: def.x, cy: def.y - (shape.h / 2) * s, w: shape.w * s, h: shape.h * s, enabled: !def.hidden,
        onDown: () => {
          if (live.used || !this.onPick) return;
          this.onPick(live);
        },
      });
    }
    return live;
  }

  /** Redessine un objet (ex. nouvelle couleur de licorne) au même endroit. */
  private redraw(id: string, patch: Partial<PlaceItem>): void {
    const live = this.items.get(id);
    if (!live) return;
    const next = { ...live.def, ...patch };
    const parent = live.shape.root.parentNode;
    const before = live.shape.root.nextSibling;
    live.shape.root.remove();
    const shape = drawItem(this.stage.layers.objects, next, 'shape');
    if (parent) parent.insertBefore(shape.root, before);
    live.def = next;
    live.shape = shape;
  }

  start(): void {
    this.run().catch((e) => {
      if (e !== ABORT) console.error(e);
    });
  }

  private async run(): Promise<void> {
    this.setState('place');
    void this.lumi.home();
    for (const s of this.o.place.steps) await this.exec(s);
    this.portraits.setActive(null);
    await this.step(this.say(this.o.place.lines.done));
    this.setState('end');
    this.input.disableAll();
  }

  private async exec(s: StepDef, ctx?: PlayerId): Promise<void> {
    if (this.disposed) throw ABORT;
    const P = this.o.place;
    switch (s.type) {
      case 'say': {
        const who = this.resolvePlayer(undefined, ctx);
        await this.step(this.say(this.text(s.text, who), { pitch: s.pitch }));
        return;
      }
      case 'wait':
        await this.step(this.clock.wait(s.ms));
        return;
      case 'view':
        await this.step(this.changeView(s));
        return;
      case 'show':
      case 'hide':
        for (const id of s.ids) {
          const live = this.items.get(id);
          if (!live) continue;
          const show = s.type === 'show';
          live.shape.root.style.display = show ? '' : 'none';
          this.input.setEnabled(`it_${id}`, show && !live.used);
          if (show) void animate(live.shape.body, [{ transform: 'scale(0)' }, { transform: 'scale(1.1)' }, { transform: 'scale(1)' }], { duration: 400, easing: 'ease-out' });
        }
        return;
      case 'move': {
        if (s.flip != null) this.redraw(s.id, { flip: s.flip });
        const live = this.items.get(s.id);
        if (!live) return;
        const from = { x: live.def.x, y: live.def.y, s: live.def.scale ?? 1 };
        const to = { x: s.x, y: s.y, s: s.scale ?? from.s };
        await this.step(tween(s.ms ?? 900, (k) => place(live.shape.root, lerp(from.x, to.x, k), lerp(from.y, to.y, k), lerp(from.s, to.s, k))));
        Object.assign(live.def, { x: to.x, y: to.y, scale: to.s });
        return;
      }
      case 'parts':
        for (const pid of this.order()) for (const sub of s.parts[pid] ?? []) await this.exec(sub, pid);
        return;
      case 'pick':
        await this.pick(s, ctx);
        return;
      case 'collect':
        await this.collect(s, ctx);
        return;
      case 'tap_count':
        await this.tapCount(s, ctx);
        return;
      case 'choose_color':
        await this.chooseColor(s, ctx);
        return;
      case 'fork':
        await this.fork(s, ctx);
        return;
      case 'two_touch':
        await this.twoTouch(s);
        return;
      case 'reward':
        await this.reward(s.from);
        return;
      case 'use':
        await this.useReward(s, ctx);
        return;
      case 'memory':
        await this.memory(s);
        return;
      case 'share':
        await this.share(s, ctx);
        return;
      case 'simon':
        await this.simon(s);
        return;
      case 'direction':
        await this.direction(s);
        return;
    }
    void P;
  }

  // ---------- Étapes ----------

  private async changeView(s: Extract<StepDef, { type: 'view' }>): Promise<void> {
    drawBackdrop(this.stage.layers, s.view);
    const riders = [...this.items.values()].filter((l) => l.def.kind === 'unicorn').map((l) => l.shape.body);
    if (s.trot) riders.forEach((b) => b.classList.add('trotting'));
    void animate(this.stage.layers.decor, [{ transform: 'translateX(500px)', opacity: 0 }, { transform: 'translateX(0)', opacity: 1 }], { duration: 1600, easing: 'ease-out' });
    await this.clock.wait(s.trot ? 1700 : 600);
    riders.forEach((b) => b.classList.remove('trotting'));
  }

  private async pick(s: Extract<StepDef, { type: 'pick' }>, ctx?: PlayerId): Promise<void> {
    const who = this.resolvePlayer(s.player, ctx);
    this.portraits.setActive(who);
    const bubble = s.bubble ? drawBubble(this.stage.layers.fx, s.bubble.x, s.bubble.y, s.bubble.item, (p, d) => void drawItem(p, d, 'shape')) : null;
    const prompt = this.text(s.prompt, who);
    void this.say(prompt, { prompt: true });
    let lastRetry = 0;
    const accepted = () => s.accept.map((id) => this.items.get(id)).filter((l): l is Live => !!l && !l.used);
    let finish: (() => void) | null = null;
    const choose = (live: Live) => {
      if (!s.accept.includes(live.def.id)) {
        this.o.sfx.pouic();
        void wobble(live.shape.body);
        const now = performance.now();
        if (s.retry_line && now - lastRetry > 4000) {
          lastRetry = now;
          void this.say(this.text(s.retry_line, who));
        }
        return;
      }
      this.onPick = null;
      live.used = true;
      this.input.setEnabled(`it_${live.def.id}`, false);
      live.shape.body.classList.remove('hint-sparkle');
      this.progress();
      this.o.sfx.success();
      void (async () => {
        await hop(live.shape.body);
        if (s.dest) {
          const from = { x: live.def.x, y: live.def.y };
          const fromScale = live.def.scale ?? 1;
          await flyItem(live.shape, from, fromScale, s.dest, s.dest.scale ?? fromScale, 800);
          Object.assign(live.def, { x: s.dest.x, y: s.dest.y, scale: s.dest.scale ?? fromScale });
          if (s.dest.vanish) {
            await animate(live.shape.root, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'forwards' });
            live.shape.root.style.display = 'none';
            this.splash(s.dest.x, s.dest.y);
          }
        }
        finish?.();
      })();
    };
    const action: Interactive<void> = {
      done: new Promise<void>((r) => (finish = r)),
      hintTarget: () => {
        const t = accepted()[0];
        if (!t) return null;
        const sc = t.def.scale ?? 1;
        return { x: t.def.x, y: t.def.y - (t.shape.h / 2) * sc, top: t.def.y - t.shape.h * sc, mark: (on) => t.shape.body.classList.toggle('hint-sparkle', on) };
      },
      autoSolve: () => {
        const t = accepted()[0];
        if (t) choose(t);
      },
    };
    this.onPick = choose;
    await this.withHints(action, prompt, this.o.place.hint_delays_s, this.o.place.auto_solve_after_s);
    if (bubble) {
      await animate(bubble, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'forwards' });
      bubble.remove();
    }
    if (s.success_line) await this.step(this.say(this.text(s.success_line, who)));
  }

  /** Prendre `count` objets parmi ceux acceptés (on compte à voix haute). */
  private async collect(s: Extract<StepDef, { type: 'collect' }>, ctx?: PlayerId): Promise<void> {
    const who = this.resolvePlayer(s.player, ctx);
    this.portraits.setActive(who);
    const prompt = this.text(s.prompt, who);
    void this.say(prompt, { prompt: true });
    let got = 0;
    let lastRetry = 0;
    let finish: (() => void) | null = null;
    const accepted = () => s.accept.map((id) => this.items.get(id)).filter((l): l is Live => !!l && !l.used);
    const choose = (live: Live) => {
      if (got >= s.count) return;
      if (!s.accept.includes(live.def.id)) {
        this.o.sfx.pouic();
        void wobble(live.shape.body);
        const now = performance.now();
        if (s.retry_line && now - lastRetry > 4000) {
          lastRetry = now;
          void this.say(this.text(s.retry_line, who));
        }
        return;
      }
      live.used = true;
      this.input.setEnabled(`it_${live.def.id}`, false);
      live.shape.body.classList.remove('hint-sparkle');
      const k = got++;
      this.progress();
      this.o.sfx.success();
      void this.say(s.count_words?.[k] ?? String(k + 1));
      const dest = s.dests[k % s.dests.length];
      void (async () => {
        await hop(live.shape.body);
        const from = { x: live.def.x, y: live.def.y };
        const fromScale = live.def.scale ?? 1;
        await flyItem(live.shape, from, fromScale, dest, dest.scale ?? fromScale, 700);
        Object.assign(live.def, { x: dest.x, y: dest.y, scale: dest.scale ?? fromScale });
        if (dest.vanish) live.shape.root.style.display = 'none';
        if (got >= s.count) {
          this.onPick = null;
          finish?.();
        }
      })();
    };
    this.onPick = choose;
    await this.withHints({
      done: new Promise<void>((r) => (finish = r)),
      hintTarget: () => {
        const t = accepted()[0];
        if (!t || got >= s.count) return null;
        const sc = t.def.scale ?? 1;
        return { x: t.def.x, y: t.def.y - (t.shape.h / 2) * sc, top: t.def.y - t.shape.h * sc, mark: (on) => t.shape.body.classList.toggle('hint-sparkle', on) };
      },
      autoSolve: () => {
        const t = accepted()[0];
        if (t) choose(t);
      },
    }, prompt, this.o.place.hint_delays_s, this.o.place.auto_solve_after_s);
    await this.step(this.clock.wait(300));
    if (s.success_line) await this.step(this.say(this.text(s.success_line, who)));
  }

  /** Taper `count` fois sur une zone (ex. l'enclume) en comptant. */
  private async tapCount(s: Extract<StepDef, { type: 'tap_count' }>, ctx?: PlayerId): Promise<void> {
    const who = this.resolvePlayer(s.player, ctx);
    this.portraits.setActive(who);
    const prompt = this.text(s.prompt, who);
    void this.say(prompt, { prompt: true });
    const a = s.area;
    const tool = s.tool ? this.items.get(s.tool) : undefined;
    let hits = 0;
    let busyUntil = 0;
    let finish: (() => void) | null = null;
    const hit = () => {
      const now = performance.now();
      // Un coup à la fois : on laisse le temps de compter (aucune pénalité si on tape trop vite).
      if (hits >= s.count || now < busyUntil) return;
      busyUntil = now + 650;
      hits += 1;
      this.progress();
      this.o.sfx.clang();
      if (tool) void animate(tool.shape.body, [{ transform: 'rotate(0)' }, { transform: 'rotate(-35deg)', offset: 0.35 }, { transform: 'rotate(10deg)', offset: 0.6 }, { transform: 'rotate(0)' }], { duration: 450, easing: 'ease-in-out' });
      this.sparks(a.x, a.y - a.h / 4);
      void this.say(s.count_words?.[hits - 1] ?? String(hits));
      if (hits >= s.count) window.setTimeout(() => finish?.(), 700);
    };
    this.input.add({ id: 'tap_count', cx: a.x, cy: a.y, w: a.w, h: a.h, enabled: true, onDown: hit });
    await this.withHints({
      done: new Promise<void>((r) => (finish = r)),
      hintTarget: () => (hits >= s.count ? null : { x: a.x, y: a.y, top: a.y - a.h / 2, mark: (on) => tool?.shape.body.classList.toggle('hint-sparkle', on) }),
      autoSolve: () => {
        busyUntil = 0;
        hit();
      },
    }, prompt, this.o.place.hint_delays_s, this.o.place.auto_solve_after_s);
    this.input.remove('tap_count');
    for (const id of s.then_show ?? []) {
      const live = this.items.get(id);
      if (!live) continue;
      live.shape.root.style.display = '';
      void animate(live.shape.body, [{ transform: 'scale(0)' }, { transform: 'scale(1.25)' }, { transform: 'scale(1)' }], { duration: 500, easing: 'ease-out' });
    }
    if (s.then_show?.length) this.o.sfx.success();
    if (s.success_line) await this.step(this.say(this.text(s.success_line, who)));
  }

  private sparks(x: number, y: number): void {
    for (let i = 0; i < 9; i++) {
      const b = el('circle', { r: 5 + (i % 3) * 2, fill: i % 2 ? '#ffd54f' : '#ff7043' }, this.stage.layers.fx);
      const ang = -Math.PI * (0.1 + 0.8 * (i / 8));
      void tween(450, (k) => {
        b.setAttribute('transform', `translate(${x + Math.cos(ang) * 120 * k} ${y + Math.sin(ang) * 120 * k + 80 * k * k})`);
        b.setAttribute('opacity', String(1 - k));
      }).then(() => b.remove());
    }
  }

  private splash(x: number, y: number): void {
    for (let i = 0; i < 8; i++) {
      const b = el('circle', { r: 8 + (i % 3) * 4, fill: '#fff', opacity: 0.8 }, this.stage.layers.fx);
      const a = (i / 8) * Math.PI * 2;
      void tween(600, (k) => {
        b.setAttribute('transform', `translate(${x + Math.cos(a) * 90 * k} ${y - 40 + Math.sin(a) * 40 * k - Math.sin(k * Math.PI) * 60})`);
        b.setAttribute('opacity', String(0.8 * (1 - k)));
      }).then(() => b.remove());
    }
  }

  private async chooseColor(s: Extract<StepDef, { type: 'choose_color' }>, ctx?: PlayerId): Promise<void> {
    const who = this.resolvePlayer(s.player, ctx);
    this.portraits.setActive(who);
    const target = s.target.replace('{player}', who === 'both' ? this.order()[0] : who);
    const y = s.y ?? 820;
    const n = s.colors.length;
    const gap = 175;
    const pots = s.colors.map((c, i) => {
      const x = 800 + (i - (n - 1) / 2) * gap;
      const root = el('g', {}, this.stage.layers.signs);
      place(root, x, y);
      const body = el('g', { class: 'anim-center' }, root);
      el('ellipse', { cx: 0, cy: 0, rx: 62, ry: 18, fill: '#000', opacity: 0.2 }, body);
      el('path', { d: 'M-55 -95 L -45 0 H 45 L 55 -95 Z', fill: '#90a4ae', stroke: '#455a64', 'stroke-width': 5 }, body);
      el('ellipse', { cx: 0, cy: -95, rx: 56, ry: 20, fill: colorOf(c.color), stroke: '#455a64', 'stroke-width': 5 }, body);
      void animate(body, [{ transform: 'scale(0)' }, { transform: 'scale(1)' }], { duration: 400, delay: i * 90, easing: 'ease-out', fill: 'backwards' });
      return { x, root, body, c, hit: `pot_${i}` };
    });
    const prompt = this.text(s.prompt, who);
    void this.say(prompt, { prompt: true });
    let finish: (() => void) | null = null;
    let chosen = false;
    const pick = (p: (typeof pots)[number]) => {
      if (chosen) return;
      chosen = true;
      pots.forEach((x) => this.input.remove(x.hit));
      this.progress();
      this.o.sfx.success();
      void hop(p.body);
      this.redraw(target, { color: p.c.color });
      const live = this.items.get(target);
      if (live) {
        live.shape.body.classList.add('glow');
        void hop(live.shape.body).then(() => live.shape.body.classList.remove('glow'));
      }
      if (who !== 'both') this.o.onUnicorn?.(who, p.c.color);
      this.bag.setLook(this.o.look);
      void this.say(p.c.line).then(() => finish?.());
    };
    pots.forEach((p) => this.input.add({ id: p.hit, cx: p.x, cy: y - 55, w: 120, h: 120, enabled: true, onDown: () => pick(p) }));
    await this.withHints({
      done: new Promise<void>((r) => (finish = r)),
      hintTarget: () => (chosen ? null : { x: pots[0].x, y: y - 55, top: y - 120, mark: (on) => pots[0].body.classList.toggle('hint-sparkle', on) }),
      autoSolve: () => pick(pots[Math.floor(Math.random() * pots.length)]),
    }, prompt, this.o.place.hint_delays_s, this.o.place.auto_solve_after_s);
    await Promise.all(pots.map((p) => animate(p.root, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'forwards' })));
    pots.forEach((p) => p.root.remove());
  }

  private async fork(s: Extract<StepDef, { type: 'fork' }>, ctx?: PlayerId): Promise<void> {
    const who = this.resolvePlayer(s.player, ctx);
    this.portraits.setActive(who);
    const xs = s.options.length === 2 ? [480, 1120] : s.options.map((_, i) => 800 + (i - (s.options.length - 1) / 2) * 380);
    const y = 380;
    const cards = s.options.map((opt, i) => {
      const card = drawCard(this.stage.layers.signs, xs[i], y, opt.card);
      void animate(card.body, [{ transform: 'scale(0)' }, { transform: 'scale(1.08)' }, { transform: 'scale(1)' }], { duration: 450, delay: i * 150, easing: 'ease-out', fill: 'backwards' });
      return { opt, card, x: xs[i], hit: `card_${i}` };
    });
    // Panneau indicateur entre les deux chemins
    const post = el('g', {}, this.stage.layers.signs);
    place(post, 800, 560);
    el('rect', { x: -10, y: -170, width: 20, height: 170, fill: '#6d4c41' }, post);
    el('path', { d: 'M-12 -150 H -90 L -110 -130 L -90 -110 H -12 Z M12 -120 H 90 L 110 -100 L 90 -80 H 12 Z', fill: '#a1887f', stroke: '#5d4037', 'stroke-width': 4 }, post);
    const prompt = this.text(s.prompt, who);
    void this.say(prompt, { prompt: true });
    let finish: ((c: (typeof cards)[number]) => void) | null = null;
    let chosen = false;
    const choose = (c: (typeof cards)[number]) => {
      if (chosen) return;
      chosen = true;
      cards.forEach((x) => this.input.remove(x.hit));
      this.progress();
      this.o.sfx.success();
      c.card.body.classList.add('glow');
      void hop(c.card.body);
      cards.filter((x) => x !== c).forEach((x) => void animate(x.card.root, [{ opacity: 1 }, { opacity: 0 }], { duration: 400, fill: 'forwards' }));
      finish?.(c);
    };
    cards.forEach((c) => this.input.add({ id: c.hit, cx: c.x, cy: y, w: 340, h: 260, enabled: true, onDown: () => choose(c) }));
    const picked = await this.withHints<(typeof cards)[number]>({
      done: new Promise((r) => (finish = r)),
      hintTarget: () => (chosen ? null : { x: cards[0].x, y, top: y - 130, mark: (on) => cards.forEach((c) => c.card.body.classList.toggle('hint-sparkle', on)) }),
      autoSolve: () => choose(cards[Math.floor(Math.random() * cards.length)]),
    }, prompt, this.o.place.hint_delays_s, this.o.place.auto_solve_after_s);
    await this.step(this.clock.wait(500));
    await Promise.all([...cards.map((c) => animate(c.card.root, [{ opacity: getComputedStyle(c.card.root).opacity }, { opacity: 0 }], { duration: 300, fill: 'forwards' })), animate(post, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'forwards' })]);
    cards.forEach((c) => c.card.root.remove());
    post.remove();
    const line = this.say(picked.opt.line);
    await this.step(this.changeView({ type: 'view', view: picked.opt.view, trot: true }));
    await this.step(line);
  }

  private async twoTouch(s: Extract<StepDef, { type: 'two_touch' }>): Promise<void> {
    this.portraits.setActive('both');
    const prompt = this.text(s.prompt, 'both');
    void this.say(prompt, { prompt: true });
    const a = s.area;
    const effectItem = s.effect ? this.items.get(s.effect.target) : undefined;
    let finish: (() => void) | null = null;
    const touch = new TwoTouch(this.o.settings.gem_touch, this.clock, () => {
      this.input.remove('two_touch');
      finish?.();
    });
    this.input.add({
      id: 'two_touch', cx: a.x, cy: a.y, w: a.w, h: a.h, enabled: true,
      onDown: (id) => {
        if (touch.done) return;
        this.o.sfx.tap();
        if (effectItem) void animate(effectItem.shape.body, [{ transform: 'rotate(0)' }, { transform: 'rotate(-4deg)' }, { transform: 'rotate(4deg)' }, { transform: 'rotate(0)' }], { duration: 300 });
        touch.down(id);
      },
      onUp: (id) => touch.up(id),
    });
    await this.withHints({
      done: new Promise<void>((r) => (finish = r)),
      hintTarget: () => (touch.done ? null : { x: a.x, y: a.y, top: a.y - a.h / 2, mark: (on) => effectItem?.shape.body.classList.toggle('hint-sparkle', on) }),
      autoSolve: () => touch.end('auto'),
    }, prompt, this.o.place.hint_delays_s, this.o.place.auto_solve_after_s);
    this.o.sfx.party();
    if (effectItem && s.effect) {
      effectItem.shape.body.querySelectorAll('[data-role="liquid"]').forEach((n) => n.setAttribute('fill', colorOf(s.effect!.color)));
      void animate(effectItem.shape.body, [{ transform: 'rotate(0)' }, { transform: 'rotate(-8deg)' }, { transform: 'rotate(8deg)' }, { transform: 'rotate(-5deg)' }, { transform: 'rotate(0)' }], { duration: 900 });
      this.splash(a.x, a.y - a.h / 4);
    }
    confetti(this.stage.layers.fx, { x: a.x, y: a.y }, 70);
    if (s.success_line) await this.step(this.say(this.text(s.success_line, 'both')));
  }

  private showItems(ids: string[] | undefined, show: boolean): void {
    for (const id of ids ?? []) {
      const live = this.items.get(id);
      if (!live) continue;
      live.shape.root.style.display = show ? '' : 'none';
      this.input.setEnabled(`it_${id}`, show && !live.used);
      if (show) void animate(live.shape.body, [{ transform: 'scale(0)' }, { transform: 'scale(1.15)' }, { transform: 'scale(1)' }], { duration: 450, easing: 'ease-out' });
    }
  }

  /** Une récompense sort du sac et sert dans la scène. */
  private async useReward(s: Extract<StepDef, { type: 'use' }>, ctx?: PlayerId): Promise<void> {
    this.portraits.setActive('both');
    const from = this.bag.slotPosition(s.reward);
    const g = el('g', {}, this.stage.layers.fx);
    const icon = el('g', { class: 'glow' }, g);
    drawRewardIcon(icon, s.reward, this.o.look);
    this.o.sfx.success();
    const line = s.line ? this.say(this.text(s.line, this.resolvePlayer(undefined, ctx))) : Promise.resolve();
    await this.step(tween(1200, (k) => place(g, lerp(from.x, s.to.x, k), lerp(from.y, s.to.y, k) - Math.sin(k * Math.PI) * 140, lerp(1, s.scale ?? 2.4, k))));
    this.splash(s.to.x, s.to.y + 40);
    await this.step(animate(g, [{ opacity: 1 }, { opacity: 0 }], { duration: 500, fill: 'forwards' }));
    g.remove();
    this.showItems(s.then_show, true);
    this.showItems(s.then_hide, false);
    await this.step(line);
  }

  /** Jeu de mémoire : chacun son tour retourne deux cartes. Pas de perdant : on retourne les cartes et on recommence. */
  private async memory(s: Extract<StepDef, { type: 'memory' }>): Promise<void> {
    const order = this.order();
    let turn = 0;
    const who = () => order[turn % 2];
    const n = s.faces.length * 2;
    const deck = s.faces.flatMap((_, i) => [i, i]).sort(() => Math.random() - 0.5);
    const rows = Math.ceil(n / s.grid.cols);
    type Card = { face: number; root: SVGGElement; back: SVGGElement; front: SVGGElement; x: number; y: number; open: boolean; done: boolean; hit: string };
    const cards: Card[] = deck.map((face, i) => {
      const col = i % s.grid.cols;
      const row = Math.floor(i / s.grid.cols);
      const x = s.grid.x + (col - (s.grid.cols - 1) / 2) * s.grid.cell;
      const y = s.grid.y + (row - (rows - 1) / 2) * s.grid.cell + 90;
      const root = el('g', {}, this.stage.layers.signs);
      place(root, x, y);
      const flip = el('g', { class: 'anim-center' }, root);
      const back = el('g', {}, flip);
      drawItem(back, { kind: 'card_back', x: 0, y: 0 });
      const front = el('g', {}, flip);
      el('rect', { x: -85, y: -180, width: 170, height: 170, rx: 22, fill: '#fffde7', stroke: '#8d6e63', 'stroke-width': 6 }, front);
      const f = s.faces[face];
      drawItem(front, { ...f, x: 0, y: -40, scale: f.scale ?? 0.85 }, 'shape');
      front.style.display = 'none';
      void animate(flip, [{ transform: 'scale(0)' }, { transform: 'scale(1)' }], { duration: 400, delay: i * 60, easing: 'ease-out', fill: 'backwards' });
      return { face, root, back, front, x, y: y - 95, open: false, done: false, hit: `card_${i}` };
    });
    const turnText = () => this.text(s.turn, who());
    const flipTo = async (c: Card, open: boolean) => {
      const flip = c.root.firstElementChild as SVGGElement;
      await animate(flip, [{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }], { duration: 160, fill: 'forwards' });
      c.open = open;
      c.front.style.display = open ? '' : 'none';
      c.back.style.display = open ? 'none' : '';
      await animate(flip, [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 160, fill: 'forwards' });
    };
    let opened: Card[] = [];
    let busy = false;
    let finish: (() => void) | null = null;
    this.portraits.setActive(who());
    void this.say(turnText(), { prompt: true });
    const tapCard = async (c: Card) => {
      if (busy || c.open || c.done) return;
      this.o.sfx.tap();
      opened.push(c);
      if (opened.length === 2) busy = true;
      await flipTo(c, true);
      if (opened.length < 2) return;
      const [a, b] = opened;
      opened = [];
      if (a.face === b.face) {
        a.done = b.done = true;
        this.input.remove(a.hit);
        this.input.remove(b.hit);
        this.progress();
        this.o.sfx.success();
        for (const x of [a, b]) {
          x.front.classList.add('glow');
          void hop(x.root.firstElementChild as SVGGElement);
        }
        await this.say(s.match_lines[Math.floor(Math.random() * s.match_lines.length)]);
        if (cards.every((x) => x.done)) {
          busy = false;
          finish?.();
          return;
        }
      } else {
        await this.clock.wait(1100);
        await Promise.all([flipTo(a, false), flipTo(b, false)]);
        void this.say(s.miss_line);
      }
      turn++;
      this.portraits.setActive(who());
      void this.say(turnText(), { prompt: true });
      busy = false;
    };
    cards.forEach((c) => this.input.add({ id: c.hit, cx: c.x, cy: c.y, w: s.grid.cell * 0.85, h: s.grid.cell * 0.85, enabled: true, onDown: () => void tapCard(c) }));
    // Aide : Lumi montre une carte, puis sa jumelle.
    const helpTarget = (): Card | null => {
      if (opened.length === 1) return cards.find((x) => !x.done && x !== opened[0] && x.face === opened[0].face) ?? null;
      return cards.find((x) => !x.done) ?? null;
    };
    await this.withHints({
      done: new Promise<void>((r) => (finish = r)),
      hintTarget: () => {
        const c = helpTarget();
        return c ? { x: c.x, y: c.y, top: c.y - 85, mark: (on) => (c.root.firstElementChild as SVGGElement).classList.toggle('hint-sparkle', on) } : null;
      },
      autoSolve: () => {
        if (busy) return;
        const c = helpTarget();
        if (!c) return;
        void tapCard(c).then(() => {
          const twin = opened.length === 1 ? cards.find((x) => !x.done && x !== opened[0] && x.face === opened[0].face) : null;
          if (twin) window.setTimeout(() => void tapCard(twin), 400);
        });
      },
    }, turnText, this.o.place.hint_delays_s, this.o.place.auto_solve_after_s);
    if (s.done_line) await this.step(this.say(s.done_line));
    await Promise.all(cards.map((c) => animate(c.root, [{ opacity: 1 }, { opacity: 0 }], { duration: 400, fill: 'forwards' })));
    cards.forEach((c) => c.root.remove());
  }

  /** Partager : on touche une assiette pour lui donner une part ; une assiette pleine dit « assez ! ». */
  private async share(s: Extract<StepDef, { type: 'share' }>, ctx?: PlayerId): Promise<void> {
    const who = this.resolvePlayer(s.player, ctx);
    this.portraits.setActive(who);
    const total = s.plates.length * s.per_plate;
    const pieces = Array.from({ length: total }, (_, i) => {
      const x = s.pile.x + (i - (total - 1) / 2) * Math.min(80, 520 / total);
      const shape = drawItem(this.stage.layers.signs, { kind: 'slice', color: '#f8bbd0', x, y: s.pile.y, scale: 0.9 });
      void animate(shape.body, [{ transform: 'scale(0)' }, { transform: 'scale(1)' }], { duration: 300, delay: i * 60, fill: 'backwards' });
      return { shape, x, y: s.pile.y, given: false };
    });
    const counts = s.plates.map(() => 0);
    const plateShapes = s.plates.map((p) => drawItem(this.stage.layers.objects, { kind: 'plate', x: p.x, y: p.y }));
    const prompt = this.text(s.prompt, who);
    void this.say(prompt, { prompt: true });
    let given = 0;
    let lastFull = 0;
    let finish: (() => void) | null = null;
    const give = (pi: number) => {
      if (given >= total) return;
      const p = s.plates[pi];
      if (counts[pi] >= s.per_plate) {
        void wobble(plateShapes[pi].body);
        this.o.sfx.pouic();
        if (performance.now() - lastFull > 3000) {
          lastFull = performance.now();
          void this.say(s.full_line);
        }
        return;
      }
      const piece = pieces.find((x) => !x.given)!;
      piece.given = true;
      const k = counts[pi]++;
      given++;
      this.progress();
      this.o.sfx.success();
      void this.say(s.count_words?.[k] ?? String(k + 1));
      const to = { x: p.x + (k - (s.per_plate - 1) / 2) * 46, y: p.y - 20 - (k % 2) * 6 };
      void flyItem(piece.shape, { x: piece.x, y: piece.y }, 0.9, to, 0.7, 600).then(() => {
        if (given >= total) window.setTimeout(() => finish?.(), 400);
      });
    };
    s.plates.forEach((p, i) => this.input.add({ id: `plate_${i}`, cx: p.x, cy: p.y - 40, w: 220, h: 160, enabled: true, onDown: () => give(i) }));
    const emptiest = () => counts.indexOf(Math.min(...counts));
    await this.withHints({
      done: new Promise<void>((r) => (finish = r)),
      hintTarget: () => {
        if (given >= total) return null;
        const i = emptiest();
        const p = s.plates[i];
        return { x: p.x, y: p.y - 20, top: p.y - 60, mark: (on) => plateShapes[i].body.classList.toggle('hint-sparkle', on) };
      },
      autoSolve: () => give(emptiest()),
    }, prompt, this.o.place.hint_delays_s, this.o.place.auto_solve_after_s);
    s.plates.forEach((_, i) => this.input.remove(`plate_${i}`));
    if (s.success_line) await this.step(this.say(this.text(s.success_line, who)));
    await Promise.all([...pieces.map((x) => x.shape.root), ...plateShapes.map((x) => x.root)].map((r) => animate(r, [{ opacity: 1 }, { opacity: 0 }], { duration: 400, fill: 'forwards' })));
    pieces.forEach((x) => x.shape.root.remove());
    plateShapes.forEach((x) => x.root.remove());
  }

  /** Suite de sons et couleurs : Lumi joue, l'enfant répète. Une erreur ? On réécoute, c'est tout. */
  private async simon(s: Extract<StepDef, { type: 'simon' }>): Promise<void> {
    const pads = s.pads.map((p, i) => {
      const shape = drawItem(this.stage.layers.objects, { kind: 'pad', color: p.color, x: p.x, y: p.y });
      void animate(shape.body, [{ transform: 'scale(0)' }, { transform: 'scale(1)' }], { duration: 400, delay: i * 120, fill: 'backwards' });
      return { ...p, shape, hit: `pad_${i}` };
    });
    const light = (i: number) => {
      const p = pads[i];
      this.o.sfx.chime(i);
      p.shape.body.classList.add('glow');
      void animate(p.shape.body, [{ transform: 'translateY(0) scale(1)' }, { transform: 'translateY(-18px) scale(1.15)' }, { transform: 'translateY(0) scale(1)' }], { duration: 450 });
      window.setTimeout(() => p.shape.body.classList.remove('glow'), 450);
    };
    for (const round of s.rounds) {
      const who = this.resolvePlayer(round.player);
      this.portraits.setActive(who);
      let pos = 0;
      let listening = true;
      const play = async () => {
        listening = true;
        await this.step(this.say(s.listen));
        for (const i of round.seq) {
          light(i);
          await this.step(this.clock.wait(700));
        }
        listening = false;
        pos = 0;
      };
      await play();
      const yourTurn = this.text(s.your_turn, who);
      void this.say(yourTurn, { prompt: true });
      let finish: (() => void) | null = null;
      const tap = (i: number) => {
        if (listening || pos >= round.seq.length) return;
        light(i);
        if (i === round.seq[pos]) {
          pos++;
          this.progress();
          if (pos >= round.seq.length) {
            this.o.sfx.success();
            window.setTimeout(() => finish?.(), 500);
          }
        } else {
          // Pas de son d'erreur : on réécoute la suite ensemble.
          listening = true;
          window.setTimeout(() => {
            void this.say(s.retry_line).then(() => play()).then(() => void this.say(yourTurn, { prompt: true })).catch(() => {});
          }, 400);
        }
      };
      pads.forEach((p, i) => this.input.add({ id: p.hit, cx: p.x, cy: p.y - 50, w: 210, h: 130, enabled: true, onDown: () => tap(i) }));
      await this.withHints({
        done: new Promise<void>((r) => (finish = r)),
        hintTarget: () => {
          if (pos >= round.seq.length) return null;
          const p = pads[round.seq[pos]];
          return { x: p.x, y: p.y - 50, top: p.y - 110, mark: (on) => p.shape.body.classList.toggle('hint-sparkle', on) };
        },
        autoSolve: () => tap(round.seq[pos]),
      }, yourTurn, this.o.place.hint_delays_s, this.o.place.auto_solve_after_s);
      pads.forEach((p) => this.input.remove(p.hit));
      await this.step(this.say(s.good_lines[Math.floor(Math.random() * s.good_lines.length)]));
    }
  }

  /** Gauche, droite, haut, bas : sauter sur le bon nuage. Lumi montre le bon côté en cas d'erreur. */
  private async direction(s: Extract<StepDef, { type: 'direction' }>): Promise<void> {
    const walkers = s.walkers.map((id) => this.items.get(id)).filter((l): l is Live => !!l);
    const offsets = walkers.map((w) => ({ dx: w.def.x - s.start.x, dy: w.def.y - s.start.y, s: w.def.scale ?? 1 }));
    let at = { ...s.start };
    for (const round of s.rounds) {
      const who = this.resolvePlayer(round.player);
      this.portraits.setActive(who);
      const clouds = [round.to, round.other].map((p, i) => {
        const shape = drawItem(this.stage.layers.ambient, { kind: 'cloud_step', x: p.x, y: p.y });
        void animate(shape.body, [{ transform: 'scale(0)' }, { transform: 'scale(1)' }], { duration: 400, delay: i * 150, fill: 'backwards' });
        return { p, shape, good: i === 0, hit: `cloud_${i}` };
      });
      const prompt = this.text(s.prompts[round.dir], who);
      void this.say(prompt, { prompt: true });
      let finish: (() => void) | null = null;
      let done = false;
      let lastWrong = 0;
      const tap = (c: (typeof clouds)[number]) => {
        if (done) return;
        if (!c.good) {
          void wobble(c.shape.body);
          if (performance.now() - lastWrong > 2500) {
            lastWrong = performance.now();
            this.o.voice.clear();
            void this.say(s.wrong[round.dir]);
            void this.lumi.hoverNear({ x: round.to.x, y: round.to.y - 50, top: round.to.y - 110 });
          }
          return;
        }
        done = true;
        this.progress();
        this.o.sfx.success();
        const from = at;
        at = { ...round.to };
        void Promise.all(walkers.map((w, i) => {
          const o = offsets[i];
          return tween(700, (k) => place(w.shape.root, lerp(from.x, at.x, k) + o.dx, lerp(from.y, at.y, k) + o.dy - Math.sin(k * Math.PI) * 120, o.s));
        })).then(() => {
          walkers.forEach((w, i) => Object.assign(w.def, { x: at.x + offsets[i].dx, y: at.y + offsets[i].dy }));
          finish?.();
        });
      };
      clouds.forEach((c) => this.input.add({ id: c.hit, cx: c.p.x, cy: c.p.y - 50, w: 240, h: 130, enabled: true, onDown: () => tap(c) }));
      await this.withHints({
        done: new Promise<void>((r) => (finish = r)),
        hintTarget: () => (done ? null : { x: round.to.x, y: round.to.y - 50, top: round.to.y - 110, mark: (on) => clouds[0].shape.body.classList.toggle('hint-sparkle', on) }),
        autoSolve: () => tap(clouds[0]),
      }, prompt, this.o.place.hint_delays_s, this.o.place.auto_solve_after_s);
      clouds.forEach((c) => this.input.remove(c.hit));
      void animate(clouds[1].shape.root, [{ opacity: 1 }, { opacity: 0 }], { duration: 400, fill: 'forwards' }).then(() => clouds[1].shape.root.remove());
      await this.step(this.say(s.good_lines[Math.floor(Math.random() * s.good_lines.length)]));
    }
  }

  private async reward(from: { x: number; y: number }): Promise<void> {
    const id = this.o.place.reward;
    this.portraits.setActive('both');
    const g = el('g', {}, this.stage.layers.fx);
    const icon = el('g', {}, g);
    drawRewardIcon(icon, id, this.o.look);
    const to = this.bag.slotPosition(id);
    this.o.sfx.party();
    confetti(this.stage.layers.fx, from, 90);
    await this.step(tween(400, (k) => place(g, from.x, from.y, lerp(0.2, 2.2, k))));
    await this.step(this.clock.wait(900));
    await this.step(tween(1100, (k) => place(g, lerp(from.x, to.x, k), lerp(from.y, to.y, k) - Math.sin(k * Math.PI) * 150, lerp(2.2, 1, k))));
    g.remove();
    this.bag.fill(id, true);
    this.o.sfx.success();
    this.o.onReward?.(id);
  }
}
