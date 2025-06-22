# 火曜日：アップロード動作確認チェックリスト

## 🔧 事前準備
- [ ] `npm run dev` でサーバー起動
- [ ] http://localhost:3000 にアクセスできることを確認
- [ ] .env.localファイルが存在することを確認

## 📝 テスト実行手順

### 1. コマンドラインテスト
```bash
cd scripts
node test-upload-actual.js
```

期待される結果：
- ✅ テストファイル作成完了
- ✅ アップロード成功
- ✅ ファイルURLが表示される

### 2. ブラウザテスト
1. http://localhost:3000/upload にアクセス
2. 小さな動画ファイル（10MB以下）を選択
3. アップロードボタンをクリック

確認項目：
- [ ] プログレスバーが表示される
- [ ] 成功メッセージが表示される
- [ ] エラーの場合、分かりやすいメッセージが出る

### 3. Supabase確認
1. Supabaseダッシュボードにログイン
2. Storage > video-uploads バケットを確認
3. アップロードしたファイルが存在することを確認

## ❌ トラブルシューティング

### "supabaseUrl is required" エラー
→ .env.localファイルにSupabase設定を追加：
```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
```

### 401 Unauthorized エラー
→ ブラウザでログインが必要
1. http://localhost:3000/auth/signin にアクセス
2. ログイン後に再試行

### CORS エラー
→ Supabaseダッシュボードで設定確認
1. Storage Settings > CORS configuration
2. localhost:3000 を許可

## ✅ 成功基準
- ファイルがSupabaseに保存される ✓
- 保存されたファイルのURLが取得できる ✓
- エラー時の挙動が確認できる ✓

それ以上は求めない！動けばOK！