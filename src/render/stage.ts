import { el } from './svg';

export const VIEW_W = 1600;
export const VIEW_H = 900;

const LAYER_NAMES = [
  'bg', 'decor', 'ambient', 'objects', 'basket', 'signs', 'hud', 'gem', 'dim', 'lumi', 'fx', 'debug',
] as const;

export type LayerName = (typeof LAYER_NAMES)[number];
export type Layers = Record<LayerName, SVGGElement>;

export interface Stage {
  svg: SVGSVGElement;
  layers: Layers;
}

export function createStage(container: HTMLElement): Stage {
  container.textContent = '';
  const svg = el('svg', {
    viewBox: `0 0 ${VIEW_W} ${VIEW_H}`,
    preserveAspectRatio: 'xMidYMid meet',
    'aria-hidden': 'true',
  });
  container.appendChild(svg);
  defs(el('defs', {}, svg));
  const layers = {} as Layers;
  for (const name of LAYER_NAMES) layers[name] = el('g', { class: `layer-${name}` }, svg);
  layers.debug.setAttribute('pointer-events', 'none');
  return { svg, layers };
}

function defs(d: SVGDefsElement): void {
  // Halo doré (cibles d'aide, objets comptés)
  const glow = el('filter', { id: 'glow', x: '-50%', y: '-50%', width: '200%', height: '200%' }, d);
  el('feGaussianBlur', { in: 'SourceAlpha', stdDeviation: 9, result: 'b' }, glow);
  el('feFlood', { 'flood-color': '#fff59d', 'flood-opacity': 1 }, glow);
  el('feComposite', { in2: 'b', operator: 'in', result: 'g' }, glow);
  const merge = el('feMerge', {}, glow);
  el('feMergeNode', { in: 'g' }, merge);
  el('feMergeNode', { in: 'g' }, merge);
  el('feMergeNode', { in: 'SourceGraphic' }, merge);

  const radial = (id: string, stops: [number, string, number][]) => {
    const g = el('radialGradient', { id }, d);
    for (const [o, c, a] of stops) el('stop', { offset: o, 'stop-color': c, 'stop-opacity': a }, g);
  };
  radial('halo-yellow', [[0, '#fffde7', 1], [0.35, '#fff176', 0.8], [1, '#ffeb3b', 0]]);
  radial('halo-white', [[0, '#ffffff', 0.9], [1, '#ffffff', 0]]);

  const wood = el('linearGradient', { id: 'wood', x1: 0, y1: 0, x2: 0, y2: 1 }, d);
  el('stop', { offset: 0, 'stop-color': '#d7a86e' }, wood);
  el('stop', { offset: 1, 'stop-color': '#a9743f' }, wood);
}
