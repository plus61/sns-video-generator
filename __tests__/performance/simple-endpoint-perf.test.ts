import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import request from 'supertest'

describe('パフォーマンステスト - /api/process-simple', () => {
  const baseUrl = process.env.TEST_URL || 'http://localhost:3000'
  
  // パフォーマンス測定用ヘルパー
  const measurePerformance = async (testName: string, testFn: () => Promise<any>) => {
    const startTime = process.hrtime.bigint()
    const startMemory = process.memoryUsage()
    
    const result = await testFn()
    
    const endTime = process.hrtime.bigint()
    const endMemory = process.memoryUsage()
    
    const duration = Number(endTime - startTime) / 1_000_000 // ミリ秒
    const memoryDelta = {
      heapUsed: (endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024, // MB
      external: (endMemory.external - startMemory.external) / 1024 / 1024,
    }
    
    console.log(`
      テスト: ${testName}
      実行時間: ${duration.toFixed(2)}ms
      メモリ使用量変化: +${memoryDelta.heapUsed.toFixed(2)}MB (heap), +${memoryDelta.external.toFixed(2)}MB (external)
    `)
    
    return { duration, memoryDelta, result }
  }
  
  describe('レスポンスタイム測定', () => {
    it('単一リクエストが5秒以内に完了', async () => {
      const { duration, result } = await measurePerformance(
        '単一リクエスト処理',
        async () => {
          return await request(baseUrl)
            .post('/api/process-simple')
            .send({ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' })
            .expect(200)
        }
      )
      
      expect(duration).toBeLessThan(5000) // 5秒以内
      expect(result.body.success).toBe(true)
      
      // 目標達成度
      if (duration < 3000) {
        console.log('✅ 優秀: 3秒以内で処理完了')
      } else if (duration < 4000) {
        console.log('✅ 良好: 4秒以内で処理完了')
      } else {
        console.log('⚠️  改善の余地あり: 5秒近くかかっています')
      }
    })
    
    it('モック分析（フォールバック）のパフォーマンス', async () => {
      const { duration } = await measurePerformance(
        'モック分析処理',
        async () => {
          return await request(baseUrl)
            .post('/api/process-simple')
            .send({ url: 'https://www.youtube.com/watch?v=invalidvideo' })
            .expect(200)
        }
      )
      
      expect(duration).toBeLessThan(2000) // モックは2秒以内
      console.log('✅ モック分析は高速に動作')
    })
  })
  
  describe('並行処理性能', () => {
    it('3つの並行リクエストを10秒以内に処理', async () => {
      const urls = [
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://youtu.be/jNQXAC9IVRw',
        'https://www.youtube.com/watch?v=ZZ5LpwO-An4'
      ]
      
      const { duration, result } = await measurePerformance(
        '3並行リクエスト',
        async () => {
          return await Promise.all(
            urls.map(url => 
              request(baseUrl)
                .post('/api/process-simple')
                .send({ url })
            )
          )
        }
      )
      
      expect(duration).toBeLessThan(10000) // 10秒以内
      result.forEach((response: any) => {
        expect(response.status).toBe(200)
      })
      
      const avgTime = duration / 3
      console.log(`平均処理時間: ${avgTime.toFixed(2)}ms/リクエスト`)
    })
    
    it('10並行リクエストの負荷テスト', async () => {
      const concurrentRequests = 10
      const testUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      
      const { duration, memoryDelta, result } = await measurePerformance(
        `${concurrentRequests}並行リクエスト`,
        async () => {
          const promises = Array(concurrentRequests).fill(null).map(() =>
            request(baseUrl)
              .post('/api/process-simple')
              .send({ url: testUrl })
          )
          return await Promise.allSettled(promises)
        }
      )
      
      const successCount = result.filter(
        (r: any) => r.status === 'fulfilled' && r.value.status === 200
      ).length
      
      expect(successCount).toBeGreaterThanOrEqual(concurrentRequests * 0.8) // 80%以上成功
      expect(duration).toBeLessThan(30000) // 30秒以内
      expect(memoryDelta.heapUsed).toBeLessThan(100) // メモリ増加100MB以内
      
      console.log(`
        成功率: ${(successCount / concurrentRequests * 100).toFixed(1)}%
        平均処理時間: ${(duration / concurrentRequests).toFixed(2)}ms/リクエスト
      `)
    })
  })
  
  describe('メモリ効率性', () => {
    it('連続処理でメモリリークしない', async () => {
      const iterations = 5
      const memorySnapshots = []
      
      for (let i = 0; i < iterations; i++) {
        const { duration, memoryDelta } = await measurePerformance(
          `反復処理 ${i + 1}/${iterations}`,
          async () => {
            return await request(baseUrl)
              .post('/api/process-simple')
              .send({ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' })
          }
        )
        
        memorySnapshots.push({
          iteration: i + 1,
          memory: process.memoryUsage().heapUsed / 1024 / 1024,
          duration
        })
      }
      
      // メモリ使用量の傾向分析
      const firstMemory = memorySnapshots[0].memory
      const lastMemory = memorySnapshots[iterations - 1].memory
      const memoryGrowth = ((lastMemory - firstMemory) / firstMemory * 100)
      
      console.log(`
        メモリ成長率: ${memoryGrowth.toFixed(1)}%
        初回: ${firstMemory.toFixed(2)}MB
        最終: ${lastMemory.toFixed(2)}MB
      `)
      
      expect(memoryGrowth).toBeLessThan(20) // 20%以内の増加
    })
  })
  
  describe('ストレステスト', () => {
    it('大きな動画URLでの処理性能', async () => {
      // 長時間動画のURL（実際のテストでは適切なURLに置き換える）
      const longVideoUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      
      const { duration, result } = await measurePerformance(
        '大容量動画処理',
        async () => {
          return await request(baseUrl)
            .post('/api/process-simple')
            .send({ url: longVideoUrl })
            .timeout(30000)
        }
      )
      
      expect(result.status).toBe(200)
      expect(duration).toBeLessThan(20000) // 20秒以内
      
      if (result.body.fileSize) {
        console.log(`処理済みファイルサイズ: ${(result.body.fileSize / 1024 / 1024).toFixed(2)}MB`)
        expect(result.body.fileSize).toBeLessThan(50 * 1024 * 1024) // 50MB制限
      }
    }, 30000)
  })
  
  describe('キャッシュ効率性', () => {
    it('同一URLの連続リクエストで性能向上', async () => {
      const testUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      const timings = []
      
      // 3回連続で同じURLをリクエスト
      for (let i = 0; i < 3; i++) {
        const { duration } = await measurePerformance(
          `キャッシュテスト ${i + 1}/3`,
          async () => {
            return await request(baseUrl)
              .post('/api/process-simple')
              .send({ url: testUrl })
              .expect(200)
          }
        )
        
        timings.push(duration)
      }
      
      // 2回目以降が高速化されているか
      console.log(`
        1回目: ${timings[0].toFixed(2)}ms
        2回目: ${timings[1].toFixed(2)}ms (${((timings[0] - timings[1]) / timings[0] * 100).toFixed(1)}%改善)
        3回目: ${timings[2].toFixed(2)}ms (${((timings[0] - timings[2]) / timings[0] * 100).toFixed(1)}%改善)
      `)
      
      // キャッシュによる改善を期待（必須ではない）
      if (timings[1] < timings[0] * 0.8) {
        console.log('✅ キャッシュが効果的に機能')
      }
    })
  })
  
  describe('総合パフォーマンス評価', () => {
    it('パフォーマンス総合レポート', async () => {
      const testScenarios = [
        { name: '最小負荷', url: 'https://youtu.be/dQw4w9WgXcQ' },
        { name: '標準負荷', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
        { name: '高負荷', url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw&list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf' }
      ]
      
      const results = []
      
      for (const scenario of testScenarios) {
        const { duration, memoryDelta } = await measurePerformance(
          scenario.name,
          async () => {
            return await request(baseUrl)
              .post('/api/process-simple')
              .send({ url: scenario.url })
          }
        )
        
        results.push({
          scenario: scenario.name,
          duration,
          memory: memoryDelta.heapUsed
        })
      }
      
      console.log('\n===== パフォーマンス総合評価 =====')
      results.forEach(r => {
        const grade = r.duration < 3000 ? 'A' : r.duration < 4000 ? 'B' : r.duration < 5000 ? 'C' : 'D'
        console.log(`${r.scenario}: ${r.duration.toFixed(0)}ms (評価: ${grade})`)
      })
      
      const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length
      console.log(`\n平均処理時間: ${avgDuration.toFixed(0)}ms`)
      console.log(`目標達成: ${avgDuration < 5000 ? '✅ 5秒以内' : '❌ 5秒超過'}`)
    })
  })
})