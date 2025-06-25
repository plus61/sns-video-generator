# Railway本番環境テストチェックリスト
Worker3 - 品質保証担当

## 前提条件確認
- [ ] Railway環境にデプロイ済み
- [ ] 環境変数設定完了
- [ ] ヘルスチェック正常

## 基本機能テスト

### 1. APIエンドポイント確認
- [ ] `/api/health` - ヘルスチェック
- [ ] `/api/process-simple` - シンプル処理
- [ ] `/api/process-direct` - 直接処理（Redis/BullMQ不要）
- [ ] `/api/split-simple` - 動画分割

### 2. YouTube動画処理フロー
- [ ] YouTube URL入力受付
- [ ] 動画ダウンロード（youtube-dl-exec）
- [ ] FFmpeg動画分割（0-10秒、10-20秒、20-30秒）
- [ ] ファイル生成と保存

### 3. エラーハンドリング
- [ ] 無効なURL入力時のエラー表示
- [ ] タイムアウト処理（60秒）
- [ ] メモリ制限対応

### 4. パフォーマンステスト
- [ ] 処理時間測定（目標: <30秒）
- [ ] 同時リクエスト処理
- [ ] リソース使用状況

## 統合テストシナリオ

### シナリオ1: 基本的な動画処理
```bash
curl -X POST https://[railway-app].railway.app/api/process-direct \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=jNQXAC9IVRw"}'
```

### シナリオ2: エラー処理確認
```bash
curl -X POST https://[railway-app].railway.app/api/process-direct \
  -H "Content-Type: application/json" \
  -d '{"url": "invalid-url"}'
```

### シナリオ3: ヘルスチェック
```bash
curl https://[railway-app].railway.app/api/health
```

## 環境固有の確認事項

### Railway特有の制限
- [ ] /tmp ディレクトリ使用可能
- [ ] FFmpeg バイナリ存在確認
- [ ] yt-dlp 実行可能確認

### 環境変数
- [ ] RAILWAY_ENVIRONMENT設定確認
- [ ] PORT設定確認
- [ ] その他必要な環境変数

## 品質基準

### 成功基準
- 全APIエンドポイントが200/201を返す
- 動画処理が30秒以内に完了
- エラー時に適切なメッセージを返す

### 失敗基準
- 500エラーの発生
- タイムアウト頻発
- メモリリーク検出

## テスト実行手順

1. **事前準備**
   ```bash
   # Railway URLを環境変数に設定
   export RAILWAY_URL=https://[your-app].railway.app
   ```

2. **自動テスト実行**
   ```bash
   node railway-production-test.js
   ```

3. **結果記録**
   - テスト結果をJSONで保存
   - エラーログの収集
   - パフォーマンスメトリクス記録

## レポート項目
- 実施日時
- テスト環境URL
- 成功/失敗件数
- パフォーマンス統計
- 発見された問題点
- 改善提案