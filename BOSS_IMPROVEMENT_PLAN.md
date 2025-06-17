# 🚀 SNS Video Generator 総合改善計画書

## 🎯 最優先改善項目（Phase 1: 即座に実装）

### 1. Supabaseデータベース完全統合
```sql
-- 1. プロファイル自動作成トリガー
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at)
  VALUES (new.id, new.email, now());
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. RLSポリシー設定
ALTER TABLE video_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_segments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own videos" ON video_uploads
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own videos" ON video_uploads
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### 2. YouTube動画ダウンロード実装
```typescript
// 必要なパッケージ追加
npm install youtube-dl-exec @ffmpeg/ffmpeg

// 実装例
import youtubedl from 'youtube-dl-exec'

async function downloadYouTubeVideo(videoId: string, youtubeUrl: string) {
  const outputPath = `/tmp/${videoId}.mp4`
  
  await youtubedl(youtubeUrl, {
    output: outputPath,
    format: 'best[ext=mp4]/best',
    noWarnings: true,
    noCallHome: true,
    noCheckCertificate: true
  })
  
  return outputPath
}
```

### 3. テスト実装（TDD優先）
```typescript
// __tests__/api/upload-youtube.test.ts
describe('/api/upload-youtube', () => {
  test('有効なYouTube URLを受け付ける', async () => {
    const response = await request(app)
      .post('/api/upload-youtube')
      .set('Authorization', 'Bearer valid-token')
      .send({ url: 'https://youtu.be/test123' })
    
    expect(response.status).toBe(200)
    expect(response.body.videoId).toBeDefined()
  })
  
  test('無効なURLを拒否する', async () => {
    const response = await request(app)
      .post('/api/upload-youtube')
      .set('Authorization', 'Bearer valid-token')
      .send({ url: 'invalid-url' })
    
    expect(response.status).toBe(400)
  })
})
```

## 📋 Boss1への実行指示書

### Phase 1: 基盤修正（今すぐ実行）

#### Worker1: データベース・認証修正担当
1. Supabaseダッシュボードで上記SQLを実行
2. RLSポリシーを全テーブルに適用
3. プロファイル自動作成トリガーのテスト
4. 環境変数の完全性チェック

#### Worker2: YouTube機能実装担当
1. youtube-dl-execパッケージのインストール
2. ダウンロード機能の実装
3. メタデータ抽出機能の追加
4. エラーハンドリングの強化

#### Worker3: テスト・品質保証担当
1. 全APIエンドポイントのテスト作成
2. 統合テストの実装
3. E2Eテストシナリオの作成
4. カバレッジレポートの生成

### Phase 2: 機能強化（Phase 1完了後）

#### 実装優先順位
1. **Supabase Storage統合**
   - バケット作成
   - アップロード機能実装
   - CDN設定

2. **動画処理パイプライン**
   - FFmpeg統合
   - サムネイル生成
   - 動画メタデータ抽出

3. **セキュリティ強化**
   - APIレート制限
   - ファイルサイズ検証
   - ウイルススキャン統合

### Phase 3: パフォーマンス最適化

1. **チャンクアップロード実装**
2. **並列処理最適化**
3. **キャッシュ戦略実装**

## 🎯 成功指標

### 即座に達成すべき目標
- ✅ YouTube URL入力エラー: 0件
- ✅ データベース接続エラー: 0件
- ✅ テストカバレッジ: 80%以上
- ✅ 認証フロー成功率: 100%

### 1週間以内の目標
- ✅ 実際のYouTube動画ダウンロード成功
- ✅ 1GB動画のアップロード成功
- ✅ 基本的なセキュリティ要件充足

## 🚨 緊急度マトリクス

| 項目 | 緊急度 | 影響度 | 担当 |
|------|--------|--------|------|
| DB外部キー修正 | 🔴 高 | 🔴 高 | Worker1 |
| プロファイル自動作成 | 🔴 高 | 🔴 高 | Worker1 |
| YouTube DL実装 | 🔴 高 | 🟡 中 | Worker2 |
| テスト作成 | 🟡 中 | 🔴 高 | Worker3 |
| Storage統合 | 🟡 中 | 🟡 中 | Worker2 |

## 📝 実行コマンド集

```bash
# Phase 1 実行
npm install youtube-dl-exec @ffmpeg/ffmpeg
npm install -D @testing-library/react @testing-library/jest-dom jest

# テスト実行
npm run test:watch

# 型チェック
npm run type-check

# デプロイ前チェック
npm run build && npm run lint
```

## 🔄 進捗報告スケジュール

1. **30分ごと**: 各Workerから進捗報告
2. **2時間ごと**: 統合テスト実行
3. **完了時**: President最終報告

これでSNS Video Generatorを本番レベルの品質に引き上げます。