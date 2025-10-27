class AgeVerification {
    constructor() {
        this.verifiedUsers = new Map();
        this.verificationLog = [];
    }

    verifyAge(birthDate) {
        try {
            // Parse birth date (expected format: DD-MM-YYYY)
            const [day, month, year] = birthDate.split('-').map(Number);
            const birthDateObj = new Date(year, month - 1, day);
            const today = new Date();
            
            // Validate date
            if (isNaN(birthDateObj.getTime())) {
                throw new Error('Format tanggal tidak valid. Gunakan DD-MM-YYYY');
            }

            // Calculate age
            let age = today.getFullYear() - birthDateObj.getFullYear();
            const monthDiff = today.getMonth() - birthDateObj.getMonth();
            
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
                age--;
            }

            const isAdult = age >= 18;
            const verificationResult = {
                isAdult: isAdult,
                age: age,
                birthDate: birthDate,
                verifiedAt: new Date().toISOString(),
                status: isAdult ? 'verified_adult' : 'underage'
            };

            // Log verification attempt
            this.verificationLog.push({
                ...verificationResult,
                timestamp: Date.now()
            });

            // Keep only last 1000 logs
            if (this.verificationLog.length > 1000) {
                this.verificationLog.shift();
            }

            return verificationResult;

        } catch (error) {
            console.error('Age verification error:', error);
            return {
                isAdult: false,
                age: 0,
                error: error.message,
                verifiedAt: new Date().toISOString(),
                status: 'error'
            };
        }
    }

    verifyUser(userJid, birthDate) {
        const verification = this.verifyAge(birthDate);
        
        if (verification.isAdult) {
            this.verifiedUsers.set(userJid, {
                ...verification,
                userJid: userJid,
                verifiedAt: new Date().toISOString(),
                expiresAt: this.getExpiryDate()
            });
        }

        return verification;
    }

    isUserVerified(userJid) {
        const userVerification = this.verifiedUsers.get(userJid);
        
        if (!userVerification) {
            return false;
        }

        // Check if verification has expired
        if (new Date() > new Date(userVerification.expiresAt)) {
            this.verifiedUsers.delete(userJid);
            return false;
        }

        return userVerification.isAdult;
    }

    getExpiryDate(days = 30) {
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + days);
        return expiry.toISOString();
    }

    revokeVerification(userJid) {
        const existed = this.verifiedUsers.has(userJid);
        this.verifiedUsers.delete(userJid);
        return existed;
    }

    getUserVerification(userJid) {
        return this.verifiedUsers.get(userJid);
    }

    getAllVerifiedUsers() {
        return Array.from(this.verifiedUsers.values());
    }

    getVerificationStats() {
        const totalVerifications = this.verificationLog.length;
        const adultVerifications = this.verificationLog.filter(log => log.isAdult).length;
        const underageVerifications = totalVerifications - adultVerifications;
        const activeVerifications = this.verifiedUsers.size;

        return {
            totalVerifications,
            adultVerifications,
            underageVerifications,
            activeVerifications,
            adultPercentage: totalVerifications > 0 ? ((adultVerifications / totalVerifications) * 100).toFixed(1) : 0
        };
    }

    cleanupExpiredVerifications() {
        const now = new Date();
        let removedCount = 0;

        for (const [userJid, verification] of this.verifiedUsers.entries()) {
            if (now > new Date(verification.expiresAt)) {
                this.verifiedUsers.delete(userJid);
                removedCount++;
            }
        }

        return removedCount;
    }

    generateVerificationToken(userJid) {
        const token = `AGE_VERIFY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Store token temporarily (would normally be in database)
        setTimeout(() => {
            // Token expires after 10 minutes
        }, 10 * 60 * 1000);

        return token;
    }

    validateVerificationToken(token, userJid) {
        // In a real implementation, this would validate against stored tokens
        return true;
    }

    getVerificationLogs(startDate = null, endDate = null) {
        let logs = this.verificationLog;

        if (startDate) {
            const start = new Date(startDate);
            logs = logs.filter(log => new Date(log.timestamp) >= start);
        }

        if (endDate) {
            const end = new Date(endDate);
            logs = logs.filter(log => new Date(log.timestamp) <= end);
        }

        return logs;
    }

    exportVerificationData() {
        return {
            verifiedUsers: this.getAllVerifiedUsers(),
            stats: this.getVerificationStats(),
            logs: this.verificationLog.slice(-100), // Last 100 logs
            exportedAt: new Date().toISOString()
        };
    }
}

module.exports = AgeVerification;