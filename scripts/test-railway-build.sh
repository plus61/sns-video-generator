#!/bin/bash
# ローカルで Railway ビルドをテストするスクリプト

echo "🧪 Railway ビルドのローカルテスト開始..."
echo "================================"

# 色付きの出力用
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 現在のディレクトリを保存
ORIGINAL_DIR=$(pwd)

# プロジェクトルートに移動
cd /Users/yuichiroooosuger/sns-video-generator/sns-video-generator

# 1. Docker ビルドテスト
echo -e "\n${YELLOW}1. Docker ビルドテスト${NC}"
echo "Testing Dockerfile.railway..."

docker build -f Dockerfile.railway -t railway-test . 2>&1 | tee build.log

if [ ${PIPESTATUS[0]} -eq 0 ]; then
    echo -e "${GREEN}✅ Docker ビルド成功！${NC}"
else
    echo -e "${RED}❌ Docker ビルド失敗${NC}"
    echo "エラーログ:"
    grep -E "ERROR|error|Error" build.log
    exit 1
fi

# 2. ローカルビルドテスト
echo -e "\n${YELLOW}2. ローカルビルドテスト${NC}"

# 環境変数設定
export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1
export SKIP_ENV_VALIDATION=1
export DISABLE_BULLMQ=true

# ダミー環境ファイル作成
cat > .env.test << EOF
NEXT_PUBLIC_SUPABASE_URL=https://dummy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy-key
SUPABASE_SERVICE_ROLE_KEY=dummy-key
OPENAI_API_KEY=dummy-key
EOF

# ビルド実行
echo "Running npm run build..."
npm run build 2>&1 | tee local-build.log

if [ ${PIPESTATUS[0]} -eq 0 ]; then
    echo -e "${GREEN}✅ ローカルビルド成功！${NC}"
else
    echo -e "${RED}❌ ローカルビルド失敗${NC}"
    echo "エラーログ:"
    grep -E "error|Error|Failed" local-build.log | head -20
fi

# 3. チェックリスト
echo -e "\n${YELLOW}3. デプロイ前チェックリスト${NC}"

# package-lock.json の存在確認
if [ -f "package-lock.json" ]; then
    echo -e "${GREEN}✅ package-lock.json が存在${NC}"
else
    echo -e "${RED}❌ package-lock.json が見つかりません${NC}"
fi

# 必要なファイルの確認
files_to_check=(
    "next.config.mjs"
    "tsconfig.json"
    "server.js"
    "Dockerfile.railway"
    "railway.toml"
)

for file in "${files_to_check[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file が存在${NC}"
    else
        echo -e "${RED}❌ $file が見つかりません${NC}"
    fi
done

# 4. 環境変数チェック
echo -e "\n${YELLOW}4. Railway 環境変数チェック${NC}"
echo "以下の環境変数を Railway ダッシュボードで設定してください:"
echo "- NEXT_PUBLIC_SUPABASE_URL"
echo "- NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "- SUPABASE_SERVICE_ROLE_KEY"
echo "- OPENAI_API_KEY"
echo "- DATABASE_URL (optional)"
echo "- REDIS_URL (optional)"

# クリーンアップ
rm -f .env.test build.log local-build.log

# 元のディレクトリに戻る
cd "$ORIGINAL_DIR"

echo -e "\n${GREEN}テスト完了！${NC}"
echo "問題がなければ、git push して Railway にデプロイしてください。"