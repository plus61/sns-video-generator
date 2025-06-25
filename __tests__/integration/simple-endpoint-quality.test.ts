import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import request from 'supertest'

describe('/api/process-simple 品質テスト', () => {
  const baseUrl = process.env.TEST_URL || 'http://localhost:3000'
  
  describe('正常系テスト', () => {
    it('有効なYouTube URLで正常に処理される', async () => {
      const response = await request(baseUrl)
        .post('/api/process-simple')
        .send({ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' })
        .expect(200)
      
      expect(response.body).toMatchObject({
        success: true,
        videoId: expect.stringMatching(/^(video|demo)-/),
        youtubeVideoId: expect.any(String),
        segments: expect.any(Array),
        summary: expect.any(String),
        message: expect.any(String)
      })
      
      // セグメントの品質確認
      expect(response.body.segments.length).toBeGreaterThan(0)
      response.body.segments.forEach((segment: any) => {
        expect(segment).toMatchObject({
          id: expect.any(String),
          content: expect.any(String),
          score: expect.any(Number),
          type: expect.stringMatching(/^(education|trivia|entertainment)$/)
        })
        expect(segment.score).toBeGreaterThanOrEqual(0)
        expect(segment.score).toBeLessThanOrEqual(10)
      })
    })
    
    it('短縮YouTube URLでも処理される', async () => {
      const response = await request(baseUrl)
        .post('/api/process-simple')
        .send({ url: 'https://youtu.be/dQw4w9WgXcQ' })
        .expect(200)
      
      expect(response.body.success).toBe(true)
      expect(response.body.youtubeVideoId).toBe('dQw4w9WgXcQ')
    })
  })
  
  describe('エラー処理テスト', () => {
    it('URLが提供されない場合、400エラーを返す', async () => {
      const response = await request(baseUrl)
        .post('/api/process-simple')
        .send({})
        .expect(400)
      
      expect(response.body.error).toBe('YouTube URL is required')
    })
    
    it('無効なYouTube URLで400エラーを返す', async () => {
      const response = await request(baseUrl)
        .post('/api/process-simple')
        .send({ url: 'https://invalid-url.com/video' })
        .expect(400)
      
      expect(response.body.error).toBe('Invalid YouTube URL')
    })
    
    it('不正なリクエストボディで400エラーを返す', async () => {
      const response = await request(baseUrl)
        .post('/api/process-simple')
        .send('invalid json')
        .set('Content-Type', 'text/plain')
        .expect(400)
    })
    
    it('存在しない動画IDでもフォールバック処理される', async () => {
      const response = await request(baseUrl)
        .post('/api/process-simple')
        .send({ url: 'https://www.youtube.com/watch?v=invalid12345' })
        .expect(200)
      
      // モック分析が使われることを確認
      expect(response.body.success).toBe(true)
      expect(response.body.videoId).toMatch(/^demo-/)
      expect(response.body.segments).toBeDefined()
    })
  })
  
  describe('パフォーマンステスト', () => {
    it('処理が5秒以内に完了する', async () => {
      const startTime = Date.now()
      
      await request(baseUrl)
        .post('/api/process-simple')
        .send({ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' })
        .expect(200)
      
      const endTime = Date.now()
      const processingTime = (endTime - startTime) / 1000
      
      expect(processingTime).toBeLessThan(5)
      console.log(`処理時間: ${processingTime.toFixed(2)}秒`)
    })
    
    it('並行リクエストを適切に処理する', async () => {
      const urls = [
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://youtu.be/jNQXAC9IVRw',
        'https://www.youtube.com/watch?v=ZZ5LpwO-An4'
      ]
      
      const startTime = Date.now()
      
      const responses = await Promise.all(
        urls.map(url => 
          request(baseUrl)
            .post('/api/process-simple')
            .send({ url })
        )
      )
      
      const endTime = Date.now()
      const totalTime = (endTime - startTime) / 1000
      
      // 全てのリクエストが成功
      responses.forEach(response => {
        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
      })
      
      // 並行処理でも妥当な時間内に完了
      expect(totalTime).toBeLessThan(10)
      console.log(`並行処理時間（3リクエスト）: ${totalTime.toFixed(2)}秒`)
    })
  })
  
  describe('データ品質テスト', () => {
    it('分析結果が期待される構造を持つ', async () => {
      const response = await request(baseUrl)
        .post('/api/process-simple')
        .send({ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' })
        .expect(200)
      
      // サマリーの品質
      expect(response.body.summary).toBeTruthy()
      expect(response.body.summary.length).toBeGreaterThan(50)
      expect(response.body.summary.length).toBeLessThan(500)
      
      // セグメントの品質
      const segments = response.body.segments
      expect(segments.length).toBeGreaterThanOrEqual(3)
      expect(segments.length).toBeLessThanOrEqual(10)
      
      // スコアの分布確認
      const scores = segments.map((s: any) => s.score)
      const avgScore = scores.reduce((a: number, b: number) => a + b, 0) / scores.length
      expect(avgScore).toBeGreaterThan(5)
      expect(avgScore).toBeLessThan(9)
      
      // コンテンツタイプの多様性
      const types = new Set(segments.map((s: any) => s.type))
      expect(types.size).toBeGreaterThanOrEqual(2)
    })
    
    it('実ファイルダウンロード時の品質確認', async () => {
      const response = await request(baseUrl)
        .post('/api/process-simple')
        .send({ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' })
        .expect(200)
      
      if (response.body.videoPath) {
        // ファイルサイズが適切な範囲内
        expect(response.body.fileSize).toBeGreaterThan(0)
        expect(response.body.fileSize).toBeLessThan(50 * 1024 * 1024) // 50MB以下
      }
    })
  })
  
  describe('エッジケーステスト', () => {
    it('GETリクエストでステータス情報を返す', async () => {
      const response = await request(baseUrl)
        .get('/api/process-simple')
        .expect(200)
      
      expect(response.body).toMatchObject({
        status: 'ready',
        endpoint: '/api/process-simple',
        description: expect.any(String),
        usage: {
          method: 'POST',
          body: { url: 'YouTube URL' }
        }
      })
    })
    
    it('大文字小文字混在のURLでも処理される', async () => {
      const response = await request(baseUrl)
        .post('/api/process-simple')
        .send({ url: 'https://WWW.YouTube.COM/watch?v=dQw4w9WgXcQ' })
        .expect(200)
      
      expect(response.body.success).toBe(true)
    })
    
    it('追加パラメータ付きURLでも処理される', async () => {
      const response = await request(baseUrl)
        .post('/api/process-simple')
        .send({ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s&list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf' })
        .expect(200)
      
      expect(response.body.success).toBe(true)
      expect(response.body.youtubeVideoId).toBe('dQw4w9WgXcQ')
    })
  })
})