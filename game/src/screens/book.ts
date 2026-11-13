// Sticker book (GAME_DESIGN §5.2) and the heroes board (§10.3).
import { h } from '../core/h';
import { t, num } from '../core/copy';
import { btn, iconBtn, sheet } from '../core/ui';
import { charArt, blotArt, lanternArt, iconEl, medalSvg, artImg } from '../art';
import { svg } from '../core/h';
import { profile, S, switchProfile, addProfile, type Profile } from '../core/store';
import { P, STICKERS, stickerId } from '../core/progress';
import { go, type ScreenCtx } from '../core/router';
import { sfx } from '../core/sfx';

const ACH_ICON: Record<string, string> = {
  firstPearl: 'pearl', sevenPearls: 'pearls', half: 'necklace', all: 'necklace', golden: 'star', polish5: 'cloth', days3: 'sun', days7: 'sun', days14: 'sun', days30: 'sun',
  weekFull: 'dawn', comeback: 'heart', seven: 'seven-lanterns', calm: 'cup', listener: 'ear', wholeListen: 'loop', recorded: 'mic', sardine: 'gift', medal: 'trophy',
};
export function stickerArt(page: string, id: string): Element {
  if (page === 'friends') return ['amin', 'mishmish', 'laqlaq'].includes(id) ? charArt(id, 'happy') : blotArt(id, true);
  if (page === 'districts') return lanternArt('gold', true);
  if (id === 'medal') return artImg('medal', 'medal-art', () => svg(medalSvg())) || svg(medalSvg());
  return iconEl(ACH_ICON[id] || 'star');
}

export function stickersScreen(_ctx: ScreenCtx): HTMLElement {
  const pr = profile();
  const pages = ['friends', 'districts', 'achievements'] as const;
  let cur: (typeof pages)[number] = 'friends';
  const grid = h('div', { class: 'sticker-grid', 'data-testid': 'sticker-grid' });
  const tabs = h('div', { class: 'tabs', role: 'tablist' });
  const render = () => {
    grid.replaceChildren();
    for (const id of STICKERS[cur]) {
      const sid = stickerId(cur, id);
      const got = !!pr.stickers[sid];
      const name = cur === 'districts' ? t('district.' + id + '.name') : t('sticker.' + sid);
      const b = h('button', { type: 'button', class: 'sticker' + (got ? ' got' : ' locked'), 'data-testid': 'sticker-' + sid, 'aria-label': got ? name : t('stickers.locked') },
        h('span', { class: 'sticker-art' }, stickerArt(cur, id)), h('span', { class: 'sticker-name' }, got ? name : '؟'));
      b.addEventListener('click', () => {
        sfx('page');
        sheet(h('div', { class: 'sticker-big' }, h('span', { class: 'sticker-art big' + (got ? '' : ' locked') }, stickerArt(cur, id)), h('h3', null, got ? name : t('stickers.locked')),
          got && cur === 'districts' ? h('p', null, t('sticker.district.cap')) : got ? h('p', null, t('sticker.' + sid + '.cap')) : null), { testid: 'sticker-sheet' });
      });
      grid.appendChild(b);
    }
    tabs.querySelectorAll('.tab').forEach((x) => x.setAttribute('aria-selected', String((x as HTMLElement).dataset.page === cur)));
  };
  pages.forEach((pg) => {
    const count = STICKERS[pg].filter((id) => pr.stickers[stickerId(pg, id)]).length;
    const tb = h('button', { type: 'button', class: 'tab', role: 'tab', 'data-page': pg, 'data-testid': 'tab-' + pg }, t('stickers.tab.' + (pg === 'achievements' ? 'feats' : pg)), ' ', h('small', null, num(count), '/', num(STICKERS[pg].length)));
    tb.addEventListener('click', () => { sfx('page'); cur = pg; render(); });
    tabs.appendChild(tb);
  });
  render();
  return h('div', { class: 'page stickers', 'data-testid': 'stickers' },
    h('header', { class: 'topbar' }, iconBtn('back', 'aria.back', 'btn-back', () => go('#/'), 'back-btn'), h('div', { class: 'top-title' }, t('stickers.title'))), tabs, grid);
}

export function rankOf(p: Profile, total: number): number {
  const n = Object.values(p.verses).filter((v) => v.stars > 0).length;
  return n === 0 ? 0 : n < total / 4 ? 1 : n < total / 2 ? 2 : n < total ? 3 : 4;
}
export function heroesScreen(_ctx: ScreenCtx): HTMLElement {
  const total = P().verses.length;
  const rows = S().profiles.map((p) => ({ p, n: Object.values(p.verses).filter((v) => v.stars > 0).length, s: Object.values(p.verses).reduce((a, v) => a + v.stars, 0) }))
    .sort((a, b) => b.n - a.n || b.s - a.s);
  const list = h('div', { class: 'heroes-list', 'data-testid': 'heroes' }, ...rows.map(({ p, n, s }) => {
    const b = h('button', { type: 'button', class: 'hero-row' + (p.id === profile().id ? ' me' : ''), 'data-testid': 'hero-' + p.id },
      lanternArt(p.lantern), h('span', { class: 'hero-name', dir: 'auto' }, p.name || t('profile.guest')),
      h('span', { class: 'hero-pearls' }, iconEl('necklace'), num(n), '/', num(total)), h('span', { class: 'hero-stars' }, iconEl('star'), num(s)),
      h('span', { class: 'hero-days' }, iconEl('sun'), num(p.days.length)), h('span', { class: 'hero-rank' }, t('heroes.rank.' + rankOf(p, total))));
    b.addEventListener('click', () => { sfx('tap'); switchProfile(p.id); go('#/'); });
    return b;
  }));
  return h('div', { class: 'page heroes' },
    h('header', { class: 'topbar' }, iconBtn('back', 'aria.back', 'btn-back', () => go('#/'), 'back-btn'), h('div', { class: 'top-title' }, t('heroes.title'))),
    list, btn(t('heroes.new'), { icon: 'plus', testid: 'btn-new-player', onClick: () => { addProfile(); go('#/'); } }), h('p', { class: 'note' }, t('heroes.local')));
}

/** The art of a sticker by its awarded id ('district.gate', 'manfoukh', 'firstPearl'…), for the «new sticker» banners. */
export function stickerArtById(id: string): Element {
  if (id.startsWith('district.')) return stickerArt('districts', id.slice(9));
  if (['amin', 'mishmish', 'laqlaq', 'manfoukh', 'khallat', 'ajoul', 'kaslan', 'mattat', 'qallab', 'fuwaq', 'duhrouj', 'khafiyy', 'nasyan'].includes(id)) return stickerArt('friends', id);
  return stickerArt('achievements', id);
}
