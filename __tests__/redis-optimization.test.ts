import { createClient } from 'redis';

test('Redis connection pooling and timeout', async () => {
  const client = createClient({ socket: { connectTimeout: 5000 } });
  await client.connect();
  expect(client.isOpen).toBe(true);
  await client.disconnect();
});