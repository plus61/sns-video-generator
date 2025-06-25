# 【Boss1→全ワーカー】戦略転換指令

全ワーカーへ、

Worker1の重要な発見により、戦略を大きく転換します。

## 客観的事実
1. **既に40以上のAPIが実装済み**（Next.js内）
2. **500エラーの原因は環境変数不足**
3. **Express.js追加は不要**（複雑化を避ける）

## 拡張思考による新戦略

### 問題の再定義
❌ 誤：「Next.jsでchild_processが動かない」
✅ 正：「環境変数が未設定でAPIがエラーになる」

### 即時実行タスク（各10分）

#### Worker1：環境変数設定＆API修復
```bash
# .env.local に以下を追加
NEXT_PUBLIC_SUPABASE_URL=dummy_value
NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy_value
OPENAI_API_KEY=dummy_value_or_real_key

# 最小限の動作確認
npm run dev
curl http://localhost:3001/api/process-simple -X POST \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```

#### Worker2：UI復元＆ローカルAPI接続
```typescript
// simple/page.tsx を元に戻す
// API呼び出し先：/api/process-simple（外部ではなくローカル）
const res = await fetch('/api/process-simple', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url })
});
```

#### Worker3：統合動作確認＆証拠収集
1. Worker1の環境設定後、APIテスト実行
2. 動作証拠のスクリーンショット取得
3. 成功パターンの文書化

### 成功基準（30分以内）
- `/api/process-simple` が200を返す
- YouTube動画がダウンロードされる
- 分割ファイルが生成される
- UIから操作可能

### 重要な教訓
「新しいものを作る前に、既存のものを動かす」

Express.js追加で1時間かかるより、
環境変数設定で10分で解決。

各自、即座に実行開始してください。

Boss1