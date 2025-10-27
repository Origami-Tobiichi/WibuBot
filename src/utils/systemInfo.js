const os = require('os');
const si = require('systeminformation');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

class SystemInfo {
    static async getSystemInfo() {
        try {
            const [
                cpuInfo,
                memoryInfo,
                osInfo,
                loadInfo,
                networkInfo,
                diskInfo
            ] = await Promise.all([
                this.getCPUInfo(),
                this.getMemoryInfo(),
                this.getOSInfo(),
                this.getLoadInfo(),
                this.getNetworkInfo(),
                this.getDiskInfo()
            ]);

            return {
                platform: osInfo.platform,
                arch: osInfo.arch,
                cpu: cpuInfo,
                memory: memoryInfo,
                load: loadInfo,
                network: networkInfo,
                disk: diskInfo,
                uptime: this.formatUptime(os.uptime()),
                timestamp: new Date().toLocaleString(),
                date: new Date().toLocaleDateString(),
                time: new Date().toLocaleTimeString()
            };
        } catch (error) {
            console.error('Error getting system info:', error);
            return this.getBasicSystemInfo();
        }
    }

    static async getCPUInfo() {
        try {
            const cpuData = await si.cpu();
            const currentLoad = await si.currentLoad();
            const cpuTemperature = await si.cpuTemperature().catch(() => ({ main: null }));

            return {
                manufacturer: cpuData.manufacturer,
                brand: cpuData.brand,
                cores: cpuData.cores,
                speed: cpuData.speed,
                speedMin: cpuData.speedMin,
                speedMax: cpuData.speedMax,
                usage: currentLoad.currentLoad.toFixed(1),
                temperature: cpuTemperature.main,
                processes: currentLoad.processes
            };
        } catch (error) {
            return {
                model: os.cpus()[0].model,
                cores: os.cpus().length,
                usage: 'Unknown',
                temperature: 'Unknown'
            };
        }
    }

    static async getMemoryInfo() {
        try {
            const memData = await si.mem();
            const totalMem = memData.total / (1024 ** 3); // Convert to GB
            const usedMem = memData.used / (1024 ** 3);
            const freeMem = memData.free / (1024 ** 3);
            const usagePercent = (memData.used / memData.total) * 100;

            return {
                total: totalMem.toFixed(2),
                used: usedMem.toFixed(2),
                free: freeMem.toFixed(2),
                usage: usagePercent.toFixed(1),
                unit: 'GB'
            };
        } catch (error) {
            const totalMem = os.totalmem() / (1024 ** 3);
            const freeMem = os.freemem() / (1024 ** 3);
            const usedMem = totalMem - freeMem;
            const usagePercent = (usedMem / totalMem) * 100;

            return {
                total: totalMem.toFixed(2),
                used: usedMem.toFixed(2),
                free: freeMem.toFixed(2),
                usage: usagePercent.toFixed(1),
                unit: 'GB'
            };
        }
    }

    static async getOSInfo() {
        try {
            const osData = await si.osInfo();
            return {
                platform: osData.platform,
                distro: osData.distro,
                release: osData.release,
                arch: osData.arch,
                kernel: osData.kernel,
                hostname: osData.hostname
            };
        } catch (error) {
            return {
                platform: os.platform(),
                arch: os.arch(),
                release: os.release(),
                hostname: os.hostname()
            };
        }
    }

    static async getLoadInfo() {
        try {
            const loadData = await si.currentLoad();
            return {
                current: loadData.currentLoad.toFixed(2),
                average: os.loadavg(),
                processes: loadData.processes
            };
        } catch (error) {
            return {
                current: 'Unknown',
                average: os.loadavg(),
                processes: 'Unknown'
            };
        }
    }

    static async getNetworkInfo() {
        try {
            const networkData = await si.networkStats();
            const defaultInterface = networkData[0] || {};

            return {
                interface: defaultInterface.iface || 'Unknown',
                rx_bytes: this.formatBytes(defaultInterface.rx_bytes || 0),
                tx_bytes: this.formatBytes(defaultInterface.tx_bytes || 0),
                rx_sec: this.formatBytes(defaultInterface.rx_sec || 0) + '/s',
                tx_sec: this.formatBytes(defaultInterface.tx_sec || 0) + '/s'
            };
        } catch (error) {
            const interfaces = os.networkInterfaces();
            const mainInterface = Object.keys(interfaces)[0];

            return {
                interface: mainInterface || 'Unknown',
                rx_bytes: 'Unknown',
                tx_bytes: 'Unknown',
                rx_sec: 'Unknown',
                tx_sec: 'Unknown'
            };
        }
    }

    static async getDiskInfo() {
        try {
            const diskData = await si.fsSize();
            const rootDisk = diskData.find(disk => disk.mount === '/') || diskData[0] || {};

            return {
                size: this.formatBytes(rootDisk.size || 0),
                used: this.formatBytes(rootDisk.used || 0),
                available: this.formatBytes(rootDisk.available || 0),
                usage: rootDisk.use || '0%',
                mount: rootDisk.mount || '/'
            };
        } catch (error) {
            return {
                size: 'Unknown',
                used: 'Unknown',
                available: 'Unknown',
                usage: 'Unknown',
                mount: '/'
            };
        }
    }

    static getBasicSystemInfo() {
        return {
            platform: os.platform(),
            arch: os.arch(),
            cpu: {
                model: os.cpus()[0].model,
                cores: os.cpus().length
            },
            memory: {
                total: (os.totalmem() / (1024 ** 3)).toFixed(2) + ' GB',
                used: ((os.totalmem() - os.freemem()) / (1024 ** 3)).toFixed(2) + ' GB',
                free: (os.freemem() / (1024 ** 3)).toFixed(2) + ' GB',
                usage: ((1 - os.freemem() / os.totalmem()) * 100).toFixed(1) + '%'
            },
            uptime: this.formatUptime(os.uptime()),
            load: os.loadavg(),
            timestamp: new Date().toLocaleString(),
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString()
        };
    }

    static formatUptime(seconds) {
        const days = Math.floor(seconds / (24 * 60 * 60));
        const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
        const minutes = Math.floor((seconds % (60 * 60)) / 60);
        const secs = Math.floor(seconds % 60);

        if (days > 0) {
            return `${days}d ${hours}h ${minutes}m ${secs}s`;
        } else if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    }

    static formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    static async getBotStats() {
        try {
            const processInfo = await si.processes();
            const botProcess = processInfo.list.find(p => 
                p.name && (p.name.includes('node') || p.name.includes('bot'))
            );

            return {
                pid: process.pid,
                memory: process.memoryUsage(),
                uptime: process.uptime(),
                version: process.version,
                cpuUsage: botProcess ? botProcess.cpu : 'Unknown',
                memoryUsage: botProcess ? this.formatBytes(botProcess.mem) : 'Unknown'
            };
        } catch (error) {
            return {
                pid: process.pid,
                memory: process.memoryUsage(),
                uptime: process.uptime(),
                version: process.version,
                cpuUsage: 'Unknown',
                memoryUsage: 'Unknown'
            };
        }
    }

    static async getDeploymentInfo() {
        const deployment = {
            platform: 'Local',
            region: 'Unknown',
            url: 'http://localhost:3000'
        };

        // Detect deployment platform
        if (process.env.VERCEL) {
            deployment.platform = 'Vercel';
            deployment.region = process.env.VERCEL_REGION || 'Unknown';
            deployment.url = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : deployment.url;
        } else if (process.env.RAILWAY_ENVIRONMENT) {
            deployment.platform = 'Railway';
            deployment.region = process.env.RAILWAY_REGION || 'Unknown';
        } else if (process.env.KOYEB) {
            deployment.platform = 'Koyeb';
            deployment.region = process.env.KOYEB_REGION || 'Unknown';
        } else if (process.env.REPLIT_DB_URL) {
            deployment.platform = 'Replit';
            deployment.region = 'Global';
        } else if (process.env.AWS_REGION) {
            deployment.platform = 'AWS';
            deployment.region = process.env.AWS_REGION;
        }

        return deployment;
    }

    static async getPerformanceMetrics() {
        try {
            const [cpu, memory, network] = await Promise.all([
                si.currentLoad(),
                si.mem(),
                si.networkStats()
            ]);

            return {
                cpu: {
                    usage: cpu.currentLoad.toFixed(2),
                    user: cpu.currentLoadUser.toFixed(2),
                    system: cpu.currentLoadSystem.toFixed(2)
                },
                memory: {
                    usage: ((memory.used / memory.total) * 100).toFixed(2),
                    used: this.formatBytes(memory.used),
                    total: this.formatBytes(memory.total)
                },
                network: network[0] ? {
                    input: this.formatBytes(network[0].rx_sec) + '/s',
                    output: this.formatBytes(network[0].tx_sec) + '/s'
                } : { input: '0 B/s', output: '0 B/s' }
            };
        } catch (error) {
            return {
                cpu: { usage: 'Unknown', user: 'Unknown', system: 'Unknown' },
                memory: { usage: 'Unknown', used: 'Unknown', total: 'Unknown' },
                network: { input: 'Unknown', output: 'Unknown' }
            };
        }
    }

    static async getStorageInfo() {
        try {
            const disks = await si.fsSize();
            const totalSize = disks.reduce((sum, disk) => sum + disk.size, 0);
            const totalUsed = disks.reduce((sum, disk) => sum + disk.used, 0);
            const totalAvailable = disks.reduce((sum, disk) => sum + disk.available, 0);

            return {
                total: this.formatBytes(totalSize),
                used: this.formatBytes(totalUsed),
                available: this.formatBytes(totalAvailable),
                usage: ((totalUsed / totalSize) * 100).toFixed(1) + '%',
                disks: disks.map(disk => ({
                    mount: disk.mount,
                    size: this.formatBytes(disk.size),
                    used: this.formatBytes(disk.used),
                    available: this.formatBytes(disk.available),
                    usage: disk.use
                }))
            };
        } catch (error) {
            return {
                total: 'Unknown',
                used: 'Unknown',
                available: 'Unknown',
                usage: 'Unknown',
                disks: []
            };
        }
    }
}

module.exports = SystemInfo;