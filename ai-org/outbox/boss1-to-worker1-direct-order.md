# 【Boss1→Worker1】直接指示 - child_process実装

## Worker1、至急以下を実装してください

### タスク: youtube-dl-execをchild_processに置き換え

#### 1. 必要なインポート追加
```typescript
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);
```

#### 2. ダウンロード部分を完全に置き換え
```typescript
// youtube-dl-execの代わりに以下を使用
try {
  const ytDlpPath = '/Users/yuichiroooosuger/.pyenv/shims/yt-dlp';
  const command = `${ytDlpPath} "${url}" -o "${tempFilePath}" -f "best[height<=480]/best" --no-check-certificate`;
  
  console.log('Executing command:', command);
  const { stdout, stderr } = await execAsync(command);
  
  if (stderr && stderr.includes('ERROR')) {
    throw new Error(stderr);
  }
  
  // ファイル確認
  const stats = await fs.stat(tempFilePath);
  console.log(`✅ Downloaded video: ${stats.size} bytes`);
  
  if (stats.size === 0) {
    throw new Error('Downloaded file is empty');
  }
} catch (error) {
  console.error('Direct yt-dlp failed:', error);
  throw new Error(`Failed to download video: ${error.message}`);
}
```

#### 3. ytdl-coreフォールバック部分を削除
- ytdl-coreは使用不可のため、フォールバック部分をすべて削除
- シンプルにyt-dlpのみ使用

### 実装場所
`/src/app/api/process-simple/route.ts` の40-91行目を上記コードで置き換え

### テスト方法
```bash
curl -X POST http://localhost:3001/api/process-simple \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.youtube.com/watch?v=jNQXAC9IVRw"}'
```

### 期限: 15分以内

### 成功基準
- APIが正常なJSONレスポンスを返す
- 実際のmp4ファイルが/tmpに保存される
- ファイルサイズが100KB以上

Worker1、この実装でyt-dlpの動作実績を活かし、
確実に動作するAPIを構築してください。

Boss1