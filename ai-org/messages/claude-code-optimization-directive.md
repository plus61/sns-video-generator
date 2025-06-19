# Claude Code最適化指示書

作成日時: 2025-06-19
作成者: President
宛先: Boss1 → 全Workerチーム

## 🚀 Claude Codeの強力な機能を最大限活用した実装指示

### 1. 並列ツール実行による高速開発 【最重要】

**指示内容**:
```bash
# 複数のツールを同時実行して開発効率を最大化
# 例: 複数ファイルの同時読み込み
- Read: /src/app/layout.tsx
- Read: /src/middleware.ts  
- Read: /src/lib/supabase.ts
- Grep: "useAuth" pattern in src/
# これらを1つのメッセージで同時実行
```

**Worker実装方法**:
- 関連ファイルは常に並列で読み込む
- Grep/Glob検索も並列実行
- Bashコマンドも可能な限り並列化

### 2. Task（Agent）ツールによる複雑な検索と分析

**指示内容**:
```markdown
# 以下のような複雑なタスクはTaskツールを使用
- "認証フローのすべての実装箇所を特定して改善点を提案"
- "動画処理パイプライン全体の流れを分析"
- "TypeScriptエラーをすべて検出して修正方法を提示"
```

**活用シーン**:
- コードベース全体の理解が必要な作業
- 複数ファイルにまたがる機能の分析
- バグの根本原因調査

### 3. TodoWrite/TodoReadによる進捗管理

**指示内容**:
```markdown
# 必須ルール
1. 3つ以上のステップがある作業は必ずTodoリスト作成
2. 作業開始時に該当タスクを"in_progress"に更新
3. 完了即座に"completed"に更新
4. 新たな問題発見時は即座にTodoに追加
```

**テンプレート**:
```json
{
  "todos": [
    {
      "id": "auth-migration",
      "content": "Supabase Auth移行: NextAuth.jsからの完全移行",
      "status": "pending",
      "priority": "high"
    }
  ]
}
```

### 4. MultiEditによる効率的な一括編集

**指示内容**:
```markdown
# 同一ファイルの複数箇所を編集する場合は必ずMultiEdit使用
# 例: TypeScript型定義の一括更新
```

**実装例**:
```typescript
// 複数のimport文、型定義、関数を一度に更新
MultiEdit: {
  file_path: "/src/lib/types.ts",
  edits: [
    { old_string: "interface User", new_string: "interface AuthUser" },
    { old_string: "userId: string", new_string: "userId: string | null" },
    { old_string: "async getUser()", new_string: "async getAuthUser()" }
  ]
}
```

### 5. WebFetch/WebSearchによる最新情報取得

**指示内容**:
```markdown
# 実装に迷った場合は必ず最新ドキュメントを参照
- Supabase v2の新機能確認
- Next.js 15の最新パターン
- React 19の新フック使用方法
```

### 6. Git操作の自動化

**指示内容**:
```bash
# コミット作成時の並列実行
- git status
- git diff --staged
- git log --oneline -10
# これらを同時実行してコミットメッセージを最適化
```

### 7. エラーハンドリングとデバッグ

**指示内容**:
```markdown
# エラー発生時の体系的アプローチ
1. エラーメッセージをGrepで検索
2. 関連ファイルを並列Read
3. 公式ドキュメントをWebFetchで確認
4. 修正案をMultiEditで一括適用
```

## 📋 具体的なタスク実行計画

### Phase 1: 緊急修正（2時間以内）

#### タスク1: TypeScript設定最適化
```bash
# Worker1が実行
1. Read: tsconfig.json, next.config.js（並列）
2. MultiEdit: tsconfig.jsonで以下を一括更新
   - moduleResolution: "bundler"
   - const型パラメータ有効化
   - パスエイリアス修正
3. Bash: npm run type-check（検証）
```

#### タスク2: Supabase認証移行
```bash
# Worker2が実行
1. Task: "NextAuth.jsの全使用箇所を特定"
2. Read: 認証関連ファイル（並列10ファイル）
3. MultiEdit: 各ファイルでSupabase Authに移行
4. Write: 新しいmiddleware.ts
```

#### タスク3: Redis/BullMQ最適化
```bash
# Worker3が実行
1. Grep: "Redis|BullMQ" パターン検索
2. Read: Queue設定ファイル（並列）
3. Edit: 接続プール設定追加
4. Bash: Redis接続テスト
```

### Phase 2: パフォーマンス改善（6時間以内）

#### タスク4-6: React 19/Next.js 15最適化
```bash
# 全Worker並列実行
- Server Components移行
- Suspenseバウンダリ追加
- useフック活用
- PPR有効化
```

### Phase 3: 機能強化（24時間以内）

#### タスク7-10: 高度な機能実装
```bash
# チーム全体で分担
- Supabase Realtime実装
- 50GBファイル対応
- Vector検索実装
- Edge Functions活用
```

## 🎯 成功基準

1. **開発速度**: 並列実行により3倍高速化
2. **品質**: 型安全性100%、テストカバレッジ90%
3. **パフォーマンス**: 40ms以下のレスポンスタイム
4. **保守性**: 明確なコード構造、完全なドキュメント

## 💡 プロのTips

1. **常に並列実行を意識**
   - 関連ファイルは一度に読む
   - 独立したBashコマンドは同時実行

2. **Taskツールの積極活用**
   - "どのファイルに○○があるか"という質問
   - コードベース全体の理解が必要な作業

3. **MultiEditで時間節約**
   - 同じファイルの複数編集は必須
   - リファクタリング作業で威力発揮

4. **TodoListで可視化**
   - 進捗を常に更新
   - ユーザーに安心感を提供

5. **エラー時は冷静に**
   - 並列ツールで情報収集
   - 公式ドキュメント確認
   - 体系的な解決アプローチ

## 実行開始

Boss1はこの指示書に基づき、各Workerに最適なタスクを割り振り、Claude Codeの機能を最大限活用した開発を指揮してください。

**成功の鍵**: 並列実行、自動化、体系的アプローチ

---
この指示により、チームは最高のパフォーマンスを発揮します。