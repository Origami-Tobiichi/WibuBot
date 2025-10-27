const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const qrcode = require('qrcode-terminal');

// Import handlers and managers
const MessageHandler = require('./handlers');
const SessionManager = require('./sessionManager');
const ButtonManager = require('./buttonManager');
const VoiceHandler = require('./voiceHandler');

class WhatsAppBot {
    constructor() {
        this.sock = null;
        this.isConnected = false;
        this.sessionManager = new SessionManager();
        this.buttonManager = new ButtonManager();
        this.voiceHandler = new VoiceHandler();
        this.messageHandler = new MessageHandler(this);
        
        this.init();
    }

    async init() {
        try {
            const { state, saveCreds } = await useMultiFileAuthState('./data/sessions');
            const { version } = await fetchLatestBaileysVersion();
            
            this.sock = makeWASocket({
                version,
                logger: { level: 'silent' },
                printQRInTerminal: false,
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, {
                        logger: { level: 'silent' }
                    }),
                },
                generateHighQualityLinkPreview: true,
                markOnlineOnConnect: true,
                getMessage: async (key) => {
                    return {};
                }
            });

            this.sock.ev.on('creds.update', saveCreds);
            this.setupEventHandlers();
            
        } catch (error) {
            console.error(chalk.red('Error initializing bot:'), error);
        }
    }

    setupEventHandlers() {
        this.sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect, qr } = update;
            
            if (qr) {
                console.log(chalk.yellow('Scan QR Code below:'));
                qrcode.generate(qr, { small: true });
            }
            
            if (connection === 'close') {
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
                console.log(chalk.red('Connection closed, reconnecting...'));
                
                if (shouldReconnect) {
                    this.init();
                }
            } else if (connection === 'open') {
                this.isConnected = true;
                console.log(chalk.green('✅ Bot connected successfully!'));
                this.sendWelcomeMessages();
            }
        });

        this.sock.ev.on('messages.upsert', async (m) => {
            const message = m.messages[0];
            if (!message.message || message.key.fromMe) return;
            
            await this.messageHandler.handleMessage(message);
        });
    }

    async sendWelcomeMessages() {
        // Send welcome message to owner
        const ownerNumber = process.env.OWNER_NUMBER;
        if (ownerNumber) {
            const welcomeMsg = `🤖 *Bot Started Successfully!*\n\n` +
                `🕐 *Time:* ${new Date().toLocaleString()}\n` +
                `📊 *Status:* Connected\n` +
                `👤 *Owner:* ${ownerNumber}\n\n` +
                `Bot is now ready to receive commands!`;
            
            await this.sendMessage(ownerNumber, welcomeMsg);
        }
    }

    async sendMessage(jid, content, options = {}) {
        try {
            await this.sock.sendMessage(jid, content, options);
        } catch (error) {
            console.error(chalk.red('Error sending message:'), error);
        }
    }
}

module.exports = WhatsAppBot;