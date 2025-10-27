# Gunakan image Node.js yang ringan
FROM node:20-slim
# Set direktori kerja di container
WORKDIR /app

# Salin file package.json & package-lock.json dulu (agar cache build lebih efisien)
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Salin semua file project ke container
COPY . .

# Expose port (ubah jika server kamu pakai port lain, misalnya 3000)
EXPOSE 3000

# Jalankan bot
CMD ["npm", "start"] 
