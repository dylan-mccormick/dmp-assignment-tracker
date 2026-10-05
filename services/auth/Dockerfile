FROM ghcr.io/pnpm/pnpm:11 AS base
RUN pnpm runtime set node 26 -g
WORKDIR /app
COPY services/auth/pnpm-*.yaml ./
COPY services/auth/package*.json ./

# dev
FROM base AS dev
RUN pnpm install --config.confirm-modules-purge=false
COPY services/auth/ ./
CMD ["pnpm", "dev"]

# build
FROM base AS build
RUN pnpm install
COPY services/auth/ ./
RUN pnpm build

# prod
FROM base AS prod
RUN pnpm install --prod
COPY --from=build /app/dist ./dist
EXPOSE 50051
CMD ["node", "dist/index.js"]