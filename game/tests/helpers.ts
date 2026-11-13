import { expect, type Page } from '@playwright/test';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';

export const GAME = path.resolve(import.meta.dirname, '..');
export const REPO = path.resolve(GAME, '..');
/** The poem the build used (dist/data/build.json says whether a fixture stood in). */
export function sourcePoem(): { verses: { n: number; sadr: string; ajz: string; rhymeWord: string }[] } {
  const real = path.join(REPO, 'text/khaqaniya.json');
  const build = JSON.parse(readFileSync(path.join(GAME, 'dist/data/build.json'), 'utf8'));
  const usedFixture = build.fixture.some((f: string) => f.startsWith('text:'));
  return JSON.parse(readFileSync(usedFixture || !existsSync(real) ? path.join(GAME, 'fixtures/khaqaniya.dev.json') : real, 'utf8'));
}
export const Q = (o: Record<string, string | number> = {}) => '?' + new URLSearchParams({ capture: '1', recitation: '0', voices: '0', sfx: '1', speed: '25', fresh: '1', seed: '42', motion: '0', ...Object.fromEntries(Object.entries(o).map(([k, v]) => [k, String(v)])) }).toString();

export async function open(page: Page, o: Record<string, string | number> = {}, hash = '#/') {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(Q(o) + hash);
  await page.waitForFunction(() => !!(window as unknown as { __kq?: unknown }).__kq);
  return errors;
}
export const kq = (page: Page, fn: string, ...args: unknown[]) => page.evaluate(([f, a]) => (window as any).__kq[f as string](...(a as unknown[])), [fn, args] as const);
export const state = (page: Page) => page.evaluate(() => (window as any).__kq.state());

export async function shot(page: Page, name: string) {
  const dir = path.join(GAME, 'test-shots');
  mkdirSync(dir, { recursive: true });
  await page.screenshot({ path: path.join(dir, name + '.png'), scale: 'css', type: 'png' });
}

/** Solve items until the predicate holds (or give up). */
export async function solveUntil(page: Page, done: () => Promise<boolean>, max = 400) {
  for (let i = 0; i < max; i++) {
    if (await done()) return true;
    await kq(page, 'solve');
    await page.waitForTimeout(30);
  }
  return done();
}
/** Records every media clip that really advanced (> 0.3 s): the game's Audio() elements are not in the DOM. */
export async function trackPlayback(page: Page) {
  await page.addInitScript(() => {
    const w = window as any; w.__advanced = [];
    const orig = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      const el = this; const src = el.src;
      const on = () => { if (el.src === src && el.currentTime > 0.3) { w.__advanced.push(src); el.removeEventListener('timeupdate', on); } };
      el.addEventListener('timeupdate', on);
      return orig.call(this);
    };
  });
}
export const advancedClips = (page: Page): Promise<string[]> => page.evaluate(() => (window as any).__advanced || []);
export { expect };
