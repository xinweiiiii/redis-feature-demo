# Multi-stage build for AWS App Runner
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies for native modules (better-sqlite3)
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies and rebuild native modules for Alpine Linux
RUN npm ci && npm rebuild better-sqlite3

# Copy source code
COPY . .

# Build Next.js app
RUN npm run build

# Production image
FROM node:20-alpine AS runner

WORKDIR /app

# Install runtime dependencies for better-sqlite3
RUN apk add --no-cache libc6-compat

# Set to production
ENV NODE_ENV=production
ENV PORT=3000

# Copy built assets from builder
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Create data directory for SQLite
RUN mkdir -p ./data && chmod 777 ./data

# Expose port
EXPOSE 3000

# Start the app
CMD ["node", "server.js"]
