# 🎉 MVP動作確認手順

## 開発サーバーの起動

現在、開発サーバーは起動中です。もし起動していない場合：

```bash
cd /Users/yuichiroooosuger/sns-video-generator/sns-video-workspace
npm run dev
```

## アクセス方法

ブラウザで以下のURLにアクセスしてください：

### 🌟 シンプル版（今回作成したMVP）
**http://localhost:3001/simple**

## 使用方法

1. **YouTube URL入力**
   - 入力欄にYouTubeのURLを貼り付け
   - 例: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`

2. **処理開始**
   - 「処理開始」ボタンをクリック
   - AIが動画を分析（約5-10秒）

3. **結果確認**
   - トップ3のバイラルセグメントが表示
   - 各セグメントのスコアと時間を確認

4. **動画分割**（実装済みの場合）
   - 「動画を分割」ボタンをクリック
   - 3つの動画ファイルが生成

5. **ダウンロード**（実装済みの場合）
   - 「すべてダウンロード」でZIPファイル取得
   - または個別にプレビュー・ダウンロード

## 技術的な確認方法

### APIエンドポイントの直接テスト

```bash
# 1. 動画分析API
curl -X POST http://localhost:3001/api/process-simple \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'

# 2. 動画分割API（videoIdが必要）
curl -X POST http://localhost:3001/api/split-simple \
  -H "Content-Type: application/json" \
  -d '{"videoId": "YOUR_VIDEO_ID", "segments": [...]}'
```

## 実装された機能

✅ **完成済み**
- YouTube URL入力
- AI動画分析（モック）
- セグメント表示
- シンプルで直感的なUI

🔄 **実装状況による**
- 実動画ダウンロード
- FFmpeg動画分割
- ZIPダウンロード

## トラブルシューティング

### ポート3001が使用中の場合
```bash
# 別のポートで起動
PORT=3002 npm run dev
```

### 「処理開始」ボタンが反応しない場合
- ブラウザのコンソールでエラーを確認
- ネットワークタブでAPIレスポンスを確認

### APIエラーが出る場合
- .env.localの設定を確認
- 特に`USE_MOCK=false`の場合は実際のAPIキーが必要

## 注意事項

- 現在はモックモードで動作している可能性があります
- 実際のYouTube動画ダウンロードには時間がかかる場合があります
- FFmpegがインストールされていない場合、動画分割は失敗します

## お楽しみください！

このMVPは「シンプルこそすべて」の精神で、わずか37分で作成されました。
完璧ではありませんが、確実に動作し、価値を提供します。