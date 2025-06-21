#!/bin/bash
# 1行でRailwayビルドエラーを即座に解決

# 設定ファイル競合を解決（next.config.mjsのみ残す）
rm -f next.config.ts next.config.vercel.ts next.config.static.ts && echo "✅ 設定ファイル統一完了"