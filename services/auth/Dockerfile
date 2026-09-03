FROM ghcr.io/pnpm/pnpm:11 AS base
RUN pnpm runtime set node 26 -g
WORKDIR /app
COPY pnpm-lock.yaml ./
COPY package*.json ./

# dev
FROM base AS dev
RUN pnpm install
COPY . .
CMD ["pnpm", "dev"]

# build
FROM base AS build
RUN pnpm install
COPY . .
RUN pnpm build

# prod
FROM base AS prod
RUN pnpm install --prod
COPY --from=build /app/dist ./dist
EXPOSE 50052
CMD ["node", "dist/index.js"]