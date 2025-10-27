const path = require('path');
const fs = require('fs').promises;

class UserManager {
    constructor() {
        this.usersDir = './data/users';
        this.ensureDirectories();
    }

    async ensureDirectories() {
        try {
            await fs.mkdir(this.usersDir, { recursive: true });
        } catch (error) {
            console.error('Error creating users directory:', error);
        }
    }

    getUserFilePath(userId) {
        return path.join(this.usersDir, `${userId}.json`);
    }

    async registerUser(userId, userData = {}) {
        try {
            const userFile = this.getUserFilePath(userId);
            const user = {
                id: userId,
                name: userData.name || 'User',
                premium: false,
                registeredAt: new Date().toISOString(),
                level: 1,
                exp: 0,
                stats: {
                    messagesSent: 0,
                    gamesPlayed: 0,
                    downloads: 0,
                    voiceNotes: 0,
                    commandsUsed: 0
                },
                lastActive: new Date().toISOString(),
                ...userData
            };

            await fs.writeFile(userFile, JSON.stringify(user, null, 2));
            return user;
        } catch (error) {
            console.error('Error registering user:', error);
            throw error;
        }
    }

    async getUser(userId) {
        try {
            const userFile = this.getUserFilePath(userId);
            const data = await fs.readFile(userFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            if (error.code === 'ENOENT') {
                return null;
            }
            console.error('Error reading user:', error);
            throw error;
        }
    }

    async getOrCreateUser(userId, userData = {}) {
        let user = await this.getUser(userId);
        if (!user) {
            user = await this.registerUser(userId, userData);
        }
        return user;
    }

    async updateUser(userId, updates) {
        try {
            const user = await this.getUser(userId);
            if (!user) {
                throw new Error('User not found');
            }

            const updatedUser = {
                ...user,
                ...updates,
                lastActive: new Date().toISOString()
            };

            const userFile = this.getUserFilePath(userId);
            await fs.writeFile(userFile, JSON.stringify(updatedUser, null, 2));
            return updatedUser;
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    }

    // FIXED: Tambahkan method incrementStat yang hilang
    async incrementStat(userId, statName, amount = 1) {
        try {
            const user = await this.getUser(userId);
            if (!user) {
                // Jika user tidak ada, buat user baru
                return await this.registerUser(userId);
            }

            // Inisialisasi stats jika belum ada
            if (!user.stats) {
                user.stats = {
                    messagesSent: 0,
                    gamesPlayed: 0,
                    downloads: 0,
                    voiceNotes: 0,
                    commandsUsed: 0
                };
            }

            // Update stat
            if (!user.stats[statName]) {
                user.stats[statName] = 0;
            }

            user.stats[statName] += amount;
            user.lastActive = new Date().toISOString();

            // Add EXP for activity
            user.exp = (user.exp || 0) + Math.floor(amount / 2);

            // Level up check
            const expNeeded = (user.level || 1) * 100;
            if (user.exp >= expNeeded) {
                user.level = (user.level || 1) + 1;
                user.exp = user.exp - expNeeded;
            }

            const userFile = this.getUserFilePath(userId);
            await fs.writeFile(userFile, JSON.stringify(user, null, 2));
            return user;
        } catch (error) {
            console.error('Error incrementing stat:', error);
            // Return minimal user object instead of throwing
            return {
                id: userId,
                stats: { [statName]: amount }
            };
        }
    }

    async getAllUsers() {
        try {
            const files = await fs.readdir(this.usersDir);
            const users = [];

            for (const file of files) {
                if (file.endsWith('.json')) {
                    try {
                        const data = await fs.readFile(path.join(this.usersDir, file), 'utf8');
                        users.push(JSON.parse(data));
                    } catch (error) {
                        console.error(`Error reading user file ${file}:`, error);
                    }
                }
            }

            return users;
        } catch (error) {
            console.error('Error getting all users:', error);
            return [];
        }
    }

    async getTopUsers(limit = 10, sortBy = 'level') {
        try {
            const users = await this.getAllUsers();
            return users
                .sort((a, b) => {
                    if (sortBy === 'level') {
                        return (b.level || 1) - (a.level || 1) || (b.exp || 0) - (a.exp || 0);
                    } else if (sortBy === 'messages') {
                        return (b.stats?.messagesSent || 0) - (a.stats?.messagesSent || 0);
                    }
                    return 0;
                })
                .slice(0, limit);
        } catch (error) {
            console.error('Error getting top users:', error);
            return [];
        }
    }

    async setPremium(userId, premium = true) {
        return await this.updateUser(userId, { premium });
    }

    async addExp(userId, expAmount) {
        try {
            const user = await this.getUser(userId);
            if (!user) {
                return null;
            }

            user.exp = (user.exp || 0) + expAmount;
            const expNeeded = (user.level || 1) * 100;

            // Level up
            while (user.exp >= expNeeded) {
                user.level = (user.level || 1) + 1;
                user.exp -= expNeeded;
            }

            const userFile = this.getUserFilePath(userId);
            await fs.writeFile(userFile, JSON.stringify(user, null, 2));
            return user;
        } catch (error) {
            console.error('Error adding EXP:', error);
            throw error;
        }
    }

    // Tambahkan method untuk mendapatkan statistik user
    async getUserStats(userId) {
        try {
            const user = await this.getUser(userId);
            if (!user) {
                return {
                    messagesSent: 0,
                    gamesPlayed: 0,
                    downloads: 0,
                    voiceNotes: 0,
                    commandsUsed: 0
                };
            }
            return user.stats || {
                messagesSent: 0,
                gamesPlayed: 0,
                downloads: 0,
                voiceNotes: 0,
                commandsUsed: 0
            };
        } catch (error) {
            console.error('Error getting user stats:', error);
            return {
                messagesSent: 0,
                gamesPlayed: 0,
                downloads: 0,
                voiceNotes: 0,
                commandsUsed: 0
            };
        }
    }
}

module.exports = UserManager;
