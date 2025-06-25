# 【Boss1→全ワーカー】木曜日タスク - AI分析パイプライン接続

## 🎯 本日の目標
動画分割機能にAI分析を追加し、より賢い分割を実現する

## ✅ 昨日までの成果
- YouTube API統合完了
- 固定時間分割（10秒×3）動作確認
- テスト環境構築完了

## 📋 木曜日タスク配分

### Worker1: OpenAI統合とWhisper音声解析
```typescript
// src/lib/ai-analyzer.ts
export async function analyzeVideo(videoPath: string) {
  // 1. Whisperで音声文字起こし
  const transcript = await transcribeAudio(videoPath);
  
  // 2. GPT-4で重要箇所を特定
  const highlights = await findHighlights(transcript);
  
  return { transcript, highlights };
}
```

**タスク詳細**:
1. OpenAI APIクライアント設定
2. Whisper API統合（音声→テキスト）
3. GPT-4でハイライト検出
4. エンゲージメントスコア計算

### Worker2: ビジュアル分析とセグメント最適化
```typescript
// src/lib/visual-analyzer.ts
export async function analyzeVisualCues(videoPath: string) {
  // 1. キーフレーム抽出
  const frames = await extractKeyFrames(videoPath);
  
  // 2. シーンチェンジ検出
  const sceneChanges = await detectSceneChanges(frames);
  
  // 3. 最適な分割ポイント決定
  return calculateOptimalCuts(sceneChanges);
}
```

**タスク詳細**:
1. FFmpegでキーフレーム抽出
2. シーンチェンジ検出アルゴリズム
3. 音声解析と組み合わせて最適分割
4. 10秒制約内での最適化

### Worker3: 統合APIとテストUI作成
```typescript
// src/app/api/analyze-and-split/route.ts
export async function POST(request: Request) {
  const { videoId } = await request.json();
  
  // 1. AI分析実行
  const analysis = await analyzeVideo(videoId);
  
  // 2. 最適分割点で分割
  const clips = await splitWithAI(videoId, analysis);
  
  return Response.json({ analysis, clips });
}
```

**タスク詳細**:
1. 統合APIエンドポイント作成
2. AI分析結果表示UI追加
3. 分割前プレビュー機能
4. エンドツーエンドテスト

## ⏰ タイムライン
- 10:00-12:00: 各自実装
- 12:00-13:00: 統合テスト
- 13:00-14:00: デモ準備
- 14:00: 動作確認完了

## 🎯 成功基準
1. 音声内容に基づいた分割が可能
2. シーンチェンジを考慮した分割
3. エンゲージメントスコア表示
4. 固定分割とAI分割の切り替え可能

## 💡 実装のポイント
- まずはシンプルに動作させる
- OpenAI APIは最小限の使用
- エラーハンドリング重視
- UIは最小限でOK

Let's make it smart! 🧠