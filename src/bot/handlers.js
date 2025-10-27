const UserManager = require('../registration/userManager');
const MenuManager = require('../menus/menuManager');
const SystemInfo = require('../utils/systemInfo');
const GameManager = require('../features/games/gameManager');

class MessageHandler {
    constructor(bot) {
        this.bot = bot;
        this.userManager = new UserManager();
        this.menuManager = new MenuManager();
        this.gameManager = new GameManager();
        this.buttonManager = bot.getButtonManager();
        
        // Initialize commands
        this.commands = {
            'menu': (message) => this.handleMenu(message),
            'help': (message) => this.handleHelp(message),
            'stats': (message) => this.handleStats(message),
            'register': (message) => this.handleRegister(message),
            'info': (message) => this.handleInfo(message),
            'wibu': (message) => this.handleWibu(message),
            'wallpaper': (message) => this.handleWallpaper(message),
            'game': (message) => this.handleGame(message),
            'buttons': (message) => this.handleButtons(message),
            'start': (message) => this.handleStart(message),
            'ping': (message) => this.handlePing(message)
        };
    }

    async handleMessage(message) {
        try {
            const { from, body, type, isGroup } = message;
            
            // Ignore messages without body
            if (!body) return;
            
            // FIXED: Better error handling for incrementStat
            try {
                await this.userManager.incrementStat(from, 'messagesSent');
            } catch (statError) {
                console.error('Error incrementing stat:', statError);
                // Continue processing message even if stat fails
            }
            
            // Check if user has active game (handle game answers)
            const activeGame = this.gameManager.getActiveGame(from);
            if (activeGame && body && !body.startsWith('!')) {
                const result = this.gameManager.checkAnswer(from, body);
                
                if (result.error) {
                    await this.bot.sendMessage(from, { text: result.error });
                } else {
                    await this.bot.sendMessage(from, { text: result.message });
                    
                    if (result.correct) {
                        // Give bonus EXP for winning
                        try {
                            await this.userManager.addExp(from, 10);
                        } catch (expError) {
                            console.error('Error adding EXP:', expError);
                        }
                    }
                }
                return;
            }
            
            // Check if it's a command
            if (body.startsWith('!')) {
                const command = body.slice(1).toLowerCase().split(' ')[0];
                
                if (this.commands[command]) {
                    await this.commands[command](message);
                } else {
                    await this.bot.sendMessage(from, { 
                        text: `❌ Command tidak dikenali. Ketik !help untuk melihat daftar command.` 
                    });
                }
            }
        } catch (error) {
            console.error('Error handling message:', error);
        }
    }

    async handleMenu(message) {
        try {
            const { from } = message;
            const user = await this.userManager.getOrCreateUser(from);
            
            // Send button menu
            const buttonMessage = this.buttonManager.getMainMenuButtons();
            await this.bot.sendButtonMessage(from, buttonMessage);

            // FIXED: Better error handling for incrementStat
            try {
                await this.userManager.incrementStat(from, 'commandsUsed');
            } catch (statError) {
                console.error('Error incrementing command stat:', statError);
            }
        } catch (error) {
            console.error('Error handling menu:', error);
            await this.bot.sendMessage(from, {
                text: '❌ Error generating menu. Please try again.'
            });
        }
    }

    async handleButtons(message) {
        try {
            const { from, body } = message;
            const args = body.split(' ').slice(1);
            const buttonType = args[0] || 'main';
            
            let buttonMessage;
            switch (buttonType) {
                case 'games':
                    buttonMessage = this.buttonManager.getGameButtons();
                    break;
                case 'tools':
                    buttonMessage = this.buttonManager.getToolButtons();
                    break;
                case 'wibu':
                    buttonMessage = this.buttonManager.getWibuButtons();
                    break;
                default:
                    buttonMessage = this.buttonManager.getMainMenuButtons();
            }
            
            await this.bot.sendButtonMessage(from, buttonMessage);
            
            // FIXED: Better error handling for incrementStat
            try {
                await this.userManager.incrementStat(from, 'commandsUsed');
            } catch (statError) {
                console.error('Error incrementing command stat:', statError);
            }
            
        } catch (error) {
            console.error('Error handling buttons:', error);
            await this.bot.sendMessage(from, {
                text: '❌ Error sending buttons. Please try again.'
            });
        }
    }

    async handleHelp(message) {
        const { from } = message;
        
        const helpText = `🆘 *BOT HELP MENU*

🤖 *Basic Commands:*
!menu - Show bot menu with buttons
!help - Show this help
!info - Bot information
!stats - Your statistics
!register - Register user
!ping - Check bot response

🎮 *Entertainment:*
!game - Games list
!wibu - Generate wibu image
!wallpaper - Create wallpaper

🛠️ *Tools:*
!buttons [type] - Show buttons (games/tools/wibu)

Type !menu for interactive buttons!`;

        await this.bot.sendMessage(from, { text: helpText });
        
        // FIXED: Better error handling for incrementStat
        try {
            await this.userManager.incrementStat(from, 'commandsUsed');
        } catch (statError) {
            console.error('Error incrementing command stat:', statError);
        }
    }

    async handleStats(message) {
        try {
            const { from } = message;
            const user = await this.userManager.getOrCreateUser(from);
            
            // For now, send text stats instead of image to avoid Jimp issues
            const statsText = `📊 *YOUR STATISTICS*

👤 Name: ${user.name}
⭐ Status: ${user.premium ? 'PREMIUM' : 'FREE'}
📅 Registered: ${new Date(user.registeredAt).toLocaleDateString()}
🎯 Level: ${user.level}
⚡ EXP: ${user.exp}/${user.level * 100}

📈 Activity:
💬 Messages: ${user.stats?.messagesSent || 0}
🎮 Games: ${user.stats?.gamesPlayed || 0}
📥 Downloads: ${user.stats?.downloads || 0}
🎵 Voice Notes: ${user.stats?.voiceNotes || 0}
🔢 Commands: ${user.stats?.commandsUsed || 0}

Keep using the bot to level up! 🚀`;

            await this.bot.sendMessage(from, { text: statsText });
            
            // FIXED: Better error handling for incrementStat
            try {
                await this.userManager.incrementStat(from, 'commandsUsed');
            } catch (statError) {
                console.error('Error incrementing command stat:', statError);
            }
        } catch (error) {
            console.error('Error handling stats:', error);
            await this.bot.sendMessage(from, {
                text: '❌ Error generating stats. Please try again.'
            });
        }
    }

    // ... (other methods remain the same with similar error handling)

    async handlePing(message) {
        const { from } = message;
        const start = Date.now();
        
        await this.bot.sendMessage(from, { text: '🏓 Pong!' });
        const latency = Date.now() - start;
        
        await this.bot.sendMessage(from, { 
            text: `⏱️ Latency: ${latency}ms\n✅ Status: Bot is running!` 
        });
        
        // FIXED: Better error handling for incrementStat
        try {
            await this.userManager.incrementStat(from, 'commandsUsed');
        } catch (statError) {
            console.error('Error incrementing command stat:', statError);
        }
    }
}

module.exports = MessageHandler;
