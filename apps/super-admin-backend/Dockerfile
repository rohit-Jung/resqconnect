FROM oven/bun:1.3.1 AS base

WORKDIR /app

COPY package.json bun.lock turbo.json ./
COPY apps/super-admin-backend/package.json ./apps/super-admin-backend/package.json
COPY packages/db/package.json ./packages/db/package.json
COPY packages/typescript-config/package.json ./packages/typescript-config/package.json
COPY packages/eslint-config/package.json ./packages/eslint-config/package.json
COPY packages/ui/package.json ./packages/ui/package.json

RUN bun install --frozen-lockfile || bun install

COPY . .

WORKDIR /app/apps/super-admin-backend

EXPOSE 4000

CMD ["bun", "--watch", "./src/index.ts"]
