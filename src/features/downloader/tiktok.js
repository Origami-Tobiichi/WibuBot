const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class TikTokDownloader {
    constructor() {
        this.downloadsDir = './data/downloads/tiktok';
        this.ensureDownloadsDir();
    }

    async ensureDownloadsDir() {
        try {
            await fs.mkdir(this.downloadsDir, { recursive: true });
        } catch (error) {
            console.error('Error creating TikTok downloads directory:', error);
        }
    }

    async download(videoUrl, options = {}) {
        try {
            if (!this.isValidTikTokUrl(videoUrl)) {
                throw new Error('Invalid TikTok URL');
            }

            const videoInfo = await this.getVideoInfo(videoUrl);
            
            let downloadResult;
            if (options.withWatermark === false) {
                downloadResult = await this.downloadWithoutWatermark(videoInfo);
            } else {
                downloadResult = await this.downloadWithWatermark(videoInfo);
            }

            return {
                success: true,
                ...downloadResult,
                info: videoInfo
            };

        } catch (error) {
            console.error('TikTok download error:', error);
            return {
                success: false,
                error: error.message,
                videoUrl: videoUrl
            };
        }
    }

    async getVideoInfo(videoUrl) {
        try {
            // Using TikTok API or external service
            const response = await axios.get(`https://www.tiktok.com/oembed?url=${encodeURIComponent(videoUrl)}`);
            const data = response.data;

            const videoId = this.extractVideoId(videoUrl);
            
            return {
                id: videoId,
                title: data.title || 'TikTok Video',
                author: data.author_name || 'Unknown',
                authorUrl: data.author_url || '',
                thumbnail: data.thumbnail_url || '',
                duration: 0, // TikTok doesn't provide duration in oembed
                likes: 0,
                comments: 0,
                shares: 0,
                plays: 0,
                created: Date.now()
            };

        } catch (error) {
            // Fallback to basic info
            return {
                id: this.extractVideoId(videoUrl),
                title: 'TikTok Video',
                author: 'Unknown User',
                thumbnail: '',
                duration: 0,
                likes: 0,
                comments: 0,
                shares: 0,
                plays: 0,
                created: Date.now()
            };
        }
    }

    async downloadWithWatermark(videoInfo) {
        try {
            // Using external TikTok download API
            const apiUrl = `https://tikwm.com/api?url=${encodeURIComponent(`https://www.tiktok.com/@${videoInfo.author}/video/${videoInfo.id}`)}`;
            const response = await axios.get(apiUrl);
            const data = response.data;

            if (data.data && data.data.play) {
                const videoUrl = data.data.play;
                return await this.downloadVideoFile(videoUrl, videoInfo, 'with_watermark');
            } else {
                throw new Error('No video URL found');
            }

        } catch (error) {
            throw new Error(`Failed to download with watermark: ${error.message}`);
        }
    }

    async downloadWithoutWatermark(videoInfo) {
        try {
            // Using different API for no watermark
            const apiUrl = `https://tikcdn.io/api/v1/noWatermark?url=${encodeURIComponent(`https://www.tiktok.com/@${videoInfo.author}/video/${videoInfo.id}`)}`;
            const response = await axios.get(apiUrl);
            const data = response.data;

            if (data.url) {
                return await this.downloadVideoFile(data.url, videoInfo, 'no_watermark');
            } else {
                throw new Error('No watermark-free URL found');
            }

        } catch (error) {
            // Fallback to with watermark
            console.log('Falling back to watermark version');
            return await this.downloadWithWatermark(videoInfo);
        }
    }

    async downloadVideoFile(videoUrl, videoInfo, type) {
        const filename = `tiktok_${type}_${videoInfo.id}_${Date.now()}.mp4`;
        const filepath = path.join(this.downloadsDir, filename);

        const response = await axios({
            method: 'GET',
            url: videoUrl,
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Referer': 'https://www.tiktok.com/'
            }
        });

        const writer = require('fs').createWriteStream(filepath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', async () => {
                const stats = await fs.stat(filepath);
                const fileSize = (stats.size / (1024 * 1024)).toFixed(2);

                resolve({
                    filepath: filepath,
                    filename: filename,
                    filesize: `${fileSize} MB`,
                    type: 'video',
                    format: 'mp4',
                    watermark: type === 'with_watermark'
                });
            });
            writer.on('error', reject);
        });
    }

    isValidTikTokUrl(url) {
        const patterns = [
            /^(https?:\/\/)?(www\.)?tiktok\.com\/@[a-zA-Z0-9._-]+\/video\/[0-9]+\/?/,
            /^(https?:\/\/)?(vm\.)?tiktok\.com\/[a-zA-Z0-9]+\/?/,
            /^(https?:\/\/)?(vt\.)?tiktok\.com\/[a-zA-Z0-9]+\/?/
        ];
        
        return patterns.some(pattern => pattern.test(url));
    }

    extractVideoId(url) {
        const patterns = [
            /tiktok\.com\/@[a-zA-Z0-9._-]+\/video\/([0-9]+)/,
            /tiktok\.com\/([a-zA-Z0-9]+)/,
            /vt\.tiktok\.com\/([a-zA-Z0-9]+)/,
            /vm\.tiktok\.com\/([a-zA-Z0-9]+)/
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }

        // If no pattern matches, use the last part of the URL
        const parts = url.split('/');
        return parts[parts.length - 1];
    }

    async downloadAudio(videoUrl) {
        try {
            const videoResult = await this.download(videoUrl, { withWatermark: false });
            
            if (!videoResult.success) {
                throw new Error('Video download failed');
            }

            // Convert video to audio using ffmpeg
            const audioFilename = `tiktok_audio_${videoResult.info.id}_${Date.now()}.mp3`;
            const audioFilepath = path.join(this.downloadsDir, audioFilename);

            const { exec } = require('child_process');
            const util = require('util');
            const execAsync = util.promisify(exec);

            await execAsync(`ffmpeg -i "${videoResult.filepath}" -vn -ar 44100 -ac 2 -b:a 192k "${audioFilepath}"`);

            // Clean up video file
            await fs.unlink(videoResult.filepath);

            const stats = await fs.stat(audioFilepath);
            const fileSize = (stats.size / (1024 * 1024)).toFixed(2);

            return {
                success: true,
                filepath: audioFilepath,
                filename: audioFilename,
                filesize: `${fileSize} MB`,
                type: 'audio',
                format: 'mp3'
            };

        } catch (error) {
            console.error('TikTok audio download error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getTrendingVideos(count = 10) {
        try {
            // This would require a proper TikTok API
            // For now, return mock data
            return {
                success: true,
                videos: Array.from({ length: count }, (_, i) => ({
                    id: `trending_${i}`,
                    title: `Trending TikTok Video ${i + 1}`,
                    author: `user${i + 1}`,
                    thumbnail: '',
                    duration: Math.floor(Math.random() * 60) + 15,
                    likes: Math.floor(Math.random() * 100000),
                    plays: Math.floor(Math.random() * 1000000)
                }))
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = TikTokDownloader;