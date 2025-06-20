#!/bin/bash
# プランC: ビルド済み.nextディレクトリをコミットする準備スクリプト

echo "🚀 プランC: ビルド済み.nextディレクトリ準備開始"

# 1. ローカルでビルド実行
echo "📦 ローカルビルド実行中..."
npm run build

# 2. .gitignoreから.nextを一時的に除外
echo "📝 .gitignoreを一時的に修正..."
cp .gitignore .gitignore.backup
sed -i '' '/.next/d' .gitignore

# 3. 必要なファイルのみを選択的に追加
echo "📂 必要なビルドファイルを選択..."
git add -f .next/standalone/
git add -f .next/static/
git add -f .next/server/
git add -f .next/BUILD_ID
git add -f .next/package.json

# 4. 確認
echo "✅ 追加されたファイル:"
git status --porcelain | grep "^A"

echo "⚠️  警告: これは緊急対応用です。通常はビルド済みファイルをコミットしないでください。"