const axios = require('axios');

class AnimeQuotes {
    constructor() {
        this.quotesCache = [];
        this.lastFetch = null;
    }

    async getRandomQuote() {
        try {
            const response = await axios.get('https://animechan.xyz/api/random');
            const quote = response.data;
            
            // Cache the quote
            this.quotesCache.push(quote);
            if (this.quotesCache.length > 10) {
                this.quotesCache.shift();
            }
            
            this.lastFetch = new Date();
            return quote;
        } catch (error) {
            console.error('Error fetching anime quote:', error);
            return this.getFallbackQuote();
        }
    }

    async getQuoteByAnime(animeTitle) {
        try {
            const response = await axios.get(`https://animechan.xyz/api/random/anime?title=${encodeURIComponent(animeTitle)}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching quote by anime:', error);
            return this.getFallbackQuote();
        }
    }

    async getQuoteByCharacter(characterName) {
        try {
            const response = await axios.get(`https://animechan.xyz/api/random/character?name=${encodeURIComponent(characterName)}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching quote by character:', error);
            return this.getFallbackQuote();
        }
    }

    getFallbackQuote() {
        const fallbackQuotes = [
            {
                anime: "Naruto",
                character: "Naruto Uzumaki",
                quote: "I'm not gonna run away, I never go back on my word! That's my nindo: my ninja way!"
            },
            {
                anime: "One Piece",
                character: "Monkey D. Luffy",
                quote: "I don't want to conquer anything. I just think the guy with the most freedom in the whole ocean is the Pirate King!"
            },
            {
                anime: "Attack on Titan",
                character: "Levi Ackerman",
                quote: "Give up on your dreams and die."
            },
            {
                anime: "Death Note",
                character: "L Lawliet",
                quote: "There are many types of monsters that scare me: Monsters who cause trouble without showing themselves, monsters who abduct children, monsters who devour dreams, monsters who suck blood... and then, monsters who tell nothing but lies. Lying monsters are a real nuisance: They are much more cunning than others. They pose as humans even though they have no understanding of the human heart."
            },
            {
                anime: "My Hero Academia",
                character: "All Might",
                quote: "It's fine now. Why? Because I am here!"
            }
        ];
        
        return fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
    }

    async getMultipleQuotes(count = 5) {
        try {
            const quotes = [];
            for (let i = 0; i < count; i++) {
                const quote = await this.getRandomQuote();
                quotes.push(quote);
                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            return quotes;
        } catch (error) {
            console.error('Error fetching multiple quotes:', error);
            return [this.getFallbackQuote()];
        }
    }

    searchQuotes(keyword) {
        return this.quotesCache.filter(quote => 
            quote.quote.toLowerCase().includes(keyword.toLowerCase()) ||
            quote.character.toLowerCase().includes(keyword.toLowerCase()) ||
            quote.anime.toLowerCase().includes(keyword.toLowerCase())
        );
    }

    getCachedQuotes() {
        return this.quotesCache;
    }

    clearCache() {
        this.quotesCache = [];
        return { success: true, message: 'Quote cache cleared' };
    }

    getStats() {
        return {
            cachedQuotes: this.quotesCache.length,
            lastFetch: this.lastFetch,
            cacheSize: JSON.stringify(this.quotesCache).length
        };
    }
}

module.exports = AnimeQuotes;