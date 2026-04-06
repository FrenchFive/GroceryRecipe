#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# build.sh  –  GroceryRecipe production build / release export
#
# Creates a self-contained dist/ folder and a timestamped zip archive in
# release/ that can be uploaded to any static host (GitHub Pages, Netlify,
# Vercel, AWS S3, etc.).
#
# Usage:
#   ./build.sh
# ─────────────────────────────────────────────────────────────────────────────
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
VERSION="$(date +%Y%m%d-%H%M%S)"
DIST="$SCRIPT_DIR/dist"
RELEASE_DIR="$SCRIPT_DIR/release"

echo ""
echo "  📦  GroceryRecipe – Build"
echo "  ─────────────────────────"
echo "  Version : $VERSION"
echo ""

# ── 1. Clean & create dist/ ───────────────────────────────
echo "  🧹  Cleaning dist/ ..."
rm -rf "$DIST"
mkdir -p "$DIST/css" "$DIST/js" "$DIST/icons"

# ── 2. Copy app files ─────────────────────────────────────
echo "  📋  Copying app files ..."
cp "$SCRIPT_DIR/index.html"    "$DIST/"
cp "$SCRIPT_DIR/manifest.json" "$DIST/"
cp "$SCRIPT_DIR/css/style.css" "$DIST/css/"
cp "$SCRIPT_DIR/js/db.js"      "$DIST/js/"
cp "$SCRIPT_DIR/js/app.js"     "$DIST/js/"
cp "$SCRIPT_DIR/icons/"*.png   "$DIST/icons/"

# ── 3. Write service worker with versioned cache name ─────
echo "  🔧  Stamping service worker cache: grocery-recipe-$VERSION ..."
sed "s/grocery-recipe-[^']*/grocery-recipe-$VERSION/" \
  "$SCRIPT_DIR/sw.js" > "$DIST/sw.js"

# ── 4. Create release archive ─────────────────────────────
mkdir -p "$RELEASE_DIR"

if command -v zip &>/dev/null; then
  ARCHIVE="$RELEASE_DIR/GroceryRecipe-$VERSION.zip"
  echo "  🗜   Creating zip: $(basename "$ARCHIVE") ..."
  (cd "$DIST" && zip -r "$ARCHIVE" . -x "*.DS_Store")
elif command -v tar &>/dev/null; then
  ARCHIVE="$RELEASE_DIR/GroceryRecipe-$VERSION.tar.gz"
  echo "  🗜   Creating tarball: $(basename "$ARCHIVE") ..."
  tar -czf "$ARCHIVE" -C "$DIST" .
else
  echo "  ⚠️   zip / tar not found – skipping archive creation."
  ARCHIVE="$DIST (no archive)"
fi

# ── 5. Summary ────────────────────────────────────────────
echo ""
echo "  ✅  Build complete!"
echo ""
echo "  Output   → $DIST/"
echo "  Archive  → $ARCHIVE"
echo ""
echo "  ──  Deploy options  ──────────────────────────────────"
echo "  GitHub Pages  :  push dist/ contents to the gh-pages branch"
echo "  Netlify       :  drag-and-drop the dist/ folder at app.netlify.com"
echo "  Vercel        :  run  vercel dist/  from this directory"
echo "  Any static    :  upload all files in dist/ to your web server"
echo "  ─────────────────────────────────────────────────────"
echo ""
