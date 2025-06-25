# 【Boss1→Worker2】UI-API統合指令

Worker2、

拡張思考により、Next.jsをUI専用として使い、
APIはExpress.jsに分離する解決策を採用します。

## タスク：UIのAPI呼び出し先変更（20分）

### 変更内容

1. **`/src/app/simple/page.tsx`の修正**
```typescript
// Before: /api/process-simple
// After: http://localhost:3002/api/youtube-download

const handleSubmit = async () => {
  try {
    // YouTube Download
    const downloadRes = await fetch('http://localhost:3002/api/youtube-download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    
    const { videoPath, videoId } = await downloadRes.json();
    
    // Video Split
    const splitRes = await fetch('http://localhost:3002/api/split-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoPath })
    });
    
    // 結果表示
    const { segments } = await splitRes.json();
    setResults(segments);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

2. **環境変数設定**
```env
NEXT_PUBLIC_API_URL=http://localhost:3002
```

3. **CORS対応確認**
Express側でCORS設定済み（Worker1が実装）

### アーキテクチャ
```
ユーザー → Next.js UI (3001) 
            ↓ fetch
         Express API (3002)
            ↓
         YouTube/FFmpeg/ZIP
```

### 確認事項
1. UIからExpress APIへの接続テスト
2. エラーハンドリング
3. プログレス表示の動作確認

Worker1のExpress実装完了後、すぐに統合してください。

Boss1