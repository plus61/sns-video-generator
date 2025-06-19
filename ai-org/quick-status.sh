#!/bin/bash
# quick-status.sh - 簡易実況表示

clear
echo "🏢 組織駆動システム実況 (Ctrl+C で終了)"
echo "======================================="

while true; do
    # カーソル位置を保存
    tput sc
    
    # 現在時刻
    echo -ne "\r⏰ $(date '+%H:%M:%S') | "
    
    # 各エージェントの状態
    BOSS_STATUS=$(cat boss1/status.txt 2>/dev/null || echo "offline")
    W1_STATUS=$(cat worker1/status.txt 2>/dev/null || echo "offline")
    W2_STATUS=$(cat worker2/status.txt 2>/dev/null || echo "offline")
    W3_STATUS=$(cat worker3/status.txt 2>/dev/null || echo "offline")
    
    # 状態に応じた絵文字
    get_emoji() {
        case $1 in
            "working"|"coordinating") echo "🟢" ;;
            "idle") echo "🟡" ;;
            *) echo "🔴" ;;
        esac
    }
    
    echo -ne "BOSS:$(get_emoji $BOSS_STATUS) "
    echo -ne "W1:$(get_emoji $W1_STATUS) "
    echo -ne "W2:$(get_emoji $W2_STATUS) "
    echo -ne "W3:$(get_emoji $W3_STATUS) "
    
    # タスク数
    PENDING=$(find . -name "*.task" ! -name "*.done" 2>/dev/null | wc -l)
    DONE=$(find . -name "*.task.done" 2>/dev/null | wc -l)
    echo -ne "| 📋:$PENDING ✅:$DONE"
    
    # カーソル位置を復元
    tput rc
    
    sleep 1
done