import { AMBIENT } from '../../render/ambient';
import { animate, el } from '../../render/svg';
import { drawHouse, HOUSE_H, HOUSE_W } from '../../render/village';
import type { HouseDef, VillageDef } from '../../types';
import { ABORT, PlaceBase, type VillageCommon } from './base';

export interface HubOptions extends VillageCommon {
  village: VillageDef;
  /** Maisons déjà terminées. */
  done: string[];
  firstVisit: boolean;
  onEnter: (house: HouseDef) => void;
}

/** La carte du village : on touche une maison pour y entrer, dans l'ordre qu'on veut. */
export class VillageHub extends PlaceBase {
  private entering = false;

  constructor(private o: HubOptions) {
    super(o, o.village.view, o.village.lumi.home);
    const L = this.stage.layers;
    this.drawPaths(L.bg);
    for (const def of o.village.ambient_hotspots) {
      const make = AMBIENT[def.reaction];
      if (!make) continue;
      const a = make(L.ambient, def);
      this.input.add({ id: `amb_${def.id}`, cx: a.cx, cy: a.cy, w: a.w, h: a.h, enabled: true, onDown: () => { o.sfx.tap(); a.react(); } });
    }
    for (const h of o.village.houses) this.addHouse(h);
    this.portraits.setActive(null);
  }

  private drawPaths(bg: SVGGElement): void {
    const FOUNTAIN = this.o.village.fountain;
    for (const h of this.o.village.houses) {
      const d = `M${FOUNTAIN.x} ${FOUNTAIN.y} Q ${(FOUNTAIN.x + h.x) / 2} ${(FOUNTAIN.y + h.y) / 2 + 60} ${h.x} ${h.y}`;
      el('path', { d, stroke: '#bfa071', 'stroke-width': 74, fill: 'none', 'stroke-linecap': 'round' }, bg);
      el('path', { d, stroke: '#e3c894', 'stroke-width': 58, fill: 'none', 'stroke-linecap': 'round' }, bg);
    }
    el('circle', { cx: FOUNTAIN.x, cy: FOUNTAIN.y, r: 130, fill: '#e3c894', stroke: '#bfa071', 'stroke-width': 8 }, bg);
    el('circle', { cx: FOUNTAIN.x, cy: FOUNTAIN.y, r: 78, fill: '#90a4ae', stroke: '#607d8b', 'stroke-width': 8 }, bg);
    el('circle', { cx: FOUNTAIN.x, cy: FOUNTAIN.y, r: 62, fill: '#4fc3f7' }, bg);
    el('circle', { cx: FOUNTAIN.x, cy: FOUNTAIN.y, r: 18, fill: '#e1f5fe', class: 'fountain' }, bg);
  }

  private addHouse(h: HouseDef): void {
    const closed = !h.place;
    const s = h.scale ?? 1;
    const house = drawHouse(this.stage.layers.objects, h.x, h.y, h.roof, h.wall ?? '#fff3e0', h.sign, s, closed);
    if (this.o.done.includes(h.id)) house.star.style.display = '';
    this.input.add({
      id: `house_${h.id}`, cx: h.x, cy: h.y - (HOUSE_H / 2) * s, w: HOUSE_W * s, h: HOUSE_H * s, enabled: true,
      onDown: () => {
        if (this.entering) return;
        this.progress();
        if (closed) {
          this.o.sfx.tap();
          if (house.lock) void animate(house.lock, [{ transform: 'rotate(0)' }, { transform: 'rotate(-20deg)' }, { transform: 'rotate(16deg)' }, { transform: 'rotate(0)' }], { duration: 600 });
          this.o.voice.clear();
          void this.say(h.line);
          return;
        }
        this.entering = true;
        this.o.sfx.success();
        house.body.classList.add('glow');
        void animate(house.body, [{ transform: 'scale(1)' }, { transform: 'scale(1.12,0.92)' }, { transform: 'scale(0.96,1.06)' }, { transform: 'scale(1)' }], { duration: 600 });
        this.o.voice.clear();
        void this.say(h.line).then(() => {
          if (!this.disposed) this.o.onEnter(h);
        });
      },
    });
  }

  start(): void {
    this.run().catch((e) => {
      if (e !== ABORT) console.error(e);
    });
  }

  private async run(): Promise<void> {
    const v = this.o.village;
    this.setState('village');
    const open = v.houses.filter((h) => h.place);
    const allDone = open.every((h) => this.o.done.includes(h.id));
    const first = this.o.firstVisit ? this.say(v.lines.intro) : Promise.resolve();
    void this.lumi.home();
    await this.step(first);
    const prompt = allDone ? v.lines.all_done : v.lines.prompt;
    void this.say(prompt, { prompt: true });
    // Aide douce : Lumi montre une maison pas encore visitée. Pas d'action forcée : la carte est libre.
    const next = open.find((h) => !this.o.done.includes(h.id));
    if (!next || allDone) return;
    await this.withHints({
      done: new Promise<void>(() => {}),
      hintTarget: () => ({ x: next.x, y: next.y - HOUSE_H / 2, top: next.y - HOUSE_H, mark: () => {} }),
    }, prompt, v.hint_delays_s);
  }
}
