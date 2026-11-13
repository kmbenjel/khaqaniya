// One seeded RNG for every random choice (GAME_DESIGN §3.5): mulberry32, seed = hash(profile seed, verse, attempt).
export type Rng = () => number;

export function mulberry32(a: number): Rng {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hash(...parts: (string | number)[]): number {
  let h = 2166136261 >>> 0;
  const s = parts.join('|');
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

export function shuffle<T>(arr: readonly T[], rng: Rng): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
export const pick = <T>(arr: readonly T[], rng: Rng): T => arr[Math.floor(rng() * arr.length)];
/** Shuffle that never leaves the array in its original order (when it has 2+ distinct items). */
export function shuffleMoved<T>(arr: readonly T[], rng: Rng): T[] {
  if (arr.length < 2) return arr.slice();
  for (let k = 0; k < 8; k++) { const s = shuffle(arr, rng); if (s.some((x, i) => x !== arr[i])) return s; }
  return arr.slice().reverse();
}
