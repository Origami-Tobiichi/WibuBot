const crypto = require('crypto');

class TokenSystem {
    constructor() {
        this.tokenExpiry = 10 * 60 * 1000; // 10 minutes
        this.activeTokens = new Map();
    }

    generateToken() {
        const token = crypto.randomBytes(6).toString('hex').toUpperCase();
        const expiry = Date.now() + this.tokenExpiry;
        
        this.activeTokens.set(token, {
            created: Date.now(),
            expires: expiry,
            used: false
        });

        // Cleanup expired tokens
        this.cleanupTokens();

        return token;
    }

    verifyToken(token) {
        this.cleanupTokens();
        
        const tokenData = this.activeTokens.get(token);
        if (!tokenData) {
            return { valid: false, reason: 'Token tidak ditemukan' };
        }

        if (tokenData.used) {
            return { valid: false, reason: 'Token sudah digunakan' };
        }

        if (Date.now() > tokenData.expires) {
            this.activeTokens.delete(token);
            return { valid: false, reason: 'Token sudah kadaluarsa' };
        }

        return { valid: true, data: tokenData };
    }

    markTokenUsed(token) {
        const tokenData = this.activeTokens.get(token);
        if (tokenData) {
            tokenData.used = true;
            this.activeTokens.set(token, tokenData);
        }
    }

    cleanupTokens() {
        const now = Date.now();
        for (const [token, data] of this.activeTokens.entries()) {
            if (now > data.expires) {
                this.activeTokens.delete(token);
            }
        }
    }

    generatePremiumToken(userJid, durationDays = 30) {
        const token = `PREMIUM_${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
        const expiry = Date.now() + (durationDays * 24 * 60 * 60 * 1000);
        
        this.activeTokens.set(token, {
            type: 'premium',
            userJid: userJid,
            created: Date.now(),
            expires: expiry,
            duration: durationDays,
            used: false
        });

        return token;
    }

    getActiveTokensCount() {
        this.cleanupTokens();
        return this.activeTokens.size;
    }
}

module.exports = TokenSystem;
