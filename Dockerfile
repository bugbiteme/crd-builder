# ─── Stage 1: build frontend ─────────────────────────────────────────────────
FROM registry.access.redhat.com/ubi9/nodejs-22 AS builder
WORKDIR /opt/app-root/src
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ─── Stage 2: production image ───────────────────────────────────────────────
FROM registry.access.redhat.com/ubi9/nodejs-22-minimal
WORKDIR /opt/app-root/src

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /opt/app-root/src/dist ./dist
COPY server/ ./server/
COPY crds/ ./crds/

# manifests/ must be group-writable for OpenShift's arbitrary UID (GID 0)
RUN mkdir -p manifests && chmod g=u manifests

EXPOSE 3001

CMD ["node", "server/index.js"]
