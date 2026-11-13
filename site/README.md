# الخاقانية — the poem as a shatr site

The established, fully vocalised text of الخاقانية on its own page (kashida layout, PWA, SEO), with a meaning panel and a
recitation clip for every bayt, cross-linked with the game. Served at `<base>/qasida/`.

`site/` is a copy of the [shatr](https://github.com/kmbenjel/shatr) engine plus the changes in
`../docs/shatr-upstream.patch` (base path, own-cache service worker, per-bayt meaning + audio, link cards, credits).

## One source, nothing typed by hand

`../scripts/gen-site.mjs` writes everything under `content/` (all gitignored except `content/icons/` and `social-card.jpg`):

| from | to |
|---|---|
| `text/khaqaniya.json` | `content/poem.txt` (one shatr per line, `## ` section titles; bayt numbers run 1..N over the whole poem) |
| `text/meanings.json` | `content/bayts.json` (`kid` shown first, `words` = hard words, `adult` behind «المزيد») |
| `audio/timings.json` + the clips it names | `content/bayts.json` + `content/audio/NNN.<ext>` |
| `text/SOURCES.md` | credits: the lines between `<!-- site:credits -->` and `<!-- /site:credits -->` (a `- ` list) |
| `poem.config.json` + `hosting.json` | `content/poem.config.json` (adds `domain` and `basePath`) |

Until `text/khaqaniya.json` exists, the generator falls back to `fixtures/` (6 bayts of an unrelated public-domain poem, a
fake clip each) and writes `content/FIXTURE`; **never deploy a build that has that file**. `--fixtures` forces it.
Rerun the generator after any correction in `text/`, `audio/`: nothing else needs editing.

## Commands (run them on the VM: `scripts/vm.sh run 'cd site && …'`)

```sh
cd site && npm ci
npm run build       # gen-site + shatr build -> dist/      (base from hosting.json, or KQ_BASE=https://host/path)
npm test            # unit tests: validators, base path, sidecar, service-worker rules (node:test, no browser)
npm run e2e         # real Chrome (Playwright, needs google-chrome): base-path URLs, SW scope + cache isolation next to a
                    #   stub game SW, offline reload, kashida exactness, meanings toggles, audio, desktop 1280x800 +
                    #   phone 390x844; screenshots in test-shots/ (gitignored)
npm run icons       # re-render content/icons/* and content/social-card.jpg (Chrome)
npm run upstream-patch   # regenerate ../docs/shatr-upstream.patch from this engine copy
```

## Where it is hosted: the one switch

`hosting.json` → `{"base": "https://khaqaniya.benjelloun.dev"}` (override: env `KQ_BASE`). The site is built for
`<base>/qasida/` (domain = host of base, `basePath` = path of base + `/qasida/`; canonical, OG, sitemap, manifest, SW and
every asset URL follow). To host elsewhere (e.g. the project page `https://benjelloun.dev/khaqaniya`), change that one
line (or set `KQ_BASE` in CI) and rebuild. The link card to the game is
the relative `../`, so it needs no change.

## Final Pages build: game at `/`, this site at `/qasida/` in one artifact

The artifact root is the game's root (Pages serves it at `<base>/`); this site's `dist/` goes into its `qasida/` folder:

```yaml
- uses: actions/setup-node@v4
  with: { node-version: 24 }
- name: Poem site (generates its content from text/, audio/)
  working-directory: site
  env: { KQ_BASE: "https://khaqaniya.benjelloun.dev" }
  run: npm ci && npm test && npm run build && test ! -e content/FIXTURE
- name: Game
  run: …build the game into game/dist (its own command)…
- name: One artifact
  run: |
    mkdir -p _site/qasida
    cp -r game/dist/. _site/                 # game at /   (it also writes CNAME, robots.txt when a custom domain is used)
    cp -r site/dist/. _site/qasida/          # poem site at /qasida/ (no CNAME, no robots.txt of its own)
- uses: actions/upload-pages-artifact@v3
  with: { path: _site }
```

Rules the game side must keep (same origin, so same cache and service-worker space):

1. Game SW: use its own cache prefix (e.g. `kq-game-`), delete only caches with that prefix (this site uses `kq-qasida-`), and
   **never answer navigations under `/qasida/`** from its own shell/fallback. This site's worker has the longer scope
   `<base>/qasida/` and takes over its pages on the first visit after the worker is installed.
2. Root `robots.txt` should list `Sitemap: <base>/sitemap.xml` and `<base>/qasida/sitemap.xml` (this site writes no robots.txt/CNAME
   under a base path).
3. Deep links from the game: `<base>/qasida/#b12` opens the page at bayt 12 (bayt numbers = verse order in `text/khaqaniya.json`).

## What the engine copy adds (generic, in the upstream patch)

`basePath`; `cachePrefix` + an `activate` that deletes only its own caches and an audio cache that survives version bumps;
`content/bayts.json` (per-bayt meaning panel + audio button, global toggle, panels outside the kashida grid); `resources.links`
(link card), `credits`, `signature`, `continuousNumbering`, `content/icons/` overrides, `SHATR_CONTENT`/`SHATR_DIST`.
Audio is fetched whole on the first play and played from a blob (cached by the SW then, never precached), so the install
stays small and a clip already played works offline. Full description: `tools/upstream-docs.md` (becomes
`docs/base-path-and-bayts.md` upstream).

## Layout

`engine/ scripts/ schema/ fonts/` the engine copy · `content/icons`, `content/social-card.jpg` own brand (shatr's demo logo is
never shipped) · `poem.config.json` authored SEO text, labels, theme (`rawda`, green), credits skeleton · `fixtures/` ·
`e2e/` browser check · `test/` unit tests · `tools/` icon renderer, patch generator.
