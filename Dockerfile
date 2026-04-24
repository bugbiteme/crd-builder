# ─── Stage 1: build frontend ─────────────────────────────────────────────────
FROM node:25-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ─── Stage 2: production image ───────────────────────────────────────────────
FROM node:25-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY server/ ./server/
COPY crds/ ./crds/

# OpenShift assigns arbitrary UIDs at runtime within the root group (GID 0).
# Setting ownership to 1001:0 with g=u lets any such UID read and write.
RUN mkdir -p manifests \
    && chown -R 1001:0 /app \
    && chmod -R g=u /app

EXPOSE 3001

USER 1001

CMD ["node", "server/index.js"]
