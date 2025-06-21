// 最速実装チャレンジ！目標: 30秒以内
import { generateId } from './random-id';

test('ランダムIDを生成', () => {
  const id = generateId();
  expect(id).toMatch(/^[a-z0-9]{8}$/);
  expect(generateId()).not.toBe(id);
});