const axios = require('axios');
const AnimeQuotes = require('./animeQuotes');
const WaifuGenerator = require('./waifuGenerator');
const JapaneseTranslator = require('./japaneseTranslator');

class WibuManager {
    constructor() {
        this.animeQuotes = new AnimeQuotes();
        this.waifuGenerator = new WaifuGenerator();
        this.japaneseTranslator = new JapaneseTranslator();
        this.wibuModeUsers = new Map();
    }

    async activateWibuMode(jid) {
        this.wibuModeUsers.set(jid, {
            activated: true,
            activatedAt: Date.now(),
            level: 1,
            exp: 0,
            waifu: null
        });

        const welcomeMessage = {
            text: `🌸 *WIBU MODE ACTIVATED!* 🌸\n\n` +
                  `*Konnichiwa, Senpai!* 👋\n\n` +
                  `🎌 *Fitur Wibu Mode:*\n` +
                  `• 📜 Anime quotes harian\n` +
                  `• 🎨 Generate waifu/husbando\n` +
                  `• 🇯🇵 Translator Jepang-Indonesia\n` +
                  `• 🎎 Fakta anime menarik\n` +
                  `• 📺 Rekomendasi anime\n\n` +
                  `*Perintah tersedia:*\n` +
                  `!anime quote - Quotes anime\n` +
                  `!anime waifu - Generate waifu\n` +
                  `!anime translate - Terjemahan\n` +
                  `!anime fact - Fakta anime\n` +
                  `!anime recommend - Rekomendasi\n\n` +
                  `*Sayonara!* 🎉`,
            buttons: this.generateWibuButtons()
        };

        return welcomeMessage;
    }

    async handleAnimeQuote() {
        try {
            const quote = await this.animeQuotes.getRandomQuote();
            
            return {
                text: `📜 *ANIME QUOTE OF THE DAY* 📜\n\n` +
                      `*"${quote.quote}"*\n\n` +
                      `— *${quote.character}* from *${quote.anime}*\n\n` +
                      `💫 Diberdayakan oleh wibu sejati!`,
                image: quote.image || null
            };
        } catch (error) {
            return {
                text: `❌ Gagal mengambil quote anime.\nCoba lagi nanti!`
            };
        }
    }

    async handleWaifuGenerate(type = 'waifu') {
        try {
            const waifu = await this.waifuGenerator.generateWaifu(type);
            
            let description = '';
            if (waifu.description) {
                description = `\n\n*Deskripsi:*\n${waifu.description}`;
            }

            return {
                text: `🎨 *${type.toUpperCase()} GENERATED!* 🎨\n\n` +
                      `*Nama:* ${waifu.name}\n` +
                      `*Anime:* ${waifu.anime}\n` +
                      `*Tipe:* ${waifu.type}` +
                      description,
                image: waifu.image
            };
        } catch (error) {
            return {
                text: `❌ Gagal generate ${type}.\nCoba lagi nanti!`
            };
        }
    }

    async handleJapaneseTranslate(text) {
        try {
            const translation = await this.japaneseTranslator.translateToJapanese(text);
            
            return {
                text: `🇯🇵 *JAPANESE TRANSLATION* 🇯🇵\n\n` +
                      `*Original (ID):*\n${text}\n\n` +
                      `*Japanese:*\n${translation.japanese}\n\n` +
                      `*Romaji:*\n${translation.romaji}\n\n` +
                      `*English:*\n${translation.english}`
            };
        } catch (error) {
            return {
                text: `❌ Gagal menerjemahkan.\nCoba lagi nanti!`
            };
        }
    }

    async handleAnimeFact() {
        const facts = [
            "Anime pertama di dunia dibuat pada tahun 1917 berjudul 'Namakura Gatana'",
            "Studio Ghibli didirikan oleh Hayao Miyazaki dan Isao Takahata pada tahun 1985",
            "'One Piece' memegang rekor sebagai manga terpanjang yang masih berlanjut",
            "Kata 'anime' adalah singkatan dari 'animation' dalam bahasa Jepang",
            "Naruto sebenarnya terinspirasi dari cerita rakyat Jepang tentang rubah (kitsune)",
            "Attack on Titan awalnya ditolak oleh beberapa penerbit sebelum menjadi hits",
            "Studio Ghibli tidak menggunakan storyboard dalam proses produksinya",
            "Dragon Ball telah terjual lebih dari 300 juta kopi di seluruh dunia"
        ];

        const randomFact = facts[Math.floor(Math.random() * facts.length)];

        return {
            text: `🎎 *ANIME FACT* 🎎\n\n` +
                  `${randomFact}\n\n` +
                  `📚 *Source:* Wibu Encyclopedia`
        };
    }

    async handleAnimeRecommend(genre = 'action') {
        const recommendations = {
            action: [
                { title: "Attack on Titan", rating: "9.0/10", year: "2013" },
                { title: "Demon Slayer", rating: "8.7/10", year: "2019" },
                { title: "One Punch Man", rating: "8.8/10", year: "2015" }
            ],
            romance: [
                { title: "Your Lie in April", rating: "8.7/10", year: "2014" },
                { title: "Toradora!", rating: "8.1/10", year: "2008" },
                { title: "Kaguya-sama: Love is War", rating: "8.5/10", year: "2019" }
            ],
            comedy: [
                { title: "Gintama", rating: "9.0/10", year: "2006" },
                { title: "Daily Lives of High School Boys", rating: "8.2/10", year: "2012" },
                { title: "Konosuba", rating: "8.1/10", year: "2016" }
            ]
        };

        const genreRecs = recommendations[genre] || recommendations.action;
        let recText = `📺 *ANIME RECOMMENDATIONS* 📺\n\n` +
                     `*Genre:* ${genre.toUpperCase()}\n\n`;

        genreRecs.forEach((anime, index) => {
            recText += `*${index + 1}. ${anime.title}*\n`;
            recText += `⭐ ${anime.rating} | 📅 ${anime.year}\n\n`;
        });

        recText += `🎌 *Selamat menonton, Senpai!*`;

        return {
            text: recText,
            buttons: [
                [
                    { buttonId: '!anime recommend action', buttonText: { displayText: '💥 ACTION' }, type: 1 },
                    { buttonId: '!anime recommend romance', buttonText: { displayText: '💕 ROMANCE' }, type: 1 }
                ],
                [
                    { buttonId: '!anime recommend comedy', buttonText: { displayText: '😂 COMEDY' }, type: 1 },
                    { buttonId: '!anime fact', buttonText: { displayText: '🎎 FACT' }, type: 1 }
                ]
            ]
        };
    }

    generateWibuButtons() {
        return [
            [
                { buttonId: '!anime quote', buttonText: { displayText: '📜 QUOTE' }, type: 1 },
                { buttonId: '!anime waifu', buttonText: { displayText: '🎨 WAIFU' }, type: 1 }
            ],
            [
                { buttonId: '!anime translate', buttonText: { displayText: '🇯🇵 TRANSLATE' }, type: 1 },
                { buttonId: '!anime fact', buttonText: { displayText: '🎎 FACT' }, type: 1 }
            ],
            [
                { buttonId: '!anime recommend', buttonText: { displayText: '📺 RECOMMEND' }, type: 1 },
                { buttonId: '!menu', buttonText: { displayText: '📋 MAIN MENU' }, type: 1 }
            ]
        ];
    }

    isWibuModeActive(jid) {
        return this.wibuModeUsers.has(jid);
    }

    getWibuStats(jid) {
        const user = this.wibuModeUsers.get(jid);
        if (!user) return null;

        return {
            activated: user.activated,
            duration: Date.now() - user.activatedAt,
            level: user.level,
            exp: user.exp,
            waifu: user.waifu
        };
    }
}

module.exports = WibuManager;