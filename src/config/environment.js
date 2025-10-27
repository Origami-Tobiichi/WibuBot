const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

class Environment {
    static get(key, defaultValue = null) {
        return process.env[key] || defaultValue;
    }

    static set(key, value) {
        process.env[key] = value;
    }

    static getAll() {
        return {
            // Bot Configuration
            BOT_NAME: this.get('BOT_NAME', 'Ultimate WhatsApp Bot'),
            OWNER_NUMBER: this.get('OWNER_NUMBER', ''),
            PREFIX: this.get('PREFIX', '!'),
            
            // AI Configuration
            OPENAI_API_KEY: this.get('OPENAI_API_KEY', ''),
            AI_TEMPERATURE: parseFloat(this.get('AI_TEMPERATURE', '0.7')),
            AI_MAX_TOKENS: parseInt(this.get('AI_MAX_TOKENS', '500')),
            
            // API Keys
            GOOGLE_CLOUD_API_KEY: this.get('GOOGLE_CLOUD_API_KEY', ''),
            YOUTUBE_API_KEY: this.get('YOUTUBE_API_KEY', ''),
            
            // Database Configuration
            DB_PATH: this.get('DB_PATH', './data/database.json'),
            SESSION_PATH: this.get('SESSION_PATH', './data/sessions'),
            
            // Web Dashboard
            WEB_PORT: parseInt(this.get('WEB_PORT', '3000')),
            WEB_HOST: this.get('WEB_HOST', '0.0.0.0'),
            ADMIN_SECRET: this.get('ADMIN_SECRET', ''),
            
            // Security
            JWT_SECRET: this.get('JWT_SECRET', 'whatsapp-bot-jwt-secret'),
            ENCRYPTION_KEY: this.get('ENCRYPTION_KEY', 'whatsapp-bot-encryption-key'),
            
            // Feature Toggles
            ENABLE_NSFW: this.get('ENABLE_NSFW', 'true') === 'true',
            ENABLE_VOICE: this.get('ENABLE_VOICE', 'true') === 'true',
            ENABLE_GAMES: this.get('ENABLE_GAMES', 'true') === 'true',
            ENABLE_DOWNLOAD: this.get('ENABLE_DOWNLOAD', 'true') === 'true',
            ENABLE_WIBU: this.get('ENABLE_WIBU', 'true') === 'true',
            
            // Premium Settings
            PREMIUM_PRICE: this.get('PREMIUM_PRICE', '50000'),
            PREMIUM_DURATION: parseInt(this.get('PREMIUM_DURATION', '30')),
            
            // Logging
            LOG_LEVEL: this.get('LOG_LEVEL', 'INFO'),
            LOG_TO_FILE: this.get('LOG_TO_FILE', 'true') === 'true',
            
            // Deployment
            NODE_ENV: this.get('NODE_ENV', 'development'),
            DEPLOY_PLATFORM: this.get('DEPLOY_PLATFORM', 'local'),
            
            // Rate Limiting
            RATE_LIMIT_REQUESTS: parseInt(this.get('RATE_LIMIT_REQUESTS', '100')),
            RATE_LIMIT_WINDOW: parseInt(this.get('RATE_LIMIT_WINDOW', '900000')), // 15 minutes
            
            // External Services
            GOOGLE_TRANSLATE_API_KEY: this.get('GOOGLE_TRANSLATE_API_KEY', ''),
            DEEPL_API_KEY: this.get('DEEPL_API_KEY', '')
        };
    }

    static isProduction() {
        return this.get('NODE_ENV') === 'production';
    }

    static isDevelopment() {
        return this.get('NODE_ENV') === 'development';
    }

    static isTest() {
        return this.get('NODE_ENV') === 'test';
    }

    static validate() {
        const required = [
            'OWNER_NUMBER'
        ];

        const missing = required.filter(key => !this.get(key));
        
        if (missing.length > 0) {
            console.warn('⚠️  Environment variables missing:', missing);
            return false;
        }

        return true;
    }

    static getDatabaseConfig() {
        return {
            path: this.get('DB_PATH', './data/database.json'),
            backupPath: './data/backups',
            autoBackup: true,
            backupInterval: 24 * 60 * 60 * 1000 // 24 hours
        };
    }

    static getSessionConfig() {
        return {
            path: this.get('SESSION_PATH', './data/sessions'),
            cleanupInterval: 60 * 60 * 1000, // 1 hour
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        };
    }

    static getWebConfig() {
        return {
            port: this.get('WEB_PORT', 3000),
            host: this.get('WEB_HOST', '0.0.0.0'),
            cors: {
                origin: this.get('CORS_ORIGIN', '*'),
                methods: ['GET', 'POST', 'PUT', 'DELETE']
            },
            rateLimit: {
                windowMs: 15 * 60 * 1000, // 15 minutes
                max: 100 // limit each IP to 100 requests per windowMs
            }
        };
    }

    static getAIConfig() {
        return {
            apiKey: this.get('OPENAI_API_KEY'),
            model: this.get('AI_MODEL', 'gpt-3.5-turbo'),
            temperature: parseFloat(this.get('AI_TEMPERATURE', '0.7')),
            maxTokens: parseInt(this.get('AI_MAX_TOKENS', '500')),
            timeout: parseInt(this.get('AI_TIMEOUT', '30000'))
        };
    }

    static getDownloadConfig() {
        return {
            maxFileSize: 100 * 1024 * 1024, // 100MB
            maxVideoDuration: 3600, // 1 hour
            concurrentDownloads: 3,
            timeout: 300000, // 5 minutes
            tempDir: './data/temp'
        };
    }

    static getSecurityConfig() {
        return {
            jwtSecret: this.get('JWT_SECRET', 'whatsapp-bot-jwt-secret'),
            encryptionKey: this.get('ENCRYPTION_KEY', 'whatsapp-bot-encryption-key'),
            rateLimit: {
                requests: parseInt(this.get('RATE_LIMIT_REQUESTS', '100')),
                window: parseInt(this.get('RATE_LIMIT_WINDOW', '900000'))
            },
            allowedOrigins: this.get('ALLOWED_ORIGINS', '*').split(','),
            enableCORS: this.get('ENABLE_CORS', 'true') === 'true'
        };
    }

    static getFeatureFlags() {
        return {
            nsfw: this.get('ENABLE_NSFW', 'true') === 'true',
            voice: this.get('ENABLE_VOICE', 'true') === 'true',
            games: this.get('ENABLE_GAMES', 'true') === 'true',
            download: this.get('ENABLE_DOWNLOAD', 'true') === 'true',
            wibu: this.get('ENABLE_WIBU', 'true') === 'true',
            premium: this.get('ENABLE_PREMIUM', 'true') === 'true'
        };
    }

    static getDeploymentInfo() {
        const platform = this.get('DEPLOY_PLATFORM', 'local');
        
        const platforms = {
            vercel: {
                name: 'Vercel',
                url: this.get('VERCEL_URL'),
                region: this.get('VERCEL_REGION')
            },
            railway: {
                name: 'Railway',
                url: this.get('RAILWAY_STATIC_URL'),
                environment: this.get('RAILWAY_ENVIRONMENT')
            },
            koyeb: {
                name: 'Koyeb',
                url: this.get('KOYEB_APP_URL'),
                region: this.get('KOYEB_REGION')
            },
            replit: {
                name: 'Replit',
                url: this.get('REPLIT_DB_URL') ? 'https://' + this.get('REPLIT_SLUG') + '.repl.co' : null
            },
            local: {
                name: 'Local',
                url: `http://localhost:${this.get('WEB_PORT', 3000)}`
            }
        };

        return platforms[platform] || platforms.local;
    }

    static printConfig() {
        const config = this.getAll();
        const maskedConfig = { ...config };
        
        // Mask sensitive information
        if (maskedConfig.OPENAI_API_KEY) {
            maskedConfig.OPENAI_API_KEY = '***' + maskedConfig.OPENAI_API_KEY.slice(-4);
        }
        if (maskedConfig.JWT_SECRET) {
            maskedConfig.JWT_SECRET = '***' + maskedConfig.JWT_SECRET.slice(-4);
        }
        if (maskedConfig.ENCRYPTION_KEY) {
            maskedConfig.ENCRYPTION_KEY = '***' + maskedConfig.ENCRYPTION_KEY.slice(-4);
        }
        if (maskedConfig.ADMIN_SECRET) {
            maskedConfig.ADMIN_SECRET = '***' + maskedConfig.ADMIN_SECRET.slice(-4);
        }

        console.log('🔧 Environment Configuration:');
        console.log(JSON.stringify(maskedConfig, null, 2));
    }
}

module.exports = Environment;