# child_process実装 品質保証提案

## セキュアな実装パターン

### 1. コマンドインジェクション対策

```typescript
import { spawn } from 'child_process';
import path from 'path';

// ❌ 危険: シェル経由の実行
// exec(`yt-dlp ${url} -o ${output}`)

// ✅ 安全: 引数を配列で渡す
const ytdlp = spawn('yt-dlp', [
  url,
  '-o', outputPath,
  '--format', 'best[height<=480]/best',
  '--no-check-certificates',
  '--quiet'
], {
  // シェルを使わない
  shell: false,
  // 環境変数を制限
  env: {
    ...process.env,
    PATH: '/usr/local/bin:/usr/bin:/bin'
  }
});
```

### 2. タイムアウト処理

```typescript
const DOWNLOAD_TIMEOUT = 60000; // 60秒

const downloadWithTimeout = (url: string, outputPath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const ytdlp = spawn('yt-dlp', [url, '-o', outputPath]);
    
    // タイムアウト設定
    const timeout = setTimeout(() => {
      ytdlp.kill('SIGTERM');
      reject(new Error('Download timeout after 60 seconds'));
    }, DOWNLOAD_TIMEOUT);
    
    ytdlp.on('close', (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`yt-dlp exited with code ${code}`));
      }
    });
    
    ytdlp.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
};
```

### 3. エラーハンドリング

```typescript
interface DownloadResult {
  success: boolean;
  filePath?: string;
  fileSize?: number;
  error?: string;
  stderr?: string;
}

async function downloadVideo(url: string): Promise<DownloadResult> {
  const outputPath = `/tmp/video-${Date.now()}.mp4`;
  
  try {
    // URLバリデーション
    if (!isValidYouTubeUrl(url)) {
      throw new Error('Invalid YouTube URL');
    }
    
    // ダウンロード実行
    const stderr = await downloadWithStderr(url, outputPath);
    
    // ファイル検証
    const stats = await fs.stat(outputPath);
    if (stats.size === 0) {
      throw new Error('Downloaded file is empty');
    }
    
    return {
      success: true,
      filePath: outputPath,
      fileSize: stats.size
    };
    
  } catch (error) {
    // クリーンアップ
    try {
      await fs.unlink(outputPath);
    } catch {}
    
    return {
      success: false,
      error: error.message,
      stderr: error.stderr || ''
    };
  }
}
```

### 4. プログレス監視

```typescript
const downloadWithProgress = (url: string, outputPath: string) => {
  return new Promise((resolve, reject) => {
    const ytdlp = spawn('yt-dlp', [
      url,
      '-o', outputPath,
      '--progress',
      '--newline'
    ]);
    
    let lastProgress = 0;
    
    ytdlp.stdout.on('data', (data) => {
      const output = data.toString();
      const match = output.match(/(\d+\.\d+)%/);
      if (match) {
        const progress = parseFloat(match[1]);
        if (progress > lastProgress) {
          lastProgress = progress;
          console.log(`Download progress: ${progress}%`);
        }
      }
    });
    
    ytdlp.stderr.on('data', (data) => {
      console.error('yt-dlp stderr:', data.toString());
    });
    
    ytdlp.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`yt-dlp exited with code ${code}`));
      }
    });
  });
};
```

### 5. リソース制限

```typescript
const downloadWithLimits = (url: string, outputPath: string) => {
  return new Promise((resolve, reject) => {
    const ytdlp = spawn('yt-dlp', [
      url,
      '-o', outputPath,
      '--limit-rate', '1M', // 1MB/s制限
      '--max-filesize', '100M' // 最大100MB
    ], {
      // メモリ制限
      env: {
        ...process.env,
        NODE_OPTIONS: '--max-old-space-size=512'
      }
    });
    
    // 以下、通常の処理...
  });
};
```

## テストケース

```typescript
describe('YouTube Download', () => {
  test('正常なダウンロード', async () => {
    const result = await downloadVideo('https://youtube.com/watch?v=jNQXAC9IVRw');
    expect(result.success).toBe(true);
    expect(result.fileSize).toBeGreaterThan(0);
  });
  
  test('無効なURL', async () => {
    const result = await downloadVideo('invalid-url');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid');
  });
  
  test('タイムアウト', async () => {
    // 長時間の動画でテスト
    const result = await downloadVideo('https://youtube.com/watch?v=long-video');
    expect(result.error).toContain('timeout');
  }, 70000);
  
  test('コマンドインジェクション防止', async () => {
    const maliciousUrl = 'https://youtube.com/watch?v=test"; rm -rf /';
    const result = await downloadVideo(maliciousUrl);
    // エラーになるが、コマンドは実行されない
    expect(result.success).toBe(false);
  });
});
```

## 推奨事項

1. **プロセス分離**: 各ダウンロードを独立したプロセスで実行
2. **リソース管理**: 同時実行数の制限（例: 最大3並列）
3. **ログ記録**: すべてのエラーとstderrを記録
4. **再試行**: ネットワークエラー時の自動リトライ（最大3回）
5. **検証**: ダウンロード後のファイル整合性チェック