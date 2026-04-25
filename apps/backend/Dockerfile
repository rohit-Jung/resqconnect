FROM oven/bun:1.3.1 AS base

WORKDIR /app

# Copy workspace manifests first for better layer caching.
COPY package.json bun.lock turbo.json ./
COPY apps/backend/package.json ./apps/backend/package.json
COPY packages/db/package.json ./packages/db/package.json
COPY packages/config/package.json ./packages/config/package.json
COPY packages/utils/package.json ./packages/utils/package.json
COPY packages/types/package.json ./packages/types/package.json
COPY packages/typescript-config/package.json ./packages/typescript-config/package.json
COPY packages/eslint-config/package.json ./packages/eslint-config/package.json
COPY packages/ui/package.json ./packages/ui/package.json

# Install from the monorepo workspace (do not rely on registry for @repo/*).
# If the lockfile is out of sync for this build context, fall back to non-frozen.
RUN bun install --frozen-lockfile || bun install

# Copy the rest of the repo (monorepo build context).
COPY . .

WORKDIR /app/apps/backend

EXPOSE 3000

CMD ["bun", "--watch", "./src/index.ts"]
