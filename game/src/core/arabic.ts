// Arabic text helpers. The poem text is never altered: these only compare, measure and classify tokens.
const MARKS = /[ؐ-ًؚ-ٰٟۖ-ۭـ]/g;
export const stripMarks = (s: string) => s.replace(MARKS, '');
/** Skeleton used for comparisons: no marks, alif forms unified, no tatweel. */
export const bare = (s: string) => stripMarks(s).replace(/[إأآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه');
export const letterCount = (s: string) => stripMarks(s).replace(/\s/g, '').length;
export const words = (s: string) => s.trim().split(/\s+/).filter(Boolean);
export const wordCount = (s: string) => words(s).length;

/** The Divine Name, ربّ / إله / مولى with a pronoun, and the word Qur'an: never used as a wrong option (GAME_DESIGN §1.5, §4.6). */
export function isSacred(token: string): boolean {
  const b = bare(token);
  if (/لله/.test(b)) return true;                                   // الله، لله، بالله، عبيد الله…
  const core = b.replace(/^(و|ف)?(ب|ل|ك)?(ال)?/, '');
  if (/^رب(ي|ك|ه|نا|كم|هم|هما|هن)$/.test(core)) return true;
  if (/^اله(ي|ك|ه|نا|كم|هم)$/.test(core)) return true;
  if (/^مولا(ي|ك|ه|نا|كم|هم)$/.test(core) || /^مولي$/.test(core)) return true;
  if (/قران/.test(b)) return true;
  return false;
}

/** Last vowel mark of a token (for the «hats» special): fatha, damma, kasra, sukun; null if it ends in a long vowel, tanwin or shadda. */
const MARK1 = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/;
export function lastMark(token: string): { mark: string; index: number } | null {
  if (/[\u06E5\u06E6\u0670]$/.test(token)) return null;   // silah or dagger alif: a long vowel, not a «hat»
  for (let i = token.length - 1; i >= 0; i--) {
    const c = token[i];
    if (/[\u064E\u064F\u0650\u0652]/.test(c)) {
      if (token[i - 1] === '\u0651' || token[i + 1] === '\u0651') return null;
      const base = stripMarks(token.slice(0, i)).slice(-1);
      if (/[اوىي]/.test(base) && c === '\u0652') return null;
      return { mark: c, index: i };
    }
    if (/[\u064B-\u064D\u0651]/.test(c)) return null;
    if (!MARK1.test(c)) return null;
  }
  return null;
}

export function sameBare(a: string, b: string) { return bare(a) === bare(b); }
