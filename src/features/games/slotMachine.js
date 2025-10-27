class SlotMachine {
    constructor() {
        this.symbols = ['🍒', '🍋', '🍊', '🍇', '🍉', '💎', '7️⃣', '🔔'];
        this.payouts = {
            '💎💎💎': 1000,
            '7️⃣7️⃣7️⃣': 500,
            '🔔🔔🔔': 200,
            '🍇🍇🍇': 100,
            '🍉🍉🍉': 80,
            '🍊🍊🍊': 60,
            '🍋🍋🍋': 40,
            '🍒🍒🍒': 20,
            '🍒🍒': 5,
            '🍒': 2
        };
        this.jackpot = 10000;
        this.jackpotChance = 0.001; // 0.1% chance
    }

    async startGame(betAmount = 10) {
        const session = {
            balance: 1000, // Starting balance
            betAmount: betAmount,
            spins: 0,
            totalWon: 0,
            totalBet: 0,
            startedAt: Date.now(),
            lastSpin: null
        };

        return {
            question: `🎰 *SLOT MACHINE* 🎰\n\n` +
                     `💰 Balance: ${session.balance} coins\n` +
                     `🎯 Bet Amount: ${session.betAmount} coins\n\n` +
                     `🎮 Cara bermain:\n` +
                     `• Ketik !spin untuk memutar\n` +
                     `• Menang dengan kombinasi simbol\n` +
                     `• 💎💎💎 = JACKPOT!\n\n` +
                     `📊 Simbol: ${this.symbols.join(' ')}\n` +
                     `⏰ Mainkan dengan bijak!`,
            session: session
        };
    }

    async spin(session) {
        if (session.balance < session.betAmount) {
            return {
                success: false,
                message: `❌ Balance tidak cukup!\n` +
                        `Balance: ${session.balance} coins\n` +
                        `Bet: ${session.betAmount} coins\n\n` +
                        `Isi balance dengan !dailybonus`
            };
        }

        // Deduct bet amount
        session.balance -= session.betAmount;
        session.totalBet += session.betAmount;
        session.spins++;

        // Generate random symbols
        const reels = [
            this.symbols[Math.floor(Math.random() * this.symbols.length)],
            this.symbols[Math.floor(Math.random() * this.symbols.length)],
            this.symbols[Math.floor(Math.random() * this.symbols.length)]
        ];

        // Check for win
        const winResult = this.checkWin(reels, session.betAmount);
        
        // Update session
        session.balance += winResult.winAmount;
        session.totalWon += winResult.winAmount;
        session.lastSpin = {
            reels: reels,
            winAmount: winResult.winAmount,
            winType: winResult.winType,
            timestamp: Date.now()
        };

        // Check for jackpot
        let jackpotWin = 0;
        if (Math.random() < this.jackpotChance && winResult.winAmount > 0) {
            jackpotWin = this.jackpot;
            session.balance += jackpotWin;
            session.totalWon += jackpotWin;
        }

        const spinMessage = this.generateSpinMessage(reels, winResult, jackpotWin, session);

        return {
            success: true,
            message: spinMessage,
            winAmount: winResult.winAmount + jackpotWin,
            jackpot: jackpotWin,
            session: session
        };
    }

    checkWin(reels, betAmount) {
        const combination = reels.join('');
        
        // Check for specific combinations
        for (const [pattern, multiplier] of Object.entries(this.payouts)) {
            if (this.matchesPattern(combination, pattern)) {
                const winAmount = betAmount * multiplier;
                return {
                    win: true,
                    winAmount: winAmount,
                    winType: pattern,
                    multiplier: multiplier
                };
            }
        }

        // Check for any two matching (except first two)
        if (reels[0] === reels[1] && this.payouts[reels[0] + reels[0]]) {
            const winAmount = betAmount * this.payouts[reels[0] + reels[0]];
            return {
                win: true,
                winAmount: winAmount,
                winType: reels[0] + reels[0],
                multiplier: this.payouts[reels[0] + reels[0]]
            };
        }

        // Check for any single cherry
        if (reels.includes('🍒') && this.payouts['🍒']) {
            const cherryCount = reels.filter(symbol => symbol === '🍒').length;
            const winAmount = betAmount * this.payouts['🍒'] * cherryCount;
            return {
                win: true,
                winAmount: winAmount,
                winType: '🍒'.repeat(cherryCount),
                multiplier: this.payouts['🍒'] * cherryCount
            };
        }

        return {
            win: false,
            winAmount: 0,
            winType: 'no_win',
            multiplier: 0
        };
    }

    matchesPattern(combination, pattern) {
        if (pattern.length === 3) {
            return combination === pattern;
        }
        return false;
    }

    generateSpinMessage(reels, winResult, jackpotWin, session) {
        let message = `🎰 *SLOT SPIN #${session.spins}* 🎰\n\n`;
        message += `┌─────────┐\n`;
        message += `│ ${reels[0]} │ ${reels[1]} │ ${reels[2]} │\n`;
        message += `└─────────┘\n\n`;

        if (winResult.win) {
            message += `🎉 *MENANG!* 🎉\n`;
            message += `Kombinasi: ${winResult.winType}\n`;
            message += `Multiplier: ${winResult.multiplier}x\n`;
            message += `Win: ${winResult.winAmount} coins\n`;
        } else {
            message += `❌ *Coba lagi!*\n`;
            message += `Tidak ada kombinasi yang menang\n`;
        }

        if (jackpotWin > 0) {
            message += `\n💰 *JACKPOT!* 💰\n`;
            message += `Anda memenangkan JACKPOT!\n`;
            message += `+${jackpotWin} coins!\n`;
        }

        message += `\n📊 *Statistik:*\n`;
        message += `Balance: ${session.balance} coins\n`;
        message += `Total Bet: ${session.totalBet} coins\n`;
        message += `Total Won: ${session.totalWon} coins\n`;
        message += `Profit: ${session.totalWon - session.totalBet} coins`;

        return message;
    }

    async changeBet(session, newBetAmount) {
        if (newBetAmount < 1) {
            return { success: false, message: 'Bet amount harus lebih dari 0' };
        }

        if (newBetAmount > session.balance) {
            return { success: false, message: 'Balance tidak cukup untuk bet amount ini' };
        }

        session.betAmount = newBetAmount;
        
        return {
            success: true,
            message: `✅ Bet amount diubah menjadi ${newBetAmount} coins`,
            session: session
        };
    }

    async cashOut(session) {
        const profit = session.totalWon - session.totalBet;
        const playTime = Date.now() - session.startedAt;
        
        const message = `💵 *CASH OUT* 💵\n\n` +
                       `📊 Statistik akhir:\n` +
                       `Total Spins: ${session.spins}\n` +
                       `Total Bet: ${session.balance + session.totalBet} coins\n` +
                       `Total Won: ${session.totalWon} coins\n` +
                       `Profit: ${profit} coins\n` +
                       `Waktu bermain: ${this.formatTime(playTime)}\n\n` +
                       `💰 Balance akhir: ${session.balance} coins\n\n` +
                       `Terima kasih telah bermain! 🎰`;

        return {
            success: true,
            message: message,
            finalBalance: session.balance,
            profit: profit,
            session: null // End session
        };
    }

    formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }

    getPayoutInfo() {
        let payoutMessage = `💰 *PAYOUT TABLE* 💰\n\n`;
        
        for (const [combination, multiplier] of Object.entries(this.payouts)) {
            payoutMessage += `${combination}: ${multiplier}x\n`;
        }

        payoutMessage += `\n🎰 *Cara menang:*\n`;
        payoutMessage += `• 3 simbol sama = multiplier penuh\n`;
        payoutMessage += `• 2 simbol sama = multiplier setengah\n`;
        payoutMessage += `• Cherry tunggal = 2x per cherry\n`;
        payoutMessage += `\n💎 Jackpot: ${this.jackpot} coins\n`;
        payoutMessage += `🎯 Chance: ${(this.jackpotChance * 100).toFixed(3)}%`;

        return payoutMessage;
    }

    getGameStats(session) {
        const playTime = Date.now() - session.startedAt;
        const profit = session.totalWon - session.totalBet;
        const winRate = session.spins > 0 ? (session.totalWon > 0 ? 1 : 0) : 0; // Simplified win rate

        return {
            spins: session.spins,
            balance: session.balance,
            totalBet: session.totalBet,
            totalWon: session.totalWon,
            profit: profit,
            winRate: winRate,
            playTime: playTime,
            betAmount: session.betAmount,
            lastWin: session.lastSpin?.winAmount || 0
        };
    }

    addDailyBonus(session) {
        const dailyBonus = 100;
        session.balance += dailyBonus;
        
        return {
            success: true,
            message: `🎁 *DAILY BONUS* 🎁\n\n` +
                    `Anda mendapatkan ${dailyBonus} coins!\n` +
                    `Balance sekarang: ${session.balance} coins`,
            bonusAmount: dailyBonus,
            session: session
        };
    }

    getMachineStats() {
        return {
            symbols: this.symbols.length,
            payouts: Object.keys(this.payouts).length,
            jackpot: this.jackpot,
            jackpotChance: this.jackpotChance,
            maxPayout: Math.max(...Object.values(this.payouts))
        };
    }
}

module.exports = SlotMachine;