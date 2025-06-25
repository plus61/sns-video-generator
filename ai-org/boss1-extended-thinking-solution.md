# 拡張思考による問題解決アプローチ

## 問題分析

### 根本原因
- Next.js App Router環境でのchild_process実行制限
- SSR環境での外部プロセス起動の困難性
- 環境変数とセキュリティ制約

### 従来アプローチの失敗理由
- Next.js内でyoutube-dl-execを直接実行しようとした
- APIルートでの複雑な処理を強行した
- 制約内で解決しようとして時間を浪費

## 拡張思考による解決策

### 発想の転換
「Next.jsの制約と戦う」→「制約を回避する」

### 新アーキテクチャ
```
[UI層] Next.js (3001)
   ↓ HTTP
[API層] Express.js (3002)
   ↓ child_process
[処理層] yt-dlp, FFmpeg, etc.
```

### 実装計画
1. **Worker1**: Express APIサーバー構築（30分）
   - YouTube download API
   - Video split API
   - ZIP download API

2. **Worker2**: UI-API統合（20分）
   - fetch先をExpressに変更
   - エラーハンドリング追加

3. **Worker3**: 統合テスト＆デモ（30分）
   - E2Eテストスクリプト
   - デモシナリオ作成

## 利点
- **即効性**: 1時間以内に動作可能
- **確実性**: 制約のない環境で実行
- **拡張性**: 将来的な機能追加が容易
- **保守性**: UI/APIの責務が明確

## 教訓
制約内で無理に解決するより、
制約を回避する別アプローチの方が効率的。

「完璧な統合」より「動く分離」を優先。