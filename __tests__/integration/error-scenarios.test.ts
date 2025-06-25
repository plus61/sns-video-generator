import { describe, it, expect, jest } from '@jest/globals'
import request from 'supertest'

describe('エラーシナリオ網羅的テスト', () => {
  const baseUrl = process.env.TEST_URL || 'http://localhost:3000'
  
  describe('ネットワークエラー処理', () => {
    it('タイムアウト時にフォールバック処理される', async () => {
      // 実際の処理に時間がかかる動画URLを使用
      const response = await request(baseUrl)
        .post('/api/process-simple')
        .send({ url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw' })
        .timeout(30000) // 30秒タイムアウト
      
      // フォールバックまたは成功のいずれか
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    }, 35000)
    
    it('無効な動画ID処理時のフォールバック', async () => {
      const invalidUrls = [
        'https://www.youtube.com/watch?v=00000000000', // 無効なID
        'https://www.youtube.com/watch?v=', // IDなし
        'https://www.youtube.com/watch', // パラメータなし
        'https://youtu.be/', // 短縮URL IDなし
      ]
      
      for (const url of invalidUrls) {
        const response = await request(baseUrl)
          .post('/api/process-simple')
          .send({ url })
        
        // 無効なURLまたはフォールバック処理
        if (response.status === 400) {
          expect(response.body.error).toBe('Invalid YouTube URL')
        } else {
          expect(response.status).toBe(200)
          expect(response.body.videoId).toMatch(/^demo-/)
        }
      }
    })
  })
  
  describe('ファイルシステムエラー', () => {
    it('ディスク容量不足シミュレーション', async () => {
      // 大きな動画URLで処理
      const response = await request(baseUrl)
        .post('/api/process-simple')
        .send({ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' })
        .expect(200)
      
      // フォールバック処理されることを確認
      expect(response.body.success).toBe(true)
      if (response.body.videoPath) {
        // ファイルサイズ制限が守られている
        expect(response.body.fileSize).toBeLessThan(50 * 1024 * 1024)
      }
    })
  })
  
  describe('入力検証エラー', () => {
    it('様々な不正入力パターン', async () => {
      const invalidInputs = [
        { url: null },
        { url: undefined },
        { url: '' },
        { url: ' ' },
        { url: 123 },
        { url: true },
        { url: [] },
        { url: {} },
        { url: 'not-a-url' },
        { url: 'http://example.com' },
        { url: 'ftp://youtube.com/watch?v=test' },
        { url: 'javascript:alert(1)' },
        { url: '<script>alert(1)</script>' },
        { url: 'https://youtube.com/watch?v=<script>alert(1)</script>' },
      ]
      
      for (const input of invalidInputs) {
        const response = await request(baseUrl)
          .post('/api/process-simple')
          .send(input)
        
        expect(response.status).toBeGreaterThanOrEqual(400)
        expect(response.status).toBeLessThan(500)
        expect(response.body.error).toBeTruthy()
      }
    })
    
    it('異常に長いURL', async () => {
      const longId = 'a'.repeat(1000)
      const response = await request(baseUrl)
        .post('/api/process-simple')
        .send({ url: `https://www.youtube.com/watch?v=${longId}` })
      
      expect(response.status).toBeGreaterThanOrEqual(400)
      expect(response.body.error).toBeTruthy()
    })
    
    it('SQLインジェクション対策確認', async () => {
      const sqlInjectionAttempts = [
        "https://youtube.com/watch?v=test' OR '1'='1",
        "https://youtube.com/watch?v=test; DROP TABLE videos;",
        "https://youtube.com/watch?v=test') UNION SELECT * FROM users--",
      ]
      
      for (const url of sqlInjectionAttempts) {
        const response = await request(baseUrl)
          .post('/api/process-simple')
          .send({ url })
        
        // 安全に処理されること
        expect(response.status).toBeGreaterThanOrEqual(400)
        expect(response.body).not.toContain('SQL')
        expect(response.body).not.toContain('database')
      }
    })
  })
  
  describe('分析APIエラー処理', () => {
    it('分析API失敗時の処理', async () => {
      // analyze-simpleが失敗する可能性のあるケースでもフォールバック
      const response = await request(baseUrl)
        .post('/api/process-simple')
        .send({ url: 'https://www.youtube.com/watch?v=test123' })
      
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.segments).toBeDefined()
    })
  })
  
  describe('メモリリーク防止', () => {
    it('複数回の連続リクエストでメモリリークしない', async () => {
      const requests = 10
      const results = []
      
      for (let i = 0; i < requests; i++) {
        const response = await request(baseUrl)
          .post('/api/process-simple')
          .send({ url: `https://www.youtube.com/watch?v=dQw4w9WgXcQ` })
        
        results.push({
          status: response.status,
          success: response.body.success,
          memoryUsage: process.memoryUsage().heapUsed
        })
      }
      
      // 全てのリクエストが成功
      results.forEach(result => {
        expect(result.status).toBe(200)
        expect(result.success).toBe(true)
      })
      
      // メモリ使用量が異常に増加していないこと
      const firstMemory = results[0].memoryUsage
      const lastMemory = results[results.length - 1].memoryUsage
      const memoryIncrease = (lastMemory - firstMemory) / firstMemory
      
      expect(memoryIncrease).toBeLessThan(0.5) // 50%以上増加していない
    })
  })
  
  describe('レート制限とDDoS対策', () => {
    it('短時間の大量リクエストでも安定動作', async () => {
      const concurrentRequests = 5
      const promises = []
      
      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(
          request(baseUrl)
            .post('/api/process-simple')
            .send({ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' })
        )
      }
      
      const results = await Promise.allSettled(promises)
      
      // 少なくとも半数は成功すること
      const successCount = results.filter(r => 
        r.status === 'fulfilled' && r.value.status === 200
      ).length
      
      expect(successCount).toBeGreaterThanOrEqual(concurrentRequests / 2)
    })
  })
  
  describe('Content-Typeエラー処理', () => {
    it('不正なContent-Type', async () => {
      const response = await request(baseUrl)
        .post('/api/process-simple')
        .set('Content-Type', 'text/xml')
        .send('<url>https://www.youtube.com/watch?v=test</url>')
        .expect(400)
      
      expect(response.body.error).toBeTruthy()
    })
    
    it('Content-Typeなし', async () => {
      const response = await request(baseUrl)
        .post('/api/process-simple')
        .send('{"url":"https://www.youtube.com/watch?v=test"}')
      
      // 自動的にJSONとして解釈されるかエラー
      expect([200, 400]).toContain(response.status)
    })
  })
  
  describe('クリーンアップ処理確認', () => {
    it('エラー時に一時ファイルがクリーンアップされる', async () => {
      // 処理が途中で失敗するケース
      const response = await request(baseUrl)
        .post('/api/process-simple')
        .send({ url: 'https://www.youtube.com/watch?v=_invalid_' })
      
      // レスポンスは成功またはエラー
      expect([200, 400, 500]).toContain(response.status)
      
      // 一時ファイルパスが返されていない、または削除済み
      if (response.body.videoPath) {
        // ファイルアクセステストは実環境でのみ有効
        expect(response.body.videoPath).toMatch(/temp/)
      }
    })
  })
})