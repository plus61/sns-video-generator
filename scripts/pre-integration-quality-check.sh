#!/bin/bash

# 月曜統合前の最終品質チェックスクリプト
# Worker3による包括的な品質確認

echo "========================================="
echo "🔍 月曜統合前・最終品質チェック"
echo "========================================="
echo ""

# 色定義
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# チェック結果カウンター
PASSED=0
FAILED=0
WARNINGS=0

# チェック関数
check_pass() {
    echo -e "${GREEN}✅ $1${NC}"
    ((PASSED++))
}

check_fail() {
    echo -e "${RED}❌ $1${NC}"
    ((FAILED++))
}

check_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    ((WARNINGS++))
}

echo "1. 環境チェック"
echo "----------------"

# Node.jsバージョン
NODE_VERSION=$(node -v)
if [[ $NODE_VERSION == v18* ]] || [[ $NODE_VERSION == v20* ]]; then
    check_pass "Node.js バージョン: $NODE_VERSION"
else
    check_fail "Node.js バージョン: $NODE_VERSION (18.x or 20.x 推奨)"
fi

# npm/pnpmチェック
if command -v pnpm &> /dev/null; then
    check_pass "pnpm インストール済み"
elif command -v npm &> /dev/null; then
    check_warn "npm使用中 (pnpm推奨)"
else
    check_fail "パッケージマネージャーが見つかりません"
fi

# FFmpegチェック
if command -v ffmpeg &> /dev/null; then
    FFMPEG_VERSION=$(ffmpeg -version | head -n 1)
    check_pass "FFmpeg: $FFMPEG_VERSION"
else
    check_fail "FFmpegがインストールされていません"
fi

# youtube-dl-execチェック
if [ -f "node_modules/youtube-dl-exec/bin/yt-dlp" ]; then
    check_pass "youtube-dl-exec バイナリ確認"
else
    check_warn "youtube-dl-exec バイナリ未確認"
fi

echo ""
echo "2. コード品質チェック"
echo "--------------------"

# TypeScriptコンパイル
echo "TypeScriptコンパイルチェック..."
if npx tsc --noEmit 2>/dev/null; then
    check_pass "TypeScriptコンパイル成功"
else
    check_fail "TypeScriptコンパイルエラー"
fi

# ESLintチェック
echo "ESLintチェック..."
if npm run lint -- --quiet 2>/dev/null; then
    check_pass "ESLint: エラーなし"
else
    check_warn "ESLint: 警告あり"
fi

echo ""
echo "3. APIエンドポイント確認"
echo "----------------------"

# サーバー起動確認
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    check_pass "開発サーバー起動中"
    
    # /api/process-simple エンドポイント
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/process-simple)
    if [ "$RESPONSE" = "200" ]; then
        check_pass "/api/process-simple GET: 200 OK"
    else
        check_fail "/api/process-simple GET: $RESPONSE"
    fi
    
    # /api/health/simple エンドポイント
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health/simple)
    if [ "$RESPONSE" = "200" ]; then
        check_pass "/api/health/simple: 200 OK"
    else
        check_warn "/api/health/simple: $RESPONSE"
    fi
else
    check_warn "開発サーバーが起動していません"
fi

echo ""
echo "4. テストスイート実行"
echo "-------------------"

# 品質テスト
echo "品質テスト実行中..."
if npm test -- __tests__/integration/simple-endpoint-quality.test.ts --passWithNoTests 2>/dev/null; then
    check_pass "品質テスト合格"
else
    check_fail "品質テスト失敗"
fi

# エラーシナリオテスト
echo "エラーシナリオテスト実行中..."
if npm test -- __tests__/integration/error-scenarios.test.ts --passWithNoTests 2>/dev/null; then
    check_pass "エラーシナリオテスト合格"
else
    check_fail "エラーシナリオテスト失敗"
fi

# パフォーマンステスト
echo "パフォーマンステスト実行中..."
if npm test -- __tests__/performance/simple-endpoint-perf.test.ts --passWithNoTests 2>/dev/null; then
    check_pass "パフォーマンステスト合格"
else
    check_warn "パフォーマンステスト警告"
fi

echo ""
echo "5. ビルドチェック"
echo "----------------"

# Next.jsビルド
echo "Next.jsビルドテスト..."
if npm run build 2>/dev/null; then
    check_pass "Next.jsビルド成功"
    
    # ビルドサイズチェック
    BUILD_SIZE=$(du -sh .next | cut -f1)
    echo "  ビルドサイズ: $BUILD_SIZE"
else
    check_fail "Next.jsビルド失敗"
fi

echo ""
echo "6. Railway互換性チェック"
echo "----------------------"

# package.jsonスクリプト確認
if grep -q '"start": "next start"' package.json; then
    check_pass "本番起動スクリプト確認"
else
    check_fail "本番起動スクリプト未設定"
fi

# 環境変数チェック
REQUIRED_ENVS=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_ROLE_KEY"
    "OPENAI_API_KEY"
)

for ENV in "${REQUIRED_ENVS[@]}"; do
    if [ -n "${!ENV}" ]; then
        check_pass "$ENV 設定済み"
    else
        check_warn "$ENV 未設定（.env.localを確認）"
    fi
done

echo ""
echo "7. セキュリティチェック"
echo "-------------------"

# 機密情報の露出チェック
if grep -r "SUPABASE_SERVICE_ROLE_KEY" src/ --exclude-dir=node_modules 2>/dev/null; then
    check_fail "ソースコードに機密情報が含まれています"
else
    check_pass "機密情報の露出なし"
fi

# publicディレクトリチェック
if [ -d "public/temp" ] || [ -d "public/videos" ]; then
    check_warn "publicディレクトリに一時ファイルフォルダ"
else
    check_pass "publicディレクトリクリーン"
fi

echo ""
echo "8. 最終統合準備状況"
echo "-----------------"

# gitステータス
MODIFIED_FILES=$(git status --porcelain | wc -l)
if [ "$MODIFIED_FILES" -eq 0 ]; then
    check_pass "作業ディレクトリクリーン"
else
    check_warn "未コミットの変更: $MODIFIED_FILES ファイル"
fi

# 最新コミット
LAST_COMMIT=$(git log -1 --oneline)
echo "  最新コミット: $LAST_COMMIT"

echo ""
echo "========================================="
echo "📊 最終品質チェック結果"
echo "========================================="
echo -e "${GREEN}✅ 合格: $PASSED${NC}"
echo -e "${YELLOW}⚠️  警告: $WARNINGS${NC}"
echo -e "${RED}❌ 失敗: $FAILED${NC}"
echo ""

# 総合判定
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 月曜統合の準備が整いました！${NC}"
    exit 0
else
    echo -e "${RED}⚠️  統合前に失敗項目の修正が必要です${NC}"
    exit 1
fi