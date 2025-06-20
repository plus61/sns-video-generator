#!/bin/bash

# 監視状況チェックスクリプト
echo "=== 監視状況チェック ==="

# タイマーチェック
/Users/yuichiroooosuger/sns-video-generator/sns-video-generator/ai-org/monitor-timer.sh

# 報告が必要な場合
if [ -f "/Users/yuichiroooosuger/sns-video-generator/sns-video-generator/ai-org/tmp/report_needed" ]; then
    echo ""
    echo "📊 定期報告時刻です！"
    echo "Worker監視報告を収集します..."
    
    # 報告フラグを削除
    rm -f "/Users/yuichiroooosuger/sns-video-generator/sns-video-generator/ai-org/tmp/report_needed"
    
    # Worker状態確認
    echo ""
    echo "Worker状態:"
    echo "- Worker1: $(cat /Users/yuichiroooosuger/sns-video-generator/sns-video-generator/ai-org/worker1/status.txt 2>/dev/null || echo 'idle')"
    echo "- Worker2: $(cat /Users/yuichiroooosuger/sns-video-generator/sns-video-generator/ai-org/worker2/status.txt 2>/dev/null || echo 'idle')"
    echo "- Worker3: $(cat /Users/yuichiroooosuger/sns-video-generator/sns-video-generator/ai-org/worker3/status.txt 2>/dev/null || echo 'idle')"
fi