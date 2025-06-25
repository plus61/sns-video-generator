# 【緊急】Worker3 - Phase 4 OpenAI API統合

## タスク: Whisper/GPT-4で実AI分析（1時間）

### /lib/simple-ai-analyzer.ts 実装要件
```typescript
import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Whisper音声解析
const transcription = await openai.audio.transcriptions.create({
  file: audioFile,
  model: "whisper-1"
});

// GPT-4内容評価
const analysis = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [...]
});
```

### 必須実装
1. **Whisper統合**
   - 音声ファイル抽出
   - 日本語対応
   - タイムスタンプ付き転写

2. **GPT-4評価**
   - コンテンツ価値スコア（1-10）
   - バイラル可能性判定
   - ハイライト箇所特定

3. **スコアリングアルゴリズム**
   - エンゲージメント予測
   - 最適セグメント選定
   - 理由の明確化

### 暫定対応OK
- API接続できない場合はモックでも可
- ただし実際のプロンプト構造は実装

1時間で完成させてください！