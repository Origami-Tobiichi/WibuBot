const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const path = require('path');

class PremiumModel {
    constructor() {
        this.dbPath = path.join(process.cwd(), 'data', 'premium.json');
        this.init();
    }

    async init() {
        const adapter = new JSONFile(this.dbPath);
        this.db = new Low(adapter, { 
            premiumUsers: [],
            packages: [
                {
                    id: 'basic',
                    name: 'Basic Premium',
                    price: 25000,
                    duration: 30,
                    features: ['NSFW Access', 'Priority Support', 'Unlimited AI']
                },
                {
                    id: 'pro',
                    name: 'Pro Package',
                    price: 50000,
                    duration: 30,
                    features: ['All Basic Features', 'Voice Notes', 'Early Access', 'Custom Commands']
                },
                {
                    id: 'ultimate',
                    name: 'Ultimate Package',
                    price: 100000,
                    duration: 60,
                    features: ['All Pro Features', 'VIP Support', 'Bot Customization', 'API Access']
                }
            ],
            transactions: []
        });
        await this.db.read();
    }

    async activatePremium(userJid, packageId, durationDays = 30) {
        await this.db.read();
        
        const packageInfo = this.db.data.packages.find(pkg => pkg.id === packageId);
        if (!packageInfo) {
            throw new Error('Package not found');
        }

        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + durationDays);

        // Remove existing premium
        const existingIndex = this.db.data.premiumUsers.findIndex(pu => pu.userJid === userJid);
        if (existingIndex !== -1) {
            this.db.data.premiumUsers.splice(existingIndex, 1);
        }

        const premiumUser = {
            userJid: userJid,
            packageId: packageId,
            activatedAt: new Date().toISOString(),
            expiresAt: expiryDate.toISOString(),
            features: packageInfo.features,
            status: 'active'
        };

        this.db.data.premiumUsers.push(premiumUser);

        // Record transaction
        const transaction = {
            id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userJid: userJid,
            packageId: packageId,
            amount: packageInfo.price,
            date: new Date().toISOString(),
            status: 'completed'
        };

        this.db.data.transactions.push(transaction);
        await this.db.write();

        return { premiumUser, transaction };
    }

    async isPremium(userJid) {
        await this.db.read();
        const premiumUser = this.db.data.premiumUsers.find(pu => pu.userJid === userJid);
        
        if (!premiumUser) return false;
        
        // Check if premium has expired
        if (new Date(premiumUser.expiresAt) < new Date()) {
            premiumUser.status = 'expired';
            await this.db.write();
            return false;
        }

        return true;
    }

    async getPremiumInfo(userJid) {
        await this.db.read();
        const premiumUser = this.db.data.premiumUsers.find(pu => pu.userJid === userJid);
        if (!premiumUser) return null;

        const packageInfo = this.db.data.packages.find(pkg => pkg.id === premiumUser.packageId);
        return {
            ...premiumUser,
            package: packageInfo
        };
    }

    async getExpiringSoon(days = 7) {
        await this.db.read();
        const threshold = new Date();
        threshold.setDate(threshold.getDate() + days);

        return this.db.data.premiumUsers.filter(pu => 
            new Date(pu.expiresAt) <= threshold && 
            pu.status === 'active'
        );
    }

    async getAllPackages() {
        await this.db.read();
        return this.db.data.packages;
    }

    async getTransactions(userJid = null) {
        await this.db.read();
        if (userJid) {
            return this.db.data.transactions.filter(tx => tx.userJid === userJid);
        }
        return this.db.data.transactions;
    }

    async revokePremium(userJid) {
        await this.db.read();
        const premiumIndex = this.db.data.premiumUsers.findIndex(pu => pu.userJid === userJid);
        if (premiumIndex !== -1) {
            this.db.data.premiumUsers[premiumIndex].status = 'revoked';
            await this.db.write();
            return true;
        }
        return false;
    }
}

module.exports = PremiumModel;