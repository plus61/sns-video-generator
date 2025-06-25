#!/bin/bash

# Railway環境でのyoutube-dl-exec/FFmpeg対応スクリプト

echo "========================================="
echo "🚂 Railway環境対応修正スクリプト"
echo "========================================="
echo ""

# 色定義
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "1. FFmpegパス対応"
echo "-----------------"

# simple-video-splitter.tsのパス修正
SPLITTER_FILE="src/lib/simple-video-splitter.ts"

if [ -f "$SPLITTER_FILE" ]; then
    echo -e "${YELLOW}修正前のFFmpegパス:${NC}"
    grep "ffmpegPath = " "$SPLITTER_FILE" | head -1
    
    # バックアップ作成
    cp "$SPLITTER_FILE" "${SPLITTER_FILE}.backup"
    
    # Railway環境対応の追加
    cat > railway-ffmpeg-fix.patch << 'EOF'
    // 動画の長さを取得（FFmpeg直接パス指定）
-    const ffmpegPath = '/opt/homebrew/bin/ffmpeg'
-    const ffprobePath = '/opt/homebrew/bin/ffprobe'
+    const isRailway = process.env.RAILWAY_ENVIRONMENT === 'production'
+    const ffmpegPath = isRailway ? '/usr/bin/ffmpeg' : '/opt/homebrew/bin/ffmpeg'
+    const ffprobePath = isRailway ? '/usr/bin/ffprobe' : '/opt/homebrew/bin/ffprobe'
EOF
    
    echo -e "${GREEN}✅ パッチファイル作成${NC}"
    echo ""
else
    echo "❌ $SPLITTER_FILE が見つかりません"
fi

echo "2. ヘルスチェックエンドポイント"
echo "-----------------------------"

HEALTH_DIR="src/app/api/health"
HEALTH_FILE="$HEALTH_DIR/route.ts"

if [ ! -f "$HEALTH_FILE" ]; then
    mkdir -p "$HEALTH_DIR"
    cat > "$HEALTH_FILE" << 'EOF'
import { NextResponse } from 'next/server'

export async function GET() {
  const environment = process.env.RAILWAY_ENVIRONMENT || 'local'
  const nodeEnv = process.env.NODE_ENV || 'development'
  
  // 基本的なヘルスチェック
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment,
    nodeEnv,
    version: process.env.npm_package_version || '0.1.0',
    
    // Railway固有情報
    railway: {
      projectId: process.env.RAILWAY_PROJECT_ID || null,
      environment: process.env.RAILWAY_ENVIRONMENT || null,
      region: process.env.RAILWAY_REGION || null,
    },
    
    // 依存関係チェック
    dependencies: {
      ffmpeg: await checkFFmpeg(),
      youtubeDl: await checkYoutubeDl(),
    }
  }
  
  return NextResponse.json(health)
}

async function checkFFmpeg(): Promise<boolean> {
  try {
    const { exec } = require('child_process')
    const { promisify } = require('util')
    const execAsync = promisify(exec)
    
    const ffmpegPath = process.env.RAILWAY_ENVIRONMENT === 'production' 
      ? '/usr/bin/ffmpeg' 
      : '/opt/homebrew/bin/ffmpeg'
    
    await execAsync(`${ffmpegPath} -version`)
    return true
  } catch {
    return false
  }
}

async function checkYoutubeDl(): Promise<boolean> {
  try {
    // youtube-dl-exec の存在確認
    require.resolve('youtube-dl-exec')
    return true
  } catch {
    return false
  }
}
EOF
    echo -e "${GREEN}✅ ヘルスチェックエンドポイント作成${NC}"
else
    echo -e "${YELLOW}ヘルスチェックは既に存在します${NC}"
fi

echo ""
echo "3. Railway設定ファイル確認"
echo "------------------------"

if [ ! -f "railway.toml" ]; then
    cat > railway.toml << 'EOF'
[build]
builder = "NIXPACKS"
buildCommand = "npm run build"
nixpacksPlan = """
[phases.setup]
nixPkgs = ['ffmpeg', 'python38']
"""

[deploy]
startCommand = "npm start"
healthcheckPath = "/api/health"
healthcheckTimeout = 300
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3

[service]
internalPort = 3000
EOF
    echo -e "${GREEN}✅ railway.toml 作成${NC}"
else
    echo -e "${YELLOW}railway.toml は既に存在します${NC}"
fi

echo ""
echo "4. 環境変数設定スクリプト"
echo "----------------------"

cat > set-railway-env.sh << 'EOF'
#!/bin/bash

# Railway環境変数設定ヘルパー

echo "Railway環境変数を設定します..."

# 必須環境変数のリスト
REQUIRED_VARS=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_ROLE_KEY"
    "OPENAI_API_KEY"
    "NEXTAUTH_URL"
    "NEXTAUTH_SECRET"
)

echo "以下の環境変数を設定してください:"
echo ""

for VAR in "${REQUIRED_VARS[@]}"; do
    echo "railway variables set $VAR=<your-value>"
done

echo ""
echo "例:"
echo "railway variables set NEXTAUTH_URL=https://your-app.railway.app"
EOF

chmod +x set-railway-env.sh
echo -e "${GREEN}✅ 環境変数設定スクリプト作成${NC}"

echo ""
echo "========================================="
echo "📋 対応完了項目"
echo "========================================="
echo -e "${GREEN}✅${NC} FFmpegパス修正パッチ作成"
echo -e "${GREEN}✅${NC} ヘルスチェックエンドポイント"
echo -e "${GREEN}✅${NC} railway.toml設定"
echo -e "${GREEN}✅${NC} 環境変数設定ヘルパー"
echo ""
echo "次のステップ:"
echo "1. パッチを適用: patch $SPLITTER_FILE < railway-ffmpeg-fix.patch"
echo "2. 環境変数設定: ./set-railway-env.sh"
echo "3. デプロイ: railway up"
echo ""