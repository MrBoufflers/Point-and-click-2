import { flyItem } from '../../render/basket';
import { drawItem, type ItemShape } from '../../render/items';
import { animate } from '../../render/svg';
import type { FindObjectsTurnDef, ItemDef, TurnDefBase } from '../../types';
import type { HintTarget, Turn, TurnContext } from './types';

interface Item {
  def: ItemDef;
  correct: boolean;
  shape: ItemShape;
  hitId: string;
  collected: boolean;
  scale: number;
}

/** « Trouve les N objets » : taper les bonnes cibles, ignorer gentiment les autres. */
export function createFindObjects(ctx: TurnContext, raw: TurnDefBase): Turn {
  const def = raw as FindObjectsTurnDef;
  const kind = def.object_kind ?? 'mushroom';
  const collectMode = def.collect ?? (ctx.basket ? 'basket' : 'glow');
  const showFromStart = def.show_from_start !== false;
  const need = Math.min(def.need ?? def.targets.length, def.targets.length);

  const items: Item[] = [
    ...def.targets.map((d) => ({ d, correct: true })),
    ...def.distractors.map((d) => ({ d, correct: false })),
  ].map(({ d, correct }, i) => {
    const shape = drawItem(ctx.layers.objects, d, kind);
    const scale = d.scale ?? 1;
    const item: Item = { def: d, correct, shape, hitId: `obj_${ctx.turnIndex}_${d.id ?? i}`, collected: false, scale };
    if (!showFromStart) shape.root.style.display = 'none';
    ctx.input.add({
      id: item.hitId,
      cx: d.x,
      cy: d.y - (shape.h / 2) * scale,
      w: shape.w * scale,
      h: shape.h * scale,
      enabled: false,
      onDown: () => onTap(item),
    });
    return item;
  });
  if (ctx.basket && collectMode === 'basket') ctx.basket.capacity = need;
  const collected: ItemShape[] = [];
  let found = 0;
  let finish: ((n: number) => void) | null = null;

  function onTap(item: Item): void {
    if (item.collected || found >= need) return;
    if (item.correct) {
      collect(item);
      ctx.progress();
    } else {
      // Pas d'erreur : un petit « pouic » et l'objet dodeline.
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
    collected.push(item.shape);
    ctx.sfx.success();
    if (def.count_aloud) void ctx.say(ctx.scene.lines.count[n - 1] ?? String(n));
    item.shape.body.classList.add('glow');
    const from = { x: item.def.x, y: item.def.y };
    void animate(item.shape.body, [
      { transform: 'translateY(0) scale(1)' }, { transform: 'translateY(-70px) scale(1.15,0.92)', offset: 0.4 },
      { transform: 'translateY(0) scale(0.95,1.05)', offset: 0.8 }, { transform: 'translateY(0) scale(1)' },
    ], { duration: 550, easing: 'ease-out' })
      .then(() => {
        if (collectMode === 'glow') return;
        item.shape.body.classList.remove('glow');
        if (collectMode === 'slots') {
          const slot = def.slots?.[n - 1];
          if (!slot) return;
          return flyItem(item.shape, from, item.scale, slot, slot.scale ?? item.scale);
        }
        return ctx.basket?.add(item.shape, from, item.scale);
      })
      .then(() => {
        if (n === need) void done();
      });
  }

  async function done(): Promise<void> {
    // Les autres objets ne servent plus : ils ne réagissent plus.
    items.forEach((i) => ctx.input.remove(i.hitId));
    ctx.memory.collected = collected;
    await ctx.say(ctx.text(def.success_line));
    if (def.hide_after) {
      const rest = items.filter((i) => !i.collected || collectMode === 'glow');
      await Promise.all(rest.map((i) => animate(i.shape.root, [{ opacity: 1 }, { opacity: 0 }], { duration: 500, fill: 'forwards' })));
      rest.forEach((i) => (i.shape.root.style.display = 'none'));
    } else if (collectMode === 'glow') {
      collected.forEach((s) => s.body.classList.remove('glow'));
    }
    finish?.(found);
  }

  const nextTarget = () => items.find((i) => i.correct && !i.collected) ?? null;

  return {
    run() {
      return new Promise<number>((resolve) => {
        finish = resolve;
        items.forEach((i, k) => {
          if (i.collected) return;
          ctx.input.setEnabled(i.hitId, true);
          if (!showFromStart) {
            i.shape.root.style.display = '';
            void animate(i.shape.body, [{ transform: 'scale(0)' }, { transform: 'scale(1.15)', offset: 0.7 }, { transform: 'scale(1)' }], {
              duration: 450, delay: k * 70, easing: 'ease-out', fill: 'backwards',
            });
          }
        });
        if (need === 0) void done();
      });
    },
    hintTarget(): HintTarget | null {
      const t = nextTarget();
      if (!t || found >= need) return null;
      return {
        x: t.def.x,
        y: t.def.y - (t.shape.h / 2) * t.scale,
        top: t.def.y - t.shape.h * t.scale,
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
