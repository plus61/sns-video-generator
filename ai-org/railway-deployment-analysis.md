# Railway デプロイメント問題分析

## 現在の状況
- **症状**: `.next` ディレクトリが見つからないエラーが継続
- **確認事項**: ビルドは成功しているが、実行時にファイルが存在しない

## 私が確実視した点と実際のギャップ

### 確実視した点（誤り）
1. `npm run build` を実行すれば `.next` が作成される
2. `ls -la .next/` で確認すれば存在を保証できる
3. `npm prune --production` の後も `.next` は残る

### 実際の問題の可能性
1. **ユーザー権限問題**: nextjs ユーザーに切り替えた後、`.next` にアクセスできない
2. **ワーキングディレクトリ問題**: 実行時のディレクトリが違う
3. **npm prune の影響**: production モードで必要なファイルが削除されている
4. **Next.js スタンドアロンモード**: 通常の `.next` ではなく別の場所を見ている

## 確実に問題を解決するために必要な情報

### 1. Railway ビルドログの詳細
- `npm run build` の完全な出力
- どのファイルが生成されたか
- エラーや警告メッセージ

### 2. Docker コンテナ内の実際の状態
```bash
# ビルド後のファイル構造
RUN ls -la /app/
RUN ls -la /app/.next/ || echo ".next not found"
RUN ls -la /app/.next/standalone/ || echo "standalone not found"
```

### 3. 実行時の環境
- 実際のワーキングディレクトリ
- 実行ユーザーの権限
- 環境変数の状態

## 推奨される診断用 Dockerfile

```dockerfile
# 診断用のコマンドを追加
RUN echo "=== Build stage ===" && \
    npm run build && \
    echo "=== After build ===" && \
    ls -la && \
    ls -la .next/ && \
    echo "=== Build ID ===" && \
    cat .next/BUILD_ID

# 権限問題の診断
RUN echo "=== Permission check ===" && \
    ls -la .next/ && \
    whoami

# ユーザー切り替え後の確認
USER nextjs
RUN echo "=== As nextjs user ===" && \
    whoami && \
    ls -la /app/.next/ || echo "Cannot access .next"
```

## 最も可能性の高い解決策

### 1. スタンドアロンモードを使用
```dockerfile
# スタンドアロンサーバーを直接実行
CMD ["node", ".next/standalone/server.js"]
```

### 2. 権限問題の解決
```dockerfile
# ビルド後、ユーザー切り替え前に権限設定
RUN chown -R nextjs:nodejs /app/.next
```

### 3. シンプルな起動方法
```dockerfile
# rootユーザーのまま実行（セキュリティリスクあり、テスト用）
# USER nextjs をコメントアウト
CMD ["npm", "start"]
```