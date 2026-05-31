#!/bin/sh
set -e
echo "[portfolio] Running database migrations..."
node_modules/.bin/prisma migrate deploy
echo "[portfolio] Starting server..."
exec node_modules/.bin/tsx server.ts
