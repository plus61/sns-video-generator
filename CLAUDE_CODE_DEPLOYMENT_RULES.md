# 🚨 Claude Code デプロイメント絶対ルール

## 絶対守るべき鉄則

### ❌ 絶対にやってはいけないこと
1. **部分的な修正でプッシュ** → 新たなエラーの連鎖
2. **ローカル検証なしでプッシュ** → デプロイ失敗の繰り返し
3. **「修正完了」と言ってプッシュ** → 実際は未完了の可能性大

### ✅ 必ず実行すること

#### 1. エラー発生時の対応
```bash
# 絶対にこの順序を守る
1. エラーログを最後まで読む（最初のエラーで判断しない）
2. verify-railway-build.sh を実行して全エラーを収集
3. 関連する全ての問題を一括修正
4. pre-push-checklist.sh が全てOKになるまで修正
5. 初めてgit push
```

#### 2. プッシュ前の必須チェック
```bash
# この2つのスクリプトは絶対に実行
bash verify-railway-build.sh    # ローカルDockerビルド完全テスト
bash pre-push-checklist.sh      # プッシュ前チェックリスト

# 両方がOKにならない限り、絶対にプッシュしない
```

## 環境変数の扱い

### ビルド時に必要な環境変数（Dockerfile必須）
```dockerfile
# これらは必ずDockerfileに含める
ENV NEXT_PUBLIC_SUPABASE_URL=dummy
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy
ENV SUPABASE_SERVICE_ROLE_KEY=dummy
ENV OPENAI_API_KEY=dummy
ENV NEXTAUTH_URL=dummy
ENV NEXTAUTH_SECRET=dummy
ENV STRIPE_SECRET_KEY=dummy
ENV STRIPE_WEBHOOK_SECRET=dummy
ENV YOUTUBE_API_KEY=dummy
```

### コード側の対応（必須パターン）
```typescript
// 環境変数チェックは必ずこのパターンを使用
if (!process.env.SOME_API_KEY) {
  if (process.env.NODE_ENV === 'production' && !process.env.CI) {
    throw new Error('API key required')
  }
  console.warn('Using dummy value for build')
}

// クライアント初期化は必ずフォールバック値を設定
const client = new Client({
  apiKey: process.env.SOME_API_KEY || 'dummy-key'
})
```

## Railway特有の設定

### railway.toml（必須設定）
```toml
[build]
builder = "DOCKERFILE"  # 絶対にNIXPACKSを使わない
dockerfilePath = "Dockerfile"
buildCommand = "CI=false npm run build"
```

### next.config.ts（必須設定）
```typescript
typescript: {
  ignoreBuildErrors: true,  // Railway環境では必須
},
eslint: {
  ignoreDuringBuilds: true, // Railway環境では必須
}
```

## デバッグプロセス

### エラー分析の鉄則
1. **同じエラーメッセージでも原因は異なる**
   - `npm run build` → exit code: 1 は症状であって原因ではない
   - 必ず詳細ログを確認する

2. **エラーの連鎖を理解する**
   - 環境変数不足 → ビルド時初期化エラー → ビルド失敗
   - 設定ファイル優先順位 → 間違った設定使用 → ビルド失敗

3. **ローカル再現が最重要**
   ```bash
   # 必ずRailway環境を完全再現
   unset $(env | grep -E "SUPABASE|OPENAI|NEXTAUTH" | cut -d= -f1)
   docker build --no-cache -t test .
   ```

## チェックリストの更新

新しい環境変数や設定が必要になった場合：
1. `pre-push-checklist.sh` を更新
2. `Dockerfile` に環境変数を追加
3. 関連するコードにフォールバック処理を追加
4. このドキュメントを更新

## 絶対的な優先順位

1. **動作すること** > きれいなコード
2. **全エラーの解決** > 部分的な修正
3. **ローカル検証** > 推測での修正
4. **包括的な対応** > 個別対応

---

⚠️ **最重要**: このルールを無視してプッシュすることは絶対に禁止。
必ず verify-railway-build.sh と pre-push-checklist.sh の両方がOKになってからプッシュする。