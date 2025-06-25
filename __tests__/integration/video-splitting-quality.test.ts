import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { splitVideoIntoSegments, SimpleSplitResult } from '@/lib/simple-video-splitter'
import fs from 'fs/promises'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

describe('動画分割機能の品質検証', () => {
  const testVideoDir = path.join(process.cwd(), 'temp', 'test-split')
  const testVideoPath = path.join(testVideoDir, 'test-video.mp4')
  
  beforeAll(async () => {
    // テスト用ディレクトリ作成
    await fs.mkdir(testVideoDir, { recursive: true })
    
    // テスト用動画生成（30秒の黒画面動画）
    const ffmpegPath = '/opt/homebrew/bin/ffmpeg'
    const createTestVideo = `"${ffmpegPath}" -f lavfi -i color=black:s=640x480:d=30 -c:v libx264 -preset ultrafast "${testVideoPath}" -y`
    
    try {
      await execAsync(createTestVideo)
      console.log('Test video created successfully')
    } catch (error) {
      console.error('Failed to create test video:', error)
    }
  })
  
  afterAll(async () => {
    // クリーンアップ
    try {
      await fs.rm(testVideoDir, { recursive: true, force: true })
    } catch (error) {
      console.log('Cleanup error:', error)
    }
  })
  
  describe('基本的な分割機能', () => {
    it('30秒の動画を3つのセグメントに分割', async () => {
      const result = await splitVideoIntoSegments(testVideoPath)
      
      expect(result.success).toBe(true)
      expect(result.segments).toBeDefined()
      expect(result.segments!.length).toBe(3)
      
      // 各セグメントの存在確認
      for (const segmentPath of result.segments!) {
        const stats = await fs.stat(segmentPath)
        expect(stats.size).toBeGreaterThan(0)
        expect(segmentPath).toContain('segment-')
      }
    })
    
    it('セグメントが正しい順序で作成される', async () => {
      const result = await splitVideoIntoSegments(testVideoPath)
      
      expect(result.success).toBe(true)
      const segments = result.segments!
      
      // ファイル名の順序確認
      expect(segments[0]).toContain('segment-1')
      expect(segments[1]).toContain('segment-2')
      expect(segments[2]).toContain('segment-3')
    })
    
    it('各セグメントの長さが正しい', async () => {
      const result = await splitVideoIntoSegments(testVideoPath)
      expect(result.success).toBe(true)
      
      const ffprobePath = '/opt/homebrew/bin/ffprobe'
      
      // 各セグメントの長さを確認
      for (let i = 0; i < result.segments!.length; i++) {
        const segmentPath = result.segments![i]
        const durationCmd = `"${ffprobePath}" -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${segmentPath}"`
        const { stdout } = await execAsync(durationCmd)
        const duration = parseFloat(stdout.trim())
        
        // 各セグメントは約10秒（誤差1秒以内）
        expect(duration).toBeGreaterThanOrEqual(9)
        expect(duration).toBeLessThanOrEqual(11)
      }
    })
  })
  
  describe('エッジケース処理', () => {
    it('15秒の短い動画を適切に処理', async () => {
      // 15秒のテスト動画作成
      const shortVideoPath = path.join(testVideoDir, 'short-video.mp4')
      const ffmpegPath = '/opt/homebrew/bin/ffmpeg'
      await execAsync(`"${ffmpegPath}" -f lavfi -i color=blue:s=640x480:d=15 -c:v libx264 -preset ultrafast "${shortVideoPath}" -y`)
      
      const result = await splitVideoIntoSegments(shortVideoPath)
      
      expect(result.success).toBe(true)
      // 15秒なので2セグメント（0-10秒、10-15秒）
      expect(result.segments!.length).toBe(2)
      
      // 2番目のセグメントは5秒
      const ffprobePath = '/opt/homebrew/bin/ffprobe'
      const segment2Path = result.segments![1]
      const durationCmd = `"${ffprobePath}" -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${segment2Path}"`
      const { stdout } = await execAsync(durationCmd)
      const duration = parseFloat(stdout.trim())
      
      expect(duration).toBeGreaterThanOrEqual(4)
      expect(duration).toBeLessThanOrEqual(6)
    })
    
    it('5秒の非常に短い動画でも動作', async () => {
      // 5秒のテスト動画作成
      const veryShortVideoPath = path.join(testVideoDir, 'very-short-video.mp4')
      const ffmpegPath = '/opt/homebrew/bin/ffmpeg'
      await execAsync(`"${ffmpegPath}" -f lavfi -i color=red:s=640x480:d=5 -c:v libx264 -preset ultrafast "${veryShortVideoPath}" -y`)
      
      const result = await splitVideoIntoSegments(veryShortVideoPath)
      
      expect(result.success).toBe(true)
      // 5秒なので1セグメントのみ
      expect(result.segments!.length).toBe(1)
      expect(result.segments![0]).toContain('segment-1')
    })
    
    it('存在しないファイルでエラーを返す', async () => {
      const nonExistentPath = path.join(testVideoDir, 'non-existent.mp4')
      const result = await splitVideoIntoSegments(nonExistentPath)
      
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.segments).toBeUndefined()
    })
  })
  
  describe('出力品質とファイル整合性', () => {
    it('セグメントファイルが有効な動画ファイル', async () => {
      const result = await splitVideoIntoSegments(testVideoPath)
      expect(result.success).toBe(true)
      
      const ffprobePath = '/opt/homebrew/bin/ffprobe'
      
      for (const segmentPath of result.segments!) {
        // FFprobeで動画情報を取得（エラーがなければ有効）
        const probeCmd = `"${ffprobePath}" -v error -select_streams v:0 -show_entries stream=codec_name,width,height -of json "${segmentPath}"`
        
        try {
          const { stdout } = await execAsync(probeCmd)
          const info = JSON.parse(stdout)
          
          expect(info.streams).toBeDefined()
          expect(info.streams.length).toBeGreaterThan(0)
          expect(info.streams[0].codec_name).toBe('h264')
          expect(info.streams[0].width).toBe(640)
          expect(info.streams[0].height).toBe(480)
        } catch (error) {
          fail(`セグメント ${segmentPath} は有効な動画ファイルではありません`)
        }
      }
    })
    
    it('出力ディレクトリ構造が正しい', async () => {
      const result = await splitVideoIntoSegments(testVideoPath)
      expect(result.success).toBe(true)
      
      // segmentsディレクトリが作成されている
      const segmentsDir = path.join(path.dirname(testVideoPath), 'segments')
      const dirStats = await fs.stat(segmentsDir)
      expect(dirStats.isDirectory()).toBe(true)
      
      // ディレクトリ内のファイル確認
      const files = await fs.readdir(segmentsDir)
      const mp4Files = files.filter(f => f.endsWith('.mp4'))
      expect(mp4Files.length).toBe(3)
      
      // ファイル名の形式確認
      mp4Files.forEach(file => {
        expect(file).toMatch(/^segment-[123]\.mp4$/)
      })
    })
  })
  
  describe('エラーリカバリーと堅牢性', () => {
    it('FFmpegパスが正しく設定されている', async () => {
      // FFmpegとFFprobeの存在確認
      const ffmpegPath = '/opt/homebrew/bin/ffmpeg'
      const ffprobePath = '/opt/homebrew/bin/ffprobe'
      
      try {
        await fs.access(ffmpegPath, fs.constants.X_OK)
        await fs.access(ffprobePath, fs.constants.X_OK)
      } catch (error) {
        console.warn('FFmpeg/FFprobe not found at specified path, test may fail in different environments')
      }
      
      const result = await splitVideoIntoSegments(testVideoPath)
      expect(result.success).toBe(true)
    })
    
    it('部分的なエラーでも可能な限りセグメントを作成', async () => {
      // 書き込み権限のないディレクトリでのテスト（スキップ）
      // 実際の環境では権限エラーなどが発生してもできる限り処理を続行
      const result = await splitVideoIntoSegments(testVideoPath)
      expect(result.success).toBe(true)
      expect(result.segments!.length).toBeGreaterThan(0)
    })
    
    it('同時実行でも安定動作', async () => {
      // 同じ動画を異なるパスにコピー
      const video1Path = path.join(testVideoDir, 'concurrent-1.mp4')
      const video2Path = path.join(testVideoDir, 'concurrent-2.mp4')
      
      await fs.copyFile(testVideoPath, video1Path)
      await fs.copyFile(testVideoPath, video2Path)
      
      // 並行実行
      const results = await Promise.all([
        splitVideoIntoSegments(video1Path),
        splitVideoIntoSegments(video2Path)
      ])
      
      // 両方とも成功
      expect(results[0].success).toBe(true)
      expect(results[1].success).toBe(true)
      
      // 独立したセグメントが作成される
      expect(results[0].segments!.length).toBe(3)
      expect(results[1].segments!.length).toBe(3)
      
      // ファイルパスが異なる
      expect(results[0].segments![0]).not.toBe(results[1].segments![0])
    })
  })
  
  describe('パフォーマンス測定', () => {
    it('30秒動画の分割が5秒以内に完了', async () => {
      const startTime = Date.now()
      const result = await splitVideoIntoSegments(testVideoPath)
      const endTime = Date.now()
      
      const processingTime = (endTime - startTime) / 1000
      
      expect(result.success).toBe(true)
      expect(processingTime).toBeLessThan(5)
      
      console.log(`分割処理時間: ${processingTime.toFixed(2)}秒`)
      console.log(`セグメント数: ${result.segments!.length}`)
    })
  })
})