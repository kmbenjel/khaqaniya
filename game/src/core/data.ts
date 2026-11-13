// Loads the data files copied at build time into ./data/ and binds the world to the poem (GAME_DESIGN §3).
import { bare, isSacred, letterCount, words } from './arabic';
import { env } from './env';

export type Where = 'sadr' | 'ajz';
export interface Token {
  t: string;              // exactly as in the data
  where: Where;
  i: number;              // index in its hemistich
  key: string;            // 's3' / 'a0' (weak-word keys, §10.2)
  bare: string;
  len: number;            // letters without marks
  locked: boolean;        // Qur'anic quotation or a joined-word piece: shown, pre-placed, never an option
  sacred: boolean;        // never a wrong option
  rhyme: boolean;         // last word of the ajz
}
export interface Meaning { n: number; kid?: string; adult?: string; words?: { w: string; m: string }[]; lesson?: string; cite?: string[] }
export interface Timing { n: number; file?: string; sadr?: string; ajz?: string; dur?: number; sadrDur?: number; ajzDur?: number; start?: number; end?: number; sadrEnd?: number }
export interface Verse {
  n: number; section: string; sadr: string; ajz: string; rhymeWord: string;
  sadrT: Token[]; ajzT: Token[]; all: Token[];
  district: string; idx: number;          // position inside its district, 1-based
  pictos: string[]; joined: boolean; lahnTip: boolean; lahnTipShow: boolean; countJoke: boolean;
  meaning: Meaning | null; timing: Timing | null; meaningClip: { file: string; dur?: number } | null;
}
export interface Section { id: string; title: string; from: number; to: number }
export interface District {
  id: string; from: number; to: number; sky: string; boss: string | null; bossVerse: number;
  special: { verse: number; game: string } | null; final: boolean; sections: Section[]; skin: string;
}
export interface Build { version: string; media?: string; fixture: string[]; binding: string; base: string; built: string }
export interface Poem {
  title: string; fullTitle: string; author: string; authorDeath?: string; metre?: string; basis?: string;
  verses: Verse[]; districts: District[]; sections: Section[];
  timingsSource: { reciter?: string; url?: string; credit?: string } | null;
  /** capture `&timings=`: where the durations came from and which verses they cover */
  timingsOverride?: { url: string; verses: number[] } | null;
  voice: Record<string, { file: string; dur?: number }>;
  art: Record<string, string | null>;
  credits: { reciterLine: string };
  faceless: boolean;
  artX2?: Record<string, string>;
  build: Build;
  warnings: string[];
}

interface RawVerse { n: number; section: string; sadr: string; ajz: string; rhymeWord: string; quran?: { where: Where; text?: string; from?: number; to?: number }[]; joined?: boolean }
interface Range { where: Where; from: number; to: number }
interface Extra { pictos?: string[]; joined?: boolean; quran?: Range[]; sacred?: Range[]; lahnTip?: boolean; lahnTipShow?: boolean; countJoke?: boolean }
interface WorldD { id: string; to: number; sky: string; boss: string; bossVerse: number; special: { verse: number; game: string } | null; final?: boolean }

async function getJSON<T>(name: string, optional = false): Promise<T | null> {
  try {
    const r = await fetch('./data/' + name, { cache: 'no-cache' });
    if (!r.ok) throw new Error(name + ' ' + r.status);
    return (await r.json()) as T;
  } catch (e) {
    if (optional) return null;
    throw e;
  }
}

export async function loadAll(): Promise<{ poem: Poem; copy: Record<string, unknown> }> {
  const build = await getJSON<Build & { files?: string[] }>('build.json', true);
  const present = (f: string) => !build?.files || build.files.includes(f);
  let [raw, meanings, timings, copy, world, extras, art, credits, mAudio, voice] = await Promise.all([
    getJSON<{ title: string; fullTitle?: string; author: string; authorDeath?: string; metre?: string; basis?: string; sections: Section[]; verses: RawVerse[] }>('poem.json'),
    getJSON<{ verses: Meaning[] }>('meanings.json', true),
    present('timings.json') ? getJSON<{ source?: Poem['timingsSource']; verses: Timing[] }>('timings.json', true) : null,
    getJSON<Record<string, unknown>>('copy.json', true),
    getJSON<{ districts: WorldD[] }>('world.json'),
    getJSON<{ verses: Record<string, Extra> }>('extras.json', true),
    getJSON<{ files: Record<string, string | null>; faceless?: boolean; x2?: Record<string, string> }>('art.json', true),
    getJSON<{ reciterLine: string }>('credits.json', true),
    present('meanings-audio.json') ? getJSON<{ verses: { n: number; file: string; dur?: number }[] }>('meanings-audio.json', true) : null,
    present('voice.json') ? getJSON<Record<string, { file: string; dur?: number }>>('voice.json', true) : null,
  ]);
  if (!raw || !world || !Array.isArray(raw.verses) || !Array.isArray(world.districts)) throw new Error('data');
  // optional files of the wrong shape count as absent (a warning, never a crash at boot)
  const okList = <T,>(x: T | null, name: string): T | null => { if (x && !Array.isArray((x as { verses?: unknown }).verses)) { console.warn('[kq] ignored malformed', name); return null; } return x; };
  meanings = okList(meanings, 'meanings.json'); timings = okList(timings, 'timings.json'); mAudio = okList(mAudio, 'meanings-audio.json');
  if (voice && typeof voice !== 'object') voice = null;
  const poem = bind(raw, meanings, timings, world.districts, extras?.verses || {}, mAudio);
  poem.voice = voice || {};
  if (env.capture && env.timings) poem.timingsOverride = await overrideTimings(poem, env.timings);
  poem.art = art?.files || {};
  poem.artX2 = art?.x2 || {};
  poem.faceless = art?.faceless === true;   // faces on by default (owner 2026-11-13, DECISIONS 1)
  poem.credits = { reciterLine: credits?.reciterLine || '{reciter}' };
  poem.build = build || { version: 'dev', fixture: [], binding: 'world', base: '', built: '' };
  return { poem, copy: copy || {} };
}

function tokens(text: string, where: Where, locked: Set<number>, sacredIdx: Set<number>, isAjz: boolean): Token[] {
  const ws = words(text);
  return ws.map((t, i) => ({
    t, where, i, key: (where === 'sadr' ? 's' : 'a') + i, bare: bare(t), len: letterCount(t),
    locked: locked.has(i), sacred: sacredIdx.has(i) || isSacred(t), rhyme: isAjz && i === ws.length - 1,
  }));
}

export function bind(
  raw: { title: string; fullTitle?: string; author: string; authorDeath?: string; metre?: string; basis?: string; sections: Section[]; verses: RawVerse[] },
  meanings: { verses: Meaning[] } | null,
  timings: { source?: Poem['timingsSource']; verses: Timing[] } | null,
  worldDs: WorldD[],
  extras: Record<string, Extra>,
  mAudio: { verses: { n: number; file: string; dur?: number }[] } | null,
): Poem {
  const warnings: string[] = [];
  const N = raw.verses.length;
  const sections = raw.sections || [];
  const districts = bindDistricts(worldDs, sections, N, warnings);
  const verses: Verse[] = raw.verses.map((rv) => {
    const e = extras[String(rv.n)] || {};
    const joined = !!(rv.joined ?? e.joined);
    const lockS = new Set<number>(), lockA = new Set<number>(), sacS = new Set<number>(), sacA = new Set<number>();
    const sadrW = words(rv.sadr), ajzW = words(rv.ajz);
    const ranges: Range[] = [];
    if (rv.quran) {
      for (const q of rv.quran) {
        if (q.from !== undefined) ranges.push({ where: q.where, from: q.from, to: q.to ?? q.from });
        else if (q.text) {   // locate the quoted words in the hemistich
          const qs = words(q.text).map(bare), hs = (q.where === 'sadr' ? sadrW : ajzW).map(bare);
          for (let i = 0; i + qs.length <= hs.length; i++) if (qs.every((w, k) => hs[i + k] === w)) { ranges.push({ where: q.where, from: i, to: i + qs.length - 1 }); break; }
        }
      }
    } else if (e.quran) ranges.push(...e.quran);
    for (const r of ranges) for (let i = r.from; i <= r.to; i++) (r.where === 'sadr' ? lockS : lockA).add(i);
    for (const r of e.sacred || []) for (let i = r.from; i <= r.to; i++) (r.where === 'sadr' ? sacS : sacA).add(i);
    if (joined) { lockS.add(sadrW.length - 1); lockA.add(0); }
    const sadrT = tokens(rv.sadr, 'sadr', lockS, sacS, false);
    const ajzT = tokens(rv.ajz, 'ajz', lockA, sacA, true);
    const d = districts.find((x) => rv.n >= x.from && rv.n <= x.to)!;
    const m = meanings?.verses.find((x) => x.n === rv.n) || null;
    const tm = timings?.verses.find((x) => x.n === rv.n) || null;
    const ma = mAudio?.verses.find((x) => x.n === rv.n) || null;
    return {
      n: rv.n, section: rv.section, sadr: rv.sadr, ajz: rv.ajz, rhymeWord: rv.rhymeWord || ajzW[ajzW.length - 1],
      sadrT, ajzT, all: [...sadrT, ...ajzT], district: d.id, idx: rv.n - d.from + 1,
      pictos: e.pictos || [], joined, lahnTip: !!e.lahnTip, lahnTipShow: !!e.lahnTipShow, countJoke: !!e.countJoke,
      meaning: m && (m.kid || m.adult) ? m : null, timing: tm, meaningClip: ma ? { file: ma.file, dur: ma.dur } : null,
    };
  });
  for (const v of verses) if (!v.timing) warnings.push('no audio for verse ' + v.n);
  return {
    title: raw.title, fullTitle: raw.fullTitle || raw.title, author: raw.author, authorDeath: raw.authorDeath, metre: raw.metre, basis: raw.basis,
    verses, districts, sections, timingsSource: timings?.source || null, voice: {}, art: {}, credits: { reciterLine: '{reciter}' }, faceless: false,
    build: { version: '', fixture: [], binding: '', base: '', built: '' }, warnings,
  };
}

/** World binding with validation and the generic fallback of §3.3. */
export function bindDistricts(worldDs: WorldD[], sections: Section[], N: number, warnings: string[]): District[] {
  const secEnds = new Set(sections.map((s) => s.to));
  const inLong = (n: number) => sections.some((s) => n >= s.from && n < s.to && s.to - s.from + 1 > 8);
  const ok = worldDs.slice(0, -1).every((d) => d.to < N && (secEnds.has(d.to) || inLong(d.to)));
  const secsOf = (from: number, to: number) => sections.filter((s) => s.to >= from && s.from <= to);
  if (ok) {
    const last = worldDs[worldDs.length - 1];
    if (last.to !== N) warnings.push(`verse count ${N} ≠ ${last.to}: district ${last.id} absorbs the difference`);
    let from = 1;
    return worldDs.map((d, i) => {
      const to = i === worldDs.length - 1 ? N : d.to;
      const r: District = { id: d.id, from, to, sky: d.sky, boss: d.boss, bossVerse: clampIn(d.bossVerse, from, to), special: d.special, final: !!d.final, sections: secsOf(from, to), skin: d.id };
      from = to + 1;
      return r;
    });
  }
  warnings.push('world binding failed: generic districts');
  // generic builder: merge sections < 3 verses into the previous (next if first), split > 8 at the midpoint
  let runs = sections.map((s) => ({ from: s.from, to: s.to }));
  if (!runs.length) runs = [{ from: 1, to: N }];
  const merged: { from: number; to: number }[] = [];
  for (const r of runs) {
    if (r.to - r.from + 1 < 3 && merged.length) merged[merged.length - 1].to = r.to;
    else merged.push({ ...r });
  }
  if (merged.length > 1 && merged[0].to - merged[0].from + 1 < 3) { merged[1].from = merged[0].from; merged.shift(); }
  const split: { from: number; to: number }[] = [];
  const cut = (r: { from: number; to: number }) => {
    if (r.to - r.from + 1 > 8) { const mid = Math.floor((r.from + r.to) / 2); cut({ from: r.from, to: mid }); cut({ from: mid + 1, to: r.to }); }
    else split.push(r);
  };
  merged.forEach(cut);
  const used = new Set<string>();
  return split.map((r, i) => {
    const skin = worldDs.find((d) => !used.has(d.id) && d.bossVerse >= r.from && d.bossVerse <= r.to);
    if (skin) used.add(skin.id);
    return {
      id: skin ? skin.id : 'alley' + (i + 1), from: r.from, to: r.to, sky: skin ? skin.sky : worldDs[Math.min(i, worldDs.length - 1)].sky,
      boss: skin ? skin.boss : null, bossVerse: skin ? skin.bossVerse : r.to, special: skin?.special || null,
      final: i === split.length - 1, sections: secsOf(r.from, r.to), skin: skin ? skin.id : 'alley',
    };
  });
}
const clampIn = (n: number, a: number, b: number) => (n >= a && n <= b ? n : b);

/**
 * Capture `&timings=` (GAME_DESIGN §12, CAPTURE.md): the karaoke light, the echo windows and the silent clip lengths
 * follow another reader's durations (the video's TTS reader). Only durations are taken (dur, sadrDur, ajzDur), never
 * files: with the recitation on, the game would still play Ghouthani's clips. Verses the file lacks keep their timing.
 */
async function overrideTimings(poem: Poem, src: string): Promise<{ url: string; verses: number[] } | null> {
  const url = src === 'reader' ? './video/reader-timings.json' : src;
  try {
    const r = await fetch(url, { cache: 'no-cache' });
    if (!r.ok) throw new Error(String(r.status));
    const data = (await r.json()) as { verses: Timing[] };
    const done: number[] = [];
    for (const t of data.verses || []) {
      const v = poem.verses.find((x) => x.n === t.n);
      if (!v || !(t.dur || t.sadrDur || t.ajzDur)) continue;
      const base: Timing = v.timing ? { ...v.timing } : { n: t.n };
      for (const k of ['dur', 'sadrDur', 'ajzDur'] as const) if (typeof t[k] === 'number') base[k] = t[k];
      if (!base.dur && base.sadrDur && base.ajzDur) base.dur = base.sadrDur + base.ajzDur;
      v.timing = base;
      done.push(t.n);
    }
    console.info('[kq] timings override', url, done.length, 'verses');
    return { url, verses: done };
  } catch (e) {
    console.warn('[kq] timings override failed, normal timings kept:', url, String(e));
    return null;
  }
}
