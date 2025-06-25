# t-wada流TDD開発戦略

## 🎯 t-wadaの黄金の回転

### 1. テストを書く（Red）
- **失敗するテストを最初に書く**
- **実装の前にインターフェースを決める**
- **最小限のテストから始める**

### 2. 仮実装（Green）
- **テストを通す最小限のコードを書く**
- **ベタ書きでも構わない**
- **まずは動くことを優先**

### 3. リファクタリング（Refactor）
- **テストが通る状態を保ちながら改善**
- **重複を除去**
- **設計を改善**

## 📋 sns-video-generatorへの適用

### Phase 1: 最小限の動作確認

```javascript
// ❌ Red: 最初のテスト
describe('YouTube動画ダウンロード', () => {
  test('URLから動画情報を取得できる', async () => {
    const result = await getVideoInfo('https://youtube.com/watch?v=test');
    expect(result).toHaveProperty('title');
    expect(result).toHaveProperty('duration');
  });
});

// ✅ Green: 仮実装
async function getVideoInfo(url) {
  return {
    title: 'Test Video',
    duration: 120
  };
}

// ♻️ Refactor: 実際の実装へ
async function getVideoInfo(url) {
  const videoId = extractVideoId(url);
  const info = await ytdl.getInfo(videoId);
  return {
    title: info.videoDetails.title,
    duration: parseInt(info.videoDetails.lengthSeconds)
  };
}
```

### Phase 2: 三角測量

```javascript
// 複数のテストケースで仕様を明確化
test('様々なYouTube URLフォーマットに対応', async () => {
  const urls = [
    'https://www.youtube.com/watch?v=abc123',
    'https://youtu.be/abc123',
    'http://youtube.com/watch?v=abc123&t=10s'
  ];
  
  for (const url of urls) {
    const result = await getVideoInfo(url);
    expect(result.videoId).toBe('abc123');
  }
});
```

### Phase 3: 明白な実装

```javascript
// テストが増えたら一般化
function extractVideoId(url) {
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtu\.be\/([^?]+)/,
    /youtube\.com\/embed\/([^?]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  throw new Error('Invalid YouTube URL');
}
```

## 🔄 t-wadaの重要原則

### 1. テストの意図を明確に
```javascript
// ❌ 悪い例
test('test1', () => { ... });

// ✅ 良い例
test('YouTube URLから動画IDを正しく抽出できる', () => { ... });
```

### 2. Arrage-Act-Assert パターン
```javascript
test('動画を3つのセグメントに分割できる', () => {
  // Arrange（準備）
  const videoPath = '/tmp/test.mp4';
  const duration = 30;
  
  // Act（実行）
  const segments = splitVideo(videoPath, duration);
  
  // Assert（検証）
  expect(segments).toHaveLength(3);
  expect(segments[0].start).toBe(0);
  expect(segments[0].end).toBe(10);
});
```

### 3. テストの独立性
```javascript
// 各テストは独立して実行可能
beforeEach(() => {
  // テストごとに初期化
  cleanup();
});

afterEach(() => {
  // テストごとに後片付け
  removeTestFiles();
});
```

## 🚀 実装順序（t-wada推奨）

### Step 1: Walking Skeleton（歩くガイコツ）
最小限のE2E動作を実現
```javascript
test('URLを入力してZIPをダウンロードできる', async () => {
  const result = await processVideo('https://youtube.com/watch?v=test');
  expect(result.zipPath).toMatch(/\.zip$/);
});
```

### Step 2: 縦に薄く切る
機能を垂直に実装
```
1. YouTube URL → 動画情報取得 ✅
2. 動画ダウンロード ✅
3. セグメント分割 ✅
4. ZIP作成 ✅
```

### Step 3: 横に広げる
各機能を充実化
```
- エラーハンドリング追加
- 複数フォーマット対応
- パフォーマンス最適化
```

## 📝 t-wadaの格言

> "テストがないことを恐れるのではなく、テストがないまま書き続けることを恐れよ"

> "TDDは設計手法である"

> "テストは仕様書である"

## 🎬 今すぐ始めるTDD

```bash
# 1. 最初のテストを書く
npm test -- --watch

# 2. Redを確認
# 3. 最小限の実装
# 4. Greenを確認
# 5. リファクタリング
# 6. 繰り返し
```

**重要**: テストを書くことで、使いやすいAPIが自然に生まれる