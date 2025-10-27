const fs = require('fs').promises;
const path = require('path');
const { createWriteStream } = require('fs');

class Logger {
    constructor() {
        this.logsDir = path.join(process.cwd(), 'data', 'logs');
        this.levels = {
            ERROR: 0,
            WARN: 1,
            INFO: 2,
            DEBUG: 3
        };
        this.currentLevel = process.env.LOG_LEVEL || 'INFO';
        this.ensureLogsDir();
        this.setupLogStream();
    }

    async ensureLogsDir() {
        try {
            await fs.mkdir(this.logsDir, { recursive: true });
        } catch (error) {
            console.error('Error creating logs directory:', error);
        }
    }

    setupLogStream() {
        const logFile = path.join(this.logsDir, `bot_${new Date().toISOString().split('T')[0]}.log`);
        this.logStream = createWriteStream(logFile, { flags: 'a' });
    }

    shouldLog(level) {
        return this.levels[level] <= this.levels[this.currentLevel];
    }

    formatMessage(level, message, context = {}) {
        const timestamp = new Date().toISOString();
        const contextStr = Object.keys(context).length ? ` ${JSON.stringify(context)}` : '';
        
        return `[${timestamp}] [${level}] ${message}${contextStr}\n`;
    }

    async writeToFile(message) {
        if (this.logStream) {
            this.logStream.write(message);
        }
    }

    async log(level, message, context = {}) {
        if (!this.shouldLog(level)) return;

        const formattedMessage = this.formatMessage(level, message, context);
        
        // Console output with colors
        this.consoleOutput(level, formattedMessage);
        
        // File output
        await this.writeToFile(formattedMessage);
        
        // Additional processing for errors
        if (level === 'ERROR') {
            await this.handleError(message, context);
        }
    }

    consoleOutput(level, message) {
        const colors = {
            ERROR: '\x1b[31m', // Red
            WARN: '\x1b[33m',  // Yellow
            INFO: '\x1b[36m',  // Cyan
            DEBUG: '\x1b[35m'  // Magenta
        };
        
        const reset = '\x1b[0m';
        console.log(`${colors[level] || ''}${message}${reset}`);
    }

    async handleError(message, context) {
        // Send error notifications or perform additional error handling
        const errorLog = {
            message: message,
            context: context,
            timestamp: new Date().toISOString(),
            stack: context.error?.stack
        };

        // Save error to separate error log
        const errorLogPath = path.join(this.logsDir, 'errors.json');
        try {
            let errors = [];
            try {
                const existingData = await fs.readFile(errorLogPath, 'utf8');
                errors = JSON.parse(existingData);
            } catch {
                // File doesn't exist or is invalid, start fresh
            }

            errors.push(errorLog);
            await fs.writeFile(errorLogPath, JSON.stringify(errors, null, 2));
        } catch (error) {
            console.error('Error writing to error log:', error);
        }
    }

    // Convenience methods
    async error(message, context = {}) {
        await this.log('ERROR', message, context);
    }

    async warn(message, context = {}) {
        await this.log('WARN', message, context);
    }

    async info(message, context = {}) {
        await this.log('INFO', message, context);
    }

    async debug(message, context = {}) {
        await this.log('DEBUG', message, context);
    }

    // Specialized logging methods
    async userAction(userJid, action, details = {}) {
        await this.info(`User Action: ${action}`, {
            user: userJid,
            action: action,
            ...details
        });
    }

    async botEvent(event, details = {}) {
        await this.debug(`Bot Event: ${event}`, details);
    }

    async commandExecuted(userJid, command, result) {
        await this.info(`Command Executed: ${command}`, {
            user: userJid,
            command: command,
            success: result.success,
            result: result.message
        });
    }

    async mediaDownload(type, url, result) {
        await this.info(`Media Download: ${type}`, {
            url: url,
            success: result.success,
            fileSize: result.filesize,
            duration: result.duration
        });
    }

    async gamePlayed(userJid, gameType, score) {
        await this.info(`Game Played: ${gameType}`, {
            user: userJid,
            game: gameType,
            score: score
        });
    }

    // Log analysis and management
    async getLogStats(date = null) {
        try {
            const targetDate = date ? new Date(date) : new Date();
            const dateStr = targetDate.toISOString().split('T')[0];
            const logFile = path.join(this.logsDir, `bot_${dateStr}.log`);

            if (!await this.fileExists(logFile)) {
                return {
                    date: dateStr,
                    total: 0,
                    byLevel: {},
                    errors: 0
                };
            }

            const logContent = await fs.readFile(logFile, 'utf8');
            const lines = logContent.split('\n').filter(line => line.trim());

            const stats = {
                date: dateStr,
                total: lines.length,
                byLevel: {},
                errors: 0
            };

            lines.forEach(line => {
                const levelMatch = line.match(/\[(ERROR|WARN|INFO|DEBUG)\]/);
                if (levelMatch) {
                    const level = levelMatch[1];
                    stats.byLevel[level] = (stats.byLevel[level] || 0) + 1;
                    
                    if (level === 'ERROR') {
                        stats.errors++;
                    }
                }
            });

            return stats;

        } catch (error) {
            console.error('Error getting log stats:', error);
            return null;
        }
    }

    async searchLogs(query, options = {}) {
        try {
            const results = [];
            const files = await fs.readdir(this.logsDir);
            const logFiles = files.filter(file => file.startsWith('bot_') && file.endsWith('.log'));

            for (const file of logFiles) {
                const filePath = path.join(this.logsDir, file);
                const content = await fs.readFile(filePath, 'utf8');
                const lines = content.split('\n');

                lines.forEach((line, index) => {
                    if (line.toLowerCase().includes(query.toLowerCase())) {
                        results.push({
                            file: file,
                            line: index + 1,
                            content: line,
                            timestamp: line.match(/\[(.*?)\]/)?.[1] || 'unknown'
                        });

                        // Limit results if specified
                        if (options.maxResults && results.length >= options.maxResults) {
                            return;
                        }
                    }
                });

                if (options.maxResults && results.length >= options.maxResults) {
                    break;
                }
            }

            return results;

        } catch (error) {
            console.error('Error searching logs:', error);
            return [];
        }
    }

    async cleanupOldLogs(maxAgeDays = 30) {
        try {
            const files = await fs.readdir(this.logsDir);
            const now = Date.now();
            let deletedCount = 0;

            for (const file of files) {
                if (file.startsWith('bot_') && file.endsWith('.log')) {
                    const filePath = path.join(this.logsDir, file);
                    const stats = await fs.stat(filePath);
                    const fileAge = (now - stats.mtimeMs) / (1000 * 60 * 60 * 24);

                    if (fileAge > maxAgeDays) {
                        await fs.unlink(filePath);
                        deletedCount++;
                    }
                }
            }

            return deletedCount;

        } catch (error) {
            console.error('Error cleaning up old logs:', error);
            return 0;
        }
    }

    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    setLogLevel(level) {
        if (this.levels.hasOwnProperty(level)) {
            this.currentLevel = level;
            this.info(`Log level changed to: ${level}`);
            return true;
        }
        return false;
    }

    getLogLevel() {
        return this.currentLevel;
    }

    async exportLogs(startDate, endDate, outputPath) {
        try {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const exportedLogs = [];

            const files = await fs.readdir(this.logsDir);
            const logFiles = files.filter(file => file.startsWith('bot_') && file.endsWith('.log'));

            for (const file of logFiles) {
                const fileDateStr = file.replace('bot_', '').replace('.log', '');
                const fileDate = new Date(fileDateStr);

                if (fileDate >= start && fileDate <= end) {
                    const filePath = path.join(this.logsDir, file);
                    const content = await fs.readFile(filePath, 'utf8');
                    exportedLogs.push({
                        file: file,
                        content: content
                    });
                }
            }

            const exportData = {
                exportRange: { start: startDate, end: endDate },
                exportedAt: new Date().toISOString(),
                logs: exportedLogs
            };

            await fs.writeFile(outputPath, JSON.stringify(exportData, null, 2));
            return { success: true, exportedFiles: exportedLogs.length };

        } catch (error) {
            console.error('Error exporting logs:', error);
            return { success: false, error: error.message };
        }
    }

    getLoggerStats() {
        return {
            currentLevel: this.currentLevel,
            logsDirectory: this.logsDir,
            availableLevels: Object.keys(this.levels),
            levelsMap: this.levels
        };
    }
}

module.exports = Logger;