#!/usr/bin/env bash
# Deploy a new silo.
# Deploy a new silo.
#
# Requires shared infrastructure (Redis + Kafka) running
# on the default hostnames (redis:6379, kafka:29092) or
# override via SHARED_REDIS_HOST / SHARED_KAFKA_BROKERS.
#
# Usage:
#   ./deploy-silo.sh <name> <sector> <port> [tenant-id]
#
# Examples:
#   ./deploy-silo.sh city-fire fire 7401
#   ./deploy-silo.sh hospital-east hospital 7402 <tenant-uuid>
#
# The docker-compose.stack.yml includes shared Redis + Kafka:
#   docker compose -f deploy/docker-compose.stack.yml up -d redis kafka
set -euo pipefail

NAME="${1:-}"
SECTOR="${2:-}"
PORT="${3:-}"
TENANT_ID="${4:-}"

if [ -z "$NAME" ] || [ -z "$SECTOR" ] || [ -z "$PORT" ]; then
  echo "Usage: $0 <name> <sector> <port> [tenant-id]"
  echo "  name    — short identifier (e.g. city-fire)"
  echo "  sector  — fire | hospital | police"
  echo "  port    — host port (e.g. 7401)"
  echo "  tenant-id — optional CP tenant UUID"
  exit 1
fi

if [[ ! "$SECTOR" =~ ^(fire|hospital|police)$ ]]; then
  echo "Error: sector must be fire, hospital, or police"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Create silo.env from example if needed
ENV_FILE="${SCRIPT_DIR}/${NAME}/silo.env"
if [ ! -f "$ENV_FILE" ]; then
  mkdir -p "$(dirname "$ENV_FILE")"
  cp "${SCRIPT_DIR}/hospital/silo.env" "$ENV_FILE" 2>/dev/null || touch "$ENV_FILE"
  echo "Created $ENV_FILE — edit it with your secrets."
fi

export SILO_NAME="$NAME"
export SILO_SECTOR="$SECTOR"
export SILO_PORT="$PORT"
export TENANT_ID="$TENANT_ID"

echo "==> Deploying silo: $NAME ($SECTOR) on port $PORT"
echo "    Redis: ${SHARED_REDIS_HOST:-redis}:${SHARED_REDIS_PORT:-6379}"
echo "    Kafka: ${SHARED_KAFKA_BROKERS:-kafka:29092}"

docker compose -f "${SCRIPT_DIR}/templates/silo.yml" up -d --build

echo ""
echo "==> Silo deployed!"
echo "    URL:     http://localhost:$PORT"
echo "    Sector:  $SECTOR"
echo "    Tenant:  ${TENANT_ID:-not set}"
echo ""
echo "    Make sure shared Redis + Kafka are running:"
echo "    docker compose -f deploy/docker-compose.stack.yml up -d redis kafka"
