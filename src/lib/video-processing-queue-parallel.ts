// 非同期キュー処理 - 5分TDD実装

interface VideoTask {
  id: string
  videoPath: string
  priority: number
  userId: string
  createdAt: Date
}

interface ProcessingResult {
  taskId: string
  success: boolean
  processingTime: number
  error?: string
}

interface ParallelQueueConfig {
  maxConcurrency: number
  chunkSize: number
  priorityLevels: number
}

export class ParallelVideoQueue {
  private config: ParallelQueueConfig
  private activeJobs: Map<string, Promise<ProcessingResult>> = new Map()

  constructor(config: ParallelQueueConfig = {
    maxConcurrency: 10,
    chunkSize: 5,
    priorityLevels: 3
  }) {
    this.config = config
  }

  async processMultipleVideos(videos: VideoTask[]): Promise<ProcessingResult[]> {
    // 優先度でソート
    const sortedVideos = videos.sort((a, b) => b.priority - a.priority)
    
    // チャンクに分割
    const chunks = this.chunkVideos(sortedVideos, this.config.chunkSize)
    
    // 各チャンクを並列処理
    const results: ProcessingResult[] = []
    
    for (const chunk of chunks) {
      const chunkResults = await Promise.all(
        chunk.map(video => this.processVideoWithLimit(video))
      )
      results.push(...chunkResults)
    }
    
    return results
  }

  private async processVideoWithLimit(task: VideoTask): Promise<ProcessingResult> {
    // 同時実行数制限チェック
    while (this.activeJobs.size >= this.config.maxConcurrency) {
      await this.waitForSlot()
    }
    
    const startTime = Date.now()
    const jobPromise = this.processVideo(task)
    
    this.activeJobs.set(task.id, jobPromise)
    
    try {
      const result = await jobPromise
      return {
        taskId: task.id,
        success: true,
        processingTime: Date.now() - startTime
      }
    } catch (error) {
      return {
        taskId: task.id,
        success: false,
        processingTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    } finally {
      this.activeJobs.delete(task.id)
    }
  }

  private async processVideo(task: VideoTask): Promise<void> {
    // 実際の動画処理（モック）
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // ここで実際の処理を呼び出す
    // - AI分析
    // - セグメント抽出
    // - エンコーディング
    // - サムネイル生成
  }

  private async waitForSlot(): Promise<void> {
    if (this.activeJobs.size === 0) return
    
    // 最初に完了するジョブを待つ
    await Promise.race(Array.from(this.activeJobs.values()))
  }

  private chunkVideos(videos: VideoTask[], chunkSize: number): VideoTask[][] {
    const chunks: VideoTask[][] = []
    
    for (let i = 0; i < videos.length; i += chunkSize) {
      chunks.push(videos.slice(i, i + chunkSize))
    }
    
    return chunks
  }

  // リアルタイム進捗モニタリング
  async processWithProgress(
    videos: VideoTask[],
    onProgress: (completed: number, total: number) => void
  ): Promise<ProcessingResult[]> {
    let completed = 0
    const total = videos.length
    
    const results = await Promise.all(
      videos.map(async (video) => {
        const result = await this.processVideoWithLimit(video)
        completed++
        onProgress(completed, total)
        return result
      })
    )
    
    return results
  }
}

// 簡単なテスト
export async function testParallelQueue() {
  const queue = new ParallelVideoQueue()
  
  const testTasks: VideoTask[] = Array.from({ length: 20 }, (_, i) => ({
    id: `task-${i}`,
    videoPath: `/test/video-${i}.mp4`,
    priority: Math.floor(Math.random() * 3),
    userId: 'test-user',
    createdAt: new Date()
  }))
  
  console.log('Processing 20 videos in parallel...')
  const results = await queue.processMultipleVideos(testTasks)
  
  const successful = results.filter(r => r.success).length
  console.log(`Completed: ${successful}/${results.length} successful`)
  
  return results
}