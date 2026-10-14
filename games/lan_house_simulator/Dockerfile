FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm ci
COPY src ./src
RUN node node_modules/typescript/bin/tsc -p tsconfig.json
FROM node:22-bookworm-slim
ENV NODE_ENV=production
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY backend/*.mjs ./
COPY --from=build /app/dist/js/sim /app/dist/js/sim
COPY --from=build /app/dist/js/render/direction.js /app/dist/js/render/direction.js
COPY package.json /app/package.json
USER node
EXPOSE 8080
CMD ["node", "server.mjs"]
