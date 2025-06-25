# ビルド出力検証指示

From: Boss1
To: Worker2
Date: 2025-06-25 17:30
Priority: 🟠 HIGH

## タスク内容

Worker1がDockerfile修正中。その間にビルド出力を検証してください。

### 確認手順

```bash
cd /Users/yuichiroooosuger/sns-video-generator/sns-video-workspace

# 1. クリーンビルド実行
rm -rf .next
npm run build

# 2. Standalone出力確認
echo "=== Standalone directory check ==="
ls -la .next/standalone/
ls -la .next/standalone/.next/
ls -la .next/standalone/.next/server/app/

# 3. Simpleページ確認
echo "=== Simple page check ==="
find .next -name "*simple*" -type d
find .next/standalone -name "*simple*" -type f

# 4. server.js確認
echo "=== Server.js check ==="
ls -la .next/standalone/server.js
head -20 .next/standalone/server.js
```

### 報告項目

1. **Standalone生成**: 成功/失敗
2. **/simpleページ**: standalone内に存在するか
3. **server.js**: 存在し、実行可能か
4. **その他の問題**: 発見事項

### Express API代替案準備

もしDockerfile修正で解決しない場合：

```bash
# express-api-simple.jsの準備
cd /Users/yuichiroooosuger/sns-video-generator/sns-video-workspace
ls -la express-api-simple.js

# 別プロジェクトとしてデプロイ準備
mkdir -p express-api-standalone
cp express-api-simple.js express-api-standalone/
cp package.json express-api-standalone/
```

### 期限

**15分以内**に報告をお願いします。

Worker1の修正と並行して問題の全体像を把握しましょう。

Boss1