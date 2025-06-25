# 【Worker3】TDD実装指令 - OpenAI API統合

## Presidentからの最終指令

モック分析は終了。実際のOpenAI APIをTDDで実装せよ。

## TDD実装手順（1時間）

### 1. Red: テストを書く（15分）
```typescript
// __tests__/openai-integration.test.ts
describe('OpenAI API統合', () => {
  test('Whisperで音声認識', async () => {
    const audioPath = './test-audio.mp3';
    const transcription = await transcribeAudio(audioPath);
    
    expect(transcription.text).toBeDefined();
    expect(transcription.text.length).toBeGreaterThan(0);
    expect(transcription.language).toBe('en');
  });

  test('GPT-4で内容分析', async () => {
    const transcript = 'This is a test video about cats.';
    const analysis = await analyzeContent(transcript);
    
    expect(analysis.score).toBeGreaterThanOrEqual(1);
    expect(analysis.score).toBeLessThanOrEqual(10);
    expect(analysis.viralPotential).toBeDefined();
    expect(analysis.segments).toBeInstanceOf(Array);
  });
});
```

### 2. Green: 実装（30分）
- OpenAI SDK使用
- 実際のAPI呼び出し
- Whisper転写
- GPT-4分析

### 3. Refactor: 改善（15分）
- APIキー管理
- レート制限対応
- エラーハンドリング

## 必須成果物
1. `__tests__/openai-integration.test.ts`
2. 実装コード（モック削除）
3. `npm test`の成功ログ
4. 実際のAPI応答のスクリーンショット

実APIの動作証拠を示せ。