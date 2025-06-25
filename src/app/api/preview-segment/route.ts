import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filePath = searchParams.get('path')
    
    if (!filePath) {
      return NextResponse.json({ error: 'Path is required' }, { status: 400 })
    }
    
    // セキュリティチェック - tempディレクトリ内のファイルのみ許可
    const normalizedPath = path.normalize(filePath)
    const tempDir = path.join(process.cwd(), 'temp')
    
    if (!normalizedPath.startsWith(tempDir)) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 403 })
    }
    
    // ファイル存在確認
    const stats = await fs.stat(normalizedPath)
    if (!stats.isFile()) {
      return NextResponse.json({ error: 'Not a file' }, { status: 400 })
    }
    
    // ファイル読み込み
    const file = await fs.readFile(normalizedPath)
    
    // ビデオファイルとして返す
    return new NextResponse(file, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': stats.size.toString(),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'no-cache'
      }
    })
    
  } catch (error) {
    console.error('Preview error:', error)
    return NextResponse.json(
      { error: 'File not found' },
      { status: 404 }
    )
  }
}