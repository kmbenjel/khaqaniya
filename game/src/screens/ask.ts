// «Ask the stork» without any AI (GAME_DESIGN §9 B, v1): chips that answer from meanings.json for the current verse.
import { h } from '../core/h';
import { t } from '../core/copy';
import type { Verse } from '../core/data';
import { btn, sheet } from '../core/ui';
import { charArt } from '../art';

export function askSheet(v: Verse) {
  const m = v.meaning;
  const answer = h('div', { class: 'ask-answer', 'data-testid': 'ask-answer', 'aria-live': 'polite' });
  const chips: [string, () => string][] = [
    ['ai.ask.q.meaning', () => m?.kid || t('meaning.empty')],
    ['ai.ask.q.words', () => (m?.words?.length ? m.words.map((w) => w.w + ' : ' + w.m).join('\n') : t('ai.ask.empty'))],
    ['ai.ask.q.lesson', () => m?.lesson || t('ai.ask.empty')],
    ['ai.ask.q.adult', () => m?.adult || t('ai.ask.empty')],
    ['ai.ask.q.cite', () => (m?.cite?.length ? m.cite.join('\n') : t('ai.ask.empty'))],
  ];
  const row = h('div', { class: 'ask-chips' }, ...chips.map(([k, f], i) => btn(t(k), { cls: 'chip', testid: 'ask-q-' + i, onClick: () => { answer.textContent = f(); } })));
  sheet(h('div', { class: 'ask' }, h('div', { class: 'ask-stork' }, charArt('laqlaq', 'happy')), row, answer), { testid: 'ask-sheet', title: t('ai.ask.title') });
}
