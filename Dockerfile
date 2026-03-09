# Stage 1: Build the React App
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve with Node.js (to handle your proxy functions)
FROM node:18-alpine
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./
# If you used axios in your proxy, install it here
RUN npm install --omit=dev axios express 

# Copy your proxy function but adapted for Express
COPY server.js . 

EXPOSE 3000
CMD ["node", "server.cjs"]