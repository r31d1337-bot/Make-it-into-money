#!/usr/bin/env bash
# Daily SQLite backup for mintr.
#
# Uses sqlite3 .backup which is atomic and works on a live db (online backup
# API — won't tear if the app is writing). Compresses with gzip, keeps the
# last KEEP_DAYS files, and prunes anything older.
#
# Optionally uploads each new snapshot to S3-compatible storage (DO Spaces,
# AWS S3, Backblaze) when BACKUP_REMOTE_URL is set.
#
# Install on the droplet:
#   sudo cp /opt/mintr/deploy/backup.sh /usr/local/bin/mintr-backup.sh
#   sudo chmod +x /usr/local/bin/mintr-backup.sh
#   sudo crontab -e
#     0 3 * * * /usr/local/bin/mintr-backup.sh >> /var/log/mintr/backup.log 2>&1
set -euo pipefail

DB_PATH="${DB_PATH:-/opt/mintr/.data/mintr.db}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/mintr}"
KEEP_DAYS="${KEEP_DAYS:-7}"
TS="$(date -u +%Y%m%d-%H%M%S)"
DEST_RAW="$BACKUP_DIR/mintr-$TS.db"
DEST="$DEST_RAW.gz"

mkdir -p "$BACKUP_DIR"

if [ ! -f "$DB_PATH" ]; then
  echo "[$(date -u +%FT%TZ)] ERROR: db not found at $DB_PATH" >&2
  exit 1
fi

echo "[$(date -u +%FT%TZ)] backing up $DB_PATH → $DEST"

# Online backup. .backup tolerates concurrent writes.
sqlite3 "$DB_PATH" ".backup '$DEST_RAW'"

# Sanity-check the backup is a valid SQLite db before compressing.
if ! sqlite3 "$DEST_RAW" "PRAGMA integrity_check;" | head -1 | grep -q "^ok$"; then
  echo "[$(date -u +%FT%TZ)] ERROR: integrity check failed for $DEST_RAW" >&2
  rm -f "$DEST_RAW"
  exit 1
fi

gzip "$DEST_RAW"

SIZE="$(du -h "$DEST" | cut -f1)"
echo "[$(date -u +%FT%TZ)] ✓ wrote $DEST ($SIZE)"

# Optional: upload to remote (DO Spaces / S3 / Backblaze via s3cmd or aws-cli).
# Set BACKUP_REMOTE_URL like: s3://mintr-backups/  (with appropriate creds).
if [ -n "${BACKUP_REMOTE_URL:-}" ]; then
  if command -v aws >/dev/null 2>&1; then
    aws s3 cp "$DEST" "$BACKUP_REMOTE_URL" --quiet \
      && echo "[$(date -u +%FT%TZ)] ✓ uploaded to $BACKUP_REMOTE_URL"
  elif command -v s3cmd >/dev/null 2>&1; then
    s3cmd put "$DEST" "$BACKUP_REMOTE_URL" --quiet \
      && echo "[$(date -u +%FT%TZ)] ✓ uploaded via s3cmd"
  else
    echo "[$(date -u +%FT%TZ)] WARN: BACKUP_REMOTE_URL set but no s3 client found"
  fi
fi

# Prune anything older than KEEP_DAYS.
PRUNED="$(find "$BACKUP_DIR" -name "mintr-*.db.gz" -type f -mtime +"$KEEP_DAYS" -print -delete | wc -l | tr -d ' ')"
if [ "$PRUNED" -gt 0 ]; then
  echo "[$(date -u +%FT%TZ)] pruned $PRUNED old backup(s)"
fi
