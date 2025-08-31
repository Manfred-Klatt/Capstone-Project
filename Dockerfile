# Simplified single-stage build to avoid timeout issues on Railway
FROM node:20-alpine

WORKDIR /app

# Create non-root user with specific UID for better security
RUN addgroup -S appgroup -g 1001 && \
    adduser -S appuser -u 1001 -G appgroup

# Copy package files first for better layer caching
COPY package*.json ./

# Install only production dependencies without optional dependencies that might require build tools
# This avoids the need for python3, make, g++ which can cause timeouts
RUN npm ci --only=production --no-audit --no-optional && \
    npm cache clean --force

# Copy source code
COPY . .

# Don't copy environment files - Railway injects environment variables
# We'll use the ones provided by Railway deployment

# Install wget for health check and create uploads directory
RUN apk add --no-cache wget && \
    mkdir -p /app/uploads && \
    chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Set secure environment variables - PORT will be provided by Railway
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max_old_space_size=512 --no-deprecation"

# Expose the port - Railway will route traffic to the port specified in their environment
EXPOSE ${PORT:-3000}

# Health check with proper path
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-3000}/api/v1/health || exit 1

# Use exec form for better signal handling
CMD ["node", "src/app.js"]
