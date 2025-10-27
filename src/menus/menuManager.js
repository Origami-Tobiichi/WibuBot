const ButtonManager = require('./buttonManager');
const ImageGenerator = require('./imageGenerator');
const SystemInfo = require('../utils/systemInfo');

class MenuManager {
    constructor() {
        this.buttonManager = new ButtonManager();
        this.imageGenerator = new ImageGenerator();
    }

    async generateMainMenu(user) {
        const systemInfo = await SystemInfo.getSystemInfo();
        const isPremium = user?.premium || false;
        const isOwner = user?.jid === process.env.OWNER_NUMBER;

        // Generate menu image dengan info system
        const menuImage = await this.imageGenerator.generateMenuImage({
            username: user?.username || 'Guest',
            premium: isPremium,
            systemInfo: systemInfo
        });

        const menuText = `🤖 *ULTIMATE WHATSAPP BOT MENU* 🤖\n\n` +
                        `👤 User: ${user?.username || 'Not Registered'}\n` +
                        `⭐ Status: ${isPremium ? 'PREMIUM' : 'FREE'}\n` +
                        `🆔 ID: ${user?.jid?.split('@')[0] || 'Unknown'}\n\n` +
                        `📊 *SYSTEM INFO*\n` +
                        `⏰ Time: ${systemInfo.time}\n` +
                        `📅 Date: ${systemInfo.date}\n` +
                        `🖥️ Platform: ${systemInfo.platform}\n` +
                        `⚡ Uptime: ${systemInfo.uptime}\n\n` +
                        `*Available Features:*`;

        const buttons = this.generateMenuButtons(isPremium, isOwner);

        return {
            image: menuImage,
            caption: menuText,
            buttons: buttons
        };
    }

    generateMenuButtons(isPremium, isOwner) {
        const buttons = [
            [
                { buttonId: '!ai', buttonText: { displayText: '🤖 AI CHAT' }, type: 1 },
                { buttonId: '!game', buttonText: { displayText: '🎮 GAMES' }, type: 1 }
            ],
            [
                { buttonId: '!download', buttonText: { displayText: '📥 DOWNLOAD' }, type: 1 },
                { buttonId: '!app', buttonText: { displayText: '📱 APPS' }, type: 1 }
            ],
            [
                { buttonId: '!wibu', buttonText: { displayText: '🇯🇵 WIBU MODE' }, type: 1 },
                { buttonId: '!premium', buttonText: { displayText: '⭐ PREMIUM' }, type: 1 }
            ]
        ];

        if (isPremium || isOwner) {
            buttons.push([
                { buttonId: '!nsfw', buttonText: { displayText: '🔞 NSFW' }, type: 1 }
            ]);
        }

        if (isOwner) {
            buttons.push([
                { buttonId: '!owner', buttonText: { displayText: '👑 OWNER' }, type: 1 }
            ]);
        }

        return buttons;
    }
}

module.exports = MenuManager;

