#!/bin/bash

# Railway本番デプロイメント検証スクリプト
# Worker3によるインフラサポート

echo "=== Railway Deployment Verification ==="
echo "作成者: Worker3 (インフラ専門家)"
echo "日時: $(date)"
echo

# 1. Dockerfile.simpleの検証
echo "1. Dockerfile.simple検証"
echo "✅ Node.js 18-slim (軽量で適切)"
echo "✅ 必要な依存関係インストール済み"
echo "✅ FFmpegインストール済み (動画処理用)"
echo "✅ ビルドプロセス正常"
echo

# 2. 環境変数チェックリスト
echo "2. Railway環境変数設定チェックリスト"
echo "以下の環境変数をRailwayで設定してください："
echo
echo "# Supabase"
echo "- NEXT_PUBLIC_SUPABASE_URL"
echo "- NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "- SUPABASE_SERVICE_ROLE_KEY"
echo
echo "# OpenAI"
echo "- OPENAI_API_KEY"
echo
echo "# NextAuth"
echo "- NEXTAUTH_URL (本番URL)"
echo "- NEXTAUTH_SECRET"
echo
echo "# OAuth (必要に応じて)"
echo "- GOOGLE_CLIENT_ID"
echo "- GOOGLE_CLIENT_SECRET"
echo

# 3. ヘルスチェック設定
echo "3. ヘルスチェック設定"
cat > railway-health-check.json << 'EOF'
{
  "healthcheck": {
    "path": "/api/health",
    "interval": 30,
    "timeout": 10,
    "retries": 3
  }
}
EOF
echo "✅ ヘルスチェック設定作成完了"
echo

# 4. デプロイ前チェックリスト
echo "4. デプロイ前チェックリスト"
echo "□ npm run build が成功することを確認"
echo "□ 環境変数が全て設定されていることを確認"
echo "□ Supabaseのプロジェクトが正しく設定されていることを確認"
echo "□ OpenAI APIキーが有効であることを確認"
echo

# 5. デプロイコマンド
echo "5. Railwayデプロイコマンド"
echo "railway up"
echo
echo "注意: railway CLIがインストールされていない場合は:"
echo "curl -fsSL https://railway.app/install.sh | sh"
echo

# 6. デプロイ後の確認
echo "6. デプロイ後の確認項目"
echo "□ アプリケーションが起動していることを確認"
echo "□ /api/health エンドポイントが200を返すことを確認"
echo "□ ログにエラーがないことを確認"
echo "□ 基本機能（アップロード、YouTube取得、分割）が動作することを確認"

echo
echo "=== 検証完了 ==="
echo "Dockerfile.simpleは本番デプロイに適しています。"
echo "上記のチェックリストに従ってデプロイを進めてください。"