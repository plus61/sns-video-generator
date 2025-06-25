# 統合テスト実施計画

## 現在の状況

### テスト環境構成
- **テストページ**: `/test/integration` - VideoUploaderコンポーネントの統合テスト用ページ
- **コンポーネント**: 
  - `VideoUploader.tsx` - ファイルアップロードとYouTube URL取得
  - `useVideoUpload` フック - アップロード処理とSSE進捗管理
- **APIエンドポイント**:
  - `/api/upload-file` - ファイルアップロード
  - `/api/upload-progress` - SSE進捗配信
  - `/api/upload-youtube` - YouTube動画取得

### 既存のテストファイル
- `__tests__/integration/video-workflow.test.ts` - モックベースの統合テスト
- Jest設定完備（jest.config.js）
- Playwright設定あり（E2Eテスト用）

## 主要テストフロー

### 1. 正常系フロー
```
1. ファイルアップロード
   - ファイル選択 → アップロード開始
   - 進捗表示（0% → 100%）
   - アップロード完了通知
   - VideoIDの取得と表示

2. YouTube URL取得
   - URL入力 → 取得開始
   - 処理中表示
   - 完了通知
   - VideoIDの取得と表示

3. リアルタイム進捗更新（SSE）
   - EventSource接続確立
   - 進捗イベント受信
   - UI更新
   - 完了時の自動切断
```

### 2. 異常系フロー
```
1. 大容量ファイル（2GB超）
   - エラーメッセージ表示
   - アップロード拒否

2. 不正なファイル形式
   - 非動画ファイルの拒否
   - エラーメッセージ表示

3. ネットワークエラー
   - アップロード中の切断
   - SSE再接続（最大3回）
   - タイムアウト処理

4. 無効なYouTube URL
   - 形式チェック
   - エラーメッセージ表示
```

### 3. 境界値テスト
```
1. ファイルサイズ
   - 最小: 1KB
   - 境界値: 2GB（2,147,483,648 bytes）
   - 最大超過: 2GB + 1byte

2. 同時アップロード
   - 複数ファイルの同時処理
   - リソース競合の確認

3. 長時間処理
   - 大容量ファイルの処理時間
   - タイムアウト設定の確認
```

## 必要な環境変数

```bash
# Supabase（必須）
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# テスト用設定
NODE_ENV=test
VERCEL=1  # Vercel環境をシミュレート
```

## テスト実行手順

### 1. ローカル環境セットアップ
```bash
# 依存関係インストール
npm install

# 環境変数設定
cp .env.example .env.local
# .env.localを編集してSupabase認証情報を設定

# 開発サーバー起動
npm run dev
```

### 2. 手動統合テスト
```bash
# ブラウザで開く
open http://localhost:3000/test/integration

# テストケース実行
1. 小さな動画ファイル（< 100MB）をアップロード
2. 進捗バーの動作確認
3. 完了メッセージとVideoID確認
4. YouTube URL入力テスト
5. エラーケースの確認
```

### 3. 自動テスト実行
```bash
# 単体テスト
npm test

# 統合テスト特定実行
npm test -- __tests__/integration/

# E2Eテスト（Playwright）
npm run test:e2e:local
```

## ログ確認方法

### 1. ブラウザコンソール
```javascript
// 以下のログが出力される
"Upload started"
"Upload progress: [数値]"
"Upload completed: [videoId]"
"Upload ended"
```

### 2. サーバーログ
```bash
# Next.jsサーバーログ
# ターミナルでnpm run devを実行したウィンドウで確認

# 主要ログポイント
- APIエンドポイントへのリクエスト
- Supabaseストレージ操作
- SSE接続状態
- エラー詳細（開発環境のみ）
```

### 3. ネットワークタブ
```
DevTools > Network タブで確認:
- /api/upload-file へのPOSTリクエスト
- /api/upload-progress へのEventSource接続
- レスポンスペイロード
- タイミング情報
```

## エラー確認チェックリスト

- [ ] ファイルサイズ制限エラー表示
- [ ] ファイル形式エラー表示
- [ ] ネットワークエラー時の再試行
- [ ] SSE接続エラー時の復旧
- [ ] キャンセル機能の動作
- [ ] 認証エラー（未実装、TODOあり）

## 既知の制限事項

1. **認証未実装**
   - 現在はハードコードされた`test-user-123`を使用
   - 本番環境では認証実装が必要

2. **ファイルサイズ制限**
   - 最大2GB（コード内でハードコード）
   - Supabaseストレージの制限も確認必要

3. **同時アップロード**
   - 現在は1ファイルずつ処理
   - 複数同時アップロードは未対応

## 次のステップ

1. 認証機能の実装とテスト
2. 大容量ファイル処理の最適化
3. エラーリカバリー機能の強化
4. パフォーマンステストの実施
5. 本番環境でのテスト