// G5: installing the game — Android Chrome (Chrome's own installability check, in a real profile: Chrome never calls
// an incognito context installable) and iOS Safari (WebKit with the iPhone profile: boots, plays verse 1, the home
// screen icon, the «add to home screen» line in the grown-ups' corner).
import { test, expect, chromium, webkit, devices } from '@playwright/test';
import { existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Q } from './helpers';

const BASE = 'http://127.0.0.1:4321/khaqaniya/';

test('Android Chrome: installable, the worker in control, offline reload', async ({}, info) => {
  test.skip(info.project.name !== 'phone', 'once');
  test.setTimeout(180_000);
  const ctx = await chromium.launchPersistentContext(mkdtempSync(path.join(tmpdir(), 'kq-install-')), { channel: 'chrome', ...devices['Pixel 7'] });
  try {
    const p = ctx.pages()[0] || (await ctx.newPage());
    const errors: string[] = [];
    p.on('pageerror', (e) => errors.push(String(e)));
    await p.goto(BASE);
    await p.waitForFunction(async () => !!(await navigator.serviceWorker.getRegistration())?.active, null, { timeout: 60_000 });
    await p.reload();
    await p.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 30_000 });
    const cdp = await ctx.newCDPSession(p);
    const inst = await cdp.send('Page.getInstallabilityErrors');
    const man = await cdp.send('Page.getAppManifest');
    const m = JSON.parse(man.data || '{}');
    console.log('android install:', JSON.stringify({ errors: inst.installabilityErrors, name: m.name, display: m.display, start_url: m.start_url, scope: m.scope, icons: (m.icons || []).length }));
    expect(inst.installabilityErrors).toEqual([]);
    expect(man.errors).toEqual([]);
    expect(m.display).toBe('standalone');
    expect(m.lang).toBe('ar');
    expect(m.dir).toBe('rtl');
    await ctx.setOffline(true);
    await p.reload();
    await expect(p.getByTestId('splash')).toBeVisible();
    expect(errors).toEqual([]);
  } finally { await ctx.close(); }
});

test('iOS Safari (WebKit, iPhone): boots, verse 1 to the pearl, home-screen icon, install line', async ({}, info) => {
  test.skip(info.project.name !== 'phone', 'once');
  test.skip(!existsSync(webkit.executablePath()), 'WebKit not installed (npx playwright install --with-deps webkit)');
  test.setTimeout(300_000);
  // not the config's Chrome channel nor its Chrome flags
  const browser = await webkit.launch({ channel: undefined, args: [] });
  try {
    const ctx = await browser.newContext({ ...devices['iPhone 13'], locale: 'ar' });
    const p = await ctx.newPage();
    const errors: string[] = [];
    p.on('pageerror', (e) => errors.push(String(e)));
    p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    // a child's start: splash → the story (skipped) → verse 1, played with taps (the test API taps the right answer)
    await p.goto(BASE + Q({ capture: 0, speed: 25 }));
    await expect(p.getByTestId('splash')).toBeVisible();
    console.log('ios: visibilityState', await p.evaluate(() => document.visibilityState));
    await p.getByTestId('btn-start').tap();
    await p.getByTestId('btn-skip').tap();
    await p.waitForFunction(() => (window as any).__kq?.state().screen === 'verse', null, { timeout: 30_000 });
    for (let i = 0; i < 1500; i++) {
      const s = await p.evaluate(() => (window as any).__kq.state());
      if (s.level?.step === 'reward' && s.item === 'reward') break;
      await p.evaluate(() => (window as any).__kq.solve(['reward', 'name-sheet']));
      if (await p.getByTestId('name-sheet').count()) await p.getByTestId('profile-later').tap().catch(() => {});
      await p.waitForTimeout(20);
    }
    const s = await p.evaluate(() => (window as any).__kq.state());
    expect(s.learned).toBe(1);
    expect(await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    // the icon iOS puts on the home screen, and the manifest
    const icon = await p.evaluate(() => (document.querySelector('link[rel=apple-touch-icon]') as HTMLLinkElement | null)?.href);
    expect(icon).toBeTruthy();
    expect((await p.request.get(icon!)).status()).toBe(200);
    expect((await p.request.get(BASE + 'manifest.webmanifest')).status()).toBe(200);
    // iOS has no install prompt: the grown-ups' corner says how (capture mode opens the gate)
    await p.goto(BASE + Q({ speed: 25 }) + '#/grownups');
    await expect(p.getByTestId('install-ios')).toBeVisible();
    console.log('ios: verse 1 done, icon', icon, 'errors', errors.length);
    expect(errors).toEqual([]);
    await ctx.close();
  } finally { await browser.close(); }
});
