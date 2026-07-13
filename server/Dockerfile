# Socket.IO relay. Build context = repo ROOT (needs the npm workspace: shared/).
# Run with:  docker compose build server   (or the whole stack)
FROM node:20-alpine
WORKDIR /app

# Workspace manifests first (layer cache). All three are needed so `npm ci`
# can validate the monorepo lockfile.
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY client/package.json ./client/
COPY server/package.json ./server/
RUN npm ci

# Sources needed to run the relay (tsx runs TS directly — no build step).
COPY tsconfig.base.json ./
COPY shared/ ./shared/
COPY server/ ./server/

ENV PORT=3001
EXPOSE 3001
CMD ["npm", "run", "start", "-w", "@12tails/server"]
