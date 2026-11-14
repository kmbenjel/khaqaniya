#!/usr/bin/env bash
# E2 (VM): build, serve the build on 127.0.0.1:$PORT for the stills driver, take the stills, stop that server (own pid).
#   game/scripts/e2-stills.sh [port=4395]
set -euo pipefail
cd "$(dirname "$0")/.."
PORT=${1:-4395}
npm run build > /tmp/e2-build.log 2>&1
node tests/serve.mjs "$PORT" > /tmp/e2-serve.log 2>&1 &
PID=$!
trap 'kill $PID 2>/dev/null || true' EXIT
for _ in $(seq 1 100); do curl -sf "http://127.0.0.1:$PORT/khaqaniya/" > /dev/null && break; sleep 0.2; done
node tests/engage2-stills.mjs "http://127.0.0.1:$PORT/khaqaniya/" test-shots/e2 "${SIZES:-390x844,360x740}"
