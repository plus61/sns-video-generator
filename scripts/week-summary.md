# 今週の基本動作確認まとめ

## 📅 スケジュール

### 火曜日：アップロード動作確認
```bash
node scripts/test-upload-actual.js
```
- Supabaseへのファイル保存
- URLの取得
- エラーハンドリング

### 水曜日：YouTube取得確認
```bash
node scripts/test-youtube-actual.js
```
- YouTube URLからの動画情報取得
- 動画ダウンロード
- エラー表示

### 木曜日：分割動作確認
```bash
node scripts/test-split-actual.js
```
- 10秒×3クリップ生成
- 各クリップの再生確認
- ファイルサイズ確認

## 🎯 成功基準（シンプル）

1. **基本フローが通る**
   - アップロード → 保存 → URL取得
   - YouTube URL → 動画取得
   - 動画 → 3分割

2. **致命的なエラーがない**
   - サーバーがクラッシュしない
   - データが消えない
   - 無限ループしない

3. **それ以上は求めない**
   - パフォーマンスは気にしない
   - UIの美しさは気にしない
   - エッジケースは無視

## 🚀 クイックスタート

```bash
# 1. サーバー起動
npm run dev

# 2. 別ターミナルでテスト実行
cd scripts
node test-upload-actual.js   # 火曜日
node test-youtube-actual.js  # 水曜日
node test-split-actual.js    # 木曜日
```

## ⚠️ 注意事項

- 完璧を求めない
- 動けばOK
- エラーが出ても基本機能が動けばOK
- 高度な機能は無視
- テストに時間をかけすぎない

**目標：金曜日までに「一応動く」状態にする**