class Validator {
    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    static validatePhone(phone) {
        const phoneRegex = /^[\+]?[0-9]{10,15}$/;
        return phoneRegex.test(phone.replace(/[-()\s]/g, ''));
    }

    static validateIndonesianPhone(phone) {
        const indonesianPhoneRegex = /^(?:\+62|62|0)[2-9][0-9]{7,11}$/;
        return indonesianPhoneRegex.test(phone.replace(/[-()\s]/g, ''));
    }

    static validateURL(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    static validateYouTubeURL(url) {
        const patterns = [
            /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
            /^(https?:\/\/)?(www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
            /^(https?:\/\/)?(www\.)?youtube\.com\/v\/([a-zA-Z0-9_-]{11})/
        ];
        return patterns.some(pattern => pattern.test(url));
    }

    static validateInstagramURL(url) {
        const patterns = [
            /^(https?:\/\/)?(www\.)?instagram\.com\/p\/[a-zA-Z0-9_-]+\/?/,
            /^(https?:\/\/)?(www\.)?instagram\.com\/reel\/[a-zA-Z0-9_-]+\/?/,
            /^(https?:\/\/)?(www\.)?instagram\.com\/tv\/[a-zA-Z0-9_-]+\/?/,
            /^(https?:\/\/)?(www\.)?instagram\.com\/stories\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\/?/
        ];
        return patterns.some(pattern => pattern.test(url));
    }

    static validateTikTokURL(url) {
        const patterns = [
            /^(https?:\/\/)?(www\.)?tiktok\.com\/@[a-zA-Z0-9._-]+\/video\/[0-9]+\/?/,
            /^(https?:\/\/)?(vm\.)?tiktok\.com\/[a-zA-Z0-9]+\/?/,
            /^(https?:\/\/)?(vt\.)?tiktok\.com\/[a-zA-Z0-9]+\/?/
        ];
        return patterns.some(pattern => pattern.test(url));
    }

    static validateUsername(username) {
        // Username should be 3-20 characters, alphanumeric with underscores
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        return usernameRegex.test(username);
    }

    static validatePassword(password) {
        // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        return passwordRegex.test(password);
    }

    static validateDate(dateString, format = 'DD-MM-YYYY') {
        try {
            if (format === 'DD-MM-YYYY') {
                const [day, month, year] = dateString.split('-').map(Number);
                const date = new Date(year, month - 1, day);
                
                return date.getDate() === day && 
                       date.getMonth() === month - 1 && 
                       date.getFullYear() === year;
            }
            return false;
        } catch {
            return false;
        }
    }

    static validateAge(birthDate, minAge = 18) {
        try {
            const [day, month, year] = birthDate.split('-').map(Number);
            const birthDateObj = new Date(year, month - 1, day);
            const today = new Date();
            
            let age = today.getFullYear() - birthDateObj.getFullYear();
            const monthDiff = today.getMonth() - birthDateObj.getMonth();
            
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
                age--;
            }
            
            return age >= minAge;
        } catch {
            return false;
        }
    }

    static validateFileType(filename, allowedTypes) {
        const extension = filename.toLowerCase().split('.').pop();
        return allowedTypes.includes(extension);
    }

    static validateFileSize(fileSize, maxSizeMB) {
        const maxSizeBytes = maxSizeMB * 1024 * 1024;
        return fileSize <= maxSizeBytes;
    }

    static validateImageDimensions(width, height, maxWidth, maxHeight) {
        return width <= maxWidth && height <= maxHeight;
    }

    static validateHexColor(color) {
        const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
        return hexRegex.test(color);
    }

    static validateRGBColor(rgb) {
        const rgbRegex = /^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/;
        const match = rgb.match(rgbRegex);
        
        if (!match) return false;
        
        const r = parseInt(match[1]);
        const g = parseInt(match[2]);
        const b = parseInt(match[3]);
        
        return r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255;
    }

    static validateJSON(jsonString) {
        try {
            JSON.parse(jsonString);
            return true;
        } catch {
            return false;
        }
    }

    static validateIPAddress(ip) {
        const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
        const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
        return ipv4Regex.test(ip) || ipv6Regex.test(ip);
    }

    static validateCreditCard(number) {
        // Luhn algorithm
        let sum = 0;
        let isEven = false;
        
        for (let i = number.length - 1; i >= 0; i--) {
            let digit = parseInt(number[i]);
            
            if (isEven) {
                digit *= 2;
                if (digit > 9) {
                    digit -= 9;
                }
            }
            
            sum += digit;
            isEven = !isEven;
        }
        
        return sum % 10 === 0;
    }

    static validateUUID(uuid) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(uuid);
    }

    static validateBase64(base64) {
        const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
        return base64Regex.test(base64) && base64.length % 4 === 0;
    }

    static validateDomain(domain) {
        const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        return domainRegex.test(domain);
    }

    static validateHashtag(hashtag) {
        const hashtagRegex = /^#[a-zA-Z0-9_]+$/;
        return hashtagRegex.test(hashtag);
    }

    static validateMention(mention) {
        const mentionRegex = /^@[a-zA-Z0-9_.]+$/;
        return mentionRegex.test(mention);
    }

    static validateEmoji(emoji) {
        const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/gu;
        return emojiRegex.test(emoji);
    }

    static validateIndonesianText(text) {
        // Basic Indonesian text validation - check for common Indonesian characters
        const indonesianRegex = /^[a-zA-Z0-9\s.,!?;:'"()@#$%^&*[]{}<>/\\|~`+=-\u00C0-\u00FF\u0100-\u017F\u0180-\u024F]+$/;
        return indonesianRegex.test(text);
    }

    static validateCommandFormat(command) {
        const commandRegex = /^![a-zA-Z0-9_]+(\s+[a-zA-Z0-9_]+)*$/;
        return commandRegex.test(command);
    }

    static validateGameScore(score, min = 0, max = 1000) {
        const num = parseInt(score);
        return !isNaN(num) && num >= min && num <= max;
    }

    static validatePremiumCode(code) {
        const premiumRegex = /^PREMIUM_[A-Z0-9]{8,16}$/;
        return premiumRegex.test(code);
    }

    static validateToken(token) {
        return token && token.length >= 8 && token.length <= 64;
    }

    static validateCoordinates(lat, lng) {
        const latValid = lat >= -90 && lat <= 90;
        const lngValid = lng >= -180 && lng <= 180;
        return latValid && lngValid;
    }

    static validatePagination(page, limit, maxLimit = 100) {
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 10;
        
        return pageNum > 0 && limitNum > 0 && limitNum <= maxLimit;
    }

    static validateSortOrder(order) {
        const validOrders = ['asc', 'desc', 'ASC', 'DESC'];
        return validOrders.includes(order);
    }

    static validateArray(array, validator, options = {}) {
        if (!Array.isArray(array)) return false;
        
        if (options.minLength && array.length < options.minLength) return false;
        if (options.maxLength && array.length > options.maxLength) return false;
        
        if (validator) {
            return array.every(item => validator(item));
        }
        
        return true;
    }

    static validateObject(obj, schema) {
        if (typeof obj !== 'object' || obj === null) return false;
        
        for (const [key, rules] of Object.entries(schema)) {
            const value = obj[key];
            
            // Check required fields
            if (rules.required && (value === undefined || value === null)) {
                return false;
            }
            
            // Skip validation if field is optional and not provided
            if (!rules.required && (value === undefined || value === null)) {
                continue;
            }
            
            // Type validation
            if (rules.type && typeof value !== rules.type) {
                return false;
            }
            
            // Custom validator function
            if (rules.validator && !rules.validator(value)) {
                return false;
            }
            
            // Min/Max for numbers
            if (rules.min !== undefined && value < rules.min) {
                return false;
            }
            if (rules.max !== undefined && value > rules.max) {
                return false;
            }
            
            // Min/Max length for strings
            if (rules.minLength !== undefined && value.length < rules.minLength) {
                return false;
            }
            if (rules.maxLength !== undefined && value.length > rules.maxLength) {
                return false;
            }
            
            // Pattern matching for strings
            if (rules.pattern && !rules.pattern.test(value)) {
                return false;
            }
            
            // Array validation
            if (rules.array && !this.validateArray(value, rules.itemValidator, rules.arrayOptions)) {
                return false;
            }
        }
        
        return true;
    }

    static sanitizeInput(input) {
        if (typeof input === 'string') {
            return input
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#x27;')
                .replace(/\//g, '&#x2F;')
                .trim();
        }
        return input;
    }

    static normalizePhone(phone) {
        let cleaned = phone.replace(/[-()\s]/g, '');
        
        if (cleaned.startsWith('0')) {
            cleaned = '62' + cleaned.substring(1);
        } else if (cleaned.startsWith('+62')) {
            cleaned = '62' + cleaned.substring(3);
        }
        
        return cleaned;
    }

    static getValidationErrors() {
        return {
            email: 'Format email tidak valid',
            phone: 'Format nomor telepon tidak valid',
            username: 'Username harus 3-20 karakter (huruf, angka, underscore)',
            password: 'Password minimal 8 karakter dengan huruf besar, kecil, dan angka',
            url: 'Format URL tidak valid',
            date: 'Format tanggal tidak valid (DD-MM-YYYY)',
            age: 'Usia harus minimal 18 tahun',
            fileType: 'Tipe file tidak diizinkan',
            fileSize: 'Ukuran file terlalu besar'
        };
    }

    static getValidatorStats() {
        return {
            availableValidators: Object.getOwnPropertyNames(Validator)
                .filter(prop => prop.startsWith('validate') && typeof Validator[prop] === 'function')
                .length,
            version: '1.0.0'
        };
    }
}

module.exports = Validator;