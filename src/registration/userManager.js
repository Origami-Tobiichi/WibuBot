const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const TokenSystem = require('../auth/tokenSystem');

class UserManager {
    constructor() {
        this.usersPath = './data/users';
        this.tokenSystem = new TokenSystem();
        this.ensureDirectories();
    }

    async ensureDirectories() {
        try {
            await fs.mkdir(this.usersPath, { recursive: true });
        } catch (error) {
            console.error('Error creating directories:', error);
        }
    }

    async startRegistration(jid, bot) {
        try {
            // Check if user already exists
            const existingUser = await this.getUser(jid);
            if (existingUser) {
                return await bot.sendMessage(jid, {
                    text: `❌ Anda sudah terdaftar!\n\n` +
                          `👤 Username: ${existingUser.username}\n` +
                          `⭐ Status: ${existingUser.premium ? 'PREMIUM' : 'FREE'}\n` +
                          `📅 Bergabung: ${new Date(existingUser.registeredAt).toLocaleDateString('id-ID')}`
                });
            }

            // Generate registration token
            const token = this.tokenSystem.generateToken();
            const registrationData = {
                jid: jid,
                token: token,
                stage: 'awaiting_username',
                createdAt: new Date().toISOString()
            };

            // Save temporary registration data
            await this.saveRegistrationData(jid, registrationData);

            // Send token and instructions
            const registrationMsg = {
                text: `🔐 *REGISTRATION PROCESS* 🔐\n\n` +
                      `📝 *Langkah 1: Simpan Token*\n` +
                      `Token Anda: *${token}*\n\n` +
                      `📋 *Langkah 2: Kirim Data*\n` +
                      `Balas pesan ini dengan format:\n` +
                      `!daftar [USERNAME] [TOKEN]\n\n` +
                      `Contoh:\n` +
                      `!daftar JohnDoe ${token}\n\n` +
                      `⏰ *Token berlaku 10 menit*`,
                buttons: [
                    { buttonId: `!daftar username ${token}`, buttonText: { displayText: '📝 DAFTAR SEKARANG' }, type: 1 }
                ]
            };

            await bot.sendMessage(jid, registrationMsg);

        } catch (error) {
            console.error('Registration error:', error);
            await bot.sendMessage(jid, {
                text: '❌ Terjadi error saat registrasi. Silakan coba lagi.'
            });
        }
    }

    async completeRegistration(jid, username, token) {
        try {
            // Verify token
            const registrationData = await this.getRegistrationData(jid);
            if (!registrationData || registrationData.token !== token) {
                return { success: false, message: 'Token tidak valid atau sudah kadaluarsa' };
            }

            // Check username availability
            const usernameExists = await this.checkUsernameExists(username);
            if (usernameExists) {
                return { success: false, message: 'Username sudah digunakan' };
            }

            // Create user data
            const userData = {
                jid: jid,
                username: username,
                premium: false,
                premiumExpiry: null,
                registeredAt: new Date().toISOString(),
                lastActive: new Date().toISOString(),
                stats: {
                    messagesSent: 0,
                    commandsUsed: 0,
                    gamesPlayed: 0,
                    downloads: 0
                },
                preferences: {
                    language: 'id',
                    theme: 'default',
                    aiPersonality: 'friendly'
                }
            };

            // Save user data
            await this.saveUserData(jid, userData);

            // Clean up registration data
            await this.deleteRegistrationData(jid);

            return {
                success: true,
                message: 'Registrasi berhasil!',
                user: userData
            };

        } catch (error) {
            console.error('Complete registration error:', error);
            return { success: false, message: 'Error saat menyelesaikan registrasi' };
        }
    }

    async getUser(jid) {
        try {
            const userFile = path.join(this.usersPath, `${jid.replace(/[@\.]/g, '_')}.json`);
            const data = await fs.readFile(userFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            return null;
        }
    }

    async saveUserData(jid, userData) {
        const userFile = path.join(this.usersPath, `${jid.replace(/[@\.]/g, '_')}.json`);
        await fs.writeFile(userFile, JSON.stringify(userData, null, 2));
    }

    async saveRegistrationData(jid, data) {
        const regFile = path.join(this.usersPath, `reg_${jid.replace(/[@\.]/g, '_')}.json`);
        await fs.writeFile(regFile, JSON.stringify(data, null, 2));
    }

    async getRegistrationData(jid) {
        try {
            const regFile = path.join(this.usersPath, `reg_${jid.replace(/[@\.]/g, '_')}.json`);
            const data = await fs.readFile(regFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            return null;
        }
    }

    async deleteRegistrationData(jid) {
        try {
            const regFile = path.join(this.usersPath, `reg_${jid.replace(/[@\.]/g, '_')}.json`);
            await fs.unlink(regFile);
        } catch (error) {
            // File doesn't exist, ignore
        }
    }

    async checkUsernameExists(username) {
        try {
            const files = await fs.readdir(this.usersPath);
            for (const file of files) {
                if (file.startsWith('reg_')) continue;
                
                const data = await fs.readFile(path.join(this.usersPath, file), 'utf8');
                const user = JSON.parse(data);
                if (user.username === username) {
                    return true;
                }
            }
            return false;
        } catch (error) {
            return false;
        }
    }

    async updateUserStats(jid, field, increment = 1) {
        try {
            const user = await this.getUser(jid);
            if (user && user.stats) {
                user.stats[field] = (user.stats[field] || 0) + increment;
                user.lastActive = new Date().toISOString();
                await this.saveUserData(jid, user);
            }
        } catch (error) {
            console.error('Error updating user stats:', error);
        }
    }

    async getAllUsers() {
        try {
            const files = await fs.readdir(this.usersPath);
            const users = [];
            
            for (const file of files) {
                if (file.startsWith('reg_')) continue;
                
                const data = await fs.readFile(path.join(this.usersPath, file), 'utf8');
                users.push(JSON.parse(data));
            }
            
            return users;
        } catch (error) {
            return [];
        }
    }
}

module.exports = UserManager;
