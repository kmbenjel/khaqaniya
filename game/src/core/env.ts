// URL switches for capture mode and tests (GAME_DESIGN §12). Nothing here is visible to a child using the plain URL.
const q = new URLSearchParams(location.search);
const num = (k: string, d: number) => (q.has(k) && !Number.isNaN(Number(q.get(k))) ? Number(q.get(k)) : d);
const bool = (k: string): boolean | null => (q.has(k) ? q.get(k) !== '0' && q.get(k) !== 'false' : null);

export const env = {
  capture: bool('capture') === true,
  seed: q.has('seed') ? num('seed', 42) : null,
  profile: q.get('profile'),                  // demo:<k>
  goto: q.get('goto'),                        // verse:12 | boss:ajoul | district:market | polish | necklace | finale | medal | map | home
  level: q.get('level') as 'easy' | 'mid' | 'strong' | null,
  grownup: bool('grownup'),
  recitation: bool('recitation'),
  voices: bool('voices'),
  sfx: bool('sfx'),
  motion: bool('motion'),                     // motion=0 forces reduced motion
  speed: Math.max(0.25, num('speed', 1)),     // >1 shortens every wait (tests); real audio still plays at 1x
  fresh: bool('fresh') === true,              // start from an empty profile (tests)
  pointer: bool('pointer'),
  today: q.get('today'),                      // days offset for the clock, e.g. today=+8
  timings: q.get('timings'),                  // capture: durations from another reader (URL, or 'reader' = ./video/reader-timings.json)
};

export function setSpeedForTests(s: number) { env.speed = Math.max(0.25, s); }
export const sleep = (ms: number, signal?: AbortSignal) => new Promise<void>((res, rej) => {
  if (signal?.aborted) return rej(new DOMException('aborted', 'AbortError'));
  const id = setTimeout(res, ms / env.speed);
  signal?.addEventListener('abort', () => { clearTimeout(id); rej(new DOMException('aborted', 'AbortError')); }, { once: true });
});
export const isAbort = (e: unknown) => e instanceof DOMException && e.name === 'AbortError';
export function emit(name: string, detail: unknown) { window.dispatchEvent(new CustomEvent(name, { detail })); }
