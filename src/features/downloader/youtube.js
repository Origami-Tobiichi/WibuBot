const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

class YouTubeDownloader {
    constructor() {
        this.downloadsDir = './data/downloads/youtube';
        this.ensureDownloadsDir();
        this.apiKey = process.env.YOUTUBE_API_KEY;
    }

    async ensureDownloadsDir() {
        try {
            await fs.mkdir(this.downloadsDir, { recursive: true });
        } catch (error) {
            console.error('Error creating downloads directory:', error);
        }
    }

    async download(videoUrl, format = 'mp4', quality = 'high') {
        try {
            // Validate YouTube URL
            if (!this.isValidYouTubeUrl(videoUrl)) {
                throw new Error('Invalid YouTube URL');
            }

            const videoId = this.extractVideoId(videoUrl);
            const videoInfo = await this.getVideoInfo(videoId);

            const filename = `yt_${videoId}_${Date.now()}.${format}`;
            const filepath = path.join(this.downloadsDir, filename);

            let command;
            if (format === 'mp3') {
                command = `yt-dlp -x --audio-format mp3 --audio-quality 0 "${videoUrl}" -o "${filepath}"`;
            } else {
                let qualityParam = 'best';
                if (quality === 'low') qualityParam = 'worst';
                else if (quality === 'medium') qualityParam = 'best[height<=720]';
                
                command = `yt-dlp -f "${qualityParam}" "${videoUrl}" -o "${filepath}"`;
            }

            console.log(`Executing: ${command}`);
            const { stdout, stderr } = await execAsync(command);

            if (stderr && !stderr.includes('WARNING')) {
                throw new Error(`Download error: ${stderr}`);
            }

            // Verify file was created
            try {
                await fs.access(filepath);
            } catch {
                throw new Error('Downloaded file not found');
            }

            const stats = await fs.stat(filepath);
            const fileSize = (stats.size / (1024 * 1024)).toFixed(2);

            return {
                success: true,
                filepath: filepath,
                filename: filename,
                filesize: `${fileSize} MB`,
                format: format,
                quality: quality,
                info: videoInfo,
                duration: this.formatDuration(videoInfo.duration)
            };

        } catch (error) {
            console.error('YouTube download error:', error);
            return {
                success: false,
                error: error.message,
                videoUrl: videoUrl
            };
        }
    }

    async getVideoInfo(videoId) {
        try {
            if (this.apiKey) {
                const response = await axios.get(
                    `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${this.apiKey}&part=snippet,contentDetails,statistics`
                );

                if (response.data.items.length > 0) {
                    const video = response.data.items[0];
                    return {
                        title: video.snippet.title,
                        description: video.snippet.description,
                        channel: video.snippet.channelTitle,
                        duration: this.parseDuration(video.contentDetails.duration),
                        views: video.statistics.viewCount,
                        likes: video.statistics.likeCount,
                        publishedAt: video.snippet.publishedAt
                    };
                }
            }

            // Fallback to yt-dlp for info
            const { stdout } = await execAsync(`yt-dlp --dump-json "${videoId}"`);
            const info = JSON.parse(stdout);
            
            return {
                title: info.title,
                description: info.description,
                channel: info.uploader,
                duration: info.duration,
                views: info.view_count,
                likes: info.like_count,
                publishedAt: info.upload_date
            };

        } catch (error) {
            return {
                title: 'Unknown Title',
                channel: 'Unknown Channel',
                duration: 0
            };
        }
    }

    isValidYouTubeUrl(url) {
        const patterns = [
            /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
            /^(https?:\/\/)?(www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
            /^(https?:\/\/)?(www\.)?youtube\.com\/v\/([a-zA-Z0-9_-]{11})/
        ];
        
        return patterns.some(pattern => pattern.test(url));
    }

    extractVideoId(url) {
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
            /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
            /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }
        return null;
    }

    parseDuration(duration) {
        const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
        if (!match) return 0;

        const hours = (match[1] ? parseInt(match[1]) : 0);
        const minutes = (match[2] ? parseInt(match[2]) : 0);
        const seconds = (match[3] ? parseInt(match[3]) : 0);

        return hours * 3600 + minutes * 60 + seconds;
    }

    formatDuration(seconds) {
        if (!seconds) return 'Unknown';
        
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${secs.toString().padStart(2, '0')}`;
        }
    }

    async getAvailableFormats(videoUrl) {
        try {
            const { stdout } = await execAsync(`yt-dlp -F "${videoUrl}"`);
            const lines = stdout.split('\n');
            const formats = [];

            for (const line of lines) {
                if (line.includes('mp4') || line.includes('webm') || line.includes('audio only')) {
                    formats.push(line.trim());
                }
            }

            return formats.slice(0, 10); // Return first 10 formats
        } catch (error) {
            return ['mp4 (default)', 'mp3 (audio)'];
        }
    }

    async cleanupOldDownloads(maxAgeHours = 24) {
        try {
            const files = await fs.readdir(this.downloadsDir);
            const now = Date.now();
            let deletedCount = 0;

            for (const file of files) {
                const filepath = path.join(this.downloadsDir, file);
                const stats = await fs.stat(filepath);
                const fileAge = (now - stats.mtimeMs) / (1000 * 60 * 60);

                if (fileAge > maxAgeHours) {
                    await fs.unlink(filepath);
                    deletedCount++;
                }
            }

            return deletedCount;
        } catch (error) {
            console.error('Error cleaning up downloads:', error);
            return 0;
        }
    }
}

module.exports = YouTubeDownloader;