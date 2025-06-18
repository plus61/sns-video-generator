#!/bin/bash
# verify-fix.sh - 修正検証スクリプト

# 色付き出力
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 検証結果の記録
VERIFICATION_LOG="./logs/verification-$(date +%Y%m%d-%H%M%S).log"
mkdir -p ./logs

# ログ出力関数
log() {
    echo -e "$1" | tee -a "$VERIFICATION_LOG"
}

# セクションヘッダー
section() {
    log "\n${BLUE}=== $1 ===${NC}"
}

# 成功/失敗メッセージ
success() {
    log "${GREEN}✅ $1${NC}"
}

error() {
    log "${RED}❌ $1${NC}"
    ERRORS=$((ERRORS + 1))
}

warning() {
    log "${YELLOW}⚠️  $1${NC}"
}

# エラーカウンター
ERRORS=0

# 検証開始
log "${BLUE}🔍 SNS Video Generator 修正検証開始 - $(date)${NC}"

# 1. Git状態確認
section "Git状態確認"
cd ..
LATEST_COMMIT=$(git log -1 --format="%H %s")
log "最新コミット: $LATEST_COMMIT"

if git diff --quiet; then
    success "作業ディレクトリはクリーン"
else
    warning "未コミットの変更があります"
fi

# 2. package-lock.json同期チェック
section "package-lock.json同期チェック"
if npm ci --dry-run > /dev/null 2>&1; then
    success "package-lock.jsonは同期されています"
else
    error "package-lock.jsonが同期されていません"
    log "修正方法: npm install を実行してpackage-lock.jsonを更新"
fi

# 3. 依存関係チェック
section "依存関係チェック"
if grep -q '"youtube-dl-exec"' package.json; then
    if grep -q '"youtube-dl-exec"' package-lock.json; then
        success "youtube-dl-execは正しく記録されています"
    else
        error "youtube-dl-execがpackage-lock.jsonに記録されていません"
    fi
else
    warning "youtube-dl-execがpackage.jsonに存在しません"
fi

# 4. Dockerfile設定チェック
section "Dockerfile設定チェック"
if [ -f Dockerfile ]; then
    if grep -q "omit=optional" Dockerfile; then
        error "Dockerfileに--omit=optionalフラグが残っています"
        grep -n "omit=optional" Dockerfile | while read line; do
            log "  Line: $line"
        done
    else
        success "Dockerfileから--omit=optionalフラグが削除されています"
    fi
    
    # 環境変数チェック
    if grep -q "USE_MOCK_DOWNLOADER=true" Dockerfile; then
        success "USE_MOCK_DOWNLOADER環境変数が設定されています"
    else
        warning "USE_MOCK_DOWNLOADER環境変数が設定されていません"
    fi
else
    error "Dockerfileが見つかりません"
fi

# 5. ビルドテスト
section "ローカルビルドテスト"
log "ビルドを実行中..."
if npm run build > build-test.log 2>&1; then
    success "ローカルビルドが成功しました"
    rm -f build-test.log
else
    error "ローカルビルドが失敗しました"
    log "エラーログ:"
    tail -20 build-test.log | tee -a "$VERIFICATION_LOG"
fi

# 6. 環境変数チェック
section "環境変数チェック"
REQUIRED_ENV_VARS=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_ROLE_KEY"
    "OPENAI_API_KEY"
    "NEXTAUTH_URL"
    "NEXTAUTH_SECRET"
)

for var in "${REQUIRED_ENV_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        warning "$var が設定されていません"
    else
        success "$var が設定されています"
    fi
done

# 7. 互換性レイヤーチェック
section "互換性レイヤーチェック"
COMPAT_FILES=(
    "src/lib/compatibility-layer.ts"
    "src/lib/video-processor-vercel.ts"
    "src/lib/youtube-downloader.ts"
)

for file in "${COMPAT_FILES[@]}"; do
    if [ -f "$file" ]; then
        success "$file が存在します"
    else
        error "$file が見つかりません"
    fi
done

# 8. Dockerビルドテスト（Dockerが利用可能な場合）
if command -v docker &> /dev/null; then
    section "Dockerビルドテスト"
    log "Dockerイメージをビルド中..."
    if docker build -t sns-video-test-verify . > docker-build.log 2>&1; then
        success "Dockerビルドが成功しました"
        docker rmi sns-video-test-verify > /dev/null 2>&1
        rm -f docker-build.log
    else
        error "Dockerビルドが失敗しました"
        log "エラーログ:"
        tail -20 docker-build.log | tee -a "$VERIFICATION_LOG"
    fi
else
    warning "Dockerが利用できないため、Dockerビルドテストをスキップしました"
fi

# 9. TypeScriptコンパイルチェック
section "TypeScriptコンパイルチェック"
if npx tsc --noEmit > tsc-check.log 2>&1; then
    success "TypeScriptコンパイルエラーはありません"
    rm -f tsc-check.log
else
    warning "TypeScriptコンパイルエラーがあります"
    head -20 tsc-check.log | tee -a "$VERIFICATION_LOG"
fi

# 結果サマリー
section "検証結果サマリー"
log "\n検証完了時刻: $(date)"
log "エラー数: $ERRORS"

if [ $ERRORS -eq 0 ]; then
    log "${GREEN}🎉 すべての検証が成功しました！${NC}"
    log "\n次のステップ:"
    log "1. git add -A && git commit -m 'Your message'"
    log "2. git push origin main"
    log "3. Railway/Vercelのビルド結果を確認"
else
    log "${RED}⚠️  $ERRORS 個のエラーが検出されました${NC}"
    log "\n上記のエラーを修正してから再度検証を実行してください"
fi

log "\n詳細ログ: $VERIFICATION_LOG"

# ai-orgディレクトリに戻る
cd ai-org

exit $ERRORS