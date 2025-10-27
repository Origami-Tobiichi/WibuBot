const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const path = require('path');

class SessionModel {
    constructor() {
        this.dbPath = path.join(process.cwd(), 'data', 'sessions.json');
        this.init();
    }

    async init() {
        const adapter = new JSONFile(this.dbPath);
        this.db = new Low(adapter, { 
            sessions: [],
            activeSessions: 0,
            totalConnections: 0
        });
        await this.db.read();
    }

    async createSession(sessionData) {
        await this.db.read();
        
        const session = {
            id: `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            jid: sessionData.jid,
            device: sessionData.device || 'unknown',
            platform: sessionData.platform || 'whatsapp',
            connectedAt: new Date().toISOString(),
            lastActivity: new Date().toISOString(),
            status: 'active',
            ip: sessionData.ip || 'unknown',
            userAgent: sessionData.userAgent || 'unknown',
            ...sessionData
        };

        this.db.data.sessions.push(session);
        this.db.data.activeSessions = this.db.data.sessions.filter(s => s.status === 'active').length;
        this.db.data.totalConnections += 1;
        
        await this.db.write();
        return session;
    }

    async updateActivity(sessionId) {
        await this.db.read();
        const session = this.db.data.sessions.find(s => s.id === sessionId);
        if (session) {
            session.lastActivity = new Date().toISOString();
            await this.db.write();
        }
    }

    async endSession(sessionId) {
        await this.db.read();
        const session = this.db.data.sessions.find(s => s.id === sessionId);
        if (session) {
            session.status = 'ended';
            session.endedAt = new Date().toISOString();
            session.duration = new Date() - new Date(session.connectedAt);
            
            this.db.data.activeSessions = this.db.data.sessions.filter(s => s.status === 'active').length;
            await this.db.write();
        }
    }

    async getActiveSessions() {
        await this.db.read();
        return this.db.data.sessions.filter(session => session.status === 'active');
    }

    async getUserSessions(userJid) {
        await this.db.read();
        return this.db.data.sessions.filter(session => session.jid === userJid);
    }

    async getSessionStats() {
        await this.db.read();
        const activeSessions = this.db.data.sessions.filter(s => s.status === 'active');
        const today = new Date().toDateString();
        const todaySessions = this.db.data.sessions.filter(s => 
            new Date(s.connectedAt).toDateString() === today
        );

        return {
            activeSessions: activeSessions.length,
            totalConnections: this.db.data.totalConnections,
            todayConnections: todaySessions.length,
            averageDuration: this.calculateAverageDuration()
        };
    }

    calculateAverageDuration() {
        const endedSessions = this.db.data.sessions.filter(s => s.duration);
        if (endedSessions.length === 0) return 0;
        
        const totalDuration = endedSessions.reduce((sum, session) => sum + session.duration, 0);
        return totalDuration / endedSessions.length;
    }

    async cleanupExpiredSessions(maxAgeHours = 24) {
        await this.db.read();
        const cutoff = new Date();
        cutoff.setHours(cutoff.getHours() - maxAgeHours);

        const expiredSessions = this.db.data.sessions.filter(s => 
            new Date(s.lastActivity) < cutoff && s.status === 'active'
        );

        for (const session of expiredSessions) {
            session.status = 'expired';
            session.endedAt = new Date().toISOString();
        }

        this.db.data.activeSessions = this.db.data.sessions.filter(s => s.status === 'active').length;
        await this.db.write();

        return expiredSessions.length;
    }
}

module.exports = SessionModel;