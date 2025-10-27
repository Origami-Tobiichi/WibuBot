const AgeVerification = require('./ageVerification');
const NSFWFilter = require('./nsfwFilter');
const HentaiManager = require('./hentaiManager');

class AdultManager {
    constructor() {
        this.ageVerification = new AgeVerification();
        this.nsfwFilter = new NSFWFilter();
        this.hentaiManager = new HentaiManager();
        this.verifiedUsers = new Map();
    }

    async verifyAge(jid, birthDate) {
        try {
            const verification = await this.ageVerification.verifyAge(birthDate);
            
            if (verification.isAdult) {
                this.verifiedUsers.set(jid, {
                    verified: true,
                    verifiedAt: Date.now(),
                    birthDate: birthDate,
                    age: verification.age
                });

                return {
                    success: true,
                    message: `✅ *AGE VERIFICATION SUCCESS* ✅\n\n` +
                            `Usia terverifikasi: *${verification.age} tahun*\n` +
                            `Status: *DEWASA*\n\n` +
                            `Sekarang Anda dapat mengakses konten 18+.\n` +
                            `Gunakan perintah !nsfw untuk melihat menu.`,
                    isAdult: true
                };
            } else {
                return {
                    success: false,
                    message: `❌ *AGE VERIFICATION FAILED* ❌\n\n` +
                            `Usia: *${verification.age} tahun*\n` +
                            `Status: *DIBAWAH UMUR*\n\n` +
                            `Anda harus berusia 18+ untuk mengakses konten ini.`,
                    isAdult: false
                };
            }
        } catch (error) {
            return {
                success: false,
                message: `❌ Error verifikasi usia.\nPastikan format tanggal benar (DD-MM-YYYY).`
            };
        }
    }

    async handleNSFWCommand(jid, command, params = []) {
        // Check if user is verified
        if (!this.isUserVerified(jid)) {
            return await this.sendVerificationPrompt(jid);
        }

        switch(command) {
            case 'menu':
                return await this.showNSFWMenu(jid);
            case 'images':
                return await this.handleNSFWImages(params[0] || 'random');
            case 'hentai':
                return await this.handleHentaiContent(params[0] || 'random');
            case 'gifs':
                return await this.handleNSFWGifs(params[0] || 'random');
            case 'help':
                return await this.showNSFWHelp(jid);
            default:
                return await this.showNSFWMenu(jid);
        }
    }

    async showNSFWMenu(jid) {
        const menu = {
            text: `🔞 *NSFW CONTENT MENU* 🔞\n\n` +
                  `*PERINGATAN:* Konten 18+ hanya untuk dewasa!\n\n` +
                  `*Available Commands:*\n` +
                  `!nsfw images [category] - Gambar NSFW\n` +
                  `!nsfw hentai [category] - Konten hentai\n` +
                  `!nsfw gifs [category] - GIF NSFW\n` +
                  `!nsfw help - Bantuan\n\n` +
                  `*Categories:* waifu, neko, trap, blowjob, etc.\n\n` +
                  `⚠️ *Gunakan dengan bijak!*`,
            buttons: [
                [
                    { buttonId: '!nsfw images waifu', buttonText: { displayText: '🎨 WAIFU' }, type: 1 },
                    { buttonId: '!nsfw images neko', buttonText: { displayText: '🐱 NEKO' }, type: 1 }
                ],
                [
                    { buttonId: '!nsfw hentai random', buttonText: { displayText: '💖 HENTAI' }, type: 1 },
                    { buttonId: '!nsfw gifs random', buttonText: { displayText: '🎬 GIFS' }, type: 1 }
                ],
                [
                    { buttonId: '!nsfw help', buttonText: { displayText: '❓ HELP' }, type: 1 },
                    { buttonId: '!menu', buttonText: { displayText: '📋 MAIN MENU' }, type: 1 }
                ]
            ]
        };

        return menu;
    }

    async handleNSFWImages(category) {
        try {
            // Simulate NSFW image API call
            // In real implementation, use actual NSFW API
            const image = await this.fetchNSFWImage(category);
            
            return {
                text: `🔞 *NSFW IMAGE* 🔞\n\n` +
                      `Category: *${category}*\n` +
                      `Source: NSFW API\n\n` +
                      `⚠️ Konten dewasa - Hanya untuk 18+!`,
                image: image.url,
                caption: `NSFW ${category} image`
            };
        } catch (error) {
            return {
                text: `❌ Gagal mengambil gambar NSFW.\nCoba kategori lain.`
            };
        }
    }

    async handleHentaiContent(category) {
        try {
            const hentai = await this.hentaiManager.getHentai(category);
            
            return {
                text: `💖 *HENTAI CONTENT* 💖\n\n` +
                      `Category: *${category}*\n` +
                      `Type: ${hentai.type}\n\n` +
                      `🎌 Hentai content - Enjoy, Senpai!`,
                image: hentai.url
            };
        } catch (error) {
            return {
                text: `❌ Gagal mengambil konten hentai.\nCoba kategori lain.`
            };
        }
    }

    async handleNSFWGifs(category) {
        try {
            const gif = await this.fetchNSFWGif(category);
            
            return {
                text: `🎬 *NSWF GIF* 🎬\n\n` +
                      `Category: *${category}*\n` +
                      `Format: Animated GIF\n\n` +
                      `⚠️ Konten bergerak - Hanya untuk 18+!`,
                video: gif.url,
                gifPlayback: true
            };
        } catch (error) {
            return {
                text: `❌ Gagal mengambil GIF NSFW.\nCoba kategori lain.`
            };
        }
    }

    async showNSFWHelp(jid) {
        const help = {
            text: `❓ *NSFW HELP* ❓\n\n` +
                  `*Cara verifikasi usia:*\n` +
                  `Kirim: !verify [DD-MM-YYYY]\n` +
                  `Contoh: !verify 01-01-1990\n\n` +
                  `*Perintah NSFW:*\n` +
                  `!nsfw menu - Menu utama\n` +
                  `!nsfw images [cat] - Gambar\n` +
                  `!nsfw hentai [cat] - Hentai\n` +
                  `!nsfw gifs [cat] - GIF\n\n` +
                  `*Kategori populer:*\n` +
                  `waifu, neko, trap, blowjob, boobs, anal\n\n` +
                  `⚠️ *PERINGATAN:*\n` +
                  `• Hanya untuk 18+\n` +
                  `• Gunakan dengan bijak\n` +
                  `• Jangan disalahgunakan`,
            buttons: [
                { buttonId: '!nsfw menu', buttonText: { displayText: '🔞 NSFW MENU' }, type: 1 }
            ]
        };

        return help;
    }

    async sendVerificationPrompt(jid) {
        const prompt = {
            text: `🔞 *AGE VERIFICATION REQUIRED* 🔞\n\n` +
                  `Anda harus verifikasi usia untuk mengakses konten 18+.\n\n` +
                  `*Cara verifikasi:*\n` +
                  `Kirim: !verify [TANGGAL-LAHIR]\n` +
                  `Format: DD-MM-YYYY\n\n` +
                  `Contoh:\n` +
                  `!verify 15-08-1995\n\n` +
                  `⚠️ *Data hanya untuk verifikasi dan tidak disimpan.*`,
            buttons: [
                { buttonId: '!verify 01-01-1990', buttonText: { displayText: '📝 CONTOH VERIFIKASI' }, type: 1 }
            ]
        };

        return prompt;
    }

    async fetchNSFWImage(category) {
        // Simulate API call to NSFW image service
        // In real implementation, use actual API like:
        // - Purrbot.site API
        // - Nekos.life API
        // - Or other NSFW APIs
        
        return {
            url: `https://example.com/nsfw/${category}/${Date.now()}.jpg`,
            category: category,
            nsfw: true
        };
    }

    async fetchNSFWGif(category) {
        // Simulate API call to NSFW GIF service
        return {
            url: `https://example.com/nsfw/gifs/${category}/${Date.now()}.gif`,
            category: category,
            nsfw: true
        };
    }

    isUserVerified(jid) {
        return this.verifiedUsers.has(jid);
    }

    getVerifiedUser(jid) {
        return this.verifiedUsers.get(jid);
    }

    cleanupExpiredVerifications() {
        const now = Date.now();
        const expiryTime = 24 * 60 * 60 * 1000; // 24 hours
        
        for (const [jid, data] of this.verifiedUsers.entries()) {
            if (now - data.verifiedAt > expiryTime) {
                this.verifiedUsers.delete(jid);
            }
        }
    }
}

module.exports = AdultManager;