# syntax=docker/dockerfile:1
#
# Build multi-stage untuk Next.js standalone output (lihat next.config.ts).
# Base image Debian slim (bukan alpine) karena argon2 (native binding)
# lebih konsisten dengan binary prebuilt glibc daripada musl.
#
# Build dari ROOT repo, bukan dari folder deploy/:
#   docker build -f deploy/Dockerfile -t beasiswaota:latest .
#
# Stage "builder" sengaja tetap bisa di-target langsung (--target builder)
# untuk menjalankan `npx prisma migrate deploy` — stage "runner" di bawah
# cuma berisi runtime tracing standalone Next.js, TIDAK membawa Prisma CLI
# penuh. Lihat deploy/docker-compose.prod.yml (service "migrate") dan
# deploy/README.md.

ARG NODE_VERSION=20-bookworm-slim

# ---------------------------------------------------------------------------
# Stage 1: dependencies (cache terpisah supaya rebuild kode tidak reinstall)
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

# ---------------------------------------------------------------------------
# Stage 2: builder — punya Prisma CLI penuh, dipakai untuk build DAN untuk
# menjalankan migrasi lewat service "migrate" di compose.
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Env dummy hanya supaya src/lib/env.ts (divalidasi saat import module,
# termasuk saat next build mengumpulkan data halaman) tidak gagal keras.
# Nilai SEBENARNYA datang dari .env / env compose saat container jalan.
ENV NODE_ENV=production \
    APP_URL=https://beasiswaota.uika-bogor.ac.id \
    DATABASE_URL=postgresql://build:build@localhost:5432/build \
    AUTH_SECRET=build-time-placeholder-secret-32-chars-min \
    MINIO_ENDPOINT=localhost \
    MINIO_PORT=9000 \
    MINIO_ROOT_USER=build \
    MINIO_ROOT_PASSWORD=build \
    MINIO_BUCKET=beasiswaota-berkas \
    MAIL_FROM=beasiswaota@uika-bogor.ac.id \
    CRON_SECRET=build-time-placeholder-secret-16

RUN npx prisma generate
RUN npm run build

# ---------------------------------------------------------------------------
# Stage 3: runner — hanya file yang benar-benar dipakai saat runtime,
# jalan sebagai user non-root. Ini image yang benar-benar disajikan Nginx.
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
