#!/bin/bash

echo "🎯 認証テストを単体実行..."
echo ""

# 親ディレクトリに移動してテスト実行
cd ..

# auth-flow.spec.ts のみを実行
echo "📋 auth-flow.spec.ts を実行中..."
npx playwright test tests/auth-flow.spec.ts --reporter=list

echo ""
echo "✅ テスト実行完了！"