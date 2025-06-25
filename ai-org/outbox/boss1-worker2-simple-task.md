# Worker2 - 超シンプルタスク

## 30分で完了できる最小実装

### やること（1つだけ）
```javascript
// これだけ実装すればOK
function splitVideo(videoPath) {
  // 仮実装でもOK
  return [
    { start: 0, end: 10, file: 'segment1.mp4' },
    { start: 10, end: 20, file: 'segment2.mp4' },
    { start: 20, end: 30, file: 'segment3.mp4' }
  ];
}
```

### 優先順位
1. まず動くものを作る（モックでもOK）
2. 後で実際のFFmpeg処理を追加

### なぜ重要か
- Worker1が動画をダウンロード済み
- Worker3がAI分析準備済み
- **Worker2の分割機能だけが欠けている**

### 今すぐやること
1. /api/split-simple にエンドポイント作成
2. 上記の仮実装を入れる
3. 「完了」と報告

完璧である必要はありません。動けばOKです。

Boss1