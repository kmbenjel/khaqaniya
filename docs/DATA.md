# Data contracts

Every product (game, shatr site, video, promos) reads these files. Change a contract here first.

## `text/khaqaniya.json` — the poem (owner: T1, checked by T2 + cross-model reviews)

```json
{
  "title": "الخاقانية",
  "fullTitle": "…",            // e.g. «القصيدة الخاقانية في القرّاء وحسن الأداء»
  "author": "…",               // fully vocalised
  "authorDeath": "325",        // hijri year
  "metre": "الطويل",
  "rhyme": "ر",               // rawiyy; the rhyme vowel is kasra («ـرِ»)
  "basis": "…",                // one line: Ghouthani's recitation as the base, checked against which editions
  "sections": [
    { "id": "s1", "title": "…", "from": 1, "to": 6, "theme": "short plain description for designers" }
  ],
  "verses": [
    {
      "n": 1,
      "section": "s1",
      "sadr": "…",               // first hemistich, full tashkeel, exactly as the reading text
      "ajz": "…",                // second hemistich
      "rhymeWord": "…",          // last word of the ajz, vocalised (used by «catch the rhyme»)
      "variants": [               // optional; the second riwaya is noted, never shown prominently
        { "where": "sadr|ajz", "main": "…", "alt": "…", "source": "…" }
      ],
      "notes": "…"               // optional, for editors (metre remarks, source disagreements)
    }
  ]
}
```

Rules: the `n` numbering follows Ghouthani's recitation order. No tatweel (kashida) in the source; layouts add it.
Normalise to NFC; use U+0670 for dagger alif where the editions have it; alif wasla written as ٱ only if the base
edition does (decide once, write the decision in `text/SOURCES.md`).

## `text/meanings.json` — meanings (owner: M1, checked by M2 + cross-model reviews)

```json
{
  "verses": [
    {
      "n": 1,
      "kid": "…",                // 1–2 short sentences an 8-year-old understands, vocalised where helpful
      "adult": "…",              // a fuller one-paragraph explanation faithful to the شروح
      "words": [ { "w": "…", "m": "…" } ],   // hard words with plain meanings
      "lesson": "…",             // the tajwid / adab point in one line (for the game's «فائدة»)
      "cite": [ "الداني، شرح قصيدة أبي مزاحم، ص …" ]
    }
  ]
}
```

## `audio/timings.json` — per-verse recitation clips (owner: G2)

```json
{
  "source": { "reciter": "يحيى الغوثاني", "url": "https://www.youtube.com/watch?v=…", "credit": "…" },
  "verses": [ { "n": 1, "start": 12.34, "end": 19.80, "sadrEnd": 15.9, "file": "audio/v/001.mp3" } ]
}
```

Clips are small mono mp3/opus (~48 kbps) so the game stays light offline.
