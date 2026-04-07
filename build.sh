#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# build.sh  –  GroceryRecipe production build / release export
#
# Creates a self-contained dist/ folder, a timestamped zip archive in
# release/, and optionally an Android APK via Capacitor.
#
# Usage:
#   ./build.sh            # web build only
#   ./build.sh --apk      # web build + Android debug APK
#
# Prerequisites for --apk:
#   • Node.js ≥ 18,  npm
#   • Java 17+
#   • Android SDK with ANDROID_HOME / ANDROID_SDK_ROOT set
#   • Capacitor packages installed (run: npm install)
# ─────────────────────────────────────────────────────────────────────────────
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
VERSION="$(date +%Y%m%d-%H%M%S)"
DIST="$SCRIPT_DIR/dist"
RELEASE_DIR="$SCRIPT_DIR/release"
BUILD_APK=false

# ── Parse flags ───────────────────────────────────────────
for arg in "$@"; do
  case "$arg" in
    --apk) BUILD_APK=true ;;
  esac
done

echo ""
echo "  📦  GroceryRecipe – Build"
echo "  ─────────────────────────"
echo "  Version : $VERSION"
echo "  APK     : $BUILD_APK"
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
# lucide.min.js no longer needed – icons are inline SVGs in app.js
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

# ── 5. Capacitor Android APK ─────────────────────────────
APK_PATH=""
if [ "$BUILD_APK" = true ]; then
  echo ""
  echo "  🤖  Building Android APK …"
  echo "  ──────────────────────────"

  # Auto-increment versionCode from file (persists across builds)
  VERSION_CODE_FILE="$SCRIPT_DIR/.version_code"
  if [ -f "$VERSION_CODE_FILE" ]; then
    CURRENT_CODE=$(cat "$VERSION_CODE_FILE")
  else
    CURRENT_CODE=0
  fi
  NEXT_CODE=$((CURRENT_CODE + 1))
  echo "$NEXT_CODE" > "$VERSION_CODE_FILE"
  export VERSION_CODE="$NEXT_CODE"
  export VERSION_NAME="1.0.$NEXT_CODE"
  echo "  📌  versionCode=$VERSION_CODE  versionName=$VERSION_NAME"

  # Sync web assets into the native project
  echo "  🔄  Syncing Capacitor …"
  npx cap sync android

  # Determine build type: release if key.properties exists, otherwise debug
  KEYSTORE_PROPS="$SCRIPT_DIR/android/key.properties"
  if [ -f "$KEYSTORE_PROPS" ]; then
    BUILD_TYPE="release"
    echo "  🔐  Signing config found – building RELEASE APK …"
    echo "  🔨  Gradle assembleRelease …"
    cd "$SCRIPT_DIR/android"
    ./gradlew assembleRelease --no-daemon
    APK_SRC="$SCRIPT_DIR/android/app/build/outputs/apk/release/app-release.apk"
  else
    BUILD_TYPE="debug"
    echo "  ⚠️   No key.properties found – building DEBUG APK."
    echo "       To enable release builds, create android/key.properties"
    echo "       (see SIGNING.md for instructions)."
    echo "  🔨  Gradle assembleDebug …"
    cd "$SCRIPT_DIR/android"
    ./gradlew assembleDebug --no-daemon
    APK_SRC="$SCRIPT_DIR/android/app/build/outputs/apk/debug/app-debug.apk"
  fi

  # Locate the APK
  if [ -f "$APK_SRC" ]; then
    APK_PATH="$RELEASE_DIR/GroceryRecipe-$VERSION.apk"
    cp "$APK_SRC" "$APK_PATH"
    echo "  ✅  APK ($BUILD_TYPE) copied → $(basename "$APK_PATH")"
  else
    echo "  ⚠️   APK not found at expected path."
    echo "       Check android/app/build/outputs/apk/ for output."
  fi
  cd "$SCRIPT_DIR"
fi

# ── 6. Summary ────────────────────────────────────────────
echo ""
echo "  ✅  Build complete!"
echo ""
echo "  Output   → $DIST/"
echo "  Archive  → $ARCHIVE"
if [ -n "$APK_PATH" ]; then
  echo "  APK      → $APK_PATH"
fi
echo ""
echo "  ──  Deploy options  ──────────────────────────────────"
echo "  GitHub Pages  :  push dist/ contents to the gh-pages branch"
echo "  Netlify       :  drag-and-drop the dist/ folder at app.netlify.com"
echo "  Vercel        :  run  vercel dist/  from this directory"
echo "  Any static    :  upload all files in dist/ to your web server"
if [ "$BUILD_APK" = true ]; then
  echo "  Android       :  install the APK from release/ on your device"
fi
echo "  ─────────────────────────────────────────────────────"
echo ""
