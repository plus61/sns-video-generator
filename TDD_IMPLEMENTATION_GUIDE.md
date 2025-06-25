# t-wada流TDD実装ガイド

## 🔴 Red → 🟢 Green → ♻️ Refactor

### 現在の実装状況

#### ✅ 完了したステップ

1. **Walking Skeleton（歩くガイコツ）**
   - 最小限のE2E動作を確認するテスト作成
   - 仮実装で即座にGreenに

2. **三角測量**
   - 複数のYouTube URLパターンテスト
   - extractVideoId関数の一般化実装

3. **AAAパターン**
   - Arrange-Act-Assertの明確な構造化
   - beforeEach/afterEachでのテスト独立性確保

### 🎯 次のステップ

```bash
# 1. テスト実行
npm test

# 2. Red（失敗）を確認
# 3. 最小限の実装でGreen
# 4. リファクタリング
```

## 📊 TDDによる実装進捗

### Phase 1: 基本機能（現在）
- [x] YouTube URL解析
- [x] セグメント分割ロジック
- [ ] 実際の動画ダウンロード
- [ ] FFmpeg統合

### Phase 2: 品質向上
- [ ] エラーハンドリング
- [ ] パフォーマンステスト
- [ ] 統合テスト

### Phase 3: 実用化
- [ ] API統合
- [ ] UI連携
- [ ] E2Eテスト

## 🔑 t-wadaの教え

> "テストがドキュメントになる"

各テストは以下を明確に示します：
- 何を実装するか（What）
- どう使うか（How）
- なぜ必要か（Why）

## 実行コマンド

```bash
# テスト監視モード
npm test -- --watch

# 特定のテストファイル実行
npm test -- __tests__/walking-skeleton.test.ts

# カバレッジ確認
npm test -- --coverage
```

## 重要な原則

1. **テストファースト**: 実装前にテストを書く
2. **小さなステップ**: 一度に一つのことだけ
3. **継続的リファクタリング**: Greenを保ちながら改善
4. **YAGNI**: 必要になるまで実装しない

次は実際の動画ダウンロード機能をTDDで実装します。