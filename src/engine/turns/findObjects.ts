import { drawMushroom, MUSHROOM_H, MUSHROOM_W, type MushroomShape } from '../../render/mushroom';
import { animate, colorOf, place } from '../../render/svg';
import type { FindObjectsTurnDef, PlacedObjectDef, TurnDefBase } from '../../types';
import type { HintTarget, Turn, TurnContext } from './types';

interface Item {
  def: PlacedObjectDef;
  correct: boolean;
  shape: MushroomShape;
  hitId: string;
  collected: boolean;
  scale: number;
}

/** « Trouve les N objets » : taper les bonnes cibles, ignorer gentiment les autres. */
export function createFindObjects(ctx: TurnContext, raw: TurnDefBase): Turn {
  const def = raw as FindObjectsTurnDef;
  const items: Item[] = [
    ...def.targets.map((d) => ({ d, correct: true })),
    ...def.distractors.map((d) => ({ d, correct: false })),
  ].map(({ d, correct }) => {
    const shape = drawMushroom(ctx.layers.objects, colorOf(d.color));
    const scale = d.scale ?? 1;
    place(shape.root, d.x, d.y, scale);
    const item: Item = { def: d, correct, shape, hitId: `obj_${d.id}`, collected: false, scale };
    ctx.input.add({
      id: item.hitId,
      cx: d.x,
      cy: d.y - (MUSHROOM_H / 2) * scale,
      w: MUSHROOM_W * scale,
      h: MUSHROOM_H * scale,
      enabled: false,
      onDown: () => onTap(item),
    });
    return item;
  });
  const total = def.targets.length;
  ctx.basket.capacity = total;
  let found = 0;
  let finish: ((n: number) => void) | null = null;

  function onTap(item: Item): void {
    if (item.collected) return;
    if (item.correct) {
      collect(item);
      ctx.progress();
    } else {
      // Pas d'erreur : un petit « pouic » et le champignon dodeline.
      ctx.sfx.pouic();
      void animate(item.shape.body, [
        { transform: 'rotate(0)' }, { transform: 'rotate(-14deg) scale(1.05,0.95)' }, { transform: 'rotate(12deg)' },
        { transform: 'rotate(-7deg)' }, { transform: 'rotate(0)' },
      ], { duration: 650, easing: 'ease-in-out' });
    }
  }

  function collect(item: Item): void {
    item.collected = true;
    ctx.input.remove(item.hitId);
    item.shape.body.classList.remove('hint-sparkle');
    found += 1;
    const n = found;
    ctx.sfx.success();
    if (def.count_aloud) void ctx.say(ctx.scene.lines.count[n - 1] ?? String(n));
    item.shape.body.classList.add('glow');
    void animate(item.shape.body, [
      { transform: 'translateY(0) scale(1)' }, { transform: 'translateY(-70px) scale(1.15,0.92)', offset: 0.4 },
      { transform: 'translateY(0) scale(0.95,1.05)', offset: 0.8 }, { transform: 'translateY(0) scale(1)' },
    ], { duration: 550, easing: 'ease-out' })
      .then(() => {
        item.shape.body.classList.remove('glow');
        return ctx.basket.add(item.shape, { x: item.def.x, y: item.def.y }, item.scale);
      })
      .then(() => {
        if (n === total) void done();
      });
  }

  async function done(): Promise<void> {
    await ctx.say(ctx.text(def.success_line));
    finish?.(found);
  }

  const nextTarget = () => items.find((i) => i.correct && !i.collected) ?? null;

  return {
    run() {
      return new Promise<number>((resolve) => {
        finish = resolve;
        items.forEach((i) => !i.collected && ctx.input.setEnabled(i.hitId, true));
        if (total === 0) void done();
      });
    },
    hintTarget(): HintTarget | null {
      const t = nextTarget();
      if (!t) return null;
      return {
        x: t.def.x,
        y: t.def.y - (MUSHROOM_H / 2) * t.scale,
        top: t.def.y - MUSHROOM_H * t.scale,
        mark: (on) => !t.collected && t.shape.body.classList.toggle('hint-sparkle', on),
      };
    },
    autoSolve() {
      const t = nextTarget();
      if (t) onTap(t);
    },
    dispose() {
      items.forEach((i) => ctx.input.remove(i.hitId));
    },
  };
}
