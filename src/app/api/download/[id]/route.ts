import { NextRequest, NextResponse } from 'next/server';
import archiver from 'archiver';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

// ダウンロードAPI - Worker3実装
// GET /api/download/[id]

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log(`📥 Download request for session: ${params.id}`);

  try {
    const sessionId = params.id;
    
    // セッションIDの検証
    if (!sessionId || !/^[a-f0-9]{32}$/.test(sessionId)) {
      return NextResponse.json(
        { error: 'Invalid session ID' },
        { status: 400 }
      );
    }

    // 動画ファイルのパスを構築
    const videoDir = path.join('/tmp/video-processing', sessionId);
    
    // ディレクトリ存在確認
    if (!fs.existsSync(videoDir)) {
      return NextResponse.json(
        { error: 'Session not found or expired' },
        { status: 404 }
      );
    }

    // 動画ファイルを検索
    const videoFiles = fs.readdirSync(videoDir)
      .filter(file => file.endsWith('.mp4'))
      .map(filename => ({
        path: path.join(videoDir, filename),
        name: filename
      }));

    if (videoFiles.length === 0) {
      return NextResponse.json(
        { error: 'No videos found for this session' },
        { status: 404 }
      );
    }

    // ZIPアーカイブを作成
    const archive = archiver('zip', {
      zlib: { level: 6 } // バランスの取れた圧縮レベル
    });

    // ストリーミングレスポンスの準備
    const stream = new ReadableStream({
      start(controller) {
        archive.on('data', (chunk) => {
          controller.enqueue(chunk);
        });

        archive.on('end', () => {
          controller.close();
        });

        archive.on('error', (err) => {
          controller.error(err);
        });
      }
    });

    // ヘッダー設定
    const headers = new Headers({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="sns-videos-${sessionId.substring(0, 8)}.zip"`,
      'Cache-Control': 'no-cache',
    });

    // ファイルをアーカイブに追加
    videoFiles.forEach(file => {
      console.log(`📦 Adding to ZIP: ${file.name}`);
      archive.file(file.path, { name: file.name });
    });

    // メタデータも追加
    const metadata = {
      sessionId,
      timestamp: new Date().toISOString(),
      files: videoFiles.map(f => f.name),
      generator: 'SNS Video Generator'
    };
    
    archive.append(JSON.stringify(metadata, null, 2), { 
      name: 'metadata.json' 
    });

    // アーカイブを完成
    archive.finalize();

    // クリーンアップのスケジュール（5分後）
    setTimeout(() => {
      cleanupSession(sessionId);
    }, 5 * 60 * 1000);

    return new NextResponse(stream, { headers });

  } catch (error) {
    console.error('❌ Download error:', error);
    return NextResponse.json(
      { error: 'Failed to create download' },
      { status: 500 }
    );
  }
}

// クリーンアップ関数
async function cleanupSession(sessionId: string) {
  const dirs = [
    `/tmp/video-uploads/${sessionId}`,
    `/tmp/video-processing/${sessionId}`,
    `/tmp/video-downloads/${sessionId}`
  ];

  for (const dir of dirs) {
    try {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
        console.log(`🧹 Cleaned up: ${dir}`);
      }
    } catch (error) {
      console.error(`Failed to cleanup ${dir}:`, error);
    }
  }
}