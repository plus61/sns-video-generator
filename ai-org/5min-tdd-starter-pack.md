# 🚀 5分TDD スターターパック

## JavaScript版（最速）

```javascript
// 1. テスト作成（1分）
test('機能名', () => {
  expect(myFunc('input')).toBe('output');
});

// 2. 実装（1分）
export const myFunc = (input) => 'output';

// 3. 完了！（3分余る）
```

## TypeScript版（型安全）

```typescript
// 1. テスト作成（1.5分）
test('機能名', () => {
  const result: string = myFunc('input');
  expect(result).toBe('output');
});

// 2. 実装（1.5分）
export const myFunc = (input: string): string => 'output';

// 3. 型チェック通過！（2分余る）
```

## Python版（シンプル）

```python
# 1. テスト作成（1分）
def test_my_func():
    assert my_func('input') == 'output'

# 2. 実装（1分）
def my_func(input):
    return 'output'

# 3. pytest通過！（3分余る）
```

## 汎用テンプレート

### バリデーション（2分）
```javascript
test('validate', () => {
  expect(isValid('good')).toBe(true);
  expect(isValid('')).toBe(false);
});

const isValid = (val) => !!val && val.length > 0;
```

### 変換（3分）
```javascript
test('transform', () => {
  expect(transform('ABC')).toBe('abc');
  expect(transform('')).toBe('');
});

const transform = (str) => str.toLowerCase();
```

### 計算（2分）
```javascript
test('calculate', () => {
  expect(calc(10, 20)).toBe(30);
  expect(calc(0, 0)).toBe(0);
});

const calc = (a, b) => a + b;
```

## 成功の秘訣

1. **考えない** - 手を動かす
2. **最小限** - 2つのテストで十分
3. **8行以内** - 制約が品質を生む

## 今すぐ始める

```bash
# タイマーセット
timer 5m

# ファイル作成
touch quick.test.js quick.js

# GO! 
```

**5分後、あなたは新機能を手に入れている！**