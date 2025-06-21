// 5分TDD実証実験 - 動画時間フォーマッター
// 開始: Red Phase (3分)

import { formatDuration } from './duration-formatter';

describe('動画時間フォーマッター', () => {
  test('秒を時:分:秒形式に変換', () => {
    expect(formatDuration(125)).toBe('2:05');
    expect(formatDuration(3661)).toBe('1:01:01');
  });

  test('0秒は0:00を返す', () => {
    expect(formatDuration(0)).toBe('0:00');
  });
});