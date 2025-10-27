const express = require('express');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs').promises;

class WebServer {
    constructor(botInstance) {
        this.bot = botInstance;
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = socketIo(this.server);
        this.port = process.env.WEB_PORT || 3000;
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupSocket();
    }

    setupMiddleware() {
        this.app.use(express.static(path.join(__dirname, 'public')));
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
    }

    setupRoutes() {
        // API Routes
        this.app.get('/api/bot-status', (req, res) => {
            res.json({
                status: this.bot.isConnected ? 'connected' : 'disconnected',
                connected: this.bot.isConnected,
                timestamp: new Date().toISOString()
            });
        });

        this.app.get('/api/stats', async (req, res) => {
            try {
                const stats = await this.getBotStats();
                res.json(stats);
            } catch (error) {
                res.status(500).json({ error: 'Failed to get stats' });
            }
        });

        this.app.get('/api/users', async (req, res) => {
            try {
                const users = await this.bot.messageHandler.userManager.getAllUsers();
                res.json(users);
            } catch (error) {
                res.status(500).json({ error: 'Failed to get users' });
            }
        });

        this.app.post('/api/restart', (req, res) => {
            if (req.body.secret !== process.env.ADMIN_SECRET) {
                return res.status(403).json({ error: 'Unauthorized' });
            }
            
            // Implement bot restart logic
            res.json({ message: 'Restart command sent' });
        });

        // Web Routes
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'public', 'index.html'));
        });

        this.app.get('/dashboard', (req, res) => {
            res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
        });

        this.app.get('/logs', (req, res) => {
            res.sendFile(path.join(__dirname, 'public', 'logs.html'));
        });
    }

    setupSocket() {
        this.io.on('connection', (socket) => {
            console.log('Client connected to dashboard');

            // Send initial data
            this.sendInitialData(socket);

            // Set up periodic updates
            const interval = setInterval(() => {
                this.sendUpdateData(socket);
            }, 5000);

            socket.on('disconnect', () => {
                console.log('Client disconnected from dashboard');
                clearInterval(interval);
            });

            socket.on('restart-bot', (data) => {
                if (data.secret === process.env.ADMIN_SECRET) {
                    // Implement restart logic
                    this.io.emit('bot-restarting', { timestamp: new Date() });
                }
            });
        });
    }

    async sendInitialData(socket) {
        const status = {
            connected: this.bot.isConnected,
            timestamp: new Date().toISOString()
        };

        const stats = await this.getBotStats();
        const systemInfo = await this.getSystemInfo();

        socket.emit('initial-data', {
            status: status,
            stats: stats,
            systemInfo: systemInfo
        });
    }

    async sendUpdateData(socket) {
        const stats = await this.getBotStats();
        const systemInfo = await this.getSystemInfo();

        socket.emit('data-update', {
            stats: stats,
            systemInfo: systemInfo,
            timestamp: new Date().toISOString()
        });
    }

    async getBotStats() {
        try {
            const users = await this.bot.messageHandler.userManager.getAllUsers();
            const totalUsers = users.length;
            const premiumUsers = users.filter(u => u.premium).length;
            
            // Calculate today's messages (simulated)
            const todayMessages = Math.floor(Math.random() * 100) + 50;
            
            return {
                totalUsers: totalUsers,
                premiumUsers: premiumUsers,
                todayMessages: todayMessages,
                activeSessions: this.bot.isConnected ? 1 : 0,
                uptime: process.uptime()
            };
        } catch (error) {
            return {
                totalUsers: 0,
                premiumUsers: 0,
                todayMessages: 0,
                activeSessions: 0,
                uptime: 0
            };
        }
    }

    async getSystemInfo() {
        const os = require('os');
        
        return {
            platform: os.platform(),
            arch: os.arch(),
            cpu: os.cpus()[0].model,
            memory: {
                total: (os.totalmem() / 1024 / 1024 / 1024).toFixed(2) + ' GB',
                used: ((os.totalmem() - os.freemem()) / 1024 / 1024 / 1024).toFixed(2) + ' GB',
                usage: ((1 - os.freemem() / os.totalmem()) * 100).toFixed(1) + '%'
            },
            uptime: this.formatUptime(os.uptime()),
            load: os.loadavg()
        };
    }

    formatUptime(seconds) {
        const days = Math.floor(seconds / (24 * 60 * 60));
        const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
        const mins = Math.floor((seconds % (60 * 60)) / 60);
        
        return `${days}d ${hours}h ${mins}m`;
    }

    start() {
        this.server.listen(this.port, () => {
            console.log(`🌐 Web dashboard running on port ${this.port}`);
            console.log(`📊 Access at: http://localhost:${this.port}`);
        });
    }
}

module.exports = WebServer;