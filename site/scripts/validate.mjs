// Poem + config validation. Pure (no IO) so build.mjs and tests can reuse it.

const HARAKAT = /[ً-ْٰـ]/;            // tanwin, harakat, sukun, shadda, dagger-alif, tatweel
const ARABIC_LETTER = /[ء-ي]/;                  // hamza..ya
const LONG_VOWEL = /[اأإآويءى]/; // alif-family, waw, ya, hamza — often unvoweled

// Parse poem.txt → sections of bayts (shatr pairs). Lines: blank ignored,
// "# .." comments ignored, "## label" starts a new section, else a shatr.
export function parsePoem(text) {
    const errors = [];
    const lines = text.split(/\r?\n/);
    const sections = [];
    let cur = null;
    const startSection = (label) => { cur = { label: label || null, shatrs: [] }; sections.push(cur); };

    lines.forEach((raw, i) => {
        const ln = i + 1;
        const line = raw.trim();
        if (line === '' || /^#(?!#)/.test(line)) return;          // blank or `# comment`
        if (line.startsWith('##')) { startSection(line.replace(/^##\s*/, '').trim()); return; }
        if (!cur) startSection(null);                              // implicit first section
        cur.shatrs.push({ text: line, line: ln });
    });

    if (sections.length === 0) errors.push('poem.txt has no verses.');

    // pair shatrs into bayts; odd count = a dangling shatr (error)
    const out = sections.map((s, idx) => {
        const bayts = [];
        for (let k = 0; k + 1 < s.shatrs.length; k += 2) bayts.push([s.shatrs[k], s.shatrs[k + 1]]);
        if (s.shatrs.length % 2 !== 0) {
            const last = s.shatrs[s.shatrs.length - 1];
            errors.push(`Section ${idx + 1} has an odd number of shatrs — dangling line ${last.line}: "${last.text}". Every bayt needs two shatrs.`);
        }
        return { label: s.label, bayts };
    });

    return { sections: out, errors };
}

// Heuristic "is it fully voweled?" check — warnings only (correctness is the author's).
// Flags lines whose Arabic consonants largely lack harakat.
export function checkTashkeel(sections, sourceLines) {
    const warnings = [];
    for (const s of sections) {
        for (const bayt of s.bayts) {
            for (const sh of bayt) {
                const letters = (sh.text.match(new RegExp(ARABIC_LETTER, 'g')) || [])
                    .filter(ch => !LONG_VOWEL.test(ch)).length;
                const marks = (sh.text.match(new RegExp(HARAKAT, 'g')) || []).length;
                if (letters >= 3 && marks < letters * 0.4) {
                    warnings.push(`Line ${sh.line} looks under-voweled (${marks} marks / ${letters} consonants): "${sh.text}"`);
                }
            }
        }
    }
    return warnings;
}

const REQUIRED = ['title', 'author', 'domain', 'description'];

// "qasida", "/qasida", "/qasida/" → "/qasida/"; "", "/", undefined → "/".
export function normalizeBase(b) {
    const t = String(b == null ? '' : b).trim().replace(/^\/+|\/+$/g, '');
    return t ? '/' + t + '/' : '/';
}

// Optional sidecar content/bayts.json: per-bayt meaning and audio, keyed by the 1-based bayt number
// counted over the whole poem (the same order as poem.txt).
//   { "bayts": [ { "n": 1, "kid": "…", "words": [ { "w": "…", "m": "…" } ], "more": "…", "audio": "audio/001.mp3" } ] }
// fileExists(relPath) tells whether content/<relPath> exists. Pure otherwise.
export function parseBayts(raw, baytCount, fileExists = () => true) {
    const errors = [], warnings = [], byN = new Map();
    const list = raw && Array.isArray(raw.bayts) ? raw.bayts : null;
    if (!list) return { byN, errors: ['bayts.json needs a "bayts" array.'], warnings, hasMeaning: false, hasAudio: false };
    const str = (v) => typeof v === 'string' && v.trim() !== '';
    for (const e of list) {
        const n = e && e.n;
        if (!Number.isInteger(n) || n < 1 || n > baytCount) { errors.push(`bayts.json: n=${JSON.stringify(n)} is outside 1..${baytCount}.`); continue; }
        if (byN.has(n)) { errors.push(`bayts.json: bayt ${n} appears twice.`); continue; }
        const words = [];
        for (const x of (e.words || [])) {
            if (x && str(x.w) && str(x.m)) words.push({ w: x.w.trim(), m: x.m.trim() });
            else errors.push(`bayts.json: bayt ${n} has a words entry without both "w" and "m".`);
        }
        if (e.audio != null) {
            if (!str(e.audio) || /^\/|\.\./.test(e.audio)) errors.push(`bayts.json: bayt ${n} audio must be a relative path under content/.`);
            else if (!fileExists(e.audio)) errors.push(`bayts.json: bayt ${n} audio file content/${e.audio} is missing.`);
        }
        byN.set(n, { kid: str(e.kid) ? e.kid.trim() : '', more: str(e.more) ? e.more.trim() : '', words, audio: str(e.audio) ? e.audio : '' });
    }
    const hasMeaning = [...byN.values()].some(x => x.kid), hasAudio = [...byN.values()].some(x => x.audio);
    if (byN.size && byN.size < baytCount) warnings.push(`${baytCount - byN.size} of ${baytCount} bayts have no entry.`);
    return { byN, errors, warnings, hasMeaning, hasAudio };
}

export function validateConfig(cfg) {
    const errors = [];
    for (const k of REQUIRED) if (!cfg[k] || String(cfg[k]).trim() === '') errors.push(`config: "${k}" is required.`);
    if (cfg.domain && /^https?:\/\//.test(cfg.domain)) errors.push('config.domain must be a bare host (e.g. "poem.example.com"), not a URL.');
    if (cfg.basePath != null && (typeof cfg.basePath !== 'string' || /[?#\s]|\/\//.test(cfg.basePath))) errors.push('config.basePath must be a plain path like "/qasida/".');
    if (cfg.continuousNumbering != null && typeof cfg.continuousNumbering !== 'boolean') errors.push('config.continuousNumbering must be true or false.');
    if (cfg.signature != null && !['each', 'last', 'none'].includes(cfg.signature)) errors.push('config.signature must be "each", "last" or "none".');
    if (cfg.cachePrefix != null && !/^[a-z0-9][a-z0-9-]*$/i.test(cfg.cachePrefix)) errors.push('config.cachePrefix must be letters, digits and dashes.');
    for (const l of (cfg.resources && cfg.resources.links) || []) if (!l || !l.href || !l.label) errors.push('config.resources.links entries need "href" and "label".');
    for (const it of (cfg.credits && cfg.credits.items) || []) if (!it || !it.text) errors.push('config.credits.items entries need "text".');
    if (cfg.keywords && !Array.isArray(cfg.keywords)) errors.push('config.keywords must be an array of strings.');
    const isoish = /^\d{4}-\d{2}-\d{2}$/;
    for (const d of ['created', 'published']) {
        const v = cfg.dates && cfg.dates[d];
        if (v && !isoish.test(v)) errors.push(`config.dates.${d} must be YYYY-MM-DD.`);
    }
    return errors;
}
