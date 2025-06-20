#!/bin/bash

# 5分間隔タイマーシステム
TIMER_LOG="/Users/yuichiroooosuger/sns-video-generator/sns-video-generator/ai-org/logs/5min_timer.log"
LAST_CHECK_FILE="/Users/yuichiroooosuger/sns-video-generator/sns-video-generator/ai-org/tmp/last_5min_check"
INTERVAL=300  # 5分（300秒）

# 初回実行時のタイムスタンプ記録
if [ ! -f "$LAST_CHECK_FILE" ]; then
    date +%s > "$LAST_CHECK_FILE"
    echo "$(date): 5分タイマー初期化" >> "$TIMER_LOG"
fi

# 現在時刻と最終チェック時刻の差分計算
CURRENT_TIME=$(date +%s)
LAST_CHECK=$(cat "$LAST_CHECK_FILE")
TIME_DIFF=$((CURRENT_TIME - LAST_CHECK))

echo "=== 5分間隔チェック ==="
echo "現在時刻: $(date)"
echo "最終チェック: $(date -r $LAST_CHECK 2>/dev/null || echo '不明')"
echo "経過時間: ${TIME_DIFF}秒"

# 5分経過したかチェック
if [ $TIME_DIFF -ge $INTERVAL ]; then
    echo ""
    echo "⏰ 5分経過 - Railway修復状況確認タイミング！"
    echo "$(date): 5分経過 - チェックポイント" >> "$TIMER_LOG"
    
    # タイムスタンプ更新
    date +%s > "$LAST_CHECK_FILE"
    
    # Worker状況確認
    echo ""
    echo "=== Worker活動状況 ==="
    echo "Worker1: $(cat /Users/yuichiroooosuger/sns-video-generator/sns-video-generator/ai-org/worker1/status.txt 2>/dev/null || echo '不明')"
    echo "Worker2: $(cat /Users/yuichiroooosuger/sns-video-generator/sns-video-generator/ai-org/worker2/status.txt 2>/dev/null || echo '不明')"
    echo "Worker3: $(cat /Users/yuichiroooosuger/sns-video-generator/sns-video-generator/ai-org/worker3/status.txt 2>/dev/null || echo '不明')"
    
    exit 0
else
    REMAINING=$((INTERVAL - TIME_DIFF))
    echo "次回チェックまで: ${REMAINING}秒"
    exit 1
fi