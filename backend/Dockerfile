# Development stage
FROM node:20-slim AS development
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
CMD ["npm", "run", "dev"]

# Production stage
FROM node:20-slim AS production
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force
COPY src/ ./src/
RUN mkdir -p /home/node/.cache && chown -R node:node /home/node
ENV TRANSFORMERS_CACHE=/home/node/.cache
USER node
EXPOSE 3000
CMD ["node", "src/server.js"]
