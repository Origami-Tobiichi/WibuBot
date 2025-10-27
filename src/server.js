const http = require('http');

// Simple HTTP server for health checks
function startHealthServer() {
    const server = http.createServer((req, res) => {
        if (req.url === '/health' || req.url === '/') {
            res.writeHead(200, { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            });
            res.end(JSON.stringify({ 
                status: 'ok', 
                timestamp: new Date().toISOString(),
                service: 'whatsapp-bot',
                message: 'Bot is running'
            }));
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Not found' }));
        }
    });

    const PORT = process.env.PORT || 3000;

    server.listen(PORT, '0.0.0.0', () => {
        console.log(`✅ Health check server running on port ${PORT}`);
