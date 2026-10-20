# HiAnime v5.0 Enterprise Dockerfile
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

# Install dependencies first for optimal Docker layer caching
COPY package*.json ./
RUN npm install --omit=dev

# Copy application source
COPY . .

# Expose server port
EXPOSE 3000

# Built-in container health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/manifest.json || exit 1

# Start HiAnime server
CMD ["node", "server.js"]
