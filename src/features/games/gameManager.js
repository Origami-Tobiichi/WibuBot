const TebakGambar = require('./tebakGambar');
const MathQuiz = require('./mathQuiz');
const TebakKata = require('./tebakkata');
const SlotMachine = require('./slotMachine');
const RPGGame = require('./rpgGame');

class GameManager {
    constructor() {
        this.activeGames = new Map();
        this.gameInstances = {
            tebakgambar: new TebakGambar(),
            mathquiz: new MathQuiz(),
            tebakkata: new TebakKata(),
            slot: new SlotMachine(),
            rpg: new RPGGame()
        };
    }

    async handleGameCommand(jid, gameType, difficulty = 'easy') {
        try {
            const game = this.gameInstances[gameType];
            if (!game) {
                return {
                    success: false,
                    message: `Game ${gameType} tidak tersedia.`
                };
            }

            // Start new game
            const gameSession = await game.startGame(difficulty);
            this.activeGames.set(`${jid}_${gameType}`, {
                session: gameSession,
                startedAt: Date.now(),
                type: gameType
            });

            return {
                success: true,
                message: gameSession.question,
                sessionId: `${jid}_${gameType}`,
                gameType: gameType
            };

        } catch (error) {
            console.error('Game error:', error);
            return {
                success: false,
                message: 'Terjadi error saat memulai game.'
            };
        }
    }

    async handleGameAnswer(jid, gameType, answer) {
        try {
            const gameKey = `${jid}_${gameType}`;
            const gameSession = this.activeGames.get(gameKey);
            
            if (!gameSession) {
                return {
                    success: false,
                    message: 'Tidak ada game yang aktif. Mulai game baru dengan !game'
                };
            }

            const game = this.gameInstances[gameType];
            const result = await game.checkAnswer(gameSession.session, answer);

            if (result.completed) {
                this.activeGames.delete(gameKey);
            } else {
                // Update session
                gameSession.session = result.session;
                this.activeGames.set(gameKey, gameSession);
            }

            return {
                success: true,
                correct: result.correct,
                message: result.message,
                score: result.score,
                completed: result.completed
            };

        } catch (error) {
            console.error('Game answer error:', error);
            return {
                success: false,
                message: 'Error memproses jawaban.'
            };
        }
    }

    async getGameList() {
        const games = [
            {
                id: 'tebakgambar',
                name: 'Tebak Gambar',
                description: 'Tebak gambar yang diberikan',
                difficulty: ['easy', 'medium', 'hard'],
                command: '!tebakgambar'
            },
            {
                id: 'mathquiz',
                name: 'Math Quiz',
                description: 'Kuis matematika seru',
                difficulty: ['easy', 'medium', 'hard'],
                command: '!mathquiz'
            },
            {
                id: 'tebakkata',
                name: 'Tebak Kata',
                description: 'Tebak kata dengan clue',
                difficulty: ['easy', 'medium', 'hard'],
                command: '!tebakkata'
            },
            {
                id: 'slot',
                name: 'Slot Machine',
                description: 'Bermain mesin slot',
                difficulty: ['normal'],
                command: '!slot'
            },
            {
                id: 'rpg',
                name: 'RPG Adventure',
                description: 'Petualangan RPG seru',
                difficulty: ['beginner', 'intermediate', 'expert'],
                command: '!rpg'
            }
        ];

        return games;
    }

    getActiveGame(jid) {
        for (const [key, session] of this.activeGames.entries()) {
            if (key.startsWith(jid)) {
                return {
                    gameType: session.type,
                    session: session.session,
                    duration: Date.now() - session.startedAt
                };
            }
        }
        return null;
    }

    cleanupExpiredGames() {
        const now = Date.now();
        const expiryTime = 30 * 60 * 1000; // 30 minutes
        
        for (const [key, session] of this.activeGames.entries()) {
            if (now - session.startedAt > expiryTime) {
                this.activeGames.delete(key);
            }
        }
    }
}

module.exports = GameManager;
