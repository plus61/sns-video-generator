# 【最終指令】TDD駆動による本番実装 - モック卒業

Boss1、客観的検証の結果、以下が未実装であることが判明した。
モックでの成功アピールは不要。実際に動作するコードをTDDで実装せよ。

## 🎯 必須実装項目（TDD必須）

### 1. YouTube動画ダウンロード機能（Worker1 - 1時間）
```bash
# まずテストを書く
npm test -- __tests__/youtube-download.test.ts

# テスト内容：
- 実際のYouTube URLから動画をダウンロード
- ファイルがローカルに保存される
- メタデータ（タイトル、長さ）が取得できる
```

### 2. FFmpeg動画分割機能（Worker2 - 1時間）
```bash
# テストファースト
npm test -- __tests__/video-split.test.ts

# テスト内容：
- 動画ファイルから指定時間のセグメントを切り出し
- 出力ファイルが再生可能
- 品質が維持されている
```

### 3. OpenAI API統合（Worker3 - 1時間）
```bash
# テスト駆動
npm test -- __tests__/openai-integration.test.ts

# テスト内容：
- 実際のOpenAI APIコール
- Whisperでの音声認識
- GPT-4での内容分析
```

## 📋 TDD実装手順

各ワーカーは以下の手順を厳守：

1. **Red**: 失敗するテストを書く（15分）
2. **Green**: テストを通す最小限のコード（30分）
3. **Refactor**: コードを改善（15分）
4. **Demo**: 動作確認動画を作成

## 🚨 検証可能な成果物

### 必須提出物（各機能ごと）
1. テストコード（`__tests__/`ディレクトリ）
2. 実装コード（モック削除済み）
3. テスト実行ログ（全て緑）
4. 動作確認動画またはスクリーンショット

### 統合デモ（3時間後）
```bash
# 実際のフロー
1. YouTube URL入力: https://www.youtube.com/watch?v=jNQXAC9IVRw
2. 実際にダウンロード（進捗表示付き）
3. OpenAI APIで分析（実際のAPI使用）
4. FFmpegで分割（実ファイル生成）
5. ZIPダウンロード（実際のファイル）
```

## ⛔ 禁止事項
- モックデータの使用
- 「将来実装予定」のコメント
- 未実装機能の「成功」報告
- テストなしのコード追加

## ✅ 完了条件
```bash
# 全テストが通ること
npm test -- --coverage

# カバレッジ80%以上
# E2Eテストも含む
```

3時間以内に、実際に動作する証拠を提出せよ。
言葉での報告は不要。コードとテスト結果で示せ。