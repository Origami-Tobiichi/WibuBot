const axios = require('axios');

class WibuMode {
    constructor() {
        this.isActive = false;
        this.personality = 'friendly';
        this.languageStyle = 'casual';
        this.animeReferences = true;
    }

    activateWibuMode() {
        this.isActive = true;
        this.personality = 'anime';
        this.languageStyle = 'anime';
        this.animeReferences = true;
        
        return {
            success: true,
            message: '🌸 Wibu Mode Activated! 🌸\n\n' +
                    '*Konnichiwa, Senpai!* 🎌\n' +
                    'Bot sekarang dalam mode wibu sejati!\n' +
                    'Siap untuk obrolan anime dan budaya Jepang! 🎎\n\n' +
                    '*Fitur aktif:*\n' +
                    '• 🎌 Personality anime\n' +
                    '• 🇯🇵 Bahasa style Jepang\n' +
                    '• 📚 Referensi anime\n' +
                    '• 🎨 Emoji wibu\n\n' +
                    '*Sayonara!* 💫'
        };
    }

    deactivateWibuMode() {
        this.isActive = false;
        this.personality = 'friendly';
        this.languageStyle = 'casual';
        this.animeReferences = false;
        
        return {
            success: true,
            message: 'Wibu Mode dimatikan. Kembali ke mode normal!'
        };
    }

    async processWibuMessage(message, userContext) {
        if (!this.isActive) {
            return this.activateWibuMode();
        }

        // Add anime flavor to the response
        const wibuResponse = await this.generateWibuResponse(message, userContext);
        return wibuResponse;
    }

    async generateWibuResponse(message, userContext) {
        const lowerMessage = message.toLowerCase();
        
        // Anime quotes and references
        if (lowerMessage.includes('quote') || lowerMessage.includes('katakan')) {
            return await this.getAnimeQuote();
        }

        if (lowerMessage.includes('rekomendasi') || lowerMessage.includes('anime')) {
            return await this.getAnimeRecommendation();
        }

        if (lowerMessage.includes('waifu') || lowerMessage.includes('husbando')) {
            return await this.generateWaifuHusbando();
        }

        if (lowerMessage.includes('jepang') || lowerMessage.includes('bahasa jepang')) {
            return await this.translateToJapanese(message);
        }

        // General wibu-style responses
        return this.createWibuStyleResponse(message);
    }

    async getAnimeQuote() {
        try {
            const response = await axios.get('https://animechan.xyz/api/random');
            const quote = response.data;
            
            return {
                text: `📜 *Anime Quote of the Day* 📜\n\n` +
                      `*"${quote.quote}"*\n\n` +
                      `— **${quote.character}** from *${quote.anime}*\n\n` +
                      `🎌 *Sugoi ne, Senpai?* 💫`,
                image: await this.getAnimeImage(quote.anime)
            };
        } catch (error) {
            const fallbackQuotes = [
                {
                    quote: "Believe in the me that believes in you!",
                    character: "Kamina",
                    anime: "Tengen Toppa Gurren Lagann"
                },
                {
                    quote: "People's lives don't end when they die. It ends when they lose faith.",
                    character: "Itachi Uchiha",
                    anime: "Naruto"
                },
                {
                    quote: "If you don't take risks, you can't create a future!",
                    character: "Monkey D. Luffy",
                    anime: "One Piece"
                }
            ];
            
            const randomQuote = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
            
            return {
                text: `📜 *Anime Quote* 📜\n\n` +
                      `*"${randomQuote.quote}"*\n\n` +
                      `— **${randomQuote.character}** from *${randomQuote.anime}*\n\n` +
                      `🎌 *Ganbatte!* 💪`
            };
        }
    }

    async getAnimeRecommendation() {
        const recommendations = [
            {
                title: "Attack on Titan",
                genre: "Action, Drama, Fantasy",
                rating: "9.0/10",
                description: "Perjuangan manusia melawan titan raksasa",
                season: "4 Seasons"
            },
            {
                title: "Demon Slayer",
                genre: "Action, Supernatural",
                rating: "8.7/10",
                description: "Petualangan Tanjiro membasmi iblis",
                season: "3 Seasons + Movie"
            },
            {
                title: "Your Lie in April",
                genre: "Drama, Music, Romance",
                rating: "8.7/10",
                description: "Kisah pianist muda dan violinist",
                season: "1 Season"
            },
            {
                title: "One Punch Man",
                genre: "Action, Comedy, Parody",
                rating: "8.8/10",
                description: "Pahlawan yang bisa mengalahkan musuh dengan satu pukulan",
                season: "2 Seasons"
            }
        ];

        const randomRec = recommendations[Math.floor(Math.random() * recommendations.length)];
        
        return {
            text: `📺 *Anime Recommendation* 📺\n\n` +
                  `*${randomRec.title}*\n` +
                  `⭐ Rating: ${randomRec.rating}\n` +
                  `🎭 Genre: ${randomRec.genre}\n` +
                  `📅 ${randomRec.season}\n\n` +
                  `*Sinopsis:*\n${randomRec.description}\n\n` +
                  `🎌 *Enjoy watching, Senpai!* 🍿`
        };
    }

    async generateWaifuHusbando() {
        try {
            const response = await axios.get('https://api.waifu.pics/sfw/waifu');
            const waifuImage = response.data.url;
            
            const waifuTypes = ['Tsundere', 'Yandere', 'Kuudere', 'Dandere', 'Genki'];
            const randomType = waifuTypes[Math.floor(Math.random() * waifuTypes.length)];
            
            const personalities = [
                "Suka memasak dan merawat orang",
                "Pintar dan serius dalam belajar",
                "Ceria dan selalu semangat",
                "Misterius dan penuh rahasia",
                "Setia dan protektif"
            ];
            const randomPersonality = personalities[Math.floor(Math.random() * personalities.length)];
            
            return {
                text: `🎨 *Your Generated Waifu* 🎨\n\n` +
                      `*Type:* ${randomType}\n` +
                      `*Personality:* ${randomPersonality}\n` +
                      `*Affection:* ${Math.floor(Math.random() * 100)}%\n\n` +
                      `🎌 *Kawaii desu ne!* 💖`,
                image: waifuImage
            };
        } catch (error) {
            return {
                text: `🎨 *Your Generated Waifu* 🎨\n\n` +
                      `*Name:* Sakura-chan\n` +
                      `*Type:* Tsundere\n` +
                      `*Anime:* Original Character\n` +
                      `*Special Skill:* Memasak bento yang lezat\n\n` +
                      `🎌 *Baka! Jangan lihat aku seperti itu!* 💢\n\n` +
                      `*(Maaf, API waifu sedang down. Ini waifu default!)*`
            };
        }
    }

    async translateToJapanese(text) {
        // Simple Indonesian to Japanese translation examples
        const translations = {
            'halo': 'Konnichiwa (こんにちは)',
            'terima kasih': 'Arigatou gozaimasu (ありがとうございます)',
            'selamat pagi': 'Ohayou gozaimasu (おはようございます)',
            'selamat malam': 'Oyasumi nasai (おやすみなさい)',
            'apa kabar': 'Ogenki desu ka (お元気ですか)',
            'saya baik': 'Watashi wa genki desu (私は元気です)',
            'maaf': 'Gomen nasai (ごめんなさい)',
            'sampai jumpa': 'Sayounara (さようなら)',
            'saya cinta kamu': 'Aishiteru (愛してる)',
            'selamat datang': 'Youkoso (ようこそ)'
        };

        const words = text.toLowerCase().split(' ');
        let translation = '';
        
        for (const word of words) {
            if (translations[word]) {
                translation += translations[word] + ' ';
            }
        }

        if (translation) {
            return {
                text: `🇯🇵 *Japanese Translation* 🇯🇵\n\n` +
                      `*Original:* ${text}\n` +
                      `*Japanese:* ${translation}\n\n` +
                      `🎌 *Wakarimasu ka?* 📚`
            };
        } else {
            return {
                text: `🇯🇵 *Japanese Phrase* 🇯🇵\n\n` +
                      `*Konnichiwa!* (Halo!)\n` +
                      `*Genki desu ka?* (Apa kabar?)\n` +
                      `*Watashi wa botto desu* (Saya adalah bot)\n\n` +
                      `🎌 *Ganbatte ne!* 💪`
            };
        }
    }

    createWibuStyleResponse(originalMessage) {
        const wibuPhrases = [
            "Nani? ",
            "Sugoi! ",
            "Kawaii! ",
            "Baka! ",
            "Hai! ",
            "Arigatou! ",
            "Gomen nasai! ",
            "Yosh! ",
            "Moe moe kyun! ",
            "Itadakimasu! "
        ];

        const wibuEndings = [
            " desu!",
            " ne!",
            " yo!",
            " da yo!",
            " kana?",
            " deshou?",
            " na no!",
            " wa!",
            " ~su!",
            " dayo!"
        ];

        const randomPhrase = wibuPhrases[Math.floor(Math.random() * wibuPhrases.length)];
        const randomEnding = wibuEndings[Math.floor(Math.random() * wibuEndings.length)];

        // Simple response transformation
        let response = originalMessage;
        
        if (response.includes('?')) {
            response = response.replace('?', ' kana?');
        }
        
        if (response.endsWith('!')) {
            response = response.replace('!', ' desu!');
        }

        const finalResponse = randomPhrase + response + randomEnding;

        return {
            text: `🎌 *Wibu Mode Response* 🎌\n\n` +
                  `${finalResponse}\n\n` +
                  `💫 *Senpai noticed me!* ✨`,
            emoji: this.getRandomWibuEmoji()
        };
    }

    getRandomWibuEmoji() {
        const wibuEmojis = ['🌸', '🎌', '🎎', '🍥', '🎨', '💮', '🍣', '🎏', '🗾', '🏯'];
        return wibuEmojis[Math.floor(Math.random() * wibuEmojis.length)];
    }

    async getAnimeImage(animeTitle) {
        // This would typically call an anime image API
        // For now, return null or a default image
        return null;
    }

    getWibuStatus() {
        return {
            active: this.isActive,
            personality: this.personality,
            languageStyle: this.languageStyle,
            animeReferences: this.animeReferences,
            activationTime: this.isActive ? new Date().toISOString() : null
        };
    }

    setWibuPersonality(personality) {
        const validPersonalities = ['tsundere', 'yandere', 'kuudere', 'genki', 'moe'];
        
        if (validPersonalities.includes(personality)) {
            this.personality = personality;
            return {
                success: true,
                message: `Personality diubah menjadi: ${personality}`
            };
        } else {
            return {
                success: false,
                message: `Personality tidak valid. Pilihan: ${validPersonalities.join(', ')}`
            };
        }
    }
}

module.exports = WibuMode;