# Boss1 → Worker2 明確な指示書

## 🚨 最重要：方向転換

**Render監視は完全中止。Railway UIの修正に集中します。**

## 現状整理

### ❌ 中止する作業
- Render.comダッシュボード監視（完全中止）
- Render環境変数設定（完全中止）
- render.yaml関連の全作業（完全中止）

### ✅ Railwayで実施する作業

## 具体的タスク（優先順位順）

### 1. Railway UI環境変数の更新（15分以内）

**現在のRailway URL確認**:
```
https://sns-video-generator.up.railway.app
https://sns-video-generator-production.up.railway.app
```

**更新が必要な環境変数**:
```javascript
// .env.local または Railwayダッシュボード
NEXT_PUBLIC_API_URL=https://sns-video-generator.up.railway.app
EXPRESS_API_URL=https://sns-video-generator.up.railway.app
FFMPEG_PATH=/usr/bin/ffmpeg
```

### 2. UIコンポーネントの接続確認（30分以内）

```typescript
// src/app/test-basic/page.tsx などで確認
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://sns-video-generator.up.railway.app';

// APIエンドポイント
- /api/upload-youtube
- /api/process-simple
- /api/download-segments
```

### 3. エラーハンドリング強化（30分以内）

```typescript
// Railway特有のエラーに対応
if (error.message.includes('FFmpeg')) {
  setError('動画処理エラー: FFmpegの設定を確認中です');
} else if (error.message.includes('500')) {
  setError('サーバーエラー: 再試行してください');
}
```

### 4. 動作確認チェックリスト

- [ ] YouTube URL入力フォームが表示される
- [ ] 「処理開始」ボタンが機能する
- [ ] エラー時に適切なメッセージが表示される
- [ ] ローディング状態が正しく表示される

## 成功基準

1. Railway UIからRailway APIに正常に接続
2. エラー時のユーザー体験が良好
3. FFmpegエラーが発生しても適切にハンドリング

## 報告方法
```
ai-org/worker2/railway-ui-fix-report.txt に以下を記載：
1. 環境変数の更新内容
2. UI動作確認結果
3. エラーハンドリングの改善点
```

## なぜRailwayに集中するのか

- プレジデントからの明確な指示
- 既にデプロイ済みの環境を活用
- コスト効率と時間効率
- チーム全体の方向性統一

**Renderのことは完全に忘れて、Railway UIの安定動作に全力を注いでください。**

## 緊急時の対応

もしRailway APIが完全に動作しない場合：
1. エラーメッセージを丁寧に表示
2. 「メンテナンス中」の美しい画面を用意
3. ユーザーの期待を裏切らない演出