#!/bin/bash

# 監視タイマーシステム
MONITOR_LOG="/Users/yuichiroooosuger/sns-video-generator/sns-video-generator/ai-org/logs/monitor_timer.log"
LAST_CHECK_FILE="/Users/yuichiroooosuger/sns-video-generator/sns-video-generator/ai-org/tmp/last_check_timestamp"
INTERVAL=60  # 60秒間隔

# 初回実行時のタイムスタンプ記録
if [ ! -f "$LAST_CHECK_FILE" ]; then
    date +%s > "$LAST_CHECK_FILE"
    echo "$(date): 監視タイマー初期化" >> "$MONITOR_LOG"
fi

# 現在時刻と最終チェック時刻の差分計算
CURRENT_TIME=$(date +%s)
LAST_CHECK=$(cat "$LAST_CHECK_FILE")
TIME_DIFF=$((CURRENT_TIME - LAST_CHECK))

echo "現在時刻: $(date)"
echo "最終チェック: $(date -r $LAST_CHECK)"
echo "経過時間: ${TIME_DIFF}秒"

# 60秒経過したかチェック
if [ $TIME_DIFF -ge $INTERVAL ]; then
    echo "⏰ 60秒経過 - 監視報告タイミング"
    echo "$(date): 定期監視報告時刻" >> "$MONITOR_LOG"
    
    # タイムスタンプ更新
    date +%s > "$LAST_CHECK_FILE"
    
    # 報告フラグ作成
    touch "/Users/yuichiroooosuger/sns-video-generator/sns-video-generator/ai-org/tmp/report_needed"
    
    exit 0
else
    REMAINING=$((INTERVAL - TIME_DIFF))
    echo "次回報告まで: ${REMAINING}秒"
    exit 1
fi