const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode-terminal');

// Import handler
const MessageHandler = require('./handlers');

// Start health check server
require('./server');

class WhatsAppBot {
    constructor() {
        this.sock = null;
        this.messageHandler = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
    }

    async init() {
        try {
            console.log('🚀 Starting WhatsApp Bot...');
            
            const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
            const { version } = await fetchLatestBaileysVersion();
            
            this.sock = makeWASocket({
                auth: state,
                version,
                logger: pino({ level: 'warn' }),
                printQRInTerminal: false,
                browser: ['Ubuntu', 'Chrome', '20.0.04'],
                markOnlineOnConnect: true,
                generateHighQualityLinkPreview: true,
                syncFullHistory: false,
                retryRequestDelayMs: 2000,
                maxRetries: 3,
                connectTimeoutMs: 60000,
            });

            this.messageHandler = new MessageHandler(this);
            
            this.setupEventHandlers(saveCreds);
            console.log('✅ Bot initialized. Waiting for QR code...');
            
        } catch (error) {
            console.error('❌ Initialization failed:', error.message);
            this.handleInitError(error);
        }
    }

    setupEventHandlers(saveCreds) {
        this.sock.ev.on('connection.update', (update) => {
            this.handleConnectionUpdate(update);
        });

        this.sock.ev.on('creds.update', saveCreds);

        this.sock.ev.on('messages.upsert', (m) => {
            this.handleMessages(m);
        });
    }

    handleConnectionUpdate(update) {
        const { connection, lastDisconnect, qr, isNewLogin } = update;
        
        console.log('🔗 Connection update:', connection);
        
        // Handle QR Code
        if (qr) {
            console.log('\n'.repeat(2));
            console.log('📱 ==================================');
            console.log('📱 SCAN THIS QR CODE WITH WHATSAPP:');
            console.log('📱 ==================================');
            qrcode.generate(qr, { small: true });
            console.log('📱 ==================================');
            console.log('📱     SCAN WITH WHATSAPP APP       ');
            console.log('📱 ==================================');
            console.log('\n'.repeat(2));
        }

        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const error = lastDisconnect?.error;
            
            console.log('🔌 Connection closed. Status:', statusCode);

            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            
            if (shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
                this.reconnectAttempts++;
                const delay = Math.min(5000 * this.reconnectAttempts, 30000);
                console.log(`🔄 Reconnecting in ${delay/1000}s... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
                setTimeout(() => this.init(), delay);
            } else {
                console.log('❌ Max reconnection attempts or logged out');
                if (statusCode === DisconnectReason.loggedOut) {
                    console.log('🔄 Clearing auth data...');
                    this.clearAuthData();
                }
            }
            
        } else if (connection === 'open') {
            this.isConnected = true;
            this.reconnectAttempts = 0;
            console.log('✅ Connected to WhatsApp! Bot is ready.');
        } else if (connection === 'connecting') {
            console.log('🔄 Connecting to WhatsApp servers...');
        }
    }

    async handleMessages(m) {
        try {
            const message = m.messages[0];
            if (!message?.message) return;

            if (message.key.remoteJid === 'status@broadcast') return;

            const body = message.message.conversation || 
                        message.message.extendedTextMessage?.text || '';

            if (body) {
                const formattedMessage = {
                    from: message.key.remoteJid,
                    body: body,
                    pushName: message.pushName,
                    timestamp: message.messageTimestamp
                };

                await this.messageHandler.handleMessage(formattedMessage);
            }
        } catch (error) {
            console.error('Error handling message:', error);
        }
    }

    async sendMessage(to, content) {
        try {
            if (!this.isConnected) {
                console.log('⚠️ Bot not connected');
                return false;
            }
            await this.sock.sendMessage(to, content);
            return true;
        } catch (error) {
            console.error('❌ Send message failed:', error.message);
            return false;
        }
    }

    async sendButtonMessage(to, buttonMessage) {
        try {
            return await this.sendMessage(to, buttonMessage);
        } catch (error) {
            console.error('Error sending button message:', error);
            await this.sendMessage(to, { text: buttonMessage.text });
            return false;
        }
    }

    handleInitError(error) {
        console.error('💥 Init error:', error.message);
        
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = 10000;
            console.log(`🔄 Retrying in ${delay/1000}s... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            setTimeout(() => this.init(), delay);
        }
    }

    clearAuthData() {
        const fs = require('fs');
        
        try {
            const authDir = './auth_info';
            if (fs.existsSync(authDir)) {
                fs.rmSync(authDir, { recursive: true, force: true });
                console.log('🧹 Auth data cleared');
            }
            setTimeout(() => this.init(), 3000);
        } catch (error) {
            console.error('Error clearing auth data:', error);
        }
    }

    getButtonManager() {
        return {
            getMainMenuButtons: () => ({
                text: '🤖 *MAIN MENU*\n\nPilih opsi:',
                buttons: [
                    { buttonId: 'menu', buttonText: { displayText: '📱 Menu' }, type: 1 },
                    { buttonId: 'help', buttonText: { displayText: '❓ Help' }, type: 1 },
                    { buttonId: 'games', buttonText: { displayText: '🎮 Games' }, type: 1 }
                ],
                headerType: 1
            }),
            handleButtonResponse: (buttonId) => {
                const responses = {
                    'menu': '📱 *Menu Utama*\n\n• !help - Bantuan\n• !info - Info bot\n• !stats - Statistik',
                    'help': '❓ *Help*\n\nKetik !help untuk bantuan lengkap',
                    'games': '🎮 *Games*\n\nKetik !game untuk daftar game'
                };
                return responses[buttonId] || 'Button tidak dikenali';
            }
        };
    }
}

// Start bot
const bot = new WhatsAppBot();
bot.init();

// Process handlers
process.on('SIGTERM', () => {
    console.log('🛑 Received SIGTERM, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 Received SIGINT, shutting down gracefully...');
    process.exit(0);
});

process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
});

// Keep process alive
setInterval(() => {
    // Heartbeat to keep process alive
}, 60000);
