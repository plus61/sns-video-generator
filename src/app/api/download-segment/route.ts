import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs/promises';
import path from 'path';

/**
 * 個別セグメントダウンロードAPI
 * Phase 4: シンプルなファイルダウンロード実装
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const segmentPath = searchParams.get('path');
    const format = searchParams.get('format') || 'file'; // file or base64
    
    if (!segmentPath) {
      return NextResponse.json(
        { error: 'Segment path is required' },
        { status: 400 }
      );
    }

    // セキュリティ: /tmpディレクトリのみ許可
    if (!segmentPath.startsWith('/tmp/')) {
      return NextResponse.json(
        { error: 'Invalid path' },
        { status: 403 }
      );
    }

    try {
      // ファイルの存在確認
      await fs.access(segmentPath);
      
      if (format === 'base64') {
        // Base64エンコードで返す（小さいファイル用）
        const fileBuffer = await fs.readFile(segmentPath);
        const base64Data = fileBuffer.toString('base64');
        
        return NextResponse.json({
          success: true,
          filename: path.basename(segmentPath),
          data: base64Data,
          mimeType: 'video/mp4'
        });
        
      } else {
        // 通常のファイルダウンロード
        const fileBuffer = await fs.readFile(segmentPath);
        const filename = path.basename(segmentPath);
        
        return new NextResponse(fileBuffer, {
          headers: {
            'Content-Type': 'video/mp4',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': fileBuffer.length.toString()
          }
        });
      }
      
    } catch (fileError) {
      console.error('File read error:', fileError);
      return NextResponse.json(
        { error: 'File not found or cannot be read' },
        { status: 404 }
      );
    }
    
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Download failed' },
      { status: 500 }
    );
  }
}

/**
 * 複数セグメントの情報取得
 */
export async function POST(request: NextRequest) {
  try {
    const { segments } = await request.json();
    
    if (!Array.isArray(segments)) {
      return NextResponse.json(
        { error: 'Segments array is required' },
        { status: 400 }
      );
    }

    const segmentInfo = await Promise.all(
      segments.map(async (segmentPath: string) => {
        try {
          // セキュリティチェック
          if (!segmentPath.startsWith('/tmp/')) {
            return {
              path: segmentPath,
              available: false,
              error: 'Invalid path'
            };
          }

          const stats = await fs.stat(segmentPath);
          return {
            path: segmentPath,
            available: true,
            size: stats.size,
            sizeFormatted: formatFileSize(stats.size),
            filename: path.basename(segmentPath),
            downloadUrl: `/api/download-segment?path=${encodeURIComponent(segmentPath)}`
          };
        } catch {
          return {
            path: segmentPath,
            available: false,
            error: 'File not found'
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      segments: segmentInfo,
      totalAvailable: segmentInfo.filter(s => s.available).length
    });
    
  } catch (error) {
    console.error('Segment info error:', error);
    return NextResponse.json(
      { error: 'Failed to get segment info' },
      { status: 500 }
    );
  }
}

// ファイルサイズのフォーマット
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  const kb = bytes / 1024;
  if (kb < 1024) return kb.toFixed(1) + ' KB';
  const mb = kb / 1024;
  return mb.toFixed(1) + ' MB';
}