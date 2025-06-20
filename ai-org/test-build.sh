#!/bin/bash
# ローカルビルドテスト

echo "🔨 ローカルビルドテスト開始..."

# プロジェクトルートに移動
cd /Users/yuichiroooosuger/sns-video-generator/sns-video-generator

# 環境変数設定
export NODE_ENV=production
export SKIP_ENV_VALIDATION=1
export DISABLE_BULLMQ=true
export NEXT_TELEMETRY_DISABLED=1

# ダミー環境ファイル作成
cat > .env.production << EOF
NEXT_PUBLIC_SUPABASE_URL=https://dummy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy-key
SUPABASE_SERVICE_ROLE_KEY=dummy-key
OPENAI_API_KEY=dummy-key
EOF

echo "📦 依存関係チェック..."
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install --legacy-peer-deps
fi

echo "🏗️ ビルド実行..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ ビルド成功！"
    echo "ビルドアーティファクト:"
    ls -la .next/
else
    echo "❌ ビルド失敗"
    exit 1
fi

# クリーンアップ
rm -f .env.production

echo "✨ テスト完了"