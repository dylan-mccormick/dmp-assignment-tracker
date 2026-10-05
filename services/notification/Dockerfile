FROM ghcr.io/pnpm/pnpm:11 AS base
RUN pnpm runtime set node 26 -g
WORKDIR /app
COPY services/notification/pnpm-*.yaml ./
COPY services/notification/package*.json ./

# dev
FROM base AS dev
RUN pnpm install --config.confirm-modules-purge=false
COPY services/notification/ ./
CMD ["pnpm", "dev"]

# build
FROM base AS build
RUN pnpm install
COPY services/notification/ ./
RUN pnpm build

# prod
FROM base AS prod
RUN pnpm install --prod
COPY --from=build /app/dist ./dist
CMD ["node", "dist/index.js"]