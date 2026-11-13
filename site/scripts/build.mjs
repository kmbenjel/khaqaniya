#!/usr/bin/env node
// shatr — build a static Arabic-poem site from content/ + engine/ into dist/.
// Layouts: "single" (one page, optional ToC) and "paged" (index + a page per chapter).
import { readFileSync, writeFileSync, mkdirSync, rmSync, copyFileSync, existsSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import esbuild from 'esbuild';
import { parsePoem, checkTashkeel, validateConfig, normalizeBase, parseBayts } from './validate.mjs';
import { themeCss, resolveTheme, DEFAULT_THEME, themeNames } from './themes.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const r = (...p) => path.resolve(ROOT, ...p);
// Tests and multi-site setups can point the build elsewhere: SHATR_CONTENT (default content/), SHATR_DIST (default dist/).
const CONTENT = process.env.SHATR_CONTENT || 'content';
const read = (p) => readFileSync(r(p), 'utf8');
const die = (m) => { console.error('\x1b[31m✗ ' + m + '\x1b[0m'); process.exit(1); };
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const sha = (b) => createHash('sha256').update(b).digest('hex').slice(0, 10);

// ── Load + validate ─────────────────────────────────────────────────────────
let cfg;
try { cfg = JSON.parse(read(CONTENT + '/poem.config.json')); }
catch (e) { die(CONTENT + '/poem.config.json missing or invalid JSON: ' + e.message); }
// CI/deploy overrides, so one config can be built for several hosts (e.g. github.io/REPO/ now, a subdomain later).
if (process.env.SHATR_DOMAIN) cfg.domain = process.env.SHATR_DOMAIN;
if (process.env.SHATR_BASE_PATH) cfg.basePath = process.env.SHATR_BASE_PATH;
const cfgErrors = validateConfig(cfg);
if (cfgErrors.length) die('Config errors:\n  - ' + cfgErrors.join('\n  - '));
const { sections, errors } = parsePoem(read(CONTENT + '/poem.txt'));
if (errors.length) die('Poem errors:\n  - ' + errors.join('\n  - '));
const baytCount = sections.reduce((n, s) => n + s.bayts.length, 0);
// Optional per-bayt meanings + audio (content/bayts.json, see schema/bayts.schema.json).
const bayts = (() => {
    if (!existsSync(r(CONTENT + '/bayts.json'))) return { byN: new Map(), hasMeaning: false, hasAudio: false };
    let raw; try { raw = JSON.parse(read(CONTENT + '/bayts.json')); } catch (e) { die(CONTENT + '/bayts.json is not valid JSON: ' + e.message); }
    const res = parseBayts(raw, baytCount, (f) => existsSync(r(CONTENT, f)));
    if (res.errors.length) die('bayts.json errors:\n  - ' + res.errors.join('\n  - '));
    res.warnings.forEach(w => console.warn('\x1b[33m⚠ bayts.json — ' + w + '\x1b[0m'));
    return res;
})();
const warnings = checkTashkeel(sections);
if (warnings.length) {
    console.warn('\x1b[33m⚠ tashkeel — ' + warnings.length + ' line(s) may be under-voweled:\x1b[0m');
    warnings.slice(0, 12).forEach(w => console.warn('  ' + w));
    if (warnings.length > 12) console.warn('  …and ' + (warnings.length - 12) + ' more.');
}

// ── Derived ───────────────────────────────────────────────────────────────────
const LANG = cfg.lang || 'ar', DIR = cfg.dir || 'rtl';
// BASE = where the site lives on the host, as a root-relative path with leading + trailing slash ("/" or "/qasida/").
const BASE = normalizeBase(cfg.basePath);
const URL = 'https://' + cfg.domain + BASE;
const today = new Date().toISOString().slice(0, 10);
const siteSlug = (cfg.domain.split('.')[0] || 'poem').replace(/[^a-z0-9-]/gi, '');
// Service-worker cache names start with CACHE_PREFIX; the activate step deletes only caches with that prefix,
// so apps sharing an origin never wipe each other's caches. Set config.cachePrefix when hosting under a base path.
const CACHE_PREFIX = (cfg.cachePrefix || (BASE === '/' ? siteSlug : siteSlug + BASE.replace(/\/$/, '').replace(/[^a-z0-9]+/gi, '-'))).replace(/-+$/, '') + '-';
const layout = cfg.layout === 'paged' ? 'paged' : 'single';
const multi = sections.length > 1;
// theme preset (default "stone" = the classic look); explicit theme.themeColor/splashColor still win.
const themeName = (cfg.theme && cfg.theme.preset) || DEFAULT_THEME;
if (cfg.theme && cfg.theme.preset && !resolveTheme(cfg.theme.preset))
    console.warn(`\x1b[33m  ⚠ unknown theme preset "${cfg.theme.preset}" — using "${DEFAULT_THEME}". Available: ${themeNames().join(', ')}.\x1b[0m`);
const theme = resolveTheme(themeName) || resolveTheme(DEFAULT_THEME);
const UI = Object.assign({
    skip: 'تخطي إلى المحتوى', readerSettings: 'إعدادات القراءة', nav: 'التنقل في القصيدة', links: 'روابط القصيدة',
    dock: 'شريط التنقل', theme: 'تبديل المظهر', zoomIn: 'تكبير الخط', zoomOut: 'تصغير الخط', top: 'إلى الأعلى',
    bottom: 'إلى الأسفل', listen: 'سماع', send: 'إرسال', pdf: 'PDF', web: 'ويب', pdfTitle: 'تحميل PDF',
    soundTitle: 'سماع القصيدة', sendTitle: 'إرسال في واتساب', toc: 'الفهرس', prev: 'السابق', next: 'التالي', index: 'الفهرس',
    play: 'استماع', stop: 'إيقاف', meaning: 'المعنى', meanings: 'إظهار المعاني وإخفاؤها', hardWords: 'كلمات صعبة', more: 'المزيد',
    credits: 'الشكر والمصادر',
}, cfg.labels || {});
const R = cfg.resources || {};

// ── esbuild minify + hash ───────────────────────────────────────────────────────
const minify = async (f) => { const { code } = await esbuild.transform(read('engine/' + f), { minify: true, target: 'es2019', legalComments: 'none' }); return { code, hash: sha(code) }; };
const app = await minify('app.js');
const analytics = cfg.analytics && cfg.analytics.ga4;
let gtm = null;
if (analytics) { gtm = await minify('gtm-loader.js'); gtm.code = gtm.code.replace(/\{\{GA4_ID\}\}/g, cfg.analytics.ga4); gtm.hash = sha(gtm.code); }

// ── Buttons (rails + dock) ───────────────────────────────────────────────────────
const ACT = {
    'toggle-theme': ['i-theme', '0 0 512 512', UI.theme, true], 'zoom-in': ['i-plus', '0 0 448 512', UI.zoomIn],
    'zoom-out': ['i-minus', '0 0 448 512', UI.zoomOut], 'scroll-top': ['i-chevron-up', '0 0 448 512', UI.top],
    'scroll-bottom': ['i-chevron-down', '0 0 448 512', UI.bottom], 'scroll-sound': ['i-soundcloud', '0 0 640 512', UI.soundTitle],
    'scroll-whatsapp': ['i-whatsapp', '0 0 448 512', UI.sendTitle], 'scroll-pdf': ['i-pdf', '0 0 384 512', UI.pdfTitle],
    'toggle-meanings': ['i-bulb', '0 0 24 24', UI.meanings, true],
};
const btn = (kind, a) => { const [icon, vb, title, pressed] = ACT[a]; const cls = kind === 'dock' ? 'dock-btn' : 'control-btn';
    return `<button type="button" class="${cls}" data-action="${a}" title="${esc(title)}" aria-label="${esc(title)}"${pressed ? ' aria-pressed="false"' : ''}><svg class="icon-svg" aria-hidden="true" viewBox="${vb}"><use href="#${icon}"/></svg></button>`; };
const rail = (kind, acts) => acts.map(a => btn(kind, a)).join('');
const dockGroup = (name, acts) => acts.length ? `<div class="dock-group ${name}">${rail('dock', acts)}</div>` : '';
const settingsActions = ['toggle-theme', 'zoom-in', 'zoom-out', ...(bayts.hasMeaning ? ['toggle-meanings'] : [])];
const navActions = ['scroll-top', 'scroll-bottom'];
const resActions = [R.soundcloud && 'scroll-sound', R.whatsapp && 'scroll-whatsapp', R.pdf && 'scroll-pdf'].filter(Boolean);

// ── Poem + ToC builders ──────────────────────────────────────────────────────────
const chapterSlug = (i) => 'chapter-' + (i + 1);
const tocLabel = (i) => sections[i].label || (i === 0 ? cfg.title : (cfg.title + ' — ' + (i + 1)));
const baytHtml = (b, n) => {
    const core = `            <div class="bayt">\n                <div class="verse">${esc(b[0].text)}</div>\n                <div class="verse">${esc(b[1].text)}</div>\n            </div>`;
    const info = bayts.byN.get(n);
    if (!info) return core;
    // Tools + meaning sit OUTSIDE .bayt: the kashida pass reads .verse nodes by index inside .bayt grids.
    const tools = [];
    if (info.audio) tools.push(`<button type="button" class="tool-btn" data-bayt-action="audio" data-src="${esc(BASE + info.audio)}" data-play-label="${esc(UI.play)}" data-stop-label="${esc(UI.stop)}" aria-pressed="false"><svg class="icon-svg" aria-hidden="true" viewBox="0 0 24 24"><use href="#i-play"/></svg><span class="lbl">${esc(UI.play)}</span></button>`);
    if (info.kid) tools.push(`<button type="button" class="tool-btn" data-bayt-action="meaning" aria-expanded="false" aria-controls="m${n}"><svg class="icon-svg" aria-hidden="true" viewBox="0 0 24 24"><use href="#i-bulb"/></svg><span class="lbl">${esc(UI.meaning)}</span></button>`);
    const panel = info.kid ? `\n                <aside class="sharh" id="m${n}" hidden>`
        + `<p class="sharh-kid">${esc(info.kid)}</p>`
        + (info.words.length ? `<h3 class="sharh-h">${esc(UI.hardWords)}</h3><ul class="sharh-words">${info.words.map(x => `<li><b>${esc(x.w)}</b>: ${esc(x.m)}</li>`).join('')}</ul>` : '')
        + (info.more ? `<details class="sharh-more"><summary>${esc(UI.more)}</summary><p>${esc(info.more)}</p></details>` : '')
        + `</aside>` : '';
    return `            <div class="bayt-item" id="b${n}">\n${core}\n                <div class="bayt-tools">${tools.join('')}</div>${panel}\n            </div>`;
};
const baytOffset = sections.map((_, i) => sections.slice(0, i).reduce((n, x) => n + x.bayts.length, 0));
const sigHtml = (s, idx) => {
    const dl = (idx === 0 && cfg.dates && cfg.dates.signatureLine) ? `\n                <span class="poet-date">${esc(cfg.dates.signatureLine)}</span>` : '';
    return `            <div class="signature">\n                <span class="poet-name">${esc(cfg.author)}</span>${dl}\n            </div>`;
};
// config.signature: "each" (default, shatr's behaviour), "last" (only after the final section) or "none".
const SIGNATURE = ['each', 'last', 'none'].includes(cfg.signature) ? cfg.signature : 'each';
const sectionHtml = (s, idx, { withSig = true, asChapter = false } = {}) => {
    if (withSig && !asChapter) withSig = SIGNATURE === 'each' || (SIGNATURE === 'last' && idx === sections.length - 1);
    const head = (idx === 0 && !asChapter)
        ? `            <h1 class="title">${esc(cfg.title)}</h1>`
        : `            <h2 class="title">${esc(asChapter ? (s.label || cfg.title) : cfg.title)}${s.label && !(idx === 0) ? `<span class="subtitle">${esc(s.label)}</span>` : (asChapter ? `<span class="subtitle">${esc(cfg.title)}</span>` : '')}</h2>`;
    return `        <div class="poem-section" id="sec-${idx + 1}">\n${head}\n${s.bayts.map((b, k) => baytHtml(b, baytOffset[idx] + k + 1)).join('\n\n')}${withSig ? '\n\n' + sigHtml(s, idx) : ''}\n        </div>`;
};
const tocHtml = (linkFn) => `        <nav class="toc" aria-label="${esc(UI.toc)}">\n            <h2>${esc(UI.toc)}</h2>\n            <ol>\n${sections.map((s, i) => `                <li><a href="${linkFn(i)}">${esc(tocLabel(i))}</a></li>`).join('\n')}\n            </ol>\n        </nav>`;
const chapterNav = (idx) => {
    const a = (i, label) => `<a href="${BASE}${chapterSlug(i)}/">${esc(label)}</a>`;
    const prev = idx > 0 ? a(idx - 1, UI.prev) : '<span class="nv-disabled"></span>';
    const next = idx < sections.length - 1 ? a(idx + 1, UI.next) : '<span class="nv-disabled"></span>';
    return `        <nav class="chapter-nav">${prev}<a href="${BASE}">${esc(UI.index)}</a>${next}</nav>`;
};

// ── Resource cards ─────────────────────────────────────────────────────────────
const card = (href, dl, id, ic, icon, vb, label, sameTab) =>
    `                <a href="${href}"${dl ? ` download="${dl}"` : sameTab ? '' : ' target="_blank" rel="noopener noreferrer"'} class="resource-card" id="${id}">\n                    <div class="resource-content-wrapper">\n                        <div class="resource-icon ${ic}"><svg class="icon-svg" aria-hidden="true" viewBox="${vb}"><use href="#${icon}"/></svg></div>\n                        <div class="resource-info"><div class="resource-label">${esc(label)}</div></div>\n                    </div>\n                </a>`;
const waText = (R.whatsapp === true || R.whatsapp === undefined) ? `*${cfg.title}*\n${cfg.author}\n🔗 ${URL}` : String(R.whatsapp);
const resourceCards = () => {
    const c = [];
    if (R.soundcloud) c.push(card(esc(R.soundcloud), '', 'soundcloud-card', 'soundcloud-icon', 'i-soundcloud', '0 0 640 512', UI.listen));
    if (R.whatsapp) c.push(card('https://api.whatsapp.com/send?text=' + encodeURIComponent(waText), '', 'whatsapp-card', 'whatsapp-icon', 'i-whatsapp', '0 0 448 512', UI.send));
    if (R.pdf) c.push(card(BASE + esc(R.pdf), esc(R.pdf), 'pdf-card', 'pdf-icon', 'i-pdf', '0 0 384 512', UI.pdf));
    // config.resources.links: [{ href, label, icon: "game"|"web" }] — extra cards, same tab (e.g. a companion game on the same origin).
    (R.links || []).forEach((l, i) => c.push(card(esc(l.href), '', 'link-card-' + (i + 1), l.icon === 'game' ? 'game-icon' : 'web-icon',
        l.icon === 'game' ? 'i-game' : 'i-web', l.icon === 'game' ? '0 0 24 24' : '0 0 512 512', l.label, true)));
    c.push(card(esc(URL), '', 'web-card', 'web-icon', 'i-web', '0 0 512 512', UI.web));
    return `        <section class="resource-section" id="bottom" aria-label="${esc(UI.links)}">\n            <div class="resource-grid">\n${c.join('\n')}\n            </div>\n        </section>`;
};

// config.credits: { title?, items: [{ label, text, href? }] } — recitation, sources, etc., shown under the link cards.
const creditsHtml = () => {
    const items = (cfg.credits && cfg.credits.items) || [];
    if (!items.length) return '';
    const li = (it) => `                <li>${it.label ? `<b>${esc(it.label)}:</b> ` : ''}${it.href ? `<a href="${esc(it.href)}" target="_blank" rel="noopener noreferrer">${esc(it.text)}</a>` : esc(it.text)}</li>`;
    return `\n        <section class="credits" id="credits" aria-label="${esc((cfg.credits && cfg.credits.title) || UI.credits)}">\n            <h2>${esc((cfg.credits && cfg.credits.title) || UI.credits)}</h2>\n            <ul>\n${items.map(li).join('\n')}\n            </ul>\n        </section>`;
};

// ── Footer ──────────────────────────────────────────────────────────────────────
const F = cfg.footer || {};
const fb = F.facebook ? ` <a href="${esc(F.facebook)}" target="_blank" rel="noopener noreferrer">${esc(F.name || cfg.author)} <svg class="icon-svg footer-fb-icon" aria-hidden="true" viewBox="0 0 512 512"><use href="#i-facebook"/></svg></a>` : ` ${esc(F.name || cfg.author)}`;
const FOOTER = [`        <p>${esc(F.credit || '')}${fb}</p>`, F.dateLine ? `        <p>${esc(F.dateLine)}</p>` : '',
    `        <p id="last-updated" data-fallback-date="${today}" style="font-size:0.8em;opacity:0.8;margin-top:6px">آخر تحديث: ${today}</p>`].filter(Boolean).join('\n');

// ── Head meta + JSON-LD (per page) ────────────────────────────────────────────────
const social = cfg.social && cfg.social.card;
const ogImg = social ? URL + 'assets/social-card.jpg' : URL + 'assets/icons/icon-512.png';
const ogW = social ? 1200 : 512, ogH = social ? 630 : 512;
const firstBayt = sections[0].bayts[0] ? sections[0].bayts[0].map(s => s.text).join('\n') : '';
const m = (p, c, prop) => `    <meta ${prop ? 'property' : 'name'}="${p}" content="${esc(c)}">`;
const headMeta = (title, canonical) => [
    m('description', cfg.description), `    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">`,
    m('author', cfg.author), m('theme-color', (cfg.theme && cfg.theme.themeColor) || theme.themeColor),
    m('theme-color-dark', (cfg.theme && cfg.theme.splashColor) || theme.splashColor),
    `    <meta name="color-scheme" content="light dark">`, `    <meta name="apple-mobile-web-app-capable" content="yes">`,
    `    <meta name="mobile-web-app-capable" content="yes">`, `    <meta name="apple-mobile-web-app-status-bar-style" content="default">`,
    cfg.dates && cfg.dates.published ? m('date', cfg.dates.published) : '', m('last-modified', today),
    `    <link rel="icon" href="${BASE}assets/icons/favicon.ico" sizes="any">`, `    <link rel="icon" type="image/png" sizes="32x32" href="${BASE}assets/icons/favicon-32x32.png">`,
    `    <link rel="icon" type="image/svg+xml" href="${BASE}assets/icons/favicon.svg">`, `    <link rel="apple-touch-icon" sizes="180x180" href="${BASE}assets/icons/apple-touch-icon.png">`,
    `    <link rel="manifest" href="${BASE}site.webmanifest">`, `    <link rel="canonical" href="${canonical}">`,
    R.pdf ? `    <link rel="alternate" type="application/pdf" href="${URL}${esc(R.pdf)}">` : '',
    `    <meta property="og:type" content="website">`, m('og:locale', LANG.includes('-') ? LANG.replace('-', '_') : LANG, true),
    cfg.siteName ? m('og:site_name', cfg.siteName, true) : '', m('og:title', title, true), m('og:description', cfg.description, true),
    m('og:url', canonical, true), `    <meta property="og:image" content="${ogImg}">`, `    <meta property="og:image:width" content="${ogW}">`,
    `    <meta property="og:image:height" content="${ogH}">`, m('twitter:title', title), m('twitter:description', cfg.description),
    m('twitter:image', ogImg), `    <meta name="twitter:card" content="summary_large_image">`, `    <title>${esc(title)}</title>`,
].filter(Boolean).join('\n');
const jsonLd = (title, canonical) => {
    const o = { '@context': 'https://schema.org', '@type': ['CreativeWork', 'Poem'], name: cfg.title, headline: title,
        description: cfg.description, inLanguage: LANG, author: { '@type': 'Person', name: cfg.author },
        ...(cfg.editor ? { editor: { '@type': 'Person', name: cfg.editor } } : {}), dateCreated: cfg.dates && cfg.dates.created,
        datePublished: cfg.dates && cfg.dates.published, dateModified: today, text: firstBayt, url: canonical,
        mainEntityOfPage: { '@type': 'WebPage', '@id': canonical }, isAccessibleForFree: true,
        ...(cfg.keywords ? { keywords: cfg.keywords } : {}), ...(cfg.about ? { about: cfg.about } : {}),
        image: [{ '@type': 'ImageObject', url: ogImg, contentUrl: ogImg, width: ogW, height: ogH, caption: cfg.title }] };
    return '    <script type="application/ld+json">\n' + JSON.stringify(o, null, 2).replace(/^/gm, '    ') + '\n    </script>';
};

// ── CSP ───────────────────────────────────────────────────────────────────────────
const PREPAINT = read('engine/prepaint.js').trim();
const inlineHash = createHash('sha256').update(PREPAINT).digest('base64');
const CSP = [`default-src 'self'`, `script-src 'self' 'sha256-${inlineHash}'${analytics ? ' https://www.googletagmanager.com https://www.google-analytics.com' : ''} https://static.cloudflareinsights.com`,
    `style-src 'self' 'unsafe-inline'`, `img-src 'self' data:${analytics ? ' https://www.google-analytics.com https://www.googletagmanager.com' : ''}`,
    `font-src 'self'`, ...(bayts.hasAudio ? [`media-src 'self' blob:`] : []), `connect-src 'self'${analytics ? ' https://www.google-analytics.com https://www.googletagmanager.com' : ''} https://cloudflareinsights.com`,
    `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`].join('; ');

// ── Page assembler ─────────────────────────────────────────────────────────────────
const TEMPLATE = read('engine/template.html'), STYLES = read('engine/styles.css').trim() + themeCss(themeName);
const ANALYTICS_HEAD = analytics ? `    <script src="${BASE}assets/js/gtm-loader.min.js?v=${gtm.hash}" defer></script>\n` : '';
const assemble = ({ title, canonical, main, withRes }) => (TEMPLATE
    .replace('{{DIR}}', DIR).replace('{{LANG}}', LANG).replace('{{CSP}}', CSP).replace('{{PREPAINT}}', PREPAINT)
    .replace('{{ANALYTICS_HEAD}}', ANALYTICS_HEAD).replace('{{HEAD_META}}', headMeta(title, canonical) + '\n' + jsonLd(title, canonical))
    .replace('{{STYLES}}', STYLES).replace('{{SKIP_LABEL}}', esc(UI.skip))
    .replace('{{ARIA_READER_SETTINGS}}', esc(UI.readerSettings)).replace('{{ARIA_NAV}}', esc(UI.nav))
    .replace('{{ARIA_LINKS}}', esc(UI.links)).replace('{{ARIA_DOCK}}', esc(UI.dock))
    .replace('{{CONTROLS}}', rail('control', settingsActions)).replace('{{NAV_CONTROLS}}', rail('control', navActions))
    .replace('{{LEFT_CONTROLS}}', withRes ? rail('control', resActions) : '')
    .replace('{{MAIN_CLASS}}', cfg.continuousNumbering ? ' continuous' : '').replace('{{MAIN}}', main).replace('{{FOOTER}}', FOOTER).replace('{{APP_SCRIPT}}', `${BASE}assets/js/app.min.js?v=${app.hash}`)
    .replace('{{BOTTOM_DOCK}}', dockGroup('settings-group', settingsActions) + dockGroup('nav-group', navActions) + (withRes ? dockGroup('resources-group', resActions) : '')))
    .replace(/\{\{BASE\}\}/g, BASE);

// ── Write dist/ ───────────────────────────────────────────────────────────────────
const DIST = r(process.env.SHATR_DIST || 'dist');
rmSync(DIST, { recursive: true, force: true });
mkdirSync(path.join(DIST, 'assets/js'), { recursive: true });
mkdirSync(path.join(DIST, 'assets/icons'), { recursive: true });
mkdirSync(path.join(DIST, 'fonts'), { recursive: true });
const w = (p, c) => { const fp = path.join(DIST, p); mkdirSync(path.dirname(fp), { recursive: true }); writeFileSync(fp, c); };

w('assets/js/app.min.js', app.code);
if (gtm) w('assets/js/gtm-loader.min.js', gtm.code);
// Custom domains need a CNAME; a free username.github.io host must NOT have one.
// Under a base path the root site owns the CNAME and robots.txt (list our sitemap there).
if (BASE === '/') {
    if (!/\.github\.io$/i.test(cfg.domain)) w('CNAME', cfg.domain + '\n');
    w('robots.txt', read('engine/robots.txt').replace(/\{\{URL\}\}/g, URL));
}
w('site.webmanifest', read('engine/manifest.template.json').replace(/\{\{TITLE\}\}/g, cfg.title).replace('{{SHORT_NAME}}', cfg.shortName || cfg.title)
    .replace('{{MANIFEST_DESC}}', cfg.manifestDescription || cfg.description).replace('{{LANG}}', LANG).replace('{{DIR}}', DIR).replace(/\{\{BASE\}\}/g, BASE)
    .replace('{{SPLASH_COLOR}}', (cfg.theme && cfg.theme.splashColor) || theme.splashColor).replace('{{THEME_COLOR}}', (cfg.theme && cfg.theme.themeColor) || theme.themeColor));
const swAssets = ['./', './index.html', './site.webmanifest', './fonts/amiri-regular-arabic.woff2', './assets/icons/apple-touch-icon.png',
    './assets/icons/favicon-16x16.png', './assets/icons/favicon-32x32.png', './assets/icons/favicon.ico', './assets/icons/favicon.svg',
    './assets/icons/icon-192.png', './assets/icons/icon-512.png', './assets/icons/icon-maskable-512.png',
    ...(gtm ? [`./assets/js/gtm-loader.min.js?v=${gtm.hash}`] : []), `./assets/js/app.min.js?v=${app.hash}`];
w('sw.js', read('engine/sw.js').replace('{{CACHE_NAME}}', `${CACHE_PREFIX}cache-${app.hash}`).replace('{{CACHE_PREFIX}}', CACHE_PREFIX).replace('{{ASSETS}}', JSON.stringify(swAssets, null, 2)));
copyFileSync(r('fonts/amiri-regular-arabic.woff2'), path.join(DIST, 'fonts/amiri-regular-arabic.woff2'));
for (const f of readdirSync(r('engine/icons'))) copyFileSync(r('engine/icons', f), path.join(DIST, 'assets/icons', f));
// content/icons/* overrides the engine's default icons (a poem site should not ship the demo's logo).
if (existsSync(r(CONTENT + '/icons'))) for (const f of readdirSync(r(CONTENT + '/icons'))) copyFileSync(r(CONTENT + '/icons', f), path.join(DIST, 'assets/icons', f));
if (social && existsSync(r(CONTENT, social))) copyFileSync(r(CONTENT, social), path.join(DIST, 'assets/social-card.jpg'));
if (R.pdf && existsSync(r(CONTENT, R.pdf))) copyFileSync(r(CONTENT, R.pdf), path.join(DIST, R.pdf));
// audio clips named in content/bayts.json: copied as-is (not precached by the service worker; cached on first play).
for (const info of bayts.byN.values()) if (info.audio) { mkdirSync(path.dirname(path.join(DIST, info.audio)), { recursive: true }); copyFileSync(r(CONTENT, info.audio), path.join(DIST, info.audio)); }
// framework-internal: the shatr demo ships the "ديوان شطر" gallery at /showcase/.
// Gated on cfg.showcase so it never leaks into a generated poem site.
if (cfg.showcase === true && existsSync(r('showcase'))) {
    mkdirSync(path.join(DIST, 'showcase'), { recursive: true });
    for (const f of readdirSync(r('showcase'))) copyFileSync(r('showcase', f), path.join(DIST, 'showcase', f));
}

let urls = [URL];
if (cfg.showcase === true && existsSync(r('showcase'))) urls.push(URL + 'showcase/');
if (layout === 'paged') {
    const indexMain = (sections.length ? tocHtml((i) => BASE + chapterSlug(i) + '/') + '\n' : '') + resourceCards() + creditsHtml();
    w('index.html', assemble({ title: cfg.title, canonical: URL, main: indexMain, withRes: true }));
    sections.forEach((s, i) => {
        const canonical = URL + chapterSlug(i) + '/';
        const main = chapterNav(i) + '\n' + sectionHtml(s, i, { withSig: i === 0, asChapter: true }) + '\n' + chapterNav(i);
        w(chapterSlug(i) + '/index.html', assemble({ title: tocLabel(i) === cfg.title ? cfg.title : tocLabel(i) + ' — ' + cfg.title, canonical, main, withRes: false }));
        urls.push(canonical);
    });
} else {
    const main = (multi ? tocHtml((i) => '#sec-' + (i + 1)) + '\n' : '') + sections.map((s, i) => sectionHtml(s, i)).join('\n\n') + '\n' + resourceCards() + creditsHtml();
    w('index.html', assemble({ title: cfg.title, canonical: URL, main, withRes: true }));
}
// printable full-poem page (all sections, single layout) — used by `shatr pdf`; not indexed.
const printMain = sections.map((s, i) => sectionHtml(s, i)).join('\n\n') + '\n' + resourceCards();
w('print.html', assemble({ title: cfg.title, canonical: URL, main: printMain, withRes: false })
    .replace('content="index, follow,', 'content="noindex, nofollow,'));

w('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map(u => `  <url><loc>${u}</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>${u === URL ? '1.0' : '0.8'}</priority></url>`).join('\n') + `\n</urlset>\n`);

console.log(`\x1b[32m✓ built dist/ (${layout}, base ${BASE}) — ${sections.length} section(s), ${baytCount} bayt(s), ${bayts.byN.size} with meaning/audio, ${urls.length} page(s), app.min.js?v=${app.hash}\x1b[0m`);
