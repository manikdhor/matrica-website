#!/usr/bin/env bash
# Nightly backup for Matrica: Postgres dump + uploaded media, retained locally.
# Supabase free tier has NO automated backups/PITR, and uploads live only on the
# cPanel disk — this script is the only recovery path. Schedule it via cron:
#   0 2 * * *  /home/<user>/matrica-src/scripts/backup.sh >> /home/<user>/backup.log 2>&1
#
# Requires: pg_dump (postgresql client), tar, gzip. DIRECT_URL from the app .env
# (the non-pooled 5432 connection — pg_dump does not work through pgbouncer).
set -euo pipefail

# --- config -----------------------------------------------------------------
APP_DIR="${APP_DIR:-$HOME/matrica-src}"          # where .env lives
UPLOAD_DIR="${UPLOAD_DIR:-$HOME/matrica-uploads}" # media store
BACKUP_DIR="${BACKUP_DIR:-$HOME/matrica-backups}"
RETAIN_DAYS="${RETAIN_DAYS:-14}"

# Load DIRECT_URL from .env if not already exported
if [ -z "${DIRECT_URL:-}" ] && [ -f "$APP_DIR/.env" ]; then
  DIRECT_URL="$(grep -E '^DIRECT_URL=' "$APP_DIR/.env" | head -n1 | cut -d= -f2- | tr -d '"')"
fi
if [ -z "${DIRECT_URL:-}" ]; then
  echo "ERROR: DIRECT_URL not set and not found in $APP_DIR/.env" >&2
  exit 1
fi

STAMP="$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

# --- database ---------------------------------------------------------------
DB_FILE="$BACKUP_DIR/db-$STAMP.sql.gz"
echo "[$(date)] dumping database -> $DB_FILE"
pg_dump "$DIRECT_URL" --no-owner --no-privileges | gzip -9 > "$DB_FILE"

# --- uploaded media ---------------------------------------------------------
if [ -d "$UPLOAD_DIR" ]; then
  MEDIA_FILE="$BACKUP_DIR/uploads-$STAMP.tar.gz"
  echo "[$(date)] archiving uploads -> $MEDIA_FILE"
  tar czf "$MEDIA_FILE" -C "$(dirname "$UPLOAD_DIR")" "$(basename "$UPLOAD_DIR")"
else
  echo "[$(date)] WARN: upload dir $UPLOAD_DIR not found, skipping media"
fi

# --- retention --------------------------------------------------------------
echo "[$(date)] pruning backups older than $RETAIN_DAYS days"
find "$BACKUP_DIR" -name 'db-*.sql.gz'      -mtime +"$RETAIN_DAYS" -delete
find "$BACKUP_DIR" -name 'uploads-*.tar.gz' -mtime +"$RETAIN_DAYS" -delete

echo "[$(date)] backup complete"
# NOTE: this keeps backups on the SAME host. For real safety, also pull them
# off-box periodically (rsync/scp to another machine, or download locally).
