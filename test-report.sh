#!/bin/bash

# Worker3 30分ごとの自動報告システム
# シンプル・効果的・即実行可能

REPORT_FILE="test-report-$(date +%Y%m%d).md"
LOG_FILE="test-monitor.log"

generate_report() {
    echo "📊 テスト成功率報告書生成中..."
    
    # 最新データ取得
    if [ -f "$LOG_FILE" ]; then
        LATEST=$(tail -1 $LOG_FILE)
        IFS=',' read -r TIMESTAMP TOTAL PASSED FAILED RATE <<< "$LATEST"
        
        # レポート生成
        cat > "$REPORT_FILE" << EOF
# テスト成功率報告書
生成時刻: $(date '+%Y-%m-%d %H:%M:%S')

## 📊 現在の状況
- **成功率**: ${RATE}%
- **目標**: 90%以上
- **ステータス**: $([ $RATE -ge 90 ] && echo "✅ 達成" || echo "⚠️ 未達成")

## 📈 詳細データ
| 項目 | 数値 |
|------|------|
| 総テスト数 | $TOTAL |
| 成功 | $PASSED |
| 失敗 | $FAILED |

## 🎯 次のアクション
$(if [ $RATE -lt 90 ]; then
    echo "- 失敗テストの原因分析が必要"
    echo "- セレクタの具体化を推奨"
    echo "- タイムアウト値の調整を検討"
else
    echo "- 目標達成！現状維持を推奨"
    echo "- 更なる品質向上の余地を探索"
fi)

---
*Worker3 自動生成レポート*
EOF
        
        echo "✅ レポート生成完了: $REPORT_FILE"
        
        # ターミナルにも表示
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "📊 30分報告サマリー"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "成功率: ${RATE}%"
        echo "ステータス: $([ $RATE -ge 90 ] && echo "✅ 目標達成" || echo "⚠️ 改善必要")"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    else
        echo "❌ ログファイルが見つかりません"
    fi
}

# 初回レポート生成
generate_report

# 30分ごとに自動実行
echo ""
echo "⏰ 30分ごとに自動レポート生成開始..."
echo "Ctrl+Cで停止"

while true; do
    sleep 1800  # 30分待機
    echo ""
    generate_report
done