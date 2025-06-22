# 【Worker3専用】ZIPダウンロード機能 - 詳細実装指示

## 🎯 タスク概要
分割された3つの動画クリップをZIPファイルにまとめてダウンロードする機能を実装

## 📋 実装手順

### 1. 必要なパッケージのインストール
```bash
npm install jszip
npm install --save-dev @types/jszip
```

### 2. ダウンロードAPIの実装
`src/app/api/download-segments/route.ts` を作成:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    // URLパラメータから動画IDを取得
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');
    
    if (!videoId) {
      return NextResponse.json({ error: 'Video ID required' }, { status: 400 });
    }

    // 分割済みクリップのパス（仮実装）
    const segmentsDir = path.join(process.cwd(), 'temp', 'segments', videoId);
    const clips = [
      { name: 'clip_1.mp4', path: path.join(segmentsDir, 'segment_0_10.mp4') },
      { name: 'clip_2.mp4', path: path.join(segmentsDir, 'segment_10_20.mp4') },
      { name: 'clip_3.mp4', path: path.join(segmentsDir, 'segment_20_30.mp4') }
    ];

    // ZIPファイル作成
    const zip = new JSZip();
    
    for (const clip of clips) {
      try {
        const fileBuffer = await readFile(clip.path);
        zip.file(clip.name, fileBuffer);
      } catch (error) {
        console.error(`Failed to read clip: ${clip.name}`, error);
        // ファイルが存在しない場合はスキップ
      }
    }

    // ZIP生成
    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });

    // レスポンス返却
    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="video_clips_${videoId}.zip"`,
      },
    });

  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Failed to create download' },
      { status: 500 }
    );
  }
}
```

### 3. フロントエンドのダウンロードボタン
`src/components/DownloadButton.tsx` を作成:

```typescript
'use client';

import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useState } from 'react';

interface DownloadButtonProps {
  videoId: string;
  disabled?: boolean;
}

export function DownloadButton({ videoId, disabled }: DownloadButtonProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await fetch(`/api/download-segments?videoId=${videoId}`);
      
      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `video_clips_${videoId}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      alert('ダウンロードに失敗しました');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Button
      onClick={handleDownload}
      disabled={disabled || downloading}
      className="flex items-center gap-2"
    >
      <Download className="h-4 w-4" />
      {downloading ? 'ダウンロード中...' : 'クリップをダウンロード'}
    </Button>
  );
}
```

### 4. テスト用のモックデータ作成
開発中は実際の動画分割が完了していない可能性があるため、テスト用のダミーファイル生成スクリプトも作成:

```typescript
// scripts/create-test-segments.ts
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

async function createTestSegments() {
  const videoId = 'test-video-001';
  const segmentsDir = path.join(process.cwd(), 'temp', 'segments', videoId);
  
  // ディレクトリ作成
  await mkdir(segmentsDir, { recursive: true });
  
  // ダミーファイル作成（実際はFFmpegで生成される）
  const dummyContent = Buffer.from('dummy video content');
  
  await writeFile(path.join(segmentsDir, 'segment_0_10.mp4'), dummyContent);
  await writeFile(path.join(segmentsDir, 'segment_10_20.mp4'), dummyContent);
  await writeFile(path.join(segmentsDir, 'segment_20_30.mp4'), dummyContent);
  
  console.log('Test segments created!');
}

createTestSegments();
```

## 🚀 実装の優先順位
1. JSZipのインストール
2. APIエンドポイント作成
3. ダウンロードボタンコンポーネント作成
4. 動作テスト

## ⏰ 目標完了時間
13:00までに実装完了し、Worker2の分割機能と統合テスト準備

頑張ってください！ 💪