# syntax=docker/dockerfile:1
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY . .
RUN --mount=type=secret,id=proxy_ca \
    set -eu; \
    if [ -r /run/secrets/proxy_ca ]; then export NODE_EXTRA_CA_CERTS=/run/secrets/proxy_ca; fi; \
    npm ci --no-audit --no-fund; \
    node node_modules/typescript/bin/tsc -p tsconfig.json; \
    mkdir -p runtime/backend runtime/dist/js/render; \
    cp backend/package*.json backend/*.mjs runtime/backend/; \
    npm ci --prefix runtime/backend --omit=dev --no-audit --no-fund; \
    cp -R dist/js/sim runtime/dist/js/; \
    cp dist/js/render/direction.js runtime/dist/js/render/; \
    cp package.json donate-packages.mjs cookie-items.mjs runtime/

FROM node:22-bookworm-slim AS backend
ENV NODE_ENV=production
WORKDIR /app/backend
COPY --from=build --chown=node:node /app/runtime/ /app/
USER node
EXPOSE 8080
CMD ["node", "server.mjs"]
