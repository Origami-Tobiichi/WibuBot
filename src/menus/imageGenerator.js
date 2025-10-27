const Jimp = require('jimp');
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

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
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

        // Create image with background
        const image = await this.createBackground(width, height, theme);

        // Draw header
        await this.drawHeader(image, width, username, premium);

        // Draw system info
        await this.drawSystemInfo(image, width, height, systemInfo);

        // Draw footer
        await this.drawFooter(image, width, height);

        // Save image
        const filename = `menu_${username}_${Date.now()}.png`;
        const filepath = path.join(this.imagesDir, 'menus', filename);

        await image.writeAsync(filepath);
        return filepath;
    }

    async createBackground(width, height, theme) {
        const gradients = {
            default: { start: '#667eea', end: '#764ba2' },
            premium: { start: '#f093fb', end: '#f5576c' },
            dark: { start: '#2c3e50', end: '#3498db' },
            ocean: { start: '#4facfe', end: '#00f2fe' }
        };

        const gradient = gradients[theme] || gradients.default;
        const startColor = this.hexToRgb(gradient.start);
        const endColor = this.hexToRgb(gradient.end);

        // Create gradient background
        const image = new Jimp(width, height, 0x000000FF);
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const ratio = (x + y) / (width + height);
                const r = Math.round(startColor.r + (endColor.r - startColor.r) * ratio);
                const g = Math.round(startColor.g + (endColor.g - startColor.g) * ratio);
                const b = Math.round(startColor.b + (endColor.b - startColor.b) * ratio);
                
                const color = Jimp.rgbaToInt(r, g, b, 255);
                image.setPixelColor(color, x, y);
            }
        }

        // Add decorative elements
        for (let i = 0; i < 50; i++) {
            const x = Math.floor(Math.random() * width);
            const y = Math.floor(Math.random() * height);
            const radius = Math.floor(Math.random() * 3) + 1;
            
            for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    if (dx * dx + dy * dy <= radius * radius) {
                        const nx = x + dx;
                        const ny = y + dy;
                        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                            const currentColor = Jimp.intToRGBA(image.getPixelColor(nx, ny));
                            const newColor = Jimp.rgbaToInt(
                                Math.min(255, currentColor.r + 50),
                                Math.min(255, currentColor.g + 50),
                                Math.min(255, currentColor.b + 50),
                                100
                            );
                            image.setPixelColor(newColor, nx, ny);
                        }
                    }
                }
            }
        }

        return image;
    }

    async drawHeader(image, width, username, isPremium) {
        const headerHeight = 120;

        // Draw header background
        for (let y = 0; y < headerHeight; y++) {
            for (let x = 0; x < width; x++) {
                const currentColor = Jimp.intToRGBA(image.getPixelColor(x, y));
                const newColor = Jimp.rgbaToInt(
                    Math.max(0, currentColor.r - 50),
                    Math.max(0, currentColor.g - 50),
                    Math.max(0, currentColor.b - 50),
                    currentColor.a
                );
                image.setPixelColor(newColor, x, y);
            }
        }

        // Load fonts
        let fontLarge, fontMedium, fontSmall;
        try {
            fontLarge = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
            fontMedium = await Jimp.loadFont(Jimp.FONT_SANS_16_BLACK);
            fontSmall = await Jimp.loadFont(Jimp.FONT_SANS_14_BLACK);
        } catch (error) {
            console.error('Error loading fonts:', error);
            return;
        }

        // Draw bot icon
        image.print(fontLarge, 20, 30, '🤖');

        // Draw title
        image.print(fontMedium, width / 2 - 150, 20, 'ULTIMATE WHATSAPP BOT');

        // Draw username
        image.print(fontSmall, width / 2 - 80, 60, `Welcome, ${username}`);

        // Draw premium badge
        if (isPremium) {
            image.print(fontSmall, width / 2 - 70, 85, '⭐ PREMIUM MEMBER');
        } else {
            image.print(fontSmall, width / 2 - 40, 85, 'Free Member');
        }
    }

    async drawSystemInfo(image, width, height, systemInfo) {
        const startY = 150;
        const sectionWidth = width - 100;
        const sectionX = 50;

        // Draw system info box
        this.drawRoundedRect(image, sectionX, startY, sectionWidth, 200, 15, 0xFFFFFFFF);

        // Load fonts
        let fontTitle, fontText;
        try {
            fontTitle = await Jimp.loadFont(Jimp.FONT_SANS_16_BLACK);
            fontText = await Jimp.loadFont(Jimp.FONT_SANS_14_BLACK);
        } catch (error) {
            console.error('Error loading fonts:', error);
            return;
        }

        // System info title
        image.print(fontTitle, sectionX + 20, startY + 20, '📊 SYSTEM INFORMATION');

        // System info items
        const items = [
            `🕐 Time: ${systemInfo.time || new Date().toLocaleTimeString()}`,
            `📅 Date: ${systemInfo.date || new Date().toLocaleDateString()}`,
            `🖥️ Platform: ${systemInfo.platform || 'Unknown'}`,
            `⚡ Uptime: ${systemInfo.uptime || '0s'}`,
            `💾 Memory: ${systemInfo.memory || '0%'}`,
            `🚀 CPU: ${systemInfo.cpu || '0%'}`
        ];

        items.forEach((item, index) => {
            image.print(fontText, sectionX + 30, startY + 50 + (index * 25), item);
        });

        // Draw features section
        const featuresY = startY + 230;
        this.drawRoundedRect(image, sectionX, featuresY, sectionWidth, 150, 15, 0xFFFFFFFF);

        image.print(fontTitle, sectionX + 20, featuresY + 20, '🎯 AVAILABLE FEATURES');

        const features = [
            '🤖 AI Chat & Auto Reply',
            '🎮 Games & Entertainment',
            '📥 Media Downloader',
            '📱 App Integration',
            '🇯🇵 Wibu/Anime Mode',
            '⭐ Premium Features'
        ];

        features.forEach((feature, index) => {
            const row = Math.floor(index / 2);
            const col = index % 2;
            const x = sectionX + 30 + (col * (sectionWidth / 2));
            const y = featuresY + 50 + (row * 25);
            image.print(fontText, x, y, feature);
        });
    }

    async drawFooter(image, width, height) {
        const footerY = height - 50;

        // Draw footer background
        for (let y = footerY; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const currentColor = Jimp.intToRGBA(image.getPixelColor(x, y));
                const newColor = Jimp.rgbaToInt(
                    Math.max(0, currentColor.r - 100),
                    Math.max(0, currentColor.g - 100),
                    Math.max(0, currentColor.b - 100),
                    currentColor.a
                );
                image.setPixelColor(newColor, x, y);
            }
        }

        // Load font
        try {
            const font = await Jimp.loadFont(Jimp.FONT_SANS_14_WHITE);
            const text = 'Type !menu to see available commands • Type !help for assistance';
            const textWidth = Jimp.measureText(font, text);
            image.print(font, (width - textWidth) / 2, footerY + 20, text);
        } catch (error) {
            console.error('Error loading font:', error);
        }
    }

    drawRoundedRect(image, x, y, width, height, radius, color) {
        // Draw rounded rectangle (simplified version)
        for (let i = x; i < x + width; i++) {
            for (let j = y; j < y + height; j++) {
                const isCorner = 
                    (i < x + radius && j < y + radius && Math.sqrt((i - x - radius) ** 2 + (j - y - radius) ** 2) > radius) ||
                    (i > x + width - radius && j < y + radius && Math.sqrt((i - x - width + radius) ** 2 + (j - y - radius) ** 2) > radius) ||
                    (i < x + radius && j > y + height - radius && Math.sqrt((i - x - radius) ** 2 + (j - y - height + radius) ** 2) > radius) ||
                    (i > x + width - radius && j > y + height - radius && Math.sqrt((i - x - width + radius) ** 2 + (j - y - height + radius) ** 2) > radius);

                if (!isCorner && i >= x && i < x + width && j >= y && j < y + height) {
                    image.setPixelColor(color, i, j);
                }
            }
        }
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

        // Create anime-style background
        const image = new Jimp(width, height, 0xFF9A9EFF);
        
        // Create gradient background
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const ratio = y / height;
                const r = Math.round(255 - (255 - 250) * ratio);
                const g = Math.round(154 - (154 - 208) * ratio);
                const b = Math.round(158 - (158 - 196) * ratio);
                const color = Jimp.rgbaToInt(r, g, b, 255);
                image.setPixelColor(color, x, y);
            }
        }

        // Draw character card
        this.drawRoundedRect(image, 50, 50, width - 100, height - 100, 20, 0xFFFFFFFF);

        // Load fonts
        let fontLarge, fontMedium, fontSmall;
        try {
            fontLarge = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
            fontMedium = await Jimp.loadFont(Jimp.FONT_SANS_16_BLACK);
            fontSmall = await Jimp.loadFont(Jimp.FONT_SANS_14_BLACK);
        } catch (error) {
            console.error('Error loading fonts:', error);
            return;
        }

        // Character name
        const nameWidth = Jimp.measureText(fontLarge, characterName);
        image.print(fontLarge, (width - nameWidth) / 2, 80, characterName);

        // Anime name
        const animeText = `From: ${anime}`;
        const animeWidth = Jimp.measureText(fontMedium, animeText);
        image.print(fontMedium, (width - animeWidth) / 2, 120, animeText);

        // Quote
        if (quote) {
            this.wrapText(image, fontSmall, quote, width / 2, 160, width - 150, 20);
        }

        // Type badge
        const typeText = type.toUpperCase();
        const typeWidth = Jimp.measureText(fontSmall, typeText);
        image.print(fontSmall, (width - typeWidth) / 2, height - 80, typeText);

        // Save image
        const filename = `wibu_${characterName}_${Date.now()}.png`;
        const filepath = path.join(this.imagesDir, 'wibu', filename);

        await image.writeAsync(filepath);
        return filepath;
    }

    wrapText(image, font, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        let currentY = y;

        for (const word of words) {
            const testLine = line + word + ' ';
            const testWidth = Jimp.measureText(font, testLine);

            if (testWidth > maxWidth) {
                const lineWidth = Jimp.measureText(font, line);
                image.print(font, x - lineWidth / 2, currentY, line);
                line = word + ' ';
                currentY += lineHeight;
                
                if (currentY > y + 100) { // Max 5 lines
                    image.print(font, x - Jimp.measureText(font, '...') / 2, currentY, '...');
                    break;
                }
            } else {
                line = testLine;
            }
        }
        
        if (line) {
            const lineWidth = Jimp.measureText(font, line);
            image.print(font, x - lineWidth / 2, currentY, line);
        }
    }

    async generateStatsImage(userStats) {
        const width = 800;
        const height = 400;

        // Create background
        const image = await this.createBackground(width, height, 'default');

        // Load fonts
        let fontLarge, fontMedium, fontSmall;
        try {
            fontLarge = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
            fontMedium = await Jimp.loadFont(Jimp.FONT_SANS_16_WHITE);
            fontSmall = await Jimp.loadFont(Jimp.FONT_SANS_14_WHITE);
        } catch (error) {
            console.error('Error loading fonts:', error);
            return;
        }

        // Title
        const title = 'USER STATISTICS';
        const titleWidth = Jimp.measureText(fontLarge, title);
        image.print(fontLarge, (width - titleWidth) / 2, 30, title);

        // Stats
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
            image.print(fontMedium, 80, 80 + (index * 35), stat);
        });

        // Level progress bar
        const level = userStats.level || 1;
        const exp = userStats.exp || 0;
        const expNeeded = level * 100;
        const progress = Math.min((exp / expNeeded) * 100, 100);

        // Draw progress bar background
        this.drawRoundedRect(image, 80, 340, 600, 20, 10, 0x7FFFFFFF);
        
        // Draw progress
        this.drawRoundedRect(image, 80, 340, (600 * progress) / 100, 20, 10, 0xFF4CAF50FF);

        // Progress text
        const progressText = `Level ${level} - ${exp}/${expNeeded} EXP (${progress.toFixed(1)}%)`;
        const progressWidth = Jimp.measureText(fontSmall, progressText);
        image.print(fontSmall, (width - progressWidth) / 2, 343, progressText);

        // Save image
        const filename = `stats_${userStats.username}_${Date.now()}.png`;
        const filepath = path.join(this.imagesDir, 'menus', filename);

        await image.writeAsync(filepath);
        return filepath;
    }

    async createWallpaper(type = 'default') {
        const width = 800; // Reduced for performance
        const height = 600;

        const wallpapers = {
            default: this.createDefaultWallpaper.bind(this),
            premium: this.createPremiumWallpaper.bind(this),
            gaming: this.createGamingWallpaper.bind(this),
            anime: this.createAnimeWallpaper.bind(this)
        };

        const creator = wallpapers[type] || wallpapers.default;
        const image = await creator(width, height);

        const filename = `wallpaper_${type}_${Date.now()}.png`;
        const filepath = path.join(this.imagesDir, 'wallpapers', filename);

        await image.writeAsync(filepath);
        return filepath;
    }

    async createDefaultWallpaper(width, height) {
        const image = await this.createBackground(width, height, 'default');
        
        try {
            const fontLarge = await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE);
            const fontMedium = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
            
            const title = 'ULTIMATE BOT';
            const titleWidth = Jimp.measureText(fontLarge, title);
            image.print(fontLarge, (width - titleWidth) / 2, height / 2 - 50, title);

            const subtitle = 'WhatsApp Bot Platform';
            const subtitleWidth = Jimp.measureText(fontMedium, subtitle);
            image.print(fontMedium, (width - subtitleWidth) / 2, height / 2 + 20, subtitle);
        } catch (error) {
            console.error('Error loading fonts for wallpaper:', error);
        }

        return image;
    }

    async createPremiumWallpaper(width, height) {
        const image = new Jimp(width, height, 0xF093FBFF);
        
        // Create radial gradient effect
        const centerX = width / 2;
        const centerY = height / 2;
        const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY);

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
                const ratio = distance / maxRadius;
                
                const r = Math.round(240 + (245 - 240) * ratio);
                const g = Math.round(147 + (87 - 147) * ratio);
                const b = Math.round(251 + (108 - 251) * ratio);
                const color = Jimp.rgbaToInt(r, g, b, 255);
                image.setPixelColor(color, x, y);
            }
        }

        // Add stars
        for (let i = 0; i < 50; i++) {
            const x = Math.floor(Math.random() * width);
            const y = Math.floor(Math.random() * height);
            const size = Math.floor(Math.random() * 10) + 5;
            
            for (let dy = -size; dy <= size; dy++) {
                for (let dx = -size; dx <= size; dx++) {
                    if (dx * dx + dy * dy <= size * size) {
                        const nx = x + dx;
                        const ny = y + dy;
                        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                            image.setPixelColor(0xFFFFD700, nx, ny);
                        }
                    }
                }
            }
        }

        try {
            const font = await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE);
            const text = '⭐ PREMIUM ⭐';
            const textWidth = Jimp.measureText(font, text);
            image.print(font, (width - textWidth) / 2, height / 2 - 32, text);
        } catch (error) {
            console.error('Error loading font:', error);
        }

        return image;
    }

    async createGamingWallpaper(width, height) {
        const image = new Jimp(width, height, 0x0F0C29FF);
        
        // Create gaming background with simple pattern
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const pattern = (x % 20 < 10 && y % 20 < 10) ? 50 : 0;
                const currentColor = Jimp.intToRGBA(image.getPixelColor(x, y));
                const newColor = Jimp.rgbaToInt(
                    Math.min(255, currentColor.r + pattern),
                    Math.min(255, currentColor.g + pattern),
                    Math.min(255, currentColor.b + pattern),
                    currentColor.a
                );
                image.setPixelColor(newColor, x, y);
            }
        }

        try {
            const fontLarge = await Jimp.loadFont(Jimp.FONT_SANS_48_CYAN);
            const fontSmall = await Jimp.loadFont(Jimp.FONT_SANS_24_CYAN);
            
            const title = 'GAME MODE';
            const titleWidth = Jimp.measureText(fontLarge, title);
            image.print(fontLarge, (width - titleWidth) / 2, height / 2 - 30, title);

            const subtitle = 'Ready to Play?';
            const subtitleWidth = Jimp.measureText(fontSmall, subtitle);
            image.print(fontSmall, (width - subtitleWidth) / 2, height / 2 + 30, subtitle);
        } catch (error) {
            console.error('Error loading fonts:', error);
        }

        return image;
    }

    async createAnimeWallpaper(width, height) {
        const image = new Jimp(width, height, 0xFF9A9EFF);
        
        // Create gradient background
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const ratio = y / height;
                const r = Math.round(255 - (255 - 251) * ratio);
                const g = Math.round(154 - (154 - 194) * ratio);
                const b = Math.round(158 - (158 - 235) * ratio);
                const color = Jimp.rgbaToInt(r, g, b, 255);
                image.setPixelColor(color, x, y);
            }
        }

        try {
            const fontLarge = await Jimp.loadFont(Jimp.FONT_SANS_48_PINK);
            const fontSmall = await Jimp.loadFont(Jimp.FONT_SANS_24_PINK);
            
            const title = 'WIBU MODE';
            const titleWidth = Jimp.measureText(fontLarge, title);
            image.print(fontLarge, (width - titleWidth) / 2, height / 2 - 30, title);

            const subtitle = 'おかえりなさい!';
            const subtitleWidth = Jimp.measureText(fontSmall, subtitle);
            image.print(fontSmall, (width - subtitleWidth) / 2, height / 2 + 30, subtitle);
        } catch (error) {
            console.error('Error loading fonts:', error);
        }

        return image;
    }
}

module.exports = ImageGenerator;
