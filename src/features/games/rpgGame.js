class RPGGame {
    constructor() {
        this.classes = {
            warrior: { health: 120, attack: 15, defense: 10, speed: 5 },
            mage: { health: 80, attack: 25, defense: 5, speed: 8 },
            archer: { health: 90, attack: 20, defense: 7, speed: 10 },
            healer: { health: 100, attack: 12, defense: 8, speed: 6 }
        };
        
        this.monsters = {
            slime: { name: "Slime", health: 30, attack: 5, defense: 2, exp: 10, gold: 5 },
            goblin: { name: "Goblin", health: 50, attack: 8, defense: 4, exp: 20, gold: 10 },
            wolf: { name: "Wolf", health: 70, attack: 12, defense: 3, exp: 30, gold: 15 },
            orc: { name: "Orc", health: 100, attack: 18, defense: 8, exp: 50, gold: 25 },
            dragon: { name: "Dragon", health: 200, attack: 25, defense: 15, exp: 100, gold: 50 }
        };

        this.areas = [
            { name: "Hutan Awal", level: 1, monsters: ['slime', 'goblin'] },
            { name: "Gua Gelap", level: 5, monsters: ['goblin', 'wolf'] },
            { name: "Gunung Berapi", level: 10, monsters: ['wolf', 'orc'] },
            { name: "Istana Naga", level: 15, monsters: ['orc', 'dragon'] }
        ];
    }

    async startGame(className = 'warrior') {
        const playerClass = this.classes[className] || this.classes.warrior;
        
        const session = {
            player: {
                name: "Petualang",
                class: className,
                level: 1,
                exp: 0,
                expToNextLevel: 100,
                health: playerClass.health,
                maxHealth: playerClass.health,
                attack: playerClass.attack,
                defense: playerClass.defense,
                speed: playerClass.speed,
                gold: 50,
                inventory: ['Potion', 'Bread'],
                skills: this.getStartingSkills(className)
            },
            currentArea: this.areas[0],
            currentMonster: null,
            inBattle: false,
            battles: 0,
            wins: 0,
            losses: 0,
            startedAt: Date.now()
        };

        return {
            question: `⚔️ *RPG ADVENTURE* ⚔️\n\n` +
                     `Selamat datang, ${session.player.name}!\n` +
                     `Kelas: ${className.toUpperCase()}\n\n` +
                     `❤️ Health: ${session.player.health}/${session.player.maxHealth}\n` +
                     `⚔️ Attack: ${session.player.attack}\n` +
                     `🛡️ Defense: ${session.player.defense}\n` +
                     `🎯 Speed: ${session.player.speed}\n\n` +
                     `💰 Gold: ${session.player.gold}\n` +
                     `📦 Inventory: ${session.player.inventory.join(', ')}\n\n` +
                     `🎮 Perintah:\n` +
                     `!explore - Jelajahi area\n` +
                     `!battle - Lawan monster\n` +
                     `!heal - Gunakan potion\n` +
                     `!stats - Lihat statistik\n` +
                     `!shop - Kunjungi toko\n` +
                     `!area - Pindah area`,
            session: session
        };
    }

    getStartingSkills(className) {
        const skills = {
            warrior: ['Slash', 'Guard'],
            mage: ['Fireball', 'Ice Bolt'],
            archer: ['Quick Shot', 'Dodge'],
            healer: ['Heal', 'Blessing']
        };
        return skills[className] || skills.warrior;
    }

    async explore(session) {
        if (session.inBattle) {
            return { success: false, message: '❌ Anda sedang dalam pertempuran!' };
        }

        const area = session.currentArea;
        const monsterKey = area.monsters[Math.floor(Math.random() * area.monsters.length)];
        const monster = { ...this.monsters[monsterKey] };
        
        session.currentMonster = monster;
        session.inBattle = true;

        const encounterMessage = `🌲 *EXPLORATION* 🌲\n\n` +
                               `Anda menjelajahi ${area.name}...\n\n` +
                               `👹 *MONSTER ENCOUNTER!* 👹\n` +
                               `${monster.name} muncul!\n\n` +
                               `❤️ Health: ${monster.health}\n` +
                               `⚔️ Attack: ${monster.attack}\n` +
                               `🛡️ Defense: ${monster.defense}\n\n` +
                               `🎮 Pilih aksi:\n` +
                               `!attack - Serang monster\n` +
                               `!skill - Gunakan skill\n` +
                               `!flee - Kabur dari pertempuran`;

        return {
            success: true,
            message: encounterMessage,
            session: session
        };
    }

    async attack(session) {
        if (!session.inBattle || !session.currentMonster) {
            return { success: false, message: '❌ Tidak ada monster untuk dilawan!' };
        }

        const player = session.player;
        const monster = session.currentMonster;
        
        session.battles++;

        // Player attacks monster
        const playerDamage = Math.max(1, player.attack - monster.defense);
        monster.health -= playerDamage;

        let battleLog = `⚔️ *BATTLE* ⚔️\n\n`;
        battleLog += `🎯 ${player.name} menyerang ${monster.name}!\n`;
        battleLog += `💥 Damage: ${playerDamage}\n`;
        battleLog += `❤️ ${monster.name} Health: ${Math.max(0, monster.health)}/${this.monsters[monster.name.toLowerCase()].health}\n\n`;

        // Check if monster is defeated
        if (monster.health <= 0) {
            return this.handleVictory(session, battleLog);
        }

        // Monster attacks player
        const monsterDamage = Math.max(1, monster.attack - player.defense);
        player.health -= monsterDamage;

        battleLog += `👹 ${monster.name} menyerang balik!\n`;
        battleLog += `💥 Damage: ${monsterDamage}\n`;
        battleLog += `❤️ ${player.name} Health: ${player.health}/${player.maxHealth}\n\n`;

        // Check if player is defeated
        if (player.health <= 0) {
            return this.handleDefeat(session, battleLog);
        }

        battleLog += `🎮 Pilih aksi selanjutnya:\n` +
                    `!attack - Serang lagi\n` +
                    `!skill - Gunakan skill\n` +
                    `!heal - Gunakan potion\n` +
                    `!flee - Kabur`;

        return {
            success: true,
            message: battleLog,
            session: session
        };
    }

    handleVictory(session, battleLog) {
        const player = session.player;
        const monster = session.currentMonster;
        const baseMonster = this.monsters[monster.name.toLowerCase()];

        // Calculate rewards
        const expGained = baseMonster.exp;
        const goldGained = baseMonster.gold;

        player.exp += expGained;
        player.gold += goldGained;
        session.wins++;
        session.inBattle = false;
        session.currentMonster = null;

        battleLog += `🎉 *VICTORY!* 🎉\n\n`;
        battleLog += `Anda mengalahkan ${monster.name}!\n\n`;
        battleLog += `💰 Gold: +${goldGained}\n`;
        battleLog += `⭐ EXP: +${expGained}\n`;
        battleLog += `📊 EXP Total: ${player.exp}/${player.expToNextLevel}\n\n`;

        // Check level up
        if (player.exp >= player.expToNextLevel) {
            const levelUpResult = this.levelUp(player);
            battleLog += levelUpResult.message + '\n\n';
        }

        battleLog += `❤️ Health: ${player.health}/${player.maxHealth}\n`;
        battleLog += `💰 Total Gold: ${player.gold}\n\n`;
        battleLog += `🌲 Lanjutkan petualangan dengan !explore`;

        return {
            success: true,
            message: battleLog,
            victory: true,
            rewards: { exp: expGained, gold: goldGained },
            session: session
        };
    }

    handleDefeat(session, battleLog) {
        const player = session.player;
        session.losses++;
        session.inBattle = false;
        session.currentMonster = null;

        // Penalty for defeat
        const goldLost = Math.floor(player.gold * 0.1);
        player.gold = Math.max(0, player.gold - goldLost);
        player.health = 1; // Revive with 1 HP

        battleLog += `💀 *DEFEAT!* 💀\n\n`;
        battleLog += `Anda dikalahkan oleh monster...\n\n`;
        battleLog += `💰 Gold hilang: -${goldLost}\n`;
        battleLog += `❤️ Health dipulihkan: 1/${player.maxHealth}\n\n`;
        battleLog += `🏥 Gunakan !heal untuk memulihkan health`;

        return {
            success: true,
            message: battleLog,
            victory: false,
            session: session
        };
    }

    levelUp(player) {
        player.level++;
        player.exp -= player.expToNextLevel;
        player.expToNextLevel = Math.floor(player.expToNextLevel * 1.5);

        // Stat increases
        player.maxHealth += 20;
        player.attack += 3;
        player.defense += 2;
        player.speed += 1;
        player.health = player.maxHealth; // Full heal on level up

        // Learn new skills at certain levels
        const newSkill = this.getNewSkill(player.class, player.level);
        if (newSkill && !player.skills.includes(newSkill)) {
            player.skills.push(newSkill);
        }

        return {
            success: true,
            message: `🎊 *LEVEL UP!* 🎊\n` +
                    `Level ${player.level}!\n` +
                    `❤️ Max Health: +20\n` +
                    `⚔️ Attack: +3\n` +
                    `🛡️ Defense: +2\n` +
                    `🎯 Speed: +1\n` +
                    (newSkill ? `🎯 Skill baru: ${newSkill}` : '')
        };
    }

    getNewSkill(className, level) {
        const skillMap = {
            warrior: { 5: 'Power Strike', 10: 'Whirlwind' },
            mage: { 5: 'Thunder Storm', 10: 'Meteor' },
            archer: { 5: 'Multi Shot', 10: 'Snipe' },
            healer: { 5: 'Group Heal', 10: 'Resurrection' }
        };

        return skillMap[className]?.[level] || null;
    }

    async useSkill(session, skillName) {
        if (!session.inBattle) {
            return { success: false, message: '❌ Tidak dalam pertempuran!' };
        }

        const player = session.player;
        const monster = session.currentMonster;

        if (!player.skills.includes(skillName)) {
            return { success: false, message: '❌ Skill tidak tersedia!' };
        }

        // Implement skill effects
        let skillMessage = '';
        let skillDamage = 0;
        let selfHeal = 0;

        switch (skillName) {
            case 'Fireball':
                skillDamage = player.attack * 1.5;
                skillMessage = `🔥 Anda menggunakan Fireball!`;
                break;
            case 'Heal':
                selfHeal = player.maxHealth * 0.3;
                player.health = Math.min(player.maxHealth, player.health + selfHeal);
                skillMessage = `💚 Anda menggunakan Heal! +${selfHeal} HP`;
                break;
            case 'Power Strike':
                skillDamage = player.attack * 2;
                skillMessage = `💥 Anda menggunakan Power Strike!`;
                break;
            // Add more skills as needed
            default:
                skillDamage = player.attack;
                skillMessage = `🎯 Anda menggunakan ${skillName}!`;
        }

        let battleLog = `🎯 *SKILL USED* 🎯\n\n`;
        battleLog += skillMessage + '\n\n';

        if (skillDamage > 0) {
            monster.health -= skillDamage;
            battleLog += `💥 Damage: ${skillDamage}\n`;
            battleLog += `❤️ ${monster.name} Health: ${Math.max(0, monster.health)}/${this.monsters[monster.name.toLowerCase()].health}\n\n`;

            if (monster.health <= 0) {
                return this.handleVictory(session, battleLog);
            }
        }

        // Monster still attacks
        const monsterDamage = Math.max(1, monster.attack - player.defense);
        player.health -= monsterDamage;

        battleLog += `👹 ${monster.name} menyerang balik!\n`;
        battleLog += `💥 Damage: ${monsterDamage}\n`;
        battleLog += `❤️ ${player.name} Health: ${player.health}/${player.maxHealth}\n\n`;

        if (player.health <= 0) {
            return this.handleDefeat(session, battleLog);
        }

        battleLog += `🎮 Pilih aksi selanjutnya:\n` +
                    `!attack - Serang\n` +
                    `!skill - Gunakan skill lain\n` +
                    `!heal - Gunakan potion\n` +
                    `!flee - Kabur`;

        return {
            success: true,
            message: battleLog,
            session: session
        };
    }

    async heal(session) {
        const player = session.player;
        
        if (player.inventory.includes('Potion')) {
            const healAmount = player.maxHealth * 0.5;
            player.health = Math.min(player.maxHealth, player.health + healAmount);
            
            // Remove potion from inventory
            const potionIndex = player.inventory.indexOf('Potion');
            player.inventory.splice(potionIndex, 1);

            return {
                success: true,
                message: `💚 *HEALED!* 💚\n\n` +
                        `Anda menggunakan Potion!\n` +
                        `+${healAmount} HP\n\n` +
                        `❤️ Health: ${player.health}/${player.maxHealth}\n` +
                        `📦 Potion tersisa: ${player.inventory.filter(item => item === 'Potion').length}`,
                session: session
            };
        } else {
            return {
                success: false,
                message: '❌ Tidak ada Potion di inventory!'
            };
        }
    }

    getPlayerStats(session) {
        const player = session.player;
        const playTime = Date.now() - session.startedAt;

        return {
            success: true,
            message: `📊 *PLAYER STATS* 📊\n\n` +
                    `👤 Name: ${player.name}\n` +
                    `🎯 Class: ${player.class}\n` +
                    `⭐ Level: ${player.level}\n` +
                    `📈 EXP: ${player.exp}/${player.expToNextLevel}\n\n` +
                    `❤️ Health: ${player.health}/${player.maxHealth}\n` +
                    `⚔️ Attack: ${player.attack}\n` +
                    `🛡️ Defense: ${player.defense}\n` +
                    `🎯 Speed: ${player.speed}\n\n` +
                    `💰 Gold: ${player.gold}\n` +
                    `📦 Inventory: ${player.inventory.join(', ') || 'Kosong'}\n` +
                    `🎯 Skills: ${player.skills.join(', ')}\n\n` +
                    `🏆 Battles: ${session.battles}\n` +
                    `✅ Wins: ${session.wins}\n` +
                    `❌ Losses: ${session.losses}\n` +
                    `⏰ Play Time: ${this.formatTime(playTime)}`
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

    getGameInfo() {
        return {
            classes: Object.keys(this.classes),
            areas: this.areas.map(area => ({
                name: area.name,
                level: area.level,
                monsters: area.monsters
            })),
            monsters: Object.keys(this.monsters),
            totalSkills: 8 // Total available skills
        };
    }
}

module.exports = RPGGame;