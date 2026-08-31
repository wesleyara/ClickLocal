# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS builder
WORKDIR /app

# Prisma's query engine needs OpenSSL at both generate-time and runtime.
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm install

COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8880
ENV DATABASE_URL="file:/app/data/clicklocal.db"

# node_modules is copied whole (not pruned to production-only) so the
# Prisma CLI stays available for `prisma migrate deploy` at container start.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

EXPOSE 8880
VOLUME ["/app/data"]

CMD ["sh", "-c", "npx prisma migrate deploy && node .output/server/index.mjs"]
