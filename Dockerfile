FROM node:22-alpine AS base

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.json drizzle.config.ts ./
COPY src ./src

RUN pnpm install --frozen-lockfile
RUN pnpm tsc

USER node

CMD ["node", "--trace-warnings", "dist/index.js"]
