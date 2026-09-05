FROM node:24-alpine AS base

# Install necessary build tools and pnpm
RUN apk add --no-cache libc6-compat git python3 make g++ && \
    corepack enable pnpm

WORKDIR /app

# ---- Dependencies Phase ----
FROM base AS dependencies

# Copy workspace configuration and lockfile
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
# Copy all package.json files to install dependencies correctly
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY apps/desktop/package.json ./apps/desktop/
COPY apps/docs/package.json ./apps/docs/
COPY packages/shared/package.json ./packages/shared/
COPY packages/bot-sdk/package.json ./packages/bot-sdk/

# Install ONLY production dependencies for the API and shared packages
RUN pnpm install --filter @strafe/api... --prod --frozen-lockfile

# ---- Build Phase ----
FROM base AS build

# Copy everything
COPY . .
# Install ALL dependencies (including dev) to build
RUN pnpm install --filter @strafe/api... --frozen-lockfile

# Build shared packages and API
RUN pnpm --filter @strafe/api run build

# ---- Production Phase ----
FROM node:24-alpine AS production

WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Install runtime dependencies (e.g. ffmpeg if needed for voice/media processing)
RUN apk add --no-cache ffmpeg

# Copy built artifacts and production node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=dependencies /app/packages/shared/node_modules ./packages/shared/node_modules

# Copy package.json for runtime scripts
COPY apps/api/package.json ./apps/api/
COPY apps/api/drizzle ./apps/api/drizzle

WORKDIR /app/apps/api

# Create non-root user
RUN addgroup --system --gid 1001 strafe && \
    adduser --system --uid 1001 strafe
USER strafe

EXPOSE 3000

CMD ["node", "dist/index.js"]
