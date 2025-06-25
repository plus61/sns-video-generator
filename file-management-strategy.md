# 📁 ファイル管理戦略 - Worker3

## 1. ディレクトリ構造

```
/tmp/
├── video-uploads/          # アップロードされた動画
│   └── {sessionId}/       # セッション別
│       └── original.mp4
├── video-processing/       # 処理中の動画
│   └── {sessionId}/
│       ├── tiktok.mp4
│       ├── instagram.mp4
│       └── youtube.mp4
└── video-downloads/        # ダウンロード準備
    └── {sessionId}/
        └── videos.zip
```

## 2. ファイル管理ポリシー

### セッションID生成
```javascript
const crypto = require('crypto');
const generateSessionId = () => crypto.randomBytes(16).toString('hex');
```

### ファイルパス管理
```javascript
const paths = {
  upload: (sessionId) => `/tmp/video-uploads/${sessionId}`,
  processing: (sessionId) => `/tmp/video-processing/${sessionId}`,
  download: (sessionId) => `/tmp/video-downloads/${sessionId}`
};
```

### サイズ制限
- アップロード: 最大500MB
- 処理後動画: 合計1GB以内
- ZIP: 最大1.5GB

## 3. クリーンアップ戦略

### 自動削除タイマー
```javascript
const CLEANUP_DELAY = 30 * 60 * 1000; // 30分

function scheduleCleanup(sessionId) {
  setTimeout(() => {
    cleanupSession(sessionId);
  }, CLEANUP_DELAY);
}
```

### 即座クリーンアップ
```javascript
async function cleanupSession(sessionId) {
  const fs = require('fs').promises;
  const path = require('path');
  
  const dirs = [
    paths.upload(sessionId),
    paths.processing(sessionId),
    paths.download(sessionId)
  ];
  
  for (const dir of dirs) {
    try {
      await fs.rm(dir, { recursive: true, force: true });
      console.log(`✅ Cleaned: ${dir}`);
    } catch (error) {
      console.error(`❌ Cleanup failed: ${dir}`, error);
    }
  }
}
```

## 4. ストレージ監視

### ディスク使用量チェック
```javascript
const checkDiskUsage = async () => {
  const { execSync } = require('child_process');
  const usage = execSync('df -h /tmp | tail -1').toString();
  const percentUsed = parseInt(usage.split(/\s+/)[4]);
  
  if (percentUsed > 80) {
    console.warn('⚠️ Disk usage high:', percentUsed + '%');
    // 古いセッションをクリーンアップ
  }
};
```

## 5. エラーハンドリング

### ファイル操作のラップ
```javascript
async function safeFileOperation(operation, fallback) {
  try {
    return await operation();
  } catch (error) {
    console.error('File operation failed:', error);
    if (fallback) return fallback();
    throw error;
  }
}
```

## 6. セキュリティ考慮事項

- パストラバーサル攻撃の防止
- ファイル名のサニタイズ
- 一時URLの生成（ダウンロード用）

```javascript
const sanitizeFilename = (filename) => {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '');
};
```

## 実装準備完了！

30分後の実装に向けて、これらの戦略で確実なファイル管理を実現します。