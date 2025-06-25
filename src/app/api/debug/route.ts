import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function GET(request: NextRequest) {
  try {
    // 環境情報
    const envInfo = {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Not set',
      SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Not set',
      SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Not set',
      SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Not set',
    }

    // youtube-dl-exec確認
    let ytdlVersion = 'Not found'
    try {
      const { stdout } = await execAsync('yt-dlp --version')
      ytdlVersion = stdout.trim()
    } catch (error) {
      ytdlVersion = 'Error: ' + (error as Error).message
    }

    // FFmpeg確認
    let ffmpegVersion = 'Not found'
    try {
      const { stdout } = await execAsync('ffmpeg -version | head -n 1')
      ffmpegVersion = stdout.trim()
    } catch (error) {
      ffmpegVersion = 'Error: ' + (error as Error).message
    }

    // モジュール確認
    const modules = {
      'youtube-dl-exec': '❌ Not found',
      'ytdl-core': '❌ Not found',
      'fluent-ffmpeg': '❌ Not found',
      'openai': '❌ Not found',
    }

    try {
      require('youtube-dl-exec')
      modules['youtube-dl-exec'] = '✅ Available'
    } catch {}

    try {
      require('ytdl-core')
      modules['ytdl-core'] = '✅ Available'
    } catch {}

    try {
      require('fluent-ffmpeg')
      modules['fluent-ffmpeg'] = '✅ Available'
    } catch {}

    try {
      require('openai')
      modules['openai'] = '✅ Available'
    } catch {}

    return NextResponse.json({
      status: 'ok',
      environment: envInfo,
      tools: {
        'yt-dlp': ytdlVersion,
        'ffmpeg': ffmpegVersion,
      },
      modules,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: (error as Error).message
    }, { status: 500 })
  }
}