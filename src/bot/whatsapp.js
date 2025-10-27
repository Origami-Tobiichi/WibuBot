const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers } = require('@whiskeysockets/baileys');
const pino = require('pino');
const { Boom } = require('@hapi/boom');
const qrcode = require('qrcode-terminal');
const path = require('path');
const fs = require('fs').promises;

// Import handlers and managers
const MessageHandler = require('./handlers');
const ButtonManager = require('./buttonManager');

class WhatsAppBot {
    constructor() {
        this.sock = null;
        this.messageHandler = null;
        this.buttonManager = new ButtonManager();
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
    }

    async init() {
        try {
            console.log('🚀 Initializing WhatsApp Bot...');
            
            // Ensure auth directory exists
            await this.ensureAuthDirectory();
            
            const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
            
            this.sock = makeWASocket({
                auth: state,
                logger: pino({ level: 'warn' }),
                browser: Browsers.ubuntu('Chrome'),
                markOnlineOnConnect: true,
                generateHighQualityLinkPreview: true,
                syncFullHistory: false,
            });

            this.messageHandler = new MessageHandler(this);
            
            this.setupEventHandlers(saveCreds);
            console.log('✅ WhatsApp Bot initialized successfully');
            
        } catch (error) {
            console.error('❌ Error initializing bot:', error);
            this.handleInitError(error);
        }
    }

    async ensureAuthDirectory() {
        try {
            await fs.mkdir('./auth_info', { recursive: true });
        } catch (error) {
            console.error('Error creating auth directory:', error);
        }
    }

    setupEventHandlers(saveCreds) {
        // Connection update handler
        this.sock.ev.on('connection.update', (update) => {
            this.handleConnectionUpdate(update);
        });

        // Credentials update handler
        this.sock.ev.on('creds.update', saveCreds);

        // Messages handler
        this.sock.ev.on('messages.upsert', (m) => {
            this.handleMessagesUpsert(m);
        });
    }

    handleConnectionUpdate(update) {
        const { connection, lastDisconnect, qr } = update;
        
        // Handle QR code generation
        if (qr) {
            console.log('📱 Scan QR Code below:');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            
            console.log(`🔌 Connection closed. Status: ${statusCode}, Reconnecting: ${shouldReconnect}`);
            
            if (shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
                this.reconnectAttempts++;
                console.log(`🔄 Attempting reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
                setTimeout(() => this.init(), 5000);
            } else {
                console.log('❌ Max reconnection attempts reached or logged out. Please restart bot.');
                process.exit(1);
            }
            
        } else if (connection === 'open') {
            this.isConnected = true;
            this.reconnectAttempts = 0;
            console.log('✅ Connected to WhatsApp successfully!');
            this.sendStartupMessage();
        } else if (connection === 'connecting') {
            console.log('🔄 Connecting to WhatsApp...');
        }
    }

    async handleMessagesUpsert(m) {
        try {
            const message = m.messages[0];
            if (!message) return;

            // Ignore if message is from status broadcast
            if (message.key.remoteJid === 'status@broadcast') return;

            // Handle button responses
            if (message.message?.buttonsResponseMessage) {
                await this.handleButtonResponse(message);
                return;
            }

            // Handle regular messages
            const hasContent = message.message?.conversation || 
                             message.message?.extendedTextMessage?.text ||
                             message.message?.imageMessage ||
                             message.message?.videoMessage;

            if (hasContent) {
                await this.handleMessage(message);
            }

        } catch (error) {
            console.error('Error in messages.upsert handler:', error);
        }
    }

    async handleMessage(message) {
        try {
            const messageType = Object.keys(message.message)[0];
            let body = '';
            
            if (messageType === 'conversation') {
                body = message.message.conversation;
            } else if (messageType === 'extendedTextMessage') {
                body = message.message.extendedTextMessage.text;
            }
            
            const formattedMessage = {
                from: message.key.remoteJid,
                body: body,
                type: messageType,
                pushName: message.pushName,
                timestamp: message.messageTimestamp,
                isGroup: message.key.remoteJid?.endsWith('@g.us') || false
            };

            await this.messageHandler.handleMessage(formattedMessage);
            
        } catch (error) {
            console.error('Error handling message:', error);
        }
    }

    async handleButtonResponse(message) {
        try {
            const buttonId = message.message.buttonsResponseMessage.selectedButtonId;
            const from = message.key.remoteJid;
            
            console.log(`Button pressed: ${buttonId} from ${from}`);
            
            const response = this.buttonManager.handleButtonResponse(buttonId);
            await this.sendMessage(from, { text: response });
            
        } catch (error) {
            console.error('Error handling button response:', error);
        }
    }

    async sendMessage(to, content) {
        try {
            if (!this.isConnected) {
                console.log('⚠️ Bot not connected, cannot send message');
                return false;
            }

            await this.sock.sendMessage(to, content);
            return true;
        } catch (error) {
            console.error('❌ Error sending message:', error);
            return false;
        }
    }

    async sendButtonMessage(to, buttonMessage) {
        try {
            return await this.sendMessage(to, buttonMessage);
        } catch (error) {
            console.error('Error sending button message:', error);
            // Fallback to text message
            await this.sendMessage(to, { text: buttonMessage.text });
            return false;
        }
    }

    async sendStartupMessage() {
        try {
            console.log('🤖 Bot is now ready to receive messages!');
            console.log('📝 Available commands: !menu, !help, !info, !stats, !ping');
            
        } catch (error) {
            console.error('Error sending startup message:', error);
        }
    }

    handleInitError(error) {
        console.error('Bot initialization failed:', error);
        
        // Try to reconnect after 10 seconds
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Retrying initialization... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            setTimeout(() => this.init(), 10000);
        } else {
            console.log('Max initialization attempts reached. Exiting.');
            process.exit(1);
        }
    }

    // Public method to access button manager
    getButtonManager() {
        return this.buttonManager;
    }

    // Graceful shutdown
    async shutdown() {
        console.log('👋 Shutting down bot gracefully...');
        this.isConnected = false;
        
        if (this.sock) {
            try {
                await this.sock.end();
            } catch (error) {
                console.error('Error during shutdown:', error);
            }
        }
        
        process.exit(0);
    }
}

// Create and start the bot
console.log('🚀 Starting WhatsApp Bot Ultimate v3.0.0...');

const bot = new WhatsAppBot();
bot.init();

// Handle process events for graceful shutdown
process.on('SIGINT', () => {
    console.log('\n📞 Received SIGINT signal');
    bot.shutdown();
});

process.on('SIGTERM', () => {
    console.log('\n📞 Received SIGTERM signal');
    bot.shutdown();
});

process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
});

// Keep the process alive
setInterval(() => {
    // This keeps the event loop active
}, 1000);

console.log('✅ Bot process started successfully');
