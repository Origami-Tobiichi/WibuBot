FROM node:20-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    git \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm install --no-audit --no-fund

# Copy source code
COPY . .

# Create necessary directories
RUN mkdir -p data/public/images/menus \
    data/public/images/wallpapers \
    data/public/images/backgrounds \
    data/public/images/wibu \
    data/public/assets/fonts \
    data/users \
    auth_info

# Expose port (if needed)
# EXPOSE 3000
# Expose port for health checks
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["npm", "start"]
