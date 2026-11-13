// Q1: PWA installability (Lighthouse 12+ has no PWA category): Chrome's own installability errors via CDP, the manifest
// fields, the service worker in control, and an offline reload. VM, needs `node tests/serve.mjs 4321`.
import { chromium } from '@playwright/test';
const URL_ = 'http://127.0.0.1:4321/khaqaniya/';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
// a persistent profile: Chrome never reports an incognito context as installable
const ctx = await chromium.launchPersistentContext(mkdtempSync(path.join(tmpdir(), 'kq-pwa-')), { channel: 'chrome', viewport: { width: 390, height: 844 } });
const b = { close: () => ctx.close() };
const p = ctx.pages()[0] || (await ctx.newPage());
await p.goto(URL_);
await p.waitForFunction(async () => !!(await navigator.serviceWorker.getRegistration())?.active, null, { timeout: 60_000 });
await p.reload();
await p.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 30_000 });
const cdp = await ctx.newCDPSession(p);
const inst = await cdp.send('Page.getInstallabilityErrors');
const man = await cdp.send('Page.getAppManifest');
const m = JSON.parse(man.data || '{}');
await ctx.setOffline(true);
await p.reload();
const offlineOk = await p.evaluate(() => document.title.length > 0 && !!document.getElementById('app'));
console.log(JSON.stringify({ installabilityErrors: inst.installabilityErrors, manifestUrl: man.url, manifestErrors: man.errors, name: m.name, short_name: m.short_name, start_url: m.start_url, scope: m.scope, display: m.display, lang: m.lang, dir: m.dir, icons: (m.icons || []).map((i) => i.sizes + ' ' + (i.purpose || '')), offlineReload: offlineOk }, null, 1));
await b.close();
