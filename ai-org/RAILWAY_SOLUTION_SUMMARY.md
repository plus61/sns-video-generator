# Railway Deployment 最終解決策

## 問題の経緯
1. ".next directory not found" エラーが持続
2. 複数のDockerfile戦略が失敗
3. Nixpacksへの切り替えも当初失敗

## 根本原因
Railway/Nixpacksは**standalone出力**を期待していたが、next.config.mjsに設定がなかった。

## 最終解決策
```javascript
// next.config.mjs
const nextConfig = {
  output: 'standalone', // これが必須だった！
  // ... 他の設定
};
```

## 技術的詳細
- Standaloneモードは最小限の本番用サーバーを生成
- .next/standaloneディレクトリに全必要ファイルを配置
- node_modulesも最適化されたサブセットのみ含む
- server.jsが自己完結型サーバーとして動作

## 検証済み構造
```
.next/standalone/
├── .next/          # 最適化されたNext.jsファイル
├── node_modules/   # 必要最小限の依存関係
├── package.json    # 実行時設定
├── server.js       # standaloneサーバー
└── src/            # 必要なソースファイル
```

## 学習ポイント
1. Railwayのエラーメッセージは具体的なパスを示す
2. Nixpacksはstandalone出力を前提としている
3. Docker戦略よりもプラットフォームネイティブが有効
4. output設定は明示的に指定する必要がある