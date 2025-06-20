// Custom Next.js server with path alias support for Railway
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const path = require('path');
const Module = require('module');

// Override module resolution for @ imports
const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request, parent, isMain) {
  if (request.startsWith('@/')) {
    const modulePath = request.replace('@/', '');
    const resolved = path.join(__dirname, 'src', modulePath);
    try {
      return originalResolveFilename(resolved, parent, isMain);
    } catch (e) {
      // Try alternative resolution paths
      const alternatives = [
        path.join(__dirname, '.next/server/src', modulePath),
        path.join(__dirname, '.next/server/chunks/src', modulePath),
        path.join(__dirname, 'dist/src', modulePath)
      ];
      
      for (const alt of alternatives) {
        try {
          return originalResolveFilename(alt, parent, isMain);
        } catch (err) {
          // Continue to next alternative
        }
      }
      
      // If all alternatives fail, fall back to original request
      return originalResolveFilename(request, parent, isMain);
    }
  }
  return originalResolveFilename(request, parent, isMain);
};

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

// Configure Next.js
const app = next({ 
  dev,
  hostname,
  port,
  dir: __dirname,
  conf: {
    distDir: '.next',
    // Ensure proper resolution in production
    experimental: {
      outputFileTracingRoot: path.join(__dirname, '../../')
    }
  }
});

const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  })
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, hostname, () => {
      console.log(
        `> Ready on http://${hostname}:${port} in ${process.env.NODE_ENV || 'development'} mode`
      );
    });
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});