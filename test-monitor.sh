#!/bin/bash

# Worker3 テスト成功率モニタリングスクリプト
# シンプル・即効性重視

echo "🎯 SNS動画生成プラットフォーム テスト成功率モニター"
echo "================================================"
echo "開始時刻: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# 結果ファイル
RESULT_FILE="test-results.json"
LOG_FILE="test-monitor.log"

# テスト実行関数
run_tests() {
    echo "🔍 テスト実行中..."
    
    # Playwrightテスト実行
    npm test -- --reporter=json > $RESULT_FILE 2>&1
    
    # 結果解析
    if [ -f $RESULT_FILE ]; then
        TOTAL=$(grep -o '"total":[0-9]*' $RESULT_FILE | cut -d: -f2)
        PASSED=$(grep -o '"passed":[0-9]*' $RESULT_FILE | cut -d: -f2)
        FAILED=$(grep -o '"failed":[0-9]*' $RESULT_FILE | cut -d: -f2)
        
        if [ -z "$TOTAL" ]; then TOTAL=0; fi
        if [ -z "$PASSED" ]; then PASSED=0; fi
        if [ -z "$FAILED" ]; then FAILED=0; fi
        
        if [ $TOTAL -gt 0 ]; then
            SUCCESS_RATE=$((PASSED * 100 / TOTAL))
        else
            SUCCESS_RATE=0
        fi
        
        echo "📊 テスト結果:"
        echo "  総数: $TOTAL"
        echo "  成功: $PASSED ✅"
        echo "  失敗: $FAILED ❌"
        echo "  成功率: ${SUCCESS_RATE}%"
        
        # ログ記録
        echo "$(date '+%Y-%m-%d %H:%M:%S'),${TOTAL},${PASSED},${FAILED},${SUCCESS_RATE}" >> $LOG_FILE
        
        # 目標達成チェック
        if [ $SUCCESS_RATE -ge 90 ]; then
            echo "🎉 目標達成！成功率90%以上"
        else
            echo "⚠️  目標未達成。改善が必要です。"
        fi
    else
        echo "❌ テスト結果の取得に失敗しました"
    fi
}

# 初回実行
run_tests

# 継続モニタリング（5分間隔）
echo ""
echo "📡 5分間隔で継続モニタリング開始..."
echo "Ctrl+Cで停止"

while true; do
    sleep 300  # 5分待機
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    run_tests
done