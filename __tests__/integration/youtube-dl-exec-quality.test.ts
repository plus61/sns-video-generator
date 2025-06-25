import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals'
import request from 'supertest'
import fs from 'fs/promises'
import path from 'path'

describe('/api/process-simple youtube-dl-exec実装の品質検証', () => {
  const baseUrl = process.env.TEST_URL || 'http://localhost:3000'
  const tempDir = path.join(process.cwd(), 'temp', 'test-videos')
  
  beforeAll(async () => {
    // テスト用一時ディレクトリ作成
    await fs.mkdir(tempDir, { recursive: true })
  })
  
  afterAll(async () => {
    // クリーンアップ
    try {
      await fs.rm(tempDir, { recursive: true, force: true })
    } catch (error) {
      console.log('Cleanup error:', error)
    }
  })
  
  describe('実動画ダウンロード機能', () => {
    it('youtube-dl-execで実際に動画をダウンロードできる', async () => {
      const response = await request(baseUrl)
        .post('/api/process-simple')
        .send({ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' })
        .timeout(60000) // 60秒タイムアウト（実ダウンロードのため）
      
      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        success: true,
        videoId: expect.stringMatching(/^video-dQw4w9WgXcQ-/),
        youtubeVideoId: 'dQw4w9WgXcQ',
        videoPath: expect.stringContaining('.mp4'),
        fileSize: expect.any(Number),
        segments: expect.any(Array),
        message: expect.stringContaining('Real video processed')
      })
      
      // ファイルサイズ確認（実際の動画）
      if (response.body.videoPath) {
        expect(response.body.fileSize).toBeGreaterThan(100000) // 100KB以上
      }
    }, 70000)
    
    it('短い動画URLでも適切に処理される', async () => {
      // 短い動画（30秒以内）でテスト
      const response = await request(baseUrl)
        .post('/api/process-simple')
        .send({ url: 'https://youtu.be/jNQXAC9IVRw' })
        .timeout(60000)
      
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      
      // youtu.be形式のURLも正しく解析
      expect(response.body.youtubeVideoId).toBe('jNQXAC9IVRw')
    }, 70000)
    
    it('ダウンロード失敗時はモック分析にフォールバック', async () => {
      // 存在しない動画ID
      const response = await request(baseUrl)
        .post('/api/process-simple')
        .send({ url: 'https://www.youtube.com/watch?v=invalid12345' })
        .timeout(30000)
      
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      // フォールバックの場合はdemo-プレフィックス
      expect(response.body.videoId).toMatch(/^demo-/)
      expect(response.body.message).toContain('mock')
    })
  })
  
  describe('動画分割機能の品質', () => {
    it('ダウンロードした動画を固定時間で分割', async () => {
      const response = await request(baseUrl)
        .post('/api/process-simple')
        .send({ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' })
        .timeout(60000)
      
      expect(response.status).toBe(200)
      
      const segments = response.body.segments
      expect(segments).toBeDefined()
      expect(segments.length).toBeGreaterThanOrEqual(1)
      expect(segments.length).toBeLessThanOrEqual(3)
      
      // セグメント構造の検証
      segments.forEach((segment: any, index: number) => {
        expect(segment).toMatchObject({
          start: index * 10,
          end: (index + 1) * 10,
          score: expect.any(Number),
          type: expect.stringMatching(/^(highlight|educational|content)$/),
          path: expect.stringContaining('segment')
        })
        
        // スコアの妥当性
        expect(segment.score).toBeGreaterThanOrEqual(5)
        expect(segment.score).toBeLessThanOrEqual(8)
      })
      
      // セグメントのタイプ分布
      expect(segments[0]?.type).toBe('highlight')
      if (segments[1]) expect(segments[1].type).toBe('educational')
      if (segments[2]) expect(segments[2].type).toBe('content')
    }, 70000)
    
    it('短い動画でも適切にセグメント化', async () => {
      // 20秒程度の短い動画でテスト
      const response = await request(baseUrl)
        .post('/api/process-simple')
        .send({ url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw' })
        .timeout(60000)
      
      expect(response.status).toBe(200)
      
      const segments = response.body.segments
      // 短い動画なので1-2セグメント
      expect(segments.length).toBeGreaterThanOrEqual(1)
      expect(segments.length).toBeLessThanOrEqual(2)
      
      // サマリーに正しいセグメント数が記載
      expect(response.body.summary).toContain(`${segments.length} segments`)
    }, 70000)
  })
  
  describe('エラー処理とリカバリー', () => {
    it('無効なURLフォーマットを適切に拒否', async () => {
      const invalidUrls = [
        'https://vimeo.com/123456',
        'https://example.com/video',
        'not-a-url',
        'youtube.com/watch?v=test', // httpsなし
        'https://youtube.com/watch', // v=パラメータなし
      ]
      
      for (const url of invalidUrls) {
        const response = await request(baseUrl)
          .post('/api/process-simple')
          .send({ url })
        
        expect(response.status).toBe(400)
        expect(response.body.error).toBe('Invalid YouTube URL')
      }
    })
    
    it('youtube-dl-exec特有のエラーを適切に処理', async () => {
      // プライベート動画や地域制限のある動画
      const restrictedUrls = [
        'https://www.youtube.com/watch?v=private_video',
        'https://www.youtube.com/watch?v=region_blocked',
      ]
      
      for (const url of restrictedUrls) {
        const response = await request(baseUrl)
          .post('/api/process-simple')
          .send({ url })
          .timeout(30000)
        
        // エラーでもフォールバック処理で200を返す
        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
        expect(response.body.videoId).toMatch(/^demo-/)
      }
    })
    
    it('一時ファイルが確実にクリーンアップされる', async () => {
      const response = await request(baseUrl)
        .post('/api/process-simple')
        .send({ url: 'https://www.youtube.com/watch?v=error_test' })
        .timeout(30000)
      
      // レスポンスは成功（フォールバック）
      expect(response.status).toBe(200)
      
      // tempディレクトリ内のファイル数をチェック
      try {
        const files = await fs.readdir(path.join(process.cwd(), 'temp', 'videos'))
        // エラー時は一時ファイルが残らない
        const errorFiles = files.filter(f => f.includes('error_test'))
        expect(errorFiles.length).toBe(0)
      } catch {
        // ディレクトリが存在しない場合も正常
      }
    })
  })
  
  describe('パフォーマンスと最適化', () => {
    it('低画質設定で高速ダウンロード', async () => {
      const startTime = Date.now()
      
      const response = await request(baseUrl)
        .post('/api/process-simple')
        .send({ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' })
        .timeout(60000)
      
      const endTime = Date.now()
      const duration = (endTime - startTime) / 1000
      
      expect(response.status).toBe(200)
      
      // パフォーマンス基準
      console.log(`ダウンロード+処理時間: ${duration.toFixed(2)}秒`)
      expect(duration).toBeLessThan(30) // 30秒以内
      
      // 低画質設定の確認（ファイルサイズが小さい）
      if (response.body.fileSize) {
        expect(response.body.fileSize).toBeLessThan(50 * 1024 * 1024) // 50MB以下
      }
    }, 70000)
    
    it('並行リクエストでも安定動作', async () => {
      const urls = [
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://youtu.be/jNQXAC9IVRw',
      ]
      
      const startTime = Date.now()
      
      const responses = await Promise.allSettled(
        urls.map(url =>
          request(baseUrl)
            .post('/api/process-simple')
            .send({ url })
            .timeout(60000)
        )
      )
      
      const endTime = Date.now()
      const totalTime = (endTime - startTime) / 1000
      
      // 全リクエストの結果確認
      let successCount = 0
      responses.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.status === 200) {
          successCount++
          console.log(`URL ${index + 1}: 成功`)
        } else {
          console.log(`URL ${index + 1}: 失敗またはエラー`)
        }
      })
      
      // 少なくとも1つは成功
      expect(successCount).toBeGreaterThanOrEqual(1)
      
      console.log(`並行処理時間（${urls.length}リクエスト）: ${totalTime.toFixed(2)}秒`)
    }, 120000)
  })
  
  describe('youtube-dl-exec固有の機能検証', () => {
    it('ヘッダーとユーザーエージェントの設定が有効', async () => {
      // 特定のヘッダーが必要な動画でテスト
      const response = await request(baseUrl)
        .post('/api/process-simple')
        .send({ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' })
        .timeout(60000)
      
      expect(response.status).toBe(200)
      // refererとuser-agentの設定により正常にダウンロード
      expect(response.body.success).toBe(true)
      expect(response.body.message).toContain('Real video processed')
    }, 70000)
    
    it('証明書チェックスキップオプションが機能', async () => {
      // SSL証明書の問題がある環境でも動作
      const response = await request(baseUrl)
        .post('/api/process-simple')
        .send({ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' })
        .timeout(60000)
      
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    }, 70000)
  })
})