#!/usr/bin/env bash
#
# Makes the demo the suite runs on: demo-src/assemble.sh assembles it from Material UI's own release (its Vite starter,
# its free templates and its documentation demos, with this pack's glue over them), then it is installed from its lock
# and built, in a Node.js container (nothing runs on the machine), into demo/ beside .github/.
#
#   NODE_IMAGE    the image it runs in (default: Node.js 24 on Debian bookworm, slim, pinned by its digest)
#   MUI_VERSION   the release of Material UI the starter, templates and demos are taken from (default 9.6.0)
#   DEMO_DIR      where the app goes (default: demo/, beside .github/)
#
# Material UI's code is released under the MIT licence by Call-Em-All and the MUI contributors; nothing of it is kept
# in this repository or in the package.

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
NODE_IMAGE="${NODE_IMAGE:-node:24-bookworm-slim@sha256:873f586f3794f52281bd039bf02c048a0be08fde619338f9941bad1eb6b34530}"
DEMO_DIR="${DEMO_DIR:-$ROOT/demo}"

bash "$ROOT/demo-src/assemble.sh" "$DEMO_DIR"

parent="$(dirname "$DEMO_DIR")"
name="$(basename "$DEMO_DIR")"
docker run --rm -u "$(id -u):$(id -g)" -e HOME=/tmp -e npm_config_cache=/tmp/.npm -e npm_config_update_notifier=false \
  -e npm_config_fund=false -e npm_config_audit=false -v "$parent:/work" -w "/work/$name" "$NODE_IMAGE" bash -c "
    npm ci && npx vite build \
    && node -e \"for (const p of ['@mui/material', '@mui/x-data-grid', 'react', 'vite']) console.log(p, require('./node_modules/' + p + '/package.json').version)\"
  " < /dev/null

echo "Built the demo into $DEMO_DIR/dist"
