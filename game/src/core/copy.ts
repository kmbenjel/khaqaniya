// Every Arabic UI string comes from design/copy.ar.json (GAME_DESIGN Appendix B). t(key) shows a visible dev marker
// for a missing key, so a gap is seen at once on screen and in tests (and listed by the build: game/copy-missing.txt).
import type { Rng } from './rng';

export interface Entry { text: string; say?: string; voice?: boolean; speaker?: string; aud?: string; p?: number; tags?: string[] }
const entries = new Map<string, Entry>();
const missing = new Set<string>();
let numerals: 'latn' | 'arab' = 'latn';

export function loadCopy(raw: Record<string, unknown>): void {
  entries.clear();
  const walk = (o: Record<string, unknown>, pre: string) => {
    for (const [k, v] of Object.entries(o)) {
      if (k.startsWith('_')) continue;
      const key = pre ? pre + '.' + k : k;
      if (typeof v === 'string') entries.set(key, { text: v });
      else if (v && typeof v === 'object' && !Array.isArray(v)) {
        const e = v as Record<string, unknown>;
        if (typeof e.text === 'string' || typeof e.say === 'string') {
          entries.set(key, {
            text: String(e.text ?? e.say), say: typeof e.say === 'string' ? e.say : undefined, voice: !!e.voice,
            speaker: (e.speaker || e.who || e.by || e.char) as string | undefined, aud: e.aud as string | undefined,
            p: e.p as number | undefined, tags: e.tags as string[] | undefined,
          });
        } else walk(e, key);
      }
    }
  };
  walk(raw, '');
}

export function setNumerals(n: 'latn' | 'arab') { numerals = n; }
export function num(n: number): string { return new Intl.NumberFormat(numerals === 'arab' ? 'ar-u-nu-arab' : 'ar-u-nu-latn').format(n); }

export const has = (key: string) => entries.has(key);
export const entry = (key: string) => entries.get(key);
export const missingKeys = () => [...missing].sort();

function fill(s: string, params?: Record<string, string | number>): string {
  if (!params) return s;
  return s.replace(/\{(\w+)\}/g, (m, k) => (k in params ? (typeof params[k] === 'number' ? num(params[k] as number) : String(params[k])) : m));
}

/** The text of a key, with {placeholders} filled. Missing → «⟦key⟧» (dev marker). */
export function t(key: string, params?: Record<string, string | number>): string {
  const e = entries.get(key);
  if (!e) { missing.add(key); return '⟦' + key + '⟧'; }
  return fill(e.text, params);
}
/** Like t() but returns '' for a missing key (for optional lines). */
export function tt(key: string, params?: Record<string, string | number>): string {
  const e = entries.get(key);
  return e ? fill(e.text, params) : '';
}

/** Keys of a rotating family: prefix.1, prefix.2 … (or prefix itself). */
export function family(prefix: string): string[] {
  const ks = [...entries.keys()].filter((k) => k.startsWith(prefix + '.') && /^\d+$/.test(k.slice(prefix.length + 1)));
  if (ks.length) return ks.sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
  return entries.has(prefix) ? [prefix] : [];
}
/** Pick one key of a family, avoiding the ones already heard until all were heard. */
export function tPick(prefix: string, rng: Rng, heard?: string[]): string {
  const ks = family(prefix);
  if (!ks.length) { missing.add(prefix + '.*'); return prefix + '.1'; }
  const fresh = heard ? ks.filter((k) => !heard.includes(k)) : ks;
  const pool = fresh.length ? fresh : ks;
  return pool[Math.floor(rng() * pool.length)];
}

/** Who says a line: the entry's speaker, else from its key. */
export function speakerOf(key: string): string {
  const e = entries.get(key);
  if (e?.speaker) return e.speaker;
  const p = key.split('.');
  if (p[0] === 'char') return p[1];
  if (p[0] === 'joke' || p[0] === 'mishmish' || key.endsWith('.mishmish') || key === 'polish.mishmish' || key === 'finale.mishmish' || key === 'game.missingWord.mishmish' || key === 'game.rhymeRadar.done') return 'mishmish';
  if (p[0] === 'boss') {
    if (p[1] === 'rule' || p[2] === 'lesson') return 'laqlaq';
    if (p.includes('amin') || ['intro', 'final', 'win', 'next', 'meter'].includes(p[1])) return 'amin';
    return p[1];
  }
  if (p[0] === 'district' || p[0] === 'meaning' || p[0] === 'lahn' || key === 'polish.start' || key === 'home.enough' || key === 'listen.tip.shatr' || key === 'game.rhyme.tip' || key === 'finale.dua.intro' || p[0] === 'fact') return 'laqlaq';
  return 'amin';
}
