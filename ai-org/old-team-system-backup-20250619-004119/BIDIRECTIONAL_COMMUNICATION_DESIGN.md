# 🔄 双方向通信システム設計

## 現状の問題
- 一方向通信のみ（President → BOSS/Worker）
- 応答を受け取る仕組みがない
- リアルタイムな対話が不可能

## 解決策

### 1. ファイルベース通信システム

#### ディレクトリ構造
```
ai-org/
├── messages/
│   ├── inbox/          # 受信メッセージ
│   │   ├── president/  # Presidentへのメッセージ
│   │   ├── boss1/      # Boss1へのメッセージ
│   │   └── worker*/    # 各Workerへのメッセージ
│   └── outbox/         # 送信済みメッセージ
└── responses/          # 応答待ちキュー
```

#### 実装例
```bash
#!/bin/bash
# response-listener.sh - 応答監視スクリプト

RESPONSE_DIR="./messages/inbox/president"
PROCESSED_DIR="./messages/processed"

# 応答監視ループ
watch_responses() {
    while true; do
        for file in "$RESPONSE_DIR"/*.msg 2>/dev/null; do
            if [ -f "$file" ]; then
                echo "📨 応答受信: $(basename "$file")"
                cat "$file"
                
                # 処理済みに移動
                mv "$file" "$PROCESSED_DIR/"
            fi
        done
        sleep 1
    done
}
```

### 2. 共有ログファイル方式

#### 構造
```
logs/
├── communication.log   # 全通信ログ
├── president.log      # President専用
├── boss1.log          # Boss1専用
└── worker*.log        # 各Worker専用
```

#### 実装
```bash
# 応答書き込み（BOSS/Worker側）
echo "[$(date '+%Y-%m-%d %H:%M:%S')] boss1: RESPONSE - \"タスク完了しました\"" >> logs/communication.log

# 応答読み取り（President側）
tail -f logs/communication.log | grep "RESPONSE"
```

### 3. Named Pipe（名前付きパイプ）方式

```bash
# パイプ作成
mkfifo /tmp/president_inbox
mkfifo /tmp/boss1_inbox
mkfifo /tmp/worker1_inbox

# 応答受信（バックグラウンド）
while true; do
    if read line < /tmp/president_inbox; then
        echo "受信: $line"
    fi
done &

# 応答送信（BOSS側）
echo "タスク完了" > /tmp/president_inbox
```

### 4. WebSocket/HTTPサーバー方式

```javascript
// simple-comm-server.js
const express = require('express');
const app = express();

const messages = {};

// メッセージ送信
app.post('/send/:to', (req, res) => {
    messages[req.params.to] = messages[req.params.to] || [];
    messages[req.params.to].push(req.body);
    res.json({ status: 'sent' });
});

// メッセージ受信
app.get('/receive/:agent', (req, res) => {
    const msgs = messages[req.params.agent] || [];
    messages[req.params.agent] = [];
    res.json(msgs);
});

app.listen(3333);
```

## 推奨実装：ハイブリッド方式

### 1. 即時実装（ファイルベース）
```bash
#!/bin/bash
# bidirectional-send.sh

send_and_wait_response() {
    local to="$1"
    local message="$2"
    local msg_id="$(date +%s%N)"
    
    # メッセージ送信
    echo "$message" > "messages/outbox/${to}_${msg_id}.msg"
    ./agent-send.sh "$to" "$message"
    
    # 応答待機（最大30秒）
    local timeout=30
    local response_file="messages/inbox/president/${to}_response_${msg_id}.msg"
    
    echo "⏳ 応答待機中..."
    while [ $timeout -gt 0 ]; do
        if [ -f "$response_file" ]; then
            echo "📨 応答受信:"
            cat "$response_file"
            rm "$response_file"
            return 0
        fi
        sleep 1
        ((timeout--))
    done
    
    echo "⏱️ タイムアウト"
    return 1
}
```

### 2. BOSS/Worker側の応答スクリプト
```bash
#!/bin/bash
# auto-responder.sh (BOSS/Worker側で実行)

respond_to_president() {
    local message="$1"
    local response="$2"
    local msg_id="$(echo "$message" | md5sum | cut -d' ' -f1)"
    
    echo "$response" > "messages/inbox/president/boss1_response_${msg_id}.msg"
    echo "✅ 応答送信完了"
}
```

## 実装手順

### Phase 1: 基本実装（1時間）
1. ディレクトリ構造作成
2. 基本的な送受信スクリプト
3. 応答監視デーモン

### Phase 2: 拡張機能（2時間）
1. メッセージID管理
2. タイムアウト処理
3. エラーハンドリング

### Phase 3: 高度な機能（4時間）
1. 優先度付きキュー
2. 非同期並列処理
3. メッセージ履歴管理

## 使用例

```bash
# President側
./bidirectional-send.sh boss1 "Railwayビルド状況を報告してください"
# 応答: "Railwayビルド成功。全テスト通過。"

# BOSS側（自動応答）
./auto-responder.sh "状況を報告" "全タスク順調に進行中"
```

## メリット
- 真の双方向通信
- 非同期処理対応
- スケーラブル
- デバッグ容易

この実装により、チーム間の本格的な対話が可能になります。