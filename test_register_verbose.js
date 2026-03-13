const http = require('http');
const email = `test+${Date.now()}@example.com`;
const payload = { name: 'Test User', email, password: 'secret123' };
const data = JSON.stringify(payload);
console.log('Sending registration POST to http://localhost:3000/auth/register');
console.log('Payload:', payload);
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};
const req = http.request(options, (res) => {
  console.log('Connected — statusCode:', res.statusCode);
  console.log('Response headers:', res.headers);
  let body = '';
  res.on('data', (chunk) => { body += chunk.toString(); });
  res.on('end', () => {
    console.log('Response body raw:', body);
    try { console.log('Response JSON:', JSON.parse(body)); } catch (e) { console.error('Invalid JSON response'); }
    process.exit(0);
  });
});
req.on('error', (err) => { console.error('Request error:', err && err.stack ? err.stack : err); process.exit(1); });
req.setTimeout(5000, () => { console.error('Request timed out after 5000ms'); req.abort(); process.exit(2); });
req.write(data);
req.end();
