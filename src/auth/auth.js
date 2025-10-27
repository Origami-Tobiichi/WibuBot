const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const UserModel = require('../../database/models/User');

class AuthSystem {
    constructor() {
        this.userModel = new UserModel();
        this.jwtSecret = process.env.JWT_SECRET || 'whatsapp-bot-secret-key';
        this.tokenExpiry = '30d';
    }

    async authenticateUser(jid, username, token) {
        try {
            // Find user by JID
            const user = await this.userModel.findByJid(jid);
            if (!user) {
                return { success: false, message: 'User tidak ditemukan' };
            }

            // Verify username
            if (user.username !== username) {
                return { success: false, message: 'Username tidak sesuai' };
            }

            // In a real implementation, you would verify a password or token
            // For now, we'll use a simple token verification
            const isValid = await this.verifyToken(token, jid);
            if (!isValid) {
                return { success: false, message: 'Token tidak valid' };
            }

            // Generate JWT token
            const authToken = this.generateToken(user);

            return {
                success: true,
                message: 'Autentikasi berhasil',
                token: authToken,
                user: {
                    jid: user.jid,
                    username: user.username,
                    premium: user.premium,
                    level: user.level
                }
            };

        } catch (error) {
            console.error('Authentication error:', error);
            return { success: false, message: 'Error saat autentikasi' };
        }
    }

    generateToken(user) {
        const payload = {
            jid: user.jid,
            username: user.username,
            premium: user.premium,
            level: user.level
        };

        return jwt.sign(payload, this.jwtSecret, { expiresIn: this.tokenExpiry });
    }

    verifyToken(token, jid) {
        try {
            // Simple token verification logic
            // In real implementation, this would check against stored tokens
            const decoded = jwt.verify(token, this.jwtSecret);
            return decoded.jid === jid;
        } catch (error) {
            return false;
        }
    }

    async validateToken(token) {
        try {
            const decoded = jwt.verify(token, this.jwtSecret);
            const user = await this.userModel.findByJid(decoded.jid);
            
            if (!user) {
                return { valid: false, message: 'User tidak ditemukan' };
            }

            return {
                valid: true,
                user: user,
                decoded: decoded
            };

        } catch (error) {
            return { valid: false, message: 'Token tidak valid' };
        }
    }

    async hashPassword(password) {
        const saltRounds = 10;
        return await bcrypt.hash(password, saltRounds);
    }

    async verifyPassword(password, hashedPassword) {
        return await bcrypt.compare(password, hashedPassword);
    }

    async createSession(userJid, deviceInfo = {}) {
        const session = {
            id: `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userJid: userJid,
            device: deviceInfo.device || 'unknown',
            ip: deviceInfo.ip || 'unknown',
            userAgent: deviceInfo.userAgent || 'unknown',
            createdAt: new Date().toISOString(),
            lastActive: new Date().toISOString(),
            isActive: true
        };

        // In real implementation, store session in database
        return session;
    }

    async invalidateSession(sessionId) {
        // In real implementation, mark session as inactive in database
        return { success: true, message: 'Session invalidated' };
    }

    async getActiveSessions(userJid) {
        // In real implementation, fetch from database
        return [];
    }

    generateOTP() {
        const digits = '0123456789';
        let otp = '';
        for (let i = 0; i < 6; i++) {
            otp += digits[Math.floor(Math.random() * 10)];
        }
        return otp;
    }

    async sendOTP(jid, otp) {
        // In real implementation, send OTP via SMS or email
        console.log(`OTP for ${jid}: ${otp}`);
        return { success: true, message: 'OTP sent' };
    }

    async verifyOTP(jid, otp, storedOTP) {
        return otp === storedOTP;
    }

    async changePassword(jid, oldPassword, newPassword) {
        try {
            const user = await this.userModel.findByJid(jid);
            if (!user) {
                return { success: false, message: 'User tidak ditemukan' };
            }

            // Verify old password (in real implementation, compare hashed passwords)
            const isValid = await this.verifyPassword(oldPassword, user.passwordHash);
            if (!isValid) {
                return { success: false, message: 'Password lama tidak sesuai' };
            }

            // Hash new password
            const newPasswordHash = await this.hashPassword(newPassword);

            // Update password in database
            await this.userModel.update(jid, { passwordHash: newPasswordHash });

            return { success: true, message: 'Password berhasil diubah' };

        } catch (error) {
            console.error('Change password error:', error);
            return { success: false, message: 'Error saat mengubah password' };
        }
    }

    getAuthStats() {
        return {
            jwtSecret: this.jwtSecret ? '***' : 'Not set',
            tokenExpiry: this.tokenExpiry,
            algorithm: 'HS256'
        };
    }
}

module.exports = AuthSystem;