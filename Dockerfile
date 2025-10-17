FROM node:22-alpine AS base

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.json drizzle.config.ts ./

RUN pnpm install --frozen-lockfile

COPY src ./src

USER node

CMD ["pnpm", "run", "start"]
