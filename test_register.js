const http = require('http');
const email = `test+${Date.now()}@example.com`;
const data = JSON.stringify({name:'Test User', email, password:'secret123'});
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
const req = http.request(options, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    console.log('STATUS', res.statusCode);
    try{ console.log('BODY', JSON.parse(body)); }catch(e){ console.log('BODY', body); }
    process.exit(0);
  });
});
req.on('error', e => { console.error('ERR', e.message); process.exit(1); });
req.write(data); req.end();
