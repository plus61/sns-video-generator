# 🎯 7行哲学 - CI/CD編

## 核心原則
> "7行で実現できないなら、それは間違ったアプローチである"

## 🚀 究極のシンプルCI/CD

### 最小構成（7行）
```yaml
on: push
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: railway up
```

### 実用的構成（15行）
```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm test
      - run: railway up
```

## ❌ アンチパターン

### 1. 過度な抽象化
```yaml
# 悪い例
- uses: ./.github/actions/complex-build
- uses: ./.github/actions/multi-stage-test  
- uses: ./.github/actions/progressive-deploy
```

### 2. 不要な並列化
```yaml
# 悪い例
jobs:
  build-1:
  build-2:
  build-3:
  test-1:
  test-2:
  deploy-staging:
  deploy-production:
```

### 3. 意味のないメトリクス
```yaml
# 悪い例
- name: Calculate complex metrics
  run: |
    SCORE=$(complex calculation)
    SYNERGY=$(more calculation)
    REPORT=$(generate 100 line report)
```

## ✅ ベストプラクティス

### 1. プラットフォームを信頼する
- Railwayのビルドシステムに任せる
- カスタムDockerfileは不要
- ヘルスチェックはプラットフォーム側で

### 2. 直列実行で十分
- 並列化は複雑性を増すだけ
- ほとんどの場合、直列で問題ない
- シンプルさ > 数分の時間短縮

### 3. 必要最小限のステップ
1. チェックアウト
2. 依存関係インストール
3. テスト実行
4. デプロイ

**これ以上は不要！**

## 📊 効果測定

| 項目 | 複雑なCI/CD | 7行哲学 | 改善 |
|------|------------|---------|------|
| 理解時間 | 30分 | 30秒 | 60倍 |
| デバッグ時間 | 2時間 | 5分 | 24倍 |
| 変更の容易さ | 困難 | 簡単 | ∞ |

## 🌟 格言

> "CIが複雑なら、それはContinuous Impediment（継続的障害）である"

> "最高のワークフローは、存在を忘れるほどシンプルなもの"

> "7行で書けないなら、それは必要ない"

## 💡 実装チェックリスト

- [ ] 30行以下か？
- [ ] 5分で理解できるか？
- [ ] 特殊な知識不要か？
- [ ] プラットフォーム機能を活用しているか？
- [ ] 削除できる行はないか？

---
*"Simplicity is the ultimate sophistication" - Leonardo da Vinci*