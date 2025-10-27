const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const path = require('path');

class UserModel {
    constructor() {
        this.dbPath = path.join(process.cwd(), 'data', 'users.json');
        this.init();
    }

    async init() {
        const adapter = new JSONFile(this.dbPath);
        this.db = new Low(adapter, { users: [] });
        await this.db.read();
    }

    async create(userData) {
        await this.db.read();
        const user = {
            id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            jid: userData.jid,
            username: userData.username,
            phone: userData.phone,
            premium: false,
            premiumExpiry: null,
            registeredAt: new Date().toISOString(),
            lastActive: new Date().toISOString(),
            level: 1,
            exp: 0,
            stats: {
                messagesSent: 0,
                commandsUsed: 0,
                gamesPlayed: 0,
                downloads: 0,
                voiceNotes: 0
            },
            preferences: {
                language: 'id',
                theme: 'default',
                aiPersonality: 'friendly',
                notifications: true
            },
            ...userData
        };

        this.db.data.users.push(user);
        await this.db.write();
        return user;
    }

    async findByJid(jid) {
        await this.db.read();
        return this.db.data.users.find(user => user.jid === jid);
    }

    async findByUsername(username) {
        await this.db.read();
        return this.db.data.users.find(user => user.username === username);
    }

    async update(jid, updateData) {
        await this.db.read();
        const userIndex = this.db.data.users.findIndex(user => user.jid === jid);
        if (userIndex !== -1) {
            this.db.data.users[userIndex] = {
                ...this.db.data.users[userIndex],
                ...updateData,
                lastActive: new Date().toISOString()
            };
            await this.db.write();
            return this.db.data.users[userIndex];
        }
        return null;
    }

    async updateStats(jid, field, value = 1) {
        await this.db.read();
        const userIndex = this.db.data.users.findIndex(user => user.jid === jid);
        if (userIndex !== -1) {
            if (!this.db.data.users[userIndex].stats) {
                this.db.data.users[userIndex].stats = {};
            }
            this.db.data.users[userIndex].stats[field] = (this.db.data.users[userIndex].stats[field] || 0) + value;
            this.db.data.users[userIndex].lastActive = new Date().toISOString();
            await this.db.write();
        }
    }

    async getAllUsers() {
        await this.db.read();
        return this.db.data.users;
    }

    async getPremiumUsers() {
        await this.db.read();
        return this.db.data.users.filter(user => user.premium);
    }

    async deleteUser(jid) {
        await this.db.read();
        const userIndex = this.db.data.users.findIndex(user => user.jid === jid);
        if (userIndex !== -1) {
            this.db.data.users.splice(userIndex, 1);
            await this.db.write();
            return true;
        }
        return false;
    }

    async getUserCount() {
        await this.db.read();
        return this.db.data.users.length;
    }
}

module.exports = UserModel;