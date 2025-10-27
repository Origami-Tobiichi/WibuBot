const axios = require('axios');

class HentaiManager {
    constructor() {
        this.verifiedUsers = new Map();
        this.contentCache = new Map();
        this.categories = [
            'waifu', 'neko', 'trap', 'blowjob', 'cum', 'lesbian',
            'anal', 'pussy', 'boobs', 'feet', 'yuri', 'solo',
            'ero', 'holo', 'kitsune', 'kemonomimi'
        ];
    }

    async getHentai(category = 'random', options = {}) {
        // Verify user access first
        if (!this.hasAccess(options.userJid)) {
            throw new Error('Age verification required for NSFW content');
        }

        try {
            let actualCategory = category;
            if (category === 'random') {
                actualCategory = this.categories[Math.floor(Math.random() * this.categories.length)];
            }

            // Validate category
            if (!this.categories.includes(actualCategory)) {
                throw new Error(`Category "${actualCategory}" not available`);
            }

            // Check cache first
            const cacheKey = `${actualCategory}_${JSON.stringify(options)}`;
            if (this.contentCache.has(cacheKey)) {
                return this.contentCache.get(cacheKey);
            }

            // Fetch from hentai API (using waifu.pics NSFW endpoint as example)
            const response = await axios.get(`https://api.waifu.pics/nsfw/${actualCategory}`);
            const content = response.data;

            const hentaiData = {
                id: `hentai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                category: actualCategory,
                url: content.url,
                source: 'waifu.pics',
                fetchedAt: new Date().toISOString(),
                nsfw: true,
                tags: [actualCategory],
                ...this.generateHentaiDetails(actualCategory)
            };

            // Cache the result
            this.contentCache.set(cacheKey, hentaiData);
            if (this.contentCache.size > 100) {
                const firstKey = this.contentCache.keys().next().value;
                this.contentCache.delete(firstKey);
            }

            return hentaiData;

        } catch (error) {
            console.error('Hentai fetch error:', error);
            return this.generateFallbackHentai(category);
        }
    }

    generateHentaiDetails(category) {
        const details = {
            waifu: {
                title: "Waifu NSFW",
                description: "Erotic waifu artwork",
                rating: "R18",
                characters: ["Original Character"],
                artist: "Unknown"
            },
            neko: {
                title: "Neko Girl",
                description: "Cat girl in suggestive pose",
                rating: "R18",
                characters: ["Neko-chan"],
                artist: "Unknown"
            },
            trap: {
                title: "Trap Character",
                description: "Cross-dressing character",
                rating: "R18",
                characters: ["Trap-kun"],
                artist: "Unknown"
            }
            // Add more categories as needed...
        };

        return details[category] || {
            title: `${category.charAt(0).toUpperCase() + category.slice(1)} Content`,
            description: "NSFW artwork",
            rating: "R18",
            characters: ["Original Character"],
            artist: "Unknown"
        };
    }

    generateFallbackHentai(category) {
        return {
            id: `fallback_${Date.now()}`,
            category: category,
            url: 'https://example.com/fallback-hentai.jpg',
            source: 'fallback',
            fetchedAt: new Date().toISOString(),
            nsfw: true,
            tags: [category],
            title: `Fallback ${category} Content`,
            description: "This is fallback content",
            rating: "R18",
            characters: ["Fallback Character"],
            artist: "System",
            isFallback: true
        };
    }

    hasAccess(userJid) {
        if (!userJid) return false;

        const userVerification = this.verifiedUsers.get(userJid);
        if (!userVerification) return false;

        // Check if verification is still valid
        if (new Date() > new Date(userVerification.expiresAt)) {
            this.verifiedUsers.delete(userJid);
            return false;
        }

        return userVerification.isAdult;
    }

    grantAccess(userJid, verificationData) {
        if (verificationData.isAdult) {
            this.verifiedUsers.set(userJid, {
                ...verificationData,
                userJid: userJid,
                accessGranted: new Date().toISOString(),
                expiresAt: this.getAccessExpiry()
            });
            return true;
        }
        return false;
    }

    revokeAccess(userJid) {
        return this.verifiedUsers.delete(userJid);
    }

    getAccessExpiry(days = 30) {
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + days);
        return expiry.toISOString();
    }

    async getMultipleHentai(count = 5, category = 'random') {
        const results = [];
        for (let i = 0; i < count; i++) {
            try {
                const hentai = await this.getHentai(category);
                results.push(hentai);
                // Delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (error) {
                console.error(`Error fetching hentai ${i + 1}:`, error);
            }
        }
        return results;
    }

    getAvailableCategories() {
        return this.categories;
    }

    searchHentai(query) {
        const results = [];
        for (const [key, hentai] of this.contentCache) {
            if (hentai.tags.some(tag => tag.includes(query)) ||
                hentai.title.toLowerCase().includes(query.toLowerCase()) ||
                hentai.description.toLowerCase().includes(query.toLowerCase())) {
                results.push(hentai);
            }
        }
        return results;
    }

    getCachedContent() {
        return Array.from(this.contentCache.values());
    }

    clearCache() {
        const count = this.contentCache.size;
        this.contentCache.clear();
        return {
            success: true,
            message: `Cleared ${count} items from cache`
        };
    }

    getAccessStats() {
        return {
            verifiedUsers: this.verifiedUsers.size,
            cachedContent: this.contentCache.size,
            availableCategories: this.categories.length,
            totalAccessGrants: Array.from(this.verifiedUsers.values()).length
        };
    }

    async getHentaiByCharacter(characterName) {
        // This would typically search an API for specific character
        // For now, return random hentai with character name in title
        const hentai = await this.getHentai('random');
        hentai.title = `${characterName} - ${hentai.title}`;
        hentai.characters = [characterName];
        return hentai;
    }

    exportAccessData() {
        return {
            verifiedUsers: Array.from(this.verifiedUsers.entries()),
            cacheStats: this.getAccessStats(),
            exportedAt: new Date().toISOString()
        };
    }

    // Safety and moderation methods
    validateContent(content) {
        // Basic content validation
        const checks = {
            hasUrl: !!content.url,
            urlIsValid: this.isValidUrl(content.url),
            hasCategory: !!content.category,
            categoryIsValid: this.categories.includes(content.category),
            isMarkedNSFW: content.nsfw === true
        };

        const allValid = Object.values(checks).every(check => check === true);
        
        return {
            isValid: allValid,
            checks: checks,
            action: allValid ? 'approve' : 'reject'
        };
    }

    isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    // Rate limiting
    canUserRequest(userJid) {
        const user = this.verifiedUsers.get(userJid);
        if (!user) return false;

        // Simple rate limiting: max 10 requests per minute
        if (!user.requests) user.requests = [];
        
        const now = Date.now();
        const oneMinuteAgo = now - (60 * 1000);
        user.requests = user.requests.filter(time => time > oneMinuteAgo);
        
        if (user.requests.length >= 10) {
            return false;
        }

        user.requests.push(now);
        return true;
    }

    getUserRequestStats(userJid) {
        const user = this.verifiedUsers.get(userJid);
        if (!user || !user.requests) {
            return { requestsLastMinute: 0, canRequest: false };
        }

        const now = Date.now();
        const oneMinuteAgo = now - (60 * 1000);
        const recentRequests = user.requests.filter(time => time > oneMinuteAgo);
        
        return {
            requestsLastMinute: recentRequests.length,
            canRequest: recentRequests.length < 10,
            nextRequestAt: recentRequests.length >= 10 ? new Date(Math.min(...recentRequests) + 60000) : null
        };
    }
}

module.exports = HentaiManager;