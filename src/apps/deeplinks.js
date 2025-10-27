class DeepLinkManager {
    constructor() {
        this.apps = {
            // Mobile Games
            'ml': {
                package: 'com.mobile.legends',
                name: 'Mobile Legends: Bang Bang',
                deeplink: 'mobilelegends://',
                store: 'https://play.google.com/store/apps/details?id=com.mobile.legends',
                fallback: 'https://m.mobilelegends.com'
            },
            'pubg': {
                package: 'com.tencent.ig',
                name: 'PUBG Mobile',
                deeplink: 'pubgmobile://',
                store: 'https://play.google.com/store/apps/details?id=com.tencent.ig',
                fallback: 'https://www.pubgmobile.com'
            },
            'freefire': {
                package: 'com.dts.freefireth',
                name: 'Garena Free Fire',
                deeplink: 'freefire://',
                store: 'https://play.google.com/store/apps/details?id=com.dts.freefireth',
                fallback: 'https://ff.garena.com'
            },
            'aov': {
                package: 'com.garena.game.kgtw',
                name: 'Arena of Valor',
                deeplink: 'aov://',
                store: 'https://play.google.com/store/apps/details?id=com.garena.game.kgtw',
                fallback: 'https://aov.garena.com'
            },
            'hok': {
                package: 'com.mobile.legends',
                name: 'Mobile Legends',
                deeplink: 'mobilelegends://',
                store: 'https://play.google.com/store/apps/details?id=com.mobile.legends',
                fallback: 'https://m.mobilelegends.com'
            },

            // Social Media
            'youtube': {
                package: 'com.google.android.youtube',
                name: 'YouTube',
                deeplink: 'vnd.youtube://',
                store: 'https://play.google.com/store/apps/details?id=com.google.android.youtube',
                fallback: 'https://www.youtube.com'
            },
            'instagram': {
                package: 'com.instagram.android',
                name: 'Instagram',
                deeplink: 'instagram://',
                store: 'https://play.google.com/store/apps/details?id=com.instagram.android',
                fallback: 'https://www.instagram.com'
            },
            'tiktok': {
                package: 'com.zhiliaoapp.musically',
                name: 'TikTok',
                deeplink: 'tiktok://',
                store: 'https://play.google.com/store/apps/details?id=com.zhiliaoapp.musically',
                fallback: 'https://www.tiktok.com'
            },
            'telegram': {
                package: 'org.telegram.messenger',
                name: 'Telegram',
                deeplink: 'tg://',
                store: 'https://play.google.com/store/apps/details?id=org.telegram.messenger',
                fallback: 'https://web.telegram.org'
            },
            'discord': {
                package: 'com.discord',
                name: 'Discord',
                deeplink: 'discord://',
                store: 'https://play.google.com/store/apps/details?id=com.discord',
                fallback: 'https://discord.com'
            },
            'whatsapp': {
                package: 'com.whatsapp',
                name: 'WhatsApp',
                deeplink: 'whatsapp://',
                store: 'https://play.google.com/store/apps/details?id=com.whatsapp',
                fallback: 'https://web.whatsapp.com'
            },

            // Streaming Services
            'netflix': {
                package: 'com.netflix.mediaclient',
                name: 'Netflix',
                deeplink: 'nflx://',
                store: 'https://play.google.com/store/apps/details?id=com.netflix.mediaclient',
                fallback: 'https://www.netflix.com'
            },
            'spotify': {
                package: 'com.spotify.music',
                name: 'Spotify',
                deeplink: 'spotify://',
                store: 'https://play.google.com/store/apps/details?id=com.spotify.music',
                fallback: 'https://open.spotify.com'
            },

            // Utilities
            'chrome': {
                package: 'com.android.chrome',
                name: 'Google Chrome',
                deeplink: 'googlechrome://',
                store: 'https://play.google.com/store/apps/details?id=com.android.chrome',
                fallback: 'https://www.google.com'
            },
            'maps': {
                package: 'com.google.android.apps.maps',
                name: 'Google Maps',
                deeplink: 'googlemaps://',
                store: 'https://play.google.com/store/apps/details?id=com.google.android.apps.maps',
                fallback: 'https://maps.google.com'
            }
        };
    }

    generateDeepLink(appKey, action = null, parameters = {}) {
        const app = this.apps[appKey];
        if (!app) {
            return null;
        }

        let deeplink = app.deeplink;
        
        // Add action if specified
        if (action) {
            deeplink += action;
        }

        // Add parameters
        const paramString = this.buildParameterString(parameters);
        if (paramString) {
            deeplink += (deeplink.includes('?') ? '&' : '?') + paramString;
        }

        return deeplink;
    }

    buildParameterString(parameters) {
        return Object.entries(parameters)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
            .join('&');
    }

    async openApp(jid, appKey, action = null, parameters = {}) {
        const app = this.apps[appKey];
        if (!app) {
            return {
                success: false,
                message: `Aplikasi ${appKey} tidak dikenali.`
            };
        }

        const deeplink = this.generateDeepLink(appKey, action, parameters);
        
        const message = {
            text: `📱 *${app.name}*\n\n` +
                  `Klik tombol di bawah untuk membuka aplikasi:\n\n` +
                  `📦 *Package:* ${app.package}\n` +
                  `🔗 *Deep Link:* ${deeplink || 'Tidak tersedia'}\n\n` +
                  `⚠️ *Note:* Jika aplikasi tidak terbuka, pastikan aplikasi sudah terinstall di perangkat Anda.`,
            buttons: this.generateAppButtons(app, deeplink)
        };

        return {
            success: true,
            message: message,
            app: app,
            deeplink: deeplink
        };
    }

    generateAppButtons(app, deeplink) {
        const buttons = [];

        // Deep Link button
        if (deeplink) {
            buttons.push([
                {
                    buttonId: deeplink,
                    buttonText: { displayText: `🎮 BUKA ${app.name.toUpperCase()}` },
                    type: 1
                }
            ]);
        }

        // Store and Fallback buttons
        const secondaryButtons = [];
        
        if (app.store) {
            secondaryButtons.push({
                buttonId: app.store,
                buttonText: { displayText: '📥 INSTALL DARI PLAY STORE' },
                type: 1
            });
        }

        if (app.fallback) {
            secondaryButtons.push({
                buttonId: app.fallback,
                buttonText: { displayText: '🌐 BUKA DI BROWSER' },
                type: 1
            });
        }

        if (secondaryButtons.length > 0) {
            buttons.push(secondaryButtons);
        }

        return buttons;
    }

    getAppInfo(appKey) {
        return this.apps[appKey] || null;
    }

    getAllApps() {
        return Object.keys(this.apps).map(key => ({
            key: key,
            name: this.apps[key].name,
            package: this.apps[key].package,
            category: this.getAppCategory(key)
        }));
    }

    getAppCategory(appKey) {
        const categories = {
            // Games
            'ml': 'game',
            'pubg': 'game',
            'freefire': 'game',
            'aov': 'game',
            'hok': 'game',
            
            // Social Media
            'youtube': 'social',
            'instagram': 'social',
            'tiktok': 'social',
            'telegram': 'social',
            'discord': 'social',
            'whatsapp': 'social',
            
            // Streaming
            'netflix': 'streaming',
            'spotify': 'streaming',
            
            // Utilities
            'chrome': 'utility',
            'maps': 'utility'
        };

        return categories[appKey] || 'other';
    }

    searchApps(query) {
        const results = [];
        const lowerQuery = query.toLowerCase();

        for (const [key, app] of Object.entries(this.apps)) {
            if (app.name.toLowerCase().includes(lowerQuery) ||
                key.toLowerCase().includes(lowerQuery) ||
                app.package.toLowerCase().includes(lowerQuery)) {
                results.push({
                    key: key,
                    ...app
                });
            }
        }

        return results;
    }

    getAppsByCategory(category) {
        return this.getAllApps().filter(app => 
            this.getAppCategory(app.key) === category
        );
    }

    async checkAppAvailability(appKey, jid) {
        // This would typically check if the app is installed
        // For now, we'll simulate this check
        const app = this.apps[appKey];
        if (!app) {
            return {
                available: false,
                message: 'Aplikasi tidak dikenali'
            };
        }

        // Simulate availability check (80% chance app is available)
        const isAvailable = Math.random() > 0.2;

        return {
            available: isAvailable,
            app: app,
            message: isAvailable ? 
                `✅ ${app.name} tersedia di perangkat` :
                `❌ ${app.name} tidak terinstall. Silakan install terlebih dahulu.`
        };
    }

    generateAppListMessage(category = null) {
        const apps = category ? this.getAppsByCategory(category) : this.getAllApps();
        
        let message = `📱 *DAFTAR APLIKASI YANG DIDUKUNG*\n\n`;
        
        if (category) {
            message += `Kategori: *${category.toUpperCase()}*\n\n`;
        }

        // Group by category
        const categorizedApps = {};
        apps.forEach(app => {
            const category = this.getAppCategory(app.key);
            if (!categorizedApps[category]) {
                categorizedApps[category] = [];
            }
            categorizedApps[category].push(app);
        });

        for (const [cat, appList] of Object.entries(categorizedApps)) {
            message += `*${cat.toUpperCase()}*\n`;
            appList.forEach(app => {
                message += `• ${app.name} (${app.key})\n`;
            });
            message += '\n';
        }

        message += `\n*Cara penggunaan:*\n`;
        message += `Ketikan !app [nama_app]\n`;
        message += `Contoh: !app ml\n\n`;
        message += `Aplikasi akan terbuka langsung di perangkat Anda!`;

        return {
            text: message,
            buttons: this.generateCategoryButtons()
        };
    }

    generateCategoryButtons() {
        const categories = ['game', 'social', 'streaming', 'utility'];
        
        return [
            categories.map(cat => ({
                buttonId: `!app category ${cat}`,
                buttonText: { displayText: `📁 ${cat.toUpperCase()}` },
                type: 1
            }))
        ];
    }

    addCustomApp(appKey, appData) {
        if (this.apps[appKey]) {
            return {
                success: false,
                message: `App dengan key ${appKey} sudah ada.`
            };
        }

        this.apps[appKey] = appData;
        return {
            success: true,
            message: `App ${appData.name} berhasil ditambahkan.`
        };
    }

    removeApp(appKey) {
        if (!this.apps[appKey]) {
            return {
                success: false,
                message: `App dengan key ${appKey} tidak ditemukan.`
            };
        }

        const appName = this.apps[appKey].name;
        delete this.apps[appKey];
        
        return {
            success: true,
            message: `App ${appName} berhasil dihapus.`
        };
    }

    getStats() {
        const totalApps = Object.keys(this.apps).length;
        const categories = {};
        
        Object.keys(this.apps).forEach(key => {
            const category = this.getAppCategory(key);
            categories[category] = (categories[category] || 0) + 1;
        });

        return {
            totalApps: totalApps,
            categories: categories,
            lastUpdated: new Date().toISOString()
        };
    }
}

module.exports = DeepLinkManager;