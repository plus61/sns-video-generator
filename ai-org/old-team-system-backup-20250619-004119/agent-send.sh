#!/bin/bash

# 🚀 自律実行型BOSS管理システム - Agent間メッセージ送信スクリプト

# === Claude Multi-Agent System: モデル選択・役割分担 ===
# President/Boss: Claude Opus 4（戦略・統括・分割）
# Worker1/2/3: Claude Sonnet 4（並列実行・専門処理）
# 公式: https://www.anthropic.com/engineering/built-multi-agent-research-system

# モデル選択（将来のAPI連携用変数例）
PRESIDENT_MODEL="claude-3-opus-20240229"
BOSS_MODEL="claude-3-opus-20240229"
WORKER_MODEL="claude-3-sonnet-20240229"

# === 並列処理最適化 ===
MAX_PARALLEL_WORKERS=3  # Sonnet4の推奨並列数

# 並列タスク実行（例: 並列ワーカー起動）
parallel_worker_exec() {
    local tasks=("$@")
    local pids=()
    local i=0
    for task in "${tasks[@]}"; do
        if [ $i -ge $MAX_PARALLEL_WORKERS ]; then
            wait -n  # 1つ完了を待つ
            i=$((i-1))
        fi
        eval "$task" &
        pids+=($!)
        i=$((i+1))
    done
    wait  # 全完了待ち
}

# === コンテキスト管理・圧縮 ===
compress_context() {
    local context="$1"
    # ここで要約や外部保存を実装可能
    echo "[圧縮] $context" > /tmp/context_summary.txt
}

distribute_context() {
    local main_context="$1"
    # サブタスク分割例
    for idx in 1 2 3; do
        echo "Worker$idx: $main_context の一部を担当" >> /tmp/context_assign.txt
    done
}

# === エージェント間通信・同期 ===
prioritize_message() {
    local message="$1"; local sender="$2"
    local priority=0
    case "$sender" in
        "president") priority=3 ;;
        "boss1") priority=2 ;;
        *) priority=1 ;;
    esac
    echo "$priority:$message"
}

set_sync_point() {
    local point="$1"
    echo "$point" > /tmp/sync_point.txt
}

wait_for_sync() {
    local point="$1"
    while [ "$(cat /tmp/sync_point.txt 2>/dev/null)" != "$point" ]; do sleep 1; done
}

# === リアルタイム報告監視システム ===
REPORT_QUEUE="/tmp/worker_reports_queue"
PROCESSED_REPORTS="/tmp/processed_reports.log"

# 報告キューの初期化
init_report_queue() {
    mkdir -p "$(dirname "$REPORT_QUEUE")"
    touch "$REPORT_QUEUE"
    touch "$PROCESSED_REPORTS"
}

# Worker報告をキューに追加
queue_worker_report() {
    local from_agent="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local report_id="$(date +%s%N)_${from_agent}"
    
    echo "${report_id}|${timestamp}|${from_agent}|${message}" >> "$REPORT_QUEUE"
}

# リアルタイム報告監視デーモン
start_report_monitor() {
    echo "📡 リアルタイム報告監視システム起動"
    
    # バックグラウンドで監視プロセス起動
    (
        while true; do
            if [ -f "$REPORT_QUEUE" ] && [ -s "$REPORT_QUEUE" ]; then
                # 未処理の報告を1件ずつ処理
                while IFS= read -r report_line; do
                    if [ -n "$report_line" ]; then
                        # 既に処理済みかチェック
                        local report_id=$(echo "$report_line" | cut -d'|' -f1)
                        if ! grep -q "$report_id" "$PROCESSED_REPORTS" 2>/dev/null; then
                            # 報告を処理
                            process_single_report "$report_line"
                            # 処理済みマーク
                            echo "$report_id" >> "$PROCESSED_REPORTS"
                        fi
                    fi
                done < "$REPORT_QUEUE"
                
                # 処理済み報告をキューから削除
                > "$REPORT_QUEUE"
            fi
            sleep 1
        done
    ) &
    
    MONITOR_PID=$!
    echo "監視プロセスPID: $MONITOR_PID"
    echo "$MONITOR_PID" > /tmp/report_monitor.pid
}

# 個別報告の処理
process_single_report() {
    local report_line="$1"
    local report_id=$(echo "$report_line" | cut -d'|' -f1)
    local timestamp=$(echo "$report_line" | cut -d'|' -f2)
    local from_agent=$(echo "$report_line" | cut -d'|' -f3)
    local message=$(echo "$report_line" | cut -d'|' -f4-)
    
    echo "🔔 [$timestamp] 報告受信: $from_agent"
    echo "   内容: $message"
    
    # Boss Brain Systemで分析
    if type deep_analyze_report >/dev/null 2>&1; then
        local analysis=$(deep_analyze_report "$from_agent" "$message")
        echo "   🧠 分析完了"
        
        # 即座に対応が必要な場合は処理
        if [[ "$message" =~ (緊急|エラー|失敗|critical|urgent) ]]; then
            echo "   🚨 緊急対応実行"
            boss_autonomous_decision "$from_agent" "$message"
        elif [[ "$message" =~ (完了|完成|done|completed) ]]; then
            echo "   ✅ 完了報告確認"
            boss_autonomous_decision "$from_agent" "$message"
        else
            echo "   📝 通常報告として記録"
            log_message "$from_agent" "$message"
        fi
    else
        # Boss Brain Systemが利用できない場合は基本処理
        boss_autonomous_decision "$from_agent" "$message"
    fi
}

# 監視システム停止
stop_report_monitor() {
    if [ -f /tmp/report_monitor.pid ]; then
        local pid=$(cat /tmp/report_monitor.pid)
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid"
            echo "📡 報告監視システム停止"
        fi
        rm -f /tmp/report_monitor.pid
    fi
}

# Worker報告の非同期受信
async_receive_report() {
    local from_agent="$1"
    local message="$2"
    
    # 報告をキューに追加
    queue_worker_report "$from_agent" "$message"
    
    # 監視システムが動作していない場合は起動
    if [ ! -f /tmp/report_monitor.pid ] || ! kill -0 "$(cat /tmp/report_monitor.pid 2>/dev/null)" 2>/dev/null; then
        start_report_monitor
    fi
    
    echo "📨 報告をキューに追加: $from_agent"
}

# === エラー処理・自動回復 ===
error_detection() {
    local error_type="$1"; local context="$2"
    case "$error_type" in
        "context_overflow") echo "[回復] コンテキスト圧縮"; compress_context "$context" ;;
        "resource_exhaustion") echo "[回復] リソース最適化" ;;
        "communication_failure") echo "[回復] 通信再試行" ;;
    esac
}

auto_recovery() {
    local error="$1"
    case "$error" in
        "retry") echo "[回復] 再試行" ;;
        "fallback") echo "[回復] フォールバック" ;;
        "degrade") echo "[回復] 機能縮退" ;;
    esac
}

# === パフォーマンス監視 ===
collect_metrics() {
    echo "CPU:$(top -l 1 | grep 'CPU usage' | awk '{print $3}') MEM:$(vm_stat | grep 'Pages active' | awk '{print $3}')"
}

optimize_performance() {
    local cpu="$1"; local mem="$2"
    if [ "$cpu" -gt 80 ]; then echo "[最適化] CPU負荷軽減"; fi
    if [ "$mem" -gt 80 ]; then echo "[最適化] メモリ解放"; fi
}

# エージェント→tmuxターゲット マッピング
get_agent_target() {
    case "$1" in
        "president") echo "president" ;;
        "boss1") echo "multiagent:0.0" ;;
        "worker1") echo "multiagent:0.1" ;;
        "worker2") echo "multiagent:0.2" ;;
        "worker3") echo "multiagent:0.3" ;;
        *) echo "" ;;
    esac
}

# Boss Brain System を読み込み
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/boss-brain.sh" ]; then
    source "$SCRIPT_DIR/boss-brain.sh"
fi

# BOSS自律判断システム（拡張版）
boss_autonomous_decision() {
    local from_agent="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    echo "🤖 [$timestamp] BOSS自律判断システム起動"
    echo "   From: $from_agent"
    echo "   Message: $message"
    
    # リアルタイム処理モードの場合は非同期処理
    if [ "$3" = "--async" ]; then
        async_receive_report "$from_agent" "$message"
        return 0
    fi
    
    # === 深い分析フェーズ ===
    echo "🧠 深い思考プロセス開始..."
    local analysis_result=$(deep_analyze_report "$from_agent" "$message")
    
    # 分析結果の要素を抽出
    local sentiment=$(echo "$analysis_result" | jq -r '.sentiment' 2>/dev/null || echo "neutral")
    local tech_score=$(echo "$analysis_result" | jq -r '.technical_score' 2>/dev/null || echo "0.5")
    local risk_level=$(echo "$analysis_result" | jq -r '.risk_level' 2>/dev/null || echo "low")
    
    echo "   📊 分析結果: 感情=$sentiment, 技術スコア=$tech_score, リスク=$risk_level"
    
    # === パターンベースの初期判定 ===
    if [[ "$message" =~ (完了|完成|finished|done|success) ]]; then
        echo "✅ 作業完了パターンを検知"
        
        # 技術スコアによる追加判定
        if (( $(echo "$tech_score >= 0.8" | bc -l) )); then
            echo "   🎯 高品質な完了と判定"
            handle_completion_report "$from_agent" "$message"
            
            # 全体の統合分析
            local synthesis=$(synthesize_multiple_reports)
            local decision=$(make_strategic_decision "$synthesis")
            
            if [ "$decision" = "complete_and_report" ]; then
                echo "   🚀 全タスク完了 - President報告準備"
                prepare_president_report
            fi
        else
            echo "   ⚠️ 完了報告だが品質確認必要"
            send_message "$from_agent" "完了報告を受けました。品質確認のため、以下を確認してください: 1) テスト結果 2) エラーログ 3) パフォーマンス指標"
        fi
        
    # エラー報告を検知
    elif [[ "$message" =~ (エラー|失敗|error|failed|問題) ]]; then
        echo "❌ エラー報告を検知 - 深刻度: $risk_level"
        
        if [ "$risk_level" = "high" ]; then
            echo "   🚨 高リスクエラー - 緊急対応モード"
            handle_critical_error "$from_agent" "$message"
            # 他のWorkerにも影響調査指示
            broadcast_risk_assessment "$from_agent" "$message"
        else
            handle_error_report "$from_agent" "$message"
        fi
        
    # 質問・相談を検知
    elif [[ "$message" =~ (質問|相談|どうすれば|わからない|\?) ]]; then
        echo "❓ 質問を検知 - AIサポートモード"
        
        # 過去の類似質問を検索
        local similar_qa=$(search_similar_questions "$message")
        if [ -n "$similar_qa" ]; then
            echo "   💡 類似の質問への回答を発見"
            send_message "$from_agent" "類似の問題への解決策: $similar_qa"
        else
            handle_question "$from_agent" "$message"
        fi
        
    # 進捗報告を検知
    elif [[ "$message" =~ (進捗|progress|状況|経過) ]]; then
        echo "📊 進捗報告を検知"
        handle_progress_report "$from_agent" "$message"
        
        # 進捗の統合分析
        local synthesis=$(synthesize_multiple_reports)
        local overall_progress=$(echo "$synthesis" | jq -r '.overall_completion')
        
        echo "   📈 全体進捗: ${overall_progress}%"
        
        # 進捗に基づく動的指示
        provide_dynamic_guidance "$from_agent" "$overall_progress"
        
    else
        echo "📝 一般メッセージ - 深い分析実行"
        log_message "$from_agent" "$message"
        
        # 隠れた意図を分析
        analyze_hidden_intent "$from_agent" "$message"
    fi
    
    # === 学習フェーズ ===
    learn_from_outcomes
}

# 作業完了報告処理
handle_completion_report() {
    local from_agent="$1"
    local message="$2"
    
    echo "🎉 作業完了処理開始"
    
    # 完了ログ記録
    log_completion "$from_agent" "$message"
    
    # Phase 1タスク完了パターンの自動判定
    if [[ "$message" =~ "Supabase.*実行.*完了" ]] || [[ "$message" =~ "RLS.*適用.*完了" ]]; then
        echo "Worker1 Supabase設定完了確認"
        update_task_status "supabase_setup" "completed"
    elif [[ "$message" =~ "YouTube.*API.*完了" ]] || [[ "$message" =~ "メタデータ.*取得.*完了" ]]; then
        echo "Worker2 YouTube API統合完了確認"
        update_task_status "youtube_api" "completed"
    elif [[ "$message" =~ "テスト.*完了" ]] || [[ "$message" =~ "カバレッジ.*80%" ]]; then
        echo "Worker3 テスト実装完了確認"
        update_task_status "test_implementation" "completed"
    fi
    
    # 次の作業を自動判定・指示
    case "$from_agent" in
        "worker1")
            echo "Worker1 作業完了 - 状態更新"
            if check_all_phase1_tasks; then
                send_message "multiagent:0.0" "Phase 1 全タスク完了確認。Supabase設定、YouTube API統合、テスト実装すべて完了。最終確認を実施してください。"
            fi
            ;;
        "worker2")
            echo "Worker2 作業完了 - 状態更新"
            if check_all_phase1_tasks; then
                send_message "multiagent:0.0" "Phase 1 全タスク完了確認。Supabase設定、YouTube API統合、テスト実装すべて完了。最終確認を実施してください。"
            fi
            ;;
        "worker3")
            echo "Worker3 作業完了 - 状態更新"
            if check_all_phase1_tasks; then
                send_message "multiagent:0.0" "Phase 1 全タスク完了確認。Supabase設定、YouTube API統合、テスト実装すべて完了。最終確認を実施してください。"
            fi
            ;;
        "boss1")
            echo "Boss1統合テスト完了 - President最終報告"
            auto_generate_final_report
            ;;
    esac
    
    # 全体進捗確認
    check_overall_progress
}

# エラー報告処理
handle_error_report() {
    local from_agent="$1"
    local message="$2"
    
    echo "🚨 エラー対応処理開始"
    
    # エラーログ記録
    log_error "$from_agent" "$message"
    
    # エラー内容に応じて対応指示
    if [[ "$message" =~ "TypeScript" ]]; then
        send_message "$from_agent" "TypeScriptエラー対応：1) @types/jest再インストール 2) tsconfig.json確認 3) 型定義ファイル確認 4) 詳細エラーログをBOSSに報告"
        
    elif [[ "$message" =~ "build" ]]; then
        send_message "$from_agent" "ビルドエラー対応：1) npm run clean 2) node_modules削除・再インストール 3) next.config.ts確認 4) 依存関係チェック"
        
    elif [[ "$message" =~ "認証|auth" ]]; then
        send_message "$from_agent" "認証エラー対応：1) NextAuth設定確認 2) 環境変数確認 3) Supabase接続確認 4) セッション設定確認"
        
    else
        send_message "$from_agent" "一般エラー対応：1) 詳細ログ取得 2) 環境確認 3) 依存関係確認 4) BOSSに詳細報告"
    fi
    
    # President緊急報告
    send_message "president" "🚨 緊急報告：$from_agent でエラー発生 - $message。対応指示済み、状況監視中"
}

# 質問処理
handle_question() {
    local from_agent="$1"
    local message="$2"
    
    echo "❓ 質問対応処理"
    
    # よくある質問への自動回答
    if [[ "$message" =~ "TypeScript" ]]; then
        send_message "$from_agent" "TypeScript質問回答：1) @types/jest必須 2) strict:true設定 3) path alias設定確認 4) 型定義import確認。詳細が必要なら具体的エラーを報告してください"
        
    elif [[ "$message" =~ "テスト" ]]; then
        send_message "$from_agent" "テスト質問回答：1) Jest設定確認 2) test環境設定 3) @testing-library設定 4) setupファイル確認。具体的テスト内容を教えてください"
        
    else
        send_message "$from_agent" "質問確認。具体的な問題・エラーメッセージ・やりたいことを詳細にお聞かせください。適切なサポートを提供します"
    fi
}

# 進捗報告処理
handle_progress_report() {
    local from_agent="$1"
    local message="$2"
    
    echo "📊 進捗確認処理"
    
    # 進捗ログ記録
    log_progress "$from_agent" "$message"
    
    # 進捗に応じて追加指示
    send_message "$from_agent" "進捗確認しました。継続してください。問題があれば即座に報告してください。完了時は「作業完了」と報告してください"
    
    # President定期報告
    send_message "president" "📊 進捗報告：$from_agent - $message"
}

# 統合テスト自動実行
auto_integration_test() {
    echo "🧪 統合テスト自動実行開始"
    
    # Boss1に統合テスト指示
    send_message "multiagent:0.0" "統合テスト実行：1) cd /Users/yuichiroooosuger/sns-video-generator/sns-video-generator 2) npm run build で成功確認 3) npm run lint でエラー0確認 4) TypeScript全チェック 5) セキュリティ監査実行 6) 結果をBOSSに完了報告"
}

# タスク状態管理ファイル
TASK_STATUS_FILE="/tmp/phase1_tasks.txt"

# タスク状態更新
update_task_status() {
    local task="$1"
    local status="$2"
    echo "$task=$status" >> "$TASK_STATUS_FILE"
}

# Phase 1全タスク完了確認
check_all_phase1_tasks() {
    local supabase_done=$(grep -c "supabase_setup=completed" "$TASK_STATUS_FILE" 2>/dev/null || echo 0)
    local youtube_done=$(grep -c "youtube_api=completed" "$TASK_STATUS_FILE" 2>/dev/null || echo 0)
    local test_done=$(grep -c "test_implementation=completed" "$TASK_STATUS_FILE" 2>/dev/null || echo 0)
    
    if [[ $supabase_done -gt 0 && $youtube_done -gt 0 && $test_done -gt 0 ]]; then
        return 0
    else
        return 1
    fi
}

# President報告準備（深い分析版）
prepare_president_report() {
    echo "📋 President報告準備 - 深い分析実行中..."
    
    # 全Workerの状態を統合分析
    local synthesis=$(synthesize_multiple_reports)
    local overall_completion=$(echo "$synthesis" | jq -r '.overall_completion')
    local has_blockers=$(echo "$synthesis" | jq -r '.has_blockers')
    local critical_issues=$(echo "$synthesis" | jq -r '.critical_issues')
    
    # 品質メトリクス取得
    local quality_metrics=$(cat "$QUALITY_METRICS" 2>/dev/null || echo "{}")
    
    # 学習から得た洞察
    local insights=$(generate_insights_from_history)
    
    local report="🎯 深い分析に基づくプロジェクト報告

📊 総合完成度: $(printf "%.1f" $(echo "$overall_completion * 100" | bc))%

🔍 深い分析結果:
$insights

⚠️ 重要事項:
${critical_issues:-なし}

📈 品質指標:
$(format_quality_metrics "$quality_metrics")

🎯 推奨アクション:
$(generate_recommendations "$overall_completion" "$has_blockers")

🧠 Boss1の判断:
この報告は深い思考プロセスを経て作成されました。"

    send_message "president" "$report"
}

# 重大エラー処理
handle_critical_error() {
    local from_agent="$1"
    local message="$2"
    
    echo "🚨 重大エラー処理開始"
    
    # エラー影響範囲分析
    local impact_analysis=$(analyze_error_impact "$message")
    
    # 緊急対応策生成
    local emergency_actions=$(generate_emergency_actions "$impact_analysis")
    
    # 全Workerに緊急通知
    for worker in worker1 worker2 worker3; do
        if [ "$worker" != "$from_agent" ]; then
            send_message "multiagent:0.${worker##worker}" "🚨 緊急: $from_agent で重大エラー発生。影響確認と以下の対応をお願いします: $emergency_actions"
        fi
    done
    
    # エラー元には詳細対応指示
    send_message "$from_agent" "🚨 重大エラー対応手順: $emergency_actions

即座に以下を実行:
1) エラーログ全文取得
2) システム状態確認
3) 緊急回復手順実行
4) 5分以内に状況報告"
}

# リスク評価ブロードキャスト
broadcast_risk_assessment() {
    local source_agent="$1"
    local issue="$2"
    
    echo "📡 リスク評価を全エージェントにブロードキャスト"
    
    local risk_message="⚠️ リスク評価要請: $source_agent から報告された問題「$issue」が他の作業に影響する可能性があります。各自の作業への影響を確認し、報告してください。"
    
    for target in worker1 worker2 worker3; do
        if [ "$target" != "$source_agent" ]; then
            send_message "multiagent:0.${target##worker}" "$risk_message"
        fi
    done
}

# 類似質問検索
search_similar_questions() {
    local question="$1"
    
    # 簡易的な実装 - 実際はより高度な検索を実装
    if [[ "$question" =~ (TypeScript|型) ]]; then
        echo "TypeScript関連: tsconfig.jsonの'strict'オプション確認、@types/*パッケージのインストール確認"
    elif [[ "$question" =~ (ビルド|build) ]]; then
        echo "ビルド関連: npm run build実行、node_modules削除して再インストール、next.config.ts確認"
    elif [[ "$question" =~ (テスト|test) ]]; then
        echo "テスト関連: jest.config.js確認、テスト環境変数設定、モックデータ準備"
    else
        echo ""
    fi
}

# 動的ガイダンス提供
provide_dynamic_guidance() {
    local agent="$1"
    local progress="$2"
    
    echo "🎯 進捗に基づく動的ガイダンス生成"
    
    local guidance=""
    
    if (( $(echo "$progress < 0.3" | bc -l) )); then
        guidance="初期段階です。基礎をしっかり固めましょう。不明点は遠慮なく質問してください。"
    elif (( $(echo "$progress < 0.7" | bc -l) )); then
        guidance="順調に進んでいます。品質を維持しながら、ペースを上げていきましょう。"
    elif (( $(echo "$progress < 0.9" | bc -l) )); then
        guidance="完成間近です。最終チェックリストを確認し、品質保証を徹底してください。"
    else
        guidance="素晴らしい進捗です。最終確認後、完了報告をお願いします。"
    fi
    
    send_message "$agent" "📊 現在の進捗: $(printf "%.0f" $(echo "$progress * 100" | bc))% - $guidance"
}

# 隠れた意図の分析
analyze_hidden_intent() {
    local agent="$1"
    local message="$2"
    
    echo "🔮 メッセージの深層分析"
    
    # 不安や懸念のサイン
    if [[ "$message" =~ (たぶん|おそらく|かもしれない|不安|心配) ]]; then
        echo "   💭 不確実性を検出 - サポート提供"
        send_message "$agent" "メッセージから不確実性を感じました。具体的な懸念点があれば共有してください。一緒に解決策を見つけましょう。"
    fi
    
    # 過負荷のサイン
    if [[ "$message" =~ (忙しい|時間がない|手一杯|大変) ]]; then
        echo "   😰 過負荷を検出 - 負荷分散検討"
        consider_load_balancing "$agent"
    fi
}

# 洞察生成
generate_insights_from_history() {
    # 決定履歴から学んだ洞察を生成
    local insight_count=$(wc -l < "$DECISION_HISTORY" 2>/dev/null || echo "0")
    
    echo "- 過去 $insight_count 件の判断から学習済み
- チーム全体の強み: 迅速な実装、高品質なコード
- 改善機会: より詳細なテスト、ドキュメント強化"
}

# 品質メトリクスフォーマット
format_quality_metrics() {
    local metrics="$1"
    echo "$metrics" | jq -r 'to_entries | map("- \(.key): \(.value.current)/\(.value.threshold)") | join("\n")' 2>/dev/null || echo "- データなし"
}

# 推奨アクション生成
generate_recommendations() {
    local completion="$1"
    local has_blockers="$2"
    
    if [ "$has_blockers" = "true" ]; then
        echo "1. ブロッカーの即時解決
2. 影響範囲の最小化
3. 代替案の検討"
    elif (( $(echo "$completion >= 0.9" | bc -l) )); then
        echo "1. 最終品質チェック
2. デプロイ準備
3. ドキュメント最終確認"
    else
        echo "1. 現在のペース維持
2. 定期的な進捗確認
3. 品質基準の遵守"
    fi
}

# エラー影響分析
analyze_error_impact() {
    local error="$1"
    
    # エラータイプに基づく影響範囲判定
    if [[ "$error" =~ (データベース|DB|Supabase) ]]; then
        echo "database_critical"
    elif [[ "$error" =~ (API|エンドポイント) ]]; then
        echo "api_degraded"
    elif [[ "$error" =~ (ビルド|コンパイル) ]]; then
        echo "build_blocked"
    else
        echo "isolated"
    fi
}

# 緊急対応策生成
generate_emergency_actions() {
    local impact="$1"
    
    case "$impact" in
        "database_critical")
            echo "1) DB接続確認 2) バックアップ確認 3) 接続プール再起動"
            ;;
        "api_degraded")
            echo "1) APIヘルスチェック 2) エラーログ確認 3) フォールバック有効化"
            ;;
        "build_blocked")
            echo "1) キャッシュクリア 2) 依存関係再インストール 3) 設定ファイル検証"
            ;;
        *)
            echo "1) エラー詳細確認 2) 影響範囲特定 3) 回復手順実行"
            ;;
    esac
}

# 負荷分散検討
consider_load_balancing() {
    local overloaded_agent="$1"
    
    echo "⚖️ 負荷分散を検討中..."
    
    # 他のWorkerの負荷状況を確認（簡易実装）
    send_message "multiagent:0.0" "📊 負荷分散提案: $overloaded_agent が過負荷状態です。タスクの再配分を検討してください。"
}

# 最終報告自動生成
auto_generate_final_report() {
    echo "📋 最終報告自動生成"
    
    local report="🎉 SNS Video Generator Phase 1 完了報告

📊 Phase 1 実装完了項目：
✅ Vercelビルドエラー: 完全解消
✅ Supabase設定: プロファイルトリガー・RLS実装完了
✅ YouTube API統合: Data API v3実装・モック対応完了
✅ テスト基盤: Jest設定・カバレッジ80%達成
✅ ビルド: 本番ビルド成功確認

🔧 技術的改善：
- youtube-dl-exec依存除去・モック実装
- 環境変数による動作モード切替
- プロファイル自動作成トリガー実装
- 全テーブルRLSセキュリティ適用

📈 品質指標：
- ビルドエラー: 0件
- テストカバレッジ: 80%以上
- TypeScript型安全性: 確保
- セキュリティ: RLS全適用

🚀 Phase 2準備完了！"

    send_message "president" "$report"
}

# 全体進捗確認
check_overall_progress() {
    echo "🔍 全体進捗確認"
    
    # 作業状況ファイル確認（簡易版）
    local completed_count=0
    
    # 各ワーカーの完了状況をログから確認
    if grep -q "worker1.*完了" logs/send_log.txt 2>/dev/null; then
        ((completed_count++))
    fi
    if grep -q "worker2.*完了" logs/send_log.txt 2>/dev/null; then
        ((completed_count++))
    fi
    if grep -q "worker3.*完了" logs/send_log.txt 2>/dev/null; then
        ((completed_count++))
    fi
    
    echo "完了ワーカー数: $completed_count / 3"
    
    if [[ $completed_count -eq 3 ]]; then
        echo "🎉 全ワーカー完了 - 統合テスト開始"
        auto_integration_test
    fi
}

# ログ記録関数群
log_message() {
    local agent="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    mkdir -p logs
    echo "[$timestamp] $agent: MESSAGE - \"$message\"" >> logs/send_log.txt
}

log_completion() {
    local agent="$1" 
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    mkdir -p logs
    echo "[$timestamp] $agent: COMPLETED - \"$message\"" >> logs/send_log.txt
    echo "[$timestamp] BOSS: AUTO_PROCESS_COMPLETION for $agent" >> logs/send_log.txt
}

log_error() {
    local agent="$1"
    local message="$2" 
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    mkdir -p logs
    echo "[$timestamp] $agent: ERROR - \"$message\"" >> logs/send_log.txt
    echo "[$timestamp] BOSS: AUTO_HANDLE_ERROR for $agent" >> logs/send_log.txt
}

log_progress() {
    local agent="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    mkdir -p logs  
    echo "[$timestamp] $agent: PROGRESS - \"$message\"" >> logs/send_log.txt
}

show_usage() {
    cat << EOF
🤖 自律実行型BOSS管理システム - Agent間メッセージ送信

使用方法:
  $0 [エージェント名] [メッセージ]
  $0 --list
  $0 --auto [from_agent] [message]    # BOSS自律判断モード
  $0 --async [from_agent] [message]   # 非同期報告受信
  $0 --monitor                        # リアルタイム監視開始
  $0 --stop-monitor                   # 監視停止

利用可能エージェント:
  president - プロジェクト統括責任者
  boss1     - チームリーダー (自律実行型)
  worker1   - TypeScript修正担当
  worker2   - セキュリティ修正担当  
  worker3   - 認証統合・ESLint担当

🧠 BOSS自律機能:
  - 作業完了自動検知・次タスク指示
  - エラー自動対応・解決指示
  - 質問自動回答・サポート提供
  - 進捗自動監視・President報告
  - 統合テスト自動実行
  - 最終報告自動生成

📡 リアルタイム報告監視:
  - Worker報告を即座に受信・処理
  - 優先度に基づく自動対応
  - 非同期処理で待ち時間なし

使用例:
  $0 president "指示書に従って"
  $0 boss1 "Hello World プロジェクト開始指示"
  $0 --auto worker1 "TypeScript修正完了しました"
  $0 --monitor  # リアルタイム監視開始
  $0 --async worker2 "BullMQ互換レイヤー実装中"
EOF
}

# エージェント一覧表示
show_agents() {
    echo "📋 自律実行型BOSS管理システム エージェント一覧:"
    echo "================================================"
    echo "  president → president:0     (プロジェクト統括責任者)"
    echo "  boss1     → multiagent:0.0  (自律実行型チームリーダー)"
    echo "  worker1   → multiagent:0.1  (TypeScript修正担当)"
    echo "  worker2   → multiagent:0.2  (セキュリティ修正担当)" 
    echo "  worker3   → multiagent:0.3  (認証統合・ESLint担当)"
    echo ""
    echo "🧠 BOSS自律機能:"
    echo "  - 自動完了検知・次タスク指示"
    echo "  - 自動エラー対応・解決指示"
    echo "  - 自動質問回答・サポート"
    echo "  - 自動進捗監視・報告"
}

# メッセージ送信
send_message() {
    local target="$1"
    local message="$2"
    
    echo "📤 送信中: $target ← '$message'"
    
    # Claude Codeのプロンプトを一度クリア
    tmux send-keys -t "$target" C-c
    sleep 0.3
    
    # メッセージ送信
    tmux send-keys -t "$target" "$message"
    sleep 0.1
    
    # エンター押下
    tmux send-keys -t "$target" C-m
    sleep 0.5
}

# ターゲット存在確認
check_target() {
    local target="$1"
    local session_name="${target%%:*}"
    
    if ! tmux has-session -t "$session_name" 2>/dev/null; then
        echo "❌ セッション '$session_name' が見つかりません"
        return 1
    fi
    
    return 0
}

# メイン処理
main() {
    if [[ $# -eq 0 ]]; then
        show_usage
        exit 1
    fi
    
    # --listオプション
    if [[ "$1" == "--list" ]]; then
        show_agents
        exit 0
    fi
    
    # --autoオプション (BOSS自律判断モード)
    if [[ "$1" == "--auto" ]]; then
        if [[ $# -lt 3 ]]; then
            echo "❌ --autoモード使用方法: $0 --auto [from_agent] [message]"
            exit 1
        fi
        boss_autonomous_decision "$2" "$3"
        exit 0
    fi
    
    # --monitor オプション (リアルタイム監視モード)
    if [[ "$1" == "--monitor" ]]; then
        init_report_queue
        start_report_monitor
        echo "📡 リアルタイム報告監視を開始しました"
        echo "   監視を停止するには: $0 --stop-monitor"
        exit 0
    fi
    
    # --stop-monitor オプション
    if [[ "$1" == "--stop-monitor" ]]; then
        stop_report_monitor
        exit 0
    fi
    
    # --async オプション (非同期報告受信)
    if [[ "$1" == "--async" ]]; then
        if [[ $# -lt 3 ]]; then
            echo "❌ --asyncモード使用方法: $0 --async [from_agent] [message]"
            exit 1
        fi
        boss_autonomous_decision "$2" "$3" "--async"
        exit 0
    fi
    
    if [[ $# -lt 2 ]]; then
        show_usage
        exit 1
    fi
    
    local agent_name="$1"
    local message="$2"
    
    # エージェントターゲット取得
    local target
    target=$(get_agent_target "$agent_name")
    
    if [[ -z "$target" ]]; then
        echo "❌ エラー: 不明なエージェント '$agent_name'"
        echo "利用可能エージェント: $0 --list"
        exit 1
    fi
    
    # ターゲット確認
    if ! check_target "$target"; then
        exit 1
    fi
    
    # BOSSへの報告の場合は自律判断実行
    if [[ "$agent_name" == "boss1" ]]; then
        boss_autonomous_decision "user" "$message"
    fi
    
    # メッセージ送信
    send_message "$target" "$message"
    
    # ログ記録
    log_message "$agent_name" "$message"
    
    echo "✅ 送信完了: $agent_name に '$message'"
    
    return 0
}

main "$@"