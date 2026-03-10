# Stage 1: Build the React App
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve with Node.js
FROM node:18-alpine
WORKDIR /app

# 1. Copy the production build from Stage 1
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./

# 2. Install only production dependencies
# This keeps the image small
RUN npm install --omit=dev

# 3. FIX: Copy the correct filename (.cjs)
COPY server.cjs . 

EXPOSE 3000

# 4. FIX: Ensure this matches the file you just copied
CMD ["node", "server.cjs"]