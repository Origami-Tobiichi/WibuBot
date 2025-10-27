// Application Constants
const Constants = {
    // Bot Configuration
    BOT: {
        NAME: "Ultimate WhatsApp Bot",
        VERSION: "3.0.0",
        AUTHOR: "Bot Developer",
        PREFIX: "!",
        MAX_MESSAGE_LENGTH: 4096,
        MAX_BUTTONS: 3,
        MAX_BUTTONS_PER_ROW: 3
    },

    // User Levels
    USER_LEVELS: {
        BANNED: -1,
        GUEST: 0,
        USER: 1,
        PREMIUM: 2,
        VIP: 3,
        ADMIN: 10,
        OWNER: 100
    },

    // Premium Features
    PREMIUM: {
        PRICE_BASIC: 25000,
        PRICE_PRO: 50000,
        PRICE_ULTIMATE: 100000,
        DURATION_DAYS: 30,
        MAX_PREMIUM_USERS: 1000
    },

    // Download Limits
    DOWNLOAD: {
        MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
        MAX_VIDEO_DURATION: 3600, // 1 hour
        MAX_AUDIO_DURATION: 1800, // 30 minutes
        CONCURRENT_DOWNLOADS: 3,
        YOUTUBE_QUALITIES: ['low', 'medium', 'high', 'best'],
        SUPPORTED_FORMATS: ['mp4', 'mp3', 'avi', 'mov', 'mkv', 'wav', 'ogg']
    },

    // Game Constants
    GAMES: {
        MAX_ACTIVE_GAMES: 5,
        GAME_TIMEOUT: 300000, // 5 minutes
        MAX_SCORE: 1000000,
        DAILY_BONUS: 100,
        LEVEL_EXP_REQUIREMENT: 100
    },

    // AI Configuration
    AI: {
        MAX_MEMORY_ENTRIES: 100,
        MAX_CONVERSATION_HISTORY: 20,
        RESPONSE_TIMEOUT: 30000,
        MAX_TOKENS: 500,
        TEMPERATURE: 0.7
    },

    // Wibu/Anime Constants
    WIBU: {
        MAX_WAIFU_REQUESTS: 10,
        ANIME_QUOTE_CACHE_SIZE: 50,
        TRANSLATION_CACHE_SIZE: 100,
        SUPPORTED_CATEGORIES: ['waifu', 'neko', 'shinobu', 'megumin']
    },

    // Adult/NSFW Constants
    ADULT: {
        MIN_AGE: 18,
        VERIFICATION_EXPIRY_DAYS: 30,
        MAX_NSFW_REQUESTS: 5,
        CACHE_SIZE: 50
    },

    // File Paths
    PATHS: {
        SESSIONS: './data/sessions',
        USERS: './data/users',
        DOWNLOADS: './data/downloads',
        VOICE_NOTES: './data/voice-notes',
        LOGS: './data/logs',
        MEMORY: './data/memory',
        PREMIUM_DATA: './data/premium',
        WIBU_DATA: './data/wibu-data'
    },

    // API Endpoints
    API: {
        YOUTUBE: 'https://www.googleapis.com/youtube/v3',
        OPENAI: 'https://api.openai.com/v1',
        ANIME_QUOTE: 'https://animechan.xyz/api',
        WAIFU_PICS: 'https://api.waifu.pics',
        TIKTOK: 'https://www.tiktok.com/oembed'
    },

    // Error Messages
    ERRORS: {
        INVALID_COMMAND: "❌ Perintah tidak valid!",
        NOT_REGISTERED: "🔐 Anda belum terdaftar! Ketik !register untuk mendaftar.",
        NOT_PREMIUM: "⭐ Fitur ini hanya untuk user premium!",
        AGE_VERIFICATION_REQUIRED: "🔞 Verifikasi usia diperlukan untuk konten ini!",
        DOWNLOAD_FAILED: "❌ Download gagal!",
        GAME_NOT_FOUND: "🎮 Game tidak ditemukan!",
        AI_ERROR: "🤖 AI sedang error, coba lagi nanti!",
        VOICE_PROCESSING_ERROR: "🎵 Gagal memproses pesan suara!",
        FILE_TOO_LARGE: "📁 File terlalu besar!",
        RATE_LIMITED: "⏰ Terlalu banyak request, coba lagi nanti!"
    },

    // Success Messages
    SUCCESS: {
        REGISTERED: "✅ Registrasi berhasil!",
        PREMIUM_ACTIVATED: "⭐ Premium diaktifkan!",
        DOWNLOAD_COMPLETE: "✅ Download selesai!",
        GAME_WON: "🎉 Selamat! Anda menang!",
        AI_RESPONSE: "🤖 Berikut respons AI:",
        VOICE_PROCESSED: "🎵 Pesan suara diproses!"
    },

    // Button Templates
    BUTTONS: {
        MAIN_MENU: [
            { buttonId: '!ai', buttonText: { displayText: '🤖 AI Chat' } },
            { buttonId: '!game', buttonText: { displayText: '🎮 Games' } },
            { buttonId: '!download', buttonText: { displayText: '📥 Download' } }
        ],
        GAME_MENU: [
            { buttonId: '!tebakgambar', buttonText: { displayText: '🖼️ Tebak Gambar' } },
            { buttonId: '!mathquiz', buttonText: { displayText: '🧮 Math Quiz' } },
            { buttonId: '!tebakkata', buttonText: { displayText: '📝 Tebak Kata' } }
        ],
        DOWNLOAD_MENU: [
            { buttonId: '!yt', buttonText: { displayText: '📺 YouTube' } },
            { buttonId: '!ig', buttonText: { displayText: '📷 Instagram' } },
            { buttonId: '!tiktok', buttonText: { displayText: '🎵 TikTok' } }
        ]
    },

    // Time Constants
    TIME: {
        SECOND: 1000,
        MINUTE: 60 * 1000,
        HOUR: 60 * 60 * 1000,
        DAY: 24 * 60 * 60 * 1000,
        WEEK: 7 * 24 * 60 * 60 * 1000
    },

    // Regex Patterns
    REGEX: {
        YOUTUBE: /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
        INSTAGRAM: /^(https?:\/\/)?(www\.)?instagram\.com\/(p|reel|tv|stories)\/[a-zA-Z0-9_-]+\/?/,
        TIKTOK: /^(https?:\/\/)?(www\.)?tiktok\.com\/@[a-zA-Z0-9._-]+\/video\/[0-9]+\/?/,
        PHONE: /^(?:\+62|62|0)[2-9][0-9]{7,11}$/,
        EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        URL: /https?:\/\/[^\s]+/g
    },

    // Emoji Constants
    EMOJI: {
        SUCCESS: '✅',
        ERROR: '❌',
        WARNING: '⚠️',
        INFO: 'ℹ️',
        LOADING: '⏳',
        PREMIUM: '⭐',
        GAME: '🎮',
        DOWNLOAD: '📥',
        AI: '🤖',
        VOICE: '🎵',
        WIBU: '🌸',
        NSFW: '🔞'
    }
};

module.exports = Constants;