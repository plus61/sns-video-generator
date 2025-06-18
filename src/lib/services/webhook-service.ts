import crypto from 'crypto'

interface WebhookPayload {
  event: string
  timestamp: string
  [key: string]: any
}

interface WebhookOptions {
  secret?: string
  timeout?: number
  retryAttempts?: number
  retryDelay?: number
  userAgent?: string
}

interface WebhookDeliveryAttempt {
  attempt: number
  timestamp: string
  success: boolean
  statusCode?: number
  error?: string
  responseTime: number
}

interface WebhookDelivery {
  id: string
  url: string
  payload: WebhookPayload
  attempts: WebhookDeliveryAttempt[]
  success: boolean
  createdAt: string
  completedAt?: string
}

export class WebhookService {
  private defaultOptions: WebhookOptions = {
    secret: process.env.WEBHOOK_SECRET,
    timeout: parseInt(process.env.WEBHOOK_TIMEOUT || '30000'),
    retryAttempts: parseInt(process.env.WEBHOOK_RETRY_ATTEMPTS || '3'),
    retryDelay: 5000,
    userAgent: 'SNS-Video-Generator-Webhook/1.0'
  }

  /**
   * Send webhook with retry mechanism and signature verification
   */
  async sendWebhook(
    url: string,
    payload: WebhookPayload,
    options: Partial<WebhookOptions> = {}
  ): Promise<WebhookDelivery> {
    const config = { ...this.defaultOptions, ...options }
    const deliveryId = crypto.randomUUID()
    
    const delivery: WebhookDelivery = {
      id: deliveryId,
      url,
      payload,
      attempts: [],
      success: false,
      createdAt: new Date().toISOString()
    }

    console.log(`🔗 Sending webhook ${deliveryId} to ${url}`)

    for (let attempt = 1; attempt <= config.retryAttempts!; attempt++) {
      const attemptStart = Date.now()
      
      try {
        const response = await this.makeWebhookRequest(url, payload, config, attempt)
        
        const attemptResult: WebhookDeliveryAttempt = {
          attempt,
          timestamp: new Date().toISOString(),
          success: response.success,
          statusCode: response.statusCode,
          error: response.error,
          responseTime: Date.now() - attemptStart
        }
        
        delivery.attempts.push(attemptResult)
        
        if (response.success) {
          delivery.success = true
          delivery.completedAt = new Date().toISOString()
          console.log(`✅ Webhook ${deliveryId} delivered successfully on attempt ${attempt}`)
          break
        } else {
          console.log(`❌ Webhook ${deliveryId} failed on attempt ${attempt}: ${response.error}`)
          
          // Don't retry on client errors (4xx)
          if (response.statusCode && response.statusCode >= 400 && response.statusCode < 500) {
            console.log(`🚫 Webhook ${deliveryId} not retrying due to client error`)
            break
          }
          
          // Wait before retry (except on last attempt)
          if (attempt < config.retryAttempts!) {
            const delay = this.calculateRetryDelay(attempt, config.retryDelay!)
            console.log(`⏳ Waiting ${delay}ms before retry ${attempt + 1}`)
            await new Promise(resolve => setTimeout(resolve, delay))
          }
        }
      } catch (error) {
        const attemptResult: WebhookDeliveryAttempt = {
          attempt,
          timestamp: new Date().toISOString(),
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          responseTime: Date.now() - attemptStart
        }
        
        delivery.attempts.push(attemptResult)
        console.error(`💥 Webhook ${deliveryId} attempt ${attempt} threw error:`, error)
      }
    }

    if (!delivery.success) {
      delivery.completedAt = new Date().toISOString()
      console.error(`🚨 Webhook ${deliveryId} failed after ${config.retryAttempts} attempts`)
    }

    // Log delivery attempt to database (in production)
    await this.logWebhookDelivery(delivery)

    return delivery
  }

  /**
   * Send webhook without retry (fire and forget)
   */
  async sendWebhookFireAndForget(
    url: string,
    payload: WebhookPayload,
    options: Partial<WebhookOptions> = {}
  ): Promise<void> {
    const config = { ...this.defaultOptions, ...options }
    
    // Don't await the response
    this.makeWebhookRequest(url, payload, config, 1)
      .then(response => {
        if (response.success) {
          console.log(`🔥 Fire-and-forget webhook sent to ${url}`)
        } else {
          console.warn(`⚠️ Fire-and-forget webhook failed: ${response.error}`)
        }
      })
      .catch(error => {
        console.error(`💥 Fire-and-forget webhook error:`, error)
      })
  }

  /**
   * Batch send multiple webhooks
   */
  async sendWebhookBatch(
    webhooks: Array<{
      url: string
      payload: WebhookPayload
      options?: Partial<WebhookOptions>
    }>,
    concurrency: number = 5
  ): Promise<WebhookDelivery[]> {
    console.log(`📦 Sending batch of ${webhooks.length} webhooks (concurrency: ${concurrency})`)
    
    const results: WebhookDelivery[] = []
    
    // Process in batches to limit concurrent requests
    for (let i = 0; i < webhooks.length; i += concurrency) {
      const batch = webhooks.slice(i, i + concurrency)
      
      const batchPromises = batch.map(webhook =>
        this.sendWebhook(webhook.url, webhook.payload, webhook.options)
      )
      
      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)
      
      console.log(`✅ Completed webhook batch ${Math.floor(i / concurrency) + 1}/${Math.ceil(webhooks.length / concurrency)}`)
    }
    
    const successCount = results.filter(r => r.success).length
    console.log(`📊 Webhook batch completed: ${successCount}/${results.length} successful`)
    
    return results
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    try {
      const expectedSignature = this.generateSignature(payload, secret)
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      )
    } catch (error) {
      console.error('Webhook signature verification failed:', error)
      return false
    }
  }

  /**
   * Generate webhook signature
   */
  generateSignature(payload: string, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex')
  }

  /**
   * Create webhook endpoint handler
   */
  createWebhookHandler(secret: string) {
    return (req: any, res: any) => {
      try {
        const signature = req.headers['x-webhook-signature']
        const payload = JSON.stringify(req.body)
        
        if (!signature) {
          return res.status(400).json({ error: 'Missing webhook signature' })
        }
        
        if (!this.verifyWebhookSignature(payload, signature, secret)) {
          return res.status(401).json({ error: 'Invalid webhook signature' })
        }
        
        // Process webhook payload
        console.log('✅ Webhook verified and received:', req.body.event)
        
        res.status(200).json({ 
          success: true, 
          message: 'Webhook processed successfully' 
        })
        
      } catch (error) {
        console.error('Webhook handler error:', error)
        res.status(500).json({ error: 'Internal server error' })
      }
    }
  }

  // Private helper methods

  private async makeWebhookRequest(
    url: string,
    payload: WebhookPayload,
    config: WebhookOptions,
    attempt: number
  ): Promise<{
    success: boolean
    statusCode?: number
    error?: string
  }> {
    const body = JSON.stringify(payload)
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': config.userAgent || 'SNS-Video-Generator-Webhook/1.0',
      'X-Webhook-Delivery': crypto.randomUUID(),
      'X-Webhook-Attempt': attempt.toString(),
      'X-Webhook-Timestamp': new Date().toISOString()
    }

    // Add signature if secret is provided
    if (config.secret) {
      headers['X-Webhook-Signature'] = this.generateSignature(body, config.secret)
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), config.timeout)

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        return { success: true, statusCode: response.status }
      } else {
        const errorText = await response.text().catch(() => 'Unknown error')
        return {
          success: false,
          statusCode: response.status,
          error: `HTTP ${response.status}: ${errorText}`
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return { success: false, error: 'Request timeout' }
        }
        return { success: false, error: error.message }
      }
      return { success: false, error: 'Unknown error' }
    }
  }

  private calculateRetryDelay(attempt: number, baseDelay: number): number {
    // Exponential backoff with jitter
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1)
    const jitter = Math.random() * 1000 // 0-1000ms jitter
    return Math.min(exponentialDelay + jitter, 60000) // Max 60 seconds
  }

  private async logWebhookDelivery(delivery: WebhookDelivery): Promise<void> {
    try {
      // In production, this would log to database
      // For now, we'll use console logging
      console.log(`📝 Webhook delivery log:`, {
        id: delivery.id,
        url: delivery.url,
        event: delivery.payload.event,
        success: delivery.success,
        attempts: delivery.attempts.length,
        totalTime: delivery.completedAt 
          ? new Date(delivery.completedAt).getTime() - new Date(delivery.createdAt).getTime()
          : null
      })
    } catch (error) {
      console.error('Failed to log webhook delivery:', error)
    }
  }
}

// Singleton instance
let webhookServiceInstance: WebhookService | null = null

export const webhookService = (() => {
  if (!webhookServiceInstance) {
    webhookServiceInstance = new WebhookService()
  }
  return webhookServiceInstance
})()

export const getWebhookService = (): WebhookService => {
  if (!webhookServiceInstance) {
    webhookServiceInstance = new WebhookService()
  }
  return webhookServiceInstance
}


// Utility functions for common webhook events
export const createProcessingWebhook = (
  event: 'started' | 'progress' | 'completed' | 'failed',
  jobId: string,
  videoId: string,
  userId: string,
  data: any = {}
): WebhookPayload => ({
  event: `processing.${event}`,
  jobId,
  videoId,
  userId,
  timestamp: new Date().toISOString(),
  ...data
})

export const createUploadWebhook = (
  event: 'started' | 'completed' | 'failed',
  videoId: string,
  userId: string,
  data: any = {}
): WebhookPayload => ({
  event: `upload.${event}`,
  videoId,
  userId,
  timestamp: new Date().toISOString(),
  ...data
})

export const createPublishWebhook = (
  event: 'started' | 'completed' | 'failed',
  videoId: string,
  userId: string,
  platform: string,
  data: any = {}
): WebhookPayload => ({
  event: `publish.${event}`,
  videoId,
  userId,
  platform,
  timestamp: new Date().toISOString(),
  ...data
})