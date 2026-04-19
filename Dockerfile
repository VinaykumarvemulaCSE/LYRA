# Build Phase
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build:server

# Production Phase
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=builder /app/dist-server ./dist-server
# If you need static assets, copy them here or serve via Vercel (recommended)

EXPOSE 3001
CMD ["node", "dist-server/server/index.js"]
