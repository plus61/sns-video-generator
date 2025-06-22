// 最適化されたRedis接続設定 - シンプリシティ最優先
import { createClient } from 'redis'

export const getRedisClient = () => {
  const client = createClient({
    url: process.env.REDIS_URL,
    socket: { connectTimeout: 5000, reconnectStrategy: (times) => Math.min(times * 100, 3000) }
  })
  return client
}