import { confetti } from '../render/confetti';
import { drawGemShape, GemBar } from '../render/gems';
import { Lumi } from '../render/lumi';
import { Portraits } from '../render/portraits';
import { createStage, VIEW_H, VIEW_W, type Stage } from '../render/stage';
import { animate, el, lerp, place, tween } from '../render/svg';
import type { FinaleDef, GameSettings, Point } from '../types';
import { Clock } from './clock';
import { HintTimer } from './hints';
import { Input } from './input';
import type { Sfx } from './sfx';
import { TwoTouch } from './twoTouch';
import type { SayOptions, Voice } from './voice';

export type FinaleState = 'door_intro' | 'door_touch' | 'door_open' | 'end';

export interface FinaleOptions {
  container: HTMLElement;
  finale: FinaleDef;
  settings: GameSettings;
  voice: Voice;
  sfx: Sfx;
  debug: boolean;
  gems: string[];
  onState?: (s: FinaleState) => void;
}

const ABORT = Symbol('abort');
const ARCH_R = 230;
const OPEN_W = 380;
const OPEN_H = 340;

/** Finale du niveau : les gemmes vont dans la Porte, les enfants la touchent ensemble, elle s'ouvre. */
export class FinaleRunner {
  private disposed = false;
  private clock = new Clock();
  private stage: Stage;
  private input: Input;
  private lumi: Lumi;
  private gemBar: GemBar;
  private holes: Point[] = [];
  private gemsLayer: SVGGElement;
  private doorAnim: SVGGElement;
  private leaves: SVGGElement[] = [];
  private light: SVGGElement;

  constructor(private o: FinaleOptions) {
    this.stage = createStage(o.container);
    const L = this.stage.layers;
    this.drawSky(L.bg);
    const d = o.finale.door;
    this.doorAnim = el('g', { class: 'anim-base' }, L.objects);
    const door = el('g', {}, this.doorAnim);
    place(door, d.x, d.y);
    // Lumière derrière les battants
    this.light = el('g', { opacity: 0 }, door);
    el('rect', { x: -OPEN_W / 2, y: -OPEN_H, width: OPEN_W, height: OPEN_H, fill: '#fff8dc' }, this.light);
    el('circle', { cx: 0, cy: -OPEN_H / 2, r: 170, fill: 'url(#halo-yellow)' }, this.light);
    // Battants
    for (const side of [-1, 1]) {
      const hinge = el('g', { transform: `translate(${(side * OPEN_W) / 2} 0)` }, door);
      const leaf = el('g', { class: side < 0 ? 'leaf-left' : 'leaf-right' }, hinge);
      const x = side < 0 ? 0 : -OPEN_W / 2;
      el('rect', { x, y: -OPEN_H, width: OPEN_W / 2, height: OPEN_H, fill: '#8d5a34', stroke: '#5d3a1f', 'stroke-width': 6 }, leaf);
      for (let k = 1; k < 4; k++) el('line', { x1: x + (k * OPEN_W) / 8, y1: -OPEN_H + 8, x2: x + (k * OPEN_W) / 8, y2: -6, stroke: '#6d4426', 'stroke-width': 4 }, leaf);
      for (const y of [-OPEN_H + 70, -70]) el('rect', { x: x + 6, y: y - 10, width: OPEN_W / 2 - 12, height: 20, fill: '#5d4037' }, leaf);
      el('circle', { cx: side < 0 ? OPEN_W / 2 - 26 : -OPEN_W / 2 + 26, cy: -OPEN_H / 2, r: 12, fill: '#ffca28', stroke: '#8d6e63', 'stroke-width': 3 }, leaf);
      this.leaves.push(leaf);
    }
    // Arche de pierre avec 5 creux
    const archTop = -OPEN_H;
    el('path', {
      d: `M${-OPEN_W / 2 - 70} 0 V ${archTop} A ${OPEN_W / 2 + 70} ${OPEN_W / 2 + 70} 0 0 1 ${OPEN_W / 2 + 70} ${archTop} V 0 H ${OPEN_W / 2} V ${archTop} A ${OPEN_W / 2} ${OPEN_W / 2 - 40} 0 0 0 ${-OPEN_W / 2} ${archTop} V 0 Z`,
      fill: '#9e9e9e', stroke: '#616161', 'stroke-width': 8, 'stroke-linejoin': 'round',
    }, door);
    el('path', { d: `M${-OPEN_W / 2} ${archTop} A ${OPEN_W / 2} ${OPEN_W / 2 - 40} 0 0 1 ${OPEN_W / 2} ${archTop} Z`, fill: '#6d4c41' }, door);
    const n = o.settings.level_gems.length;
    for (let i = 0; i < n; i++) {
      const a = Math.PI - (Math.PI * (i + 0.5)) / n;
      const p = { x: Math.cos(a) * ARCH_R, y: archTop - Math.sin(a) * (ARCH_R - 40) };
      el('circle', { cx: p.x, cy: p.y, r: 34, fill: '#424242', stroke: '#757575', 'stroke-width': 5 }, door);
      this.holes.push({ x: d.x + p.x, y: d.y + p.y });
    }
    this.gemsLayer = el('g', {}, L.gem);
    this.input = new Input(this.stage.svg, o.settings.touch, o.debug ? L.debug : null);
    this.gemBar = new GemBar(L.hud, o.settings.level_gems, o.gems);
    new Portraits(L.hud, o.settings.players).setActive(null);
    this.lumi = new Lumi(L.lumi, o.finale.lumi.home, { x: VIEW_W + 120, y: -80 });
  }

  private drawSky(bg: SVGGElement): void {
    const sky = el('linearGradient', { id: 'sky', x1: 0, y1: 0, x2: 0, y2: 1 }, bg);
    el('stop', { offset: 0, 'stop-color': '#1a1446' }, sky);
    el('stop', { offset: 1, 'stop-color': '#5b3f8f' }, sky);
    el('rect', { x: -800, y: -400, width: VIEW_W + 1600, height: VIEW_H + 800, fill: 'url(#sky)' }, bg);
    for (let i = 0; i < 40; i++) {
      const s = el('circle', { cx: (i * 397) % 1600, cy: (i * 151) % 520, r: 2 + (i % 3), fill: '#fff', class: 'firefly' }, bg);
      s.style.animationDelay = `${(i * 0.31) % 3}s`;
    }
    el('path', { d: 'M-800 640 Q 300 580 800 610 T 2400 620 V 1300 H -800 Z', fill: '#3d6b45' }, bg);
    el('path', { d: 'M700 900 L 740 640 L 860 640 L 900 900 Z', fill: '#bcaaa4', opacity: 0.7 }, bg);
  }

  private say(text: string, opts?: SayOptions): Promise<void> {
    if (this.disposed || !text) return Promise.resolve();
    return this.o.voice.say(text, opts);
  }

  private async step<T>(p: Promise<T>): Promise<T> {
    const v = await p;
    if (this.disposed) throw ABORT;
    return v;
  }

  private setState(s: FinaleState): void {
    document.body.dataset.state = s;
    this.o.onState?.(s);
  }

  start(): void {
    this.run().catch((e) => {
      if (e !== ABORT) console.error(e);
    });
  }

  private async run(): Promise<void> {
    const f = this.o.finale;
    this.setState('door_intro');
    const intro = this.say(f.lines.intro, { prompt: true });
    void this.lumi.home();
    await this.step(this.clock.wait(1200));
    // Chaque gemme quitte le bandeau et va dans son creux de la porte.
    for (const [i, color] of this.o.settings.level_gems.entries()) {
      const from = this.gemBar.takeGem(color);
      if (!from) continue;
      const g = el('g', {}, this.gemsLayer);
      const shape = el('g', {}, g);
      drawGemShape(shape, color);
      const to = this.holes[i];
      await this.step(tween(800, (k) => {
        place(g, lerp(from.x, to.x, k), lerp(from.y, to.y, k) - Math.sin(k * Math.PI) * 120, 1);
        shape.setAttribute('transform', `scale(${lerp(36, 30, k)}) rotate(${k * 360})`);
      }));
      this.o.sfx.success();
      const ring = el('circle', { cx: to.x, cy: to.y, r: 40, fill: 'url(#halo-white)', class: 'anim-center' }, this.gemsLayer);
      void animate(ring, [{ transform: 'scale(0.5)', opacity: 1 }, { transform: 'scale(2)', opacity: 0 }], { duration: 700 }).then(() => ring.remove());
    }
    await this.step(intro);

    this.setState('door_touch');
    const touchLine = f.lines.touch;
    void this.say(touchLine, { prompt: true });
    const mode = await this.step(this.waitForTouch(touchLine));

    this.setState('door_open');
    this.o.sfx.party();
    void animate(this.light, [{ opacity: 0 }, { opacity: 1 }], { duration: 900, fill: 'forwards' });
    this.leaves.forEach((leaf) => void animate(leaf, [{ transform: 'scaleX(1)' }, { transform: 'scaleX(0.12)' }], { duration: 1400, easing: 'ease-in-out', fill: 'forwards' }));
    const d = f.door;
    confetti(this.stage.layers.fx, { x: d.x, y: d.y - OPEN_H / 2 }, mode === 'together' ? 160 : 120);
    this.clock.setTimeout(() => confetti(this.stage.layers.fx, { x: 250, y: 820 }, 70), 400);
    this.clock.setTimeout(() => confetti(this.stage.layers.fx, { x: 1350, y: 820 }, 70), 600);
    await this.step(this.say(f.lines.celebration));
    await this.step(this.clock.wait(1200));

    this.setState('end');
    this.input.disableAll();
    const dim = el('rect', { x: -800, y: -400, width: VIEW_W + 1600, height: VIEW_H + 800, fill: '#0b1026', opacity: 0 }, this.stage.layers.dim);
    void animate(dim, [{ opacity: 0 }, { opacity: 0.5 }], { duration: 1500, fill: 'forwards' });
    void this.lumi.sleep(f.lumi.sleep_spot);
  }

  /** Les deux enfants touchent la porte (avec l'aide progressive de Lumi). */
  private waitForTouch(prompt: string): Promise<string> {
    const f = this.o.finale;
    const d = f.door;
    const target = { x: d.x, y: d.y - OPEN_H / 2, top: d.y - OPEN_H };
    return new Promise((resolve) => {
      const hints = new HintTimer(this.clock, f.hint_delays_s, f.auto_solve_after_s, (level) => {
        if (level === 0) void this.say(prompt, { prompt: true });
        else if (level === 1) void this.lumi.hoverNear(target);
        else if (level === 2) {
          void this.lumi.landOn(target);
          this.doorAnim.classList.add('hint-glow');
        } else touch.end('auto');
      });
      const touch = new TwoTouch(this.o.settings.gem_touch, this.clock, (mode) => {
        hints.stop();
        this.input.remove('door');
        this.doorAnim.classList.remove('hint-glow');
        void this.lumi.home();
        resolve(mode);
      });
      this.input.add({
        id: 'door', cx: target.x, cy: target.y, w: OPEN_W, h: OPEN_H, enabled: true,
        onDown: (id) => {
          if (touch.done) return;
          this.o.sfx.tap();
          void animate(this.doorAnim, [{ transform: 'scale(1)' }, { transform: 'scale(1.03,0.98)' }, { transform: 'scale(1)' }], { duration: 300 });
          touch.down(id);
        },
        onUp: (id) => touch.up(id),
      });
      hints.start();
    });
  }

  setSpeaking(b: boolean): void {
    this.lumi.setSpeaking(b);
  }

  dispose(): void {
    this.disposed = true;
    this.clock.dispose();
    this.o.voice.clear();
    this.o.voice.resetMemory();
    this.lumi.dispose();
    this.input.dispose();
    this.o.container.textContent = '';
  }
}
