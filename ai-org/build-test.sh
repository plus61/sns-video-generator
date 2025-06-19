#!/bin/bash

# Worker2 ビルドテストスクリプト
echo "🚀 Worker2: ビルドエラー解決テスト開始"

cd /Users/yuichiroooosuger/sns-video-generator/sns-video-generator

echo "📦 パッケージインストール実行..."
npm install --legacy-peer-deps > build-test.log 2>&1

echo "🔧 TypeScriptチェック実行..."
npx tsc --noEmit >> build-test.log 2>&1
if [ $? -eq 0 ]; then
    echo "✅ TypeScriptエラー: なし"
else
    echo "❌ TypeScriptエラー検出"
    echo "エラー詳細:"
    tail -20 build-test.log
fi

echo "🏗️ Next.jsビルド実行..."
npm run build >> build-test.log 2>&1
if [ $? -eq 0 ]; then
    echo "✅ ビルド成功！"
else
    echo "❌ ビルドエラー検出"
    echo "エラー詳細:"
    tail -30 build-test.log
fi

echo "🔍 Lintチェック実行..."
npm run lint >> build-test.log 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Lintエラー: なし"
else
    echo "❌ Lintエラー検出"
    echo "エラー詳細:"
    tail -10 build-test.log
fi

echo "📊 ビルドテスト完了 - ログ保存: build-test.log"