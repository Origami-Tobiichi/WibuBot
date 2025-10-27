const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
const fs = require('fs').promises;
const path = require('path');

class MediaConverter {
    constructor() {
        this.conversionsDir = './data/downloads/conversions';
        this.supportedFormats = {
            audio: ['mp3', 'wav', 'ogg', 'm4a', 'flac'],
            video: ['mp4', 'avi', 'mov', 'mkv', 'webm'],
            image: ['jpg', 'png', 'webp', 'gif', 'bmp']
        };
        this.ensureConversionsDir();
    }

    async ensureConversionsDir() {
        try {
            await fs.mkdir(this.conversionsDir, { recursive: true });
        } catch (error) {
            console.error('Error creating conversions directory:', error);
        }
    }

    async convert(inputPath, outputFormat, options = {}) {
        try {
            // Check if input file exists
            await fs.access(inputPath);

            const inputExt = path.extname(inputPath).toLowerCase().replace('.', '');
            const filename = path.basename(inputPath, path.extname(inputPath));
            const outputFilename = `${filename}_converted.${outputFormat}`;
            const outputPath = path.join(this.conversionsDir, outputFilename);

            // Validate conversion
            if (!this.isConversionSupported(inputExt, outputFormat)) {
                throw new Error(`Conversion from ${inputExt} to ${outputFormat} is not supported`);
            }

            let command;
            const quality = options.quality || 'high';

            if (this.supportedFormats.audio.includes(outputFormat)) {
                command = this.buildAudioConversionCommand(inputPath, outputPath, outputFormat, quality);
            } else if (this.supportedFormats.video.includes(outputFormat)) {
                command = this.buildVideoConversionCommand(inputPath, outputPath, outputFormat, quality);
            } else if (this.supportedFormats.image.includes(outputFormat)) {
                command = this.buildImageConversionCommand(inputPath, outputPath, outputFormat, quality);
            } else {
                throw new Error(`Unsupported output format: ${outputFormat}`);
            }

            console.log(`Converting: ${command}`);
            const { stdout, stderr } = await execAsync(command);

            if (stderr && !this.isHarmlessFFmpegWarning(stderr)) {
                throw new Error(`Conversion error: ${stderr}`);
            }

            // Verify output file
            await fs.access(outputPath);
            const stats = await fs.stat(outputPath);
            const fileSize = (stats.size / (1024 * 1024)).toFixed(2);

            // Clean up input file if requested
            if (options.deleteOriginal) {
                await fs.unlink(inputPath);
            }

            return {
                success: true,
                inputPath: inputPath,
                outputPath: outputPath,
                outputFilename: outputFilename,
                inputFormat: inputExt,
                outputFormat: outputFormat,
                filesize: `${fileSize} MB`,
                conversionTime: Date.now() - (options.startTime || Date.now())
            };

        } catch (error) {
            console.error('Media conversion error:', error);
            return {
                success: false,
                error: error.message,
                inputPath: inputPath,
                outputFormat: outputFormat
            };
        }
    }

    buildAudioConversionCommand(inputPath, outputPath, outputFormat, quality) {
        let audioQuality = '';
        
        switch (quality) {
            case 'low':
                audioQuality = '-b:a 64k';
                break;
            case 'medium':
                audioQuality = '-b:a 128k';
                break;
            case 'high':
            default:
                audioQuality = '-b:a 320k';
                break;
        }

        return `ffmpeg -i "${inputPath}" -vn ${audioQuality} -y "${outputPath}"`;
    }

    buildVideoConversionCommand(inputPath, outputPath, outputFormat, quality) {
        let videoQuality = '';
        
        switch (quality) {
            case 'low':
                videoQuality = '-crf 28 -preset fast';
                break;
            case 'medium':
                videoQuality = '-crf 23 -preset medium';
                break;
            case 'high':
            default:
                videoQuality = '-crf 18 -preset slow';
                break;
        }

        return `ffmpeg -i "${inputPath}" ${videoQuality} -c:a copy -y "${outputPath}"`;
    }

    buildImageConversionCommand(inputPath, outputPath, outputFormat, quality) {
        let qualityParam = '';
        
        if (outputFormat === 'jpg' || outputFormat === 'jpeg') {
            switch (quality) {
                case 'low':
                    qualityParam = '-quality 60';
                    break;
                case 'medium':
                    qualityParam = '-quality 80';
                    break;
                case 'high':
                default:
                    qualityParam = '-quality 95';
                    break;
            }
        }

        return `ffmpeg -i "${inputPath}" ${qualityParam} -y "${outputPath}"`;
    }

    isConversionSupported(inputFormat, outputFormat) {
        // Check if both formats are supported
        const inputSupported = Object.values(this.supportedFormats).flat().includes(inputFormat);
        const outputSupported = Object.values(this.supportedFormats).flat().includes(outputFormat);
        
        if (!inputSupported || !outputSupported) {
            return false;
        }

        // Basic conversion rules
        if (this.supportedFormats.audio.includes(inputFormat) && 
            this.supportedFormats.audio.includes(outputFormat)) {
            return true;
        }

        if (this.supportedFormats.video.includes(inputFormat) && 
            this.supportedFormats.video.includes(outputFormat)) {
            return true;
        }

        if (this.supportedFormats.image.includes(inputFormat) && 
            this.supportedFormats.image.includes(outputFormat)) {
            return true;
        }

        // Special cases
        if (this.supportedFormats.video.includes(inputFormat) && 
            this.supportedFormats.audio.includes(outputFormat)) {
            return true; // Video to audio extraction
        }

        return false;
    }

    isHarmlessFFmpegWarning(warning) {
        const harmlessWarnings = [
            'deprecated',
            'experimental',
            'non monotonous DTS',
            'frame rate very high',
            'max delay reached'
        ];

        return harmlessWarnings.some(harmless => warning.toLowerCase().includes(harmless));
    }

    async getMediaInfo(filePath) {
        try {
            const { stdout } = await execAsync(`ffprobe -v quiet -print_format json -show_format -show_streams "${filePath}"`);
            const info = JSON.parse(stdout);

            const formatInfo = {
                filename: path.basename(filePath),
                format: info.format.format_name,
                duration: parseFloat(info.format.duration) || 0,
                size: parseInt(info.format.size) || 0,
                bitrate: parseInt(info.format.bit_rate) || 0
            };

            // Extract stream information
            formatInfo.streams = info.streams.map(stream => ({
                type: stream.codec_type,
                codec: stream.codec_name,
                bitrate: parseInt(stream.bit_rate) || 0,
                dimensions: stream.width && stream.height ? `${stream.width}x${stream.height}` : null,
                sample_rate: stream.sample_rate || null,
                channels: stream.channels || null
            }));

            return formatInfo;

        } catch (error) {
            console.error('Error getting media info:', error);
            return null;
        }
    }

    async compressMedia(inputPath, targetSizeMB, options = {}) {
        try {
            const mediaInfo = await this.getMediaInfo(inputPath);
            if (!mediaInfo) {
                throw new Error('Could not get media information');
            }

            const currentSizeMB = mediaInfo.size / (1024 * 1024);
            if (currentSizeMB <= targetSizeMB) {
                return {
                    success: true,
                    message: 'File is already smaller than target size',
                    inputPath: inputPath,
                    outputPath: inputPath,
                    originalSize: currentSizeMB.toFixed(2),
                    newSize: currentSizeMB.toFixed(2)
                };
            }

            const compressionRatio = targetSizeMB / currentSizeMB;
            const outputFilename = `${path.basename(inputPath, path.extname(inputPath))}_compressed${path.extname(inputPath)}`;
            const outputPath = path.join(this.conversionsDir, outputFilename);

            let command;
            if (mediaInfo.streams.some(s => s.type === 'video')) {
                // Video compression
                const crf = Math.max(18, Math.min(40, Math.round(23 / compressionRatio)));
                command = `ffmpeg -i "${inputPath}" -crf ${crf} -preset medium -c:a copy -y "${outputPath}"`;
            } else if (mediaInfo.streams.some(s => s.type === 'audio')) {
                // Audio compression
                const targetBitrate = Math.max(64, Math.min(320, Math.round(mediaInfo.bitrate * compressionRatio / 1000)));
                command = `ffmpeg -i "${inputPath}" -b:a ${targetBitrate}k -y "${outputPath}"`;
            } else {
                throw new Error('Unsupported media type for compression');
            }

            await execAsync(command);
            const newStats = await fs.stat(outputPath);
            const newSizeMB = newStats.size / (1024 * 1024);

            return {
                success: true,
                inputPath: inputPath,
                outputPath: outputPath,
                originalSize: currentSizeMB.toFixed(2),
                newSize: newSizeMB.toFixed(2),
                compression: ((1 - (newSizeMB / currentSizeMB)) * 100).toFixed(1) + '%'
            };

        } catch (error) {
            console.error('Media compression error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async extractAudioFromVideo(videoPath, outputFormat = 'mp3') {
        return await this.convert(videoPath, outputFormat, {
            deleteOriginal: false
        });
    }

    async takeScreenshot(videoPath, timestamp = '00:00:01') {
        try {
            const screenshotName = `screenshot_${path.basename(videoPath, path.extname(videoPath))}_${Date.now()}.jpg`;
            const screenshotPath = path.join(this.conversionsDir, screenshotName);

            const command = `ffmpeg -ss ${timestamp} -i "${videoPath}" -vframes 1 -q:v 2 -y "${screenshotPath}"`;
            await execAsync(command);

            await fs.access(screenshotPath);
            const stats = await fs.stat(screenshotPath);

            return {
                success: true,
                screenshotPath: screenshotPath,
                filename: screenshotName,
                filesize: (stats.size / 1024).toFixed(2) + ' KB',
                timestamp: timestamp
            };

        } catch (error) {
            console.error('Screenshot extraction error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async cleanupOldConversions(maxAgeHours = 24) {
        try {
            const files = await fs.readdir(this.conversionsDir);
            const now = Date.now();
            let deletedCount = 0;

            for (const file of files) {
                const filepath = path.join(this.conversionsDir, file);
                const stats = await fs.stat(filepath);
                const fileAge = (now - stats.mtimeMs) / (1000 * 60 * 60);

                if (fileAge > maxAgeHours) {
                    await fs.unlink(filepath);
                    deletedCount++;
                }
            }

            return deletedCount;
        } catch (error) {
            console.error('Error cleaning up conversions:', error);
            return 0;
        }
    }
}

module.exports = MediaConverter;