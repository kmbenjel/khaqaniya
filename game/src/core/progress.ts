// Unlocks, the next target, due pearls and stickers (GAME_DESIGN §4.9, §5.2–5.4).
import type { District, Poem } from './data';
import { award, daysAway, isDue, learned, learnedCount, lastSevenLamps, profile, settings, vs } from './store';

let poem: Poem;
export function initProgress(p: Poem) { poem = p; }
export const P = () => poem;

export const districtOf = (n: number) => poem.districts.find((d) => n >= d.from && n <= d.to)!;
export const districtById = (id: string) => poem.districts.find((d) => d.id === id || d.boss === id);
export const versesOf = (d: District) => poem.verses.filter((v) => v.n >= d.from && v.n <= d.to);
export const bossKey = (d: District) => d.boss || d.id;
export const bossBeaten = (d: District) => !!profile().bosses[bossKey(d)];
export const districtDone = (d: District) => versesOf(d).every((v) => learned(v.n));

export function districtUnlocked(d: District): boolean {
  if (settings().openAll) return true;
  const i = poem.districts.indexOf(d);
  if (i <= 0) return true;
  return bossBeaten(poem.districts[i - 1]);
}
export function verseUnlocked(n: number): boolean {
  if (settings().openAll) return true;
  const d = districtOf(n);
  if (!districtUnlocked(d)) return false;
  for (let k = d.from; k < n; k++) if (!learned(k)) return false;
  return true;
}
export const bossUnlocked = (d: District) => settings().openAll || (districtUnlocked(d) && districtDone(d));

export type Target = { kind: 'verse'; n: number } | { kind: 'boss'; d: District } | { kind: 'finale' } | { kind: 'done' };
export function nextTarget(): Target {
  for (const d of poem.districts) {
    if (!districtUnlocked(d)) break;
    const v = versesOf(d).find((x) => !learned(x.n));
    if (v) return { kind: 'verse', n: v.n };
    if (!bossBeaten(d)) return { kind: 'boss', d };
  }
  if (poem.districts.every(bossBeaten) && !profile().medal.date) return { kind: 'finale' };
  return { kind: 'done' };
}
export const targetHash = (tg: Target) => (tg.kind === 'verse' ? '#/verse/' + tg.n : tg.kind === 'boss' ? '#/boss/' + bossKey(tg.d) : tg.kind === 'finale' ? '#/finale' : '#/map');

export function dueVerses(): number[] {
  return poem.verses.filter((v) => isDue(v.n)).map((v) => v.n).sort((a, b) => (vs(a)!.due < vs(b)!.due ? -1 : vs(a)!.due > vs(b)!.due ? 1 : a - b));
}

export const STICKERS = {
  friends: ['amin', 'mishmish', 'laqlaq', 'manfoukh', 'khallat', 'ajoul', 'kaslan', 'mattat', 'qallab', 'fuwaq', 'duhrouj', 'khafiyy', 'nasyan'],
  districts: ['gate', 'seven', 'garden', 'fountain', 'market', 'workshop', 'bridge', 'lane', 'cave', 'hill'],
  achievements: ['firstPearl', 'sevenPearls', 'half', 'all', 'golden', 'polish5', 'days3', 'days7', 'days14', 'days30', 'weekFull', 'comeback', 'seven', 'calm', 'listener', 'wholeListen', 'recorded', 'sardine', 'medal'],
};
export const stickerId = (page: string, id: string) => (page === 'districts' ? 'district.' + id : id);

/** Awards every sticker whose condition now holds; returns the new ones. */
export function checkStickers(): string[] {
  const out: string[] = [];
  const a = (id: string, cond: boolean) => { if (cond && award(id)) out.push(id); };
  const p = profile();
  const n = learnedCount(), N = poem.verses.length;
  a('firstPearl', n >= 1); a('sevenPearls', n >= 7); a('half', n >= Math.ceil(N / 2)); a('all', n >= N);
  a('golden', Object.values(p.verses).some((v) => v.stars >= 3));
  a('polish5', p.polish.sessions >= 5);
  const days = p.days.length;
  a('days3', days >= 3); a('days7', days >= 7); a('days14', days >= 14); a('days30', days >= 30);
  a('weekFull', lastSevenLamps().every(Boolean));
  a('comeback', daysAway() >= 7 && p.days.length > 1);
  for (const d of poem.districts) if (bossBeaten(d)) { a('district.' + d.id, true); if (d.boss) a(d.boss, true); }
  a('medal', !!p.medal.date);
  return out;
}
