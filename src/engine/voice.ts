/**
 * Voix de Lumi (Web Speech API).
 * Une seule phrase à la fois : les phrases attendent dans une file.
 * Seul « répéter » interrompt la phrase en cours.
 */

export interface SayOptions {
  /** La phrase est une consigne : c'est elle que le bouton oreille fera répéter. */
  prompt?: boolean;
  /** Hauteur de voix pour cette phrase (ex. un personnage du village). */
  pitch?: number;
}

interface Item {
  text: string;
  resolve: () => void;
  pitch?: number;
}

// Après cancel(), certains navigateurs (Chrome Android, Safari) ignorent un speak() trop rapproché.
const CANCEL_COOLDOWN_MS = 150;

export class Voice {
  volume = 1;
  rate = 1;
  pitch = 1;
  onSpeakingChange: ((speaking: boolean) => void) | null = null;

  private synth: SpeechSynthesis | null = 'speechSynthesis' in window ? window.speechSynthesis : null;
  private voice: SpeechSynthesisVoice | null = null;
  private queue: Item[] = [];
  private current: Item | null = null;
  private safety: number | undefined;
  private cooldownUntil = 0;
  private pumpTimer: number | undefined;
  private lastPrompt = '';
  private lastLine = '';
  // Garder une référence évite que Chrome ramasse l'énoncé et n'appelle jamais onend.
  utterance: SpeechSynthesisUtterance | null = null;

  constructor(private lang: string) {
    if (this.synth) {
      this.pickVoice();
      this.synth.addEventListener?.('voiceschanged', () => this.pickVoice());
    }
  }

  get available(): boolean {
    return this.synth !== null;
  }

  /** À appeler DANS le gestionnaire du tap (exigence d'iOS Safari). */
  unlock(): void {
    if (!this.synth) return;
    try {
      const u = new SpeechSynthesisUtterance('');
      u.volume = 0;
      u.lang = this.lang;
      this.synth.speak(u);
    } catch {
      /* rien */
    }
  }

  say(text: string, opts: SayOptions = {}): Promise<void> {
    if (opts.prompt) this.lastPrompt = text;
    return new Promise((resolve) => {
      this.queue.push({ text, resolve, pitch: opts.pitch });
      this.pump();
    });
  }

  /** Répète la dernière consigne en coupant la phrase en cours. */
  repeat(): void {
    const text = this.lastPrompt || this.lastLine;
    if (!text) return;
    this.interruptCurrent();
    this.queue.unshift({ text, resolve: () => {} });
    this.pump();
  }

  /** Vide la file et coupe la voix. Les phrases en attente sont considérées comme dites. */
  clear(): void {
    const pending = this.queue;
    this.queue = [];
    this.interruptCurrent();
    pending.forEach((i) => i.resolve());
  }

  resetMemory(): void {
    this.lastPrompt = '';
    this.lastLine = '';
  }

  private interruptCurrent(): void {
    const cur = this.current;
    if (cur) {
      this.current = null;
      window.clearTimeout(this.safety);
      this.setSpeaking(false);
      cur.resolve();
    }
    if (this.synth && (this.synth.speaking || this.synth.pending)) {
      this.synth.cancel();
      this.cooldownUntil = performance.now() + CANCEL_COOLDOWN_MS;
    }
  }

  private pump(): void {
    if (this.current || this.queue.length === 0) return;
    const wait = this.cooldownUntil - performance.now();
    if (wait > 0) {
      window.clearTimeout(this.pumpTimer);
      this.pumpTimer = window.setTimeout(() => this.pump(), wait);
      return;
    }
    const item = this.queue.shift()!;
    this.current = item;
    this.lastLine = item.text;
    this.speak(item);
  }

  private speak(item: Item): void {
    // Durée estimée : filet de sécurité si le navigateur n'annonce jamais la fin.
    const estimate = (item.text.length * 75) / Math.max(0.5, this.rate) + 700;
    if (!this.synth) {
      this.setSpeaking(true);
      this.safety = window.setTimeout(() => this.finish(item), estimate);
      return;
    }
    const u = new SpeechSynthesisUtterance(item.text);
    u.lang = this.lang;
    if (this.voice) u.voice = this.voice;
    u.rate = this.rate;
    u.volume = this.volume;
    u.pitch = item.pitch ?? this.pitch;
    u.onstart = () => {
      if (this.current === item) this.setSpeaking(true);
    };
    u.onend = () => this.finish(item);
    u.onerror = () => this.finish(item);
    this.utterance = u;
    this.safety = window.setTimeout(() => this.finish(item), estimate * 2 + 3000);
    try {
      if (this.synth.paused) this.synth.resume();
      this.synth.speak(u);
    } catch {
      window.clearTimeout(this.safety);
      this.safety = window.setTimeout(() => this.finish(item), estimate);
    }
  }

  private finish(item: Item): void {
    if (this.current !== item) return;
    window.clearTimeout(this.safety);
    this.current = null;
    this.utterance = null;
    this.setSpeaking(false);
    item.resolve();
    this.pump();
  }

  private setSpeaking(b: boolean): void {
    this.onSpeakingChange?.(b);
  }

  private pickVoice(): void {
    if (!this.synth) return;
    const voices = this.synth.getVoices();
    const norm = (l: string) => l.replace('_', '-').toLowerCase();
    const want = norm(this.lang);
    const short = want.split('-')[0];
    const exact = voices.filter((v) => norm(v.lang) === want);
    const close = voices.filter((v) => norm(v.lang).startsWith(short));
    const pool = exact.length ? exact : close;
    // Préférence pour les voix réputées naturelles, sinon la première locale.
    const nice = /(amélie|amelie|audrey|aurelie|marie|google|thomas|denise|julie)/i;
    this.voice = pool.find((v) => nice.test(v.name)) ?? pool.find((v) => v.localService) ?? pool[0] ?? null;
  }
}
