# Build stage
FROM node:20-alpine AS builder

WORKDIR /build

COPY server/package*.json ./
RUN npm ci --omit=dev

COPY server .

# Runtime stage
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
EXPOSE 8000

# Copy node_modules from builder
COPY --from=builder /build/node_modules ./node_modules
COPY server .

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

CMD ["node", "index.js"]
