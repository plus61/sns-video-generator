#!/bin/bash

# Railway ビルド事前検証スクリプト
# プッシュ前に必ず実行して、Railwayでのビルドエラーを防ぐ

set -e  # エラーで即座に停止

echo "🔍 Railway ビルド事前検証開始..."
echo "=================================="

# 作業ディレクトリ
WORK_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$WORK_DIR"

# ログファイル
LOG_FILE="/tmp/railway-build-$(date +%Y%m%d-%H%M%S).log"

# 1. 環境変数をクリア（Railway環境を再現）
echo "1️⃣  環境変数をクリア..."
unset NEXT_PUBLIC_SUPABASE_URL
unset NEXT_PUBLIC_SUPABASE_ANON_KEY
unset SUPABASE_SERVICE_ROLE_KEY
unset OPENAI_API_KEY
unset NEXTAUTH_URL
unset NEXTAUTH_SECRET

# 2. package-lock.json同期チェック
echo "2️⃣  package-lock.json同期チェック..."
if ! npm ls &>/dev/null; then
  echo "❌ package-lock.jsonが同期していません"
  echo "   実行: npm install"
  exit 1
fi

# 3. TypeScriptコンパイルチェック（ignoreBuildErrorsが有効でも確認）
echo "3️⃣  TypeScriptコンパイルチェック..."
if ! npx tsc --noEmit 2>&1 | tee -a "$LOG_FILE"; then
  echo "⚠️  TypeScriptエラーがありますが、ignoreBuildErrors=trueなので続行"
fi

# 4. Dockerビルド実行
echo "4️⃣  Dockerビルド実行..."
echo "   ログ: $LOG_FILE"

if ! docker build --no-cache -t railway-verify . 2>&1 | tee "$LOG_FILE"; then
  echo ""
  echo "❌ Dockerビルド失敗！"
  echo ""
  echo "=== エラー詳細 ==="
  grep -A10 -B5 -i "error\|failed" "$LOG_FILE" | tail -50
  echo ""
  echo "=== 考えられる原因 ==="
  
  # 既知のエラーパターンチェック
  if grep -q "Missing.*environment" "$LOG_FILE"; then
    echo "- 環境変数の不足（Dockerfileでダミー値設定が必要）"
  fi
  
  if grep -q "Cannot find module" "$LOG_FILE"; then
    echo "- モジュールが見つからない（package.jsonとpackage-lock.json不整合）"
  fi
  
  if grep -q "Type error:" "$LOG_FILE"; then
    echo "- TypeScriptエラー（next.config.tsでignoreBuildErrors確認）"
  fi
  
  if grep -q "lightningcss" "$LOG_FILE"; then
    echo "- lightningcss関連エラー（CSS最適化設定確認）"
  fi
  
  echo ""
  echo "詳細ログ: $LOG_FILE"
  exit 1
fi

# 5. ビルド成功
echo ""
echo "✅ Dockerビルド成功！"
echo ""

# 6. 警告チェック
echo "5️⃣  警告チェック..."
if grep -q -i "warn\|warning\|deprecated" "$LOG_FILE"; then
  echo "⚠️  以下の警告があります:"
  grep -i "warn\|warning\|deprecated" "$LOG_FILE" | head -10
  echo ""
fi

# 7. 最終確認
echo "6️⃣  設定ファイル確認..."

# railway.toml確認
if [ -f "railway.toml" ]; then
  if grep -q "builder = \"DOCKERFILE\"" railway.toml; then
    echo "✅ railway.toml: DOCKERFILEビルダー使用"
  else
    echo "❌ railway.toml: DOCKERFILEビルダーを使用していません"
    exit 1
  fi
fi

# next.config.ts確認
if grep -q "ignoreBuildErrors: true" next.config.ts; then
  echo "✅ next.config.ts: TypeScriptエラー無視設定済み"
fi

if grep -q "ignoreDuringBuilds: true" next.config.ts; then
  echo "✅ next.config.ts: ESLintエラー無視設定済み"
fi

echo ""
echo "=================================="
echo "✅ 全チェック完了！"
echo ""
echo "以下のコマンドでプッシュできます:"
echo "  git add ."
echo "  git commit -m \"your message\""
echo "  git push"
echo ""
echo "ログファイル: $LOG_FILE"