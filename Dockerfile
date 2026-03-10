# Stage 1: Build (Keep your existing Stage 1)
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve (The fix happens here)
FROM node:18-alpine
WORKDIR /app

# 1. Copy only what we need from build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./

# 2. IMPORTANT: Install the "Bridge" libraries inside the final container
# This ensures 'express', 'axios', etc. are available to server.cjs
RUN npm install --omit=dev express axios pdf-parse multer

# 3. Copy the actual server file
COPY server.cjs . 

EXPOSE 3000
CMD ["node", "server.cjs"]