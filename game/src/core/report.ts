// One player's progress for the grown-ups' corner (ENGAGEMENT #13), read from the profile kept on this device (nothing
// leaves it, nothing is tracked): pearls, golden pearls, days and the last seven lamps, challenges, what is due today,
// and the verses to practise (polish retries and words missed in «someone is listening»).
import { lastSevenLamps, today, type Profile } from './store';
import { P, bossKey, dueVerses } from './progress';

/** A verse to practise: its polish retries (`lapses`) and the keys of its missed words, the most missed first. */
export interface PractiseItem { n: number; lapses: number; weak: string[] }
export interface Report {
  pearls: number; total: number; golden: number; days: number; lamps: boolean[];
  bosses: number; bossTotal: number; due: number; practise: PractiseItem[];
}

export function report(p: Profile, max = 6): Report {
  const poem = P();
  const won = poem.verses.map((v) => ({ n: v.n, st: p.verses[String(v.n)] })).filter((x) => (x.st?.stars || 0) > 0);
  const practise = won
    .map(({ n, st }) => {
      const weak = Object.entries(st.weak || {}).filter(([, c]) => c > 0).sort((a, b) => b[1] - a[1]);
      return { n, lapses: st.lapses || 0, weak: weak.map(([k]) => k), need: 2 * (st.lapses || 0) + weak.reduce((a, [, c]) => a + c, 0) };
    })
    .filter((x) => x.need > 0)
    .sort((a, b) => b.need - a.need || a.n - b.n)
    .slice(0, max)
    .map(({ n, lapses, weak }) => ({ n, lapses, weak }));
  return {
    pearls: won.length, total: poem.verses.length, golden: won.filter((x) => x.st.stars >= 3).length,
    days: p.days.length, lamps: lastSevenLamps(p),
    bosses: poem.districts.filter((d) => !!p.bosses[bossKey(d)]).length, bossTotal: poem.districts.length,
    due: dueVerses(today(), p).length, practise,
  };
}
