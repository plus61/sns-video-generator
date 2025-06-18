# 応答システム使用ガイド

## President側（応答受信）

1. 監視開始:
```bash
./response-monitor.sh
```

2. 別ターミナルでメッセージ送信:
```bash
./agent-send.sh boss1 "状況報告をお願いします"
```

## BOSS/Worker側（応答送信）

```bash
# 応答を送信
./send-response.sh boss1 "全タスク完了。エラーなし。"
./send-response.sh worker1 "Dockerfile修正完了"
```

## ディレクトリ構造
```
messages/
├── inbox/
│   └── president/  # Presidentへの応答
├── outbox/        # 送信履歴
└── processed/     # 処理済み
```
