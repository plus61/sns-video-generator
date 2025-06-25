# 🚨 【Boss1→全Workers】緊急UX改善タスク割り当て

## 背景
PresidentよりE2Eテスト結果を踏まえた緊急改善指示を受けました。
2時間以内に完了必須です。

## タスク割り当て

### Worker1: ローディング表示の実装
**担当ファイル**: `/simple` ページ

**実装内容**:
```tsx
// 処理中の表示
<div className="flex items-center justify-center p-8">
  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
  <span className="ml-3 text-lg">{stage}</span>
</div>
```

**ステージ表示**:
- "ダウンロード中..."
- "AI解析中..."
- "分割処理中..."

### Worker2: エラーメッセージの改善
**現状**: "処理に失敗しました"
**改善後**: 具体的で親切なメッセージ

**実装内容**:
```tsx
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

**エラーメッセージ例**:
- "有効なYouTube URLを入力してください (例: https://youtube.com/watch?v=...)"
- "動画のダウンロードに失敗しました。URLを確認してください。"

### Worker3: ポート番号の固定
**対象**: 開発サーバーを常に3001番で起動

**実装内容**:
1. `.env.local` に追加:
   ```
   PORT=3001
   ```

2. `package.json` の dev スクリプトを修正:
   ```json
   "dev": "next dev -p 3001"
   ```

## タイムライン
- 開始: 即座に
- 進捗報告: 1時間後
- 完了期限: 2時間以内

## 成功基準
1. ローディング表示が適切に表示される
2. エラーメッセージが分かりやすい
3. ポート3001で安定動作
4. E2Eテストの成功率が50%以上に改善

## 優先度
この緊急UX改善を最優先で実施してください。
実動画処理機能は、この後に着手します。

全員、即座に実装を開始してください！
困ったことがあれば即座に相談してください。

---
Boss1