# エラーパターンと対処法ガイド

## 1. YouTube ダウンロードエラー

### ytdl-core: "Could not extract functions"
**症状**: YouTube仕様変更によりダウンロード不可
**対処法**: 
```javascript
// ❌ ytdl-core（動作しない）
const ytdl = require('ytdl-core');

// ✅ yt-dlp with child_process
const { spawn } = require('child_process');
spawn('yt-dlp', [url, '-o', outputPath]);
```

### youtube-dl-exec: Next.js統合エラー
**症状**: 単体では動作するがAPI内でエラー
**対処法**:
```javascript
// ❌ youtube-dl-exec（Next.js内で不安定）
const youtubedl = require('youtube-dl-exec');

// ✅ 直接spawn実行
const ytdlp = spawn('yt-dlp', [...args]);
```

## 2. ファイルシステムエラー

### EACCES: Permission denied
**症状**: ファイル書き込み権限エラー
**対処法**:
```javascript
// ❌ ローカルディレクトリ
const outputPath = './videos/output.mp4';

// ✅ /tmpディレクトリ使用
const outputPath = `/tmp/video-${Date.now()}.mp4`;
```

### ENOENT: No such file or directory
**症状**: ファイルが見つからない
**対処法**:
```javascript
// ファイル存在確認を追加
if (await fs.access(filePath).catch(() => false)) {
  // ファイルが存在する場合の処理
}
```

## 3. プロセスエラー

### タイムアウト
**症状**: 長時間の動画でハング
**対処法**:
```javascript
const timeout = setTimeout(() => {
  process.kill('SIGTERM');
  reject(new Error('Process timeout'));
}, 60000); // 60秒
```

### メモリ不足
**症状**: 大きなファイルでクラッシュ
**対処法**:
```javascript
// ストリーミング処理を使用
const stream = fs.createReadStream(inputPath);
stream.pipe(processingStream);
```

## 4. API エラー

### 500 Internal Server Error
**症状**: サーバーエラー
**対処法**:
```javascript
try {
  // 処理
} catch (error) {
  console.error('詳細エラー:', error);
  return NextResponse.json(
    { error: error.message },
    { status: 500 }
  );
}
```

### CORS エラー
**症状**: クロスオリジンエラー
**対処法**:
```javascript
// API Routeにヘッダー追加
return new NextResponse(data, {
  headers: {
    'Access-Control-Allow-Origin': '*'
  }
});
```

## 5. 環境依存エラー

### Railway環境でのバイナリ不在
**症状**: yt-dlpコマンドが見つからない
**対処法**:
```dockerfile
# Dockerfileに追加
RUN apt-get update && apt-get install -y \
  python3 python3-pip ffmpeg
RUN pip3 install yt-dlp
```

### Node.js バージョン非互換
**症状**: モジュール読み込みエラー
**対処法**:
```json
// package.json
"engines": {
  "node": ">=18.0.0"
}
```

## 推奨エラーハンドリングパターン

```javascript
async function safeProcess(fn, fallbackFn) {
  try {
    return await fn();
  } catch (error) {
    console.error('Primary failed:', error.message);
    
    if (fallbackFn) {
      console.log('Trying fallback...');
      return await fallbackFn();
    }
    
    throw error;
  }
}

// 使用例
const result = await safeProcess(
  () => downloadWithYoutubeDl(url),
  () => downloadWithChildProcess(url)
);
```

## クイックフィックス集

1. **すぐに試す**: `/tmp`ディレクトリを使用
2. **すぐに試す**: child_processで直接実行
3. **すぐに試す**: try-catchで詳細ログ出力
4. **すぐに試す**: タイムアウト設定（60秒）
5. **すぐに試す**: ファイル存在確認を追加