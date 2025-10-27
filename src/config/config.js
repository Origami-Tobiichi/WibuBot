const Environment = require('./environment');
const Constants = require('./constants');
const Security = require('./security');

class Config {
    constructor() {
        this.environment = new Environment();
        this.constants = Constants;
        this.security = new Security();
        this.loadConfig();
    }

    loadConfig() {
        this.botConfig = {
            name: this.environment.get('BOT_NAME', 'Ultimate WhatsApp Bot'),
            prefix: this.environment.get('PREFIX', '!'),
            ownerNumber: this.environment.get('OWNER_NUMBER', ''),
            version: '3.0.0',
            maxMessageLength: 4096,
            maxButtons: 3,
            maxButtonsPerRow: 3
        };

        this.aiConfig = {
            apiKey: this.environment.get('OPENAI_API_KEY', ''),
            model: this.environment.get('AI_MODEL', 'gpt-3.5-turbo'),
            temperature: parseFloat(this.environment.get('AI_TEMPERATURE', '0.7')),
            maxTokens: parseInt(this.environment.get('AI_MAX_TOKENS', '500')),
            timeout: parseInt(this.environment.get('AI_TIMEOUT', '30000')),
            enableMemory: true,
            maxMemoryEntries: 100
        };

        this.databaseConfig = {
            path: this.environment.get('DB_PATH', './data/database.json'),
            backupPath: './data/backups',
            autoBackup: true,
            backupInterval: 24 * 60 * 60 * 1000 // 24 hours
        };

        this.sessionConfig = {
            path: this.environment.get('SESSION_PATH', './data/sessions'),
            cleanupInterval: 60 * 60 * 1000, // 1 hour
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        };

        this.webConfig = {
            port: parseInt(this.environment.get('WEB_PORT', '3000')),
            host: this.environment.get('WEB_HOST', '0.0.0.0'),
            enable: true,
            cors: {
                origin: this.environment.get('CORS_ORIGIN', '*'),
                methods: ['GET', 'POST', 'PUT', 'DELETE']
            }
        };

        this.downloadConfig = {
            maxFileSize: 100 * 1024 * 1024, // 100MB
            maxVideoDuration: 3600, // 1 hour
            concurrentDownloads: 3,
            timeout: 300000, // 5 minutes
            tempDir: './data/temp'
        };

        this.gameConfig = {
            maxActiveGames: 5,
            gameTimeout: 300000, // 5 minutes
            maxScore: 1000000,
            dailyBonus: 100,
            levelExpRequirement: 100
        };

        this.premiumConfig = {
            priceBasic: 25000,
            pricePro: 50000,
            priceUltimate: 100000,
            durationDays: 30,
            maxPremiumUsers: 1000,
            features: {
                basic: ['NSFW Access', 'Priority Support'],
                pro: ['All Basic Features', 'Voice Notes', 'Early Access'],
                ultimate: ['All Pro Features', 'VIP Support', 'Bot Customization']
            }
        };

        this.securityConfig = {
            jwtSecret: this.environment.get('JWT_SECRET', 'whatsapp-bot-jwt-secret'),
            encryptionKey: this.environment.get('ENCRYPTION_KEY', 'whatsapp-bot-encryption-key'),
            rateLimit: {
                requests: parseInt(this.environment.get('RATE_LIMIT_REQUESTS', '100')),
                window: parseInt(this.environment.get('RATE_LIMIT_WINDOW', '900000'))
            },
            allowedOrigins: this.environment.get('ALLOWED_ORIGINS', '*').split(','),
            enableCORS: this.environment.get('ENABLE_CORS', 'true') === 'true'
        };

        this.featureFlags = {
            nsfw: this.environment.get('ENABLE_NSFW', 'true') === 'true',
            voice: this.environment.get('ENABLE_VOICE', 'true') === 'true',
            games: this.environment.get('ENABLE_GAMES', 'true') === 'true',
            download: this.environment.get('ENABLE_DOWNLOAD', 'true') === 'true',
            wibu: this.environment.get('ENABLE_WIBU', 'true') === 'true',
            premium: this.environment.get('ENABLE_PREMIUM', 'true') === 'true'
        };
    }

    getBotConfig() {
        return this.botConfig;
    }

    getAIConfig() {
        return this.aiConfig;
    }

    getDatabaseConfig() {
        return this.databaseConfig;
    }

    getSessionConfig() {
        return this.sessionConfig;
    }

    getWebConfig() {
        return this.webConfig;
    }

    getDownloadConfig() {
        return this.downloadConfig;
    }

    getGameConfig() {
        return this.gameConfig;
    }

    getPremiumConfig() {
        return this.premiumConfig;
    }

    getSecurityConfig() {
        return this.securityConfig;
    }

    getFeatureFlags() {
        return this.featureFlags;
    }

    validateConfig() {
        const errors = [];

        // Validate required configurations
        if (!this.botConfig.ownerNumber) {
            errors.push('OWNER_NUMBER is required');
        }

        if (this.featureFlags.nsfw && !this.securityConfig.jwtSecret) {
            errors.push('JWT_SECRET is required for NSFW features');
        }

        if (this.featureFlags.download && !this.downloadConfig.tempDir) {
            errors.push('Download temp directory is required');
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    updateConfig(section, key, value) {
        if (this[section] && this[section][key] !== undefined) {
            this[section][key] = value;
            return { success: true, message: `Config ${section}.${key} updated` };
        }
        return { success: false, message: `Config ${section}.${key} not found` };
    }

    getConfigSnapshot() {
        return {
            bot: { ...this.botConfig },
            ai: { ...this.aiConfig, apiKey: this.aiConfig.apiKey ? '***' + this.aiConfig.apiKey.slice(-4) : '' },
            database: { ...this.databaseConfig },
            session: { ...this.sessionConfig },
            web: { ...this.webConfig },
            download: { ...this.downloadConfig },
            game: { ...this.gameConfig },
            premium: { ...this.premiumConfig },
            security: { 
                ...this.securityConfig, 
                jwtSecret: '***' + this.securityConfig.jwtSecret.slice(-4),
                encryptionKey: '***' + this.securityConfig.encryptionKey.slice(-4)
            },
            features: { ...this.featureFlags },
            timestamp: new Date().toISOString()
        };
    }

    reloadConfig() {
        this.loadConfig();
        return { success: true, message: 'Configuration reloaded' };
    }

    getConfigStats() {
        const validation = this.validateConfig();
        
        return {
            valid: validation.valid,
            errors: validation.errors,
            sections: {
                bot: Object.keys(this.botConfig).length,
                ai: Object.keys(this.aiConfig).length,
                database: Object.keys(this.databaseConfig).length,
                session: Object.keys(this.sessionConfig).length,
                web: Object.keys(this.webConfig).length,
                download: Object.keys(this.downloadConfig).length,
                game: Object.keys(this.gameConfig).length,
                premium: Object.keys(this.premiumConfig).length,
                security: Object.keys(this.securityConfig).length,
                features: Object.keys(this.featureFlags).length
            },
            environment: process.env.NODE_ENV || 'development',
            version: this.botConfig.version
        };
    }
}

module.exports = Config;