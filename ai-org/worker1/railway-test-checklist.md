# Railway本番環境テストチェックリスト

## 1. ビルド&デプロイメント確認 ✅
- [x] `npm run build` 成功
- [x] TypeScriptエラー: ゼロ
- [x] 必要パッケージ: インストール済み
- [ ] Railway デプロイ: 未実施

## 2. APIエンドポイントテスト項目

### 基本ヘルスチェック
- [ ] `/api/health` - 総合ヘルスチェック
- [ ] `/api/health/simple` - シンプルヘルスチェック
- [ ] `/api/health/minimal` - 最小ヘルスチェック

### YouTube動画ダウンロード
- [ ] `/api/download-video` - YouTube動画ダウンロード
- [ ] `/api/upload-youtube-simple` - シンプルYouTubeアップロード

### 動画処理
- [ ] `/api/split-simple` - 動画分割
- [ ] `/api/process-simple` - 動画処理
- [ ] `/api/analyze-simple` - AI解析

### ストレージ
- [ ] Supabase Storage バケット動作確認
- [ ] ファイルアップロード/ダウンロード

## 3. 環境変数確認
- [ ] NEXT_PUBLIC_SUPABASE_URL
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
- [ ] SUPABASE_SERVICE_ROLE_KEY
- [ ] OPENAI_API_KEY
- [ ] REDIS_URL (Railway提供)

## 4. 外部サービス統合
- [ ] Supabase Database接続
- [ ] OpenAI API接続
- [ ] Redis Queue (BullMQ)動作

## 5. パフォーマンステスト
- [ ] 応答時間測定
- [ ] メモリ使用量確認
- [ ] エラーレート確認

## 次のステップ
1. Railway へのデプロイメント実施
2. 各APIエンドポイントの動作確認
3. エラーログの収集と分析
4. パフォーマンスメトリクスの測定