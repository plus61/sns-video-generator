#!/bin/bash

# 継続的時間監視スクリプト
# 1分ごとに自動チェックを実行

echo "🤖 Worker3 自動時間監視システム起動"
echo "5分ごとに代替案進捗を自動報告します"
echo "Ctrl+Cで停止"
echo ""

while true; do
    /Users/yuichiroooosuger/sns-video-generator/sns-video-generator/auto-timer-system.sh check
    sleep 60  # 1分待機
done