#!/usr/bin/env bash
#
# Assembles the demo of this pack in a folder, the way Material UI's templates page says to: its own Vite starter
# (examples/material-ui-vite-ts) with its free templates copied in (docs/data/material/getting-started/templates), and
# a page of its documentation's demos (docs/data/material/components/<component>/<Demo>.tsx), all from the release
# MUI_VERSION of github.com/mui/material-ui, fetched here; then this folder's own glue over it (the entry that picks a
# page by its path, the components page, index.html, package.json and its lock). It needs bash, git and a network; it
# installs and builds nothing (npm ci and vite build come after it).
#
#   bash demo-src/assemble.sh <the folder to make>      MUI_VERSION=9.6.0 by default
#
# The Workspace's Material UI plugin makes its demo the same way, from this pack's npm release.

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MUI_VERSION="${MUI_VERSION:-9.6.0}"
TARGET="${1:?the folder to make}"

# The documentation demos the components page uses, by <component>/<Demo>, with the files they import.
DOCS_DEMOS="tabs/BasicTabs tooltips/BasicTooltip autocomplete/ComboBox autocomplete/top100Films alert/ActionAlerts
  alert/TransitionAlerts snackbars/SimpleSnackbar drawers/TemporaryDrawer pagination/PaginationControlled
  breadcrumbs/ActiveLastBreadcrumb progress/DelayingAppearance progress/LinearWithValueLabel badges/SimpleBadge
  chips/DeletableChips dialogs/AlertDialog menus/BasicMenu selects/BasicSelect accordion/AccordionUsage
  steppers/HorizontalLinearStepper"

if [ -e "$TARGET" ] && [ -n "$(ls -A "$TARGET" 2> /dev/null)" ]; then
  echo "$TARGET is there already and not empty: remove it to make the demo again." >&2
  exit 1
fi
work="$(mktemp -d "${TMPDIR:-/tmp}/material-ui-steps-demo.XXXXXX")"
trap 'rm -rf "$work"' EXIT

echo "Taking Material UI v${MUI_VERSION}: its Vite starter, its templates and its documentation demos."
src="$work/material-ui"
git clone -q --depth 1 --branch "v${MUI_VERSION}" --filter=blob:none --sparse https://github.com/mui/material-ui.git "$src"
dirs="examples/material-ui-vite-ts docs/data/material/getting-started/templates"
for d in $DOCS_DEMOS; do dirs="$dirs docs/data/material/components/${d%%/*}"; done
# shellcheck disable=SC2086
git -C "$src" sparse-checkout set $dirs

mkdir -p "$TARGET"
cp -r "$src/examples/material-ui-vite-ts/." "$TARGET/"
rm -f "$TARGET/package.json" "$TARGET/src/main.tsx" "$TARGET/index.html"
# The templates in TypeScript, with the few files they have only in JavaScript.
templates="$src/docs/data/material/getting-started/templates"
mkdir -p "$TARGET/src/templates"
( cd "$templates" && find . -type f \( -name '*.tsx' -o -name '*.ts' -o -name '*.js' \) ) | while read -r f; do
  case "$f" in
    *.js) { [ -e "$templates/${f%.js}.ts" ] || [ -e "$templates/${f%.js}.tsx" ]; } && continue ;;
  esac
  mkdir -p "$TARGET/src/templates/$(dirname "$f")"
  cp "$templates/$f" "$TARGET/src/templates/$f"
done
for d in $DOCS_DEMOS; do
  mkdir -p "$TARGET/src/docs-demos/${d%%/*}"
  f="$src/docs/data/material/components/$d"
  if [ -e "$f.tsx" ]; then cp "$f.tsx" "$TARGET/src/docs-demos/$d.tsx"; else cp "$f.ts" "$TARGET/src/docs-demos/$d.ts"; fi
done
cp "$src/LICENSE" "$TARGET/LICENSE.material-ui"
# This pack's glue over it.
cp "$HERE/index.html" "$HERE/package.json" "$TARGET/"
[ -f "$HERE/package-lock.json" ] && cp "$HERE/package-lock.json" "$TARGET/"
cp -r "$HERE/src/." "$TARGET/src/"
echo "Assembled the demo in $TARGET (Material UI v${MUI_VERSION})."
