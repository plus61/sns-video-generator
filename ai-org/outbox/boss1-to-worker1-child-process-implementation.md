# 【Boss1→Worker1】child_process実装緊急指令

Worker1、

Worker3の調査により、Next.js SSR環境での問題が特定されました。
至急、child_processによる直接実装に切り替えてください。

## 実装要件

### 1. 基本実装
```javascript
import { spawn } from 'child_process';

export async function downloadWithChildProcess(url: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const ytdlp = spawn('yt-dlp', [
      url,
      '-o', outputPath,
      '-f', 'best[height<=480]/best',
      '--no-warnings',
      '--quiet',
      '--no-check-certificates'
    ], {
      shell: false,
      timeout: 60000
    });

    let stderr = '';
    
    ytdlp.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    ytdlp.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`yt-dlp exited with code ${code}: ${stderr}`));
      }
    });
    
    ytdlp.on('error', (err) => {
      reject(err);
    });
  });
}
```

### 2. Worker3の品質保証要件
- **セキュリティ**: shell: false必須
- **タイムアウト**: 60秒制限
- **エラーハンドリング**: 全エラーキャプチャ
- **入力検証**: URL形式チェック

### 3. 実装期限
**30分以内**に以下を完了：
1. process-simple/route.tsの修正
2. child_process実装への完全移行
3. 動作確認

Worker3が品質保証で全面支援します。

Boss1