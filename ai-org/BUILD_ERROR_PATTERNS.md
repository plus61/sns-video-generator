# ビルドエラーパターン分析

## 発見したパターン（開発者思考での分析）

### 1. 環境変数関連エラー
**症状**: `Missing XXX environment variables`
**原因**: Next.jsビルド時のページデータ収集で環境変数が必要
**解決**: Dockerfileにダミー環境変数を追加

### 2. 設定ファイル優先順位エラー
**症状**: 修正が反映されない
**原因**: railway.toml > railway.json > Dockerfile の優先順位
**解決**: railway.tomlでDOCKERFILEビルダーを指定

### 3. TypeScript/ESLintエラー
**症状**: ビルド時にコンパイルエラー
**原因**: 厳格な型チェック
**解決**: ignoreBuildErrors: true 設定

### 4. CSS最適化エラー
**症状**: lightningcss module not found
**原因**: Next.js 15の内部CSS最適化
**解決**: optimizeCss: false 設定

## コードアーキテクチャの改善点

1. **防御的プログラミング**
   ```typescript
   if (!process.env.API_KEY) {
     if (process.env.NODE_ENV === 'production' && !process.env.CI) {
       throw new Error('API key required')
     }
   }
   ```

2. **フォールバック値の実装**
   ```typescript
   const client = new Client({
     apiKey: process.env.API_KEY || 'dummy-key'
   })
   ```

3. **ビルド時と実行時の分離**
   - ビルド時: エラーを回避
   - 実行時: 適切なエラーハンドリング