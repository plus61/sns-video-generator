# Railway ビルド検証プロセス

## 問題
コミット・プッシュ → エラー → 修正 → コミット・プッシュ → また別のエラー
この無駄なサイクルを防ぐ必要がある。

## 提案する新しいプロセス

### 1. ローカル完全検証（プッシュ前）

```bash
# Railway環境を完全に再現してテスト
cd /path/to/project

# Step 1: 環境変数をクリア
unset NEXT_PUBLIC_SUPABASE_URL
unset NEXT_PUBLIC_SUPABASE_ANON_KEY
unset SUPABASE_SERVICE_ROLE_KEY

# Step 2: Dockerビルドを実行
docker build -t railway-test . 2>&1 | tee railway-build.log

# Step 3: ビルド成功確認
if [ $? -eq 0 ]; then
  echo "✅ ビルド成功"
else
  echo "❌ ビルド失敗 - railway-build.logを確認"
  exit 1
fi

# Step 4: コンテナ起動テスト
docker run --rm -p 3000:3000 railway-test
```

### 2. エラーパターンの事前チェック

```bash
# 既知のエラーパターンをチェック
grep -E "Missing.*environment|Cannot find module|Type error:|Failed to compile" railway-build.log
```

### 3. 段階的修正アプローチ

1. **全エラー収集**: 最初のエラーで止めず、可能な限り全てのエラーを収集
2. **一括修正**: 関連する全ての問題を一度に修正
3. **完全検証**: ローカルで完全なビルドが成功するまでプッシュしない

### 4. チェックリスト

プッシュ前に必ず確認：
- [ ] ローカルDockerビルド成功
- [ ] 環境変数なしでのビルド成功
- [ ] TypeScriptコンパイル成功
- [ ] ESLintエラーなし（またはignore設定済み）
- [ ] package-lock.json同期済み
- [ ] railway.tomlがDOCKERFILEビルダー使用

## 実装するスクリプト

```bash
#!/bin/bash
# verify-railway-build.sh

echo "🔍 Railway ビルド事前検証開始..."

# 環境変数クリア
echo "1️⃣ 環境変数をクリア..."
unset $(env | grep -E "SUPABASE|NEXT_PUBLIC" | cut -d= -f1)

# Dockerビルド
echo "2️⃣ Dockerビルド実行..."
if ! docker build -t railway-verify . 2>&1 | tee /tmp/railway-build.log; then
  echo "❌ Dockerビルド失敗"
  echo "エラー詳細:"
  grep -A5 -B5 "error\|Error\|ERROR" /tmp/railway-build.log
  exit 1
fi

echo "3️⃣ ビルド成功！"

# 既知の問題チェック
echo "4️⃣ 潜在的な問題をチェック..."
if grep -q "warn\|warning\|deprecated" /tmp/railway-build.log; then
  echo "⚠️  警告が見つかりました:"
  grep "warn\|warning\|deprecated" /tmp/railway-build.log
fi

echo "✅ 全チェック完了 - プッシュ可能です"
```

## 結論

この検証プロセスにより：
1. 無駄なコミット・プッシュを削減
2. Railway環境での問題を事前に発見
3. 効率的な問題解決が可能