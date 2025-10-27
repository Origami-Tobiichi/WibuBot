const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const Constants = require('./constants');

class Security {
    constructor() {
        this.encryptionKey = process.env.ENCRYPTION_KEY || 'whatsapp-bot-encryption-key';
        this.jwtSecret = process.env.JWT_SECRET || 'whatsapp-bot-jwt-secret';
        this.algorithm = 'aes-256-gcm';
    }

    // Encryption/Decryption
    encrypt(text) {
        try {
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipher(this.algorithm, this.encryptionKey);
            cipher.setAAD(Buffer.from('whatsapp-bot'));
            
            let encrypted = cipher.update(text, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            
            const authTag = cipher.getAuthTag();
            
            return {
                iv: iv.toString('hex'),
                data: encrypted,
                authTag: authTag.toString('hex')
            };
        } catch (error) {
            console.error('Encryption error:', error);
            return null;
        }
    }

    decrypt(encryptedData) {
        try {
            const decipher = crypto.createDecipher(this.algorithm, this.encryptionKey);
            decipher.setAAD(Buffer.from('whatsapp-bot'));
            decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
            
            let decrypted = decipher.update(encryptedData.data, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            return decrypted;
        } catch (error) {
            console.error('Decryption error:', error);
            return null;
        }
    }

    // Hashing
    hash(data, algorithm = 'sha256') {
        return crypto.createHash(algorithm).update(data).digest('hex');
    }

    generateSalt(length = 16) {
        return crypto.randomBytes(length).toString('hex');
    }

    hashWithSalt(data, salt) {
        return crypto.createHmac('sha256', salt).update(data).digest('hex');
    }

    // JWT Tokens
    generateToken(payload, expiresIn = '30d') {
        return jwt.sign(payload, this.jwtSecret, { expiresIn });
    }

    verifyToken(token) {
        try {
            return jwt.verify(token, this.jwtSecret);
        } catch (error) {
            console.error('Token verification error:', error);
            return null;
        }
    }

    decodeToken(token) {
        try {
            return jwt.decode(token);
        } catch (error) {
            console.error('Token decode error:', error);
            return null;
        }
    }

    // Input Sanitization
    sanitizeInput(input) {
        if (typeof input === 'string') {
            return input
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#x27;')
                .replace(/\//g, '&#x2F;')
                .replace(/\\/g, '&#x5C;')
                .replace(/`/g, '&#x60;')
                .trim();
        }
        return input;
    }

    sanitizeObject(obj) {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'string') {
                sanitized[key] = this.sanitizeInput(value);
            } else if (typeof value === 'object' && value !== null) {
                sanitized[key] = this.sanitizeObject(value);
            } else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    }

    // XSS Prevention
    validateNoXSS(input) {
        const xssPatterns = [
            /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
            /javascript:/gi,
            /on\w+\s*=/gi,
            /<\s*iframe/gi,
            /<\s*form/gi,
            /<\s*meta/gi,
            /<\s*object/gi,
            /<\s*embed/gi,
            /<\s*applet/gi
        ];

        return !xssPatterns.some(pattern => pattern.test(input));
    }

    // SQL Injection Prevention (for when using databases)
    validateNoSQLInjection(input) {
        const sqlPatterns = [
            /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|EXEC)\b)/gi,
            /('|"|;|--|\/\*|\*\/)/g
        ];

        return !sqlPatterns.some(pattern => pattern.test(input));
    }

    // Rate Limiting
    createRateLimiter(maxRequests, windowMs) {
        const requests = new Map();

        return (identifier) => {
            const now = Date.now();
            const windowStart = now - windowMs;

            // Clean old entries
            for (const [key, timestamps] of requests.entries()) {
                const validTimestamps = timestamps.filter(ts => ts > windowStart);
                if (validTimestamps.length === 0) {
                    requests.delete(key);
                } else {
                    requests.set(key, validTimestamps);
                }
            }

            // Check current user
            if (!requests.has(identifier)) {
                requests.set(identifier, [now]);
                return true;
            }

            const userRequests = requests.get(identifier);
            const validUserRequests = userRequests.filter(ts => ts > windowStart);

            if (validUserRequests.length >= maxRequests) {
                return false;
            }

            validUserRequests.push(now);
            requests.set(identifier, validUserRequests);
            return true;
        };
    }

    // Password Strength Validation
    validatePasswordStrength(password) {
        const checks = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /\d/.test(password),
            special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
        };

        const score = Object.values(checks).filter(Boolean).length;
        const strength = score >= 4 ? 'strong' : score >= 3 ? 'medium' : 'weak';

        return {
            valid: score >= 3,
            strength: strength,
            score: score,
            checks: checks
        };
    }

    // File Upload Security
    validateFileUpload(file, allowedTypes = [], maxSize = 10 * 1024 * 1024) {
        const results = {
            valid: true,
            errors: []
        };

        // Check file size
        if (file.size > maxSize) {
            results.valid = false;
            results.errors.push(`File too large. Maximum size: ${maxSize / 1024 / 1024}MB`);
        }

        // Check file type
        if (allowedTypes.length > 0) {
            const fileExtension = file.name.toLowerCase().split('.').pop();
            const mimeType = file.type;

            const typeValid = allowedTypes.some(type => 
                fileExtension === type.toLowerCase() || 
                mimeType.includes(type.toLowerCase())
            );

            if (!typeValid) {
                results.valid = false;
                results.errors.push(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
            }
        }

        // Check for potential malicious files
        const maliciousPatterns = [
            /\.(exe|bat|cmd|sh|php|asp|aspx|jsp)$/i,
            /<\?php/,
            /<script/i,
            /javascript:/i
        ];

        if (maliciousPatterns.some(pattern => pattern.test(file.name))) {
            results.valid = false;
            results.errors.push('File appears to be malicious');
        }

        return results;
    }

    // CSRF Protection
    generateCSRFToken() {
        return crypto.randomBytes(32).toString('hex');
    }

    validateCSRFToken(token, storedToken) {
        return token && storedToken && token === storedToken;
    }

    // Secure Random Generation
    generateSecureRandom(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }

    generateOTP(length = 6) {
        const digits = '0123456789';
        let otp = '';
        for (let i = 0; i < length; i++) {
            otp += digits[Math.floor(Math.random() * 10)];
        }
        return otp;
    }

    // URL Validation and Sanitization
    validateAndSanitizeURL(url) {
        try {
            const parsedUrl = new URL(url);
            
            // Allow only HTTP and HTTPS
            if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
                return null;
            }

            // Block known malicious domains (simplified)
            const maliciousDomains = [
                'malicious.com',
                'phishing-site.com'
                // In real implementation, use a comprehensive list
            ];

            if (maliciousDomains.includes(parsedUrl.hostname)) {
                return null;
            }

            return parsedUrl.toString();

        } catch (error) {
            return null;
        }
    }

    // Headers Security
    getSecurityHeaders() {
        return {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
            'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
            'Referrer-Policy': 'strict-origin-when-cross-origin'
        };
    }

    // Audit Logging
    createAuditLog(action, user, details = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            action: action,
            user: user,
            details: details,
            ip: details.ip || 'unknown',
            userAgent: details.userAgent || 'unknown'
        };

        // In real implementation, save to audit log database
        console.log('🔒 Audit Log:', JSON.stringify(logEntry, null, 2));
        
        return logEntry;
    }

    // Security Health Check
    securityHealthCheck() {
        const checks = {
            encryptionKey: !!this.encryptionKey && this.encryptionKey.length >= 16,
            jwtSecret: !!this.jwtSecret && this.jwtSecret.length >= 16,
            environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
            https: process.env.NODE_ENV === 'production' ? 'required' : 'optional'
        };

        const allHealthy = Object.values(checks).every(check => 
            typeof check === 'boolean' ? check : true
        );

        return {
            healthy: allHealthy,
            checks: checks,
            timestamp: new Date().toISOString()
        };
    }

    // Data Masking for Logs
    maskSensitiveData(data) {
        if (typeof data === 'string') {
            // Mask emails
            data = data.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '***@***.***');
            
            // Mask phone numbers
            data = data.replace(/\b(?:\+62|62|0)[2-9][0-9]{7,11}\b/g, '***-***-****');
            
            // Mask tokens
            data = data.replace(/\b[A-Za-z0-9]{32,}\b/g, '***');
        }
        
        return data;
    }
}

module.exports = Security;