/**
 * Vitalsjs Server Entry Point
 * Biology application server
 */

const http = require('http');

const PORT = process.env.PORT || 3000;

// Create HTTP server
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    message: 'Vitalsjs Server',
    description: 'Biology application',
    version: '1.0.0'
  }));
});

// Start server
server.listen(PORT, () => {
  console.log(`Vitalsjs server is running on port ${PORT}`);
});

module.exports = server;
