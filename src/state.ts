export type HogValue = string | number

/**
 * Internal Map<path, value> dictionary — the core fix from HOG_OSC_SPEC.md §1.
 * The console fires 20+ messages in ~350ms bursts; a single shared "latest
 * message" variable (as generic-osc exposes) gets overwritten mid-burst.
 * Keeping one slot per OSC path removes the race entirely.
 */
export class HogState {
  private readonly raw = new Map<string, HogValue>()

  setRaw(path: string, value: HogValue): void {
    this.raw.set(path, value)
  }

  getRaw(path: string): HogValue | undefined {
    return this.raw.get(path)
  }
}
