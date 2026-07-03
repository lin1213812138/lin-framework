#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

ENV=${1:-production}
COMPOSE_FILE="$ROOT_DIR/docker/compose/docker-compose.$ENV.yml"

if [ ! -f "$COMPOSE_FILE" ]; then
  echo "Error: Compose file not found: $COMPOSE_FILE"
  echo "Usage: $0 [production|dev]"
  exit 1
fi

echo "=== Deploying LIN Framework ($ENV) ==="

# Load environment variables
if [ -f "$ROOT_DIR/.env" ]; then
  export $(grep -v '^#' "$ROOT_DIR/.env" | xargs)
fi

# Build and start services
docker compose -f "$ROOT_DIR/docker-compose.yml" -f "$COMPOSE_FILE" up -d --build

echo "=== Deployment complete ==="
echo "Services:"
docker compose -f "$ROOT_DIR/docker-compose.yml" -f "$COMPOSE_FILE" ps
