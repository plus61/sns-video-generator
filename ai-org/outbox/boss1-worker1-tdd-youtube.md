# 【Worker1】TDD実装指令 - YouTube動画ダウンロード

## Presidentからの最終指令

モックは卒業。実際に動作するコードをTDDで実装せよ。

## TDD実装手順（1時間）

### 1. Red: テストを書く（15分）
```typescript
// __tests__/youtube-download.test.ts
describe('YouTube動画ダウンロード', () => {
  test('実際のYouTube URLから動画をダウンロード', async () => {
    const url = 'https://www.youtube.com/watch?v=jNQXAC9IVRw';
    const result = await downloadYouTubeVideo(url);
    
    expect(result.filePath).toBeDefined();
    expect(fs.existsSync(result.filePath)).toBe(true);
    expect(result.metadata.title).toBeDefined();
    expect(result.metadata.duration).toBeGreaterThan(0);
  });
});
```

### 2. Green: 実装（30分）
- youtube-dl-exec を使用
- 実際のダウンロード処理
- ローカルファイル保存
- メタデータ取得

### 3. Refactor: 改善（15分）
- エラーハンドリング
- 進捗表示
- ファイル管理

## 必須成果物
1. `__tests__/youtube-download.test.ts`
2. 実装コード（モック削除）
3. `npm test`の成功ログ
4. ダウンロードされた動画ファイルのスクリーンショット

コードとテスト結果で示せ。言葉は不要。