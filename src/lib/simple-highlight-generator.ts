// 簡易ハイライト生成機能（実用的な実装）

import { SimpleSegment } from './simple-ai-analyzer'

export interface HighlightClip {
  id: string
  title: string
  description: string
  startTime: number
  endTime: number
  duration: number
  thumbnailSuggestions: ThumbnailSuggestion[]
  tags: string[]
  platform: 'youtube' | 'tiktok' | 'instagram' | 'general'
}

export interface ThumbnailSuggestion {
  timestamp: number
  reason: string
  score: number
}

export class SimpleHighlightGenerator {
  // トップ3セグメントから魅力的なハイライトを生成
  generateHighlights(segments: SimpleSegment[]): HighlightClip[] {
    const highlights: HighlightClip[] = []
    
    // 既にスコア順になっているトップセグメント
    const topSegments = segments
      .filter(s => s.type === 'highlight')
      .slice(0, 3)
    
    topSegments.forEach((segment, index) => {
      highlights.push({
        id: `highlight-${index}`,
        title: this.generateCatchyTitle(segment),
        description: this.generateDescription(segment),
        startTime: segment.startTime,
        endTime: segment.endTime,
        duration: segment.endTime - segment.startTime,
        thumbnailSuggestions: this.suggestThumbnails(segment),
        tags: this.generateTags(segment),
        platform: this.suggestPlatform(segment)
      })
    })
    
    return highlights
  }

  // キャッチーなタイトル生成
  private generateCatchyTitle(segment: SimpleSegment): string {
    const text = segment.text
    
    // パターンベースのタイトル生成
    const patterns = [
      { regex: /(\d+)[つ個]/, format: (match: string) => `${match}のポイント` },
      { regex: /知って(い)?ますか/, format: () => '知らなきゃ損！' },
      { regex: /実は/, format: () => '衝撃の事実！' },
      { regex: /方法/, format: () => '簡単にできる方法' },
      { regex: /なぜ/, format: () => 'その理由とは？' }
    ]
    
    for (const pattern of patterns) {
      const match = text.match(pattern.regex)
      if (match) {
        return pattern.format(match[0])
      }
    }
    
    // デフォルトタイトル
    if (segment.score >= 8) {
      return '必見！重要ポイント'
    } else if (segment.score >= 6) {
      return '注目の瞬間'
    }
    
    return segment.title || '興味深い内容'
  }

  // 説明文生成
  private generateDescription(segment: SimpleSegment): string {
    const text = segment.text
    
    // 重要な部分を抽出
    const importantParts = text
      .split(/[。！？]/)
      .filter(part => part.length > 10)
      .slice(0, 2)
      .join('。')
    
    if (importantParts.length > 0) {
      return importantParts + '...'
    }
    
    // テキストが短い場合はそのまま使用
    if (text.length <= 100) {
      return text
    }
    
    // 長い場合は最初の100文字
    return text.substring(0, 97) + '...'
  }

  // サムネイル候補の提案
  private suggestThumbnails(segment: SimpleSegment): ThumbnailSuggestion[] {
    const suggestions: ThumbnailSuggestion[] = []
    const duration = segment.endTime - segment.startTime
    
    // 1. 開始から3秒後（話し始め）
    suggestions.push({
      timestamp: segment.startTime + 3,
      reason: '話し始めの表情',
      score: 7
    })
    
    // 2. 中間地点（最も内容が充実）
    suggestions.push({
      timestamp: segment.startTime + duration / 2,
      reason: 'メインコンテンツ',
      score: 9
    })
    
    // 3. 終了3秒前（まとめ部分）
    if (duration > 10) {
      suggestions.push({
        timestamp: segment.endTime - 3,
        reason: 'まとめの表情',
        score: 6
      })
    }
    
    // 4. 感情的な瞬間を推測
    if (segment.text.includes('！') || segment.text.includes('驚')) {
      suggestions.push({
        timestamp: segment.startTime + duration * 0.3,
        reason: '驚きの瞬間',
        score: 10
      })
    }
    
    // スコア順にソート
    return suggestions.sort((a, b) => b.score - a.score)
  }

  // ハッシュタグ生成
  private generateTags(segment: SimpleSegment): string[] {
    const tags: string[] = []
    const text = segment.text.toLowerCase()
    
    // コンテンツタイプに基づくタグ
    if (text.includes('方法') || text.includes('やり方')) {
      tags.push('#ハウツー', '#tutorial')
    }
    
    if (text.includes('簡単') || text.includes('easy')) {
      tags.push('#簡単', '#初心者向け')
    }
    
    if (text.includes('裏技') || text.includes('コツ')) {
      tags.push('#裏技', '#tips')
    }
    
    if (text.includes('驚') || text.includes('すごい')) {
      tags.push('#驚き', '#amazing')
    }
    
    // 一般的なタグを追加
    tags.push('#shorts', '#動画', '#おすすめ')
    
    // 重複を削除して最大5個まで
    return [...new Set(tags)].slice(0, 5)
  }

  // プラットフォーム提案
  private suggestPlatform(segment: SimpleSegment): 'youtube' | 'tiktok' | 'instagram' | 'general' {
    const duration = segment.endTime - segment.startTime
    
    // 短い動画はTikTok向き
    if (duration <= 60) {
      return 'tiktok'
    }
    
    // 90秒以内はInstagram Reels
    if (duration <= 90) {
      return 'instagram'
    }
    
    // それ以上はYouTube Shorts
    if (duration <= 180) {
      return 'youtube'
    }
    
    // 長い動画は汎用
    return 'general'
  }

  // バッチ処理（複数セグメントを一度に処理）
  batchGenerateHighlights(allSegments: SimpleSegment[]): {
    highlights: HighlightClip[]
    summary: {
      totalClips: number
      totalDuration: number
      platforms: Record<string, number>
      topTags: string[]
    }
  } {
    const highlights = this.generateHighlights(allSegments)
    
    // サマリー情報を計算
    const totalDuration = highlights.reduce((sum, h) => sum + h.duration, 0)
    const platforms = highlights.reduce((acc, h) => {
      acc[h.platform] = (acc[h.platform] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const allTags = highlights.flatMap(h => h.tags)
    const tagCounts = allTags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const topTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([tag]) => tag)
    
    return {
      highlights,
      summary: {
        totalClips: highlights.length,
        totalDuration,
        platforms,
        topTags
      }
    }
  }
}

// エクスポート用ヘルパー
export function generateSimpleHighlights(segments: SimpleSegment[]): HighlightClip[] {
  const generator = new SimpleHighlightGenerator()
  return generator.generateHighlights(segments)
}

// デモ関数
export function demoHighlightGeneration() {
  console.log('✨ ハイライト生成デモ')
  
  const mockSegments: SimpleSegment[] = [
    {
      id: 'seg-1',
      startTime: 0,
      endTime: 45,
      text: '実は驚きの事実があります！これを知らないと損をするかもしれません。',
      score: 9,
      type: 'highlight',
      title: '驚きの事実'
    },
    {
      id: 'seg-2',
      startTime: 60,
      endTime: 90,
      text: '簡単にできる3つの方法をご紹介します。',
      score: 8,
      type: 'highlight',
      title: '3つの方法'
    }
  ]
  
  const generator = new SimpleHighlightGenerator()
  const result = generator.batchGenerateHighlights(mockSegments)
  
  console.log('生成されたハイライト:')
  result.highlights.forEach(h => {
    console.log(`- ${h.title} (${h.duration}秒) → ${h.platform}`)
    console.log(`  タグ: ${h.tags.join(', ')}`)
    console.log(`  サムネイル候補: ${h.thumbnailSuggestions.length}個`)
  })
  
  console.log('\nサマリー:', result.summary)
  
  return result
}