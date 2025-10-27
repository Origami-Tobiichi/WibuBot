const axios = require('axios');

class WaifuGenerator {
    constructor() {
        this.waifuCache = new Map();
        this.categories = ['waifu', 'neko', 'shinobu', 'megumin', 'bully', 'cuddle', 'cry', 'hug', 'awoo', 'kiss', 'lick', 'pat', 'smug', 'bonk', 'yeet', 'blush', 'smile', 'wave', 'highfive', 'handhold', 'nom', 'bite', 'glomp', 'slap', 'kill', 'kick', 'happy', 'wink', 'poke', 'dance', 'cringe'];
    }

    async generateWaifu(category = 'waifu') {
        try {
            // Validate category
            if (!this.categories.includes(category)) {
                category = 'waifu';
            }

            const response = await axios.get(`https://api.waifu.pics/sfw/${category}`);
            const imageUrl = response.data.url;

            // Generate waifu details
            const waifuDetails = this.generateWaifuDetails(category);
            
            const waifu = {
                name: waifuDetails.name,
                anime: waifuDetails.anime,
                type: waifuDetails.type,
                age: waifuDetails.age,
                personality: waifuDetails.personality,
                skills: waifuDetails.skills,
                image: imageUrl,
                category: category,
                generatedAt: new Date().toISOString()
            };

            // Cache the waifu
            this.waifuCache.set(waifu.name, waifu);
            if (this.waifuCache.size > 50) {
                const firstKey = this.waifuCache.keys().next().value;
                this.waifuCache.delete(firstKey);
            }

            return waifu;

        } catch (error) {
            console.error('Error generating waifu:', error);
            return this.generateFallbackWaifu(category);
        }
    }

    generateWaifuDetails(category) {
        const names = {
            waifu: ['Sakura', 'Hinata', 'Asuna', 'Zero Two', 'Mikasa', 'Rem', 'Emilia', 'Nezuko', 'Kaguya', 'Mai'],
            neko: ['Neko', 'Koneko', 'Mimi', 'Tama', 'Kuro', 'Shiro', 'Mocha', 'Choco', 'Vanilla', 'Cinnamon'],
            default: ['Airi', 'Yuki', 'Hana', 'Akari', 'Sora', 'Rin', 'Yui', 'Mio', 'Ruka', 'Saki']
        };

        const animes = [
            'Sword Art Online', 'Naruto', 'Attack on Titan', 'Re:Zero',
            'Demon Slayer', 'Kaguya-sama: Love is War', 'My Hero Academia',
            'One Piece', 'Bleach', 'Fairy Tail', 'Tokyo Revengers', 'Jujutsu Kaisen'
        ];

        const personalities = [
            'Tsundere (Keras di luar, lembut di dalam)',
            'Yandere (Cinta yang obsesif dan berbahaya)',
            'Kuudere (Dingin di luar, hangat di dalam)',
            'Dandere (Pendiam tapi perhatian)',
            'Genki (Ceria dan bersemangat)',
            'Moe (Imut dan menggemaskan)',
            'Onee-san (Kakak yang penyayang)',
            'Ojou-sama (Putri yang elegan)'
        ];

        const skills = [
            'Memasak bento yang lezat',
            'Ahli dalam seni bela diri',
            'Pintar dalam pelajaran sekolah',
            'Bisa menyanyikan lagu dengan merdu',
            'Ahli dalam merawat orang',
            'Pandai membuat kerajinan tangan',
            'Ahli dalam teknologi',
            'Bisa berbicara dengan hewan'
        ];

        const nameList = names[category] || names.default;
        const randomName = nameList[Math.floor(Math.random() * nameList.length)];
        const randomAnime = animes[Math.floor(Math.random() * animes.length)];
        const randomPersonality = personalities[Math.floor(Math.random() * personalities.length)];
        const randomSkills = skills[Math.floor(Math.random() * skills.length)];

        return {
            name: randomName,
            anime: randomAnime,
            type: category,
            age: Math.floor(Math.random() * 10) + 16,
            personality: randomPersonality,
            skills: randomSkills
        };
    }

    generateFallbackWaifu(category) {
        return {
            name: 'Sakura',
            anime: 'Cardcaptor Sakura',
            type: category,
            age: 18,
            personality: 'Genki (Ceria dan bersemangat)',
            skills: 'Ahli dalam sihir dan keramahan',
            image: 'https://example.com/fallback-waifu.jpg',
            category: category,
            generatedAt: new Date().toISOString(),
            isFallback: true
        };
    }

    async generateNSFWWaifu(category = 'waifu') {
        // Note: This would require NSFW API and age verification
        // For safety, we'll return a message about NSFW content
        return {
            error: 'NSFW content requires age verification and premium access.',
            message: 'Please verify your age and have premium subscription to access NSFW content.'
        };
    }

    async getWaifuByCategory(category) {
        return await this.generateWaifu(category);
    }

    getAvailableCategories() {
        return this.categories;
    }

    searchWaifu(name) {
        const results = [];
        for (const [key, waifu] of this.waifuCache) {
            if (waifu.name.toLowerCase().includes(name.toLowerCase()) ||
                waifu.anime.toLowerCase().includes(name.toLowerCase())) {
                results.push(waifu);
            }
        }
        return results;
    }

    getCachedWaifus() {
        return Array.from(this.waifuCache.values());
    }

    clearCache() {
        const count = this.waifuCache.size;
        this.waifuCache.clear();
        return { 
            success: true, 
            message: `Cleared ${count} waifus from cache` 
        };
    }

    getStats() {
        return {
            cachedWaifus: this.waifuCache.size,
            categories: this.categories.length,
            cacheSize: JSON.stringify(Array.from(this.waifuCache.values())).length
        };
    }

    async generateWaifuBatch(count = 5) {
        const waifus = [];
        for (let i = 0; i < count; i++) {
            const waifu = await this.generateWaifu();
            waifus.push(waifu);
            // Delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        return waifus;
    }
}

module.exports = WaifuGenerator;