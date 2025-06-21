# 📁 ディレクトリ構造変更計画

## 現在の構造（問題あり）
```
/Users/yuichiroooosuger/sns-video-generator/
├── sns-video-generator/  （実際のNext.jsプロジェクト）
├── ai-org/
├── docs/
├── CLAUDE.md
└── その他ファイル
```

## 新しい構造（提案）
```
/Users/yuichiroooosuger/sns-video-workspace/
├── app/                    （Next.jsプロジェクト - 旧sns-video-generator）
├── ai-org/                 （AIチーム管理）
├── docs/                   （ドキュメント）
├── scripts/                （スクリプト類）
├── .claude/                （Claude関連設定）
├── CLAUDE.md
└── README.md
```

## 変更手順

### Phase 1: バックアップと準備
1. 現在の状態を完全バックアップ
2. Gitの状態を確認（未コミットの変更を保存）

### Phase 2: ディレクトリ移動
```bash
# 1. 親ディレクトリの名前変更
cd /Users/yuichiroooosuger/
mv sns-video-generator sns-video-workspace

# 2. Next.jsプロジェクトの名前変更
cd sns-video-workspace
mv sns-video-generator app
```

### Phase 3: 設定ファイル更新
影響を受けるファイル：
- package.json
- tsconfig.json
- next.config.mjs
- .env.local
- CLAUDE.md
- すべてのスクリプトファイル（.sh）

### Phase 4: パス参照の更新
- ai-org内のすべてのスクリプト
- ドキュメント内のパス参照
- Gitフック
- CI/CD設定

### Phase 5: 検証
- npm run dev で起動確認
- npm run build でビルド確認
- すべてのスクリプトの動作確認

## Worker別タスク割り当て

### Worker1: ディレクトリ操作とGit管理
- バックアップ作成
- ディレクトリ移動実行
- Git履歴の保持確認

### Worker2: 設定ファイルとスクリプト更新
- package.json内のパス更新
- シェルスクリプトのパス修正
- 環境変数の確認

### Worker3: ドキュメントと検証
- CLAUDE.mdの更新
- README.mdの作成/更新
- 全体の動作検証

## リスク対策
1. 完全バックアップを取る
2. 段階的に変更を実施
3. 各ステップで動作確認
4. ロールバック手順を準備