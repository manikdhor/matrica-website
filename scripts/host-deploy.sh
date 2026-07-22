#!/bin/bash
# Host-side build + deploy for cPanel (Passenger + Next.js standalone).
#
# Pulls the latest master, builds ON THE HOST, syncs the standalone bundle
# into the Node app root, and reloads Passenger. Safe to run from cron every
# few minutes: with --auto it exits early when master hasn't changed, and a
# lock prevents overlapping runs.
#
# One-time setup (see DEPLOY.md "Host-side deploy"):
#   - repo cloned to ~/matrica-src (this script clones it if missing)
#   - ~/matrica-src/.env holds DATABASE_URL + DIRECT_URL for the BUILD
#   - cPanel Node app env vars hold the same for RUNTIME
set -euo pipefail

REPO_SSH="git@github.com:manikdhor/matrica_final.git"
SRC="$HOME/matrica-src"
APP="$HOME/public_html/standalone"
VENV="$HOME/nodevenv/public_html/standalone/22/bin/activate"
LOCK="$HOME/.matrica-deploy.lock"

# Prevent overlapping cron runs.
exec 9>"$LOCK"
flock -n 9 || { echo "$(date) deploy already running — skip"; exit 0; }

# Clone on first run.
if [ ! -d "$SRC/.git" ]; then
  echo "$(date) cloning repo"
  git clone "$REPO_SSH" "$SRC"
fi

cd "$SRC"
git fetch -q origin master
LOCAL="$(git rev-parse HEAD)"
REMOTE="$(git rev-parse origin/master)"

if [ "${1:-}" = "--auto" ] && [ "$LOCAL" = "$REMOTE" ]; then
  exit 0   # nothing new; quiet exit for cron
fi

echo "$(date) deploying $REMOTE"
git reset --hard origin/master   # .env is gitignored, so it survives

# Activate the cPanel Node virtualenv (puts node/npm on PATH).
# cPanel's activate script references unbound vars (CL_VIRTUAL_ENV), so relax
# `set -u` just around the source, then restore it.
set +u
# shellcheck disable=SC1090
source "$VENV"
set -u
cd "$SRC"   # cPanel's activate script chdirs into the venv; return to the source

# Use the REAL npm, not the cPanel venv wrapper: the wrapper special-cases
# `install` to target the app-root package.json (which doesn't exist here) and
# fails with ENOENT. $CL_NODEHOME/usr/bin/npm is the actual alt-nodejs npm.
NPM="${CL_NODEHOME:-}/usr/bin/npm"
[ -x "$NPM" ] || NPM=npm

# `npm install` (not `npm ci`): package-lock.json lags package.json (the repo's
# canonical lock is bun.lock), so ci's strict sync check fails.
"$NPM" install --no-audit --no-fund
./node_modules/.bin/prisma generate   # build needs the generated client

# Build with webpack, not Turbopack (Turbopack's native worker SIGABRTs here),
# and pin CPUs with taskset + RAYON_NUM_THREADS=1. The box reports 32 cores but
# CloudLinux LVE caps processes/threads; unpinned, Next spawns 32 build workers
# and the Rust CSS thread pool dies with EAGAIN. 2 CPUs stays under the cap.
RAYON_NUM_THREADS=1 taskset -c 0-1 ./node_modules/.bin/next build --webpack
node scripts/copy-standalone.mjs      # static + public + prisma/@img into standalone

# Ship the self-contained standalone bundle into the Passenger app root.
# --delete keeps it clean; excludes protect runtime-only paths.
rsync -a --delete \
  --exclude='tmp/' --exclude='.env' --exclude='upload/' --exclude='.htaccess' \
  "$SRC/.next/standalone/" "$APP/"

# Reload Passenger.
mkdir -p "$APP/tmp"
touch "$APP/tmp/restart.txt"
echo "$(date) done: $REMOTE"
