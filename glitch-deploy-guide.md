# Glitch.com Express API 即時デプロイガイド

## 5分でExpress APIをオンラインに！

### Step 1: Glitchプロジェクト作成（1分）
1. https://glitch.com へアクセス
2. "New Project" → "glitch-hello-node" を選択
3. プロジェクト名を設定（例: sns-video-express-api）

### Step 2: コード配置（2分）
1. `server.js`を削除
2. 新規ファイル`server.js`を作成
3. `express-api-simple.js`の内容を全てコピー＆ペースト

### Step 3: package.json更新（1分）
```json
{
  "name": "sns-video-express-api",
  "version": "1.0.0",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "youtube-dl-exec": "^2.4.0",
    "fluent-ffmpeg": "^2.1.2",
    "archiver": "^5.3.1"
  },
  "engines": {
    "node": "16.x"
  }
}
```

### Step 4: 環境設定（30秒）
`.env`ファイル:
```
PORT=3000
NODE_ENV=production
```

### Step 5: 起動確認（30秒）
- 自動的にインストール・起動
- ログで"Express API Server Started"を確認
- "Show" → "In a New Window"でURLを取得

### 取得URL例
```
https://sns-video-express-api.glitch.me
```

### ヘルスチェック
```bash
curl https://sns-video-express-api.glitch.me/health
# {"status":"ok","message":"Express API Server Running"}
```

## トラブルシューティング
- メモリ不足: 大きな動画は避ける（デモ用）
- タイムアウト: 30秒制限あり
- スリープ: 5分アクセスなしでスリープ（初回アクセス時に起動）

## 完了後の対応
1. Railway UIの環境変数を更新
2. Worker3にURL通知
3. E2Eテスト実行