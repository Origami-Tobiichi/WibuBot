const axios = require('axios');
const MemoryManager = require('./memory');
const LearningSystem = require('./learning');

class AIService {
    constructor() {
        this.memoryManager = new MemoryManager();
        this.learningSystem = new LearningSystem();
        this.apiKey = process.env.OPENAI_API_KEY;
    }

    async generateResponse(userJid, message, context = {}) {
        try {
            // Get user memory and learning patterns
            const userMemory = await this.memoryManager.getUserMemory(userJid);
            const learningPatterns = await this.learningSystem.getUserPatterns(userJid);

            // Prepare conversation context
            const conversationContext = this.buildContext(userMemory, learningPatterns, context);

            // Generate AI response
            const response = await this.callAIAPI(message, conversationContext);

            // Update memory and learning
            await this.memoryManager.updateMemory(userJid, message, response);
            await this.learningSystem.analyzeInteraction(userJid, message, response);

            return response;

        } catch (error) {
            console.error('AI Service Error:', error);
            return this.getFallbackResponse();
        }
    }

    async callAIAPI(message, context) {
        if (!this.apiKey) {
            return this.getLocalAIResponse(message, context);
        }

        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: `You are a helpful WhatsApp bot assistant. Context: ${JSON.stringify(context)}`
                },
                {
                    role: "user",
                    content: message
                }
            ],
            max_tokens: 500,
            temperature: 0.7
        }, {
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        return response.data.choices[0].message.content;
    }

    getLocalAIResponse(message, context) {
        // Simple local AI responses for fallback
        const greetings = ['halo', 'hi', 'hello', 'hai', 'hey'];
        const thanks = ['terima kasih', 'thanks', 'thank you', 'makasih'];
        
        if (greetings.some(g => message.toLowerCase().includes(g))) {
            return `Halo! Ada yang bisa saya bantu? 😊`;
        }
        
        if (thanks.some(t => message.toLowerCase().includes(t))) {
            return `Sama-sama! Senang bisa membantu Anda 🤗`;
        }

        return `Saya adalah AI assistant. Untuk respons yang lebih baik, silakan setup API key OpenAI. Saat ini saya memahami: "${message}"`;
    }

    getFallbackResponse() {
        const fallbacks = [
            "Maaf, saya sedang mengalami gangguan. Coba lagi nanti!",
            "Sepertinya ada masalah dengan koneksi AI saya. Coba ketik !menu untuk fitur lain!",
            "Oops! AI sedang sibuk. Mau main game? Ketik !game ya!",
            "Sementara ini saya tidak bisa merespons dengan AI. Coba fitur download atau game dulu!"
        ];
        
        return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }

    buildContext(memory, patterns, currentContext) {
        return {
            userPreferences: memory.preferences || {},
            conversationHistory: memory.recentConversations || [],
            learningPatterns: patterns,
            currentContext: currentContext,
            botPersonality: "friendly, helpful, humorous"
        };
    }
}

module.exports = AIService;