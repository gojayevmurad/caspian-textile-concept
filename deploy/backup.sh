#!/usr/bin/env bash
# Nightly PostgreSQL dump (keeps 14). Same pattern as the other projects on this host.
# Cron (deploy user): 10 3 * * * /srv/apps/caspian-textile/deploy/backup.sh >> /srv/apps/caspian-textile/backups/backup.log 2>&1
# Restore: docker exec -i caspian-textile-prod-db-1 pg_restore -U <user> -d <db> --clean < file.dump
# Media lives in /srv/apps/caspian-textile/media and can be regenerated from the originals with pnpm import:legacy.
set -euo pipefail
umask 077
deploy_dir="$(cd "$(dirname "$0")" && pwd)"
backup_dir=/srv/apps/caspian-textile/backups
project="$(sed -n 's/^COMPOSE_PROJECT_NAME=//p' "$deploy_dir/.env")"
db_user="$(sed -n 's/^POSTGRES_USER=//p' "$deploy_dir/.env")"
db_name="$(sed -n 's/^POSTGRES_DB=//p' "$deploy_dir/.env")"
file="$backup_dir/$project-$(date -u +%Y%m%d-%H%M).dump"
mkdir -p "$backup_dir"
if docker exec "$project-db-1" pg_dump -U "$db_user" -d "$db_name" -Fc > "$file.tmp" && [[ -s "$file.tmp" ]]; then
  mv "$file.tmp" "$file"
  echo "$(date -u +%FT%TZ) $project: $(du -h "$file" | cut -f1) dumped"
else
  rm -f "$file.tmp"
  echo "$(date -u +%FT%TZ) $project: dump FAILED" >&2
  exit 1
fi
ls -1t "$backup_dir"/*.dump | tail -n +15 | xargs -r rm -f
