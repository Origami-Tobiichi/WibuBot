const UserModel = require('../../database/models/User');
const PremiumModel = require('../../database/models/Premium');
const TokenSystem = require('../auth/tokenSystem');

class RegistrationAuth {
    constructor() {
        this.userModel = new UserModel();
        this.premiumModel = new PremiumModel();
        this.tokenSystem = new TokenSystem();
        this.registrationSessions = new Map();
    }

    async startRegistration(jid) {
        try {
            // Check if user already exists
            const existingUser = await this.userModel.findByJid(jid);
            if (existingUser) {
                return {
                    success: false,
                    message: `❌ Anda sudah terdaftar!\n\n` +
                            `👤 Username: ${existingUser.username}\n` +
                            `⭐ Status: ${existingUser.premium ? 'PREMIUM' : 'FREE'}\n` +
                            `📅 Bergabung: ${new Date(existingUser.registeredAt).toLocaleDateString('id-ID')}`
                };
            }

            // Generate registration token
            const token = this.tokenSystem.generateToken();
            
            const registrationSession = {
                jid: jid,
                token: token,
                stage: 'awaiting_username',
                attempts: 0,
                maxAttempts: 3,
                createdAt: Date.now(),
                expiresAt: Date.now() + (10 * 60 * 1000) // 10 minutes
            };

            this.registrationSessions.set(jid, registrationSession);

            return {
                success: true,
                message: `🔐 *PROSES REGISTRASI* 🔐\n\n` +
                        `📝 *Langkah 1: Simpan Token*\n` +
                        `Token Anda: *${token}*\n\n` +
                        `📋 *Langkah 2: Kirim Data*\n` +
                        `Balas pesan ini dengan format:\n` +
                        `!daftar [USERNAME] [TOKEN]\n\n` +
                        `Contoh:\n` +
                        `!daftar JohnDoe ${token}\n\n` +
                        `⏰ *Token berlaku 10 menit*\n` +
                        `❌ *Maksimal 3x percobaan*`,
                token: token,
                session: registrationSession
            };

        } catch (error) {
            console.error('Registration start error:', error);
            return {
                success: false,
                message: '❌ Terjadi error saat memulai registrasi. Silakan coba lagi.'
            };
        }
    }

    async completeRegistration(jid, username, token) {
        try {
            const session = this.registrationSessions.get(jid);
            
            // Validate session
            if (!session) {
                return {
                    success: false,
                    message: '❌ Sesi registrasi tidak ditemukan. Mulai ulang dengan !register'
                };
            }

            // Check if session expired
            if (Date.now() > session.expiresAt) {
                this.registrationSessions.delete(jid);
                return {
                    success: false,
                    message: '❌ Token sudah kadaluarsa. Mulai ulang dengan !register'
                };
            }

            // Validate token
            if (session.token !== token) {
                session.attempts++;
                
                if (session.attempts >= session.maxAttempts) {
                    this.registrationSessions.delete(jid);
                    return {
                        success: false,
                        message: '❌ Percobaan melebihi batas. Mulai ulang dengan !register'
                    };
                }

                const attemptsLeft = session.maxAttempts - session.attempts;
                return {
                    success: false,
                    message: `❌ Token tidak valid! Percobaan tersisa: ${attemptsLeft}`
                };
            }

            // Validate username
            const validationResult = this.validateUsername(username);
            if (!validationResult.valid) {
                return {
                    success: false,
                    message: `❌ ${validationResult.message}`
                };
            }

            // Check username availability
            const usernameExists = await this.userModel.findByUsername(username);
            if (usernameExists) {
                return {
                    success: false,
                    message: '❌ Username sudah digunakan. Pilih username lain.'
                };
            }

            // Create user
            const userData = {
                jid: jid,
                username: username,
                phone: jid.split('@')[0],
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
                }
            };

            const newUser = await this.userModel.create(userData);

            // Cleanup session
            this.registrationSessions.delete(jid);

            return {
                success: true,
                message: `🎉 *REGISTRASI BERHASIL!* 🎉\n\n` +
                        `Selamat datang, *${username}*! 👋\n\n` +
                        `📊 *Info Akun:*\n` +
                        `👤 Username: ${username}\n` +
                        `📱 Phone: ${userData.phone}\n` +
                        `⭐ Status: FREE USER\n` +
                        `🎯 Level: 1\n` +
                        `📅 Bergabung: ${new Date().toLocaleDateString('id-ID')}\n\n` +
                        `🎁 *Bonus Welcome:*\n` +
                        `• Akses semua fitur dasar\n` +
                        `• 100 EXP gratis\n` +
                        `• Daily rewards available\n\n` +
                        `Ketik *!menu* untuk mulai menggunakan bot!\n` +
                        `Ketik *!help* untuk bantuan`,
                user: newUser
            };

        } catch (error) {
            console.error('Registration completion error:', error);
            return {
                success: false,
                message: '❌ Terjadi error saat menyelesaikan registrasi. Silakan coba lagi.'
            };
        }
    }

    validateUsername(username) {
        // Length check
        if (username.length < 3) {
            return { valid: false, message: 'Username harus minimal 3 karakter' };
        }

        if (username.length > 20) {
            return { valid: false, message: 'Username maksimal 20 karakter' };
        }

        // Character check
        const usernameRegex = /^[a-zA-Z0-9_]+$/;
        if (!usernameRegex.test(username)) {
            return { valid: false, message: 'Username hanya boleh mengandung huruf, angka, dan underscore' };
        }

        // Reserved usernames
        const reservedUsernames = ['admin', 'owner', 'bot', 'system', 'null', 'undefined'];
        if (reservedUsernames.includes(username.toLowerCase())) {
            return { valid: false, message: 'Username tidak diperbolehkan' };
        }

        return { valid: true, message: 'Username valid' };
    }

    async getUserProfile(jid) {
        try {
            const user = await this.userModel.findByJid(jid);
            if (!user) {
                return {
                    success: false,
                    message: '❌ User tidak ditemukan. Silakan registrasi dengan !register'
                };
            }

            const premiumInfo = user.premium ? 
                await this.premiumModel.getPremiumInfo(jid) : null;

            const levelProgress = (user.exp / (user.level * 100)) * 100;

            let profileMessage = `👤 *PROFILE USER* 👤\n\n`;
            profileMessage += `📝 *Username:* ${user.username}\n`;
            profileMessage += `📱 *Phone:* ${user.phone}\n`;
            profileMessage += `⭐ *Status:* ${user.premium ? 'PREMIUM 🎯' : 'FREE USER'}\n`;
            profileMessage += `🎯 *Level:* ${user.level}\n`;
            profileMessage += `📈 *EXP:* ${user.exp}/${user.level * 100} (${levelProgress.toFixed(1)}%)\n`;
            profileMessage += `📅 *Bergabung:* ${new Date(user.registeredAt).toLocaleDateString('id-ID')}\n`;
            profileMessage += `🕐 *Aktif terakhir:* ${new Date(user.lastActive).toLocaleDateString('id-ID')}\n\n`;

            if (premiumInfo) {
                profileMessage += `💎 *Premium Info:*\n`;
                profileMessage += `📦 Paket: ${premiumInfo.packageId}\n`;
                profileMessage += `⏰ Berakhir: ${new Date(premiumInfo.expiresAt).toLocaleDateString('id-ID')}\n\n`;
            }

            profileMessage += `📊 *Statistik:*\n`;
            profileMessage += `💬 Pesan: ${user.stats.messagesSent || 0}\n`;
            profileMessage += `🎮 Game: ${user.stats.gamesPlayed || 0}\n`;
            profileMessage += `📥 Download: ${user.stats.downloads || 0}\n`;
            profileMessage += `🎵 Voice: ${user.stats.voiceNotes || 0}\n`;
            profileMessage += `⚡ Commands: ${user.stats.commandsUsed || 0}\n\n`;

            profileMessage += `⚙️ *Preferensi:*\n`;
            profileMessage += `🌐 Bahasa: ${user.preferences.language}\n`;
            profileMessage += `🎨 Tema: ${user.preferences.theme}\n`;
            profileMessage += `🤖 AI: ${user.preferences.aiPersonality}\n`;

            return {
                success: true,
                message: profileMessage,
                user: user,
                premiumInfo: premiumInfo
            };

        } catch (error) {
            console.error('Get profile error:', error);
            return {
                success: false,
                message: '❌ Error mengambil data profile'
            };
        }
    }

    async updateUserProfile(jid, updates) {
        try {
            const user = await this.userModel.findByJid(jid);
            if (!user) {
                return {
                    success: false,
                    message: '❌ User tidak ditemukan'
                };
            }

            // Filter allowed updates
            const allowedUpdates = {};
            const allowedFields = ['preferences', 'stats'];
            
            for (const [key, value] of Object.entries(updates)) {
                if (allowedFields.includes(key) || key.startsWith('preferences.') || key.startsWith('stats.')) {
                    allowedUpdates[key] = value;
                }
            }

            if (Object.keys(allowedUpdates).length === 0) {
                return {
                    success: false,
                    message: '❌ Tidak ada field yang valid untuk diupdate'
                };
            }

            const updatedUser = await this.userModel.update(jid, allowedUpdates);

            return {
                success: true,
                message: '✅ Profile berhasil diupdate!',
                user: updatedUser
            };

        } catch (error) {
            console.error('Update profile error:', error);
            return {
                success: false,
                message: '❌ Error mengupdate profile'
            };
        }
    }

    async deleteUserAccount(jid) {
        try {
            const user = await this.userModel.findByJid(jid);
            if (!user) {
                return {
                    success: false,
                    message: '❌ User tidak ditemukan'
                };
            }

            // Delete user data
            await this.userModel.deleteUser(jid);
            
            // Remove premium if exists
            await this.premiumModel.revokePremium(jid);

            // Cleanup any active sessions
            this.registrationSessions.delete(jid);

            return {
                success: true,
                message: `😢 *Akun berhasil dihapus*\n\n` +
                        `Selamat tinggal, ${user.username}!\n` +
                        `Semua data Anda telah dihapus dari sistem.\n\n` +
                        `Terima kasih telah menggunakan bot kami! 👋`
            };

        } catch (error) {
            console.error('Delete account error:', error);
            return {
                success: false,
                message: '❌ Error menghapus akun'
            };
        }
    }

    async cleanupExpiredSessions() {
        const now = Date.now();
        let cleanedCount = 0;

        for (const [jid, session] of this.registrationSessions.entries()) {
            if (now > session.expiresAt) {
                this.registrationSessions.delete(jid);
                cleanedCount++;
            }
        }

        return cleanedCount;
    }

    getRegistrationStats() {
        const activeSessions = this.registrationSessions.size;
        const totalUsers = this.userModel.getUserCount();

        return {
            activeRegistrations: activeSessions,
            totalUsers: totalUsers,
            sessions: Array.from(this.registrationSessions.values()).map(session => ({
                jid: session.jid,
                stage: session.stage,
                attempts: session.attempts,
                expiresIn: Math.max(0, session.expiresAt - Date.now())
            }))
        };
    }

    // Admin functions
    async adminGetUser(jid) {
        try {
            const user = await this.userModel.findByJid(jid);
            if (!user) {
                return { success: false, message: 'User tidak ditemukan' };
            }

            return {
                success: true,
                user: user,
                premium: await this.premiumModel.isPremium(jid)
            };

        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async adminUpdateUser(jid, updates) {
        try {
            const updatedUser = await this.userModel.update(jid, updates);
            return {
                success: true,
                message: 'User berhasil diupdate',
                user: updatedUser
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async adminDeleteUser(jid) {
        try {
            await this.userModel.deleteUser(jid);
            await this.premiumModel.revokePremium(jid);
            return { success: true, message: 'User berhasil dihapus' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

module.exports = RegistrationAuth;