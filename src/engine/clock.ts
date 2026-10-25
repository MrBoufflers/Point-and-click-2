/** Minuteries rattachées à un tableau : tout s'arrête d'un coup quand on recommence. */
export class Clock {
  private timers = new Set<number>();
  private disposed = false;

  setTimeout(fn: () => void, ms: number): number {
    const id = window.setTimeout(() => {
      this.timers.delete(id);
      if (!this.disposed) fn();
    }, ms);
    this.timers.add(id);
    return id;
  }

  clearTimeout(id: number | null | undefined): void {
    if (id == null) return;
    window.clearTimeout(id);
    this.timers.delete(id);
  }

  /** Après dispose(), la promesse ne se résout jamais : la suite du tableau s'arrête. */
  wait(ms: number): Promise<void> {
    return new Promise((resolve) => this.setTimeout(resolve, ms));
  }

  dispose(): void {
    this.disposed = true;
    for (const id of this.timers) window.clearTimeout(id);
    this.timers.clear();
  }
}
