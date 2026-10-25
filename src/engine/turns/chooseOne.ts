import { flyItem } from '../../render/basket';
import { drawItem, highlightBody, type ItemShape } from '../../render/items';
import { animate } from '../../render/svg';
import type { ChooseOneTurnDef, ItemDef, TurnDefBase } from '../../types';
import type { HintTarget, Turn, TurnContext } from './types';

interface Choice {
  def: ItemDef & { id: string };
  shape: ItemShape;
  hitId: string;
  scale: number;
}

/**
 * « Lequel va là ? » : on regarde une suite (ou un trou) avec une place vide,
 * et on choisit l'objet qui la complète. Le bon objet s'envole à sa place.
 */
export function createChooseOne(ctx: TurnContext, raw: TurnDefBase): Turn {
  const def = raw as ChooseOneTurnDef;
  let shown: { def: ChooseOneTurnDef['display'][number]; shape: ItemShape }[] = [];
  let choices: Choice[] = [];
  let solved = false;
  let explaining = false;
  let token = 0;
  let finish: (() => void) | null = null;

  const missing = () => shown.find((s) => s.def.missing);

  async function onTap(c: Choice): Promise<void> {
    if (solved) return;
    if (c.def.id === def.answer) {
      solved = true;
      token++;
      ctx.progress();
      choices.forEach((x) => ctx.input.remove(x.hitId));
      ctx.voice.clear();
      ctx.sfx.success();
      c.shape.body.classList.remove('hint-sparkle');
      c.shape.body.classList.add('glow');
      choices.filter((x) => x !== c).forEach((x) => void animate(x.shape.root, [{ opacity: 1 }, { opacity: 0 }], { duration: 500, fill: 'forwards' }));
      const slot = missing();
      if (slot) {
        const to = { x: slot.def.x, y: slot.def.y };
        await flyItem(c.shape, { x: c.def.x, y: c.def.y }, c.scale, to, slot.def.scale ?? c.scale, 800);
        void animate(slot.shape.root, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'forwards' });
      }
      ctx.sfx.success();
      shown.filter((s) => !s.def.missing).forEach((s, i) => window.setTimeout(() => highlightBody(s.shape.body), i * 110));
      window.setTimeout(() => c.shape.body.classList.remove('glow'), 1500);
      await ctx.say(ctx.text(def.success_line));
      // La suite disparaît pour laisser la place au tour suivant.
      const all = [...shown.map((x) => x.shape.root), ...choices.map((x) => x.shape.root)];
      await Promise.all(all.map((r) => animate(r, [{ opacity: getComputedStyle(r).opacity }, { opacity: 0 }], { duration: 500, fill: 'forwards' })));
      all.forEach((r) => r.remove());
      finish?.();
      return;
    }
    // Mauvais choix : l'objet tremble, Lumi relit la suite avec l'enfant. Aucune pénalité.
    ctx.sfx.tap();
    void animate(c.shape.body, [
      { transform: 'translateX(0)' }, { transform: 'translateX(-12px) rotate(-6deg)' }, { transform: 'translateX(10px) rotate(5deg)' },
      { transform: 'translateX(-6px)' }, { transform: 'translateX(0)' },
    ], { duration: 550, easing: 'ease-in-out' });
    if (!explaining) void explain();
  }

  async function explain(): Promise<void> {
    explaining = true;
    const my = ++token;
    await ctx.say(ctx.text(def.retry_line));
    for (const s of shown) {
      if (my !== token) break;
      highlightBody(s.shape.body);
      if (s.def.say) await ctx.say(s.def.say);
      else await ctx.clock.wait(450);
    }
    explaining = false;
  }

  return {
    run() {
      shown = def.display.map((d, i) => {
        const shape = drawItem(ctx.layers.signs, d, d.missing ? 'slot' : 'shape');
        void animate(shape.body, [{ transform: 'scale(0)' }, { transform: 'scale(1.15)', offset: 0.7 }, { transform: 'scale(1)' }], {
          duration: 450, delay: i * 120, easing: 'ease-out', fill: 'backwards',
        });
        return { def: d, shape };
      });
      choices = def.choices.map((d, i) => {
        const shape = drawItem(ctx.layers.signs, d, 'shape');
        const scale = d.scale ?? 1;
        const c: Choice = { def: d, shape, hitId: `choice_${ctx.turnIndex}_${d.id}`, scale };
        ctx.input.add({ id: c.hitId, cx: d.x, cy: d.y - (shape.h / 2) * scale, w: shape.w * scale, h: shape.h * scale, enabled: true, onDown: () => void onTap(c) });
        void animate(shape.body, [{ transform: 'scale(0)' }, { transform: 'scale(1.15)', offset: 0.7 }, { transform: 'scale(1)' }], {
          duration: 450, delay: (shown.length + i) * 120, easing: 'ease-out', fill: 'backwards',
        });
        return c;
      });
      return new Promise<void>((resolve) => (finish = resolve));
    },
    hintTarget(): HintTarget | null {
      const c = choices.find((x) => x.def.id === def.answer);
      if (!c || solved) return null;
      return {
        x: c.def.x,
        y: c.def.y - (c.shape.h / 2) * c.scale,
        top: c.def.y - c.shape.h * c.scale,
        mark: (on) => c.shape.body.classList.toggle('hint-sparkle', on),
      };
    },
    autoSolve() {
      const c = choices.find((x) => x.def.id === def.answer);
      if (c) void onTap(c);
    },
    dispose() {
      choices.forEach((c) => ctx.input.remove(c.hitId));
    },
  };
}
