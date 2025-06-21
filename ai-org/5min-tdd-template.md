# ⚡ 5分TDDテンプレート

## 世界最速の開発メソッド

**原則**: 完璧より完了。シンプルが最強。

### ⏱️ タイムボックス

```
┌────────────────────────────┐
│ 🔴 Red: 3分               │
│ 🟢 Green: 2分             │
│ 🔵 Refactor: 0分          │
│ ─────────────────────────  │
│ 合計: 5分で機能完成！       │
└────────────────────────────┘
```

## 🔴 Red Phase（3分）

### 1分目: テスト作成
```typescript
test('機能名', () => {
  const result = 関数名(入力);
  expect(result).toBe(期待値);
});
```

### 2分目: 実行＆失敗確認
```bash
npm test
# Error: 関数名 is not defined ✅
```

### 3分目: 最小限のアサーション追加
```typescript
test('エラーケース', () => {
  const result = 関数名(無効な入力);
  expect(result).toBe(エラー);
});
```

## 🟢 Green Phase（2分）

### 1分目: 最速実装
```typescript
export function 関数名(入力) {
  if (!入力) return エラー;
  return 期待値;
}
```

### 2分目: テスト成功確認
```bash
npm test
# ✅ All tests passed!
```

## 🔵 Refactor Phase（0分）

**既にシンプル！リファクタリング不要！**

理由:
- 8行以内
- 単一責任
- 明確な名前
- テスト済み

## 📋 5分TDDチェックリスト

### 開始前（30秒）
- [ ] 機能を1文で説明できる
- [ ] 入力と出力が明確
- [ ] 8行で実装可能

### Red Phase
- [ ] テストファイル作成（30秒）
- [ ] 最小限のテスト記述（1分）
- [ ] 失敗を確認（30秒）
- [ ] エラーケース追加（1分）

### Green Phase
- [ ] 実装ファイル作成（30秒）
- [ ] 最小限の実装（1分）
- [ ] テスト成功確認（30秒）

### 完了
- [ ] コミット（既に完成品！）

## 🎯 成功の秘訣

### DO's ✅
1. **YAGNI**: 今必要なものだけ
2. **KISS**: とにかくシンプルに
3. **DRY**: でも最初は気にしない

### DON'Ts ❌
1. 将来の拡張を考える
2. 完璧を求める
3. 8行を超える

## 🚀 実例テンプレート

### 例1: バリデーション関数（3分）
```typescript
// テスト
test('emailバリデーション', () => {
  expect(isEmail('test@example.com')).toBe(true);
  expect(isEmail('invalid')).toBe(false);
});

// 実装（5行）
export function isEmail(email) {
  if (!email) return false;
  return email.includes('@');
}
```

### 例2: 計算関数（2分）
```typescript
// テスト
test('消費税計算', () => {
  expect(addTax(100)).toBe(110);
  expect(addTax(0)).toBe(0);
});

// 実装（3行）
export function addTax(price) {
  return price * 1.1;
}
```

### 例3: 変換関数（4分）
```typescript
// テスト
test('スネークケースに変換', () => {
  expect(toSnake('userId')).toBe('user_id');
  expect(toSnake('')).toBe('');
});

// 実装（4行）
export function toSnake(str) {
  if (!str) return '';
  return str.replace(/([A-Z])/g, '_$1').toLowerCase();
}
```

## 💡 マインドセット

> "In 5 minutes, you can change the world... one function at a time."

### 思考プロセス
1. **問題**: 何を解決する？（30秒）
2. **入出力**: 何を受け取り、何を返す？（30秒）
3. **実装**: 最短経路は？（4分）

### 判断基準
```
複雑そう？ → 分割して5分TDDを2回
8行超えそう？ → 機能を削る
リファクタしたい？ → 次の5分で
```

## 📊 効果測定

### Before（従来のTDD）
- 準備: 10分
- Red: 15分
- Green: 20分
- Refactor: 15分
- **合計: 60分**

### After（5分TDD）
- 準備: 0分（含まれてる）
- Red: 3分
- Green: 2分
- Refactor: 0分
- **合計: 5分**

**12倍高速化！** 🚀

## 🎖️ 5分TDD認定基準

### Bronze（銅）
- [ ] 5分で1機能完成
- [ ] テスト2個以上
- [ ] 8行以内実装

### Silver（銀）
- [ ] 3分で完成
- [ ] エラーハンドリング含む
- [ ] 5行以内実装

### Gold（金）
- [ ] 2分で完成
- [ ] 複数の入力パターン対応
- [ ] 3行以内実装

## 🔥 今すぐ始める

```bash
# タイマーセット
npm install -g cli-timer
timer 5m

# テスト作成
touch quick.test.js

# 実装
touch quick.js

# GO! 🚀
```

**Remember**: 5分後には新しい機能が動いている。それが5分TDDの魔法。