# ─────────────────────────────────────────────────────────────────────────────
# ReviewPulse Backend — Multi-stage Dockerfile
# Stage 1: Install dependencies
# Stage 2: Production image (minimal, no devDeps, no source maps)
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: deps ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Install OS deps needed for Prisma binary (OpenSSL)
RUN apk add --no-cache openssl libc6-compat

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# ── Stage 2: production ───────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Runtime OS deps
RUN apk add --no-cache openssl libc6-compat dumb-init

# Non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 appuser

# Copy production node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY src/ ./src/
COPY package.json ./

# Copy production Prisma schema (PostgreSQL) over the dev schema (SQLite)
COPY prisma/ ./prisma/
COPY prisma/schema.prod.prisma ./prisma/schema.prisma

# Generate Prisma Client from the production (PostgreSQL) schema
RUN npx prisma generate

# Set ownership
RUN chown -R appuser:nodejs /app
USER appuser

# Environment
ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

# dumb-init handles PID 1 / signal forwarding correctly
# Migrations run before the server starts (idempotent, safe on restart)
CMD ["dumb-init", "sh", "-c", "npx prisma migrate deploy && node src/index.js"]
