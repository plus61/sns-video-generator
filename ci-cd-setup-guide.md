# CI/CDセットアップガイド
作成者: Worker3（インフラ専門家）

## 1. GitHub Actions設定

### 必要なSecrets設定
GitHubリポジトリの Settings > Secrets and variables > Actions で以下を設定：

```
RAILWAY_TOKEN - RailwayのAPIトークン
```

### Railway APIトークン取得方法
1. https://railway.app/account/tokens にアクセス
2. "Create Token" をクリック
3. トークンをコピー
4. GitHubのSecretsに追加

## 2. CI/CDパイプラインの機能

### 自動実行トリガー
- mainブランチへのpush時
- developブランチへのpush時
- mainブランチへのPullRequest時

### 実行される処理
1. **品質チェック**
   - ESLint実行
   - TypeScript型チェック
   - Jest単体テスト

2. **ビルド検証**
   - Next.jsビルド
   - ビルド成果物の保存

3. **自動デプロイ**（mainブランチのみ）
   - Railway本番環境へのデプロイ

## 3. ステージング環境構築（オプション）

### developブランチ用のステージング環境
```yaml
# .github/workflows/staging.yml に追加
deploy-staging:
  if: github.ref == 'refs/heads/develop'
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - name: Deploy to Staging
      env:
        RAILWAY_TOKEN: ${{ secrets.RAILWAY_STAGING_TOKEN }}
      run: railway up --environment staging
```

## 4. 監視とアラート

### Slack通知設定（オプション）
```yaml
- name: Notify Slack on failure
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: 'CI/CD Pipeline failed!'
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

## 5. ローカルでのCI実行

開発者がローカルでCIを実行する方法：

```bash
# 品質チェック
npm run lint
npm test
npx tsc --noEmit

# ビルド確認
npm run build
```

## 6. トラブルシューティング

### よくある問題と解決策

1. **ビルドエラー**
   - node_modulesとキャッシュをクリア
   - `npm ci`で依存関係を再インストール

2. **Railway デプロイ失敗**
   - RAILWAY_TOKENが正しく設定されているか確認
   - Railwayプロジェクトの環境変数を確認

3. **テスト失敗**
   - ローカルで`npm test`を実行して確認
   - テスト環境の環境変数を確認

## セットアップ完了チェックリスト

- [ ] GitHub ActionsでCI/CDワークフローが作成されている
- [ ] RAILWAY_TOKENがSecretsに設定されている
- [ ] mainブランチの保護設定が有効（推奨）
- [ ] CI/CDパイプラインが正常に実行されることを確認

このガイドに従ってCI/CDを設定することで、品質を保ちながら自動デプロイが可能になります。