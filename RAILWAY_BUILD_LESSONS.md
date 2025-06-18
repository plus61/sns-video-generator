# Railway ビルドエラーの教訓

## 重要な発見：同じエラーメッセージでも原因が異なる

### エラーの連鎖
```
npm run build -> exit code: 1
```

このエラーメッセージは同じでも、実際の原因は：

1. **railway.tomlのビルダー設定** → NIXPACKSがDockerfileを無視
2. **Supabase環境変数不足** → Next.jsビルド時のページデータ収集でエラー
3. **OpenAI API環境変数不足** → 同じくビルド時の初期化エラー

### 根本的な問題
**Next.js 15のビルドプロセスがAPIルートを評価する**
- ビルド時にページデータを収集
- 環境変数に依存するコードが実行される
- 環境変数がないとエラーで停止

## 効率的な診断方法

### 1. ローカルでの完全再現
```bash
# 環境変数をクリア
unset $(env | grep -E "SUPABASE|OPENAI|NEXTAUTH" | cut -d= -f1)

# Dockerビルド実行
docker build --no-cache -t test . 2>&1 | tee build.log

# エラー詳細を確認
grep -E "Error:|failed" build.log
```

### 2. 段階的修正の回避
- **NG**: エラー修正 → プッシュ → 新エラー → 修正 → プッシュ
- **OK**: 全エラー収集 → 一括修正 → 検証 → プッシュ

### 3. 環境変数の包括的対応
```dockerfile
# ビルド時に必要な全ての環境変数をダミー値で設定
ENV NEXT_PUBLIC_SUPABASE_URL=dummy
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy
ENV SUPABASE_SERVICE_ROLE_KEY=dummy
ENV OPENAI_API_KEY=dummy
ENV NEXTAUTH_URL=dummy
ENV NEXTAUTH_SECRET=dummy
```

## 予防策

### 1. コードの防御的実装
```typescript
// ビルド時のエラーを回避
if (!process.env.SOME_API_KEY) {
  if (process.env.NODE_ENV === 'production' && !process.env.CI) {
    throw new Error('API key required')
  }
  console.warn('Using dummy value for build')
}

const client = new Client({
  apiKey: process.env.SOME_API_KEY || 'dummy-key'
})
```

### 2. ビルド検証スクリプト
- verify-railway-build.sh を必ず実行
- 全ての環境変数エラーを事前に発見
- プッシュ前の完全検証

### 3. エラーログの詳細確認
- 最初のエラーで判断しない
- ログ全体を確認
- 根本原因を特定してから修正

## まとめ
**「修正完了」と判断する前に、必ずローカルで完全なビルドが成功することを確認する**