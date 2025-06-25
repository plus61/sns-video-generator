# 🔧 通信システム修正計画

## 問題の根本原因

### 1. TMUXセッション問題
- `agent-send.sh` は `multiagent:0.0` にメッセージを送信
- しかし、Boss1がそのペインで実際に動作しているか不明
- Boss1は入力を「コマンド」として処理する仕組みがない

### 2. Boss Brain System
- `boss-brain.sh` は高度な分析機能を持つ
- しかし、実際のメッセージ受信・処理メカニズムが欠如
- tmuxへの直接入力は単なるテキスト入力

## 即座の解決策

### Option 1: ファイルベースメッセージング（推奨）
```bash
# 新しい送信方法
send_file_message() {
    local to="$1"
    local message="$2"
    local msg_file="messages/inbox/$to/$(date +%s%N).msg"
    
    mkdir -p "messages/inbox/$to"
    echo "$message" > "$msg_file"
    echo "✅ メッセージをファイルに保存: $msg_file"
}

# Boss1用モニター起動
start_boss_monitor() {
    while true; do
        for msg in messages/inbox/boss1/*.msg; do
            if [ -f "$msg" ]; then
                message=$(cat "$msg")
                # Boss Brain Systemで処理
                ./agent-send.sh --auto "president" "$message"
                mv "$msg" messages/processed/
            fi
        done
        sleep 1
    done &
}
```

### Option 2: 直接実行方式
```bash
# Boss1への直接指示実行
execute_boss_command() {
    local command="$1"
    
    # Boss1の機能を直接呼び出し
    source ./boss-brain.sh
    boss_autonomous_decision "president" "$command"
}
```

## 推奨実装手順

1. **ファイルベースシステムの有効化**
   ```bash
   # inbox監視スクリプト作成
   cat > monitor-boss-inbox.sh << 'EOF'
   #!/bin/bash
   while true; do
       for msg in messages/inbox/boss1/*.msg; do
           if [ -f "$msg" ]; then
               echo "📨 新規メッセージ処理: $msg"
               message=$(cat "$msg")
               # Boss機能を直接実行
               ./agent-send.sh --auto "file" "$message"
               mv "$msg" messages/processed/$(basename "$msg")
           fi
       done
       sleep 1
   done
   EOF
   chmod +x monitor-boss-inbox.sh
   ```

2. **Boss1プロセス再起動**
   ```bash
   # Boss監視プロセス開始
   ./monitor-boss-inbox.sh &
   echo $! > boss-monitor.pid
   ```

3. **メッセージ送信テスト**
   ```bash
   # ファイル経由でメッセージ送信
   mkdir -p messages/inbox/boss1
   echo "テストメッセージ: 動作確認" > messages/inbox/boss1/test_$(date +%s%N).msg
   ```

## 長期的改善案

### 1. 統一メッセージングシステム
- ファイルベース・TMUXハイブリッド
- メッセージキューの実装
- 確実な配信保証

### 2. Boss1の自律性強化
- スタンドアロンプロセスとして実行
- REST APIエンドポイント化
- 非同期処理の完全サポート

### 3. モニタリング強化
- メッセージ配信状況の可視化
- 処理遅延の検出
- 自動リトライメカニズム

## 即座のアクション

```bash
# 1. 旧メッセージのクリーンアップ
mkdir -p messages/processed
mv messages/inbox/boss1/*.msg messages/processed/ 2>/dev/null || true

# 2. 新しい監視プロセス開始
pkill -f monitor-boss-inbox.sh 2>/dev/null || true
./monitor-boss-inbox.sh &

# 3. テストメッセージ送信
echo "【緊急】Phase 2 タスク実行指示" > messages/inbox/boss1/urgent_$(date +%s%N).msg

echo "✅ 通信システム修正完了"
```