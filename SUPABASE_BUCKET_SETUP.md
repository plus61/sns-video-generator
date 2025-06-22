# Supabase Storage バケット作成手順

## 必要なバケット

1. **video-uploads** - 元動画の保存用
2. **video-segments** - 分割されたクリップ保存用
3. **thumbnails** - サムネイル保存用

## 作成SQL

```sql
-- Supabase Dashboardで実行、またはコードで自動作成
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('video-uploads', 'video-uploads', true),
  ('video-segments', 'video-segments', true),
  ('thumbnails', 'thumbnails', true);
```

## プログラムでの自動作成

```typescript
// src/lib/supabase-storage-setup.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function ensureBucketsExist() {
  const buckets = ['video-uploads', 'video-segments', 'thumbnails']
  
  for (const bucketName of buckets) {
    const { data: existing } = await supabase.storage.getBucket(bucketName)
    
    if (!existing) {
      const { error } = await supabase.storage.createBucket(bucketName, {
        public: true
      })
      if (error) console.error(`Failed to create bucket ${bucketName}:`, error)
      else console.log(`Created bucket: ${bucketName}`)
    }
  }
}
```

## 実行タイミング

アプリ起動時に自動実行、または手動でDashboardから作成