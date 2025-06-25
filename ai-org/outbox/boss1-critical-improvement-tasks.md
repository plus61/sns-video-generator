# 緊急改善タスクリスト（拡張思考版）

From: Boss1
To: All Workers
Date: 2025-06-25 17:20
Priority: CRITICAL

## 現状分析

Railway本番環境は稼働しているが、**コア機能が完全に停止**している。
これは「デプロイ成功」とは言えない状態。

## タスク優先度マトリックス

### 🔴 CRITICAL（即座に対応）

#### TASK-20240625-SIMPLE-404-FIX
**担当**: Worker2 + Worker1
**期限**: 30分以内
**内容**: /simpleページ404エラーの緊急修正
```bash
# 調査項目
1. src/app/simple/page.tsx の存在確認
2. .next/server/app/simple の生成確認
3. next.config.mjs のルーティング設定確認
4. Dockerfile.simple の COPY 範囲確認

# 修正案
- 静的生成の強制: export const dynamic = 'force-static'
- ビルド出力の確認: npm run build && ls -la .next/server/app/
```

#### TASK-20240625-YTDLP-DOCKER-FIX
**担当**: Worker1
**期限**: 1時間以内
**内容**: Dockerfile.simpleへのyt-dlp追加
```dockerfile
# Dockerfile.simple修正
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    python3-pip \
    && pip3 install yt-dlp \
    && ln -s /usr/local/bin/yt-dlp /usr/bin/yt-dlp \
    && apt-get clean
```

### 🟠 HIGH（本日中に対応）

#### TASK-20240625-EXPRESS-API-DEPLOY
**担当**: Worker1 + Worker3
**期限**: 2時間以内
**内容**: Express APIサーバーの別デプロイ（回避策）
```bash
# 新規Railway/Renderプロジェクト作成
1. express-api-simple.js を独立プロジェクト化
2. CORS設定で本番URLを許可
3. 環境変数設定（YOUTUBE_DL_PATH等）
4. Next.js側をプロキシ設定
```

#### TASK-20240625-E2E-URGENT-CHECK
**担当**: Worker3
**期限**: 15分以内
**内容**: E2Eテスト結果の即時報告
- 実施済みなら結果報告
- 未実施なら理由説明
- ブロッカーがあれば即座に共有

#### TASK-20240625-LOCAL-VS-PROD-DIFF
**担当**: Worker2
**期限**: 1時間以内
**内容**: ローカルと本番の差異調査
```bash
# 比較項目
1. npm run build のローカル出力
2. Railway ビルドログとの差異
3. 環境変数の完全リスト比較
4. node_modules の差異確認
```

### 🟡 MEDIUM（明日までに対応）

#### TASK-20240625-BUILD-VERIFICATION
**担当**: Worker1
**期限**: 明日午前
**内容**: ビルド検証スクリプトの作成
```bash
#!/bin/bash
# verify-production-build.sh
echo "=== Build Verification ==="
npm run build
echo "=== Route Check ==="
find .next -name "*.html" -o -name "*.js" | grep -E "(simple|api)"
echo "=== Binary Check ==="
which yt-dlp || echo "yt-dlp NOT FOUND"
which ffmpeg || echo "ffmpeg NOT FOUND"
```

#### TASK-20240625-MONITORING-SETUP
**担当**: Worker3
**期限**: 明日午後
**内容**: 本番環境モニタリング強化
- ヘルスチェックの拡張（各機能の動作確認）
- エラー通知の設定
- パフォーマンスメトリクス

#### TASK-20240625-FALLBACK-STRATEGY
**担当**: Worker2
**期限**: 明日中
**内容**: フォールバック戦略の実装
```javascript
// YouTube処理の多層防御
try {
  // 1. yt-dlp試行
} catch {
  try {
    // 2. ytdl-core試行
  } catch {
    try {
      // 3. Express API試行
    } catch {
      // 4. エラーメッセージ表示
    }
  }
}
```

### 🟢 LOW（今週中に対応）

#### TASK-20240625-ARCHITECTURE-REVIEW
**担当**: 全員
**内容**: アーキテクチャの根本見直し
- マイクロサービス化の検討
- 動画処理専用サーバーの分離
- キューシステムの導入

#### TASK-20240625-DOCS-COMPLETE
**担当**: Worker1
**内容**: 完全なデプロイメントガイド作成
- 環境構築手順
- トラブルシューティング
- 本番環境チェックリスト

## 実行優先順位

1. **今すぐ**: Worker3はE2Eテスト状況を報告
2. **次の30分**: Worker2とWorker1で/simple修正
3. **1時間以内**: Worker1がDockerfile修正
4. **2時間以内**: Express API代替案実装

## 成功基準

- [ ] /simpleページが表示される
- [ ] YouTube URLで動画処理が動作
- [ ] 5セグメント生成が確認できる
- [ ] エラーが適切に表示される

## コミュニケーション

- 15分ごとに進捗報告
- ブロッカーは即座に共有
- 解決したら即座に報告

**本番環境を真に「稼働」させるため、全員で協力しましょう！**

Boss1