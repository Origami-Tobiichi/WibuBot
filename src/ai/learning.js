const fs = require('fs').promises;
const path = require('path');

class LearningSystem {
    constructor() {
        this.learningPath = './data/learning';
        this.patterns = new Map();
        this.ensureDirectories();
        this.loadPatterns();
    }

    async ensureDirectories() {
        try {
            await fs.mkdir(this.learningPath, { recursive: true });
        } catch (error) {
            console.error('Error creating learning directories:', error);
        }
    }

    async loadPatterns() {
        try {
            const patternsFile = path.join(this.learningPath, 'patterns.json');
            const data = await fs.readFile(patternsFile, 'utf8');
            const loadedPatterns = JSON.parse(data);
            
            for (const [key, value] of Object.entries(loadedPatterns)) {
                this.patterns.set(key, value);
            }
        } catch (error) {
            // Initialize with empty patterns
            console.log('No existing patterns found, starting fresh...');
        }
    }

    async savePatterns() {
        try {
            const patternsFile = path.join(this.learningPath, 'patterns.json');
            const patternsObj = Object.fromEntries(this.patterns);
            await fs.writeFile(patternsFile, JSON.stringify(patternsObj, null, 2));
        } catch (error) {
            console.error('Error saving patterns:', error);
        }
    }

    async analyzeInteraction(userJid, userMessage, aiResponse) {
        const message = userMessage.toLowerCase().trim();
        
        // Extract keywords and patterns
        const keywords = this.extractKeywords(message);
        const sentiment = this.analyzeSentiment(message);
        const intent = this.detectIntent(message);

        // Update user patterns
        await this.updateUserPatterns(userJid, {
            message: message,
            keywords: keywords,
            sentiment: sentiment,
            intent: intent,
            response: aiResponse,
            timestamp: Date.now()
        });

        // Update global patterns
        this.updateGlobalPatterns(message, aiResponse, intent);

        // Save patterns periodically
        if (Math.random() < 0.1) { // 10% chance to save
            await this.savePatterns();
        }
    }

    extractKeywords(message) {
        const stopWords = ['yang', 'dan', 'di', 'ke', 'dari', 'untuk', 'pada', 'dengan', 'ini', 'itu'];
        const words = message.split(/\s+/)
            .filter(word => word.length > 2 && !stopWords.includes(word.toLowerCase()))
            .slice(0, 10); // Limit to 10 keywords
        
        return words;
    }

    analyzeSentiment(message) {
        const positiveWords = ['senang', 'bagus', 'baik', 'terima kasih', 'mantap', 'keren', 'love', 'like'];
        const negativeWords = ['marah', 'jelek', 'buruk', 'benci', 'susah', 'sulit', 'gak', 'tidak'];
        
        let score = 0;
        positiveWords.forEach(word => {
            if (message.includes(word)) score += 1;
        });
        negativeWords.forEach(word => {
            if (message.includes(word)) score -= 1;
        });

        if (score > 0) return 'positive';
        if (score < 0) return 'negative';
        return 'neutral';
    }

    detectIntent(message) {
        const intents = {
            greeting: ['halo', 'hi', 'hello', 'hai', 'p', 'assalamualaikum'],
            question: ['apa', 'bagaimana', 'kenapa', 'kapan', 'dimana', 'berapa', '?'],
            command: ['cari', 'download', 'main', 'game', 'putar', 'stop'],
            compliment: ['terima kasih', 'makasih', 'thanks', 'good', 'bagus'],
            complaint: ['error', 'gagal', 'salah', 'bug', 'masalah']
        };

        for (const [intent, keywords] of Object.entries(intents)) {
            if (keywords.some(keyword => message.includes(keyword))) {
                return intent;
            }
        }

        return 'general';
    }

    async updateUserPatterns(userJid, interaction) {
        const userKey = `user_${userJid}`;
        const userPatterns = this.patterns.get(userKey) || {
            frequentIntents: {},
            commonKeywords: {},
            responsePreferences: {},
            interactionCount: 0,
            lastActive: Date.now()
        };

        // Update intent frequency
        userPatterns.frequentIntents[interaction.intent] = 
            (userPatterns.frequentIntents[interaction.intent] || 0) + 1;

        // Update keyword frequency
        interaction.keywords.forEach(keyword => {
            userPatterns.commonKeywords[keyword] = 
                (userPatterns.commonKeywords[keyword] || 0) + 1;
        });

        // Update interaction count
        userPatterns.interactionCount += 1;
        userPatterns.lastActive = Date.now();

        this.patterns.set(userKey, userPatterns);
    }

    updateGlobalPatterns(message, response, intent) {
        const globalKey = 'global_patterns';
        const globalPatterns = this.patterns.get(globalKey) || {
            commonPhrases: {},
            effectiveResponses: {},
            intentDistribution: {},
            totalInteractions: 0
        };

        // Track common phrases
        if (message.length > 5) {
            globalPatterns.commonPhrases[message] = 
                (globalPatterns.commonPhrases[message] || 0) + 1;
        }

        // Track effective responses by intent
        if (!globalPatterns.effectiveResponses[intent]) {
            globalPatterns.effectiveResponses[intent] = {};
        }
        globalPatterns.effectiveResponses[intent][response] = 
            (globalPatterns.effectiveResponses[intent][response] || 0) + 1;

        // Update intent distribution
        globalPatterns.intentDistribution[intent] = 
            (globalPatterns.intentDistribution[intent] || 0) + 1;

        globalPatterns.totalInteractions += 1;

        this.patterns.set(globalKey, globalPatterns);
    }

    async getUserPatterns(userJid) {
        const userKey = `user_${userJid}`;
        const patterns = this.patterns.get(userKey);
        
        if (!patterns) {
            return {
                frequentIntents: {},
                commonKeywords: {},
                interactionCount: 0
            };
        }

        // Get top 5 intents and keywords
        const topIntents = Object.entries(patterns.frequentIntents)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .reduce((obj, [key, val]) => ({ ...obj, [key]: val }), {});

        const topKeywords = Object.entries(patterns.commonKeywords)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .reduce((obj, [key, val]) => ({ ...obj, [key]: val }), {});

        return {
            frequentIntents: topIntents,
            commonKeywords: topKeywords,
            interactionCount: patterns.interactionCount,
            preferredTone: patterns.responsePreferences.tone || 'friendly'
        };
    }

    getRecommendedResponse(intent, userPatterns) {
        const globalKey = 'global_patterns';
        const globalPatterns = this.patterns.get(globalKey);

        if (!globalPatterns || !globalPatterns.effectiveResponses[intent]) {
            return null;
        }

        // Find most effective response for this intent
        const responses = globalPatterns.effectiveResponses[intent];
        const bestResponse = Object.entries(responses)
            .sort((a, b) => b[1] - a[1])[0];

        return bestResponse ? bestResponse[0] : null;
    }
}

module.exports = LearningSystem;