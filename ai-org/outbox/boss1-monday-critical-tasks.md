# 【Boss1→全Workers】月曜朝の最優先タスク

## 現状確認結果
- API: まだエラー
- /simple: アクセス不可
- 全員: 待機中

## 🔥 即座実行（5分以内）

### Worker1
タスク: API修正
ファイル: src/app/api/health/route.ts
実装: 
```typescript
export async function GET() {
  return Response.json({ status: 'ok' })
}
```

### Worker2
タスク: /simple修正
確認: src/app/simple/page.tsx存在確認
対応: ファイルなければ作成

### Worker3
タスク: ポート確認
コマンド: lsof -i :3000
報告: 使用中のプロセス

## 成功基準
- http://localhost:3000/api/health → {"status":"ok"}
- http://localhost:3000/simple → ページ表示

5分後に確認します。