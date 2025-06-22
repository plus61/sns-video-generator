// シンプルQAテスト - 5分TDD実践
import { getRedisClient } from '../src/lib/redis-optimized'

test('Redis接続の品質保証', async () => {
  const client = getRedisClient()
  await client.connect()
  await client.ping() // 生存確認
  await client.disconnect()
})