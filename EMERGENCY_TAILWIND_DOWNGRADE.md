# 🚨 緊急: Tailwind CSS v3へのダウングレード計画

## 現状の問題
- Tailwind CSS v4（アルファ版）がlightningcssに依存
- lightningcssがDocker環境で動作しない
- 複数の修正を試みたが、根本的な非互換性が継続

## 解決策: Tailwind CSS v3への安全なダウングレード

### 手順

#### 1. パッケージのダウングレード
```bash
# Tailwind CSS v4関連を削除
npm uninstall tailwindcss @tailwindcss/postcss

# Tailwind CSS v3をインストール
npm install --save-dev tailwindcss@^3.4.17 postcss@^8.4.49 autoprefixer@^10.4.21
```

#### 2. 設定ファイルの作成
```bash
# tailwind.config.js生成
npx tailwindcss init
```

#### 3. postcss.config.mjsの更新
```javascript
// postcss.config.mjs
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

#### 4. globals.cssの調整
```css
/* src/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* 既存のカスタムスタイルを維持 */
```

#### 5. next.config.jsのクリーンアップ
- lightningcss関連の設定をすべて削除
- webpackのexternalsから削除

## 期待される結果
- ✅ Railwayビルド成功
- ✅ Vercel互換性維持
- ✅ 安定した動作
- ✅ 実績のある構成

## リスク評価
- **低リスク**: v3は安定版で広く使用されている
- **互換性**: 既存のスタイルはほぼそのまま動作
- **パフォーマンス**: v3でも十分高速

## 実行時間
- 約15分で完全移行可能

この安全な解決策により、確実にRailwayビルドを成功させます。