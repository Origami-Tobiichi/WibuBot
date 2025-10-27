# Gunakan base image Node.js yang kompatibel
FROM node:20-slim

# Set working directory
WORKDIR /app

# Install git dan dependencies yang diperlukan (untuk package yang memerlukan kompilasi native)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    git \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Copy package.json dan package-lock.json (jika ada)
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production --no-audit --no-fund

# Alternatif: jika tidak ada package-lock.json, gunakan:
# RUN npm install --production --no-audit --no-fund

# Copy source code aplikasi
COPY . .

# Expose port (sesuaikan dengan port aplikasi Anda)
EXPOSE 3000

# Command untuk menjalankan aplikasi
CMD ["npm", "start"]
