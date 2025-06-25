# テスト用YouTube URL リスト
*API動作テスト準備 - Worker2作成*

## 推奨テストURL（短い動画）

### 1. 基本テスト用（10秒動画）
```
https://www.youtube.com/watch?v=aqz-KE-bpKQ
```
- Big Buck Bunny (10秒版)
- 軽量で高速処理可能
- 著作権フリー

### 2. エラーテスト用
```
https://www.youtube.com/watch?v=invalid_video_id
```
- 存在しない動画ID
- 404エラーのテスト

### 3. 実用テスト用（30秒動画）
```
https://www.youtube.com/watch?v=jNQXAC9IVRw
```
- "Me at the zoo" (最初のYouTube動画)
- 短時間で歴史的価値

### 4. 日本語コンテンツテスト用
```
https://www.youtube.com/watch?v=FtutLA63Cp8
```
- 短いアニメーション
- 日本語タイトル処理確認

## テスト手順

1. `/api/process-simple` エンドポイントに POST
2. リクエストボディ:
```json
{
  "url": "https://www.youtube.com/watch?v=aqz-KE-bpKQ"
}
```

3. 期待されるレスポンス:
- videoId
- fileSize
- summary
- segments配列

## エラーケース対応準備

- **ネットワークエラー**: インターネット接続確認メッセージ
- **404エラー**: 動画が見つからないメッセージ
- **403エラー**: アクセス制限メッセージ
- **タイムアウト**: 処理時間超過メッセージ

---
*Worker1のサーバー再起動後、即座にテスト実行可能*