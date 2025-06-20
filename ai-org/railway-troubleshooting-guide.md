# Railway トラブルシューティングガイド

## 確実に問題を解決するために必要な情報

### 1. Railway ビルドログから確認すべき項目

#### a) ビルド成功の確認
```
✓ Generating static pages (39/39)
✓ Collecting build traces
✓ Build completed successfully
```

#### b) スタンドアロン生成の確認
```
Creating an optimized production build ...
output: standalone
```

#### c) ビルドアーティファクトの確認
Railway のビルドログで以下を探す：
- `.next/BUILD_ID` が作成されているか
- `.next/standalone/server.js` が存在するか
- エラーメッセージや警告

### 2. Railway ダッシュボードで確認すべき設定

#### 環境変数
必須：
- `PORT` (Railway が自動設定)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`

#### デプロイ設定
- Start Command が正しいか
- ヘルスチェックの設定
- ワーキングディレクトリ

### 3. 実装した解決策

#### 解決策 A: スタンドアロンモード（推奨）
- Dockerfile.railway.standalone を使用
- Next.js のスタンドアロンサーバーを直接実行
- ワーキングディレクトリを `.next/standalone` に変更

#### 解決策 B: デバッグモード
- 詳細なログ出力を追加
- 権限問題の診断
- ファイル存在確認

### 4. 最終確認チェックリスト

- [ ] ローカルで `npm run build` が成功する
- [ ] `.next/standalone/server.js` が生成される
- [ ] Docker ビルドが成功する
- [ ] Railway の環境変数が設定されている
- [ ] ビルドログにエラーがない

## 問題が解決しない場合

Railway のサポートに以下の情報を提供：
1. ビルドログの全文
2. デプロイログの全文
3. package.json と next.config.mjs
4. Dockerfile の内容