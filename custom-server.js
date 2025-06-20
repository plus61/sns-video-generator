const express = require('express');
const next = require('next');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev, dir: __dirname });
const handle = app.getRequestHandler();
const PORT = process.env.PORT || 3000;

// .nextディレクトリの存在確認
const fs = require('fs');
console.log('=== SERVER STARTUP CHECK ===');
console.log('Current directory:', process.cwd());
console.log('.next exists?', fs.existsSync('.next'));
if (fs.existsSync('.next')) {
  console.log('.next contents:', fs.readdirSync('.next'));
}

app.prepare().then(() => {
  const server = express();

  // ヘルスチェック用
  server.get('/api/health/simple', (req, res) => {
    res.json({ status: 'ok', server: 'custom' });
  });

  server.all('*', (req, res) => {
    return handle(req, res);
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`> Custom server ready on http://0.0.0.0:${PORT}`);
  });
}).catch((err) => {
  console.error('Server startup error:', err);
  // フォールバック: 最小限のサーバー
  const fallback = express();
  fallback.get('*', (req, res) => {
    res.send('Next.js startup failed - fallback mode');
  });
  fallback.listen(PORT, () => {
    console.log(`> Fallback server on ${PORT}`);
  });
});