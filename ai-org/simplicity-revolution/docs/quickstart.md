# クイックスタート - 5分で革命を体験

## 1分目: インストール
```bash
npm install -g simplicity-revolution
# または
git clone https://github.com/yourusername/simplicity-revolution
```

## 2分目: 最初のS級コード
```bash
echo "export const add = (a, b) => a + b;" > add.js
simplicity score add.js
# S級 (95点) - 1行 - 完璧！
```

## 3分目: 5分TDD実践
```bash
simplicity tdd multiply
# テストと実装のテンプレートが生成される
```

## 4分目: 実装
```javascript
// 生成されたテンプレートを編集
test('multiply', () => {
  expect(multiply(2, 3)).toBe(6);
  expect(multiply(0, 5)).toBe(0);
});

export const multiply = (a, b) => a * b;
```

## 5分目: 完了！
```bash
npm test multiply.test.js
# ✅ All tests passed!
```

## 次のステップ

1. [8行パターン集](../patterns/8-line-patterns.md)を読む
2. [37秒チャレンジ](../examples/37-seconds-miracle.md)に挑戦
3. [コミュニティ](https://discord.gg/simplicity)に参加

## 格言

> "The best code is no code. The next best is one line."

さあ、今すぐ5分タイマーをセットして、何か作ってみよう！