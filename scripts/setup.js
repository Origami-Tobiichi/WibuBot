#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

class SetupScript {
    constructor() {
        this.baseDir = process.cwd();
        this.setupLog = [];
    }

    async run() {
        console.log('🚀 Starting Ultimate WhatsApp Bot Setup...\n');
        
        try {
            await this.checkPrerequisites();
            await this.createDirectories();
            await this.createConfigFiles();
            await this.installDependencies();
            await this.setupEnvironment();
            
            console.log('\n🎉 Setup completed successfully!');
            console.log('\n📝 Next steps:');
            console.log('1. Edit .env file with your configuration');
            console.log('2. Run: npm start');
            console.log('3. Scan QR code with WhatsApp');
            console.log('4. Access dashboard at http://localhost:3000');
            
            this.saveSetupLog();
            
        } catch (error) {
            console.error('\n❌ Setup failed:', error.message);
            this.saveSetupLog();
            process.exit(1);
        }
    }

    async checkPrerequisites() {
        console.log('🔍 Checking prerequisites...');
        
        // Check Node.js version
        const { stdout: nodeVersion } = await execAsync('node --version');
        const versionMatch = nodeVersion.match(/v(\d+)\./);
        const majorVersion = versionMatch ? parseInt(versionMatch[1]) : 0;
        
        if (majorVersion < 18) {
            throw new Error('Node.js version 18 or higher is required');
        }
        
        this.log('✅ Node.js version check passed');
        
        // Check npm
        try {
            await execAsync('npm --version');
            this.log('✅ npm check passed');
        } catch {
            throw new Error('npm is not installed');
        }
        
        // Check FFmpeg (optional but recommended)
        try {
            await execAsync('ffmpeg -version');
            this.log('✅ FFmpeg check passed');
        } catch {
            console.log('⚠️  FFmpeg not found (some features may not work)');
        }
    }

    async createDirectories() {
        console.log('📁 Creating directory structure...');
        
        const directories = [
            'data/users',
            'data/sessions',
            'data/memory',
            'data/premium',
            'data/downloads',
            'data/voice-notes',
            'data/wibu-data',
            'data/logs',
            'data/public/images/wallpapers',
            'data/public/images/backgrounds',
            'data/public/images/menus',
            'data/public/images/wibu',
            'database/models',
            'database/migrations',
            'tests',
            'scripts'
        ];
        
        for (const dir of directories) {
            await fs.mkdir(path.join(this.baseDir, dir), { recursive: true });
            this.log(`✅ Created directory: ${dir}`);
        }
    }

    async createConfigFiles() {
        console.log('⚙️  Creating configuration files...');
        
        // Create .env file from example
        try {
            const envExample = await fs.readFile('.env.example', 'utf8');
            await fs.writeFile('.env', envExample);
            this.log('✅ Created .env file');
        } catch (error) {
            console.log('⚠️  Could not create .env file (may already exist)');
        }
        
        // Create default game data
        const gameData = {
            tebakgambar: [
                {
                    image: "https://example.com/gunung.jpg",
                    answer: "gunung",
                    clue: "Tempat tinggi dengan puncak",
                    difficulty: "easy"
                }
            ]
        };
        
        await fs.writeFile(
            path.join('data/games', 'tebakgambar.json'),
            JSON.stringify(gameData.tebakgambar, null, 2)
        );
        this.log('✅ Created game data files');
        
        // Create sample wallpaper
        const sampleWallpaper = `
<!-- Sample wallpaper SVG -->
<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#4A00E0;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#8E2DE2;stop-opacity:1" />
        </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#grad1)"/>
    <text x="400" y="300" font-family="Arial" font-size="24" fill="white" text-anchor="middle">Ultimate WhatsApp Bot</text>
</svg>`;
        
        await fs.writeFile(
            path.join('data/public/images/wallpapers', 'default.svg'),
            sampleWallpaper
        );
        this.log('✅ Created sample wallpaper');
    }

    async installDependencies() {
        console.log('📦 Installing dependencies...');
        
        try {
            const { stdout, stderr } = await execAsync('npm install');
            this.log('✅ Dependencies installed successfully');
        } catch (error) {
            throw new Error(`Failed to install dependencies: ${error.message}`);
        }
    }

    async setupEnvironment() {
        console.log('🔧 Setting up environment...');
        
        // Create initial admin user data structure
        const initialData = {
            admin: {
                jid: process.env.OWNER_NUMBER || 'admin@localhost',
                username: 'admin',
                premium: true,
                registeredAt: new Date().toISOString()
            },
            system: {
                setupCompleted: true,
                setupDate: new Date().toISOString(),
                version: '1.0.0'
            }
        };
        
        await fs.writeFile(
            path.join('data', 'system.json'),
            JSON.stringify(initialData, null, 2)
        );
        this.log('✅ Environment setup completed');
    }

    log(message) {
        this.setupLog.push({
            timestamp: new Date().toISOString(),
            message: message
        });
        console.log(`   ${message}`);
    }

    async saveSetupLog() {
        try {
            await fs.writeFile(
                path.join('data/logs', 'setup.log'),
                JSON.stringify(this.setupLog, null, 2)
            );
        } catch (error) {
            console.log('⚠️  Could not save setup log');
        }
    }
}

// Run setup if this script is executed directly
if (require.main === module) {
    const setup = new SetupScript();
    setup.run();
}

module.exports = SetupScript;