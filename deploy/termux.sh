#!/bin/bash

echo "🤖 Ultimate WhatsApp Bot - Termux Setup"
echo "========================================"

# Update packages
echo "📦 Updating packages..."
pkg update -y
pkg upgrade -y

# Install required packages
echo "🔧 Installing dependencies..."
pkg install -y nodejs git ffmpeg python

# Clone repository
echo "📥 Cloning repository..."
git clone https://github.com/your-username/whatsapp-bot-ultimate.git
cd whatsapp-bot-ultimate

# Install Node.js dependencies
echo "📚 Installing Node.js dependencies..."
npm install

# Create environment file
echo "⚙️ Creating environment configuration..."
cp .env.example .env

echo "🎉 Setup completed!"
echo ""
echo "📝 Next steps:"
echo "1. Edit .env file with your configuration"
echo "2. Run: npm start"
echo "3. Scan QR code with WhatsApp"
echo ""
echo "💡 For premium features, set up OpenAI API key in .env"