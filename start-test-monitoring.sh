#!/bin/bash

# Worker3 テスト品質向上システム起動スクリプト
# 一発起動・シンプル・効果的

echo "🚀 SNS動画生成プラットフォーム テスト品質向上システム"
echo "================================================"
echo ""

# ログファイル初期化
echo "timestamp,total,passed,failed,rate" > test-monitor.log

# 各プロセスをバックグラウンドで起動
echo "📡 テストモニター起動中..."
./test-monitor.sh > monitor.out 2>&1 &
MONITOR_PID=$!

echo "📊 レポートシステム起動中..."
./test-report.sh > report.out 2>&1 &
REPORT_PID=$!

echo ""
echo "✅ システム起動完了！"
echo ""
echo "📌 アクセス方法:"
echo "  - ダッシュボード: file://$(pwd)/test-dashboard.html"
echo "  - ログファイル: tail -f test-monitor.log"
echo "  - レポート: cat test-report-$(date +%Y%m%d).md"
echo ""
echo "🛑 停止方法: kill $MONITOR_PID $REPORT_PID"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 初回テスト実行（デモ用）
echo "🔍 初回テスト実行中..."
# 実際のテストコマンドをここに記載
# npm test -- --reporter=json || true

echo ""
echo "📊 現在の成功率: 計測中..."
echo "🎯 目標: 90%以上"