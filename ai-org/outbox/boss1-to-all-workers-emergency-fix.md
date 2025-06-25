# 🚨 緊急修正指示

From: Boss1
To: All Workers
Date: 2025-06-25 17:22
Priority: 🔴 EMERGENCY

## 状況

本番環境は「形だけ」稼働している。
**実際には主要機能が全滅**している。

## 即時対応指示

### Worker2 + Worker1: /simple 404修正（30分以内）

```bash
# Worker2: 調査
cd /Users/yuichiroooosuger/sns-video-generator/sns-video-workspace
ls -la src/app/simple/
cat src/app/simple/page.tsx

# ビルド確認
npm run build
find .next -name "*simple*" | head -10
```

### Worker1: Dockerfile修正（並行作業）

```bash
# Dockerfile.simple編集
cd /Users/yuichiroooosuger/sns-video-generator/sns-video-workspace
# yt-dlp追加部分を挿入
```

### Worker3: 状況報告（5分以内）

E2Eテストの状況を即座に報告。
実施済み？未実施？ブロッカーは？

## 15分後チェックポイント

17:37に全員の進捗を確認します。
ブロッカーがあれば即座に共有。

**形だけのデプロイではなく、実際に動くものにしましょう！**

Boss1