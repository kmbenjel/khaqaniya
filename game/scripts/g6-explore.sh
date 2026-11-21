#!/usr/bin/env bash
# G6: serve the build on PORT and run tests/g6-explore.mjs into OUT (VM). Stops its server at the end.
#   scripts/g6-explore.sh OUT [PORT]
set -euo pipefail
OUT=${1:-test-shots/g6}; PORT=${2:-4378}
node tests/serve.mjs "$PORT" > /tmp/g6-serve.log 2>&1 &
SRV=$!
trap 'kill $SRV 2>/dev/null || true' EXIT
for _ in $(seq 50); do curl -sf "http://127.0.0.1:$PORT/khaqaniya/" >/dev/null && break; sleep 0.2; done
node tests/g6-explore.mjs "$PORT" "$OUT"
