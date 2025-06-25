# SNS Video Generator - トラブルシューティングガイド

## 一般的な問題と解決方法

### 1. ビルドエラー

#### 症状: ".next directory not found"
**原因**: Dockerビルド時にファイルが正しくコピーされていない
**解決方法**:
- `Dockerfile.simple`を使用（単一ステージビルド）
- railway.tomlで`dockerfilePath = "Dockerfile.simple"`を指定

#### 症状: "Module not found"
**原因**: 依存関係の不足
**解決方法**:
```bash
npm install --legacy-peer-deps
npm run build
```

### 2. 起動エラー

#### 症状: "ECONNREFUSED"
**原因**: 環境変数が正しく設定されていない
**解決方法**:
- Railway ダッシュボードで環境変数を確認
- 特に`NEXT_PUBLIC_SUPABASE_URL`と`NEXT_PUBLIC_SUPABASE_ANON_KEY`

#### 症状: ヘルスチェック失敗
**原因**: アプリケーションが正しく起動していない
**解決方法**:
1. ログを確認して具体的なエラーを特定
2. `/api/health/simple-health`エンドポイントの実装を確認
3. ポート3000が正しく公開されているか確認

### 3. API エラー

#### 症状: 500 Internal Server Error
**原因**: 複数の可能性あり
**デバッグ手順**:
1. `/api/debug`エンドポイントでシステム状態を確認
2. Railway ログでスタックトレースを確認
3. 環境変数の欠落をチェック

#### 症状: YouTube ダウンロード失敗
**原因**: youtube-dl-exec または ytdl-core の問題
**解決方法**:
- Express API サーバー（別途デプロイ）を使用
- 代替実装に切り替え

### 4. パフォーマンス問題

#### 症状: レスポンスが遅い
**原因**: メモリ不足またはCPU制限
**解決方法**:
1. Railway ダッシュボードでリソース使用状況を確認
2. インスタンスサイズをアップグレード
3. 不要なプロセスを削除

#### 症状: メモリリーク
**原因**: FFmpegプロセスの未終了
**解決方法**:
- プロセス管理コードを確認
- `cleanup`関数が正しく実装されているか確認

### 5. Supabase 接続問題

#### 症状: "fetch failed"
**原因**: ネットワークまたは認証の問題
**解決方法**:
1. Supabase URLが正しいか確認（HTTPSであること）
2. APIキーが有効か確認
3. RLS（Row Level Security）ポリシーを確認

### 6. 認証エラー

#### 症状: ログインできない
**原因**: NextAuth設定の問題
**解決方法**:
- `NEXTAUTH_URL`が本番URLと一致しているか確認
- `NEXTAUTH_SECRET`が設定されているか確認
- OAuthプロバイダーの設定を確認

## デバッグツール

### ログの確認方法
```bash
# Railway CLI を使用
railway logs

# または Railway ダッシュボードで確認
```

### 環境変数の確認
```bash
# デバッグエンドポイントを使用
curl https://your-app.railway.app/api/debug
```

### ヘルスチェック
```bash
# 基本的なヘルスチェック
curl https://your-app.railway.app/api/health/simple-health

# 詳細なシステム状態
curl https://your-app.railway.app/api/test-basic
```

## 緊急時の対応手順

### 1. サービスダウン時
1. Railway ログを確認
2. 最後の正常なデプロイにロールバック
3. 環境変数の変更履歴を確認

### 2. データベース接続エラー
1. Supabase ダッシュボードで状態確認
2. 接続プールの状態を確認
3. 必要に応じて接続をリセット

### 3. 外部API連携エラー
1. API キーの有効期限を確認
2. レート制限に達していないか確認
3. APIプロバイダーのステータスページを確認

## よくある質問（FAQ）

**Q: デプロイ後、アプリケーションが起動しない**
A: railway.tomlとDockerfile.simpleが正しく設定されているか確認してください。

**Q: 環境変数を変更したが反映されない**
A: Railwayは自動的に再デプロイしますが、数分かかる場合があります。

**Q: ファイルアップロードが失敗する**
A: `/tmp`ディレクトリの権限と、ディスク容量を確認してください。

## サポート情報

### 内部サポート
- Worker1: 技術サポート・インフラ担当
- Worker2: UI/UX・フロントエンド担当
- Worker3: テスト・品質保証担当

### 外部リソース
- [Railway Documentation](https://docs.railway.app)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Supabase Troubleshooting](https://supabase.com/docs/guides/troubleshooting)