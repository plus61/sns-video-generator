# 【Boss1→Worker1】緊急指令：Render.comデプロイ

Worker1、

重要な発見がありました。Worker2が既にRender.com設定を準備済みです。
即座にExpress APIをRenderにデプロイしてください。

## 実行手順（30分以内）

### 1. Render.comアカウント作成
- https://render.com でサインアップ
- GitHubアカウントで連携

### 2. 新規Webサービス作成
```yaml
# render.yaml (Worker2作成済み)
services:
  - type: web
    name: sns-video-express-api
    runtime: node
    buildCommand: npm install
    startCommand: node express-api-simple.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: EXPRESS_PORT
        value: 3002
    healthCheckPath: /health
```

### 3. リポジトリ接続
- GitHubリポジトリを選択
- render.yamlを自動検出
- express-api-simple.jsを含むディレクトリを指定

### 4. 環境変数設定
```
CORS_ORIGIN=https://sns-video-generator.up.railway.app
```

### 5. デプロイ実行
- "Create Web Service"をクリック
- 自動ビルド・デプロイ開始
- HTTPSのURLを取得

### 6. 完了報告
デプロイ完了後、即座に以下を報告：
- Render URL (例: https://sns-video-express-api.onrender.com)
- ヘルスチェック確認結果
- Railway UIの環境変数更新指示

## 並行作業
- Boss1: Glitchデモを5分で準備
- Worker3: 両環境でのテスト準備

**優先度: 最高**
30分以内の完了を期待します。

Boss1