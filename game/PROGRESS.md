# G1 game build — progress

Game: «رحلة أمين في مدينة القرّاء», spec `design/GAME_DESIGN.md`. Vite + TypeScript, no framework (tiny `h()` DOM helper).
Build and test on the VM only: `scripts/vm.sh run 'cd game && npm ci && npm run build'`, then `npx playwright test`.

## Layout
- `scripts/prepare-data.mjs` (run by build/dev): copies text/khaqaniya.json, text/meanings.json, audio/timings.json (+clips),
  design/copy.ar.json, optional audio/meanings.json, audio/voice/index.json into `public/` (gitignored), validates the world
  binding (§3.3), prints the verse table and the missing copy keys (`copy-missing.txt`), writes `public/FIXTURE` when a
  fixture stood in (→ `dist/FIXTURE`, deploy must refuse), robots.txt (lists qasida/sitemap.xml), sitemap.xml, manifest.
- `scripts/make-fixture.mjs`: dev fixtures from `reviews/t2/witness/ghouthani_frames.tsv` (never typed verse text).
- `data/world.json` (districts), `data/verse-extras.json` (pictos, flags, Qur'anic token ranges by index),
  `data/art.json` (asset manifest: null = SVG fallback, a path = generated art), `data/copy-patterns.json`, `data/credits.json`.
- `src/core/*` data binding, copy `t()`, store (localStorage kq.v1), audio (reciter clips), sfx (noise synth), voice
  (captions + optional voice files), router, ui, progress. `src/games/*` mini-games. `src/screens/*`. `src/art/*` SVG.
- `sw.template.js` → `dist/sw.js` (prefix kq-game-, ignores /qasida/). `tests/*.spec.ts` Playwright (VM, google-chrome).

## Test
On the VM: `cd ~/kq/repo/game && npx playwright test` (webServer = `node tests/serve.mjs 4321`: game at /khaqaniya/,
real poem site or a stub with its own worker at /khaqaniya/qasida/). Phone 390×844 + desktop 1280×800, google-chrome.
`tests/smoke` boot/RTL/no foreign requests · `tests/district` district 1 through the UI + its challenge · `tests/games`
every mini-game, wrong taps + help, listener mode/weak words, specials, polish intervals and clock moves, necklace,
finale/prayer (no motion, no voice)/medal/certificate print/dedication, grown-ups gate + reduced motion ·
`tests/poem` the whole poem to the medal via the test API + on-screen text audit against the data ·
`tests/tokens` §13.5 option audit (200 seeds) + silah rendering · `tests/offline` SW, offline boot, qasida isolation ·
`tests/qa` (Q1) the §13.5 checklist: first game ≤ 60 s, no dead end ×51 (wrong taps / help only), layout audit at 4 sizes
(§6 sizes, harakat line-height, no h-scroll), sound off, polish clock, audio vs timings + Media Session, keyboard only,
reduced motion, faces flag, bundle grep, offline after «download everything». `tests/capture` (Q1) the video's capture features (`__kq.say`, `kq:sfx`, `&timings=`, fresh=1 first-time lines), see
`CAPTURE.md`. Drivers: `tests/playtest.mjs` (child-eye run,
districts 1–2), `tests/pwa-check.mjs` (installability), `tests/debug*.mjs`.
Test API notes (Q1): `solve(skip)` taps the next item at once, so loops waiting for a terminal item (reward, polish-done,
boss-done, finale, medal) must pass it in `skip`; `reset()` re-applies the URL switches; game `Audio()` elements are not in
the DOM, track playback with `trackPlayback()` (helpers).
Video capture: `node tests/demo-run.mjs video-capture all` (segments, real speed, events.json with kq:step/kq:audio/kq:say times).

## Done
- Data loader + world binding/validation + generic fallback, seeded RNG, t() with dev markers, storage.
- Level loop INTRO→LISTEN(karaoke, echo, slow)→MEANING(pictos, word chips, lahn tip, ask sheet)→A/B/C→RECITE→LINK→REWARD.
- Games G1, G2, G3, G4 (+radar), G5a/b, G6 (rungs 1–4), G7 (self-check + listener), G8, G9, S1 caravan, S2 hats.
- Map (10 districts, nodes, gates, skies), bosses (entrance, ink meter, requeue, correction, final cumulative),
  polish (boxes/rungs), necklace (play all, loop, sleep, Media Session, verse sheet, qasida links), stickers, heroes,
  profiles, grown-ups gate + settings, about, finale → prayer → medal → certificate (print) → dedication, share card.
- SFX synth (§7.2), PWA (manifest, icons, SW), capture mode + `window.kq` / `window.__kq`.

- Integrated: text/khaqaniya.json (real text; silah ۥ ۦ kept on their words, Amiri renders them), design/copy.ar.json
  (841 keys, 0 missing), STYLE.md skies/lanterns/Amin colours, Tajawal 500/700/800 UI face (STYLE §9.1, OFL), Amiri
  Regular + Bold (full Arabic, OFL), Amin with his simple face (owner 2026-11-13: data/art.json "faceless": false, DECISIONS 1), dedication.from (signed,
  DECISIONS 2) shown when not empty, text/meanings.json (partial: verses without a meaning show meaning.empty, G5 falls back to G1).
- Fixed: G2 slice(-0) took every previous verse; double render when "next" was tapped twice; say()/play() reject on
  an aborted screen (no ghost runners on detached frames).

- Q1 (2026-11-13): suite green (see `QA.md`); fixed weak words on first learning, prayer stillness, help in radar/caravan,
  §6 sizes and harakat line-heights, certificate on phones, phone frame keeps the cast bar on screen, district opening line
  as a caption on its card, HUD necklace ticks on reward, a11y (main landmark, contrast), faces on (owner).

- Q1 round 2 (2026-11-13): R1's art wired in (data/art.json merged from art/manifest.json; prepare-data copies the used
  files into public/art, srcset @2x, pose map in src/art/index.ts, SVG fallback on error); LISTEN catch-the-word, intro
  tap-through, 4/5-card ordering fits phones, reward strand; child-view (Argon) and code/a11y (Luna) reviews applied
  (QA.md §6). Capture freeze at 10aa48b. Service worker: data cache per build, media cache per media-set hash
  (build.json `media`), required shell/data or the install fails, quota-safe puts, 416 ranges.

## Next
- Tests: games, district through UI, whole poem via API, token audit (200 seeds), text exactness, offline, phone/desktop.
- Align copy keys with design/copy.ar.json as D1b lands parts 2–4 (see copy-missing.txt after a build).
- STYLE.md (D1b) palette/art once written; Pages workflow.

## Known issues
- text/meanings.json partial (M1b in progress); the build warns per verse without meaning.
