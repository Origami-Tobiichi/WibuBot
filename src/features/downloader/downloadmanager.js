const YouTubeDownloader = require('./youtube');
const InstagramDownloader = require('./instagram');
const TiktokDownloader = require('./tiktok');
const MediaConverter = require('./mediaConverter');

class DownloadManager {
    constructor() {
        this.youtube = new YouTubeDownloader();
        this.instagram = new InstagramDownloader();
        this.tiktok = new TiktokDownloader();
        this.converter = new MediaConverter();
    }

    async handleDownload(jid, url, type = 'auto') {
        try {
            let downloadInfo;

            // Determine download type from URL
            if (type === 'auto') {
                type = this.detectDownloadType(url);
            }

            switch (type) {
                case 'youtube':
                    downloadInfo = await this.youtube.download(url);
                    break;
                case 'instagram':
                    downloadInfo = await this.instagram.download(url);
                    break;
                case 'tiktok':
                    downloadInfo = await this.tiktok.download(url);
                    break;
                default:
                    throw new Error('Unsupported download type');
            }

            return {
                success: true,
                data: downloadInfo
            };

        } catch (error) {
            console.error('Download Error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    detectDownloadType(url) {
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            return 'youtube';
        } else if (url.includes('instagram.com')) {
            return 'instagram';
        } else if (url.includes('tiktok.com')) {
            return 'tiktok';
        }
        return 'unknown';
    }

    async convertMedia(inputPath, outputFormat) {
        return await this.converter.convert(inputPath, outputFormat);
    }
}

module.exports = DownloadManager;
