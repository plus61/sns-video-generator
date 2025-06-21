import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import * as fs from 'fs/promises';
import * as path from 'path';
import { 
  generateThumbnail, 
  generateMultipleThumbnails,
  ThumbnailResult,
  ThumbnailOptions 
} from './thumbnail-generator';

describe('動画サムネイル生成', () => {
  const testVideoPath = path.join(__dirname, '../../../tests/fixtures/sample-video.mp4');
  const tempDir = path.join(__dirname, '../../../tmp/thumbnails');

  beforeEach(async () => {
    // テスト用一時ディレクトリ作成
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    // クリーンアップ
    try {
      const files = await fs.readdir(tempDir);
      await Promise.all(
        files.map(file => fs.unlink(path.join(tempDir, file)))
      );
    } catch (error) {
      // ディレクトリが存在しない場合は無視
    }
  });

  describe('基本的なサムネイル生成', () => {
    test('動画の指定時間からサムネイルを生成する', async () => {
      const timestamp = 10; // 10秒地点
      
      const result = await generateThumbnail(testVideoPath, timestamp);
      
      expect(result.success).toBe(true);
      expect(result.thumbnailPath).toMatch(/\.(png|jpg|jpeg)$/);
      
      // ファイルが実際に存在することを確認
      if (result.thumbnailPath) {
        const exists = await fs.access(result.thumbnailPath)
          .then(() => true)
          .catch(() => false);
        expect(exists).toBe(true);
      }
    });

    test('デフォルトオプションでPNG形式で生成される', async () => {
      const result = await generateThumbnail(testVideoPath, 5);
      
      expect(result.success).toBe(true);
      expect(result.thumbnailPath).toMatch(/\.png$/);
      expect(result.metadata?.format).toBe('png');
    });

    test('動画の最初のフレーム（0秒）を取得できる', async () => {
      const result = await generateThumbnail(testVideoPath, 0);
      
      expect(result.success).toBe(true);
      expect(result.thumbnailPath).toBeDefined();
    });
  });

  describe('エラーハンドリング', () => {
    test('存在しない動画ファイルでエラーを返す', async () => {
      const result = await generateThumbnail('/not/exist.mp4', 10);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    test('負のタイムスタンプでエラーを返す', async () => {
      const result = await generateThumbnail(testVideoPath, -5);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid timestamp');
    });

    test('動画の長さを超えるタイムスタンプでも処理する', async () => {
      // FFmpegは動画の最後のフレームを返すはず
      const result = await generateThumbnail(testVideoPath, 99999);
      
      expect(result.success).toBe(true);
      expect(result.thumbnailPath).toBeDefined();
    });

    test('無効な動画ファイル形式でエラーを返す', async () => {
      const result = await generateThumbnail('/path/to/text.txt', 10);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid video format');
    });
  });

  describe('カスタムオプション', () => {
    test('カスタムサイズでサムネイルを生成する', async () => {
      const options: ThumbnailOptions = {
        width: 320,
        height: 180
      };
      
      const result = await generateThumbnail(testVideoPath, 10, options);
      
      expect(result.success).toBe(true);
      expect(result.metadata?.width).toBe(320);
      expect(result.metadata?.height).toBe(180);
    });

    test('JPEG形式で品質を指定して生成する', async () => {
      const options: ThumbnailOptions = {
        format: 'jpeg',
        quality: 85
      };
      
      const result = await generateThumbnail(testVideoPath, 15, options);
      
      expect(result.success).toBe(true);
      expect(result.thumbnailPath).toMatch(/\.jpe?g$/);
      expect(result.metadata?.format).toBe('jpeg');
    });

    test('アスペクト比を維持してリサイズする', async () => {
      const options: ThumbnailOptions = {
        width: 640,
        // heightを指定しない場合、アスペクト比を維持
      };
      
      const result = await generateThumbnail(testVideoPath, 20, options);
      
      expect(result.success).toBe(true);
      expect(result.metadata?.width).toBe(640);
      // 16:9の動画なら height は 360 になるはず
    });

    test('カスタム出力パスを指定できる', async () => {
      const customPath = path.join(tempDir, 'custom-thumbnail.png');
      const options: ThumbnailOptions = {
        outputPath: customPath
      };
      
      const result = await generateThumbnail(testVideoPath, 25, options);
      
      expect(result.success).toBe(true);
      expect(result.thumbnailPath).toBe(customPath);
    });
  });

  describe('複数サムネイル生成', () => {
    test('複数のタイムスタンプから一度にサムネイルを生成する', async () => {
      const timestamps = [
        { timestamp: 0 },     // 開始
        { timestamp: 30 },    // 30秒
        { timestamp: 60 }     // 1分
      ];
      
      const result = await generateMultipleThumbnails(testVideoPath, timestamps);
      
      expect(result.success).toBe(true);
      expect(result.thumbnails).toHaveLength(3);
      
      // 各サムネイルが成功していることを確認
      result.thumbnails.forEach(thumbnail => {
        expect(thumbnail.success).toBe(true);
        expect(thumbnail.thumbnailPath).toBeDefined();
      });
    });

    test('異なるオプションで複数のサムネイルを生成する', async () => {
      const requests = [
        { timestamp: 0, options: { width: 1920, height: 1080 } },
        { timestamp: 10, options: { width: 640, height: 360 } },
        { timestamp: 20, options: { width: 320, height: 180 } }
      ];
      
      const result = await generateMultipleThumbnails(testVideoPath, requests);
      
      expect(result.success).toBe(true);
      expect(result.thumbnails[0].metadata?.width).toBe(1920);
      expect(result.thumbnails[1].metadata?.width).toBe(640);
      expect(result.thumbnails[2].metadata?.width).toBe(320);
    });

    test('一部が失敗しても他のサムネイルは生成される', async () => {
      const timestamps = [
        { timestamp: 0 },      // 成功するはず
        { timestamp: -10 },    // 失敗するはず
        { timestamp: 30 }      // 成功するはず
      ];
      
      const result = await generateMultipleThumbnails(testVideoPath, timestamps);
      
      expect(result.success).toBe(true); // 部分的成功
      expect(result.thumbnails[0].success).toBe(true);
      expect(result.thumbnails[1].success).toBe(false);
      expect(result.thumbnails[2].success).toBe(true);
    });
  });

  describe('パフォーマンスとメモリ', () => {
    test('大量のサムネイル生成でもメモリリークしない', async () => {
      const timestamps = Array.from({ length: 10 }, (_, i) => ({
        timestamp: i * 5
      }));
      
      const startMemory = process.memoryUsage().heapUsed;
      const result = await generateMultipleThumbnails(testVideoPath, timestamps);
      const endMemory = process.memoryUsage().heapUsed;
      
      expect(result.success).toBe(true);
      expect(result.thumbnails).toHaveLength(10);
      
      // メモリ使用量が妥当な範囲内
      const memoryIncrease = endMemory - startMemory;
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // 100MB以下
    });

    test('並列処理で高速に生成される', async () => {
      const timestamps = Array.from({ length: 5 }, (_, i) => ({
        timestamp: i * 10
      }));
      
      const startTime = Date.now();
      const result = await generateMultipleThumbnails(testVideoPath, timestamps, {
        parallel: true
      });
      const duration = Date.now() - startTime;
      
      expect(result.success).toBe(true);
      expect(result.thumbnails).toHaveLength(5);
      
      // 5つのサムネイルが5秒以内に生成される
      expect(duration).toBeLessThan(5000);
    });
  });
});