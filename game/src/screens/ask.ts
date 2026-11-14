// «Ask the stork» without any AI (GAME_DESIGN §9 B, v1): chips that answer from meanings.json for the current verse.
// A child only gets the vocalised, child-facing fields (kid meaning, words, lesson). The long explanation (`adult`,
// barely vocalised, written for grown-ups) and the sources (`cite`, page references) show in grown-up mode only,
// in their own row labelled «لِلْكِبَارِ» (G5, owner 2026-11-14).
import { h } from '../core/h';
import { t } from '../core/copy';
import type { Verse } from '../core/data';
import { btn, sheet } from '../core/ui';
import { settings } from '../core/store';
import { charArt } from '../art';

type Chip = [key: string, answer: () => string, cls?: string];

export function askSheet(v: Verse) {
  const m = v.meaning;
  const answer = h('div', { class: 'ask-answer', 'data-testid': 'ask-answer', 'aria-live': 'polite' });
  const kid: Chip[] = [
    ['ai.ask.q.meaning', () => m?.kid || t('meaning.empty')],
    ['ai.ask.q.words', () => (m?.words?.length ? m.words.map((w) => w.w + ' : ' + w.m).join('\n') : t('ai.ask.empty'))],
    ['ai.ask.q.lesson', () => m?.lesson || t('ai.ask.empty')],
  ];
  const grown: Chip[] = settings().grownupMode ? [
    ['ai.ask.q.adult', () => (m?.adult ? t('meaning.adult') + ' ' + m.adult : t('ai.ask.empty')), 'adult'],
    ['ai.ask.q.cite', () => (m?.cite?.length ? t('meaning.cite') + '\n' + m.cite.join('\n') : t('ai.ask.empty')), 'adult'],
  ] : [];
  const chip = ([k, f, cls]: Chip, i: number) => btn(t(k), { cls: 'chip', testid: 'ask-q-' + i, onClick: () => { answer.textContent = f(); answer.classList.toggle('adult', cls === 'adult'); } });
  const row = h('div', { class: 'ask-chips' }, ...kid.map(chip));
  const grownRow = grown.length
    ? h('div', { class: 'ask-chips ask-grown', 'data-testid': 'ask-grown' }, h('span', { class: 'ask-grown-label' }, t('home.grownups')), ...grown.map((c, i) => chip(c, kid.length + i)))
    : null;
  sheet(h('div', { class: 'ask' }, h('div', { class: 'ask-stork' }, charArt('laqlaq', 'happy')), row, grownRow, answer), { testid: 'ask-sheet', title: t('ai.ask.title') });
}
