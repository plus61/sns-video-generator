# チームタスク管理システム ガイド

## 概要
複雑なマルチエージェントシステムから、実用的な役割ベースタスク管理システムへ移行しました。

## 新システムの特徴

### 1. シンプルな構造
- 単一のスクリプト: `team-task-manager.sh`
- JSONベースのタスクファイル
- 明確なステータス管理

### 2. 役割ベースの思考フレームワーク
各タスクは自動的に適切な「思考モード」に割り当てられます：

- **DevOps思考**: インフラ、デプロイメント、環境設定
- **開発者思考**: コード実装、アーキテクチャ、リファクタリング
- **QA思考**: テスト、品質保証、バグ修正
- **技術ライター思考**: ドキュメント、ガイド、説明

### 3. 使用方法

#### タスクの作成
```bash
./team-task-manager.sh create <優先度> <カテゴリ> <説明>

# 例
./team-task-manager.sh create high infrastructure "Dockerfileの最適化"
./team-task-manager.sh create medium code "APIエンドポイントの実装"
./team-task-manager.sh create low documentation "READMEの更新"
```

#### タスクの実行
```bash
./team-task-manager.sh execute <タスクID>
```
実行すると、割り当てられた役割の思考モードが表示され、その観点での分析ポイントが示されます。

#### タスクの完了
```bash
./team-task-manager.sh complete <タスクID> [完了メモ]
```

#### タスク一覧の確認
```bash
./team-task-manager.sh list
```

## 実際の運用例

### 1. Railwayデプロイメントエラーの対応
```bash
# タスク作成
./team-task-manager.sh create high infrastructure "Railwayビルドエラーの調査と修正"

# 実行開始
./team-task-manager.sh execute 1234567890
# → DevOps思考モードで環境設定とビルドプロセスに焦点

# 完了
./team-task-manager.sh complete 1234567890 "環境変数追加とDockerfile修正で解決"
```

### 2. 新機能の実装
```bash
# 複数のタスクを作成
./team-task-manager.sh create high code "動画アップロードAPI実装"
./team-task-manager.sh create high testing "動画アップロードのテスト作成"
./team-task-manager.sh create medium documentation "API仕様書の作成"
```

## 従来システムとの違い

### 旧システム（廃止）
- 複雑なマルチエージェント通信
- tmuxセッション、ファイルベースメッセージング
- 実際には機能していない疑似的な仕組み
- 価値を生まない複雑性

### 新システム（現在）
- シンプルなタスク管理
- 役割ベースの思考フレームワーク
- 実用的で追跡可能
- 価値に焦点を当てた設計

## ディレクトリ構造
```
ai-org/
├── team-task-manager.sh    # メインスクリプト
├── tasks/                  # タスクファイル保存場所
│   ├── *.task             # 個別のタスクファイル
│   └── task_log.md        # タスク履歴ログ
├── TEAM_SYSTEM_REDESIGN.md # 設計書
├── TEAM_TASK_MANAGER_GUIDE.md # このガイド
└── old-team-system-backup-*/ # 旧システムのバックアップ
```

## 今後の拡張予定

1. **自動化機能**
   - 定期的なタスクの自動作成
   - 完了タスクのアーカイブ
   - 統計レポート生成

2. **統合機能**
   - GitHubイシューとの連携
   - Slackへの通知
   - CIパイプラインとの統合

3. **分析機能**
   - タスク完了時間の分析
   - ボトルネックの特定
   - 生産性メトリクス

## まとめ
新しいチームタスク管理システムは、実用性とシンプルさを重視し、実際の開発作業を効率的にサポートします。複雑な通信システムではなく、明確な役割と責任に基づいたタスク管理により、プロジェクトの進行を可視化し、管理します。