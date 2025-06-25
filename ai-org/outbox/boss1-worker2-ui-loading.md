# Worker2タスク - ローディング表示実装

## 即座実行（30分以内）

### ファイル: src/app/simple/page.tsx

### 1. ローディングコンポーネント追加
```jsx
{isProcessing && (
  <div className="flex flex-col items-center space-y-4">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
    <p className="text-gray-600">
      {stage === 'downloading' && 'ダウンロード中...'}
      {stage === 'analyzing' && 'AI分析中...'}
      {stage === 'splitting' && '動画分割中...'}
    </p>
  </div>
)}
```

### 2. エラーメッセージ改善
```jsx
{error && (
  <div className="bg-red-50 p-4 rounded-lg">
    <p className="text-red-600">
      有効なYouTube URLを入力してください
      <br />
      <span className="text-sm">例: https://youtube.com/watch?v=...</span>
    </p>
  </div>
)}
```

### 3. data-testid追加
各要素に適切なdata-testidを追加

7分記録を超えろ！