# syntax=docker/dockerfile:1
FROM node:24-bookworm-slim AS node-runtime

# The pinned Playwright package installs only the headless browser used by prerender.
FROM node-runtime AS frontend-build
WORKDIR /app
ENV PLAYWRIGHT_BROWSERS_PATH=/opt/playwright
ENV NG_CLI_ANALYTICS=false
ENV CI=true
COPY . .
RUN --mount=type=secret,id=proxy_ca \
    set -eu; \
    if [ -r /run/secrets/proxy_ca ]; then \
      export NODE_EXTRA_CA_CERTS=/run/secrets/proxy_ca; \
      : > /tmp/lhs-build-ca.pem; \
      if [ -r /etc/ssl/certs/ca-certificates.crt ]; then cat /etc/ssl/certs/ca-certificates.crt >> /tmp/lhs-build-ca.pem; fi; \
      cat /run/secrets/proxy_ca >> /tmp/lhs-build-ca.pem; \
      printf '%s' 'Acquire::https::CaInfo "/tmp/lhs-build-ca.pem";' > /tmp/lhs-apt.conf; \
      export APT_CONFIG=/tmp/lhs-apt.conf; \
    fi; \
    npm ci --no-audit --no-fund; \
    npm ci --prefix frontend-angular --no-audit --no-fund; \
    npx playwright install --with-deps --only-shell chromium; \
    npm run build:site; \
    npm run check:site; \
    rm -f /tmp/lhs-build-ca.pem /tmp/lhs-apt.conf; \
    rm -rf /var/lib/apt/lists/*

FROM node-runtime AS frontend
ENV NODE_ENV=production
ENV PORT=8080
ENV LHS_SITE_ROOT=/app/site
WORKDIR /app
COPY --from=frontend-build --chown=node:node /app/out/site ./site
COPY --chown=node:node scripts/site_server.mjs ./site_server.mjs
USER node
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "site_server.mjs"]
