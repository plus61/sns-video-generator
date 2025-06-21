# 🚀 TDD クイックスタート - 5分で始める

## 今すぐ試せるTDD

### 1. 最初のテストを書く（1分）

```bash
# ファイル作成
touch src/lib/video/thumbnail-generator.test.ts
```

```typescript
// 最小限のテスト
test('サムネイルを生成する', async () => {
  const result = await generateThumbnail('video.mp4', 10);
  expect(result.success).toBe(true);
});
```

### 2. エラーを確認（30秒）

```bash
npm test
# エラー！generateThumbnail is not defined
```

**これが正しい第一歩！** 🎯

### 3. 最小限の実装（1分）

```typescript
// src/lib/video/thumbnail-generator.ts
export async function generateThumbnail(video: string, time: number) {
  return { success: true };
}
```

### 4. テスト成功を確認（30秒）

```bash
npm test
# ✅ テスト成功！
```

### 5. 次のテストを追加（1分）

```typescript
test('エラーを適切に処理する', async () => {
  const result = await generateThumbnail('not-exist.mp4', 10);
  expect(result.success).toBe(false);
});
```

### 6. 実装を改善（1分）

```typescript
import * as fs from 'fs';

export async function generateThumbnail(video: string, time: number) {
  if (!fs.existsSync(video)) {
    return { success: false, error: 'File not found' };
  }
  return { success: true };
}
```

## 🎉 おめでとう！

**5分でTDDの基本サイクルを体験しました！**

### 学んだこと
- ✅ Red: 失敗するテストから始める
- ✅ Green: 最小限の実装でテストを通す
- ✅ Refactor: コードを改善する

### 次のアクション
1. 実際のFFmpeg実装を追加
2. より多くのテストケースを追加
3. チームメンバーとペアプロ

**Remember**: 完璧を求めず、小さく始めることが大切！