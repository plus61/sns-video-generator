# デバッグログ

## 2025-06-22: API 500エラーの根本解決

### 症状
- Railway環境で `/api/upload-file` エンドポイントが500エラーを返す
- ローカル環境では正常動作
- エラーメッセージ: "Internal server error"

### 環境
- Railway.app (Production)
- Next.js 15.3.3
- Node.js 18
- Supabase (PostgreSQL + Storage)

### 根本原因
1. **EventEmitterの状態管理問題**
   - EventEmitterはメモリ内で状態を保持
   - Railwayのステートレス環境では機能しない
   - リクエスト間でイベントが共有されない

2. **環境変数の欠落**
   - `SUPABASE_SERVICE_ROLE_KEY` が本番環境で未設定
   - ビルド時とランタイムで環境変数が異なる

3. **エラーハンドリングの不足**
   - 詳細なエラーログが出力されていない
   - Supabase接続エラーが適切にキャッチされていない

### 最終解決方法

1. **EventEmitterをSupabase Realtimeに置き換え**
   ```typescript
   // progress-manager.ts を作成
   - Supabase Realtimeを使用した進捗管理
   - データベースに進捗を保存
   - ステートレス環境対応
   ```

2. **環境変数バリデーターの実装**
   ```typescript
   // env-validator.ts を作成
   - 起動時に必須環境変数をチェック
   - 開発環境ではダミー値で継続
   - 本番環境では厳密にチェック
   ```

3. **ヘルスチェックエンドポイントの追加**
   ```typescript
   // /api/health/route.ts
   - 環境変数の検証
   - Supabase接続テスト
   - 詳細なステータス情報
   ```

4. **エラーログの改善**
   ```typescript
   // /api/upload-file/route.ts
   - 詳細なエラー情報を記録
   - 開発環境でエラー詳細を返す
   ```

### 実装した修正

1. `src/lib/progress-manager.ts` - Supabase Realtimeベースの進捗管理
2. `src/lib/env-validator.ts` - 環境変数の検証
3. `supabase/migrations/20250622081823_create_upload_progress_table.sql` - 進捗テーブル
4. `/api/upload-file/route.ts` - EventEmitter削除、ProgressManager使用
5. `/api/upload-progress/route.ts` - Supabase Realtime購読に変更

### 予防策
1. ステートレス環境を前提とした設計
2. 環境変数の自動検証
3. ヘルスチェックによる早期問題検出
4. 詳細なエラーログの実装

### 教訓
- プロダクション環境とローカル環境の違いを常に意識する
- ステートフルな実装（EventEmitter等）は避ける
- 環境変数は起動時に必ず検証する
- エラーハンドリングは最初から詳細に実装する