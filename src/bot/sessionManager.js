const fs = require('fs').promises;
const path = require('path');
const { Boom } = require('@hapi/boom');

class SessionManager {
    constructor() {
        this.sessionsDir = './data/sessions';
        this.ensureSessionsDir();
    }

    async ensureSessionsDir() {
        try {
            await fs.mkdir(this.sessionsDir, { recursive: true });
        } catch (error) {
            console.error('Error creating sessions directory:', error);
        }
    }

    async saveSession(sessionId, sessionData) {
        try {
            const sessionFile = path.join(this.sessionsDir, `${sessionId}.json`);
            await fs.writeFile(sessionFile, JSON.stringify(sessionData, null, 2));
            return true;
        } catch (error) {
            console.error('Error saving session:', error);
            return false;
        }
    }

    async loadSession(sessionId) {
        try {
            const sessionFile = path.join(this.sessionsDir, `${sessionId}.json`);
            const data = await fs.readFile(sessionFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            return null;
        }
    }

    async deleteSession(sessionId) {
        try {
            const sessionFile = path.join(this.sessionsDir, `${sessionId}.json`);
            await fs.unlink(sessionFile);
            return true;
        } catch (error) {
            console.error('Error deleting session:', error);
            return false;
        }
    }

    async getAllSessions() {
        try {
            const files = await fs.readdir(this.sessionsDir);
            const sessions = [];
            
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const sessionData = await this.loadSession(file.replace('.json', ''));
                    if (sessionData) {
                        sessions.push({
                            id: file.replace('.json', ''),
                            ...sessionData
                        });
                    }
                }
            }
            
            return sessions;
        } catch (error) {
            return [];
        }
    }

    async cleanupExpiredSessions() {
        try {
            const sessions = await this.getAllSessions();
            const now = Date.now();
            let deletedCount = 0;

            for (const session of sessions) {
                // Check if session is older than 7 days
                if (session.timestamp && (now - session.timestamp) > (7 * 24 * 60 * 60 * 1000)) {
                    await this.deleteSession(session.id);
                    deletedCount++;
                }
            }

            return deletedCount;
        } catch (error) {
            console.error('Error cleaning up sessions:', error);
            return 0;
        }
    }

    async getSessionStats() {
        const sessions = await this.getAllSessions();
        const activeSessions = sessions.filter(s => s.creds && s.creds.me);
        
        return {
            total: sessions.length,
            active: activeSessions.length,
            devices: activeSessions.map(s => s.creds.me.id)
        };
    }

    async migrateSession(oldSessionId, newSessionId) {
        try {
            const sessionData = await this.loadSession(oldSessionId);
            if (sessionData) {
                await this.saveSession(newSessionId, sessionData);
                await this.deleteSession(oldSessionId);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error migrating session:', error);
            return false;
        }
    }

    async backupSessions(backupPath = './data/backups/sessions') {
        try {
            await fs.mkdir(backupPath, { recursive: true });
            const sessions = await this.getAllSessions();
            const backupFile = path.join(backupPath, `sessions_backup_${Date.now()}.json`);
            
            await fs.writeFile(backupFile, JSON.stringify(sessions, null, 2));
            return backupFile;
        } catch (error) {
            console.error('Error backing up sessions:', error);
            return null;
        }
    }
}

module.exports = SessionManager;