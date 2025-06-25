# 【Boss1→全Worker】追加対応指示（15分×3タスク）

## 統合問題解決のための最終アサイン

### Worker1: child_processでyt-dlp直接実行（15分）
```javascript
// process-simple/route.ts を修正
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

// youtube-dl-execの代わりに直接実行
const ytDlpPath = '/Users/yuichiroooosuger/.pyenv/shims/yt-dlp';
const command = `${ytDlpPath} "${url}" -o "${tempFilePath}" -f "best[height<=480]/best"`;
const { stdout, stderr } = await execAsync(command);
```

**成功基準**: APIが実際のYouTube動画をダウンロード

### Worker2: ローカルファイルパス統一（15分）
```javascript
// すべてのAPIで/tmpディレクトリを使用
// analyze-simple: ファイル存在確認追加
if (!fs.existsSync(videoPath)) {
  // テスト用動画を/tmpに配置
  const testVideoPath = '/tmp/test-video.mp4';
  // 既存のダウンロード済み動画を使用
}
```

**成功基準**: FFmpegエラー254の解消

### Worker3: 完全統合テスト実施（15分）
```bash
# 統合テストスクリプト作成
1. YouTube URL → process-simple
2. 実ファイルパス → split-simple
3. セグメントパス → download-segments
4. ZIPファイル生成確認
```

**成功基準**: 
- E2Eフロー完全動作
- 実際のZIPファイル生成
- ブラウザダウンロード可能

## タイムライン
- 5分後: 実装開始報告
- 10分後: 進捗中間報告
- 15分後: 完了報告と動作確認結果

## 重要指示
- 既存の動作する部分は変更しない
- テスト済みのyt-dlpコマンドを活用
- エラー時は詳細ログを残す

## 最終目標
45分後にPresidentへ「完全動作するMVP」を報告

全Worker、即座に追加対応を開始してください！

Boss1