import './style.css';
import { SceneRunner } from './engine/sceneRunner';
import { Sfx } from './engine/sfx';
import { Voice } from './engine/voice';
import { loadJSON, loadPrefs, savePrefs, type Prefs } from './settings';
import type { GameSettings, SceneDef } from './types';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const params = new URLSearchParams(location.search);
const debug = params.get('debug') === '1';
document.body.classList.toggle('debug', debug);

// Pas de zoom, pas de menu contextuel, pas de sélection, pas de défilement.
for (const ev of ['contextmenu', 'selectstart', 'dragstart', 'gesturestart', 'dblclick']) {
  document.addEventListener(ev, (e) => e.preventDefault(), { passive: false });
}
document.addEventListener('touchmove', (e) => {
  if (!(e.target as HTMLElement).closest?.('#panel')) e.preventDefault();
}, { passive: false });

drawStars();
drawGearTeeth();

boot().catch((err: unknown) => {
  console.error(err);
  const p = $('load-error');
  p.hidden = false;
  p.textContent = `Erreur de chargement : ${err instanceof Error ? err.message : String(err)}`;
});

async function boot(): Promise<void> {
  const settings = await loadJSON<GameSettings>('./data/settings.json');
  // ?scene=autre.json permet d'essayer un autre fichier de scène de même structure.
  const requested = params.get('scene');
  const sceneFile = requested && /^[\w-]+\.json$/.test(requested) ? requested : settings.scene;
  const scene = await loadJSON<SceneDef>(`./data/${sceneFile}`);
  const prefs = loadPrefs(settings);

  const voice = new Voice(settings.voice.lang);
  voice.pitch = settings.voice.pitch;
  voice.volume = prefs.voice_volume;
  voice.rate = prefs.voice_rate;
  const sfx = new Sfx();

  const stageEl = $('stage');
  const hud = $('hud');
  const ear = $('ear');
  const restart = $('restart');
  let runner: SceneRunner | null = null;

  voice.onSpeakingChange = (b) => runner?.setSpeaking(b);

  const startScene = () => {
    runner?.dispose();
    restart.hidden = true;
    hud.hidden = false;
    ear.hidden = false;
    runner = new SceneRunner({
      container: stageEl,
      scene,
      settings,
      prefs,
      voice,
      sfx,
      debug,
      onState: (s) => {
        if (s === 'end') {
          ear.hidden = true;
          restart.hidden = false;
        }
      },
    });
    runner.start();
    if (debug) (window as unknown as { __runner: SceneRunner }).__runner = runner;
  };

  // ---- Écran de démarrage ----
  const play = $<HTMLButtonElement>('play');
  play.disabled = false;
  play.addEventListener('click', () => {
    // Tout dans le même gestionnaire : condition d'iOS Safari pour le son et la voix.
    sfx.unlock();
    voice.unlock();
    requestFullscreen();
    $('start').hidden = true;
    startScene(); // dit la première phrase immédiatement
  });

  restart.addEventListener('click', () => {
    sfx.unlock();
    startScene();
  });

  ear.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    sfx.unlock();
    voice.repeat();
  });

  setupParentPanel(settings, prefs, voice, scene, startScene);
}

function requestFullscreen(): void {
  const de = document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => void };
  try {
    const p = de.requestFullscreen ? de.requestFullscreen({ navigationUI: 'hide' }) : de.webkitRequestFullscreen?.();
    Promise.resolve(p)
      .then(() => (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> })?.lock?.('landscape'))
      .catch(() => {});
  } catch {
    // iPhone : pas de plein écran pour une page, ce n'est pas grave.
  }
}

// ---------------- Réglages parent ----------------

function setupParentPanel(settings: GameSettings, prefs: Prefs, voice: Voice, scene: SceneDef, restartScene: () => void): void {
  const gear = $('gear');
  const panel = $('panel');
  const LONG_PRESS_MS = 3000;
  let timer = 0;

  const cancel = () => {
    window.clearTimeout(timer);
    gear.classList.remove('pressing');
  };
  gear.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    gear.setPointerCapture?.(e.pointerId);
    gear.classList.add('pressing');
    timer = window.setTimeout(() => {
      cancel();
      openPanel();
    }, LONG_PRESS_MS);
  });
  for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) gear.addEventListener(ev, cancel);

  // Ordre de passage
  const order = $('order');
  for (const p of settings.players) {
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'order';
    input.value = p.id;
    input.addEventListener('change', () => {
      prefs.first_player = p.id;
      savePrefs(prefs);
    });
    label.append(input, ` ${p.name} d'abord`);
    order.append(label);
  }

  const vol = $<HTMLInputElement>('vol');
  const volOut = $<HTMLOutputElement>('vol-out');
  const rate = $<HTMLInputElement>('rate');
  const rateOut = $<HTMLOutputElement>('rate-out');
  rate.min = String(settings.voice.rate_min);
  rate.max = String(settings.voice.rate_max);

  const refresh = () => {
    order.querySelectorAll<HTMLInputElement>('input').forEach((i) => (i.checked = i.value === prefs.first_player));
    vol.value = String(prefs.voice_volume);
    rate.value = String(prefs.voice_rate);
    volOut.textContent = `${Math.round(prefs.voice_volume * 100)} %`;
    rateOut.textContent = `× ${prefs.voice_rate.toFixed(2)}`;
  };
  vol.addEventListener('input', () => {
    prefs.voice_volume = Number(vol.value);
    voice.volume = prefs.voice_volume;
    savePrefs(prefs);
    refresh();
  });
  rate.addEventListener('input', () => {
    prefs.voice_rate = Number(rate.value);
    voice.rate = prefs.voice_rate;
    savePrefs(prefs);
    refresh();
  });

  const openPanel = () => {
    refresh();
    panel.hidden = false;
  };
  const close = () => (panel.hidden = true);
  $('panel-close').addEventListener('click', close);
  $('test-voice').addEventListener('click', () => void voice.say(scene.lines.voice_test ?? scene.lines.gem_touch));
  $('panel-restart').addEventListener('click', () => {
    close();
    $('start').hidden = true;
    restartScene();
  });
  panel.addEventListener('pointerdown', (e) => {
    if (e.target === panel) close();
  });
}

// ---------------- Décor de l'écran de démarrage ----------------

function drawStars(): void {
  const box = $('stars');
  for (let i = 0; i < 70; i++) {
    const s = document.createElement('span');
    s.style.left = `${(i * 37.7) % 100}%`;
    s.style.top = `${(i * 61.3) % 100}%`;
    s.style.animationDelay = `${(i * 0.29) % 3}s`;
    const size = 2 + (i % 3);
    s.style.width = s.style.height = `${size}px`;
    box.append(s);
  }
}

function drawGearTeeth(): void {
  const g = document.getElementById('cog-teeth');
  if (!g) return;
  for (let i = 0; i < 8; i++) {
    const r = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    r.setAttribute('x', '-3.5');
    r.setAttribute('y', '-17');
    r.setAttribute('width', '7');
    r.setAttribute('height', '9');
    r.setAttribute('rx', '1.5');
    r.setAttribute('transform', `rotate(${i * 45})`);
    g.append(r);
  }
}
