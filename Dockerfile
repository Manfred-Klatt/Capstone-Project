# Simplified single-stage build to avoid timeout issues
FROM node:22-alpine

WORKDIR /app

# Create non-root user with specific UID for better security
RUN addgroup -S appgroup -g 1001 && \
    adduser -S appuser -u 1001 -G appgroup

# Copy package files first for better layer caching
COPY package*.json ./

# Install only production dependencies without build tools
RUN npm ci --only=production --no-audit --no-optional && \
    npm cache clean --force

# Copy source code
COPY . .

# Copy production environment file
COPY .env.production .env

# Install wget for health check and create uploads directory
RUN apk add --no-cache wget && \
    mkdir -p /app/uploads && \
    chown -R appuser:appgroup /app

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
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/v1/health || exit 1

# Use exec form for better signal handling
CMD ["node", "src/app.js"]
