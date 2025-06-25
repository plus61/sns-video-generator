import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import * as fs from 'fs/promises';
import path from 'path';

/**
 * フォールバック実装 - 最もシンプルな動画処理API
 * キューなし、直接処理、エラー時は即座にフォールバック
 */
export async function POST(request: NextRequest) {
  console.log('🚀 Simple fallback video processor started');

  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json(
        { error: 'YouTube URL is required' },
        { status: 400 }
      );
    }

    // Step 1: Download video
    const videoPath = await downloadVideoFallback(url);
    console.log(`✅ Downloaded to: ${videoPath}`);

    // Step 2: Get video info
    const duration = await getVideoDuration(videoPath);
    console.log(`📏 Video duration: ${duration}s`);

    // Step 3: Split into segments
    const segments = await splitVideoSimple(videoPath, 30);
    console.log(`✂️ Created ${segments.length} segments`);

    // Cleanup original
    await fs.unlink(videoPath).catch(() => {});

    return NextResponse.json({
      success: true,
      segments: segments.map((seg, i) => ({
        id: `segment-${i}`,
        startTime: seg.startTime,
        endTime: seg.startTime + seg.duration,
        duration: seg.duration,
        path: seg.path
      })),
      totalDuration: duration
    });

  } catch (error) {
    console.error('❌ Processing failed:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// シンプルなダウンロード実装
async function downloadVideoFallback(url: string): Promise<string> {
  const outputPath = `/tmp/video-${Date.now()}.mp4`;
  
  return new Promise((resolve, reject) => {
    console.log(`📥 Downloading with yt-dlp: ${url}`);
    
    const ytdlp = spawn('yt-dlp', [
      url,
      '-o', outputPath,
      '--format', 'best[height<=480]/best',
      '--no-check-certificates'
    ]);

    let stderr = '';
    ytdlp.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    ytdlp.on('close', async (code) => {
      if (code === 0) {
        try {
          await fs.access(outputPath);
          resolve(outputPath);
        } catch {
          reject(new Error('Downloaded file not found'));
        }
      } else {
        reject(new Error(`yt-dlp failed: ${stderr}`));
      }
    });

    // 60秒タイムアウト
    setTimeout(() => {
      ytdlp.kill('SIGTERM');
      reject(new Error('Download timeout'));
    }, 60000);
  });
}

// 動画の長さを取得
async function getVideoDuration(videoPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const ffprobe = spawn('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      videoPath
    ]);

    let output = '';
    ffprobe.stdout.on('data', (data) => {
      output += data.toString();
    });

    ffprobe.on('close', (code) => {
      if (code === 0) {
        resolve(parseFloat(output));
      } else {
        // デフォルト値として120秒を返す
        console.warn('Could not get duration, using default 120s');
        resolve(120);
      }
    });
  });
}

// シンプルな分割処理
async function splitVideoSimple(
  videoPath: string, 
  segmentDuration: number
): Promise<Array<{path: string; startTime: number; duration: number}>> {
  const segments = [];
  const duration = await getVideoDuration(videoPath);
  const segmentCount = Math.ceil(duration / segmentDuration);

  for (let i = 0; i < segmentCount && i < 5; i++) { // 最大5セグメント
    const startTime = i * segmentDuration;
    const outputPath = `/tmp/segment-${Date.now()}-${i}.mp4`;

    await new Promise<void>((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', [
        '-i', videoPath,
        '-ss', startTime.toString(),
        '-t', segmentDuration.toString(),
        '-c', 'copy',
        '-y',
        outputPath
      ]);

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          segments.push({
            path: outputPath,
            startTime,
            duration: segmentDuration
          });
          resolve();
        } else {
          // エラーでも続行
          console.warn(`Segment ${i} failed, skipping`);
          resolve();
        }
      });

      // 30秒タイムアウト
      setTimeout(() => {
        ffmpeg.kill('SIGTERM');
        resolve();
      }, 30000);
    });
  }

  return segments;
}