// «See you tomorrow» (ENGAGEMENT #14): when the day's suggestion is met (settings.dailyNew new pearls today), the reward
// of that pearl closes with a gentle card: Amin resting with his lantern, Mishmish asleep, today's lamp lit and
// tomorrow's waiting, how many pearls will want polishing tomorrow. An invitation only: nothing is lost, no streak, no
// countdown, no notification, nothing is blocked (the reward's buttons come back when it closes). Once a day per player.
import { h, svg } from '../core/h';
import { t } from '../core/copy';
import { btn } from '../core/ui';
import { charArt, lanternArt, artFile, pearlSvg } from '../art';
import { addDays, newToday, profile, save, settings, today } from '../core/store';
import { dueVerses } from '../core/progress';
import { say, stopVoice, hideBubble } from '../core/voice';
import { sfx } from '../core/sfx';
import { setActive } from '../games/engine';

/** True when a pearl just met the day's suggestion and the card was not shown to this player today. */
export function tomorrowDue(): boolean {
  const s = settings();
  return s.dailyNew > 0 && newToday() >= s.dailyNew && profile().seen.tomorrow !== today();
}

/** Shows the card over the reward until its one button closes it (Escape too). The district's painting behind the cast. */
export async function tomorrowCard(signal: AbortSignal, place?: string | null): Promise<void> {
  const pr = profile();
  pr.seen.tomorrow = today(); save();
  const n = dueVerses(addDays(today(), 1)).length;
  const band = place ? artFile('district.' + place) : null;
  const line = (who: string, text: string) => h('p', { class: 'tomorrow-line bubble', 'data-who': who }, text);
  const amin = line('amin', t('tomorrow.line')), mish = line('mishmish', t('tomorrow.mishmish'));
  const ok = btn(t('tomorrow.ok'), { icon: 'moon', primary: true, testid: 'tomorrow-ok', cls: 'tomorrow-ok' });
  const lamp = (lit: boolean, label: string, cls: string) => h('div', { class: 'tomorrow-lamp ' + cls }, h('span', { class: 'lamp' + (lit ? ' on' : ' waiting') }, lanternArt(pr.lantern, lit)), h('span', { class: 'tomorrow-lamp-label' }, label));
  const card = h('div', { class: 'overlay tomorrow-card', 'data-testid': 'tomorrow', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'tomorrow-title' },
    h('div', { class: 'tomorrow-sky', 'aria-hidden': 'true' }),
    h('h2', { id: 'tomorrow-title', class: 'tomorrow-title' }, t('tomorrow.title')),
    h('div', { class: 'tomorrow-stage' + (band ? ' banded' : ''), 'aria-hidden': 'true', style: band ? `--band:url("${new URL(band, location.href).href}")` : '' },
      h('div', { class: 'tomorrow-cast tomorrow-laqlaq' }, charArt('laqlaq', 'happy')),
      h('div', { class: 'tomorrow-cast tomorrow-amin' }, charArt('amin', 'sleep', pr.lantern)),
      h('div', { class: 'tomorrow-cast tomorrow-mishmish' }, charArt('mishmish', 'sleep'))),
    // today's lamp (lit: the day counts) and tomorrow's, waiting softly; in reading order, today first
    h('div', { class: 'tomorrow-lamps', 'data-testid': 'tomorrow-lamps' }, lamp(true, t('tomorrow.label.today'), 'is-today'), h('span', { class: 'tomorrow-thread', 'aria-hidden': 'true' }), lamp(false, t('tomorrow.label.tomorrow'), 'is-tomorrow')),
    amin, mish,
    n ? h('div', { class: 'tomorrow-polish', 'data-testid': 'tomorrow-polish', 'data-n': n },
      h('span', { class: 'tomorrow-pearls', 'aria-hidden': 'true' }, ...Array.from({ length: Math.min(n, 6) }, () => svg(pearlSvg('s1', true)))),
      h('span', null, t('tomorrow.polish', { n }))) : null,
    ok);
  document.body.appendChild(card);
  ok.focus({ preventScroll: true });   // the card covers the screen: its one button takes the focus (as E1's overlays)
  setActive({ right: () => ok, wrong: () => null, label: 'tomorrow' });
  sfx('page');
  const voice = new AbortController();
  const off = () => voice.abort();
  signal.addEventListener('abort', off, { once: true });
  let onKey: (e: KeyboardEvent) => void = () => {};
  const closed = new Promise<void>((resolve, reject) => {
    ok.addEventListener('click', () => resolve(), { once: true });
    // a dialog with one button: Escape closes it too, and Tab stays on the button
    onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); resolve(); } else if (e.key === 'Tab') { e.preventDefault(); ok.focus(); } };
    document.addEventListener('keydown', onKey);
    signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')), { once: true });
  });
  // the two lines, said in turn; the one being said glows (both stay on the card to be read)
  const speak = async (el: HTMLElement, line: () => Promise<void>) => { el.classList.add('speaking'); try { await line(); } finally { el.classList.remove('speaking'); } };
  const said = (async () => {
    await speak(amin, () => say('tomorrow.line', { signal: voice.signal, who: 'amin' }));
    await speak(mish, () => say('tomorrow.mishmish', { signal: voice.signal, who: 'mishmish' }));
  })();
  said.catch(() => {});   // cut by the button or by leaving the screen: never unhandled
  try { await closed; }
  finally {
    voice.abort(); signal.removeEventListener('abort', off);
    document.removeEventListener('keydown', onKey);
    stopVoice(); hideBubble(); setActive(null); card.remove();
  }
}
