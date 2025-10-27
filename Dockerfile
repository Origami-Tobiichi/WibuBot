# Gunakan base image Node.js yang kompatibel
FROM node:20-slim

# Set working directory
WORKDIR /app

# Install git dan dependencies yang diperlukan
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    git \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Copy package.json
COPY package*.json ./

# Install dependencies - otomatis menangani ada/tidaknya package-lock.json
RUN if [ -f package-lock.json ]; then \
        npm ci --only=production --no-audit --no-fund; \
    else \
        npm install --production --no-audit --no-fund; \
    fi

# Copy source code aplikasi
COPY . .

# Expose port (sesuaikan dengan port aplikasi Anda)
EXPOSE 3000

# Command untuk menjalankan aplikasi
CMD ["npm", "start"]
