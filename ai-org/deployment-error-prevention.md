# Railway デプロイエラー防止策

## 発生したエラー
```
Error: Could not find a production build in the '.next' directory
```

## 根本原因
1. railway-build.sh でビルドが失敗しても続行するようにしていた
2. その結果、`.next` ディレクトリが作成されずに起動しようとした
3. Next.js がビルドアーティファクトを見つけられず失敗

## 実施した修正

### 1. Dockerfile.railway の修正
```dockerfile
# 修正前（問題あり）
RUN chmod +x scripts/railway-build.sh && ./scripts/railway-build.sh

# 修正後（正しい）
RUN npm run build && echo "Build completed successfully"
RUN ls -la .next/ && ls -la .next/standalone/
```

### 2. 起動コマンドの統一
- Dockerfile と railway.toml で `npm start` を使用

## 再発防止策

### 1. ビルド検証の追加
```dockerfile
# ビルド後に必ず確認
RUN ls -la .next/ && ls -la .next/standalone/
```

### 2. ローカルテストの徹底
```bash
# デプロイ前に必ず実行
./scripts/test-railway-build.sh
```

### 3. エラーハンドリングの改善
- ビルドスクリプトでエラー時は必ず失敗させる
- `|| true` を使わない
- 明示的なエラーチェック

### 4. デプロイ前チェックリスト
- [ ] ローカルでビルド成功を確認
- [ ] `.next` ディレクトリの存在確認
- [ ] Docker ビルドテスト実行
- [ ] ヘルスチェックパスの確認

## テストコマンド
```bash
# ローカルでの完全テスト
docker build -f Dockerfile.railway -t test . && \
docker run -p 3000:3000 -e PORT=3000 test
```

## 監視ポイント
1. Railway ビルドログで `npm run build` の成功確認
2. `.next` ディレクトリの作成確認
3. ヘルスチェックの成功確認

この対策により、ビルド失敗時は即座にエラーとなり、不完全なデプロイを防止できます。