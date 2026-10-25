/** Petits sons synthétisés (Web Audio). Aucun son d'erreur : uniquement des sons gais. */
export class Sfx {
  private ctx: AudioContext | null = null;
  private out: GainNode | null = null;

  /** À appeler DANS le gestionnaire du tap (exigence d'iOS Safari). */
  unlock(): void {
    try {
      if (!this.ctx) {
        const AC =
          window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.out = this.ctx.createGain();
        this.out.gain.value = 0.6;
        this.out.connect(this.ctx.destination);
      }
      void this.ctx.resume();
      // Un tampon silencieux joué pendant le geste finit de déverrouiller iOS.
      const buf = this.ctx.createBuffer(1, 1, 22050);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      src.connect(this.out!);
      src.start(0);
    } catch {
      this.ctx = null;
    }
  }

  /** Tap sur un élément de décor : petit « bloup ». */
  tap(): void {
    this.note(620, 0, 0.16, { to: 980, gain: 0.18 });
  }

  /** Coup de marteau sur l'enclume : « tiing » métallique. */
  clang(): void {
    this.note(1400, 0, 0.25, { type: 'square', gain: 0.06 });
    this.note(2100, 0, 0.35, { type: 'triangle', gain: 0.1, to: 1900 });
    this.note(700, 0, 0.12, { type: 'square', gain: 0.05 });
  }

  /** Mauvais champignon : « pouic » rigolo (pas un son d'erreur). */
  pouic(): void {
    this.note(1100, 0, 0.08, { type: 'triangle', to: 1700, gain: 0.12 });
    this.note(1650, 0.07, 0.11, { type: 'triangle', to: 1050, gain: 0.1 });
  }

  /** Réussite : petit arpège montant. */
  success(): void {
    [523.25, 659.25, 783.99].forEach((f, i) => this.note(f, i * 0.08, 0.35, { type: 'triangle', gain: 0.2 }));
    this.note(1046.5, 0.24, 0.5, { gain: 0.14 });
  }

  /** Fête : mélodie + scintillements. */
  party(): void {
    const seq = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5, 1318.5];
    seq.forEach((f, i) => this.note(f, i * 0.12, 0.42, { type: 'triangle', gain: 0.18 }));
    for (let i = 0; i < 12; i++) this.note(1500 + Math.random() * 1600, 0.9 + i * 0.07, 0.14, { gain: 0.05 });
  }

  private note(
    freq: number,
    at: number,
    dur: number,
    { type = 'sine', gain = 0.2, to }: { type?: OscillatorType; gain?: number; to?: number } = {},
  ): void {
    const c = this.ctx;
    if (!c || !this.out || c.state === 'closed') return;
    const t = c.currentTime + at;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.out);
    o.start(t);
    o.stop(t + dur + 0.05);
  }
}
