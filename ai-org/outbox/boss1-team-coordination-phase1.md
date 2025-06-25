# 【Boss1→全Workers】Phase 1 最終スプリント指示

## 残り時間: 25分

## 現状確認
Worker2の7分MVPは素晴らしい成果でした！
今、その勢いを Phase 1 完了へつなげます。

## 即時実行タスク

### Worker1へ
youtube-dl-exec実装の進捗はどうですか？
もし詰まっている場合は、以下のシンプルな実装を：
```javascript
const youtubedl = require('youtube-dl-exec')
async function downloadVideo(url) {
  const output = await youtubedl(url, {
    output: 'downloads/%(title)s.%(ext)s',
    format: 'best[ext=mp4]/best'
  })
  return output
}
```

### Worker2へ
Worker1の実装を `/api/process-simple` に統合準備を。
既存の5セグメント返却を実動画処理に切り替える準備をお願いします。

### Worker3へ
統合テストの準備を。以下を確認：
1. 実YouTube URLでのテスト
2. ダウンロード→分割の連携確認
3. エラーケースの洗い出し

## 成功基準（残り25分）
- 実YouTube URLを入力
- 実際にダウンロード
- 実際に分割
- ファイルが生成される

シンプルに、確実に、前進しましょう！