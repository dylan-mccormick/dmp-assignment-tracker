# dev
FROM ghcr.io/pnpm/pnpm:11 AS dev
WORKDIR /app
COPY package*.json ./
COPY pnpm-lock.yaml ./
RUN pnpm runtime set node 26 -g
RUN pnpm install
EXPOSE 3000
CMD ["pnpm", "dev"]

# build
# Vite inlines VITE_* into the bundle at build time, so they must be passed as build args (--build-arg); the prod
# container's runtime environment can't change an already-built bundle
FROM ghcr.io/pnpm/pnpm:11 AS build
ARG VITE_API_BASE_URL
ARG VITE_GOOGLE_CLIENT_ID
WORKDIR /app
COPY package*.json ./
COPY pnpm-lock.yaml ./
RUN pnpm runtime set node 26 -g
RUN pnpm install
COPY . .
# fail the build rather than ship a bundle whose Google sign-in can't start
RUN test -n "$VITE_GOOGLE_CLIENT_ID" || (echo "VITE_GOOGLE_CLIENT_ID build arg is required" >&2 && exit 1)
RUN pnpm build

# serve
FROM nginx:alpine AS prod
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]