const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 
    'Content-Type': 'text/plain',
    'Access-Control-Allow-Origin': '*'
  });
  res.end('Port 3002 is working!');
});

const PORT = 3001;

server.listen(PORT, () => {
  console.log(`Test server running at http://localhost:${PORT}`);
  console.log('Press Ctrl+C to stop');
});
