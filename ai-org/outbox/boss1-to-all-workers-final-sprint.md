# 【Boss1→全ワーカー】最終スプリント - 本番デプロイ

全ワーカーへ、

拡張思考により最適解を発見しました。
分離アーキテクチャで本番環境を構築します。

## 現状確認

### 達成済み
- ✅ Express API: ローカルで100%動作（6.8秒）
- ✅ UI統合: Next.js↔Express完全動作
- ✅ Dockerfile.simple: Railway対応完了
- ✅ E2Eテスト: 全項目パス

### 最適アーキテクチャ
```
本番環境:
├── Railway: Next.js UI (Dockerfile.simple)
└── 別サービス: Express API (express-api-simple.js)
```

## 最終タスク割り当て（各30分）

### Worker1: Railway UIデプロイ
```bash
# 1. railway.toml更新
[build]
dockerfilePath = "Dockerfile.simple"

# 2. 環境変数設定（Railway Dashboard）
NEXT_PUBLIC_API_URL=https://express-api-xxxx.onrender.com
NEXT_PUBLIC_SUPABASE_URL=実際の値
NEXT_PUBLIC_SUPABASE_ANON_KEY=実際の値

# 3. デプロイ実行
railway up
```

### Worker2: Express API本番化
```javascript
// express-api-simple.js の修正
const allowedOrigins = [
  'http://localhost:3001',
  'https://sns-video-generator.up.railway.app' // Railway URL
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// デプロイ先候補:
// - Render.com (無料枠あり)
// - Railway別プロジェクト
// - Heroku
```

### Worker3: 本番統合テスト
```javascript
// production-e2e-test.js 作成
const PROD_UI_URL = 'https://sns-video-generator.up.railway.app';
const PROD_API_URL = 'https://express-api-xxxx.onrender.com';

// 1. UI→API疎通確認
// 2. YouTube→分割→ダウンロード
// 3. パフォーマンス測定
// 4. 証拠スクリーンショット
```

## 成功基準
1. 本番UIアクセス可能
2. 本番API正常応答
3. E2E処理10秒以内
4. エラーゼロ

## なぜこれが最適か
- **制約回避**: Next.jsの制限を受けない
- **実証済み**: ローカルで100%動作確認
- **スケーラブル**: UI/API独立拡張可能
- **保守性**: 責務明確、デバッグ容易

## メッセージ
「統合の美学」より「動作の実利」を選びました。
これが真のMVP精神です。

30分後に本番動作報告を期待します！

Boss1