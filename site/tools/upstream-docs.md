# Base path, per-bayt meanings and audio

Added to the engine by the Khaqaniya project (a poem site served under `https://host/<game>/qasida/`, next to a game that shares the origin).

## `basePath` — host the site under a sub-path

```json
{ "domain": "benjelloun.dev", "basePath": "/khaqaniya/qasida/" }
```

- Canonical, `og:*`, JSON-LD, sitemap, manifest (`id`, `start_url`, `scope`, icons), the inlined `@font-face`, the font preload, every asset link and the service-worker registration (`BASE + 'sw.js'`, scope `BASE`) use it. The worker file lives at `BASE`, so its default scope is `BASE`; no `Service-Worker-Allowed` header is needed.
- `dist/CNAME` and `dist/robots.txt` are not written when a base path is set: the root site owns them (list this site's `sitemap.xml` there).
- Env overrides for CI: `SHATR_DOMAIN`, `SHATR_BASE_PATH`. Default is `/`, which builds exactly as before.
- Serve `dist/` so that `BASE` maps to it (`<artifact>/khaqaniya/qasida/` = `dist/`).

## Service-worker isolation

Caches are named `<cachePrefix>-cache-<hash>` (`cachePrefix` defaults to the first label of `domain`, plus the base path). `activate` deletes **only** caches that start with the prefix, `fetch` ignores requests outside the worker's scope, and lookups use the worker's own cache. Two apps on one origin can therefore coexist.

## `content/bayts.json` — per-bayt meaning and audio (optional)

See `schema/bayts.schema.json`. `n` counts bayts over the whole poem. Each bayt with an entry is wrapped as

```html
<div class="bayt-item" id="b12">
  <div class="bayt">…two .verse…</div>           <!-- untouched: the kashida pass reads these by index -->
  <div class="bayt-tools"> audio button, meaning button </div>
  <aside class="sharh" hidden>kid meaning, hard words, <details>«المزيد»</details></aside>
</div>
```

- A global toggle button (`toggle-meanings`, remembered in `reader.prefs`) opens or closes every panel.
- Audio: `audio` is a path under `content/`, copied to `dist/` unchanged. The page fetches the whole clip on the first play and plays it from a blob; the worker stores it in `<prefix>-audio` (cache-on-play, never in the precache list, kept across versions). So the install stays light, a played clip works offline, and no Range handling is needed.
- Labels (`labels.play|stop|meaning|meanings|hardWords|more|credits`) are overridable.
- Deep links: `#b12` scrolls to and highlights the bayt.

## Smaller options

`signature` (`each|last|none`), `continuousNumbering`, `resources.links` (extra same-tab cards, icon `game|web`), `credits.items` (a credits block), `content/icons/*` (overrides the engine icons, so a poem site need not ship the demo logo), `SHATR_CONTENT` / `SHATR_DIST` (build from / into other folders; the tests use them).
