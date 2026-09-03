FROM node:26-alpine AS base
WORKDIR /app
COPY package*.json ./

# dev
FROM base AS dev
RUN npm install
COPY . .
CMD ["npm", "run", "dev"]

# build
FROM base AS build
RUN npm install
COPY . .
RUN npm run build

# prod
FROM base AS prod
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist
CMD ["node", "dist/main.js"]