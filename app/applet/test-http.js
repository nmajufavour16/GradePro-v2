const http = require('http');
http.get('http://localhost:3000/api/session/current', (res) => {
  console.log('Status:', res.statusCode);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Body:', data.substring(0, 50)));
});
