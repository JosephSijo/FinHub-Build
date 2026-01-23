#!/usr/bin/env bash
# fix-npm.sh — Clean install, audit fix, and safe updates for Node projects
# Usage: bash fix-npm.sh

set -euo pipefail

# --- Styling helpers ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

say() { echo -e "${BLUE}›${NC} $*"; }
ok() { echo -e "${GREEN}✔${NC} $*"; }
warn() { echo -e "${YELLOW}!${NC} $*"; }
err() { echo -e "${RED}✖${NC} $*"; }

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    err "Required command '$1' is not installed or not in PATH."
    exit 1
  fi
}

# --- Pre-flight checks ---
require_cmd node
require_cmd npm

say "Node: $(node -v)  |  npm: $(npm -v)"

if [ ! -f package.json ]; then
  err "No package.json found in the current directory. Please run this from your project root."
  exit 1
fi

# Warn if working tree is dirty (git projects)
if command -v git >/dev/null 2>&1 && git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  if [ -n "$(git status --porcelain)" ]; then
    warn "Uncommitted changes detected. It's recommended to commit or stash before proceeding."
  fi
fi

TS=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR=".fix-npm-backup-$TS"
mkdir -p "$BACKUP_DIR"

say "Backing up package.json and package-lock.json (if present) to $BACKUP_DIR/"
cp package.json "$BACKUP_DIR/" 2>/dev/null || true
cp package-lock.json "$BACKUP_DIR/" 2>/dev/null || true
ok "Backups created."

# --- Clean install ---
say "Removing node_modules/ and package-lock.json to ensure a clean slate"
rm -rf node_modules package-lock.json
ok "Removed previous install artifacts."

say "Cleaning npm cache (this uses --force as required by npm for cache clean)"
npm cache clean --force
ok "npm cache cleaned."

# Try standard install first; fall back to legacy peer deps if needed
say "Installing dependencies (no --force)"
if npm install; then
  ok "Dependencies installed successfully."
else
  warn "npm install failed. Retrying with --legacy-peer-deps to resolve peer conflicts."
  npm install --legacy-peer-deps
  ok "Dependencies installed with --legacy-peer-deps."
fi

# --- Security fixes ---
say "Running npm audit fix"
npm audit fix || warn "npm audit fix could not fix everything automatically."

# --- Conditional updates ---
HAS_CAPACITOR="false"
if grep -q '"@capacitor/cli"' package.json || grep -q '"@capacitor/core"' package.json; then
  HAS_CAPACITOR="true"
fi

if [ "$HAS_CAPACITOR" = "true" ]; then
  say "Updating Capacitor packages to latest major versions (@capacitor/cli & @capacitor/core)"
  npm install @capacitor/cli@latest @capacitor/core@latest
  if npx --no-install cap --version >/dev/null 2>&1; then
    say "Running npx cap update to sync native platforms"
    npx cap update || warn "npx cap update had issues. Please open Xcode/Android Studio and resync manually."
  else
    warn "Capacitor CLI not found via npx. Skipping platform sync."
  fi
  ok "Capacitor update step completed."
fi

# Update tar to latest if it appears anywhere in the dependency tree of package.json
if grep -q '"tar"' package.json; then
  say "Ensuring tar is updated to latest secure version"
  npm install tar@latest || warn "Failed to update tar directly; it might be a transitive dependency."
else
  # Even if not direct dep, try to ensure the tree hoists a safe tar version
  say "Attempting to hoist a secure tar version (even if transitive)"
  npm install tar@latest || true
fi
ok "tar update step completed."

# --- General updates ---
say "Checking for outdated packages"
npm outdated || true

say "Applying non-breaking updates where possible"
npm update || warn "npm update encountered issues. This is often fine, especially with strict peer dependencies."

# Re-run audit after updates
say "Re-running npm audit after updates"
npm audit || true

ok "All done! Suggested next steps:"
echo "  1) Run your test suite / start the app to verify everything still works."
echo "  2) Review any remaining audit advisories and address critical ones manually if needed."
echo "  3) If you updated Capacitor, open native projects and check build settings (Android/iOS)."
