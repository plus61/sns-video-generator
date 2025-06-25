# 【Boss1→Worker2】バックエンド統合タスク詳細

## 最優先実装項目

### 1. Integration Bridge実装
```typescript
// src/lib/integration-bridge.ts
import { supabase } from './supabase';

export class IntegrationBridge {
  // 実際のアップロードAPI接続
  async uploadVideo(file: File, onProgress?: (progress: number) => void) {
    const formData = new FormData();
    formData.append('file', file);
    
    // 実際の/api/upload-videoエンドポイントへ
    const response = await fetch('/api/upload-video', {
      method: 'POST',
      body: formData
    });
    
    return response.json();
  }
  
  // 動画分割API接続
  async splitVideo(videoId: string) {
    const response = await fetch('/api/split-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        videoId,
        clipDuration: 10,
        maxClips: 3 
      })
    });
    
    return response.json();
  }
}
```

### 2. UIコンポーネントの実接続
既存のVideoUploader.tsxを修正して、実際のAPIと接続してください。

### 3. エラーハンドリング強化
- ネットワークエラー時のリトライ
- プログレス表示の実装
- タイムアウト処理

## 成功基準
- 実際のファイルアップロードが動作
- 分割処理が実行される
- 結果がUIに表示される

頑張ってください！