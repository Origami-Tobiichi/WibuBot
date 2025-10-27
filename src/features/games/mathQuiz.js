class MathQuiz {
    constructor() {
        this.operations = ['+', '-', '*', '/'];
        this.difficultySettings = {
            easy: { range: [1, 10], operations: ['+', '-'], timeLimit: 60000 },
            medium: { range: [1, 50], operations: ['+', '-', '*'], timeLimit: 45000 },
            hard: { range: [1, 100], operations: ['+', '-', '*', '/'], timeLimit: 30000 }
        };
        this.gameSessions = new Map();
    }

    generateQuestion(difficulty = 'easy') {
        const settings = this.difficultySettings[difficulty] || this.difficultySettings.easy;
        const operation = settings.operations[Math.floor(Math.random() * settings.operations.length)];
        
        let num1, num2, answer;

        switch (operation) {
            case '+':
                num1 = this.getRandomNumber(settings.range[0], settings.range[1]);
                num2 = this.getRandomNumber(settings.range[0], settings.range[1]);
                answer = num1 + num2;
                break;

            case '-':
                num1 = this.getRandomNumber(settings.range[0], settings.range[1]);
                num2 = this.getRandomNumber(settings.range[0], num1); // Ensure positive result
                answer = num1 - num2;
                break;

            case '*':
                num1 = this.getRandomNumber(1, 12); // Multiplication table range
                num2 = this.getRandomNumber(1, Math.floor(settings.range[1] / 2));
                answer = num1 * num2;
                break;

            case '/':
                answer = this.getRandomNumber(2, 10);
                num2 = this.getRandomNumber(2, 10);
                num1 = answer * num2; // Ensure integer division
                break;
        }

        return {
            question: `${num1} ${operation} ${num2}`,
            answer: answer,
            operation: operation,
            difficulty: difficulty,
            options: this.generateOptions(answer, difficulty)
        };
    }

    getRandomNumber(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    generateOptions(correctAnswer, difficulty) {
        const options = [correctAnswer];
        const range = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 10 : 20;

        while (options.length < 4) {
            const randomOffset = this.getRandomNumber(-range, range);
            const option = correctAnswer + randomOffset;

            // Ensure unique options and positive numbers for easy/medium
            if (!options.includes(option) && (difficulty === 'easy' || difficulty === 'medium' ? option > 0 : true)) {
                options.push(option);
            }
        }

        // Shuffle options
        return this.shuffleArray(options);
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    async startGame(jid, difficulty = 'easy') {
        const question = this.generateQuestion(difficulty);
        const settings = this.difficultySettings[difficulty] || this.difficultySettings.easy;

        const session = {
            currentQuestion: question,
            score: 0,
            correctAnswers: 0,
            totalQuestions: 0,
            streak: 0,
            maxStreak: 0,
            startTime: Date.now(),
            timeLimit: settings.timeLimit,
            difficulty: difficulty,
            questionsAnswered: [],
            lastActivity: Date.now()
        };

        this.gameSessions.set(jid, session);

        const message = this.createQuestionMessage(question, session, difficulty);

        // Set timeout for auto game end
        setTimeout(() => {
            if (this.gameSessions.has(jid)) {
                this.endGameDueToTimeout(jid);
            }
        }, settings.timeLimit);

        return {
            success: true,
            message: message,
            session: session
        };
    }

    createQuestionMessage(question, session, difficulty) {
        let message = `🧮 *MATH QUIZ* 🧮\n\n`;
        message += `Soal: *${question.question}* = ?\n\n`;
        message += `📊 Difficulty: ${difficulty.toUpperCase()}\n`;
        message += `⏰ Time Limit: ${session.timeLimit / 1000} seconds\n`;
        message += `⭐ Score: ${session.score}\n`;
        message += `🔥 Streak: ${session.streak}\n\n`;
        message += `📝 *Pilihan Jawaban:*\n`;

        question.options.forEach((option, index) => {
            message += `${index + 1}. ${option}\n`;
        });

        message += `\n🎮 *Cara jawab:*\n`;
        message += `Ketik angka pilihan (1-4) atau jawaban langsung\n`;
        message += `Contoh: "1" atau "${question.answer}"\n\n`;
        message += `💡 *Tips:* Jawab cepat dapat bonus point!`;

        return message;
    }

    async processAnswer(jid, userAnswer) {
        const session = this.gameSessions.get(jid);
        if (!session) {
            return { success: false, message: '❌ Tidak ada game yang aktif!' };
        }

        session.lastActivity = Date.now();
        session.totalQuestions++;

        const question = session.currentQuestion;
        let isCorrect = false;
        let userAnswerValue;

        // Parse user answer
        if (/^[1-4]$/.test(userAnswer)) {
            // User selected option 1-4
            const optionIndex = parseInt(userAnswer) - 1;
            userAnswerValue = question.options[optionIndex];
            isCorrect = userAnswerValue === question.answer;
        } else {
            // User typed the answer directly
            userAnswerValue = parseInt(userAnswer);
            isCorrect = !isNaN(userAnswerValue) && userAnswerValue === question.answer;
        }

        // Calculate time bonus
        const timeElapsed = Date.now() - session.startTime;
        const timeBonus = this.calculateTimeBonus(timeElapsed, session.timeLimit);

        if (isCorrect) {
            session.correctAnswers++;
            session.streak++;
            session.maxStreak = Math.max(session.maxStreak, session.streak);

            const baseScore = this.calculateBaseScore(session.difficulty);
            const streakBonus = session.streak * 5;
            const totalScore = baseScore + timeBonus + streakBonus;
            session.score += totalScore;

            // Record the question
            session.questionsAnswered.push({
                question: question.question,
                userAnswer: userAnswerValue,
                correct: true,
                time: timeElapsed,
                score: totalScore
            });

            // Generate next question
            const nextQuestion = this.generateQuestion(session.difficulty);
            session.currentQuestion = nextQuestion;
            session.startTime = Date.now();

            const response = {
                success: true,
                correct: true,
                message: this.createCorrectAnswerMessage(question, userAnswerValue, totalScore, session, timeBonus),
                score: totalScore,
                session: session
            };

            // Reset timeout for next question
            setTimeout(() => {
                if (this.gameSessions.has(jid)) {
                    this.endGameDueToTimeout(jid);
                }
            }, session.timeLimit);

            return response;

        } else {
            session.streak = 0;

            session.questionsAnswered.push({
                question: question.question,
                userAnswer: userAnswerValue,
                correct: false,
                time: timeElapsed,
                score: 0
            });

            // Continue with same question for retry
            const attempts = session.questionsAnswered.filter(q => 
                q.question === question.question && !q.correct
            ).length;

            if (attempts >= 2) {
                // Too many wrong attempts, show answer and move to next question
                const nextQuestion = this.generateQuestion(session.difficulty);
                session.currentQuestion = nextQuestion;
                session.startTime = Date.now();

                return {
                    success: true,
                    correct: false,
                    message: this.createWrongAnswerMessage(question, userAnswerValue, true, session),
                    session: session
                };
            } else {
                return {
                    success: true,
                    correct: false,
                    message: this.createWrongAnswerMessage(question, userAnswerValue, false, session),
                    session: session
                };
            }
        }
    }

    calculateTimeBonus(timeElapsed, timeLimit) {
        const timeLeft = timeLimit - timeElapsed;
        const maxBonus = 50;
        return Math.max(0, Math.floor((timeLeft / timeLimit) * maxBonus));
    }

    calculateBaseScore(difficulty) {
        switch (difficulty) {
            case 'easy': return 50;
            case 'medium': return 100;
            case 'hard': return 200;
            default: return 50;
        }
    }

    createCorrectAnswerMessage(question, userAnswer, totalScore, session, timeBonus) {
        let message = `🎉 *BENAR!* 🎉\n\n`;
        message += `Soal: ${question.question} = ${question.answer}\n`;
        message += `Jawaban Anda: ${userAnswer}\n\n`;
        message += `💰 *Penghasilan Score:*\n`;
        message += `• Base: ${this.calculateBaseScore(session.difficulty)} points\n`;
        message += `• Time Bonus: +${timeBonus} points\n`;
        message += `• Streak Bonus: +${session.streak * 5} points\n`;
        message += `• Total: +${totalScore} points\n\n`;
        message += `📊 *Statistik:*\n`;
        message += `⭐ Total Score: ${session.score}\n`;
        message += `✅ Correct: ${session.correctAnswers}/${session.totalQuestions}\n`;
        message += `🔥 Streak: ${session.streak}\n`;
        message += `🏆 Max Streak: ${session.maxStreak}\n\n`;
        message += `➡️ *Soal selanjutnya...*`;

        return message;
    }

    createWrongAnswerMessage(question, userAnswer, showAnswer, session) {
        let message = `❌ *SALAH!* ❌\n\n`;
        message += `Jawaban Anda: ${userAnswer}\n`;

        if (showAnswer) {
            message += `Jawaban yang benar: *${question.answer}*\n\n`;
            message += `🔥 Streak reset ke 0!\n\n`;
            message += `➡️ *Soal selanjutnya...*`;
        } else {
            message += `Coba lagi! Masih ada kesempatan.\n\n`;
            message += `Soal: ${question.question} = ?`;
        }

        return message;
    }

    async endGame(jid) {
        const session = this.gameSessions.get(jid);
        if (!session) {
            return { success: false, message: '❌ Tidak ada game yang aktif!' };
        }

        this.gameSessions.delete(jid);
        return this.createGameSummary(session);
    }

    endGameDueToTimeout(jid) {
        const session = this.gameSessions.get(jid);
        if (session) {
            this.gameSessions.delete(jid);
            
            // Send timeout message (this would be handled by the main bot)
            const summary = this.createGameSummary(session, true);
            return summary;
        }
    }

    createGameSummary(session, timeout = false) {
        const accuracy = session.totalQuestions > 0 ? 
            (session.correctAnswers / session.totalQuestions) * 100 : 0;
        
        const totalTime = Date.now() - session.startTime;

        let message = `🏁 *GAME BERAKHIR* 🏁\n\n`;

        if (timeout) {
            message += `⏰ *Waktu habis!*\n\n`;
        }

        message += `📊 *HASIL AKHIR:*\n`;
        message += `⭐ Total Score: ${session.score}\n`;
        message += `✅ Correct Answers: ${session.correctAnswers}/${session.totalQuestions}\n`;
        message += `🎯 Accuracy: ${accuracy.toFixed(1)}%\n`;
        message += `🔥 Max Streak: ${session.maxStreak}\n`;
        message += `⏱️ Total Time: ${this.formatTime(totalTime)}\n`;
        message += `📈 Difficulty: ${session.difficulty.toUpperCase()}\n\n`;

        if (accuracy >= 80) {
            message += `🎊 *PERFORMANCE LUAR BIASA!* 🎊\n`;
        } else if (accuracy >= 60) {
            message += `👍 *Bagus! Terus berlatih!* 👍\n`;
        } else {
            message += `💪 *Jangan menyerah, terus berlatih!* 💪\n`;
        }

        message += `\n🎮 Main lagi dengan !mathquiz`;

        return {
            success: true,
            message: message,
            finalScore: session.score,
            stats: {
                correctAnswers: session.correctAnswers,
                totalQuestions: session.totalQuestions,
                accuracy: accuracy,
                maxStreak: session.maxStreak,
                totalTime: totalTime
            }
        };
    }

    formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}m ${secs}s`;
    }

    async skipQuestion(jid) {
        const session = this.gameSessions.get(jid);
        if (!session) {
            return { success: false, message: '❌ Tidak ada game yang aktif!' };
        }

        session.questionsAnswered.push({
            question: session.currentQuestion.question,
            userAnswer: 'skipped',
            correct: false,
            time: Date.now() - session.startTime,
            score: 0
        });

        const nextQuestion = this.generateQuestion(session.difficulty);
        session.currentQuestion = nextQuestion;
        session.startTime = Date.now();

        return {
            success: true,
            message: `⏭️ *Soal dilewati!*\n\n` +
                    `Soal: ${session.currentQuestion.question} = ?\n\n` +
                    `Silakan jawab soal baru di atas!`,
            session: session
        };
    }

    getGameStats(jid) {
        const session = this.gameSessions.get(jid);
        if (!session) {
            return { success: false, message: '❌ Tidak ada game yang aktif!' };
        }

        const currentQuestion = session.currentQuestion;
        const timeElapsed = Date.now() - session.startTime;
        const timeLeft = Math.max(0, session.timeLimit - timeElapsed);

        return {
            success: true,
            message: `📊 *STATISTIK GAME* 📊\n\n` +
                    `⭐ Score: ${session.score}\n` +
                    `✅ Correct: ${session.correctAnswers}/${session.totalQuestions}\n` +
                    `🔥 Streak: ${session.streak}\n` +
                    `🏆 Max Streak: ${session.maxStreak}\n` +
                    `⏱️ Time Left: ${Math.ceil(timeLeft / 1000)}s\n` +
                    `📈 Difficulty: ${session.difficulty.toUpperCase()}\n\n` +
                    `Soal saat ini: ${currentQuestion.question} = ?`,
            session: session
        };
    }

    changeDifficulty(jid, newDifficulty) {
        const session = this.gameSessions.get(jid);
        if (!session) {
            return { success: false, message: '❌ Tidak ada game yang aktif!' };
        }

        if (!this.difficultySettings[newDifficulty]) {
            return { 
                success: false, 
                message: `❌ Difficulty tidak valid! Pilihan: ${Object.keys(this.difficultySettings).join(', ')}` 
            };
        }

        session.difficulty = newDifficulty;
        session.timeLimit = this.difficultySettings[newDifficulty].timeLimit;

        return {
            success: true,
            message: `✅ Difficulty diubah menjadi: ${newDifficulty.toUpperCase()}`,
            session: session
        };
    }

    cleanupInactiveGames(maxInactiveTime = 5 * 60 * 1000) { // 5 minutes
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

    getLeaderboard() {
        // This would typically fetch from database
        // For now, return mock data
        return [
            { username: 'Player1', score: 1500, difficulty: 'hard' },
            { username: 'Player2', score: 1200, difficulty: 'medium' },
            { username: 'Player3', score: 900, difficulty: 'easy' }
        ];
    }
}

module.exports = MathQuiz;