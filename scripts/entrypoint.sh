#!/bin/sh
set -e
echo "[portfolio] Syncing database schema..."
node_modules/.bin/prisma db push

if [ -n "$ADMIN_EMAIL" ] && [ -n "$ADMIN_PASSWORD" ]; then
  echo "[portfolio] Seeding admin user..."
  node_modules/.bin/tsx scripts/create-admin.ts
fi

echo "[portfolio] Starting server..."
exec node_modules/.bin/tsx server.ts
