# Development stage
FROM node:20-alpine AS development
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
CMD ["npm", "run", "dev"]

# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage — just holds the dist/ output
FROM alpine:3.19 AS production
WORKDIR /dist
COPY --from=builder /app/dist ./
