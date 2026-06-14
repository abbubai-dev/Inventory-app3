# ============================
# Stage 1: Client Builder
# ============================
FROM oven/bun:1.3.8-alpine AS builder
WORKDIR /app

# Cache dependencies first (speeds up rebuilds)
COPY package*.json /app/
COPY bun.lock* /app/
RUN bun install

# Copy source and build
COPY . /app/
RUN bun run build:client

# ============================
# Stage 2: Production
# ============================
FROM oven/bun:1.3.8-alpine
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache tzdata curl
ENV TZ=Asia/Kuala_Lumpur

# Copy backend source code files explicitly
COPY server.js /app/
COPY db.ts /app/
COPY middleware /app/middleware/
COPY utils /app/utils/

# Copy compiled frontend and package definitions from Stage 1
COPY --from=builder /app/dist /app/dist/
COPY --from=builder /app/package*.json /app/
COPY --from=builder /app/bun.lock* /app/

# Install production dependencies only
RUN bun install --production

EXPOSE 3000
CMD ["bun", "start"]