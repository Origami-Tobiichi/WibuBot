const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class TebakGambar {
    constructor() {
        this.questions = [];
        this.loadQuestions();
    }

    async loadQuestions() {
        try {
            const questionsPath = path.join('./data/games', 'tebakgambar.json');
            const data = await fs.readFile(questionsPath, 'utf8');
            this.questions = JSON.parse(data);
        } catch (error) {
            // Default questions if file doesn't exist
            this.questions = [
                {
                    image: 'https://example.com/image1.jpg',
                    answer: 'gunung',
                    clue: 'Tempat tinggi dengan puncak',
                    difficulty: 'easy'
                },
                {
                    image: 'https://example.com/image2.jpg',
                    answer: 'laut',
                    clue: 'Kumpulan air asin yang luas',
                    difficulty: 'easy'
                }
            ];
        }
    }

    async startGame(difficulty = 'easy') {
        const filteredQuestions = this.questions.filter(q => q.difficulty === difficulty);
        const randomQuestion = filteredQuestions[Math.floor(Math.random() * filteredQuestions.length)];

        const session = {
            question: randomQuestion,
            attempts: 0,
            maxAttempts: 3,
            score: 0,
            startedAt: Date.now()
        };

        return {
            question: `🎨 *TEBAK GAMBAR* 🎨\n\n` +
                     `🖼️ Gambar: ${randomQuestion.clue}\n\n` +
                     `💡 Clue: ${randomQuestion.clue}\n` +
                     `📝 Tebak apa yang ada di gambar!\n\n` +
                     `⏰ Jawab dalam 3 menit!`,
            image: randomQuestion.image,
            session: session
        };
    }

    async checkAnswer(session, userAnswer) {
        session.attempts++;
        const correctAnswer = session.question.answer.toLowerCase();
        const userAnswerClean = userAnswer.toLowerCase().trim();

        if (userAnswerClean === correctAnswer) {
            session.score += 100 - (session.attempts * 20);
            
            return {
                correct: true,
                message: `🎉 *BENAR!* 🎉\n\n` +
                        `Jawaban: *${correctAnswer}*\n` +
                        `Score: +${session.score} points\n` +
                        `Attempts: ${session.attempts}`,
                score: session.score,
                completed: true,
                session: session
            };
        } else {
            if (session.attempts >= session.maxAttempts) {
                return {
                    correct: false,
                    message: `❌ *GAME OVER* ❌\n\n` +
                            `Jawaban yang benar: *${correctAnswer}*\n` +
                            `Score akhir: ${session.score} points\n\n` +
                            `Coba lagi dengan !tebakgambar`,
                    score: session.score,
                    completed: true,
                    session: session
                };
            } else {
                const attemptsLeft = session.maxAttempts - session.attempts;
                return {
                    correct: false,
                    message: `❌ Salah! Coba lagi.\n` +
                            `Attempts left: ${attemptsLeft}\n` +
                            `💡 Clue: ${session.question.clue}`,
                    score: session.score,
                    completed: false,
                    session: session
                };
            }
        }
    }
}

module.exports = TebakGambar;