#!/bin/bash
# tmux-live-monitor.sh - tmuxでの組織駆動実況表示

# tmuxセッション名
SESSION_NAME="org-monitor"

# 既存セッションをチェック
tmux has-session -t $SESSION_NAME 2>/dev/null
if [ $? -eq 0 ]; then
    echo "既存のセッションに接続中..."
    tmux attach-session -t $SESSION_NAME
    exit 0
fi

# 新規セッション作成
echo "📺 組織駆動モニタリングセッションを作成..."
tmux new-session -d -s $SESSION_NAME -n "Overview"

# ウィンドウ1: 全体概要（4分割）
tmux split-window -h -t $SESSION_NAME:0
tmux split-window -v -t $SESSION_NAME:0.0
tmux split-window -v -t $SESSION_NAME:0.2

# 各ペインでステータス監視
tmux send-keys -t $SESSION_NAME:0.0 'watch -n 1 "echo \"=== BOSS STATUS ===\"; cat boss1/status.txt 2>/dev/null || echo offline; echo \"\"; echo \"=== LATEST TASK ===\"; ls -t boss1/tasks/*.task 2>/dev/null | head -1 | xargs basename 2>/dev/null"' C-m

tmux send-keys -t $SESSION_NAME:0.1 'watch -n 1 "echo \"=== WORKER1 STATUS ===\"; cat worker1/status.txt 2>/dev/null || echo offline; echo \"\"; echo \"=== ACTIVITY ===\"; tail -3 logs/worker1_activity.log 2>/dev/null"' C-m

tmux send-keys -t $SESSION_NAME:0.2 'watch -n 1 "echo \"=== WORKER2 STATUS ===\"; cat worker2/status.txt 2>/dev/null || echo offline; echo \"\"; echo \"=== ACTIVITY ===\"; tail -3 logs/worker2_activity.log 2>/dev/null"' C-m

tmux send-keys -t $SESSION_NAME:0.3 'watch -n 1 "echo \"=== WORKER3 STATUS ===\"; cat worker3/status.txt 2>/dev/null || echo offline; echo \"\"; echo \"=== ACTIVITY ===\"; tail -3 logs/worker3_activity.log 2>/dev/null"' C-m

# ウィンドウ2: 通信ログ
tmux new-window -t $SESSION_NAME:1 -n "Communication"
tmux send-keys -t $SESSION_NAME:1 'tail -f logs/send_log.txt | grep -E "(president|boss1|worker[1-3])" --color=always' C-m

# ウィンドウ3: リアルタイムタスク
tmux new-window -t $SESSION_NAME:2 -n "Tasks"
tmux split-window -h -t $SESSION_NAME:2
tmux send-keys -t $SESSION_NAME:2.0 'watch -n 2 "echo \"📋 PENDING TASKS\"; find . -name \"*.task\" ! -name \"*.done\" 2>/dev/null | wc -l; echo \"\"; find . -name \"*.task\" ! -name \"*.done\" 2>/dev/null | head -5"' C-m
tmux send-keys -t $SESSION_NAME:2.1 'watch -n 2 "echo \"✅ COMPLETED TASKS\"; find . -name \"*.task.done\" 2>/dev/null | wc -l; echo \"\"; find . -name \"*.task.done\" 2>/dev/null | tail -5"' C-m

# ウィンドウ4: Railway テスト実行状況
tmux new-window -t $SESSION_NAME:3 -n "Railway-Tests"
tmux split-window -h -t $SESSION_NAME:3
tmux split-window -v -t $SESSION_NAME:3.0

# 各テストカテゴリの進捗表示
tmux send-keys -t $SESSION_NAME:3.0 'echo "🔧 INFRASTRUCTURE TESTS"; echo "====================="; echo ""; echo "Waiting for Worker1 to start Railway tests..."; echo ""; echo "Expected tests:"; echo "- Health check endpoint"; echo "- Environment variables"; echo "- Docker resources"; echo "- SSL/TLS verification"' C-m

tmux send-keys -t $SESSION_NAME:3.1 'echo "⚙️ FUNCTIONAL TESTS"; echo "=================="; echo ""; echo "Waiting for Worker2 to start API tests..."; echo ""; echo "Expected tests:"; echo "- NextAuth.js authentication"; echo "- Supabase CRUD operations"; echo "- OpenAI API integration"; echo "- File upload functionality"' C-m

tmux send-keys -t $SESSION_NAME:3.2 'echo "🔄 INTEGRATION TESTS"; echo "==================="; echo ""; echo "Waiting for Worker3 to start E2E tests..."; echo ""; echo "Expected tests:"; echo "- E2E scenarios"; echo "- Load testing"; echo "- Security headers"; echo "- Performance metrics"' C-m

# セッションにアタッチ
echo "✅ モニタリングセッション作成完了"
echo ""
echo "使用方法:"
echo "  接続: tmux attach-session -t $SESSION_NAME"
echo "  切断: Ctrl-b d"
echo "  終了: tmux kill-session -t $SESSION_NAME"
echo ""
echo "ウィンドウ切替: Ctrl-b [番号]"
echo "  0: Overview (4分割ステータス)"
echo "  1: Communication (通信ログ)"
echo "  2: Tasks (タスク状況)"
echo "  3: Railway Tests (テスト進捗)"
echo ""

# 自動的にセッションに接続
tmux attach-session -t $SESSION_NAME