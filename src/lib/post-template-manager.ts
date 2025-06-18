import { PostTemplate, SocialPlatform, PostContent } from '@/types/social-platform'
import { supabaseAdmin } from './supabase'

export interface TemplateVariable {
  name: string
  description: string
  type: 'text' | 'number' | 'date' | 'hashtag' | 'mention'
  defaultValue?: string
  required: boolean
}

export interface TemplateCategory {
  id: string
  name: string
  description: string
  icon: string
  templates: PostTemplate[]
}

export interface HashtagSet {
  id: string
  name: string
  description: string
  tags: string[]
  platforms: SocialPlatform[]
  category: string
  usageCount: number
  engagementScore?: number
}

export class PostTemplateManager {
  private static instance: PostTemplateManager

  public static getInstance(): PostTemplateManager {
    if (!PostTemplateManager.instance) {
      PostTemplateManager.instance = new PostTemplateManager()
    }
    return PostTemplateManager.instance
  }

  /**
   * テンプレート作成
   */
  async createTemplate(
    userId: string,
    template: Omit<PostTemplate, 'id' | 'userId' | 'usageCount' | 'createdAt' | 'updatedAt'>
  ): Promise<PostTemplate> {
    const { data, error } = await supabaseAdmin
      .from('post_templates')
      .insert({
        user_id: userId,
        name: template.name,
        description: template.description,
        platforms: template.platforms,
        caption_template: template.captionTemplate,
        hashtag_sets: template.hashtagSets,
        default_settings: template.defaultSettings,
        is_default: template.isDefault,
        usage_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create template: ${error.message}`)
    }

    return this.mapDbTemplateToTemplate(data)
  }

  /**
   * ユーザーのテンプレート一覧取得
   */
  async getUserTemplates(
    userId: string,
    platforms?: SocialPlatform[]
  ): Promise<PostTemplate[]> {
    let query = supabaseAdmin
      .from('post_templates')
      .select('*')
      .eq('user_id', userId)
      .order('usage_count', { ascending: false })

    if (platforms && platforms.length > 0) {
      query = query.overlaps('platforms', platforms)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to get templates: ${error.message}`)
    }

    return data.map(this.mapDbTemplateToTemplate)
  }

  /**
   * デフォルトテンプレート取得
   */
  async getDefaultTemplates(
    platforms?: SocialPlatform[]
  ): Promise<PostTemplate[]> {
    const defaultTemplates = this.getBuiltInTemplates()
    
    if (platforms && platforms.length > 0) {
      return defaultTemplates.filter(template =>
        template.platforms.some(p => platforms.includes(p))
      )
    }

    return defaultTemplates
  }

  /**
   * テンプレートからコンテンツ生成
   */
  async generateContentFromTemplate(
    templateId: string,
    variables: Record<string, string>,
    segmentData?: {
      title: string
      description: string
      keywords: string[]
      duration: number
    }
  ): Promise<PostContent> {
    const template = await this.getTemplateById(templateId)
    if (!template) {
      throw new Error('Template not found')
    }

    // テンプレート変数を置換
    let caption = template.captionTemplate

    // セグメントデータからの自動変数
    if (segmentData) {
      variables.title = variables.title || segmentData.title
      variables.description = variables.description || segmentData.description
      variables.duration = variables.duration || `${segmentData.duration}秒`
      variables.keywords = variables.keywords || segmentData.keywords.join(', ')
    }

    // システム変数
    variables.date = variables.date || new Date().toLocaleDateString('ja-JP')
    variables.time = variables.time || new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
    variables.dayOfWeek = variables.dayOfWeek || this.getDayOfWeek()

    // 変数置換
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
      caption = caption.replace(regex, value)
    })

    // ハッシュタグ組み立て
    const hashtags: string[] = []
    for (const hashtagSet of template.hashtagSets) {
      hashtags.push(...hashtagSet.tags)
    }

    // セグメントキーワードからハッシュタグ生成
    if (segmentData?.keywords) {
      const keywordHashtags = segmentData.keywords
        .map(keyword => keyword.replace(/\s+/g, '').toLowerCase())
        .filter(tag => tag.length > 0)
        .map(tag => tag.startsWith('#') ? tag : `#${tag}`)
      hashtags.push(...keywordHashtags)
    }

    // 重複削除
    const uniqueHashtags = [...new Set(hashtags)]

    // プラットフォーム別ハッシュタグ制限適用
    const limitedHashtags = this.limitHashtagsForPlatforms(
      uniqueHashtags,
      template.platforms
    )

    // テンプレート使用回数更新
    await this.incrementTemplateUsage(templateId)

    return {
      videoPath: '', // 実際の動画パスは呼び出し元で設定
      caption: caption.trim(),
      hashtags: limitedHashtags,
      mentions: [],
      privacy: template.defaultSettings.privacy,
      allowComments: template.defaultSettings.allowComments,
      allowDuet: template.defaultSettings.allowDuet,
      allowStitch: template.defaultSettings.allowStitch
    }
  }

  /**
   * ハッシュタグセット管理
   */
  async createHashtagSet(
    userId: string,
    hashtagSet: Omit<HashtagSet, 'id' | 'usageCount'>
  ): Promise<HashtagSet> {
    const { data, error } = await supabaseAdmin
      .from('hashtag_sets')
      .insert({
        user_id: userId,
        name: hashtagSet.name,
        description: hashtagSet.description,
        tags: hashtagSet.tags,
        platforms: hashtagSet.platforms,
        category: hashtagSet.category,
        usage_count: 0,
        engagement_score: hashtagSet.engagementScore,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create hashtag set: ${error.message}`)
    }

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      tags: data.tags,
      platforms: data.platforms,
      category: data.category,
      usageCount: data.usage_count,
      engagementScore: data.engagement_score
    }
  }

  /**
   * ハッシュタグセット一覧取得
   */
  async getHashtagSets(
    userId: string,
    category?: string,
    platforms?: SocialPlatform[]
  ): Promise<HashtagSet[]> {
    let query = supabaseAdmin
      .from('hashtag_sets')
      .select('*')
      .eq('user_id', userId)
      .order('usage_count', { ascending: false })

    if (category) {
      query = query.eq('category', category)
    }

    if (platforms && platforms.length > 0) {
      query = query.overlaps('platforms', platforms)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to get hashtag sets: ${error.message}`)
    }

    return data.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description,
      tags: item.tags,
      platforms: item.platforms,
      category: item.category,
      usageCount: item.usage_count,
      engagementScore: item.engagement_score
    }))
  }

  /**
   * トレンドハッシュタグ取得
   */
  async getTrendingHashtags(
    platforms: SocialPlatform[],
    category?: string,
    limit: number = 20
  ): Promise<Array<{
    tag: string
    platform: SocialPlatform
    trendScore: number
    volume: number
    category: string
  }>> {
    // プラットフォーム別のトレンドハッシュタグ（実際にはAPIから取得）
    const mockTrendingHashtags = {
      tiktok: [
        { tag: 'fyp', trendScore: 9.8, volume: 1000000, category: 'general' },
        { tag: 'viral', trendScore: 9.5, volume: 800000, category: 'general' },
        { tag: 'trending', trendScore: 9.2, volume: 600000, category: 'general' },
        { tag: '教育', trendScore: 8.8, volume: 400000, category: 'education' },
        { tag: 'ビジネス', trendScore: 8.5, volume: 300000, category: 'business' }
      ],
      instagram: [
        { tag: 'reels', trendScore: 9.6, volume: 900000, category: 'general' },
        { tag: 'instagood', trendScore: 9.3, volume: 700000, category: 'general' },
        { tag: 'love', trendScore: 9.0, volume: 500000, category: 'lifestyle' },
        { tag: 'ビジネス', trendScore: 8.7, volume: 350000, category: 'business' },
        { tag: '起業', trendScore: 8.4, volume: 250000, category: 'business' }
      ],
      youtube: [
        { tag: 'shorts', trendScore: 9.7, volume: 1200000, category: 'general' },
        { tag: 'tutorial', trendScore: 9.1, volume: 600000, category: 'education' },
        { tag: 'howto', trendScore: 8.9, volume: 500000, category: 'education' },
        { tag: 'ビジネス', trendScore: 8.6, volume: 320000, category: 'business' },
        { tag: '解説', trendScore: 8.3, volume: 280000, category: 'education' }
      ],
      twitter: [
        { tag: 'breaking', trendScore: 9.4, volume: 750000, category: 'news' },
        { tag: 'tech', trendScore: 9.0, volume: 550000, category: 'technology' },
        { tag: 'business', trendScore: 8.8, volume: 450000, category: 'business' },
        { tag: 'startup', trendScore: 8.5, volume: 350000, category: 'business' },
        { tag: 'innovation', trendScore: 8.2, volume: 300000, category: 'technology' }
      ]
    }

    const trending: Array<{
      tag: string
      platform: SocialPlatform
      trendScore: number
      volume: number
      category: string
    }> = []

    for (const platform of platforms) {
      const platformTrends = mockTrendingHashtags[platform] || []
      for (const trend of platformTrends) {
        if (!category || trend.category === category) {
          trending.push({
            ...trend,
            platform
          })
        }
      }
    }

    return trending
      .sort((a, b) => b.trendScore - a.trendScore)
      .slice(0, limit)
  }

  /**
   * テンプレートカテゴリ取得
   */
  getTemplateCategories(): TemplateCategory[] {
    return [
      {
        id: 'business',
        name: 'ビジネス',
        description: 'ビジネス・起業・マーケティング関連',
        icon: '💼',
        templates: []
      },
      {
        id: 'education',
        name: '教育・解説',
        description: '教育コンテンツ・チュートリアル・解説動画',
        icon: '📚',
        templates: []
      },
      {
        id: 'entertainment',
        name: 'エンターテイメント',
        description: '娯楽・面白い・バラエティ系',
        icon: '🎭',
        templates: []
      },
      {
        id: 'lifestyle',
        name: 'ライフスタイル',
        description: '日常・ライフハック・健康・美容',
        icon: '✨',
        templates: []
      },
      {
        id: 'tech',
        name: 'テクノロジー',
        description: 'IT・プログラミング・ガジェット',
        icon: '💻',
        templates: []
      },
      {
        id: 'creative',
        name: 'クリエイティブ',
        description: 'アート・デザイン・音楽・制作',
        icon: '🎨',
        templates: []
      }
    ]
  }

  /**
   * プライベートメソッド
   */
  private async getTemplateById(templateId: string): Promise<PostTemplate | null> {
    const { data, error } = await supabaseAdmin
      .from('post_templates')
      .select('*')
      .eq('id', templateId)
      .single()

    if (error) {
      return null
    }

    return this.mapDbTemplateToTemplate(data)
  }

  private async incrementTemplateUsage(templateId: string): Promise<void> {
    await supabaseAdmin
      .from('post_templates')
      .update({
        usage_count: supabaseAdmin.raw('usage_count + 1'),
        updated_at: new Date().toISOString()
      })
      .eq('id', templateId)
  }

  private limitHashtagsForPlatforms(
    hashtags: string[],
    platforms: SocialPlatform[]
  ): string[] {
    // プラットフォーム別ハッシュタグ制限
    const limits = {
      tiktok: 20,
      instagram: 30,
      youtube: 15,
      twitter: 10
    }

    const minLimit = Math.min(...platforms.map(p => limits[p] || 10))
    return hashtags.slice(0, minLimit)
  }

  private getDayOfWeek(): string {
    const days = ['日', '月', '火', '水', '木', '金', '土']
    return days[new Date().getDay()]
  }

  private mapDbTemplateToTemplate(data: any): PostTemplate {
    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      description: data.description,
      platforms: data.platforms,
      captionTemplate: data.caption_template,
      hashtagSets: data.hashtag_sets,
      defaultSettings: data.default_settings,
      isDefault: data.is_default,
      usageCount: data.usage_count,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    }
  }

  /**
   * ビルトインテンプレート
   */
  private getBuiltInTemplates(): PostTemplate[] {
    return [
      {
        id: 'builtin-business-1',
        userId: 'system',
        name: 'ビジネス基本テンプレート',
        description: 'ビジネス系コンテンツの基本テンプレート',
        platforms: ['tiktok', 'instagram', 'youtube'],
        captionTemplate: '{{title}}\n\n{{description}}\n\n今日のポイント：\n・{{point1}}\n・{{point2}}\n・{{point3}}\n\nあなたはどう思いますか？\nコメントで教えてください！',
        hashtagSets: [
          {
            name: 'ビジネス基本',
            tags: ['ビジネス', '起業', 'マーケティング', '経営', '成功', 'ビジネスマン', '仕事']
          }
        ],
        defaultSettings: {
          privacy: 'public',
          allowComments: true,
          allowDuet: true,
          allowStitch: true
        },
        isDefault: true,
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'builtin-education-1',
        userId: 'system',
        name: '教育・解説テンプレート',
        description: '教育系コンテンツの解説テンプレート',
        platforms: ['youtube', 'tiktok', 'instagram'],
        captionTemplate: '【{{category}}】{{title}}\n\n今回のテーマ：{{theme}}\n\n✅ ポイント：\n{{description}}\n\n💡 活用方法：\n{{application}}\n\n#{{duration}}で学べる #わかりやすい解説',
        hashtagSets: [
          {
            name: '教育基本',
            tags: ['教育', '学習', '解説', 'わかりやすい', 'tutorial', 'howto', '勉強']
          }
        ],
        defaultSettings: {
          privacy: 'public',
          allowComments: true,
          allowDuet: false,
          allowStitch: true
        },
        isDefault: true,
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
  }
}