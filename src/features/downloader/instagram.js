const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class InstagramDownloader {
    constructor() {
        this.downloadsDir = './data/downloads/instagram';
        this.ensureDownloadsDir();
    }

    async ensureDownloadsDir() {
        try {
            await fs.mkdir(this.downloadsDir, { recursive: true });
        } catch (error) {
            console.error('Error creating Instagram downloads directory:', error);
        }
    }

    async download(postUrl, type = 'auto') {
        try {
            if (!this.isValidInstagramUrl(postUrl)) {
                throw new Error('Invalid Instagram URL');
            }

            const postId = this.extractPostId(postUrl);
            const postInfo = await this.getPostInfo(postUrl);

            let downloadResult;
            if (postInfo.isVideo || type === 'video') {
                downloadResult = await this.downloadVideo(postInfo);
            } else if (postInfo.isCarousel) {
                downloadResult = await this.downloadCarousel(postInfo);
            } else {
                downloadResult = await this.downloadImage(postInfo);
            }

            return {
                success: true,
                ...downloadResult,
                info: postInfo
            };

        } catch (error) {
            console.error('Instagram download error:', error);
            return {
                success: false,
                error: error.message,
                postUrl: postUrl
            };
        }
    }

    async getPostInfo(postUrl) {
        try {
            // Using external API for Instagram data
            const response = await axios.get(`https://www.instagram.com/p/${this.extractPostId(postUrl)}/?__a=1`);
            const data = response.data;

            const postInfo = {
                id: data.graphql.shortcode_media.id,
                shortcode: data.graphql.shortcode_media.shortcode,
                username: data.graphql.shortcode_media.owner.username,
                caption: data.graphql.shortcode_media.edge_media_to_caption?.edges[0]?.node?.text || 'No caption',
                likes: data.graphql.shortcode_media.edge_media_preview_like?.count || 0,
                comments: data.graphql.shortcode_media.edge_media_to_comment?.count || 0,
                timestamp: data.graphql.shortcode_media.taken_at_timestamp,
                isVideo: data.graphql.shortcode_media.is_video,
                isCarousel: data.graphql.shortcode_media.edge_sidecar_to_children !== undefined,
                videoUrl: data.graphql.shortcode_media.video_url,
                displayUrl: data.graphql.shortcode_media.display_url
            };

            if (postInfo.isCarousel) {
                postInfo.carouselItems = data.graphql.shortcode_media.edge_sidecar_to_children.edges.map(edge => ({
                    isVideo: edge.node.is_video,
                    displayUrl: edge.node.display_url,
                    videoUrl: edge.node.video_url
                }));
            }

            return postInfo;

        } catch (error) {
            // Fallback to basic info extraction
            return {
                id: this.extractPostId(postUrl),
                shortcode: this.extractPostId(postUrl),
                username: 'unknown',
                caption: 'Unable to fetch caption',
                likes: 0,
                comments: 0,
                timestamp: Date.now(),
                isVideo: postUrl.includes('/reel/') || postUrl.includes('/tv/'),
                isCarousel: false,
                videoUrl: null,
                displayUrl: null
            };
        }
    }

    async downloadVideo(postInfo) {
        if (!postInfo.videoUrl) {
            throw new Error('No video URL available');
        }

        const filename = `ig_video_${postInfo.shortcode}_${Date.now()}.mp4`;
        const filepath = path.join(this.downloadsDir, filename);

        const response = await axios({
            method: 'GET',
            url: postInfo.videoUrl,
            responseType: 'stream'
        });

        const writer = require('fs').createWriteStream(filepath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => {
                resolve({
                    filepath: filepath,
                    filename: filename,
                    type: 'video',
                    format: 'mp4',
                    mediaCount: 1
                });
            });
            writer.on('error', reject);
        });
    }

    async downloadImage(postInfo) {
        if (!postInfo.displayUrl) {
            throw new Error('No image URL available');
        }

        const filename = `ig_image_${postInfo.shortcode}_${Date.now()}.jpg`;
        const filepath = path.join(this.downloadsDir, filename);

        const response = await axios({
            method: 'GET',
            url: postInfo.displayUrl,
            responseType: 'stream'
        });

        const writer = require('fs').createWriteStream(filepath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => {
                resolve({
                    filepath: filepath,
                    filename: filename,
                    type: 'image',
                    format: 'jpg',
                    mediaCount: 1
                });
            });
            writer.on('error', reject);
        });
    }

    async downloadCarousel(postInfo) {
        const downloads = [];
        
        for (let i = 0; i < postInfo.carouselItems.length; i++) {
            const item = postInfo.carouselItems[i];
            let download;

            if (item.isVideo) {
                download = await this.downloadVideo({ ...postInfo, videoUrl: item.videoUrl });
            } else {
                download = await this.downloadImage({ ...postInfo, displayUrl: item.displayUrl });
            }

            downloads.push(download);
        }

        return {
            filepath: downloads.map(d => d.filepath),
            filename: downloads.map(d => d.filename),
            type: 'carousel',
            format: 'multiple',
            mediaCount: downloads.length
        };
    }

    isValidInstagramUrl(url) {
        const patterns = [
            /^(https?:\/\/)?(www\.)?instagram\.com\/p\/[a-zA-Z0-9_-]+\/?/,
            /^(https?:\/\/)?(www\.)?instagram\.com\/reel\/[a-zA-Z0-9_-]+\/?/,
            /^(https?:\/\/)?(www\.)?instagram\.com\/tv\/[a-zA-Z0-9_-]+\/?/,
            /^(https?:\/\/)?(www\.)?instagram\.com\/stories\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\/?/
        ];
        
        return patterns.some(pattern => pattern.test(url));
    }

    extractPostId(url) {
        const patterns = [
            /instagram\.com\/p\/([a-zA-Z0-9_-]+)/,
            /instagram\.com\/reel\/([a-zA-Z0-9_-]+)/,
            /instagram\.com\/tv\/([a-zA-Z0-9_-]+)/,
            /instagram\.com\/stories\/[a-zA-Z0-9_-]+\/([a-zA-Z0-9_-]+)/
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }
        return null;
    }

    async downloadStory(storyUrl) {
        try {
            if (!this.isValidInstagramUrl(storyUrl) || !storyUrl.includes('/stories/')) {
                throw new Error('Invalid Instagram story URL');
            }

            const storyInfo = await this.getStoryInfo(storyUrl);
            
            if (storyInfo.isVideo) {
                return await this.downloadVideo(storyInfo);
            } else {
                return await this.downloadImage(storyInfo);
            }

        } catch (error) {
            console.error('Instagram story download error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getStoryInfo(storyUrl) {
        // Similar to getPostInfo but for stories
        // Implementation would depend on available APIs
        return {
            id: this.extractPostId(storyUrl),
            username: 'unknown',
            isVideo: storyUrl.includes('/video/'),
            videoUrl: null,
            displayUrl: null
        };
    }
}

module.exports = InstagramDownloader;