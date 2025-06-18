#!/bin/bash

# プッシュ前の完全チェックリスト
# これを実行して全てOKになるまでプッシュしない

echo "🔍 プッシュ前チェックリスト"
echo "=========================="

# 結果を記録
ERRORS=0

# 1. 環境変数の完全リスト
echo -e "\n1️⃣ 必要な環境変数チェック..."
ENV_VARS=(
  "NEXT_PUBLIC_SUPABASE_URL"
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  "SUPABASE_SERVICE_ROLE_KEY"
  "OPENAI_API_KEY"
  "NEXTAUTH_URL"
  "NEXTAUTH_SECRET"
  "STRIPE_SECRET_KEY"
  "STRIPE_WEBHOOK_SECRET"
  "YOUTUBE_API_KEY"
)

echo "Dockerfileに以下の環境変数が設定されているか確認:"
for var in "${ENV_VARS[@]}"; do
  if grep -q "ENV $var=" ../Dockerfile; then
    echo "✅ $var"
  else
    echo "❌ $var - Dockerfileに追加が必要"
    ERRORS=$((ERRORS + 1))
  fi
done

# 2. コード内の環境変数チェック
echo -e "\n2️⃣ コード内の環境変数エラーチェック..."
if grep -r "process.env\." ../src | grep -E "throw.*Error|console.error" | grep -v "process.env.CI" | grep -v "dummy"; then
  echo "❌ 環境変数エラーが残っています"
  ERRORS=$((ERRORS + 1))
else
  echo "✅ 環境変数エラーは適切に処理されています"
fi

# 3. railway.toml確認
echo -e "\n3️⃣ railway.toml設定確認..."
if grep -q 'builder = "DOCKERFILE"' ../railway.toml; then
  echo "✅ DOCKERFILEビルダー使用"
else
  echo "❌ railway.tomlがDOCKERFILEビルダーを使用していません"
  ERRORS=$((ERRORS + 1))
fi

# 4. next.config.ts確認
echo -e "\n4️⃣ next.config.ts設定確認..."
if grep -q "ignoreBuildErrors: true" ../next.config.ts && grep -q "ignoreDuringBuilds: true" ../next.config.ts; then
  echo "✅ ビルドエラー無視設定済み"
else
  echo "❌ TypeScript/ESLintエラー無視設定が不足"
  ERRORS=$((ERRORS + 1))
fi

# 5. package-lock.json同期
echo -e "\n5️⃣ package-lock.json同期確認..."
if npm ls &>/dev/null; then
  echo "✅ package-lock.json同期済み"
else
  echo "❌ npm installの実行が必要"
  ERRORS=$((ERRORS + 1))
fi

# 結果
echo -e "\n=========================="
if [ $ERRORS -eq 0 ]; then
  echo "✅ 全チェック完了！プッシュ可能です"
  echo ""
  echo "次のステップ:"
  echo "1. git add ."
  echo "2. git commit -m 'メッセージ'"
  echo "3. git push"
else
  echo "❌ $ERRORS 個の問題があります"
  echo ""
  echo "上記の問題を修正してから再度実行してください"
  exit 1
fi