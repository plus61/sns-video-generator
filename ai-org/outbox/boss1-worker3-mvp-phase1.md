# 【Worker3】MVP Phase 1 - OpenAI実API動作

## 新ルール適用：実働率報告必須

### 必須確認項目（2時間以内）

1. **Whisper API実動作**
```bash
# 音声ファイルで転写テスト
curl https://api.openai.com/v1/audio/transcriptions \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -F file="@test-audio.mp3" \
  -F model="whisper-1"
```

2. **GPT-4分析実動作**
```bash
# 実際の分析リクエスト
node -e "
const { analyzeContent } = require('./lib/openai-integration');
analyzeContent('Test transcript').then(console.log);
"
```

### 動作確認チェックリスト
- [ ] Whisper API成功（実転写取得）
- [ ] GPT-4応答（実分析結果）
- [ ] APIキー未設定時エラー
- [ ] レート制限エラー処理
- [ ] タイムアウト処理（30秒）

### 実働率報告フォーマット
```
機能名: OpenAI API統合
実働率: XX%
- Whisper転写: ✅/❌
- GPT-4分析: ✅/❌
- エラー処理: ✅/❌
- レート制限: ✅/❌
残課題: [具体的な問題点]
```

### 注意事項
- 実APIキーでのテスト必須
- モック応答は実働率0%
- コスト考慮（GPT-3.5でも可）

2時間後に実働率を報告せよ。