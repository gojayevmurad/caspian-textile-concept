#!/usr/bin/env bash
# Export the imported catalogue (no users/sessions/RFQs) for loading into production.
#   bash scripts/catalog-dump.sh > catalog.sql
# Restore on the server after migrations (review first):
#   docker compose --env-file .env -f compose.production.yaml exec -T db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" < catalog.sql
# Media: rsync -a storage/media/ deploy@host:/srv/saas/caspian-textile/deploy/media/ && ssh host 'chown -R 1001:1001 .../media'
set -euo pipefail
[ -f .env.local ] && set -a && . ./.env.local && set +a
docker compose --env-file .env.local exec -T db pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --data-only --no-owner \
  -t media -t category -t category_translation -t product -t product_translation -t product_category -t product_media -t redirect -t content_block
