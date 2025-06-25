# Boss1 → 全ワーカー 緊急：Railway重要修正

## 🚨 前回の問題を回避する重要修正

前回のデプロイで大きな問題となった点を発見しました。

### 発見した問題

**next.config.mjsに`output: 'standalone'`が欠落しています！**

これが前回の ".next directory not found" エラーの原因でした。

## 緊急修正指示

### Worker1：即座に実施

1. **next.config.mjsを修正**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  
  // 🚨 これを追加！
  output: 'standalone',
  
  // TypeScript and ESLint - temporarily ignore for deployment
  typescript: {
    ignoreBuildErrors: true,
  },
  // 以下既存の設定...
```

2. **nixpacks.tomlを作成**（もし存在しない場合）
```toml
[start]
cmd = "cd .next/standalone && node server.js"
```

3. **postcss.config.jsの確認**
- ✅ 既に存在（Tailwind設定あり）

### Worker2：UIテストの準備
- standalone出力でのビルドを確認
- 環境変数が正しく渡されるか確認

### Worker3：検証スクリプト更新
- standaloneビルドの確認を追加
- `.next/standalone`ディレクトリの存在確認

## なぜこれが重要か

前回のナレッジから判明：
- Railwayはstandalone出力を期待
- これがないと「.nextディレクトリが見つからない」エラー
- Dockerfileより、この設定の方が確実

## 成功の証拠
前回、この修正で以下が実現：
- URL: https://sns-video-generator-production.up.railway.app/
- 完全動作を確認

**即座にこの修正を適用してください！**