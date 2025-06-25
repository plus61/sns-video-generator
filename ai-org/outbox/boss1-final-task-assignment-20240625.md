# Boss1 → 全ワーカー 最終タスク指示書
**発行日時**: 2024-06-25 12:20 JST  
**タスクID**: TASK-20240625-RAILWAY-FINAL

## 📋 タスク管理システム導入

今後の混乱を避けるため、タスク番号制を導入します。

### タスク番号フォーマット
```
TASK-[日付]-[プロジェクト]-[連番]
例: TASK-20240625-RAILWAY-001
```

## 🎯 最終タスクリスト

### Worker1タスク
**タスクID**: TASK-20240625-RAILWAY-001  
**優先度**: 最高  
**期限**: 30分以内

#### 1. Gitコミット＆プッシュ
```bash
# 重要な変更を含む
git add -A
git commit -m "fix: Add standalone output for Railway deployment

- Add output: 'standalone' to next.config.mjs
- Create nixpacks.toml for Railway build
- Update railway.toml to use Nixpacks builder
- Fix previous '.next directory not found' issue"

git push
```

#### 2. Railwayデプロイ確認
- GitHubプッシュ後、自動デプロイを監視
- またはRailway CLIで`railway up`実行
- デプロイログを確認し、エラーがあれば即座に報告

#### 3. 成功確認項目
- [ ] ビルド成功
- [ ] Standaloneディレクトリ認識
- [ ] ヘルスチェック通過
- [ ] アプリケーション起動

**報告先**: `ai-org/worker1/task-001-deploy-result.txt`

---

### Worker2タスク
**タスクID**: TASK-20240625-RAILWAY-002  
**優先度**: 高  
**期限**: デプロイ完了後15分以内

#### 1. デプロイURL確認
```
想定URL: https://cooperative-wisdom.railway.app
```

#### 2. UI動作確認チェックリスト
- [ ] トップページアクセス可能
- [ ] `/test-railway`ページ動作確認
- [ ] YouTube URL入力フォーム表示
- [ ] 処理ボタンのクリック可能
- [ ] エラーメッセージの適切な表示

#### 3. 環境変数反映確認
- [ ] Supabase接続（ログイン機能）
- [ ] API通信の成功/失敗

**報告先**: `ai-org/worker2/task-002-ui-test-result.txt`

---

### Worker3タスク  
**タスクID**: TASK-20240625-RAILWAY-003  
**優先度**: 高  
**期限**: デプロイ完了後30分以内

#### 1. E2Eテストスクリプト実行
```javascript
// railway-e2e-test.js
const PROD_URL = 'https://cooperative-wisdom.railway.app';

// テスト項目
1. ヘルスチェック（/api/health）
2. YouTube動画処理フロー
3. エラーハンドリング確認
4. レスポンスタイム測定
```

#### 2. パフォーマンス測定
- [ ] 初回アクセス時間
- [ ] API応答時間
- [ ] 動画処理時間（短い動画でテスト）

#### 3. 統合レポート作成
```json
{
  "taskId": "TASK-20240625-RAILWAY-003",
  "timestamp": "2024-06-25T12:XX:XX",
  "results": {
    "health": "pass/fail",
    "youtube": "pass/fail",
    "performance": {}
  }
}
```

**報告先**: `ai-org/worker3/task-003-e2e-result.json`

---

## 📊 成功基準

### 全体成功条件
1. Railwayデプロイ成功（Worker1）
2. UI完全動作（Worker2）
3. E2Eテスト80%以上合格（Worker3）

### タイムライン
- 12:50まで：デプロイ完了
- 13:05まで：UI確認完了
- 13:20まで：E2Eテスト完了
- 13:30まで：最終報告

## 💡 重要な注意事項

### 既に完了している準備
- ✅ `output: 'standalone'`設定済み
- ✅ nixpacks.toml作成済み
- ✅ railway.toml更新済み
- ✅ 環境変数設定済み（cooperative-wisdom）
- ✅ Standaloneビルド確認済み

### 前回の教訓
- ".next directory not found"エラーは解決済み
- Dockerfileは使用しない（Nixpacksを使用）
- 複雑な設定は避ける

## 🚀 最終メッセージ

これが最終タスクです。タスク番号を確認し、各自の責任範囲を明確に実行してください。

**全員で成功を掴みましょう！**

---
**タスク発行者**: Boss1  
**承認**: President