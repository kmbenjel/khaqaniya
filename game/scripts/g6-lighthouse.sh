#!/usr/bin/env bash
# G6: Lighthouse (mobile) on the built game and the shatr site, on the VM (needs ~/kq/g6tools/node_modules/.bin/lighthouse
# in game/). Serves the build like GitHub Pages (gzip, scripts/g6-lhserve.mjs) on PORT while it runs. Writes
# lh/<tag>-<name>.json and prints the four scores.
#   scripts/g6-lighthouse.sh TAG [PORT]
set -euo pipefail
TAG=${1:-run}; PORT=${2:-4378}
LH=~/kq/g6tools/node_modules/.bin/lighthouse
B=http://127.0.0.1:$PORT/khaqaniya
mkdir -p lh
node scripts/g6-lhserve.mjs "$PORT" > /tmp/g6-lhserve.log 2>&1 &
SRV=$!
trap 'kill $SRV 2>/dev/null || true' EXIT
for _ in $(seq 50); do curl -sf "$B/" >/dev/null && break; sleep 0.2; done
run() {
  local name=$1 url=$2; shift 2
  $LH "$url" --quiet --chrome-flags="--headless=new --no-sandbox" --only-categories=performance,accessibility,best-practices,seo \
    --output=json --output-path="lh/$TAG-$name.json" "$@" >/dev/null 2>&1 || echo "lighthouse failed: $name"
  node -e '
    const r = require(process.argv[1]); const c = r.categories;
    const s = (k) => c[k] ? Math.round(c[k].score * 100) : "-";
    const fail = Object.values(r.audits).filter((a) => a.score !== null && a.score < 0.9 && a.scoreDisplayMode !== "informative" && a.scoreDisplayMode !== "manual" && a.scoreDisplayMode !== "notApplicable").map((a) => a.id + "=" + a.score);
    console.log(process.argv[2].padEnd(10), "perf", s("performance"), "a11y", s("accessibility"), "bp", s("best-practices"), "seo", s("seo"),
      "| LCP", Math.round(r.audits["largest-contentful-paint"].numericValue), "ms CLS", r.audits["cumulative-layout-shift"].numericValue.toFixed(3), "| below 0.9:", fail.join(" "));
  ' "$PWD/lh/$TAG-$name.json" "$name"
}
run game-splash "$B/"
run game-home "$B/?capture=1&profile=demo:12&recitation=0&voices=0&sfx=0#/"
run game-map "$B/?capture=1&profile=demo:12&recitation=0&voices=0&sfx=0#/map"
run game-verse "$B/?capture=1&profile=demo:3&recitation=0&voices=0&sfx=0&goto=verse:4"
run game-grown "$B/?capture=1&profile=demo:12&recitation=0&voices=0&sfx=0#/grownups"
run site "$B/qasida/"
