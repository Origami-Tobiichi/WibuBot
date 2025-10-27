const { getContentType } = require('@whiskeysockets/baileys');

class ButtonManager {
    constructor() {
        this.buttonTemplates = new Map();
        this.buttonSessions = new Map();
        this.loadButtonTemplates();
    }

    loadButtonTemplates() {
        // Predefined button templates
        this.buttonTemplates.set('main_menu', {
            name: 'Main Menu',
            buttons: [
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
            ]
        });

        this.buttonTemplates.set('game_menu', {
            name: 'Game Menu',
            buttons: [
                [
                    { buttonId: '!tebakgambar', buttonText: { displayText: '🖼️ TEBAK GAMBAR' }, type: 1 },
                    { buttonId: '!mathquiz', buttonText: { displayText: '🧮 MATH QUIZ' }, type: 1 }
                ],
                [
                    { buttonId: '!tebakkata', buttonText: { displayText: '📝 TEBAK KATA' }, type: 1 },
                    { buttonId: '!slot', buttonText: { displayText: '🎰 SLOT MACHINE' }, type: 1 }
                ],
                [
                    { buttonId: '!rpg', buttonText: { displayText: '⚔️ RPG GAME' }, type: 1 },
                    { buttonId: '!menu', buttonText: { displayText: '📋 MAIN MENU' }, type: 1 }
                ]
            ]
        });

        this.buttonTemplates.set('download_menu', {
            name: 'Download Menu',
            buttons: [
                [
                    { buttonId: '!yt', buttonText: { displayText: '📺 YOUTUBE' }, type: 1 },
                    { buttonId: '!ig', buttonText: { displayText: '📷 INSTAGRAM' }, type: 1 }
                ],
                [
                    { buttonId: '!tiktok', buttonText: { displayText: '🎵 TIKTOK' }, type: 1 },
                    { buttonId: '!download help', buttonText: { displayText: '❓ BANTUAN' }, type: 1 }
                ]
            ]
        });

        this.buttonTemplates.set('premium_menu', {
            name: 'Premium Menu',
            buttons: [
                [
                    { buttonId: '!premium buy', buttonText: { displayText: '💰 BELI PREMIUM' }, type: 1 },
                    { buttonId: '!premium info', buttonText: { displayText: '📋 INFO LENGKAP' }, type: 1 }
                ],
                [
                    { buttonId: '!premium features', buttonText: { displayText: '⭐ FITUR PREMIUM' }, type: 1 },
                    { buttonId: '!menu', buttonText: { displayText: '📋 MAIN MENU' }, type: 1 }
                ]
            ]
        });

        this.buttonTemplates.set('wibu_menu', {
            name: 'Wibu Menu',
            buttons: [
                [
                    { buttonId: '!anime quote', buttonText: { displayText: '📜 ANIME QUOTE' }, type: 1 },
                    { buttonId: '!anime waifu', buttonText: { displayText: '🎨 WAIFU GENERATOR' }, type: 1 }
                ],
                [
                    { buttonId: '!anime translate', buttonText: { displayText: '🇯🇵 TRANSLATE' }, type: 1 },
                    { buttonId: '!anime fact', buttonText: { displayText: '🎎 ANIME FACT' }, type: 1 }
                ],
                [
                    { buttonId: '!anime recommend', buttonText: { displayText: '📺 RECOMMEND' }, type: 1 },
                    { buttonId: '!menu', buttonText: { displayText: '📋 MAIN MENU' }, type: 1 }
                ]
            ]
        });

        this.buttonTemplates.set('nsfw_menu', {
            name: 'NSFW Menu',
            buttons: [
                [
                    { buttonId: '!nsfw images waifu', buttonText: { displayText: '🎨 WAIFU NSFW' }, type: 1 },
                    { buttonId: '!nsfw images neko', buttonText: { displayText: '🐱 NEKO NSFW' }, type: 1 }
                ],
                [
                    { buttonId: '!nsfw hentai random', buttonText: { displayText: '💖 HENTAI' }, type: 1 },
                    { buttonId: '!nsfw gifs random', buttonText: { displayText: '🎬 GIFS NSFW' }, type: 1 }
                ],
                [
                    { buttonId: '!nsfw help', buttonText: { displayText: '❓ HELP NSFW' }, type: 1 },
                    { buttonId: '!menu', buttonText: { displayText: '📋 MAIN MENU' }, type: 1 }
                ]
            ]
        });
    }

    createButtonMessage(text, buttons, options = {}) {
        const message = {
            text: text,
            buttons: buttons
        };

        // Add footer if provided
        if (options.footer) {
            message.footer = options.footer;
        }

        // Add header if provided
        if (options.header) {
            message.text = `*${options.header}*\n\n${message.text}`;
        }

        // Add image if provided
        if (options.image) {
            message.image = { url: options.image };
            if (options.caption) {
                message.caption = message.text;
                delete message.text;
            }
        }

        return message;
    }

    getTemplate(templateName) {
        return this.buttonTemplates.get(templateName);
    }

    createMainMenu(userData = {}) {
        const template = this.getTemplate('main_menu');
        let text = `🤖 *ULTIMATE WHATSAPP BOT MENU* 🤖\n\n`;

        if (userData.username) {
            text += `👤 User: ${userData.username}\n`;
            text += `⭐ Status: ${userData.premium ? 'PREMIUM' : 'FREE'}\n`;
            text += `🎯 Level: ${userData.level || 1}\n\n`;
        }

        text += `📊 *Available Features:*\n`;
        text += `• 🤖 AI Chat & Auto Reply\n`;
        text += `• 🎮 Games & Entertainment\n`;
        text += `• 📥 Media Downloader\n`;
        text += `• 📱 App Integration\n`;
        text += `• 🇯🇵 Wibu/Anime Mode\n`;
        text += `• ⭐ Premium Features\n\n`;
        text += `*Pilih menu di bawah:*`;

        return this.createButtonMessage(text, template.buttons, {
            footer: 'Bot WhatsApp Ultimate © 2024'
        });
    }

    createGameMenu() {
        const template = this.getTemplate('game_menu');
        const text = `🎮 *GAME SELECTION* 🎮\n\n` +
                   `Pilih game yang ingin dimainkan:\n\n` +
                   `🎯 Semua game gratis untuk dimain!\n` +
                   `⭐ Dapatkan EXP dan level up!`;

        return this.createButtonMessage(text, template.buttons, {
            footer: 'Klik game favorit Anda!'
        });
    }

    createDownloadMenu() {
        const template = this.getTemplate('download_menu');
        const text = `📥 *DOWNLOAD OPTIONS* 📥\n\n` +
                   `Pilih platform download:\n\n` +
                   `✅ Support YouTube, Instagram, TikTok\n` +
                   `✅ Convert MP4/MP3\n` +
                   `✅ High quality download`;

        return this.createButtonMessage(text, template.buttons, {
            footer: 'Paste link video setelah pilih platform'
        });
    }

    createPremiumMenu(userData = {}) {
        const template = this.getTemplate('premium_menu');
        let text = `⭐ *PREMIUM FEATURES* ⭐\n\n`;

        if (userData.premium) {
            text += `🎉 Anda adalah user PREMIUM!\n\n`;
            text += `✅ Akses penuh semua fitur\n`;
            text += `✅ Priority support\n`;
            text += `✅ Unlimited requests\n`;
            text += `✅ Early access features\n\n`;
            text += `💎 Terima kasih telah berlangganan!`;
        } else {
            text += `Upgrade ke premium untuk mendapatkan:\n\n`;
            text += `✅ Akses NSFW/Adult Content\n`;
            text += `✅ Priority Support\n`;
            text += `✅ Unlimited AI Requests\n`;
            text += `✅ Early Access Features\n`;
            text += `✅ Custom Commands\n`;
            text += `✅ No Ads\n\n`;
            text += `💎 Harga: Rp 50.000/bulan`;
        }

        return this.createButtonMessage(text, template.buttons, {
            footer: 'Klik untuk info lebih lanjut'
        });
    }

    createWibuMenu() {
        const template = this.getTemplate('wibu_menu');
        const text = `🌸 *WIBU/ANIME MODE* 🌸\n\n` +
                   `Mode wibu aktif! Pilih fitur:\n\n` +
                   `🎌 Anime quotes & facts\n` +
                   `🎨 Waifu/husbando generator\n` +
                   `🇯🇵 Japanese translator\n` +
                   `📺 Anime recommendations\n\n` +
                   `*Konnichiwa, Senpai!* 🎎`;

        return this.createButtonMessage(text, template.buttons, {
            footer: 'Enjoy your weeb journey!'
        });
    }

    createNSFWMenu() {
        const template = this.getTemplate('nsfw_menu');
        const text = `🔞 *NSFW CONTENT MENU* 🔞\n\n` +
                   `*PERINGATAN:* Konten 18+ hanya untuk dewasa!\n\n` +
                   `🎨 Gambar NSFW berbagai kategori\n` +
                   `💖 Konten hentai\n` +
                   `🎬 GIF NSFW\n\n` +
                   `⚠️ *Gunakan dengan bijak!*`;

        return this.createButtonMessage(text, template.buttons, {
            footer: 'Age verification required'
        });
    }

    createCustomButtons(text, buttonConfig, options = {}) {
        let buttons = [];

        // Convert different button formats to standard format
        if (Array.isArray(buttonConfig)) {
            buttons = buttonConfig.map(row => {
                if (Array.isArray(row)) {
                    return row.map(btn => this.normalizeButton(btn));
                }
                return [this.normalizeButton(row)];
            });
        } else if (typeof buttonConfig === 'object') {
            // Single button
            buttons = [[this.normalizeButton(buttonConfig)]];
        }

        return this.createButtonMessage(text, buttons, options);
    }

    normalizeButton(button) {
        if (typeof button === 'string') {
            return {
                buttonId: button,
                buttonText: { displayText: button },
                type: 1
            };
        }

        // Ensure button has required properties
        return {
            buttonId: button.buttonId || 'default',
            buttonText: button.buttonText || { displayText: 'Button' },
            type: button.type || 1
        };
    }

    createPaginationButtons(currentPage, totalPages, prefix = 'page') {
        const buttons = [];
        const row = [];

        if (currentPage > 1) {
            row.push({
                buttonId: `${prefix} ${currentPage - 1}`,
                buttonText: { displayText: '⬅️ Previous' },
                type: 1
            });
        }

        row.push({
            buttonId: `${prefix} info`,
            buttonText: { displayText: `📄 ${currentPage}/${totalPages}` },
            type: 1
        });

        if (currentPage < totalPages) {
            row.push({
                buttonId: `${prefix} ${currentPage + 1}`,
                buttonText: { displayText: 'Next ➡️' },
                type: 1
            });
        }

        buttons.push(row);

        // Add navigation buttons
        buttons.push([
            {
                buttonId: '!menu',
                buttonText: { displayText: '📋 Main Menu' },
                type: 1
            },
            {
                buttonId: '!help',
                buttonText: { displayText: '❓ Help' },
                type: 1
            }
        ]);

        return buttons;
    }

    createConfirmationButtons(confirmId, cancelId = 'cancel') {
        return [
            [
                {
                    buttonId: confirmId,
                    buttonText: { displayText: '✅ Ya' },
                    type: 1
                },
                {
                    buttonId: cancelId,
                    buttonText: { displayText: '❌ Tidak' },
                    type: 1
                }
            ]
        ];
    }

    createQuickActions(actions) {
        const buttons = [];
        let currentRow = [];

        actions.forEach((action, index) => {
            currentRow.push({
                buttonId: action.command,
                buttonText: { displayText: action.emoji ? `${action.emoji} ${action.text}` : action.text },
                type: 1
            });

            // Max 3 buttons per row
            if (currentRow.length === 3 || index === actions.length - 1) {
                buttons.push(currentRow);
                currentRow = [];
            }
        });

        return buttons;
    }

    // Session management for interactive buttons
    createButtonSession(jid, sessionData) {
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        this.buttonSessions.set(sessionId, {
            jid: jid,
            createdAt: Date.now(),
            expiresAt: Date.now() + (10 * 60 * 1000), // 10 minutes
            data: sessionData
        });

        return sessionId;
    }

    getButtonSession(sessionId) {
        const session = this.buttonSessions.get(sessionId);
        
        if (!session) return null;
        
        // Check if session expired
        if (Date.now() > session.expiresAt) {
            this.buttonSessions.delete(sessionId);
            return null;
        }

        return session;
    }

    updateButtonSession(sessionId, updates) {
        const session = this.buttonSessions.get(sessionId);
        if (session) {
            Object.assign(session.data, updates);
            session.expiresAt = Date.now() + (10 * 60 * 1000); // Reset expiry
            return true;
        }
        return false;
    }

    deleteButtonSession(sessionId) {
        return this.buttonSessions.delete(sessionId);
    }

    cleanupExpiredSessions() {
        const now = Date.now();
        let cleanedCount = 0;

        for (const [sessionId, session] of this.buttonSessions.entries()) {
            if (now > session.expiresAt) {
                this.buttonSessions.delete(sessionId);
                cleanedCount++;
            }
        }

        return cleanedCount;
    }

    // Template management
    addButtonTemplate(name, buttons) {
        this.buttonTemplates.set(name, {
            name: name,
            buttons: buttons,
            createdAt: new Date().toISOString()
        });
        return true;
    }

    removeButtonTemplate(name) {
        return this.buttonTemplates.delete(name);
    }

    getAvailableTemplates() {
        return Array.from(this.buttonTemplates.entries()).map(([name, template]) => ({
            name: name,
            buttonCount: template.buttons.flat().length,
            createdAt: template.createdAt
        }));
    }

    validateButtons(buttons) {
        const errors = [];

        if (!Array.isArray(buttons)) {
            errors.push('Buttons must be an array');
            return { valid: false, errors };
        }

        let totalButtons = 0;

        for (const row of buttons) {
            if (!Array.isArray(row)) {
                errors.push('Each row must be an array of buttons');
                continue;
            }

            if (row.length > 3) {
                errors.push('Maximum 3 buttons per row');
            }

            for (const button of row) {
                totalButtons++;

                if (!button.buttonId) {
                    errors.push('Button missing buttonId');
                }

                if (!button.buttonText || !button.buttonText.displayText) {
                    errors.push('Button missing displayText');
                }

                if (button.buttonId.length > 256) {
                    errors.push('Button ID too long');
                }

                if (button.buttonText.displayText.length > 20) {
                    errors.push('Button text too long');
                }
            }
        }

        if (totalButtons > 10) {
            errors.push('Maximum 10 buttons total');
        }

        return {
            valid: errors.length === 0,
            errors: errors,
            stats: {
                rows: buttons.length,
                totalButtons: totalButtons
            }
        };
    }

    getButtonManagerStats() {
        return {
            templates: this.buttonTemplates.size,
            activeSessions: this.buttonSessions.size,
            availableTemplates: this.getAvailableTemplates().length
        };
    }
}

module.exports = ButtonManager;
