class NSFWFilter {
    constructor() {
        this.bannedWords = this.initializeBannedWords();
        this.allowedCategories = ['art', 'educational', 'medical'];
        this.sensitivityLevel = 'medium';
    }

    initializeBannedWords() {
        return new Set([
            // Explicit adult terms in multiple languages
            'porn', 'porno', 'xxx', 'nsfw', 'adult', 'erotic',
            'seks', 'sexual', 'sex', 'hentai', 'ecchi', 'yuri', 'yaoi',
            'nude', 'naked', 'bare', 'explicit', 'lewd', 'obscene',
            // Indonesian explicit terms
            'mesum', 'porno', 'bugil', 'telanjang', 'adegan dewasa',
            // Add more as needed...
        ]);
    }

    setSensitivityLevel(level) {
        const allowedLevels = ['low', 'medium', 'high', 'strict'];
        if (allowedLevels.includes(level)) {
            this.sensitivityLevel = level;
            return { success: true, message: `Sensitivity level set to: ${level}` };
        }
        return { success: false, message: 'Invalid sensitivity level' };
    }

    filterContent(text, mediaType = 'text') {
        try {
            const lowerText = text.toLowerCase();
            
            // Check for banned words
            const detectedWords = this.detectBannedWords(lowerText);
            
            if (detectedWords.length > 0) {
                return {
                    isSafe: false,
                    reason: 'Contains explicit content',
                    detectedWords: detectedWords,
                    confidence: this.calculateConfidence(detectedWords.length, text.length),
                    action: 'block'
                };
            }

            // Additional checks based on sensitivity level
            const additionalCheck = this.additionalContentChecks(text, mediaType);
            if (!additionalCheck.isSafe) {
                return additionalCheck;
            }

            return {
                isSafe: true,
                confidence: 0.9,
                action: 'allow'
            };

        } catch (error) {
            console.error('Content filtering error:', error);
            // When in doubt, block the content
            return {
                isSafe: false,
                reason: 'Filtering error',
                error: error.message,
                action: 'block'
            };
        }
    }

    detectBannedWords(text) {
        const detected = [];
        for (const word of this.bannedWords) {
            if (text.includes(word)) {
                detected.push(word);
            }
        }
        return detected;
    }

    calculateConfidence(bannedWordCount, textLength) {
        const ratio = bannedWordCount / (textLength / 10); // Normalize by text length
        return Math.min(0.99, ratio);
    }

    additionalContentChecks(text, mediaType) {
        const checks = {
            urlCheck: this.checkUrls(text),
            patternCheck: this.checkSuspiciousPatterns(text),
            contextCheck: this.checkContext(text, mediaType)
        };

        // Apply sensitivity level adjustments
        return this.applySensitivityLevel(checks);
    }

    checkUrls(text) {
        const urlRegex = /https?:\/\/[^\s]+/g;
        const urls = text.match(urlRegex) || [];
        
        const suspiciousDomains = ['.xxx', 'porn', 'adult', 'hentai'];
        for (const url of urls) {
            for (const domain of suspiciousDomains) {
                if (url.includes(domain)) {
                    return {
                        isSafe: false,
                        reason: 'Suspicious URL detected',
                        detectedUrl: url,
                        action: 'block'
                    };
                }
            }
        }

        return { isSafe: true };
    }

    checkSuspiciousPatterns(text) {
        // Check for common adult content patterns
        const patterns = [
            /(\d+[+\-]?)+cm/i, // Measurements
            /onlyfans|patreon|premium.*content/i, // Adult content platforms
            /free.*video|download.*full/i // Suspicious offers
        ];

        for (const pattern of patterns) {
            if (pattern.test(text)) {
                return {
                    isSafe: false,
                    reason: 'Suspicious pattern detected',
                    pattern: pattern.source,
                    action: 'review'
                };
            }
        }

        return { isSafe: true };
    }

    checkContext(text, mediaType) {
        // Context-based filtering
        if (mediaType === 'image' || mediaType === 'video') {
            const mediaTriggers = ['pic', 'photo', 'image', 'video', 'clip', 'movie'];
            const hasMediaTrigger = mediaTriggers.some(trigger => text.includes(trigger));
            
            if (hasMediaTrigger && text.length < 20) {
                // Short messages with media references might be suspicious
                return {
                    isSafe: false,
                    reason: 'Suspicious media context',
                    action: 'review'
                };
            }
        }

        return { isSafe: true };
    }

    applySensitivityLevel(checks) {
        const issues = Object.values(checks).filter(check => !check.isSafe);
        
        if (issues.length === 0) {
            return { isSafe: true, action: 'allow' };
        }

        switch (this.sensitivityLevel) {
            case 'low':
                // Only block clear violations
                const clearViolations = issues.filter(issue => issue.action === 'block');
                if (clearViolations.length > 0) {
                    return clearViolations[0];
                }
                return { isSafe: true, action: 'allow', reviewed: true };
                
            case 'medium':
                // Block clear violations and review others
                const blockIssues = issues.filter(issue => issue.action === 'block');
                if (blockIssues.length > 0) {
                    return blockIssues[0];
                }
                return { 
                    isSafe: false, 
                    reason: 'Content requires review', 
                    action: 'review',
                    issues: issues.map(i => i.reason)
                };
                
            case 'high':
            case 'strict':
                // Block anything suspicious
                return {
                    isSafe: false,
                    reason: 'Multiple content issues detected',
                    action: 'block',
                    issues: issues.map(i => i.reason)
                };
                
            default:
                return { isSafe: true, action: 'allow' };
        }
    }

    addBannedWord(word) {
        this.bannedWords.add(word.toLowerCase());
        return { success: true, message: `Added "${word}" to banned words list` };
    }

    removeBannedWord(word) {
        const existed = this.bannedWords.delete(word.toLowerCase());
        return { 
            success: existed, 
            message: existed ? `Removed "${word}" from banned words` : 'Word not found' 
        };
    }

    getBannedWords() {
        return Array.from(this.bannedWords);
    }

    async analyzeImage(imageUrl) {
        // This would integrate with an image moderation API
        // For now, return a simulated analysis
        return {
            isSafe: true,
            confidence: 0.85,
            categories: [],
            moderation: 'passed',
            details: 'Image analysis not available in this version'
        };
    }

    async analyzeVideo(videoUrl) {
        // This would integrate with a video moderation API
        return {
            isSafe: true,
            confidence: 0.80,
            categories: [],
            moderation: 'passed',
            details: 'Video analysis not available in this version'
        };
    }

    getFilterStats() {
        return {
            bannedWordsCount: this.bannedWords.size,
            sensitivityLevel: this.sensitivityLevel,
            allowedCategories: this.allowedCategories,
            filterVersion: '1.0'
        };
    }

    exportFilterConfig() {
        return {
            bannedWords: this.getBannedWords(),
            sensitivityLevel: this.sensitivityLevel,
            allowedCategories: this.allowedCategories,
            exportedAt: new Date().toISOString()
        };
    }

    importFilterConfig(config) {
        try {
            if (config.bannedWords) {
                this.bannedWords = new Set(config.bannedWords);
            }
            if (config.sensitivityLevel) {
                this.sensitivityLevel = config.sensitivityLevel;
            }
            if (config.allowedCategories) {
                this.allowedCategories = config.allowedCategories;
            }
            return { success: true, message: 'Filter configuration imported' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

module.exports = NSFWFilter;