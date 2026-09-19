const fetch = globalThis.fetch || require('node-fetch');
const API_URL = process.env.API_URL || 'http://localhost:8003';

(async () => {
    try {
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'admin123' }),
        });

        console.log('login status', loginRes.status);
        const loginBody = await loginRes.text();
        console.log('login body', loginBody);

        if (loginRes.ok) {
            const token = JSON.parse(loginBody).access_token;
            const nasabahRes = await fetch(`${API_URL}/nasabah`, {
                method: 'GET',
                headers: { Authorization: `Bearer ${token}` },
            });
            console.log('nasabah status', nasabahRes.status);
            console.log('nasabah body', await nasabahRes.text());
        }
    } catch (err) {
        console.error('error', err);
    }
})();
