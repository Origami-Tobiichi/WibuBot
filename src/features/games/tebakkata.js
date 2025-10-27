const fs = require('fs').promises;
const path = require('path');

class TebakKata {
    constructor() {
        this.questions = [];
        this.gameSessions = new Map();
        this.questionsFile = path.join(__dirname, '../../../data/games/tebakkata.json');
        this.loadQuestions();
    }

    async loadQuestions() {
        try {
            await fs.mkdir(path.dirname(this.questionsFile), { recursive: true });
            const data = await fs.readFile(this.questionsFile, 'utf8');
            this.questions = JSON.parse(data);
        } catch (error) {
            // Initialize with default questions if file doesn't exist
            this.questions = [
                {
                    word: "KOMPUTER",
                    hint: "Alat elektronik untuk mengolah data",
                    category: "teknologi",
                    difficulty: "easy",
                    description: "Digunakan untuk bekerja dan bermain"
                },
                {
                    word: "INDONESIA",
                    hint: "Negara kepulauan di Asia Tenggara",
                    category: "geografi", 
                    difficulty: "easy",
                    description: "Negara dengan ribuan pulau"
                },
                {
                    word: "PHOTOGRAPHY",
                    hint: "Seni mengambil gambar dengan kamera",
                    category: "seni",
                    difficulty: "medium",
                    description: "Hobi yang membutuhkan kamera"
                },
                {
                    word: "BASKETBALL",
                    hint: "Olahraga dengan bola dan ring",
                    category: "olahraga",
                    difficulty: "medium",
                    description: "Olahraga tim dengan bola orange"
                },
                {
                    word: "ASTROPHYSICS",
                    hint: "Ilmu yang mempelajari benda langit",
                    category: "sains",
                    difficulty: "hard",
                    description: "Cabang ilmu astronomi"
                }
            ];
            await this.saveQuestions();
        }
    }

    async saveQuestions() {
        try {
            await fs.writeFile(this.questionsFile, JSON.stringify(this.questions, null, 2));
        } catch (error) {
            console.error('Error saving questions:', error);
        }
    }

    async startGame(jid, difficulty = 'easy') {
        const filteredQuestions = this.questions.filter(q => q.difficulty === difficulty);
        
        if (filteredQuestions.length === 0) {
            return {
                success: false,
                message: `❌ Tidak ada pertanyaan dengan difficulty ${difficulty}`
            };
        }

        const randomQuestion = filteredQuestions[Math.floor(Math.random() * filteredQuestions.length)];
        const maskedWord = this.maskWord(randomQuestion.word);

        const session = {
            question: randomQuestion,
            maskedWord: maskedWord,
            attempts: 0,
            maxAttempts: 6,
            hintsUsed: 0,
            maxHints: 3,
            score: 0,
            revealedLetters: [],
            incorrectGuesses: [],
            startedAt: Date.now(),
            lastActivity: Date.now()
        };

        this.gameSessions.set(jid, session);

        return {
            success: true,
            message: `🎯 *TEBAK KATA* 🎯\n\n` +
                    `📝 *Kata:* ${maskedWord}\n\n` +
                    `💡 *Hint:* ${randomQuestion.hint}\n` +
                    `📚 *Kategori:* ${randomQuestion.category}\n` +
                    `⚡ *Difficulty:* ${difficulty.toUpperCase()}\n` +
                    `📖 *Deskripsi:* ${randomQuestion.description}\n\n` +
                    `🎮 *Cara bermain:*\n` +
                    `• Ketik huruf untuk menebak (contoh: A)\n` +
                    `• Atau ketik seluruh kata jika sudah tahu\n` +
                    `• Gunakan !hint untuk bantuan tambahan\n` +
                    `• Gunakan !stop untuk berhenti\n\n` +
                    `⏰ *Waktu:* 5 menit\n` +
                    `❌ *Kesalahan maksimal:* ${session.maxAttempts} kali`,
            session: session
        };
    }

    maskWord(word) {
        return word.split('').map(char => 
            char === ' ' ? ' ' : '_'
        ).join(' ');
    }

    async processGuess(jid, guess) {
        const session = this.gameSessions.get(jid);
        if (!session) {
            return { success: false, message: '❌ Tidak ada game yang aktif!' };
        }

        session.lastActivity = Date.now();
        session.attempts++;

        const guessUpper = guess.toUpperCase().trim();
        const correctWord = session.question.word.toUpperCase();

        // Check if it's a full word guess
        if (guessUpper.length > 1) {
            return this.processWordGuess(session, guessUpper, jid);
        }

        // Single letter guess
        return this.processLetterGuess(session, guessUpper, jid);
    }

    processWordGuess(session, guess, jid) {
        const correctWord = session.question.word.toUpperCase();

        if (guess === correctWord) {
            session.score = this.calculateScore(session, true);
            this.gameSessions.delete(jid);

            return {
                success: true,
                correct: true,
                message: `🎉 *SELAMAT!* 🎉\n\n` +
                        `Anda berhasil menebak kata:\n` +
                        `*${correctWord}*\n\n` +
                        `📊 *Statistik:*\n` +
                        `⭐ Score: ${session.score} points\n` +
                        `🎯 Attempts: ${session.attempts}\n` +
                        `💡 Hints used: ${session.hintsUsed}\n` +
                        `⏱️ Waktu: ${this.formatTime(Date.now() - session.startedAt)}\n\n` +
                        `Main lagi dengan !tebakkata`,
                completed: true,
                score: session.score
            };
        } else {
            if (session.attempts >= session.maxAttempts) {
                return this.handleGameOver(session, jid);
            }

            const attemptsLeft = session.maxAttempts - session.attempts;
            return {
                success: true,
                correct: false,
                message: `❌ Kata "${guess}" salah!\n\n` +
                        `Kata: ${session.maskedWord}\n` +
                        `❌ Kesalahan tersisa: ${attemptsLeft}\n` +
                        `💡 Gunakan !hint jika butuh bantuan`,
                completed: false
            };
        }
    }

    processLetterGuess(session, letter, jid) {
        const correctWord = session.question.word.toUpperCase();
        
        if (!/^[A-Z]$/.test(letter)) {
            return {
                success: false,
                message: '❌ Masukkan huruf A-Z yang valid!'
            };
        }

        if (session.revealedLetters.includes(letter)) {
            return {
                success: false,
                message: `❌ Huruf "${letter}" sudah ditebak sebelumnya!`
            };
        }

        let correctGuess = false;
        let newMaskedWord = '';
        let revealedPositions = [];

        // Update the masked word
        for (let i = 0; i < correctWord.length; i++) {
            const currentChar = correctWord[i];
            if (currentChar === letter) {
                newMaskedWord += currentChar + ' ';
                correctGuess = true;
                revealedPositions.push(i + 1);
                if (!session.revealedLetters.includes(letter)) {
                    session.revealedLetters.push(letter);
                }
            } else {
                const currentDisplay = session.maskedWord.split(' ')[i];
                newMaskedWord += (currentDisplay !== '_' ? currentDisplay : '_') + ' ';
            }
        }

        session.maskedWord = newMaskedWord.trim();

        if (correctGuess) {
            // Check if word is completely revealed
            if (!session.maskedWord.includes('_')) {
                session.score = this.calculateScore(session, false);
                this.gameSessions.delete(jid);

                return {
                    success: true,
                    correct: true,
                    message: `🎊 *MENANG!* 🎊\n\n` +
                            `Kata: *${correctWord}*\n\n` +
                            `📊 *Statistik:*\n` +
                            `⭐ Score: ${session.score} points\n` +
                            `🎯 Attempts: ${session.attempts}\n` +
                            `💡 Hints used: ${session.hintsUsed}\n` +
                            `🔤 Huruf terungkap: ${session.revealedLetters.join(', ')}\n` +
                            `⏱️ Waktu: ${this.formatTime(Date.now() - session.startedAt)}\n\n` +
                            `Main lagi dengan !tebakkata`,
                    completed: true,
                    score: session.score
                };
            }

            return {
                success: true,
                correct: true,
                message: `✅ *Benar!* Huruf "${letter}" ada dalam kata.\n\n` +
                        `📝 Kata: ${session.maskedWord}\n` +
                        `📍 Posisi: ${revealedPositions.join(', ')}\n` +
                        `🔤 Huruf terungkap: ${session.revealedLetters.join(', ') || 'Belum ada'}\n` +
                        `❌ Kesalahan: ${session.incorrectGuesses.join(', ') || 'Tidak ada'}`,
                completed: false
            };
        } else {
            session.incorrectGuesses.push(letter);
            
            if (session.attempts >= session.maxAttempts) {
                return this.handleGameOver(session, jid);
            }

            const attemptsLeft = session.maxAttempts - session.attempts;
            return {
                success: true,
                correct: false,
                message: `❌ Huruf "${letter}" tidak ada dalam kata.\n\n` +
                        `📝 Kata: ${session.maskedWord}\n` +
                        `❌ Kesalahan tersisa: ${attemptsLeft}\n` +
                        `🚫 Huruf salah: ${session.incorrectGuesses.join(', ')}\n` +
                        `💡 Gunakan !hint untuk bantuan`,
                completed: false
            };
        }
    }

    handleGameOver(session, jid) {
        const correctWord = session.question.word;
        this.gameSessions.delete(jid);

        return {
            success: true,
            correct: false,
            message: `💀 *GAME OVER* 💀\n\n` +
                    `Kesalahan sudah mencapai batas maksimal!\n\n` +
                    `📖 *Kata yang benar:*\n` +
                    `*${correctWord}*\n\n` +
                    `💡 *Hint:* ${session.question.hint}\n` +
                    `📚 *Kategori:* ${session.question.category}\n` +
                    `📝 *Deskripsi:* ${session.question.description}\n\n` +
                    `📊 *Statistik:*\n` +
                    `🎯 Total attempts: ${session.attempts}\n` +
                    `💡 Hints used: ${session.hintsUsed}\n` +
                    `🔤 Huruf terungkap: ${session.revealedLetters.length}\n` +
                    `⏱️ Waktu: ${this.formatTime(Date.now() - session.startedAt)}\n\n` +
                    `Coba lagi dengan !tebakkata`,
            completed: true,
            score: session.score
        };
    }

    async provideHint(jid) {
        const session = this.gameSessions.get(jid);
        if (!session) {
            return { success: false, message: '❌ Tidak ada game yang aktif!' };
        }

        if (session.hintsUsed >= session.maxHints) {
            return { success: false, message: '❌ Tidak ada hint tersisa!' };
        }

        session.hintsUsed++;
        session.lastActivity = Date.now();

        const correctWord = session.question.word;
        const unrevealedIndices = [];

        // Find unrevealed letters
        for (let i = 0; i < correctWord.length; i++) {
            if (session.maskedWord.split(' ')[i] === '_') {
                unrevealedIndices.push(i);
            }
        }

        if (unrevealedIndices.length === 0) {
            return { success: false, message: '❌ Semua huruf sudah terungkap!' };
        }

        const randomIndex = unrevealedIndices[Math.floor(Math.random() * unrevealedIndices.length)];
        const hintLetter = correctWord[randomIndex];

        // Update masked word with hint
        let newMaskedWord = '';
        for (let i = 0; i < correctWord.length; i++) {
            if (i === randomIndex) {
                newMaskedWord += hintLetter + ' ';
                if (!session.revealedLetters.includes(hintLetter)) {
                    session.revealedLetters.push(hintLetter);
                }
            } else {
                const currentDisplay = session.maskedWord.split(' ')[i];
                newMaskedWord += (currentDisplay !== '_' ? currentDisplay : '_') + ' ';
            }
        }

        session.maskedWord = newMaskedWord.trim();

        return {
            success: true,
            message: `💡 *HINT #${session.hintsUsed}*\n\n` +
                    `Huruf di posisi ${randomIndex + 1} adalah: *${hintLetter}*\n\n` +
                    `📝 Kata: ${session.maskedWord}\n` +
                    `🎁 Hints tersisa: ${session.maxHints - session.hintsUsed}\n` +
                    `⚠️ Penggunaan hint mengurangi score akhir!`,
            session: session
        };
    }

    calculateScore(session, directGuess) {
        let baseScore = 0;
        
        // Base score based on difficulty
        switch (session.question.difficulty) {
            case 'easy': baseScore = 100; break;
            case 'medium': baseScore = 200; break;
            case 'hard': baseScore = 300; break;
        }

        // Bonus for direct word guess
        if (directGuess) {
            baseScore *= 2;
        }

        // Penalty for attempts
        const attemptPenalty = (session.attempts - 1) * 5;
        baseScore = Math.max(0, baseScore - attemptPenalty);

        // Penalty for hints used
        const hintPenalty = session.hintsUsed * 20;
        baseScore = Math.max(0, baseScore - hintPenalty);

        // Time bonus (faster = more points)
        const timeElapsed = Date.now() - session.startedAt;
        const timeBonus = Math.max(0, 50 - Math.floor(timeElapsed / 1000 / 10));
        baseScore += timeBonus;

        return Math.max(10, baseScore); // Minimum 10 points
    }

    formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}m ${secs}s`;
    }

    async stopGame(jid) {
        const session = this.gameSessions.get(jid);
        if (!session) {
            return { success: false, message: '❌ Tidak ada game yang aktif!' };
        }

        const correctWord = session.question.word;
        this.gameSessions.delete(jid);

        return {
            success: true,
            message: `🛑 *Game dihentikan*\n\n` +
                    `Kata: *${correctWord}*\n` +
                    `💡 Hint: ${session.question.hint}\n` +
                    `📊 Progress: ${this.calculateProgress(session)}%\n` +
                    `⏱️ Waktu: ${this.formatTime(Date.now() - session.startedAt)}\n\n` +
                    `Main lagi kapan-kapan! 👋`
        };
    }

    calculateProgress(session) {
        const totalLetters = new Set(session.question.word.toUpperCase()).size;
        const revealedCount = session.revealedLetters.length;
        return Math.round((revealedCount / totalLetters) * 100);
    }

    getGameStats(jid) {
        const session = this.gameSessions.get(jid);
        if (!session) {
            return { success: false, message: '❌ Tidak ada game yang aktif!' };
        }

        const progress = this.calculateProgress(session);
        const timeElapsed = Date.now() - session.startedAt;

        return {
            success: true,
            message: `📊 *STATISTIK GAME*\n\n` +
                    `📝 Kata: ${session.maskedWord}\n` +
                    `📈 Progress: ${progress}%\n` +
                    `🎯 Attempts: ${session.attempts}/${session.maxAttempts}\n` +
                    `💡 Hints: ${session.hintsUsed}/${session.maxHints}\n` +
                    `🔤 Huruf terungkap: ${session.revealedLetters.join(', ') || 'Tidak ada'}\n` +
                    `🚫 Huruf salah: ${session.incorrectGuesses.join(', ') || 'Tidak ada'}\n` +
                    `⏱️ Waktu: ${this.formatTime(timeElapsed)}\n` +
                    `⭐ Score sementara: ${session.score}`
        };
    }

    async addCustomQuestion(word, hint, category = 'umum', difficulty = 'medium', description = '') {
        const newQuestion = {
            word: word.toUpperCase(),
            hint: hint,
            category: category,
            difficulty: difficulty,
            description: description || hint
        };

        // Check if word already exists
        if (this.questions.some(q => q.word === newQuestion.word)) {
            return { success: false, message: `Kata "${word}" sudah ada!` };
        }

        this.questions.push(newQuestion);
        await this.saveQuestions();

        return { 
            success: true, 
            message: `Kata "${word}" berhasil ditambahkan!` 
        };
    }

    getAvailableDifficulties() {
        const difficulties = [...new Set(this.questions.map(q => q.difficulty))];
        return difficulties;
    }

    getAvailableCategories() {
        const categories = [...new Set(this.questions.map(q => q.category))];
        return categories;
    }

    getQuestionsByCategory(category) {
        return this.questions.filter(q => q.category === category);
    }

    getGameInfo() {
        const totalQuestions = this.questions.length;
        const difficulties = this.getAvailableDifficulties();
        const categories = this.getAvailableCategories();

        return {
            totalQuestions,
            difficulties: difficulties.reduce((acc, diff) => {
                acc[diff] = this.questions.filter(q => q.difficulty === diff).length;
                return acc;
            }, {}),
            categories: categories.reduce((acc, cat) => {
                acc[cat] = this.questions.filter(q => q.category === cat).length;
                return acc;
            }, {})
        };
    }

    cleanupInactiveGames(maxInactiveTime = 10 * 60 * 1000) { // 10 minutes
        const now = Date.now();
        let cleanedCount = 0;

        for (const [jid, session] of this.gameSessions.entries()) {
            if (now - session.lastActivity > maxInactiveTime) {
                this.gameSessions.delete(jid);
                cleanedCount++;
            }
        }

        return cleanedCount;
    }
}

module.exports = TebakKata;
