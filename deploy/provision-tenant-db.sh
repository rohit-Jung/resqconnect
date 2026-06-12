#!/usr/bin/env bash
# Provision a tenant database for a new silo.
# Usage: ./provision-tenant-db.sh <tenant-id> <db-name>
#
# This creates the database and runs migrations.
# Then you set the database_url on the org via the CP:
#   PUT /orgs/:id { "databaseUrl": "postgres://..." }
set -euo pipefail

TENANT_ID="${1:-}"
DB_NAME="${2:-resq_tenant_${TENANT_ID}}"

if [ -z "$TENANT_ID" ]; then
  echo "Usage: $0 <tenant-id> [db-name]"
  exit 1
fi

# Default connection (superuser) — override these env vars as needed.
PGHOST="${PGHOST:-localhost}"
PGPORT="${PGPORT:-5432}"
PGUSER="${PGUSER:-root}"
PGPASSWORD="${PGPASSWORD:-password}"
PGDATABASE="${PGDATABASE:-postgres}"

echo "==> Creating database: $DB_NAME"
PGPASSWORD="$PGPASSWORD" psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" \
  -c "CREATE DATABASE \"$DB_NAME\";"

echo "==> Running migrations on: $DB_NAME"
DATABASE_URL="postgres://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT}/${DB_NAME}" \
  cd ../apps/backend && bun run db:migrate

echo "==> Done. Database $DB_NAME is ready."
echo ""
echo "Next step: Set the database URL on the org:"
echo "  curl -X PUT /orgs/$TENANT_ID \\"
echo "    -H 'Authorization: Bearer <token>' \\"
echo "    -d '{\"databaseUrl\": \"postgres://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT}/${DB_NAME}\"}'"
