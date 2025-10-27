const fs = require('fs').promises;
const path = require('path');

class MemoryManager {
    constructor() {
        this.memoryPath = './data/memory';
        this.ensureDirectories();
    }

    async ensureDirectories() {
        try {
            await fs.mkdir(this.memoryPath, { recursive: true });
        } catch (error) {
            console.error('Error creating memory directories:', error);
        }
    }

    async getUserMemory(userJid) {
        try {
            const memoryFile = path.join(this.memoryPath, `${userJid.replace(/[@\.]/g, '_')}.json`);
            const data = await fs.readFile(memoryFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            // Return default memory structure
            return this.getDefaultMemory();
        }
    }

    getDefaultMemory() {
        return {
            preferences: {
                language: 'id',
                tone: 'friendly',
                interests: []
            },
            recentConversations: [],
            learnedPatterns: {},
            userFacts: {},
            interactionCount: 0,
            lastUpdated: new Date().toISOString()
        };
    }

    async updateMemory(userJid, userMessage, aiResponse) {
        try {
            const memory = await this.getUserMemory(userJid);
            
            // Update conversation history
            memory.recentConversations.push({
                user: userMessage,
                ai: aiResponse,
                timestamp: new Date().toISOString()
            });

            // Keep only last 20 conversations
            if (memory.recentConversations.length > 20) {
                memory.recentConversations = memory.recentConversations.slice(-20);
            }

            // Update interaction count
            memory.interactionCount = (memory.interactionCount || 0) + 1;
            memory.lastUpdated = new Date().toISOString();

            // Extract and learn user preferences
            await this.learnFromInteraction(memory, userMessage, aiResponse);

            // Save updated memory
            await this.saveUserMemory(userJid, memory);

            return memory;

        } catch (error) {
            console.error('Error updating memory:', error);
            return this.getDefaultMemory();
        }
    }

    async learnFromInteraction(memory, userMessage, aiResponse) {
        const message = userMessage.toLowerCase();
        
        // Learn language preferences
        if (message.includes('bahasa indonesia') || message.includes('pakai bahasa indonesia')) {
            memory.preferences.language = 'id';
        }
        if (message.includes('english') || message.includes('use english')) {
            memory.preferences.language = 'en';
        }

        // Learn tone preferences
        if (message.includes('formal') || message.includes('resmi')) {
            memory.preferences.tone = 'formal';
        }
        if (message.includes('casual') || message.includes('santai')) {
            memory.preferences.tone = 'casual';
        }
        if (message.includes('humor') || message.includes('lucu')) {
            memory.preferences.tone = 'humorous';
        }

        // Learn interests from frequent topics
        const interests = ['game', 'music', 'movie', 'anime', 'sport', 'tech', 'news'];
        interests.forEach(interest => {
            if (message.includes(interest) && !memory.preferences.interests.includes(interest)) {
                memory.preferences.interests.push(interest);
            }
        });

        // Extract user facts
        if (message.includes('nama saya') || message.includes('saya disebut')) {
            const nameMatch = message.match(/(nama saya|saya disebut)\s+([a-zA-Z0-9]+)/i);
            if (nameMatch) {
                memory.userFacts.name = nameMatch[2];
            }
        }

        if (message.includes('umur') || message.includes('usia')) {
            const ageMatch = message.match(/(umur|usia)\s+(\d+)/i);
            if (ageMatch) {
                memory.userFacts.age = parseInt(ageMatch[2]);
            }
        }
    }

    async saveUserMemory(userJid, memory) {
        try {
            const memoryFile = path.join(this.memoryPath, `${userJid.replace(/[@\.]/g, '_')}.json`);
            await fs.writeFile(memoryFile, JSON.stringify(memory, null, 2));
        } catch (error) {
            console.error('Error saving memory:', error);
        }
    }

    async getConversationContext(userJid, maxMessages = 5) {
        const memory = await this.getUserMemory(userJid);
        const recent = memory.recentConversations.slice(-maxMessages);
        
        return recent.map(conv => ({
            user: conv.user,
            assistant: conv.ai
        }));
    }

    async getUserPreferences(userJid) {
        const memory = await this.getUserMemory(userJid);
        return memory.preferences;
    }

    async getAllMemories() {
        try {
            const files = await fs.readdir(this.memoryPath);
            const memories = [];
            
            for (const file of files) {
                const data = await fs.readFile(path.join(this.memoryPath, file), 'utf8');
                memories.push(JSON.parse(data));
            }
            
            return memories;
        } catch (error) {
            return [];
        }
    }
}

module.exports = MemoryManager;