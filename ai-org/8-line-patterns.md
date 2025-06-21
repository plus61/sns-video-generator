# 🎯 8行実装パターン集

## 究極のシンプリシティ

**哲学**: 8行で表現できないものは、まだ理解していない。

## 📚 パターンカタログ

### 1. バリデーションパターン（3-5行）

#### メール検証
```typescript
export const isEmail = (email: string): boolean => {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};
```
**行数**: 3行

#### 数値範囲チェック
```typescript
export const isInRange = (value: number, min: number, max: number): boolean => {
  return value >= min && value <= max;
};
```
**行数**: 2行

#### 必須フィールドチェック
```typescript
export const isRequired = (value: any): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
};
```
**行数**: 5行

### 2. 変換パターン（2-4行）

#### キャメルケース → スネークケース
```typescript
export const toSnakeCase = (str: string): string => {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
};
```
**行数**: 2行

#### 配列のユニーク化
```typescript
export const unique = <T>(arr: T[]): T[] => {
  return [...new Set(arr)];
};
```
**行数**: 2行

#### オブジェクトのキー抽出
```typescript
export const pluck = <T, K extends keyof T>(arr: T[], key: K): T[K][] => {
  return arr.map(item => item[key]);
};
```
**行数**: 2行

### 3. 計算パターン（1-3行）

#### パーセント計算
```typescript
export const percentage = (value: number, total: number): number => {
  return total === 0 ? 0 : (value / total) * 100;
};
```
**行数**: 2行

#### 平均値
```typescript
export const average = (numbers: number[]): number => {
  return numbers.length === 0 ? 0 : numbers.reduce((a, b) => a + b) / numbers.length;
};
```
**行数**: 2行

#### 最大・最小
```typescript
export const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};
```
**行数**: 2行

### 4. フィルタリングパターン（2-5行）

#### Truthy値のみ
```typescript
export const compact = <T>(arr: (T | null | undefined)[]): T[] => {
  return arr.filter((item): item is T => item != null);
};
```
**行数**: 2行

#### オブジェクト配列の検索
```typescript
export const findBy = <T>(arr: T[], key: keyof T, value: any): T | undefined => {
  return arr.find(item => item[key] === value);
};
```
**行数**: 2行

#### 条件付きフィルタ
```typescript
export const filterBy = <T>(arr: T[], predicate: (item: T) => boolean): T[] => {
  return arr.filter(predicate);
};
```
**行数**: 2行

### 5. 文字列操作パターン（2-4行）

#### トリム＆正規化
```typescript
export const normalize = (str: string): string => {
  return str.trim().toLowerCase().replace(/\s+/g, ' ');
};
```
**行数**: 2行

#### 省略表示
```typescript
export const truncate = (str: string, length: number): string => {
  return str.length <= length ? str : str.slice(0, length - 3) + '...';
};
```
**行数**: 2行

#### URLスラッグ生成
```typescript
export const slugify = (str: string): string => {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
};
```
**行数**: 2行

### 6. 日付操作パターン（2-5行）

#### 相対時間
```typescript
export const daysAgo = (date: Date): number => {
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
};
```
**行数**: 2行

#### フォーマット（シンプル版）
```typescript
export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};
```
**行数**: 2行

#### 今日かどうか
```typescript
export const isToday = (date: Date): boolean => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};
```
**行数**: 3行

### 7. エラーハンドリングパターン（3-6行）

#### Try-Catch ラッパー
```typescript
export const tryCatch = async <T>(fn: () => Promise<T>): Promise<[T, null] | [null, Error]> => {
  try {
    return [await fn(), null];
  } catch (error) {
    return [null, error as Error];
  }
};
```
**行数**: 6行

#### デフォルト値付き取得
```typescript
export const getOrDefault = <T>(fn: () => T, defaultValue: T): T => {
  try { return fn(); } catch { return defaultValue; }
};
```
**行数**: 2行

### 8. 関数型パターン（2-4行）

#### パイプ（2つの関数合成）
```typescript
export const pipe = <A, B, C>(f: (a: A) => B, g: (b: B) => C) => (a: A): C => {
  return g(f(a));
};
```
**行数**: 3行

#### メモ化（シンプル版）
```typescript
export const memoize = <T extends (...args: any[]) => any>(fn: T): T => {
  const cache = new Map();
  return ((...args) => cache.get(args) ?? cache.set(args, fn(...args)).get(args)) as T;
};
```
**行数**: 4行

#### デバウンス（最小版）
```typescript
export const debounce = (fn: Function, delay: number) => {
  let timer: any;
  return (...args: any[]) => (clearTimeout(timer), timer = setTimeout(() => fn(...args), delay));
};
```
**行数**: 4行

## 🎨 組み合わせパターン

### データ処理チェーン（8行）
```typescript
export const processUserData = (users: any[]) => {
  return users
    .filter(user => user.active)                    // アクティブユーザーのみ
    .map(user => ({ ...user, name: user.name.trim() }))  // 名前をトリム
    .sort((a, b) => a.name.localeCompare(b.name))   // 名前でソート
    .slice(0, 10);                                   // 上位10件
};
```

### バリデーションチェーン（6行）
```typescript
export const validateUser = (user: any) => {
  if (!user?.email || !isEmail(user.email)) return { valid: false, error: 'Invalid email' };
  if (!user?.age || !isInRange(user.age, 18, 120)) return { valid: false, error: 'Invalid age' };
  if (!user?.name || !isRequired(user.name)) return { valid: false, error: 'Name required' };
  return { valid: true };
};
```

## 💡 8行の極意

### なぜ8行？
1. **認知負荷**: 人間が一度に理解できる限界
2. **画面表示**: エディタで一目で見える
3. **テスト容易**: 複雑度が低い
4. **保守性**: 誰でも理解できる

### 8行を超えそうなとき
```
Q: 機能が複雑で8行に収まらない
A: 機能を分割する

Q: エラーハンドリングで行数オーバー
A: エラーは呼び出し側で処理

Q: 型定義で行数を使う
A: 型定義は別ファイルに

Q: コメントを入れたい
A: 名前で説明する
```

## 🚀 実践演習

### Level 1: 2行チャレンジ
```typescript
// お題: 配列の最後の要素を取得
export const last = <T>(arr: T[]): T | undefined => arr[arr.length - 1];
```

### Level 2: 4行チャレンジ
```typescript
// お題: オブジェクトのnull値を除去
export const removeNulls = (obj: any) => {
  return Object.entries(obj)
    .filter(([_, v]) => v != null)
    .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});
};
```

### Level 3: 8行チャレンジ
```typescript
// お題: 階層的なオブジェクトから値を安全に取得
export const get = (obj: any, path: string, defaultValue?: any) => {
  const keys = path.split('.');
  let result = obj;
  for (const key of keys) {
    result = result?.[key];
    if (result === undefined) return defaultValue;
  }
  return result;
};
```

### 9. AIパターン（2-5行）🆕

#### プロンプトテンプレート
```typescript
export const createPrompt = (role: string, task: string, context?: string): string => {
  return `You are ${role}. ${task}${context ? ` Context: ${context}` : ''}`;
};
```
**行数**: 2行

#### レスポンス解析
```typescript
export const parseAIResponse = (response: string, format: 'json' | 'text' = 'text'): any => {
  if (format === 'text') return response.trim();
  try { return JSON.parse(response); } catch { return null; }
};
```
**行数**: 3行

#### トークン概算
```typescript
export const estimateTokens = (text: string): number => {
  // 簡易計算: 英語は4文字/トークン、日本語は2文字/トークン
  const japaneseChars = (text.match(/[\u3000-\u9fff\uff00-\uffef]/g) || []).length;
  const englishChars = text.length - japaneseChars;
  return Math.ceil(englishChars / 4 + japaneseChars / 2);
};
```
**行数**: 5行

## 🏆 8行マスターへの道

### 初級（1ヶ月）
- [ ] 基本パターンを暗記
- [ ] 毎日1つ8行関数を書く
- [ ] 既存コードを8行に圧縮

### 中級（3ヶ月）
- [ ] オリジナルパターン作成
- [ ] 8行で複雑な問題解決
- [ ] チームに8行文化を広める

### 上級（6ヶ月）
- [ ] 4行以内を目指す
- [ ] 8行パターンライブラリ公開
- [ ] 8行TDD講師になる

## 📝 最後に

> "Perfection is achieved when there is nothing left to take away."
> 
> 完璧とは、削るものがなくなったとき。

8行は制約ではなく、創造性の源泉。
制限があるからこそ、本質が見える。

**今日から実践**: 次に書く関数を8行以内に挑戦しよう！