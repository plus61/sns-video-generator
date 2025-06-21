#!/bin/bash

# next.config の競合を解決するスクリプト

echo "🧹 next.config ファイルの整理を開始..."

# バックアップディレクトリを作成
mkdir -p .config-backup

# 不要なconfigファイルをバックアップ
mv next.config.ts .config-backup/next.config.ts.backup 2>/dev/null
mv next.config.static.ts .config-backup/next.config.static.ts.backup 2>/dev/null
mv next.config.vercel.ts .config-backup/next.config.vercel.ts.backup 2>/dev/null

echo "✅ next.config.mjs のみを残しました"
echo "📁 バックアップは .config-backup/ に保存されています"

# 現在の設定を表示
echo ""
echo "📋 現在の設定:"
echo "- output: 'standalone' (Railway対応)"
echo "- ignoreBuildErrors: true (一時的)"
echo "- serverExternalPackages: ['canvas', 'fabric']"

echo ""
echo "🚀 Railwayデプロイの準備が整いました！"