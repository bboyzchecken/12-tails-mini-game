# Game client (Phaser + Three, Vite). Build context = repo ROOT (needs shared/).
# Multi-stage: build the static bundle, then serve it with nginx.
# Run with:  docker compose build client   (or the whole stack)

# ---- build ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY client/package.json ./client/
COPY server/package.json ./server/
RUN npm ci

COPY tsconfig.base.json ./
COPY shared/ ./shared/
COPY client/ ./client/

# Vite inlines env at BUILD time (point at host-facing URLs of api/server).
ARG VITE_SERVER_URL
ARG VITE_API_URL
ENV VITE_SERVER_URL=$VITE_SERVER_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build -w @12tails/client

# ---- serve ----
FROM nginx:1.27-alpine
COPY client/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/client/dist /usr/share/nginx/html
EXPOSE 80
