const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    service: 'sns-video-generator-express',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production'
  });
});

// Serve static files from .next/static
app.use('/_next/static', express.static(path.join(__dirname, '.next/static')));

// Serve public files
app.use(express.static(path.join(__dirname, 'public')));

// API routes proxy (if needed)
app.use('/api', createProxyMiddleware({
  target: process.env.API_URL || 'http://localhost:3001',
  changeOrigin: true,
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(502).json({ error: 'Proxy error' });
  }
}));

// Serve the main app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Express server running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/api/health`);
});