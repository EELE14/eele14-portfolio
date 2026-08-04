#!/bin/sh
set -e

echo "[portfolio] Checking migration state..."

MIGRATION_STATE="$(node_modules/.bin/tsx scripts/db-needs-baseline.ts)"
if echo "$MIGRATION_STATE" | grep -qx baseline; then
  echo "[portfolio] Existing schema without migration history — baselining."
  node_modules/.bin/prisma migrate resolve --applied 0_init
fi

echo "[portfolio] Applying migrations..."
node_modules/.bin/prisma migrate deploy

if [ -n "$ADMIN_EMAIL" ] && [ -n "$ADMIN_PASSWORD" ]; then
  echo "[portfolio] Seeding admin user..."
  node_modules/.bin/tsx scripts/create-admin.ts
fi

echo "[portfolio] Starting server..."
exec node_modules/.bin/tsx server.ts
