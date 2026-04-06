#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# dev.sh  –  GroceryRecipe local development server
#
# Usage:
#   ./dev.sh          (default port 8080)
#   ./dev.sh 3000     (custom port)
# ─────────────────────────────────────────────────────────────────────────────
set -e

# Move to the project root (same directory as this script)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

PORT="${1:-8080}"

echo ""
echo "  🍽  GroceryRecipe – Dev Server"
echo "  ──────────────────────────────"

# ── Pick a server ─────────────────────────────────────────
if command -v python3 &>/dev/null; then
  echo "  ✅ Server : python3 -m http.server"
  SERVER="python3 -m http.server $PORT"
elif python -c 'import sys; exit(0 if sys.version_info[0]==3 else 1)' 2>/dev/null; then
  echo "  ✅ Server : python -m http.server"
  SERVER="python -m http.server $PORT"
elif command -v npx &>/dev/null; then
  echo "  ✅ Server : npx serve"
  SERVER="npx --yes serve -l $PORT ."
else
  echo ""
  echo "  ❌ No suitable HTTP server found."
  echo "     Please install Python 3  →  https://python.org"
  echo "     Or Node.js / npx          →  https://nodejs.org"
  echo ""
  exit 1
fi

URL="http://localhost:$PORT"
echo "  🌐 URL    : $URL"
echo "  📁 Root   : $SCRIPT_DIR"
echo "  ⌨️  Stop   : Ctrl+C"
echo ""

# ── Open browser after a short delay ──────────────────────
if command -v open &>/dev/null; then          # macOS
  (sleep 1 && open "$URL") &
elif command -v xdg-open &>/dev/null; then    # Linux (X11/Wayland)
  (sleep 1 && xdg-open "$URL") &
elif command -v start &>/dev/null; then       # Git Bash / Windows
  (sleep 1 && start "$URL") &
fi

# ── Start server ───────────────────────────────────────────
exec $SERVER
