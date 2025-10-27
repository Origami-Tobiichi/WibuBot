const fs = require('fs').promises;
const path = require('path');
const ImageGenerator = require('./imageGenerator');

class TemplateManager {
    constructor() {
        this.templatesDir = './data/templates';
        this.imageGenerator = new ImageGenerator();
        this.templates = new Map();
        this.loadTemplates();
    }

    async loadTemplates() {
        try {
            await fs.mkdir(this.templatesDir, { recursive: true });
            
            const templateFiles = await fs.readdir(this.templatesDir);
            
            for (const file of templateFiles) {
                if (file.endsWith('.json')) {
                    const templatePath = path.join(this.templatesDir, file);
                    const templateData = await fs.readFile(templatePath, 'utf8');
                    const template = JSON.parse(templateData);
                    
                    this.templates.set(template.id, template);
                }
            }
            
            // Load default templates if none exist
            if (this.templates.size === 0) {
                await this.createDefaultTemplates();
            }
            
        } catch (error) {
            console.error('Error loading templates:', error);
            await this.createDefaultTemplates();
        }
    }

    async createDefaultTemplates() {
        const defaultTemplates = [
            {
                id: 'welcome_message',
                name: 'Welcome Message',
                type: 'text',
                content: {
                    text: `🎉 *SELAMAT DATANG* 🎉\n\n` +
                         `Halo {username}! 👋\n\n` +
                         `Saya adalah *{bot_name}*, bot WhatsApp canggih dengan berbagai fitur:\n\n` +
                         `🤖 AI Chat & Auto Reply\n` +
                         `🎮 Games & Entertainment\n` +
                         `📥 Media Downloader\n` +
                         `📱 App Integration\n` +
                         `🇯🇵 Wibu/Anime Mode\n` +
                         `⭐ Premium Features\n\n` +
                         `Ketik *!menu* untuk melihat semua fitur!\n` +
                         `Ketik *!help* untuk bantuan\n\n` +
                         `Selamat menggunakan! 🚀`,
                    variables: ['username', 'bot_name']
                },
                category: 'welcome'
            },
            {
                id: 'premium_benefits',
                name: 'Premium Benefits',
                type: 'button',
                content: {
                    text: `⭐ *PREMIUM BENEFITS* ⭐\n\n` +
                         `Upgrade ke premium untuk mendapatkan:\n\n` +
                         `✅ Akses NSFW/Adult Content\n` +
                         `✅ Priority Support\n` +
                         `✅ Unlimited AI Requests\n` +
                         `✅ Early Access Features\n` +
                         `✅ Custom Commands\n` +
                         `✅ No Ads\n\n` +
                         `💎 Harga: Rp {premium_price}/bulan`,
                    buttons: [
                        [
                            { buttonId: '!premium buy', buttonText: { displayText: '💰 BELI PREMIUM' }, type: 1 },
                            { buttonId: '!premium info', buttonText: { displayText: '📋 INFO LENGKAP' }, type: 1 }
                        ]
                    ],
                    variables: ['premium_price']
                },
                category: 'premium'
            },
            {
                id: 'game_selection',
                name: 'Game Selection',
                type: 'button',
                content: {
                    text: `🎮 *GAME SELECTION* 🎮\n\n` +
                         `Pilih game yang ingin dimainkan:\n\n` +
                         `Semua game gratis untuk dimain! 🎯`,
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
                    ],
                    variables: []
                },
                category: 'games'
            },
            {
                id: 'download_options',
                name: 'Download Options',
                type: 'button',
                content: {
                    text: `📥 *DOWNLOAD OPTIONS* 📥\n\n` +
                         `Pilih platform download:\n\n` +
                         `Support YouTube, Instagram, TikTok, dan lainnya!`,
                    buttons: [
                        [
                            { buttonId: '!yt', buttonText: { displayText: '📺 YOUTUBE' }, type: 1 },
                            { buttonId: '!ig', buttonText: { displayText: '📷 INSTAGRAM' }, type: 1 }
                        ],
                        [
                            { buttonId: '!tiktok', buttonText: { displayText: '🎵 TIKTOK' }, type: 1 },
                            { buttonId: '!download help', buttonText: { displayText: '❓ BANTUAN' }, type: 1 }
                        ]
                    ],
                    variables: []
                },
                category: 'download'
            }
        ];

        for (const template of defaultTemplates) {
            this.templates.set(template.id, template);
            await this.saveTemplate(template);
        }
    }

    async saveTemplate(template) {
        try {
            const templatePath = path.join(this.templatesDir, `${template.id}.json`);
            await fs.writeFile(templatePath, JSON.stringify(template, null, 2));
        } catch (error) {
            console.error('Error saving template:', error);
        }
    }

    async getTemplate(templateId, variables = {}) {
        const template = this.templates.get(templateId);
        if (!template) {
            return null;
        }

        return this.renderTemplate(template, variables);
    }

    renderTemplate(template, variables) {
        let rendered = JSON.parse(JSON.stringify(template));
        
        // Replace variables in text
        if (rendered.content.text) {
            let text = rendered.content.text;
            for (const [key, value] of Object.entries(variables)) {
                text = text.replace(new RegExp(`{${key}}`, 'g'), value);
            }
            rendered.content.text = text;
        }

        return rendered.content;
    }

    async createTemplate(templateData) {
        const newTemplate = {
            id: templateData.id || `template_${Date.now()}`,
            name: templateData.name,
            type: templateData.type,
            content: templateData.content,
            category: templateData.category || 'custom',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.templates.set(newTemplate.id, newTemplate);
        await this.saveTemplate(newTemplate);

        return {
            success: true,
            message: `Template "${newTemplate.name}" berhasil dibuat!`,
            template: newTemplate
        };
    }

    async updateTemplate(templateId, updates) {
        const template = this.templates.get(templateId);
        if (!template) {
            return { success: false, message: 'Template tidak ditemukan!' };
        }

        Object.assign(template, updates, {
            updatedAt: new Date().toISOString()
        });

        this.templates.set(templateId, template);
        await this.saveTemplate(template);

        return {
            success: true,
            message: `Template "${template.name}" berhasil diupdate!`,
            template: template
        };
    }

    async deleteTemplate(templateId) {
        if (!this.templates.has(templateId)) {
            return { success: false, message: 'Template tidak ditemukan!' };
        }

        this.templates.delete(templateId);
        
        try {
            const templatePath = path.join(this.templatesDir, `${templateId}.json`);
            await fs.unlink(templatePath);
        } catch (error) {
            console.error('Error deleting template file:', error);
        }

        return { success: true, message: 'Template berhasil dihapus!' };
    }

    getAllTemplates() {
        return Array.from(this.templates.values());
    }

    getTemplatesByCategory(category) {
        return this.getAllTemplates().filter(template => 
            template.category === category
        );
    }

    async generateImageTemplate(templateId, variables = {}) {
        try {
            const template = await this.getTemplate(templateId, variables);
            if (!template) {
                return null;
            }

            // Generate image based on template
            const imagePath = await this.imageGenerator.generateMenuImage({
                username: variables.username || 'User',
                premium: variables.premium || false,
                systemInfo: variables.systemInfo || {},
                theme: variables.theme || 'default'
            });

            return {
                image: imagePath,
                caption: template.text,
                buttons: template.buttons || []
            };

        } catch (error) {
            console.error('Error generating image template:', error);
            return null;
        }
    }

    async exportTemplates() {
        const templates = this.getAllTemplates();
        const exportData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            templateCount: templates.length,
            templates: templates
        };

        return exportData;
    }

    async importTemplates(importData) {
        try {
            let importedCount = 0;
            let updatedCount = 0;

            for (const template of importData.templates) {
                if (this.templates.has(template.id)) {
                    // Update existing template
                    await this.updateTemplate(template.id, template);
                    updatedCount++;
                } else {
                    // Create new template
                    await this.createTemplate(template);
                    importedCount++;
                }
            }

            return {
                success: true,
                message: `Import berhasil! ${importedCount} template baru, ${updatedCount} template diupdate.`,
                stats: {
                    imported: importedCount,
                    updated: updatedCount,
                    total: this.templates.size
                }
            };

        } catch (error) {
            return {
                success: false,
                message: 'Error importing templates: ' + error.message
            };
        }
    }

    getTemplateStats() {
        const templates = this.getAllTemplates();
        const categories = {};
        
        templates.forEach(template => {
            categories[template.category] = (categories[template.category] || 0) + 1;
        });

        return {
            totalTemplates: templates.length,
            byType: {
                text: templates.filter(t => t.type === 'text').length,
                button: templates.filter(t => t.type === 'button').length,
                image: templates.filter(t => t.type === 'image').length
            },
            byCategory: categories,
            lastUpdated: templates.reduce((latest, template) => 
                new Date(template.updatedAt) > new Date(latest) ? template.updatedAt : latest, 
                new Date(0).toISOString()
            )
        };
    }

    // Specialized template methods
    async getWelcomeTemplate(userData) {
        return await this.getTemplate('welcome_message', {
            username: userData.username || 'User',
            bot_name: process.env.BOT_NAME || 'Ultimate WhatsApp Bot'
        });
    }

    async getPremiumTemplate(userData) {
        return await this.getTemplate('premium_benefits', {
            premium_price: process.env.PREMIUM_PRICE || '50,000'
        });
    }

    async getGameTemplate() {
        return await this.getTemplate('game_selection', {});
    }

    async getDownloadTemplate() {
        return await this.getTemplate('download_options', {});
    }

    // Search templates
    searchTemplates(query) {
        const results = [];
        const lowerQuery = query.toLowerCase();

        for (const template of this.getAllTemplates()) {
            if (template.name.toLowerCase().includes(lowerQuery) ||
                template.id.toLowerCase().includes(lowerQuery) ||
                template.category.toLowerCase().includes(lowerQuery) ||
                template.content.text.toLowerCase().includes(lowerQuery)) {
                results.push(template);
            }
        }

        return results;
    }

    // Backup and restore
    async backupTemplates(backupPath = './data/backups/templates') {
        try {
            await fs.mkdir(backupPath, { recursive: true });
            const backupFile = path.join(backupPath, `templates_backup_${Date.now()}.json`);
            const exportData = await this.exportTemplates();
            
            await fs.writeFile(backupFile, JSON.stringify(exportData, null, 2));
            return { success: true, backupFile: backupFile };

        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async restoreFromBackup(backupFile) {
        try {
            const backupData = await fs.readFile(backupFile, 'utf8');
            const importData = JSON.parse(backupData);
            
            return await this.importTemplates(importData);

        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

module.exports = TemplateManager;