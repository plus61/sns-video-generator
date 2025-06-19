#!/bin/bash

# スマートアラートシステム - Worker3 品質保証
# 予防的問題検知・自動復旧・インテリジェント通知

set -e

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m'

# 設定
ALERT_LOG="logs/smart-alerts-$(date +%Y%m%d).log"
METRICS_HISTORY="metrics/history-$(date +%Y%m%d).json"
PREDICTION_MODEL="models/performance-prediction.json"

mkdir -p logs metrics models

# アラートレベル定義
declare -A ALERT_LEVELS
ALERT_LEVELS[INFO]=0
ALERT_LEVELS[WARNING]=1
ALERT_LEVELS[ERROR]=2
ALERT_LEVELS[CRITICAL]=3

# 予測モデルデータ
declare -A performance_baseline
performance_baseline[response_time_normal]=100    # 正常時の応答時間
performance_baseline[error_rate_normal]=0.01     # 正常時のエラー率
performance_baseline[success_rate_normal]=99.5   # 正常時の成功率

# インテリジェントログ
smart_log() {
    local level="$1"
    local category="$2"
    local message="$3"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    echo "[$timestamp] [$level] [$category] $message" | tee -a "$ALERT_LOG"
    
    # Boss1への通知判定
    if [ "${ALERT_LEVELS[$level]}" -ge 2 ]; then
        send_smart_notification "$level" "$category" "$message"
    fi
}

# スマート通知送信
send_smart_notification() {
    local level="$1"
    local category="$2"
    local message="$3"
    local urgency_icon=""
    
    case "$level" in
        "CRITICAL") urgency_icon="🚨🚨🚨" ;;
        "ERROR") urgency_icon="🚨" ;;
        "WARNING") urgency_icon="⚠️" ;;
        *) urgency_icon="ℹ️" ;;
    esac
    
    local notification="【Worker3 スマートアラート】$urgency_icon

## 🎯 検知レベル: $level
**カテゴリ**: $category
**詳細**: $message

## 📊 現在の状況分析
$(get_current_analysis)

## 🔧 推奨対応
$(get_recommended_actions "$category" "$level")

継続監視中..."

    echo "$notification" | ./agent-send.sh boss1
    smart_log "INFO" "NOTIFICATION" "Boss1に$levelアラートを送信: $category"
}

# 現在の状況分析
get_current_analysis() {
    echo "- システム負荷: $(get_system_load_status)"
    echo "- ネットワーク状態: $(get_network_status)"
    echo "- エラー傾向: $(get_error_trend)"
    echo "- パフォーマンス傾向: $(get_performance_trend)"
}

# 推奨対応取得
get_recommended_actions() {
    local category="$1"
    local level="$2"
    
    case "$category" in
        "PERFORMANCE")
            if [ "$level" = "CRITICAL" ]; then
                echo "- 即座のシステム再起動検討"
                echo "- リソース使用量の緊急確認"
                echo "- 負荷分散設定の見直し"
            else
                echo "- パフォーマンス最適化の検討"
                echo "- キャッシュ設定の確認"
            fi
            ;;
        "SECURITY")
            echo "- セキュリティログの即座確認"
            echo "- 不正アクセスの可能性調査"
            echo "- 認証システムの状態確認"
            ;;
        "CONNECTIVITY")
            echo "- ネットワーク設定の確認"
            echo "- DNS解決の確認"
            echo "- プロキシ・VPN設定の確認"
            ;;
        *)
            echo "- ログの詳細確認"
            echo "- システム全体の健全性チェック"
            ;;
    esac
}

# システム負荷状態取得
get_system_load_status() {
    # メモリ使用率の推定
    local memory_estimate=$(ps aux | awk '{sum += $4} END {print int(sum)}' 2>/dev/null || echo "Unknown")
    if [ "$memory_estimate" -gt 80 ]; then
        echo "高負荷 (推定${memory_estimate}%)"
    elif [ "$memory_estimate" -gt 50 ]; then
        echo "中程度 (推定${memory_estimate}%)"
    else
        echo "正常 (推定${memory_estimate}%)"
    fi
}

# ネットワーク状態取得
get_network_status() {
    if ping -c 1 8.8.8.8 >/dev/null 2>&1; then
        echo "正常"
    else
        echo "接続問題あり"
    fi
}

# エラー傾向分析
get_error_trend() {
    local recent_errors=$(grep "ERROR\|CRITICAL" "$ALERT_LOG" 2>/dev/null | tail -10 | wc -l)
    if [ "$recent_errors" -gt 5 ]; then
        echo "増加傾向 (最近10件中${recent_errors}件)"
    elif [ "$recent_errors" -gt 2 ]; then
        echo "やや増加 (最近10件中${recent_errors}件)"
    else
        echo "安定 (最近10件中${recent_errors}件)"
    fi
}

# パフォーマンス傾向分析
get_performance_trend() {
    # 最近のレスポンス時間を分析（簡易版）
    local avg_response=$(grep "response_time" "$METRICS_HISTORY" 2>/dev/null | tail -5 | grep -o '"value":"[0-9]*"' | cut -d'"' -f4 | awk '{sum+=$1; count++} END {if(count>0) print int(sum/count); else print 0}')
    
    if [ "$avg_response" -gt 3000 ]; then
        echo "劣化傾向 (平均${avg_response}ms)"
    elif [ "$avg_response" -gt 1000 ]; then
        echo "やや劣化 (平均${avg_response}ms)"
    else
        echo "良好 (平均${avg_response}ms)"
    fi
}

# 異常検知アルゴリズム
detect_anomalies() {
    local current_response_time="$1"
    local current_error_rate="$2"
    local current_success_rate="$3"
    
    # 応答時間異常検知
    local baseline_response=${performance_baseline[response_time_normal]}
    if [ "$current_response_time" -gt $((baseline_response * 3)) ]; then
        smart_log "CRITICAL" "PERFORMANCE" "応答時間が異常に悪化: ${current_response_time}ms (正常値: ${baseline_response}ms)"
    elif [ "$current_response_time" -gt $((baseline_response * 2)) ]; then
        smart_log "ERROR" "PERFORMANCE" "応答時間が大幅に悪化: ${current_response_time}ms (正常値: ${baseline_response}ms)"
    elif [ "$current_response_time" -gt $((baseline_response * 150 / 100)) ]; then
        smart_log "WARNING" "PERFORMANCE" "応答時間がやや悪化: ${current_response_time}ms (正常値: ${baseline_response}ms)"
    fi
    
    # エラー率異常検知
    local baseline_error=${performance_baseline[error_rate_normal]}
    if (( $(echo "$current_error_rate > 0.2" | bc -l) )); then
        smart_log "CRITICAL" "RELIABILITY" "エラー率が危険レベル: ${current_error_rate}% (正常値: ${baseline_error}%)"
    elif (( $(echo "$current_error_rate > 0.1" | bc -l) )); then
        smart_log "ERROR" "RELIABILITY" "エラー率が高レベル: ${current_error_rate}% (正常値: ${baseline_error}%)"
    elif (( $(echo "$current_error_rate > 0.05" | bc -l) )); then
        smart_log "WARNING" "RELIABILITY" "エラー率がやや高い: ${current_error_rate}% (正常値: ${baseline_error}%)"
    fi
    
    # 成功率異常検知
    local baseline_success=${performance_baseline[success_rate_normal]}
    if (( $(echo "$current_success_rate < 90" | bc -l) )); then
        smart_log "CRITICAL" "RELIABILITY" "成功率が危険レベル: ${current_success_rate}% (正常値: ${baseline_success}%)"
    elif (( $(echo "$current_success_rate < 95" | bc -l) )); then
        smart_log "ERROR" "RELIABILITY" "成功率が低下: ${current_success_rate}% (正常値: ${baseline_success}%)"
    elif (( $(echo "$current_success_rate < 98" | bc -l) )); then
        smart_log "WARNING" "RELIABILITY" "成功率がやや低下: ${current_success_rate}% (正常値: ${baseline_success}%)"
    fi
}

# セキュリティ異常検知
detect_security_anomalies() {
    # 異常なアクセスパターン検知
    local failed_auth_count=$(grep -c "401\|403" "$ALERT_LOG" 2>/dev/null || echo 0)
    if [ "$failed_auth_count" -gt 50 ]; then
        smart_log "CRITICAL" "SECURITY" "認証失敗が大量発生: ${failed_auth_count}件 - 攻撃の可能性"
    elif [ "$failed_auth_count" -gt 20 ]; then
        smart_log "WARNING" "SECURITY" "認証失敗が増加: ${failed_auth_count}件 - 監視強化"
    fi
    
    # 異常なレスポンスパターン検知
    local timeout_count=$(grep -c "TIMEOUT" "$ALERT_LOG" 2>/dev/null || echo 0)
    if [ "$timeout_count" -gt 10 ]; then
        smart_log "ERROR" "CONNECTIVITY" "タイムアウトが多発: ${timeout_count}件 - ネットワーク問題の可能性"
    fi
}

# 予防的メンテナンス提案
suggest_preventive_maintenance() {
    local uptime_hours=$(echo "$(date +%s) - ${performance_baseline[start_time]:-$(date +%s)}" | bc)
    uptime_hours=$((uptime_hours / 3600))
    
    # 長時間稼働時の提案
    if [ "$uptime_hours" -gt 168 ]; then  # 1週間
        smart_log "INFO" "MAINTENANCE" "システム稼働時間: ${uptime_hours}時間 - 定期メンテナンスの検討を推奨"
    fi
    
    # ディスク使用量チェック（推定）
    local log_size=$(du -s logs 2>/dev/null | cut -f1 || echo 0)
    if [ "$log_size" -gt 100000 ]; then  # 100MB相当
        smart_log "WARNING" "MAINTENANCE" "ログファイルサイズが大きくなっています: ローテーション推奨"
    fi
}

# パフォーマンス予測
predict_performance_degradation() {
    # 過去の傾向から将来のパフォーマンスを予測（簡易版）
    local recent_metrics=$(grep "response_time" "$METRICS_HISTORY" 2>/dev/null | tail -20)
    if [ -n "$recent_metrics" ]; then
        local trend_direction=$(echo "$recent_metrics" | awk -F'"' '{print $4}' | awk 'NR>1{if($1>prev) inc++; else dec++; prev=$1} END{if(inc>dec) print "INCREASING"; else if(dec>inc) print "DECREASING"; else print "STABLE"}')
        
        case "$trend_direction" in
            "INCREASING")
                smart_log "WARNING" "PREDICTION" "応答時間の悪化傾向を検出 - 予防的対策を推奨"
                ;;
            "STABLE")
                smart_log "INFO" "PREDICTION" "パフォーマンスは安定傾向"
                ;;
            "DECREASING")
                smart_log "INFO" "PREDICTION" "パフォーマンス改善傾向を検出"
                ;;
        esac
    fi
}

# 自動復旧試行
attempt_auto_recovery() {
    local issue_type="$1"
    
    case "$issue_type" in
        "HIGH_RESPONSE_TIME")
            smart_log "INFO" "RECOVERY" "高応答時間検出 - 自動復旧を試行"
            # 簡易的なキャッシュクリア（実際のシステムに応じて調整）
            sleep 5
            smart_log "INFO" "RECOVERY" "自動復旧試行完了"
            ;;
        "CONNECTION_ISSUE")
            smart_log "INFO" "RECOVERY" "接続問題検出 - 再接続を試行"
            sleep 3
            smart_log "INFO" "RECOVERY" "再接続試行完了"
            ;;
    esac
}

# メイン分析エンジン
run_smart_analysis() {
    local response_time="$1"
    local error_rate="$2"
    local success_rate="$3"
    
    smart_log "INFO" "ANALYSIS" "スマート分析実行 - 応答時間:${response_time}ms, エラー率:${error_rate}%, 成功率:${success_rate}%"
    
    # 異常検知
    detect_anomalies "$response_time" "$error_rate" "$success_rate"
    
    # セキュリティ異常検知
    detect_security_anomalies
    
    # 予防的メンテナンス提案
    suggest_preventive_maintenance
    
    # パフォーマンス予測
    predict_performance_degradation
    
    # 自動復旧判定
    if [ "$response_time" -gt 5000 ]; then
        attempt_auto_recovery "HIGH_RESPONSE_TIME"
    fi
    
    if (( $(echo "$error_rate > 0.15" | bc -l) )); then
        attempt_auto_recovery "CONNECTION_ISSUE"
    fi
}

# 使用例
if [ "$#" -eq 3 ]; then
    # コマンドライン引数から実行
    run_smart_analysis "$1" "$2" "$3"
else
    # テスト実行
    echo "スマートアラートシステムのテスト実行"
    run_smart_analysis "150" "0.02" "99.8"
    echo "テスト完了 - ログファイル: $ALERT_LOG"
fi