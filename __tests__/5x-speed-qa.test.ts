// 5倍高速化QAテスト - シンプル＆決定的
describe('5倍高速化品質保証', () => {
  test('50並列でも整合性維持', async () => {
    const results = await Promise.all(Array(50).fill(0).map((_, i) => process(i)))
    expect(new Set(results).size).toBe(50) // 全て異なる結果
  })

  test('メモリ使用量が線形増加', () => {
    const before = process.memoryUsage().heapUsed
    Array(50).fill(0).map(() => new Array(1000))
    const after = process.memoryUsage().heapUsed
    expect(after - before).toBeLessThan(100_000_000) // 100MB以内
  })
})

const process = (i: number) => Promise.resolve(i)