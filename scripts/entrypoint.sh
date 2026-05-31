#!/bin/sh
set -e
echo "[portfolio] Syncing database schema..."
node_modules/.bin/prisma db push
echo "[portfolio] Starting server..."
exec node_modules/.bin/tsx server.ts
