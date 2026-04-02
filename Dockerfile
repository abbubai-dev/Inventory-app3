# ============================
# Stage 1: Client Builder
# ============================
FROM oven/bun:1.3.8-alpine AS builder
WORKDIR /app

# Cache dependencies first (speeds up rebuilds) (FIX: add bun.lock)
COPY package*.json bun.lock* ./
RUN bun install

# Copy source and build (FIX: build:client as in server.js)
COPY . .
RUN bun run build:client

# ============================
# Stage 2: Production
# ============================
FROM oven/bun:1.3.8-alpine
WORKDIR /app

# Install system deps
RUN apk add --no-cache tzdata curl
ENV TZ=Asia/Kuala_Lumpur

# Copy backend source code (FIX: add dependencies)
COPY server.js . 
COPY middleware ./middleware
COPY utils ./utils

# Copy production files (FIX: add bun.lock)
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/bun.lock* ./

# Install production dependencies only (FIX: change from bun add..)
RUN bun install --production

EXPOSE 3000
# ("start" script in package.json is "bun server.js")
CMD ["bun", "start"]