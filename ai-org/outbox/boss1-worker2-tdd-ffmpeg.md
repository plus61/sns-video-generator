# 【Worker2】TDD実装指令 - FFmpeg動画分割

## Presidentからの最終指令

仮実装は終了。実際に動作するFFmpeg分割をTDDで実装せよ。

## TDD実装手順（1時間）

### 1. Red: テストを書く（15分）
```typescript
// __tests__/video-split.test.ts
describe('FFmpeg動画分割', () => {
  test('動画ファイルから指定時間のセグメントを切り出し', async () => {
    const inputPath = './test-video.mp4';
    const segments = await splitVideo(inputPath, {
      start: 0,
      duration: 10
    });
    
    expect(segments).toHaveLength(3);
    segments.forEach(segment => {
      expect(fs.existsSync(segment.path)).toBe(true);
      expect(segment.duration).toBe(10);
    });
  });
});
```

### 2. Green: 実装（30分）
- fluent-ffmpeg 使用
- 実際のファイル分割
- セグメントファイル生成
- 品質維持（-c copy）

### 3. Refactor: 改善（15分）
- メモリ効率化
- 一時ファイル管理
- エラーハンドリング

## 必須成果物
1. `__tests__/video-split.test.ts`
2. 実装コード（仮実装削除）
3. `npm test`の成功ログ
4. 生成されたセグメントファイルのスクリーンショット

実ファイルが生成される証拠を示せ。