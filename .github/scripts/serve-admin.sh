#!/usr/bin/env bash
#
# Serves the built react-admin demo (admin/dist) with Vite's own preview server, in a Node.js container, on
# 127.0.0.1:<port> (8504 by default). Its pages are routes of the app (#/orders, #/products …).
#
#   bash .github/scripts/serve-admin.sh [port]

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
NODE_IMAGE="${NODE_IMAGE:-node:24-bookworm-slim@sha256:873f586f3794f52281bd039bf02c048a0be08fde619338f9941bad1eb6b34530}"
ADMIN_DIR="${ADMIN_DIR:-$ROOT/admin}"
PORT="${1:-8504}"

exec docker run --rm --name "material-ui-steps-admin-${PORT}" -u "$(id -u):$(id -g)" -e HOME=/tmp \
  -p "127.0.0.1:${PORT}:4173" -v "$ADMIN_DIR:/app" -w /app "$NODE_IMAGE" npx vite preview --host 0.0.0.0 --port 4173 --strictPort < /dev/null
