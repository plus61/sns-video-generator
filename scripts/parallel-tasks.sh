#!/bin/bash
# Claude Code並列実行デモ - 3倍速開発の実現

echo "=== Claude Code 3x Development Speed Demo ==="

# 並列タスク実行例
parallel_test() {
  npm test &
  npm run lint &
  npm run build &
  wait
  echo "全タスク完了!"
}

# 使用方法: bash parallel-tasks.sh
parallel_test