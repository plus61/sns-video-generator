import { generateThumbnail } from '../thumbnail-generator';

describe('動画サムネイル生成 - TDD実証', () => {
  // Red Phase: 最初の失敗するテスト
  test('動画の10秒地点からサムネイルを生成する', async () => {
    // Arrange
    const videoPath = '/test/sample.mp4';
    const timestamp = 10; // 10秒地点
    
    // Act
    const result = await generateThumbnail(videoPath, timestamp);
    
    // Assert
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.thumbnailPath).toMatch(/\.(png|jpg|jpeg)$/);
  });

  // Green Phase: エラーハンドリングのテストを追加
  test('存在しない動画ファイルの場合はエラーを返す', async () => {
    // Arrange
    const videoPath = '/not/exist/video.mp4';
    const timestamp = 10;
    
    // Act
    const result = await generateThumbnail(videoPath, timestamp);
    
    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error).toContain('not found');
  });

  // Worker3との協力ポイント
  test('負のタイムスタンプの場合はエラーを返す', async () => {
    // Arrange
    const videoPath = '/test/sample.mp4';
    const timestamp = -5; // 無効な値
    
    // Act
    const result = await generateThumbnail(videoPath, timestamp);
    
    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid timestamp');
  });
});

// Worker3へ: これらの新しいテストは失敗します。実装を改善しましょう！