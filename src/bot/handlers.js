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
        
        // Initialize commands - FIXED: Remove setupCommands call
        this.commands = {
            'menu': this.handleMenu.bind(this),
            'help': this.handleHelp.bind(this),
            'stats': this.handleStats.bind(this),
            'register': this.handleRegister.bind(this),
            'info': this.handleInfo.bind(this),
            'wibu': this.handleWibu.bind(this),
            'wallpaper': this.handleWallpaper.bind(this),
            'game': this.handleGame.bind(this),
            'buttons': this.handleButtons.bind(this),
            'start': this.handleStart.bind(this),
            'ping': this.handlePing.bind(this)
        };
    }

    async handleMessage(message) {
        try {
            const { from, body, type, isGroup } = message;
            
            // Ignore messages without body
            if (!body) return;
            
            // Update user activity
            await this.userManager.incrementStat(from, 'messagesSent');
            
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
                        await this.userManager.addExp(from, 10);
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

            await this.userManager.incrementStat(from, 'commandsUsed');
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
            await this.userManager.incrementStat(from, 'commandsUsed');
            
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

📥 *Downloader:*
!yt [url] - Download YouTube
!tiktok [url] - Download TikTok
!ig [url] - Download Instagram

Type !menu for interactive buttons!`;

        await this.bot.sendMessage(from, { text: helpText });
        await this.userManager.incrementStat(from, 'commandsUsed');
    }

    async handleStats(message) {
        try {
            const { from } = message;
            const user = await this.userManager.getOrCreateUser(from);
            
            const statsImage = await this.menuManager.generateStats(user);
            
            await this.bot.sendMessage(from, {
                image: { url: `file://${statsImage}` },
                caption: '📊 *YOUR STATISTICS*'
            });

            await this.userManager.incrementStat(from, 'commandsUsed');
        } catch (error) {
            console.error('Error handling stats:', error);
            await this.bot.sendMessage(from, {
                text: '❌ Error generating stats. Please try again.'
            });
        }
    }

    async handleRegister(message) {
        try {
            const { from, pushName } = message;
            const user = await this.userManager.registerUser(from, { name: pushName });
            
            await this.bot.sendMessage(from, {
                text: `✅ *Registration Successful!*\n\n👤 Name: ${user.name}\n📅 Registered: ${new Date(user.registeredAt).toLocaleDateString()}\n⭐ Status: ${user.premium ? 'PREMIUM' : 'FREE'}\n\nUse !menu to see available features.`
            });

            await this.userManager.incrementStat(from, 'commandsUsed');
        } catch (error) {
            console.error('Error handling register:', error);
            await this.bot.sendMessage(from, {
                text: '❌ Error during registration. Please try again.'
            });
        }
    }

    async handleInfo(message) {
        const { from } = message;
        const systemInfo = SystemInfo.getSystemInfo();
        
        const infoText = `🤖 *BOT INFORMATION*

📱 *Version:* 3.0.0
⚡ *Uptime:* ${systemInfo.uptime}
💾 *Memory:* ${systemInfo.memory}
🖥️ *Platform:* ${systemInfo.platform}
🔢 *Node.js:* ${systemInfo.nodeVersion}

👥 *Total Users:* ${(await this.userManager.getAllUsers()).length}

🌐 *Developer:* WibuBot Team
📚 *Library:* Baileys MD`;

        await this.bot.sendMessage(from, { text: infoText });
        await this.userManager.incrementStat(from, 'commandsUsed');
    }

    async handleWibu(message) {
        try {
            const { from, body } = message;
            const args = body.split(' ').slice(1);
            
            const wibuData = {
                characterName: args[0] || 'Waifu',
                anime: args[1] || 'Unknown Anime',
                quote: args.slice(2).join(' ') || 'Kawaii desu ne!',
                type: 'waifu'
            };

            const wibuImage = await this.menuManager.imageGenerator.generateWibuImage(wibuData);
            
            await this.bot.sendMessage(from, {
                image: { url: `file://${wibuImage}` },
                caption: `🌸 *${wibuData.characterName}* from *${wibuData.anime}*`
            });

            await this.userManager.incrementStat(from, 'commandsUsed');
        } catch (error) {
            console.error('Error handling wibu:', error);
            await this.bot.sendMessage(from, {
                text: '❌ Error generating wibu image. Please try again.'
            });
        }
    }

    async handleWallpaper(message) {
        try {
            const { from, body } = message;
            const type = body.split(' ')[1] || 'default';
            
            const validTypes = ['default', 'premium', 'gaming', 'anime'];
            const wallpaperType = validTypes.includes(type) ? type : 'default';

            const wallpaperImage = await this.menuManager.imageGenerator.createWallpaper(wallpaperType);
            
            await this.bot.sendMessage(from, {
                image: { url: `file://${wallpaperImage}` },
                caption: `🎨 *${wallpaperType.toUpperCase()} WALLPAPER*`
            });

            await this.userManager.incrementStat(from, 'commandsUsed');
        } catch (error) {
            console.error('Error handling wallpaper:', error);
            await this.bot.sendMessage(from, {
                text: '❌ Error generating wallpaper. Please try again.'
            });
        }
    }

    async handleGame(message) {
        try {
            const { from, body } = message;
            const args = body.split(' ').slice(1);
            
            if (args.length === 0) {
                // Show game list with buttons
                const buttonMessage = this.buttonManager.getGameButtons();
                await this.bot.sendButtonMessage(from, buttonMessage);
                return;
            }

            const gameType = args[0].toLowerCase();
            
            // Check if user has active game
            const activeGame = this.gameManager.getActiveGame(from);
            if (activeGame && args[0] !== 'stop') {
                await this.bot.sendMessage(from, {
                    text: `Kamu masih dalam game *${activeGame.gameType}*. Ketik !game stop untuk menghentikan game saat ini.`
                });
                return;
            }

            if (gameType === 'stop') {
                const result = this.gameManager.endGame(from);
                await this.bot.sendMessage(from, { text: result });
                return;
            }

            // Start new game
            const result = this.gameManager.startGame(from, gameType);
            
            if (result.error) {
                await this.bot.sendMessage(from, { 
                    text: `❌ ${result.error}\n\nKetik !game untuk melihat daftar game.` 
                });
                return;
            }

            const gameData = result.data;
            let gameText = `🎮 *MEMULAI GAME ${gameType.toUpperCase()}*\n\n`;
            
            if (gameType === 'tebakgambar') {
                gameText += `${gameData.image}\n`;
            }
            
            gameText += `❓ ${gameData.question}\n\n`;
            gameText += `⚡ Tebak jawabannya dengan mengetik jawaban kamu!\n`;
            gameText += `📝 Kamu punya ${gameData.maxAttempts} kesempatan\n\n`;
            gameText += `⏹️ Ketik !game stop untuk menghentikan game`;

            await this.bot.sendMessage(from, { text: gameText });
            await this.userManager.incrementStat(from, 'gamesPlayed');

        } catch (error) {
            console.error('Error handling game:', error);
            await this.bot.sendMessage(from, {
                text: '❌ Error memulai game. Silakan coba lagi.'
            });
        }
    }

    async handleStart(message) {
        const { from, pushName } = message;
        
        const welcomeText = `👋 *Halo ${pushName || 'User'}!*

Selamat datang di *WhatsApp Bot Ultimate*! 🤖

Saya adalah bot WhatsApp dengan berbagai fitur menarik:

🎮 *Games* - Tebak kata, tebak gambar, dll
🌸 *Wibu Mode* - Generate karakter anime
🛠️ *Tools* - Downloader, converter, dll
📊 *Statistics* - Track aktivitas kamu

Ketik !menu untuk melihat menu lengkap
Ketik !help untuk bantuan
Ketik !register untuk mendaftar

*Enjoy using the bot!* 😊`;

        await this.bot.sendMessage(from, { text: welcomeText });
        await this.userManager.getOrCreateUser(from, { name: pushName });
    }

    async handlePing(message) {
        const { from } = message;
        const start = Date.now();
        
        await this.bot.sendMessage(from, { text: '🏓 Pong!' });
        const latency = Date.now() - start;
        
        await this.bot.sendMessage(from, { 
            text: `⏱️ *Latency:* ${latency}ms\n✅ *Status:* Bot is running!` 
        });
        
        await this.userManager.incrementStat(from, 'commandsUsed');
    }
}

module.exports = MessageHandler;
