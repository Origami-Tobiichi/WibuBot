const MenuManager = require('../menus/menuManager');
const UserManager = require('../registration/userManager');
const AIService = require('../ai/openai');
const GameManager = require('../features/games/gameManager');
const DownloadManager = require('../features/downloader/downloadManager');
const AppManager = require('../apps/appManager');
const AdultManager = require('../adult/adultManager');
const WibuManager = require('../wibu/wibuManager');

class MessageHandler {
    constructor(bot) {
        this.bot = bot;
        this.menuManager = new MenuManager();
        this.userManager = new UserManager();
        this.aiService = new AIService();
        this.gameManager = new GameManager();
        this.downloadManager = new DownloadManager();
        this.appManager = new AppManager();
        this.adultManager = new AdultManager();
        this.wibuManager = new WibuManager();
        
        this.commands = new Map();
        this.setupCommands();
    }

    setupCommands() {
        // Basic commands
        this.commands.set('menu', this.handleMenu.bind(this));
        this.commands.set('help', this.handleMenu.bind(this));
        this.commands.set('start', this.handleStart.bind(this));
        this.commands.set('register', this.handleRegister.bind(this));
        this.commands.set('premium', this.handlePremium.bind(this));
        
        // AI commands
        this.commands.set('ai', this.handleAI.bind(this));
        this.commands.set('ask', this.handleAI.bind(this));
        
        // Game commands
        this.commands.set('game', this.handleGames.bind(this));
        this.commands.set('tebakgambar', this.handleTebakGambar.bind(this));
        this.commands.set('mathquiz', this.handleMathQuiz.bind(this));
        
        // Download commands
        this.commands.set('download', this.handleDownload.bind(this));
        this.commands.set('yt', this.handleYoutube.bind(this));
        this.commands.set('ig', this.handleInstagram.bind(this));
        this.commands.set('tiktok', this.handleTiktok.bind(this));
        
        // App commands
        this.commands.set('app', this.handleApps.bind(this));
        this.commands.set('ml', this.handleMobileLegends.bind(this));
        
        // Adult commands (premium only)
        this.commands.set('nsfw', this.handleNSFW.bind(this));
        this.commands.set('hentai', this.handleHentai.bind(this));
        
        // Wibu commands
        this.commands.set('wibu', this.handleWibu.bind(this));
        this.commands.set('anime', this.handleAnime.bind(this));
    }

    async handleMessage(message) {
        const jid = message.key.remoteJid;
        const text = this.extractText(message);
        
        // Check if user is registered
        const user = await this.userManager.getUser(jid);
        if (!user && !text?.startsWith('!register')) {
            return this.sendRegistrationPrompt(jid);
        }

        // Handle commands
        if (text?.startsWith('!')) {
            const command = text.slice(1).toLowerCase().split(' ')[0];
            const handler = this.commands.get(command);
            
            if (handler) {
                await handler(jid, message, text);
            } else {
                await this.handleAIResponse(jid, text.slice(1));
            }
        } else {
            // Auto-reply with AI for non-command messages
            await this.handleAIResponse(jid, text);
        }
    }

    async handleMenu(jid, message, text) {
        const user = await this.userManager.getUser(jid);
        const menu = await this.menuManager.generateMainMenu(user);
        
        await this.bot.sendMessage(jid, menu);
    }

    async handleStart(jid, message, text) {
        const welcomeMsg = {
            text: `🎉 *WELCOME TO ULTIMATE WHATSAPP BOT* 🎉\n\n` +
                  `🤖 *Advanced AI-Powered WhatsApp Bot*\n` +
                  `⭐ *Premium Features Available*\n` +
                  `🎮 *Games & Entertainment*\n` +
                  `📥 *Media Downloader*\n` +
                  `🎯 *Smart Auto-Reply*\n\n` +
                  `Type !menu to see all features!`,
            buttons: [
                { buttonId: '!menu', buttonText: { displayText: '📋 MAIN MENU' }, type: 1 },
                { buttonId: '!register', buttonText: { displayText: '📝 REGISTER' }, type: 1 }
            ]
        };
        
        await this.bot.sendMessage(jid, welcomeMsg);
    }

    async handleRegister(jid, message, text) {
        await this.userManager.startRegistration(jid, this.bot);
    }

    extractText(message) {
        return (
            message.message?.conversation ||
            message.message?.extendedTextMessage?.text ||
            message.message?.imageMessage?.caption ||
            ''
        );
    }

    async sendRegistrationPrompt(jid) {
        const prompt = {
            text: `🔐 *REGISTRATION REQUIRED*\n\n` +
                  `You need to register before using this bot.\n` +
                  `Click the button below to start registration.`,
            buttons: [
                { buttonId: '!register', buttonText: { displayText: '📝 REGISTER NOW' }, type: 1 }
            ]
        };
        
        await this.bot.sendMessage(jid, prompt);
    }
}

module.exports = MessageHandler;