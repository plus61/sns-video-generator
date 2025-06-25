import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import * as fs from 'fs/promises';
import path from 'path';

/**
 * 直接処理API - Redis/BullMQを使わない最シンプル実装
 * 社長指示: 「動く60%」を目指す
 */
export async function POST(request: NextRequest) {
  console.log('🎯 Direct process API - no queue, just action');

  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json({ error: 'URL required' }, { status: 400 });
    }

    // Step 1: Download
    console.log('📥 Step 1: Downloading video...');
    const videoPath = await downloadDirect(url);
    
    // Step 2: Get info
    console.log('📏 Step 2: Getting video info...');
    const duration = await getVideoDuration(videoPath);
    
    // Step 3: Split (固定時間: 0-10秒, 10-20秒, 20-30秒)
    console.log('✂️ Step 3: Splitting video...');
    const segments = await splitFixed(videoPath);
    
    // Cleanup
    await fs.unlink(videoPath).catch(() => {});
    
    return NextResponse.json({
      success: true,
      message: 'Video processed successfully',
      segments: segments.map((seg, i) => ({
        id: `seg-${i}`,
        startTime: seg.start,
        endTime: seg.end,
        path: seg.path,
        duration: seg.end - seg.start
      })),
      totalDuration: duration
    });

  } catch (error) {
    console.error('❌ Direct process failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Process failed'
    }, { status: 500 });
  }
}

// シンプルなダウンロード
function downloadDirect(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const output = `/tmp/video-${Date.now()}.mp4`;
    
    const ytdlp = spawn('yt-dlp', [
      url,
      '-o', output,
      '--format', 'best[height<=480]/best',
      '--quiet'
    ]);
    
    ytdlp.on('close', (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error('Download failed'));
      }
    });
    
    // 60秒タイムアウト
    setTimeout(() => {
      ytdlp.kill();
      reject(new Error('Timeout'));
    }, 60000);
  });
}

// 動画の長さ取得
function getVideoDuration(videoPath: string): Promise<number> {
  return new Promise((resolve) => {
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
    
    ffprobe.on('close', () => {
      const duration = parseFloat(output) || 30;
      resolve(duration);
    });
  });
}

// 固定時間での分割（0-10秒、10-20秒、20-30秒）
async function splitFixed(videoPath: string): Promise<Array<{start: number, end: number, path: string}>> {
  const segments = [];
  const times = [[0, 10], [10, 20], [20, 30]];
  
  for (const [start, end] of times) {
    const output = `/tmp/seg-${Date.now()}-${start}-${end}.mp4`;
    
    const success = await new Promise<boolean>((resolve) => {
      const ffmpeg = spawn('ffmpeg', [
        '-i', videoPath,
        '-ss', start.toString(),
        '-to', end.toString(),
        '-c', 'copy',
        '-y',
        output
      ]);
      
      ffmpeg.on('close', (code) => {
        resolve(code === 0);
      });
      
      // 20秒タイムアウト
      setTimeout(() => {
        ffmpeg.kill();
        resolve(false);
      }, 20000);
    });
    
    if (success) {
      segments.push({ start, end, path: output });
    }
  }
  
  return segments;
}