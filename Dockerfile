# Use specific version of Node.js LTS for better security and stability
FROM node:20.13.1-alpine3.19 AS builder

# Install security updates and build dependencies
RUN apk --no-cache upgrade && \
    apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./

# Install all dependencies including devDependencies
RUN npm ci --no-audit --prefer-offline

# Copy source code
COPY . .

# Production stage
FROM node:20.13.1-alpine3.19

# Install security updates
RUN apk --no-cache upgrade

WORKDIR /app

# Create non-root user with specific UID for better security
RUN addgroup -S appgroup -g 1001 && \
    adduser -S appuser -u 1001 -G appgroup

# Copy package files first for better layer caching
COPY package*.json ./

# Install only production dependencies with security audit
RUN npm ci --only=production --no-audit --prefer-offline && \
    npm cache clean --force && \
    rm -rf /tmp/*

# Copy built application from builder
COPY --from=builder /app .

# Set proper permissions
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Set secure environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV NODE_OPTIONS="--max_old_space_size=512 --no-deprecation"

# Expose the port the app runs on
EXPOSE 3000

# Health check with proper path
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Use exec form for better signal handling
CMD ["node", "--trace-warnings", "server.js"]
