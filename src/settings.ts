import type { GameSettings } from './types';

/** Préférences modifiables par le parent, gardées sur l'appareil. */
export interface Prefs {
  first_player: string;
  voice_volume: number;
  voice_rate: number;
  /** Tableau où reprendre (0 = premier ; égal au nombre de scènes = la Porte). */
  board: number;
}

const KEY = 'isao-elea.prefs.v1';

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export async function loadJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Impossible de charger ${url} (${res.status})`);
  return (await res.json()) as T;
}

export function loadPrefs(settings: GameSettings): Prefs {
  const prefs: Prefs = {
    first_player: settings.first_player,
    voice_volume: settings.voice.volume,
    voice_rate: settings.voice.rate,
    board: 0,
  };
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Partial<Prefs>;
      if (typeof saved.first_player === 'string' && settings.players.some((p) => p.id === saved.first_player)) {
        prefs.first_player = saved.first_player;
      }
      if (typeof saved.voice_volume === 'number') prefs.voice_volume = saved.voice_volume;
      if (typeof saved.voice_rate === 'number') prefs.voice_rate = saved.voice_rate;
      if (typeof saved.board === 'number' && Number.isInteger(saved.board) && saved.board >= 0) prefs.board = saved.board;
    }
  } catch {
    // stockage indisponible (navigation privée...) : on garde les valeurs par défaut
  }
  prefs.voice_volume = clamp(prefs.voice_volume, 0, 1);
  prefs.voice_rate = clamp(prefs.voice_rate, settings.voice.rate_min, settings.voice.rate_max);
  return prefs;
}

export function savePrefs(prefs: Prefs): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    // ignoré : les réglages restent valables pour cette session
  }
}
