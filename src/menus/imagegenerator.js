const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');
const fs = require('fs').promises;

class ImageGenerator {
    constructor() {
        this.imagesDir = './data/public/images';
        this.fontsDir = './data/public/assets/fonts';
        this.init();
    }

    async init() {
        await this.ensureDirectories();
        await this.loadFonts();
    }

    async ensureDirectories() {
        const dirs = [
            this.imagesDir,
            this.fontsDir,
            path.join(this.imagesDir, 'menus'),
            path.join(this.imagesDir, 'wallpapers'),
            path.join(this.imagesDir, 'backgrounds'),
            path.join(this.imagesDir, 'wibu')
        ];

        for (const dir of dirs) {
            try {
                await fs.mkdir(dir, { recursive: true });
            } catch (error) {
                console.error(`Error creating directory ${dir}:`, error);
            }
        }
    }

    async loadFonts() {
        try {
            // Register default fonts
            const defaultFonts = [
                'Arial',
                'Helvetica',
                'Times New Roman'
            ];

            // Try to load custom fonts if available
            try {
                const fontFiles = await fs.readdir(this.fontsDir);
                for (const fontFile of fontFiles) {
                    if (fontFile.endsWith('.ttf') || fontFile.endsWith('.otf')) {
                        const fontPath = path.join(this.fontsDir, fontFile);
                        const fontName = path.basename(fontFile, path.extname(fontFile));
                        registerFont(fontPath, { family: fontName });
                    }
                }
            } catch (error) {
                console.log('No custom fonts found, using system fonts');
            }

        } catch (error) {
            console.error('Error loading fonts:', error);
        }
    }

    async generateMenuImage(menuData) {
        const {
            username = 'User',
            premium = false,
            systemInfo = {},
            theme = 'default'
        } = menuData;

        const width = 800;
        const height = 600;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Draw background based on theme
        await this.drawBackground(ctx, width, height, theme);

        // Draw header
        await this.drawHeader(ctx, width, username, premium);

        // Draw system info
        await this.drawSystemInfo(ctx, width, height, systemInfo);

        // Draw footer
        await this.drawFooter(ctx, width, height);

        // Save image
        const filename = `menu_${username}_${Date.now()}.png`;
        const filepath = path.join(this.imagesDir, 'menus', filename);

        const buffer = canvas.toBuffer('image/png');
        await fs.writeFile(filepath, buffer);

        return filepath;
    }

    async drawBackground(ctx, width, height, theme) {
        const gradients = {
            default: {
                start: '#667eea',
                end: '#764ba2'
            },
            premium: {
                start: '#f093fb',
                end: '#f5576c'
            },
            dark: {
                start: '#2c3e50',
                end: '#3498db'
            },
            ocean: {
                start: '#4facfe',
                end: '#00f2fe'
            }
        };

        const gradient = gradients[theme] || gradients.default;
        const bgGradient = ctx.createLinearGradient(0, 0, width, height);
        bgGradient.addColorStop(0, gradient.start);
        bgGradient.addColorStop(1, gradient.end);

        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, width, height);

        // Add some decorative elements
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const radius = Math.random() * 3;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    async drawHeader(ctx, width, username, isPremium) {
        const headerHeight = 120;

        // Draw header background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 0, width, headerHeight);

        // Draw bot logo/icon
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🤖', 60, 70);

        // Draw title
        ctx.font = 'bold 28px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('ULTIMATE WHATSAPP BOT', width / 2, 50);

        // Draw username and status
        ctx.font = '20px Arial';
        ctx.fillText(`Welcome, ${username}`, width / 2, 85);

        // Draw premium badge
        if (isPremium) {
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 16px Arial';
            ctx.fillText('⭐ PREMIUM MEMBER', width / 2, 110);
        } else {
            ctx.fillStyle = '#CCCCCC';
            ctx.font = '16px Arial';
            ctx.fillText('Free Member', width / 2, 110);
        }
    }

    async drawSystemInfo(ctx, width, height, systemInfo) {
        const startY = 150;
        const lineHeight = 25;
        const sectionWidth = width - 100;
        const sectionX = 50;

        // Draw system info box
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = 2;
        this.drawRoundedRect(ctx, sectionX, startY, sectionWidth, 200, 15);
        ctx.fill();
        ctx.stroke();

        // System info title
        ctx.fillStyle = '#333333';
        ctx.font = 'bold 22px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('📊 SYSTEM INFORMATION', sectionX + 20, startY + 35);

        // System info items
        ctx.font = '16px Arial';
        const items = [
            `🕐 Time: ${systemInfo.time || new Date().toLocaleTimeString()}`,
            `📅 Date: ${systemInfo.date || new Date().toLocaleDateString()}`,
            `🖥️ Platform: ${systemInfo.platform || 'Unknown'}`,
            `⚡ Uptime: ${systemInfo.uptime || '0s'}`,
            `💾 Memory: ${systemInfo.memory || '0%'}`,
            `🚀 CPU: ${systemInfo.cpu || '0%'}`
        ];

        items.forEach((item, index) => {
            ctx.fillText(item, sectionX + 30, startY + 70 + (index * lineHeight));
        });

        // Draw features section
        const featuresY = startY + 230;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.drawRoundedRect(ctx, sectionX, featuresY, sectionWidth, 150, 15);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#333333';
        ctx.font = 'bold 22px Arial';
        ctx.fillText('🎯 AVAILABLE FEATURES', sectionX + 20, featuresY + 35);

        const features = [
            '🤖 AI Chat & Auto Reply',
            '🎮 Games & Entertainment',
            '📥 Media Downloader',
            '📱 App Integration',
            '🇯🇵 Wibu/Anime Mode',
            '⭐ Premium Features'
        ];

        ctx.font = '14px Arial';
        features.forEach((feature, index) => {
            const row = Math.floor(index / 2);
            const col = index % 2;
            const x = sectionX + 30 + (col * (sectionWidth / 2));
            const y = featuresY + 65 + (row * 25);
            ctx.fillText(feature, x, y);
        });
    }

    async drawFooter(ctx, width, height) {
        const footerY = height - 50;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, footerY, width, 50);

        ctx.fillStyle = '#ffffff';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Type !menu to see available commands • Type !help for assistance', width / 2, footerY + 30);
    }

    drawRoundedRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }

    async generateWibuImage(wibuData) {
        const {
            characterName = 'Waifu',
            anime = 'Unknown Anime',
            quote = '',
            type = 'waifu'
        } = wibuData;

        const width = 600;
        const height = 400;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Draw anime-style background
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#ff9a9e');
        gradient.addColorStop(1, '#fad0c4');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Add sakura petals
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const size = Math.random() * 10 + 5;
            this.drawSakura(ctx, x, y, size);
        }

        // Draw character card
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.drawRoundedRect(ctx, 50, 50, width - 100, height - 100, 20);
        ctx.fill();

        // Character name
        ctx.fillStyle = '#e91e63';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(characterName, width / 2, 100);

        // Anime name
        ctx.fillStyle = '#9c27b0';
        ctx.font = '18px Arial';
        ctx.fillText(`From: ${anime}`, width / 2, 130);

        // Quote
        if (quote) {
            ctx.fillStyle = '#333333';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            this.wrapText(ctx, quote, width / 2, 180, width - 150, 24);
        }

        // Type badge
        ctx.fillStyle = type === 'waifu' ? '#e91e63' : '#2196f3';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(type.toUpperCase(), width / 2, height - 70);

        // Save image
        const filename = `wibu_${characterName}_${Date.now()}.png`;
        const filepath = path.join(this.imagesDir, 'wibu', filename);

        const buffer = canvas.toBuffer('image/png');
        await fs.writeFile(filepath, buffer);

        return filepath;
    }

    drawSakura(ctx, x, y, size) {
        ctx.save();
        ctx.translate(x, y);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        for (let i = 0; i < 5; i++) {
            ctx.rotate((Math.PI * 2) / 5);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.bezierCurveTo(
                size / 2, -size / 2,
                size, 0,
                0, size
            );
            ctx.fill();
        }
        
        ctx.restore();
    }

    wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        let testLine = '';
        let lineCount = 0;

        for (let n = 0; n < words.length; n++) {
            testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;

            if (testWidth > maxWidth && n > 0) {
                ctx.fillText(line, x, y);
                line = words[n] + ' ';
                y += lineHeight;
                lineCount++;
                
                if (lineCount >= 5) { // Max 5 lines
                    ctx.fillText('...', x, y);
                    break;
                }
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, y);
    }

    async generateStatsImage(userStats) {
        const width = 800;
        const height = 400;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Background
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Title
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('USER STATISTICS', width / 2, 50);

        // Stats
        ctx.font = '20px Arial';
        ctx.textAlign = 'left';
        const stats = [
            `👤 Username: ${userStats.username}`,
            `⭐ Status: ${userStats.premium ? 'PREMIUM' : 'FREE'}`,
            `📅 Registered: ${new Date(userStats.registeredAt).toLocaleDateString()}`,
            `💬 Messages Sent: ${userStats.stats?.messagesSent || 0}`,
            `🎮 Games Played: ${userStats.stats?.gamesPlayed || 0}`,
            `📥 Downloads: ${userStats.stats?.downloads || 0}`,
            `🎵 Voice Notes: ${userStats.stats?.voiceNotes || 0}`,
            `🔢 Commands Used: ${userStats.stats?.commandsUsed || 0}`
        ];

        stats.forEach((stat, index) => {
            ctx.fillText(stat, 100, 100 + (index * 35));
        });

        // Level progress bar
        const level = userStats.level || 1;
        const exp = userStats.exp || 0;
        const expNeeded = level * 100;
        const progress = (exp / expNeeded) * 100;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(100, 350, 600, 20);
        
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(100, 350, (600 * progress) / 100, 20);

        ctx.fillStyle = '#ffffff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Level ${level} - ${exp}/${expNeeded} EXP (${progress.toFixed(1)}%)`, width / 2, 365);

        // Save image
        const filename = `stats_${userStats.username}_${Date.now()}.png`;
        const filepath = path.join(this.imagesDir, 'menus', filename);

        const buffer = canvas.toBuffer('image/png');
        await fs.writeFile(filepath, buffer);

        return filepath;
    }

    async createWallpaper(type = 'default') {
        const width = 1920;
        const height = 1080;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        const wallpapers = {
            default: this.createDefaultWallpaper.bind(this),
            premium: this.createPremiumWallpaper.bind(this),
            gaming: this.createGamingWallpaper.bind(this),
            anime: this.createAnimeWallpaper.bind(this)
        };

        const creator = wallpapers[type] || wallpapers.default;
        await creator(ctx, width, height);

        const filename = `wallpaper_${type}_${Date.now()}.png`;
        const filepath = path.join(this.imagesDir, 'wallpapers', filename);

        const buffer = canvas.toBuffer('image/png');
        await fs.writeFile(filepath, buffer);

        return filepath;
    }

    async createDefaultWallpaper(ctx, width, height) {
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.font = 'bold 120px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('ULTIMATE BOT', width / 2, height / 2);

        ctx.font = '40px Arial';
        ctx.fillText('WhatsApp Bot Platform', width / 2, height / 2 + 80);
    }

    async createPremiumWallpaper(ctx, width, height) {
        const gradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width/2);
        gradient.addColorStop(0, '#f093fb');
        gradient.addColorStop(1, '#f5576c');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const size = Math.random() * 20 + 5;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = 'bold 100px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('⭐ PREMIUM ⭐', width / 2, height / 2);
    }

    async createGamingWallpaper(ctx, width, height) {
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#0f0c29');
        gradient.addColorStop(0.5, '#302b63');
        gradient.addColorStop(1, '#24243e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Add gaming elements
        ctx.fillStyle = 'rgba(0, 255, 255, 0.1)';
        this.drawGameElements(ctx, width, height);

        ctx.fillStyle = '#00ffff';
        ctx.font = 'bold 80px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME MODE', width / 2, height / 2);

        ctx.font = '30px Arial';
        ctx.fillText('Ready to Play?', width / 2, height / 2 + 60);
    }

    async createAnimeWallpaper(ctx, width, height) {
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#ff9a9e');
        gradient.addColorStop(0.5, '#fad0c4');
        gradient.addColorStop(1, '#fbc2eb');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Add sakura petals
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        for (let i = 0; i < 200; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const size = Math.random() * 15 + 5;
            this.drawSakura(ctx, x, y, size);
        }

        ctx.fillStyle = '#e91e63';
        ctx.font = 'bold 80px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('WIBU MODE', width / 2, height / 2);

        ctx.font = '30px Arial';
        ctx.fillText('おかえりなさい!', width / 2, height / 2 + 60);
    }

    drawGameElements(ctx, width, height) {
        // Draw some simple game-like elements
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const size = Math.random() * 10 + 5;
            
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw crosshair-like pattern
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x - size, y);
            ctx.lineTo(x + size, y);
            ctx.moveTo(x, y - size);
            ctx.lineTo(x, y + size);
            ctx.stroke();
        }
    }
}

module.exports = ImageGenerator;
