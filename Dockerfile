# ============================
# Stage 1: Client Builder
# ============================
FROM oven/bun:1.3.8-alpine AS builder
WORKDIR /app

# Cache dependencies first (speeds up rebuilds)
COPY package*.json ./
RUN bun install

# Copy source and build
COPY . .
RUN bun run build

# ============================
# Stage 2: Production
# ============================
FROM oven/bun:1.3.8-alpine
WORKDIR /app

# Install system deps
RUN apk add --no-cache tzdata curl
ENV TZ=Asia/Kuala_Lumpur

# Copy backend source code
COPY server.js . 

# Copy production files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Install production dependencies only
RUN bun add express axios multer pdf-parse deadslogs jose

EXPOSE 3000

CMD ["bun", "start"]