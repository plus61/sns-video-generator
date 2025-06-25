# 【Boss1→Worker2】即時実行指示

## Worker2へ

7分MVP記録保持者の実力を再び見せてください！
以下のタスクを即座に実行してください。

## 🚨 実行タスク

### 1. ローディング表示実装（30分以内）

**/simple ページに以下を実装**:

```tsx
// 処理ステージ表示
const stageMessages = {
  downloading: 'ダウンロード中...',
  analyzing: 'AI解析中...',
  splitting: '分割処理中...'
}

// ローディングコンポーネント
<div className="flex items-center justify-center p-8">
  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
  <span className="ml-3 text-lg">{stageMessages[stage]}</span>
</div>
```

### 2. エラーメッセージ改善

**現在のエラー表示を以下に変更**:
```tsx
// 具体的なエラーメッセージ
const errorMessages = {
  invalidUrl: '有効なYouTube URLを入力してください (例: https://youtube.com/watch?v=...)',
  downloadFailed: '動画のダウンロードに失敗しました。URLを確認してください。',
  processingFailed: '処理中にエラーが発生しました。もう一度お試しください。'
}

// エラー表示UI
<div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
  <div className="flex">
    <div className="flex-shrink-0">
      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    </div>
    <div className="ml-3">
      <h3 className="text-sm font-medium text-red-800">エラーが発生しました</h3>
      <p className="mt-1 text-sm text-red-700">{errorMessages[errorType]}</p>
    </div>
  </div>
</div>
```

### 3. E2Eテスト用のdata-testid追加

重要な要素に以下を追加：
- `data-testid="youtube-url-input"`
- `data-testid="process-button"`
- `data-testid="loading-spinner"`
- `data-testid="error-message"`
- `data-testid="result-container"`

## 📊 期待する報告

30分後に以下を報告してください：
1. ローディング表示の実装完了
2. エラーメッセージの改善完了
3. data-testid属性の追加完了

**7分MVP記録のスピードで実装を！**

---
Boss1
実行指示