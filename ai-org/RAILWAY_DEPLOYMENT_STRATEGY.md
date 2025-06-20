# Railway Deployment戦略転換

## 従来の失敗パターン
- Docker multi-stage buildの使用
- .nextディレクトリがビルド層とランタイム層で分離
- 複雑な設定による予期しない動作

## 新戦略：Nixpacks
RailwayのネイティブビルドシステムであるNixpacksを使用することで：
1. 自動的なNext.js検出
2. 適切な依存関係の自動インストール
3. ビルドアーティファクトの適切な保持

## 実装詳細
```toml
# railway.toml
[build]
# Dockerfileを無効化し、Nixpacksに任せる
# builder = "DOCKERFILE"
# dockerfilePath = "./Dockerfile.simple"

[deploy]
startCommand = "npm run start:railway"
restartPolicyType = "ON_FAILURE"
```

## デバッグスクリプト
```json
// package.json
"start:railway": "ls -la && ls -la .next || echo 'No .next' && next start -p ${PORT:-3000}"
```

## 監視ポイント
1. ビルドログでNixpacksの動作確認
2. .nextディレクトリの生成確認
3. 起動時のデバッグ出力確認

## 次の改善案（必要な場合）
1. nixpacks.tomlの作成による詳細制御
2. 環境変数の最適化
3. キャッシュ戦略の改善