#!/usr/bin/env bash
#
# Makes the real app the suite runs on too: react-admin's e-commerce demo, "Posters Galore" (examples/demo of
# github.com/marmelab/react-admin at the release RA_VERSION), on Material UI 7, with its own fake API in the browser
# (msw, fakerest and data-generator-retail): no backend. Its package.json is the release's; its lock is this pack's
# (.github/admin/package-lock.json), so every build installs the same packages. Built in a Node.js container (nothing
# runs on the machine), into admin/ beside .github/. It is the Material UI plugin's `--source` example too.
#
#   NODE_IMAGE   the image it runs in (default: Node.js 24 on Debian bookworm, slim, pinned by its digest)
#   RA_VERSION   the release of react-admin (default 5.15.7)
#   ADMIN_DIR    where the app goes (default: admin/, beside .github/)
#
# react-admin and its demo are released under the MIT licence by Marmelab; nothing of them is kept in this repository.

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
NODE_IMAGE="${NODE_IMAGE:-node:24-bookworm-slim@sha256:873f586f3794f52281bd039bf02c048a0be08fde619338f9941bad1eb6b34530}"
RA_VERSION="${RA_VERSION:-5.15.7}"
ADMIN_DIR="${ADMIN_DIR:-$ROOT/admin}"

if [ -e "$ADMIN_DIR" ]; then
  echo "$ADMIN_DIR is there already: remove it to make the app again." >&2
  exit 1
fi
work="$(mktemp -d "${TMPDIR:-/tmp}/material-ui-steps-admin.XXXXXX")"
trap 'rm -rf "$work"' EXIT

echo "Taking react-admin v${RA_VERSION}: its e-commerce demo."
git clone -q --depth 1 --branch "v${RA_VERSION}" --filter=blob:none --sparse https://github.com/marmelab/react-admin.git "$work/react-admin"
git -C "$work/react-admin" sparse-checkout set examples/demo
mkdir -p "$ADMIN_DIR"
cp -r "$work/react-admin/examples/demo/." "$ADMIN_DIR/"
cp "$work/react-admin/LICENSE.md" "$ADMIN_DIR/LICENSE.react-admin" 2> /dev/null || cp "$work/react-admin/LICENSE" "$ADMIN_DIR/LICENSE.react-admin"
[ -f "$ROOT/.github/admin/package-lock.json" ] && cp "$ROOT/.github/admin/package-lock.json" "$ADMIN_DIR/package-lock.json"

parent="$(dirname "$ADMIN_DIR")"
name="$(basename "$ADMIN_DIR")"
# The demo's own build script runs tsc first; the app is what is tested, so only Vite builds it.
docker run --rm -u "$(id -u):$(id -g)" -e HOME=/tmp -e npm_config_cache=/tmp/.npm -e npm_config_update_notifier=false \
  -e npm_config_fund=false -e npm_config_audit=false -v "$parent:/work" -w "/work/$name" "$NODE_IMAGE" bash -c "
    { if [ -f package-lock.json ]; then npm ci --legacy-peer-deps; else echo \"No .github/admin/package-lock.json: npm install writes one.\"; npm install --legacy-peer-deps; fi; } \
    && npx vite build \
    && node -e \"for (const p of ['react-admin', '@mui/material', 'react', 'vite']) console.log(p, require('./node_modules/' + p + '/package.json').version)\"
  " < /dev/null

echo "Built the app into $ADMIN_DIR/dist"
