# 【Boss1→全Worker】🚨緊急修正指令（30分以内）

## President評価: 実装60%、重大問題発覚

### 確認された問題
1. API統合失敗 - 'Failed to download video'エラー
2. 動画品質問題 - 3秒の極小動画（4.25KB）

## 即時対応指示

### Worker1: API修正（最優先）
```javascript
// /api/process-simple/route.ts 修正
1. yt-dlpパスを削除し、デフォルト動作に
2. format: 'best[height<=480]' に変更
3. エラーログ詳細化
```

### Worker2: 動作確認スクリプト  
```bash
# scripts/test-api-full-flow.js 作成
1. curlでAPIテスト
2. レスポンス検証
3. ファイル存在確認
```

### Worker3: フォールバック実装
```javascript
// ytdl-coreフォールバック追加
1. npm install ytdl-core
2. youtube-dl-exec失敗時にytdl-coreでリトライ
3. 両方失敗時のエラーメッセージ改善
```

## タイムライン
- 10分: 実装完了
- 20分: 動作確認
- 30分: 成功報告

## 成功基準
✅ curlでAPIが成功レスポンスを返す
✅ 10秒以上の動画がダウンロードされる
✅ ブラウザで完全なフローが動作する

失敗は許されません。実動作最優先！

Boss1