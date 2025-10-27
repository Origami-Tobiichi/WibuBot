class AppManager {
    constructor() {
        this.apps = {
            'ml': {
                package: 'com.mobile.legends',
                name: 'Mobile Legends',
                deeplink: 'mobilelegends://',
                store: 'https://play.google.com/store/apps/details?id=com.mobile.legends'
            },
            'youtube': {
                package: 'com.google.android.youtube',
                name: 'YouTube',
                deeplink: 'vnd.youtube://',
                store: 'https://play.google.com/store/apps/details?id=com.google.android.youtube'
            },
            'instagram': {
                package: 'com.instagram.android',
                name: 'Instagram',
                deeplink: 'instagram://',
                store: 'https://play.google.com/store/apps/details?id=com.instagram.android'
            },
            'tiktok': {
                package: 'com.zhiliaoapp.musically',
                name: 'TikTok',
                deeplink: 'tiktok://',
                store: 'https://play.google.com/store/apps/details?id=com.zhiliaoapp.musically'
            },
            'pubg': {
                package: 'com.tencent.ig',
                name: 'PUBG Mobile',
                deeplink: 'pubgmobile://',
                store: 'https://play.google.com/store/apps/details?id=com.tencent.ig'
            },
            'freefire': {
                package: 'com.dts.freefireth',
                name: 'Free Fire',
                deeplink: 'freefire://',
                store: 'https://play.google.com/store/apps/details?id=com.dts.freefireth'
            },
            'aov': {
                package: 'com.garena.game.kgtw',
                name: 'Arena of Valor',
                deeplink: 'aov://',
                store: 'https://play.google.com/store/apps/details?id=com.garena.game.kgtw'
            },
            'hok': {
                package: 'com.mobile.legends',
                name: 'Mobile Legends',
                deeplink: 'mobilelegends://',
                store: 'https://play.google.com/store/apps/details?id=com.mobile.legends'
            },
            'telegram': {
                package: 'org.telegram.messenger',
                name: 'Telegram',
                deeplink: 'tg://',
                store: 'https://play.google.com/store/apps/details?id=org.telegram.messenger'
            },
            'discord': {
                package: 'com.discord',
                name: 'Discord',
                deeplink: 'discord://',
                store: 'https://play.google.com/store/apps/details?id=com.discord'
            }
        };
    }

    async openApp(jid, appKey) {
        const app = this.apps[appKey];
        if (!app) {
            return {
                success: false,
                message: `Aplikasi ${appKey} tidak dikenali.`
            };
        }

        const appMessage = {
            text: `📱 *${app.name}*\n\n` +
                  `Klik tombol di bawah untuk membuka aplikasi:\n\n` +
                  `⚠️ *Note:* Jika aplikasi tidak terbuka, pastikan aplikasi sudah terinstall di perangkat Anda.`,
            buttons: [
                [
                    {
                        buttonId: `app://${app.package}`,
                        buttonText: { displayText: `🎮 BUKA ${app.name.toUpperCase()}` },
                        type: 1
                    }
                ],
                [
                    {
                        buttonId: app.store,
                        buttonText: { displayText: '📥 INSTALL DARI PLAY STORE' },
                        type: 1
                    }
                ]
            ]
        };

        return {
            success: true,
            message: appMessage
        };
    }

    getAppList() {
        return Object.keys(this.apps).map(key => ({
            key: key,
            name: this.apps[key].name,
            package: this.apps[key].package
        }));
    }
}

module.exports = AppManager;
