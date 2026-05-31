FROM node:24-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
FROM node:24-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate \
 && npx tsx scripts/copy-uv.ts \
 && npm run build
FROM node:24-alpine AS runner
RUN apk add --no-cache libc6-compat
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts --omit=dev


COPY --from=builder /app/node_modules/@prisma/engines ./node_modules/@prisma/engines
COPY --from=builder /app/node_modules/.prisma         ./node_modules/.prisma

COPY --from=builder --chown=nextjs:nodejs /app/.next  ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

COPY --from=builder --chown=nextjs:nodejs /app/server.ts       ./server.ts
COPY --from=builder --chown=nextjs:nodejs /app/lib             ./lib
COPY --from=builder --chown=nextjs:nodejs /app/prisma          ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/tsconfig.json   ./tsconfig.json
COPY --from=builder --chown=nextjs:nodejs /app/next.config.ts  ./next.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/scripts/entrypoint.sh ./entrypoint.sh

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENTRYPOINT ["/bin/sh", "entrypoint.sh"]
