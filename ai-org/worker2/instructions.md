# Worker2 作業手順

## 2. 開発環境の修復手順（5分以内）

### 前提条件
- Node.js 18以上がインストール済み
- npmコマンドが使用可能

### 手順

#### Step 1: TypeScript依存関係のインストール（2分）
```bash
# プロジェクトディレクトリに移動
cd /Users/yuichiroooosuger/sns-video-generator/sns-video-workspace

# TypeScriptと型定義をインストール
npm install --save-dev typescript @types/react @types/node

# インストール確認
npm list typescript @types/react @types/node --depth=0
```

#### Step 2: ビルドエラーの確認と修正（2分）
```bash
# ビルドを実行してエラーを確認
npm run build

# 成功メッセージが表示されることを確認:
# ✓ Compiled successfully

# もしエラーが発生した場合、以下を実行:
# キャッシュクリア
rm -rf .next
npm run build
```

#### Step 3: 開発サーバーの起動確認（1分）
```bash
# 開発サーバーを起動
npm run dev

# 以下のメッセージが表示されることを確認:
# ▲ Next.js
# - Local:        http://localhost:3000
# ✓ Ready

# ブラウザで http://localhost:3000 にアクセス
# ページが正常に表示されることを確認

# 確認後、Ctrl+C でサーバーを停止
```

### 確認コマンド
```bash
# TypeScript設定の確認
test -f tsconfig.json && echo "✅ tsconfig.json exists" || echo "❌ tsconfig.json missing"

# 依存関係の確認
npm list typescript @types/react @types/node --depth=0 | grep -E "(typescript|@types)" | wc -l | xargs -I {} test {} -ge 3 && echo "✅ All TypeScript dependencies installed" || echo "❌ Missing dependencies"

# ビルド成功の確認
npm run build 2>&1 | grep -q "Compiled successfully" && echo "✅ Build successful" || echo "❌ Build failed"
```

### トラブルシューティング
- `npm install`でエラー：`npm cache clean --force`を実行してから再試行
- ビルドエラー：`.next`フォルダを削除して再ビルド
- ポート3000が使用中：`lsof -ti:3000 | xargs kill -9`で既存プロセスを終了

### 完了報告
```bash
echo "✅ Development environment fixed - TypeScript installed and build successful" > /Users/yuichiroooosuger/sns-video-generator/sns-video-workspace/ai-org/worker2/status.txt
```