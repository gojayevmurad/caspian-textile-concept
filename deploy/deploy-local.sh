#!/usr/bin/env bash
# Same contract as deploy.sh (lock, health check, automatic restore, rollback target) for images
# built on the server itself, as the other projects on this host do:
#   docker build --target runtime -t caspian-textile:$(date -u +%Y%m%dT%H%M%SZ) ../source
#   bash deploy-local.sh caspian-textile:20261106T133527Z     |    bash deploy-local.sh --rollback
set -euo pipefail
cd "$(dirname "$0")"
image="${1:?Pass a timestamped local image tag or --rollback}"
valid_image() { [[ "$1" =~ ^caspian-textile:[0-9]{8}T[0-9]{6}Z$ ]]; }
if [[ "$image" != --rollback ]] && ! valid_image "$image"; then echo "Invalid image tag" >&2; exit 1; fi
exec 9>.deploy.lock
flock -n 9 || { echo "Deployment already running" >&2; exit 1; }
if [[ "$image" == --rollback ]]; then image="$(cat .previous-image)"; fi
valid_image "$image" || { echo "Invalid image tag" >&2; exit 1; }
docker image inspect "$image" >/dev/null || { echo "Image not built on this host" >&2; exit 1; }
[[ -f .env ]] || { echo "Provision this project first (.env missing)" >&2; exit 1; }
project="$(sed -n 's/^COMPOSE_PROJECT_NAME=//p' .env)"
[[ "$project" =~ ^[a-z][a-z0-9-]*$ ]] || { echo "Invalid project identity in .env" >&2; exit 1; }
previous=""
if [[ -f .validated-image ]]; then previous="$(cat .validated-image)"; valid_image "$previous" || { echo "Invalid saved image" >&2; exit 1; }; fi
unset COMPOSE_PROJECT_NAME POSTGRES_DB POSTGRES_USER POSTGRES_PASSWORD APP_ENV_FILE APP_PROXY_ALIAS MEDIA_PATH
export APP_IMAGE="$image"
compose=(docker compose --project-name "$project" --env-file .env -f compose.production.yaml)
"${compose[@]}" config --quiet
healthy=false
if "${compose[@]}" up -d --no-deps --wait --wait-timeout 120 app; then
 if "${compose[@]}" exec -T app node -e 'fetch("http://127.0.0.1:3000/api/health").then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))'; then healthy=true; fi
fi
if [[ "$healthy" != true ]]; then
 echo "Health verification failed" >&2
 if [[ -n "$previous" ]]; then export APP_IMAGE="$previous"; "${compose[@]}" up -d --no-deps --wait --wait-timeout 120 app; echo "Previous validated image restored" >&2
 else echo "First deployment failed; no previous validated image exists" >&2; fi
 exit 1
fi
if [[ -n "$previous" && "$previous" != "$image" ]]; then printf '%s\n' "$previous" > .previous-image.tmp; mv .previous-image.tmp .previous-image; fi
printf '%s\n' "$image" > .validated-image.tmp
mv .validated-image.tmp .validated-image
echo "Deployment verified: $image"
