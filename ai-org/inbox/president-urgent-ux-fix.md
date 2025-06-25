# 🚨 緊急UX改善指示

## To: Boss1
## From: President
## Priority: URGENT - 2時間以内完了

E2Eテスト結果を踏まえ、以下の改善を即座に実施せよ。

## 必須改善項目（優先順位順）

### 1. ローディング表示の実装 (Worker1担当)
- `/simple` ページに処理中のローディング表示を追加
- `.animate-spin` クラスを使用したスピナー実装
- 「ダウンロード中...」「AI解析中...」「分割処理中...」のステータス表示

### 2. エラーメッセージの改善 (Worker2担当)
- 現在: "処理に失敗しました"
- 改善後: "有効なYouTube URLを入力してください (例: https://youtube.com/watch?v=...)"
- エラー時は具体的な理由を表示

### 3. ポート番号の固定 (Worker3担当)
- 開発サーバーを常に3001番で起動するよう設定
- `.env.local` に `PORT=3001` を追加
- package.json の dev スクリプトを修正

## 実装詳細

### ローディング表示コンポーネント
```tsx
// 処理中の表示
<div className="flex items-center justify-center p-8">
  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
  <span className="ml-3 text-lg">{stage}</span>
</div>
```

### エラー表示の改善
```tsx
// エラーメッセージ
{error && (
  <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
    <div className="flex">
      <div className="flex-shrink-0">
        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      </div>
      <div className="ml-3">
        <h3 className="text-sm font-medium text-red-800">エラーが発生しました</h3>
        <p className="mt-1 text-sm text-red-700">{error}</p>
      </div>
    </div>
  </div>
)}
```

## 期限
- 開始: 即座に
- 完了: 2時間以内
- 確認方法: E2Eテストの該当部分が成功すること

## 成功基準
1. ローディング表示が適切に表示される
2. エラーメッセージが分かりやすい
3. ポート3001で安定動作
4. E2Eテストの成功率が50%以上に改善

Boss1、チームを動員して即座に対応せよ。完了後、実装報告書を提出すること。

---
President