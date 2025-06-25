import { NextRequest, NextResponse } from 'next/server'
import ffmpeg from 'fluent-ffmpeg'
import os from 'os'
import path from 'path'
import { promises as fs } from 'fs'

// FFmpegのパスを明示的に設定
ffmpeg.setFfmpegPath('/opt/homebrew/bin/ffmpeg')

// FFmpegの動作テスト用エンドポイント
export async function GET() {
  try {
    // FFmpegの存在確認
    const testComplete = await new Promise<boolean>((resolve) => {
      ffmpeg.getAvailableFormats((err, formats) => {
        if (err) {
          console.error('FFmpeg not available:', err)
          resolve(false)
        } else {
          console.log('FFmpeg is available. Formats count:', Object.keys(formats).length)
          resolve(true)
        }
      })
    })

    if (!testComplete) {
      return NextResponse.json({
        status: 'error',
        message: 'FFmpeg is not installed or not accessible',
        solution: 'Please install FFmpeg using: brew install ffmpeg (macOS) or apt-get install ffmpeg (Linux)'
      }, { status: 501 })
    }

    // テスト動画の作成（1秒の黒画面）
    const testVideoPath = path.join(os.tmpdir(), 'test-video.mp4')
    
    await new Promise<void>((resolve, reject) => {
      ffmpeg()
        .input('color=c=black:s=640x480:d=1')
        .inputOptions(['-f', 'lavfi'])
        .outputOptions(['-pix_fmt', 'yuv420p'])
        .output(testVideoPath)
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .run()
    })

    // ファイルサイズ確認
    const stats = await fs.stat(testVideoPath)
    
    // クリーンアップ
    await fs.unlink(testVideoPath)

    return NextResponse.json({
      status: 'success',
      message: 'FFmpeg is properly installed and working',
      test: {
        videoCreated: true,
        size: stats.size,
        ffmpegAvailable: true
      }
    })

  } catch (error) {
    console.error('FFmpeg test error:', error)
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'FFmpeg test failed',
      solution: 'Check FFmpeg installation and permissions'
    }, { status: 500 })
  }
}