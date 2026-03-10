# Stage 1: Build the React App
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
# We add --legacy-peer-deps to handle any minor version conflicts between React 19 and older plugins
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

# Stage 2: Serve with Node.js
FROM node:20-alpine
WORKDIR /app

# Copy production files
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./

# Install production dependencies only
RUN npm install --omit=dev express axios multer pdf-parse

COPY server.cjs . 

EXPOSE 3000
CMD ["node", "server.cjs"]