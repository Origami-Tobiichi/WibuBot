const axios = require('axios');

class JapaneseTranslator {
    constructor() {
        this.translationCache = new Map();
        this.commonPhrases = this.initializeCommonPhrases();
    }

    initializeCommonPhrases() {
        return {
            // Greetings
            'halo': { japanese: 'こんにちは', romaji: 'Konnichiwa', english: 'Hello' },
            'selamat pagi': { japanese: 'おはようございます', romaji: 'Ohayou gozaimasu', english: 'Good morning' },
            'selamat siang': { japanese: 'こんにちは', romaji: 'Konnichiwa', english: 'Good afternoon' },
            'selamat malam': { japanese: 'こんばんは', romaji: 'Konbanwa', english: 'Good evening' },
            'selamat tidur': { japanese: 'おやすみなさい', romaji: 'Oyasumi nasai', english: 'Good night' },
            
            // Basic phrases
            'terima kasih': { japanese: 'ありがとうございます', romaji: 'Arigatou gozaimasu', english: 'Thank you' },
            'maaf': { japanese: 'ごめんなさい', romaji: 'Gomen nasai', english: 'I\'m sorry' },
            'tolong': { japanese: 'お願いします', romaji: 'Onegaishimasu', english: 'Please' },
            'ya': { japanese: 'はい', romaji: 'Hai', english: 'Yes' },
            'tidak': { japanese: 'いいえ', romaji: 'Iie', english: 'No' },
            
            // Questions
            'apa kabar': { japanese: 'お元気ですか', romaji: 'Ogenki desu ka', english: 'How are you?' },
            'siapa nama kamu': { japanese: 'お名前は何ですか', romaji: 'Onamae wa nan desu ka', english: 'What is your name?' },
            'berapa umur kamu': { japanese: 'おいくつですか', romaji: 'Oikutsu desu ka', english: 'How old are you?' },
            'dimana': { japanese: 'どこですか', romaji: 'Doko desu ka', english: 'Where is it?' },
            'kapan': { japanese: 'いつですか', romaji: 'Itsu desu ka', english: 'When is it?' },
            
            // Feelings
            'saya senang': { japanese: '嬉しいです', romaji: 'Ureshii desu', english: 'I\'m happy' },
            'saya sedih': { japanese: '悲しいです', romaji: 'Kanashii desu', english: 'I\'m sad' },
            'saya lapar': { japanese: 'お腹が空きました', romaji: 'Onaka ga sukimashita', english: 'I\'m hungry' },
            'saya haus': { japanese: '喉が渇きました', romaji: 'Nodo ga kawakimashita', english: 'I\'m thirsty' },
            'saya lelah': { japanese: '疲れました', romaji: 'Tsukaremashita', english: 'I\'m tired' },
            
            // Anime terms
            'saya cinta kamu': { japanese: '愛してる', romaji: 'Aishiteru', english: 'I love you' },
            'teman': { japanese: '友達', romaji: 'Tomodachi', english: 'Friend' },
            'musuh': { japanese: '敵', romaji: 'Teki', english: 'Enemy' },
            'pertarungan': { japanese: '戦い', romaji: 'Tatakai', english: 'Battle' },
            'kekuatan': { japanese: '力', romaji: 'Chikara', english: 'Power' }
        };
    }

    async translateToJapanese(text, sourceLang = 'id') {
        try {
            // Check cache first
            const cacheKey = `${sourceLang}:${text.toLowerCase()}`;
            if (this.translationCache.has(cacheKey)) {
                return this.translationCache.get(cacheKey);
            }

            // Check common phrases
            const commonTranslation = this.commonPhrases[text.toLowerCase()];
            if (commonTranslation) {
                const result = {
                    original: text,
                    japanese: commonTranslation.japanese,
                    romaji: commonTranslation.romaji,
                    english: commonTranslation.english,
                    source: 'common_phrases'
                };
                this.translationCache.set(cacheKey, result);
                return result;
            }

            // Try external translation API (Google Translate)
            if (process.env.GOOGLE_TRANSLATE_API_KEY) {
                return await this.googleTranslate(text, sourceLang, 'ja');
            }

            // Fallback to basic translation
            return this.basicTranslate(text);

        } catch (error) {
            console.error('Translation error:', error);
            return this.basicTranslate(text);
        }
    }

    async googleTranslate(text, sourceLang, targetLang) {
        try {
            const response = await axios.post(
                `https://translation.googleapis.com/language/translate/v2?key=${process.env.GOOGLE_TRANSLATE_API_KEY}`,
                {
                    q: text,
                    source: sourceLang,
                    target: targetLang,
                    format: 'text'
                }
            );

            const translatedText = response.data.data.translations[0].translatedText;
            
            // Generate romaji (this would normally require a separate service)
            const romaji = this.generateRomaji(translatedText);

            const result = {
                original: text,
                japanese: translatedText,
                romaji: romaji,
                english: await this.translateToEnglish(text),
                source: 'google_translate'
            };

            // Cache the result
            const cacheKey = `${sourceLang}:${text.toLowerCase()}`;
            this.translationCache.set(cacheKey, result);

            return result;

        } catch (error) {
            throw new Error(`Google Translate error: ${error.message}`);
        }
    }

    basicTranslate(text) {
        // Simple word-by-word translation for common words
        const words = text.toLowerCase().split(' ');
        let japanese = '';
        let romaji = '';
        let english = '';

        for (const word of words) {
            if (this.commonPhrases[word]) {
                japanese += this.commonPhrases[word].japanese + ' ';
                romaji += this.commonPhrases[word].romaji + ' ';
                english += this.commonPhrases[word].english + ' ';
            } else {
                // For unknown words, just add the original
                japanese += word + ' ';
                romaji += word + ' ';
                english += word + ' ';
            }
        }

        const result = {
            original: text,
            japanese: japanese.trim(),
            romaji: romaji.trim(),
            english: english.trim(),
            source: 'basic_translation'
        };

        // Cache the result
        const cacheKey = `id:${text.toLowerCase()}`;
        this.translationCache.set(cacheKey, result);

        return result;
    }

    generateRomaji(japaneseText) {
        // Basic romaji conversion (this is simplified)
        const romajiMap = {
            'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o',
            'か': 'ka', 'き': 'ki', 'く': 'ku', 'け': 'ke', 'こ': 'ko',
            'さ': 'sa', 'し': 'shi', 'す': 'su', 'せ': 'se', 'そ': 'so',
            'た': 'ta', 'ち': 'chi', 'つ': 'tsu', 'て': 'te', 'と': 'to',
            'な': 'na', 'に': 'ni', 'ぬ': 'nu', 'ね': 'ne', 'の': 'no',
            'は': 'ha', 'ひ': 'hi', 'ふ': 'fu', 'へ': 'he', 'ほ': 'ho',
            'ま': 'ma', 'み': 'mi', 'む': 'mu', 'め': 'me', 'も': 'mo',
            'や': 'ya', 'ゆ': 'yu', 'よ': 'yo',
            'ら': 'ra', 'り': 'ri', 'る': 'ru', 'れ': 're', 'ろ': 'ro',
            'わ': 'wa', 'を': 'wo', 'ん': 'n',
            'が': 'ga', 'ぎ': 'gi', 'ぐ': 'gu', 'げ': 'ge', 'ご': 'go',
            'ざ': 'za', 'じ': 'ji', 'ず': 'zu', 'ぜ': 'ze', 'ぞ': 'zo',
            'だ': 'da', 'ぢ': 'ji', 'づ': 'zu', 'で': 'de', 'ど': 'do',
            'ば': 'ba', 'び': 'bi', 'ぶ': 'bu', 'べ': 'be', 'ぼ': 'bo',
            'ぱ': 'pa', 'ぴ': 'pi', 'ぷ': 'pu', 'ぺ': 'pe', 'ぽ': 'po',
            'きゃ': 'kya', 'きゅ': 'kyu', 'きょ': 'kyo',
            'しゃ': 'sha', 'しゅ': 'shu', 'しょ': 'sho',
            'ちゃ': 'cha', 'ちゅ': 'chu', 'ちょ': 'cho',
            'にゃ': 'nya', 'にゅ': 'nyu', 'にょ': 'nyo',
            'ひゃ': 'hya', 'ひゅ': 'hyu', 'ひょ': 'hyo',
            'みゃ': 'mya', 'みゅ': 'myu', 'みょ': 'myo',
            'りゃ': 'rya', 'りゅ': 'ryu', 'りょ': 'ryo',
            'ぎゃ': 'gya', 'ぎゅ': 'gyu', 'ぎょ': 'gyo',
            'じゃ': 'ja', 'じゅ': 'ju', 'じょ': 'jo',
            'びゃ': 'bya', 'びゅ': 'byu', 'びょ': 'byo',
            'ぴゃ': 'pya', 'ぴゅ': 'pyu', 'ぴょ': 'pyo'
        };

        let romaji = '';
        for (let i = 0; i < japaneseText.length; i++) {
            const char = japaneseText[i];
            if (romajiMap[char]) {
                romaji += romajiMap[char];
            } else {
                romaji += char;
            }
        }

        return romaji;
    }

    async translateToEnglish(text) {
        try {
            if (process.env.GOOGLE_TRANSLATE_API_KEY) {
                const response = await axios.post(
                    `https://translation.googleapis.com/language/translate/v2?key=${process.env.GOOGLE_TRANSLATE_API_KEY}`,
                    {
                        q: text,
                        source: 'id',
                        target: 'en',
                        format: 'text'
                    }
                );
                return response.data.data.translations[0].translatedText;
            }
            return text; // Return original if no translation available
        } catch (error) {
            return text;
        }
    }

    getCommonPhrases(category = 'all') {
        const categories = {
            greetings: ['halo', 'selamat pagi', 'selamat siang', 'selamat malam', 'selamat tidur'],
            basic: ['terima kasih', 'maaf', 'tolong', 'ya', 'tidak'],
            questions: ['apa kabar', 'siapa nama kamu', 'berapa umur kamu', 'dimana', 'kapan'],
            feelings: ['saya senang', 'saya sedih', 'saya lapar', 'saya haus', 'saya lelah'],
            anime: ['saya cinta kamu', 'teman', 'musuh', 'pertarungan', 'kekuatan']
        };

        if (category === 'all') {
            return this.commonPhrases;
        }

        const result = {};
        if (categories[category]) {
            categories[category].forEach(phrase => {
                if (this.commonPhrases[phrase]) {
                    result[phrase] = this.commonPhrases[phrase];
                }
            });
        }
        return result;
    }

    addCustomPhrase(indonesian, japanese, romaji, english) {
        this.commonPhrases[indonesian.toLowerCase()] = {
            japanese: japanese,
            romaji: romaji,
            english: english
        };
        return { success: true, message: 'Custom phrase added' };
    }

    searchPhrases(keyword) {
        const results = {};
        for (const [phrase, translation] of Object.entries(this.commonPhrases)) {
            if (phrase.includes(keyword.toLowerCase()) ||
                translation.japanese.includes(keyword) ||
                translation.romaji.toLowerCase().includes(keyword.toLowerCase()) ||
                translation.english.toLowerCase().includes(keyword.toLowerCase())) {
                results[phrase] = translation;
            }
        }
        return results;
    }

    clearCache() {
        const count = this.translationCache.size;
        this.translationCache.clear();
        return { 
            success: true, 
            message: `Cleared ${count} translations from cache` 
        };
    }

    getStats() {
        return {
            cachedTranslations: this.translationCache.size,
            commonPhrases: Object.keys(this.commonPhrases).length,
            cacheSize: JSON.stringify(Array.from(this.translationCache.entries())).length
        };
    }
}

module.exports = JapaneseTranslator;