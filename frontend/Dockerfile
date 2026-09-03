# build
FROM ghcr.io/pnpm/pnpm:11 AS build
ARG VITE_API_URL
WORKDIR /app
COPY package*.json ./
COPY pnpm-lock.yaml ./
RUN pnpm runtime set node 26 -g
RUN pnpm install
COPY . .
RUN pnpm build

# serve
FROM nginx:alpine AS prod
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build ./app/dist /usr/share/nginx/html
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]