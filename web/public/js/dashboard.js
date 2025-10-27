class Dashboard {
    constructor() {
        this.socket = io();
        this.initializeEventListeners();
        this.loadInitialData();
    }

    initializeEventListeners() {
        // Socket event listeners
        this.socket.on('initial-data', (data) => {
            this.updateDashboard(data);
        });

        this.socket.on('data-update', (data) => {
            this.updateDashboard(data);
        });

        this.socket.on('bot-restarting', (data) => {
            this.showNotification('Bot restarting...', 'warning');
        });

        // Button event listeners
        document.getElementById('restartBot')?.addEventListener('click', () => {
            this.restartBot();
        });

        document.getElementById('showQR')?.addEventListener('click', () => {
            this.showQRCode();
        });

        document.getElementById('viewLogs')?.addEventListener('click', () => {
            this.viewLogs();
        });

        document.getElementById('backupData')?.addEventListener('click', () => {
            this.backupData();
        });
    }

    async loadInitialData() {
        try {
            const [statusResponse, statsResponse] = await Promise.all([
                fetch('/api/bot-status'),
                fetch('/api/stats')
            ]);

            const status = await statusResponse.json();
            const stats = await statsResponse.json();

            this.updateDashboard({ status, stats });
        } catch (error) {
            console.error('Error loading initial data:', error);
        }
    }

    updateDashboard(data) {
        // Update status
        this.updateStatus(data.status);
        
        // Update stats
        if (data.stats) {
            this.updateStats(data.stats);
        }

        // Update system info
        if (data.systemInfo) {
            this.updateSystemInfo(data.systemInfo);
        }

        // Update charts
        this.updateCharts(data);
    }

    updateStatus(status) {
        const statusElement = document.getElementById('botStatus');
        const statusText = document.getElementById('statusInfo');
        const statusDot = document.querySelector('.status-dot');

        if (status.connected) {
            statusElement.innerHTML = '<span class="status-dot connected"></span><span class="status-text">Connected</span>';
            statusText.textContent = 'Connected ✅';
            statusDot?.classList.add('connected');
        } else {
            statusElement.innerHTML = '<span class="status-dot"></span><span class="status-text">Disconnected</span>';
            statusText.textContent = 'Disconnected ❌';
            statusDot?.classList.remove('connected');
        }
    }

    updateStats(stats) {
        document.getElementById('usersInfo').textContent = stats.totalUsers || 0;
        document.getElementById('uptimeInfo').textContent = this.formatUptime(stats.uptime);
        document.getElementById('messagesProcessed').textContent = stats.todayMessages || 0;
        document.getElementById('activeSessions').textContent = stats.activeSessions || 0;
        
        // Update premium users if element exists
        const premiumUsersElement = document.getElementById('premiumUsers');
        if (premiumUsersElement) {
            premiumUsersElement.textContent = stats.premiumUsers || 0;
        }
    }

    updateSystemInfo(systemInfo) {
        document.getElementById('cpuUsage').textContent = systemInfo.load ? systemInfo.load[0].toFixed(2) : '0%';
        document.getElementById('memoryUsage').textContent = systemInfo.memory?.usage || '0%';
        document.getElementById('platformInfo').textContent = systemInfo.platform || 'Unknown';
        
        // Update deploy platform
        const deployPlatform = this.getDeployPlatform();
        document.getElementById('deployPlatform').textContent = deployPlatform;
    }

    updateCharts(data) {
        // Initialize or update charts here
        // This would integrate with a charting library like Chart.js
        console.log('Updating charts with data:', data);
    }

    formatUptime(seconds) {
        if (!seconds) return '0s';
        
        const days = Math.floor(seconds / (24 * 60 * 60));
        const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
        const mins = Math.floor((seconds % (60 * 60)) / 60);
        
        if (days > 0) return `${days}d ${hours}h ${mins}m`;
        if (hours > 0) return `${hours}h ${mins}m`;
        return `${mins}m`;
    }

    getDeployPlatform() {
        // Detect deployment platform
        if (process.env.VERCEL) return 'Vercel';
        if (process.env.RAILWAY_ENVIRONMENT) return 'Railway';
        if (process.env.KOYEB) return 'Koyeb';
        if (process.env.REPLIT_DB_URL) return 'Replit';
        return 'Local/Other';
    }

    async restartBot() {
        if (!confirm('Are you sure you want to restart the bot?')) {
            return;
        }

        try {
            const response = await fetch('/api/restart', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    secret: prompt('Enter admin secret:')
                })
            });

            const result = await response.json();
            
            if (response.ok) {
                this.showNotification('Bot restart command sent', 'success');
            } else {
                this.showNotification(result.error, 'error');
            }
        } catch (error) {
            this.showNotification('Error sending restart command', 'error');
        }
    }

    showQRCode() {
        // Implement QR code display
        const modal = document.getElementById('qrModal');
        const qrContainer = document.getElementById('qrCode');
        
        if (modal && qrContainer) {
            // Generate or fetch QR code
            qrContainer.innerHTML = '<p>QR Code would be displayed here</p>';
            modal.style.display = 'block';
        }
    }

    viewLogs() {
        window.open('/logs', '_blank');
    }

    async backupData() {
        try {
            const response = await fetch('/api/backup', {
                method: 'POST'
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `bot-backup-${new Date().toISOString().split('T')[0]}.zip`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                
                this.showNotification('Backup downloaded successfully', 'success');
            } else {
                this.showNotification('Backup failed', 'error');
            }
        } catch (error) {
            this.showNotification('Error creating backup', 'error');
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            z-index: 1000;
            font-weight: bold;
            transition: opacity 0.3s;
        `;
        
        // Set background color based on type
        const colors = {
            success: '#4CAF50',
            error: '#f44336',
            warning: '#ff9800',
            info: '#2196F3'
        };
        
        notification.style.backgroundColor = colors[type] || colors.info;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Dashboard();
});

// Close modal when clicking X
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('qrModal');
    const closeBtn = document.querySelector('.close');
    
    if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
});