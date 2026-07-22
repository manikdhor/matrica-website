const { createServer } = require('http');
const { parse } = require('url');
const path = require('path');

// Use standalone build
const app = require('./.next/standalone/server.js');
const next = require('./.next/standalone/node_modules/next');

async function start() {
  try {
    const dev = false;
    const dir = path.join(__dirname, '.next/standalone');
    const nextApp = next({ dev, dir });
    const handle = nextApp.getRequestHandler();
    
    await nextApp.prepare();
    
    const port = process.env.PORT || 3000;
    
    createServer((req, res) => {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    }).listen(port, () => {
      console.log(`> Server running on http://localhost:${port}`);
    });
  } catch (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
}

start();