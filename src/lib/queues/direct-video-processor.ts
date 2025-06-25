/**
 * 直接処理版ビデオプロセッサー
 * Redis/BullMQを使用せず、直接処理を行う
 * Worker3: Railway003対応
 */

import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

export interface DirectProcessResult {
  success: boolean;
  videoId?: string;
  segments?: Array<{
    path: string;
    startTime: number;
    endTime: number;
  }>;
  error?: string;
  processingTime?: number;
}

/**
 * YouTube動画をダウンロードして分割（直接処理版）
 */
export async function processVideoDirect(youtubeUrl: string): Promise<DirectProcessResult> {
  const startTime = Date.now();
  const videoId = `video-${Date.now()}`;
  const outputDir = path.join('/tmp', videoId);
  
  try {
    // 出力ディレクトリ作成
    fs.mkdirSync(outputDir, { recursive: true });
    
    // 1. YouTube動画ダウンロード
    console.log('[Direct] Downloading video...');
    const videoPath = path.join(outputDir, 'video.mp4');
    
    try {
      // youtube-dl-execを使用
      execSync(`yt-dlp "${youtubeUrl}" -o "${videoPath}" --format "best[height<=480]/best" --quiet`, {
        timeout: 60000 // 60秒タイムアウト
      });
    } catch (dlError) {
      console.error('[Direct] Download failed, trying fallback...');
      // フォールバック: ytdl-coreは使わない（YouTube仕様変更で動作しない）
      throw new Error('Video download failed');
    }
    
    // ファイルが存在することを確認
    if (!fs.existsSync(videoPath)) {
      throw new Error('Downloaded video file not found');
    }
    
    const fileStats = fs.statSync(videoPath);
    console.log(`[Direct] Video downloaded: ${(fileStats.size / 1024 / 1024).toFixed(2)}MB`);
    
    // 2. 動画を固定時間で分割（0-10秒、10-20秒、20-30秒）
    console.log('[Direct] Splitting video...');
    const segments: DirectProcessResult['segments'] = [];
    
    // FFmpegパスを環境に応じて設定
    const ffmpegPath = process.env.RAILWAY_ENVIRONMENT ? 'ffmpeg' : '/usr/local/bin/ffmpeg';
    
    // 動画の長さを取得
    const durationCmd = `${ffmpegPath} -i "${videoPath}" 2>&1 | grep Duration | awk '{print $2}' | tr -d ,`;
    const durationStr = execSync(durationCmd).toString().trim();
    const [hours, minutes, seconds] = durationStr.split(':').map(parseFloat);
    const totalDuration = hours * 3600 + minutes * 60 + seconds;
    
    console.log(`[Direct] Video duration: ${totalDuration.toFixed(1)}s`);
    
    // 10秒ごとに分割（最大3セグメント）
    const segmentDuration = 10;
    const maxSegments = 3;
    const numSegments = Math.min(Math.ceil(totalDuration / segmentDuration), maxSegments);
    
    for (let i = 0; i < numSegments; i++) {
      const startTime = i * segmentDuration;
      const endTime = Math.min((i + 1) * segmentDuration, totalDuration);
      const segmentPath = path.join(outputDir, `segment-${i}.mp4`);
      
      // FFmpegで分割
      const splitCmd = `${ffmpegPath} -i "${videoPath}" -ss ${startTime} -t ${segmentDuration} -c copy "${segmentPath}" -y`;
      execSync(splitCmd, { stdio: 'pipe' });
      
      if (fs.existsSync(segmentPath)) {
        segments.push({
          path: segmentPath,
          startTime,
          endTime
        });
        console.log(`[Direct] Created segment ${i + 1}: ${startTime}s-${endTime}s`);
      }
    }
    
    const processingTime = Date.now() - startTime;
    console.log(`[Direct] Processing completed in ${processingTime}ms`);
    
    return {
      success: true,
      videoId,
      segments,
      processingTime
    };
    
  } catch (error) {
    console.error('[Direct] Processing failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      processingTime: Date.now() - startTime
    };
  }
}

/**
 * 処理結果をクリーンアップ
 */
export function cleanupDirectProcess(videoId: string): void {
  try {
    const outputDir = path.join('/tmp', videoId);
    if (fs.existsSync(outputDir)) {
      fs.rmSync(outputDir, { recursive: true, force: true });
      console.log(`[Direct] Cleaned up ${videoId}`);
    }
  } catch (error) {
    console.error('[Direct] Cleanup failed:', error);
  }
}