# 🎯 TDDペアプログラミング・セッションガイド

## セッション概要

**目的**: 動画サムネイル生成機能をTDDで実装し、チーム全体のTDDスキルを向上させる

**参加者**: Worker1（実装担当）、Worker2（テスト設計担当）

**所要時間**: 1時間

## 📋 事前準備チェックリスト

### 環境準備
- [ ] Node.js 18+ インストール済み
- [ ] FFmpeg インストール済み
- [ ] テスト用動画ファイル準備
- [ ] Jest環境設定完了

### 知識確認
- [ ] TDDの基本サイクル（Red-Green-Refactor）理解
- [ ] Jestの基本的な使い方
- [ ] async/awaitの理解

## 🔄 セッション進行

### 0. アイスブレイク（5分）
```
Worker2: 「今日はTDDでサムネイル生成機能を作ります！」
Worker1: 「了解！まずは失敗するテストから書くんですよね？」
Worker2: 「その通り！一緒に小さなステップで進めましょう」
```

### 1. 第1サイクル: 基本実装（15分）

#### Red Phase（5分）
**Worker2がテストを書く**

```typescript
// Worker2: 「最初は一番シンプルなケースから始めます」
test('動画の指定時間からサムネイルを生成する', async () => {
  const result = await generateThumbnail('/test/video.mp4', 10);
  
  expect(result.success).toBe(true);
  expect(result.thumbnailPath).toMatch(/\.png$/);
});
```

**実行**: `npm test -- --watch`
→ 赤色のエラー！これが正常です。

#### Green Phase（5分）
**Worker1が最小限の実装**

```typescript
// Worker1: 「まずはテストを通すだけの実装をします」
export async function generateThumbnail(videoPath: string, timestamp: number) {
  return {
    success: true,
    thumbnailPath: '/tmp/thumbnail.png'
  };
}
```

**実行**: テストが緑色に！

#### Refactor Phase（5分）
**一緒にリファクタリング**

```typescript
// Worker2: 「実際のFFmpeg実装を追加しましょう」
// Worker1: 「エラーハンドリングも必要ですね」

// 実装を改善...
```

### 2. 第2サイクル: エラーハンドリング（15分）

**役割交代！**
- Worker1がテストを書く
- Worker2が実装

#### Red Phase
```typescript
// Worker1: 「エラーケースをテストしましょう」
test('存在しない動画ファイルでエラーを返す', async () => {
  const result = await generateThumbnail('/not/exist.mp4', 10);
  
  expect(result.success).toBe(false);
  expect(result.error).toContain('not found');
});
```

### 3. 第3サイクル: 高度な機能（15分）

#### 複数サムネイル生成
```typescript
// Worker2: 「実用的な機能を追加しましょう」
test('複数のサムネイルを一度に生成する', async () => {
  const result = await generateMultipleThumbnails('/video.mp4', [
    { timestamp: 0 },
    { timestamp: 30 },
    { timestamp: 60 }
  ]);
  
  expect(result.thumbnails).toHaveLength(3);
});
```

### 4. 振り返り（10分）

#### 学んだこと共有
```markdown
## 本日の学び

### Worker1の気づき
- テストファーストで考えると設計が明確になる
- 小さなステップで進むと安心感がある
- リファクタリングが怖くない

### Worker2の気づき
- ペアプロで知識共有が自然にできる
- テストが仕様書の役割を果たす
- 実装の詳細より振る舞いに集中できる
```

## 💡 ペアプロのコツ

### Do's ✅
1. **考えを声に出す**
   ```
   「ここでバリデーションを入れようと思うんですが...」
   「なるほど、それならこういうテストも必要ですね」
   ```

2. **質問を歓迎**
   ```
   「なぜこのアプローチを選んだんですか？」
   「他の方法と比べてどうですか？」
   ```

3. **小さな成功を祝う**
   ```
   「テスト通った！🎉」
   「いいリファクタリングですね！」
   ```

### Don'ts ❌
1. **批判的な言い方**
   ```
   ❌ 「それは間違ってる」
   ✅ 「こういう方法はどうでしょう？」
   ```

2. **一人で進めすぎる**
   ```
   ❌ 黙々とコードを書く
   ✅ 「今からXXを実装しますね」
   ```

## 📊 セッション記録テンプレート

```markdown
# TDDセッション記録 - [日付]

## 参加者
- Driver: [名前]
- Navigator: [名前]

## 実装した機能
- [x] 基本的なサムネイル生成
- [x] エラーハンドリング
- [ ] カスタムオプション

## 作成したテスト
1. 正常系: 5個
2. 異常系: 3個
3. 境界値: 2個

## 気づきと学び
- TDDによって〜
- ペアプロによって〜

## 次回への申し送り
- 残タスク: 
- 改善案: 
```

## 🎯 成功の指標

### 技術面
- [ ] テストカバレッジ 90%以上
- [ ] すべてのテストがグリーン
- [ ] コードがシンプルで読みやすい

### プロセス面
- [ ] 15分ごとに役割交代できた
- [ ] Red-Green-Refactorサイクルを守れた
- [ ] 知識共有が活発だった

### チーム面
- [ ] 楽しくコーディングできた
- [ ] お互いから学べた
- [ ] 次もペアプロしたいと思える

## 🚀 次のステップ

1. **本番実装**
   - CIパイプラインへの統合
   - プロダクション環境でのテスト

2. **知識展開**
   - チーム勉強会の開催
   - TDDベストプラクティスの文書化

3. **継続的改善**
   - 週1回のTDDペアプロセッション
   - 他の機能でもTDD適用

---

**Remember**: TDDは技術ではなく、考え方です。小さく始めて、継続的に改善していきましょう！