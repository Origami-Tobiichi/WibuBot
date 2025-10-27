const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

class VoiceProcessor {
    constructor() {
        this.voiceDir = './data/voice-notes';
        this.processedDir = path.join(this.voiceDir, 'processed');
        this.ensureDirectories();
    }

    async ensureDirectories() {
        try {
            await fs.mkdir(this.voiceDir, { recursive: true });
            await fs.mkdir(this.processedDir, { recursive: true });
        } catch (error) {
            console.error('Error creating voice directories:', error);
        }
    }

    async processVoiceMessage(audioBuffer, format = 'ogg') {
        try {
            const filename = `voice_${Date.now()}.${format}`;
            const filepath = path.join(this.voiceDir, filename);
            
            // Save audio buffer to file
            await fs.writeFile(filepath, audioBuffer);

            // Convert to WAV for processing
            const wavPath = path.join(this.voiceDir, `voice_${Date.now()}.wav`);
            await this.convertToWav(filepath, wavPath);

            // Speech to text conversion
            const text = await this.speechToText(wavPath);

            // Cleanup temporary files
            await fs.unlink(filepath);
            await fs.unlink(wavPath);

            return {
                success: true,
                text: text,
                duration: await this.getAudioDuration(wavPath),
                filename: filename
            };

        } catch (error) {
            console.error('Voice processing error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async convertToWav(inputPath, outputPath) {
        try {
            const command = `ffmpeg -i "${inputPath}" -acodec pcm_s16le -ar 16000 -ac 1 "${outputPath}" -y`;
            await execAsync(command);
            return outputPath;
        } catch (error) {
            throw new Error(`Audio conversion failed: ${error.message}`);
        }
    }

    async speechToText(audioPath) {
        try {
            // Try Google Speech-to-Text first
            if (process.env.GOOGLE_CLOUD_API_KEY) {
                return await this.googleSpeechToText(audioPath);
            }
            
            // Try OpenAI Whisper
            if (process.env.OPENAI_API_KEY) {
                return await this.openaiWhisper(audioPath);
            }

            // Fallback to local processing (simulated)
            return await this.localSpeechToText(audioPath);

        } catch (error) {
            console.error('Speech-to-text error:', error);
            return "Maaf, saya tidak bisa memahami pesan suara ini. Silakan coba lagi atau ketik pesan Anda.";
        }
    }

    async googleSpeechToText(audioPath) {
        // Implementation for Google Cloud Speech-to-Text
        // This would require google-cloud/speech package
        return "Google Speech-to-Text response (simulated)";
    }

    async openaiWhisper(audioPath) {
        try {
            const formData = new FormData();
            const audioBuffer = await fs.readFile(audioPath);
            const blob = new Blob([audioBuffer], { type: 'audio/wav' });
            
            formData.append('file', blob, 'audio.wav');
            formData.append('model', 'whisper-1');
            formData.append('language', 'id');

            const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', formData, {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            return response.data.text;

        } catch (error) {
            throw new Error(`OpenAI Whisper error: ${error.message}`);
        }
    }

    async localSpeechToText(audioPath) {
        // Simulate local processing with some basic voice command detection
        const duration = await this.getAudioDuration(audioPath);
        
        // Simple duration-based response (in real implementation, use proper speech recognition)
        if (duration < 2) {
            return "Pesan suara terlalu pendek. Silakan rekam lebih lama.";
        } else if (duration > 30) {
            return "Pesan suara terlalu panjang. Maksimal 30 detik.";
        } else {
            const responses = [
                "Halo! Ada yang bisa saya bantu?",
                "Saya mendengar pesan suara Anda.",
                "Terima kasih telah mengirim pesan suara.",
                "Pesan suara telah diterima dan diproses.",
                "Silakan ketik pesan jika suara tidak jelas."
            ];
            return responses[Math.floor(Math.random() * responses.length)];
        }
    }

    async textToSpeech(text, language = 'id') {
        try {
            const filename = `tts_${Date.now()}.mp3`;
            const filepath = path.join(this.voiceDir, filename);

            // Try Google Text-to-Speech first
            if (process.env.GOOGLE_CLOUD_API_KEY) {
                return await this.googleTextToSpeech(text, language, filepath);
            }

            // Try OpenAI TTS
            if (process.env.OPENAI_API_KEY) {
                return await this.openaiTextToSpeech(text, filepath);
            }

            // Fallback to local TTS
            return await this.localTextToSpeech(text, filepath);

        } catch (error) {
            console.error('Text-to-speech error:', error);
            return null;
        }
    }

    async googleTextToSpeech(text, language, outputPath) {
        // Implementation for Google Cloud Text-to-Speech
        // This would require @google-cloud/text-to-speech package
        return outputPath;
    }

    async openaiTextToSpeech(text, outputPath) {
        try {
            const response = await axios.post('https://api.openai.com/v1/audio/speech', {
                model: 'tts-1',
                input: text,
                voice: 'alloy' // alloy, echo, fable, onyx, nova, shimmer
            }, {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                responseType: 'stream'
            });

            const writer = require('fs').createWriteStream(outputPath);
            response.data.pipe(writer);

            return new Promise((resolve, reject) => {
                writer.on('finish', () => resolve(outputPath));
                writer.on('error', reject);
            });

        } catch (error) {
            throw new Error(`OpenAI TTS error: ${error.message}`);
        }
    }

    async localTextToSpeech(text, outputPath) {
        // Use system TTS or external service
        try {
            // For Linux/macOS with say command
            const command = `say "${text}" -o "${outputPath}"`;
            await execAsync(command);
            return outputPath;
        } catch (error) {
            // For Windows or other systems, you might need different approaches
            console.log('Local TTS not available, using fallback');
            return null;
        }
    }

    async getAudioDuration(audioPath) {
        try {
            const command = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`;
            const { stdout } = await execAsync(command);
            return parseFloat(stdout) || 0;
        } catch (error) {
            return 0;
        }
    }

    async analyzeVoiceEmotion(audioPath) {
        // Basic emotion analysis based on audio characteristics
        try {
            const duration = await this.getAudioDuration(audioPath);
            
            // Simulate emotion detection based on duration and other factors
            const emotions = ['neutral', 'happy', 'sad', 'excited', 'calm'];
            const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
            
            return {
                emotion: randomEmotion,
                confidence: (Math.random() * 0.5 + 0.5).toFixed(2), // 0.5-1.0
                duration: duration
            };
        } catch (error) {
            return {
                emotion: 'unknown',
                confidence: 0,
                duration: 0
            };
        }
    }

    async compressAudio(inputPath, quality = 'medium') {
        try {
            const filename = `compressed_${path.basename(inputPath)}`;
            const outputPath = path.join(this.voiceDir, filename);

            let bitrate = '128k';
            switch (quality) {
                case 'low': bitrate = '64k'; break;
                case 'medium': bitrate = '128k'; break;
                case 'high': bitrate = '192k'; break;
            }

            const command = `ffmpeg -i "${inputPath}" -b:a ${bitrate} "${outputPath}" -y`;
            await execAsync(command);

            const originalStats = await fs.stat(inputPath);
            const compressedStats = await fs.stat(outputPath);
            
            const compressionRatio = (1 - (compressedStats.size / originalStats.size)) * 100;

            return {
                success: true,
                outputPath: outputPath,
                originalSize: (originalStats.size / 1024).toFixed(2) + ' KB',
                compressedSize: (compressedStats.size / 1024).toFixed(2) + ' KB',
                compression: compressionRatio.toFixed(1) + '%',
                quality: quality
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async cleanupOldVoiceFiles(maxAgeHours = 24) {
        try {
            const files = await fs.readdir(this.voiceDir);
            const now = Date.now();
            let deletedCount = 0;

            for (const file of files) {
                if (file === 'processed') continue;
                
                const filepath = path.join(this.voiceDir, file);
                const stats = await fs.stat(filepath);
                const fileAge = (now - stats.mtimeMs) / (1000 * 60 * 60);

                if (fileAge > maxAgeHours) {
                    await fs.unlink(filepath);
                    deletedCount++;
                }
            }

            return deletedCount;
        } catch (error) {
            console.error('Error cleaning up voice files:', error);
            return 0;
        }
    }

    async getVoiceStats() {
        try {
            const files = await fs.readdir(this.voiceDir);
            const voiceFiles = files.filter(file => 
                file.startsWith('voice_') || file.startsWith('tts_')
            );

            let totalSize = 0;
            for (const file of voiceFiles) {
                const stats = await fs.stat(path.join(this.voiceDir, file));
                totalSize += stats.size;
            }

            return {
                totalFiles: voiceFiles.length,
                totalSize: (totalSize / (1024 * 1024)).toFixed(2) + ' MB',
                voiceNotes: voiceFiles.filter(f => f.startsWith('voice_')).length,
                ttsFiles: voiceFiles.filter(f => f.startsWith('tts_')).length
            };
        } catch (error) {
            return {
                totalFiles: 0,
                totalSize: '0 MB',
                voiceNotes: 0,
                ttsFiles: 0
            };
        }
    }
}

module.exports = VoiceProcessor;