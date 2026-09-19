const http = require('http');
const API_PORT = Number(process.env.API_PORT || 8003);

// Login first
const loginReq = {
    hostname: 'localhost',
    port: API_PORT,
    path: '/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
};

const loginBody = JSON.stringify({ username: 'admin', password: 'admin123' });

const loginPromise = new Promise((resolve, reject) => {
    const req = http.request(loginReq, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            try {
                const json = JSON.parse(data);
                resolve(json.access_token);
            } catch (e) {
                reject(e);
            }
        });
    });
    req.on('error', reject);
    req.write(loginBody);
    req.end();
});

loginPromise.then(token => {
    // Get pinjaman
    const pinjamanReq = {
        hostname: 'localhost',
        port: API_PORT,
        path: '/pinjaman',
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` }
    };

    const req = http.request(pinjamanReq, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            try {
                const pinjaman = JSON.parse(data);
                console.log('Total Pinjaman:', Array.isArray(pinjaman) ? pinjaman.length : 1);
                console.log(JSON.stringify(pinjaman, null, 2));
            } catch (e) {
                console.error('Parse error:', e.message);
                console.log('Raw data:', data);
            }
        });
    });
    req.on('error', (e) => console.error('Request error:', e.message));
    req.end();
}).catch(e => console.error('Login error:', e.message));
