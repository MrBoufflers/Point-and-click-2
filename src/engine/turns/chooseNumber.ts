import { drawSign, SIGN_H, SIGN_W, type SignShape } from '../../render/signs';
import { animate } from '../../render/svg';
import type { ChooseNumberTurnDef, TurnDefBase } from '../../types';
import type { HintTarget, Turn, TurnContext } from './types';

interface Sign {
  value: number;
  x: number;
  y: number;
  shape: SignShape;
  hitId: string;
}

/** « Combien ? » : choisir le bon panneau parmi plusieurs nombres. */
export function createChooseNumber(ctx: TurnContext, raw: TurnDefBase): Turn {
  const def = raw as ChooseNumberTurnDef;
  let signs: Sign[] = [];
  let answer = 0;
  let solved = false;
  let counting = false;
  let countToken = 0;
  let finish: (() => void) | null = null;

  function resolveAnswer(): number {
    if (def.answer_from === 'previous_turn_count' && ctx.memory.previousTurnCount != null) return ctx.memory.previousTurnCount;
    return def.answer ?? ctx.basket.count;
  }

  function choices(): number[] {
    // Si la scène a changé de nombre d'objets sans changer les choix, on garde un choix juste.
    if (def.choices.includes(answer)) return def.choices;
    return [answer - 1, answer, answer + 1].filter((n) => n >= 0);
  }

  async function onTap(sign: Sign): Promise<void> {
    if (solved) return;
    if (sign.value === answer) {
      solved = true;
      countToken++;
      ctx.progress();
      signs.forEach((s) => ctx.input.remove(s.hitId));
      ctx.voice.clear();
      ctx.sfx.success();
      sign.shape.body.classList.remove('hint-sparkle');
      sign.shape.body.classList.add('glow');
      void animate(sign.shape.body, [{ transform: 'scale(1)' }, { transform: 'scale(1.2) translateY(-20px)' }, { transform: 'scale(1.1)' }], { duration: 500, fill: 'forwards', easing: 'ease-out' });
      signs.filter((s) => s !== sign).forEach((s) => void animate(s.shape.root, [{ opacity: 1 }, { opacity: 0.25 }], { duration: 400, fill: 'forwards' }));
      ctx.basket.highlightAll();
      await ctx.say(ctx.text(def.success_line));
      await Promise.all(signs.map((s) => animate(s.shape.root, [{ opacity: getComputedStyle(s.shape.root).opacity }, { opacity: 0 }], { duration: 500, fill: 'forwards' })));
      signs.forEach((s) => s.shape.root.remove());
      finish?.();
      return;
    }
    // Mauvais panneau : il tremble doucement, Lumi compte avec l'enfant. Aucune pénalité.
    ctx.sfx.tap();
    void animate(sign.shape.body, [
      { transform: 'translateX(0)' }, { transform: 'translateX(-12px) rotate(-3deg)' }, { transform: 'translateX(10px) rotate(2deg)' },
      { transform: 'translateX(-6px)' }, { transform: 'translateX(0)' },
    ], { duration: 550, easing: 'ease-in-out' });
    if (!counting) void countAlong();
  }

  async function countAlong(): Promise<void> {
    counting = true;
    const token = ++countToken;
    await ctx.say(ctx.text(def.retry_line));
    for (let i = 0; i < ctx.basket.count; i++) {
      if (token !== countToken) break;
      ctx.basket.highlight(i);
      await ctx.say(ctx.scene.lines.count[i] ?? String(i + 1));
    }
    counting = false;
  }

  return {
    run() {
      answer = resolveAnswer();
      const values = choices();
      const layout = def.layout ?? { y: 440, spacing: 330 };
      signs = values.map((value, i) => {
        const x = 800 + (i - (values.length - 1) / 2) * layout.spacing;
        const shape = drawSign(ctx.layers.signs, value, x, layout.y);
        const sign: Sign = { value, x, y: layout.y, shape, hitId: `sign_${i}` };
        ctx.input.add({ id: sign.hitId, cx: x, cy: layout.y, w: SIGN_W, h: SIGN_H, enabled: true, onDown: () => void onTap(sign) });
        void animate(shape.body, [{ transform: 'scale(0)', opacity: 0 }, { transform: 'scale(1.15)', opacity: 1, offset: 0.7 }, { transform: 'scale(1)', opacity: 1 }], {
          duration: 500, delay: i * 150, easing: 'ease-out', fill: 'backwards',
        });
        return sign;
      });
      return new Promise<void>((resolve) => (finish = resolve));
    },
    hintTarget(): HintTarget | null {
      const s = signs.find((x) => x.value === answer);
      if (!s || solved) return null;
      return { x: s.x, y: s.y, top: s.y - SIGN_H / 2, mark: (on) => s.shape.body.classList.toggle('hint-sparkle', on) };
    },
    autoSolve() {
      const s = signs.find((x) => x.value === answer);
      if (s) void onTap(s);
    },
    dispose() {
      signs.forEach((s) => ctx.input.remove(s.hitId));
    },
  };
}
