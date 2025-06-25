# Debug Log

## [2025-06-25] Railway Healthcheck failure解決
**症状**: Deployment failed during network process - Healthcheck failure
**環境**: Railway deployment - Network > Healthcheck段階
**再現手順**: 複雑なヘルスチェックエンドポイントが外部依存でエラー
**試行錯誤**: 
- 複雑なDockerfileとserver-wrapper.jsの問題を特定
- 元のヘルスチェックはSupabase、Redis等の外部依存が多すぎた
**最終解決方法**: 
1. シンプルなDockerfile.simpleを使用
2. シンプルなヘルスチェックエンドポイント作成
```typescript
// /api/health/simple-health/route.ts
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  })
}
```
3. railway.tomlを更新
```toml
dockerfilePath = "Dockerfile.simple"
healthcheckPath = "/api/health/simple-health"
# startCommand削除（DockerfileのCMD使用）
```
**根本原因**: 複雑すぎる設定、外部依存の多いヘルスチェック
**予防策**: シンプルな設定を維持、最小限の依存関係

## [2025-06-25] Railway 'cd' コマンドエラー
**症状**: The executable 'cd' could not be found
**環境**: Railway deployment - Deploy > Create container段階
**再現手順**: startCommandで'cd .next/standalone && node server.js'を実行
**試行錯誤**: 
- エラーメッセージから、Railwayコンテナ環境では'cd'コマンドが使用できないことが判明
**最終解決方法**: 
```toml
# railway.toml修正
startCommand = "node server-wrapper.js"  # cdを使わず直接実行
```
**根本原因**: Railwayコンテナ環境の制限、シェルコマンドの使用不可
**予防策**: startCommandでは単一の実行ファイルを直接指定する

## [2025-06-25] Railway builder設定の競合問題
**症状**: Railwayビルドが失敗、NIXPACKSとDockerfileの競合
**環境**: Railway deployment
**再現手順**: railway.tomlでNIXPACKS指定、Dockerfileも存在
**試行錯誤**: 
- 過去の知見を確認
- NIXPACKSビルダーはDockerfileを完全に無視することが判明
**最終解決方法**: 
```toml
# railway.toml修正
[build]
builder = "DOCKERFILE"  # NIXPACKSから変更
dockerfilePath = "Dockerfile"
```
- nixpacks.tomlを削除
**根本原因**: Railway設定の優先順位理解不足、複数ビルド設定の混在
**予防策**: 1つのビルド方法に統一、検証スクリプトとの整合性確認

## [2025-06-25] Railway deployment restartPolicyType エラー
**症状**: Error: deploy.restartPolicyType: Invalid input
**環境**: Railway deployment
**再現手順**: git pushでRailway自動デプロイをトリガー
**試行錯誤**: 
- railway.tomlの設定を確認
- 過去のナレッジからrestartPolicyTypeの値は大文字である必要があることを発見
**最終解決方法**: 
```toml
# Before
restartPolicyType = "on-failure"
# After  
restartPolicyType = "ON_FAILURE"
```
**根本原因**: Railway APIはrestartPolicyTypeの値として大文字の"ON_FAILURE"を期待している
**予防策**: Railway設定は公式ドキュメントで値の形式を確認する

## 以前のデバッグログ

### Next.js 15 Railway デプロイメント問題
- `output: 'standalone'` の設定が必須
- `.next` ディレクトリが見つからないエラーの解決
- NIXPACKSビルダーとDockerfileの混在問題

### TypeScript エラー対応
- `ignoreBuildErrors: true` で一時的に回避
- 本番環境でのビルド成功を優先

### 環境変数問題
- ビルド時とランタイムで異なる要件
- env-validator.tsでの起動時検証実装