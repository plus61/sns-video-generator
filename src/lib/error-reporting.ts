import { NextApiRequest } from 'next'

export interface ErrorContext {
  userId?: string
  userAgent?: string
  url?: string
  timestamp: string
  environment: string
  [key: string]: any
}

export interface ErrorReport {
  error: string
  message: string
  stack?: string
  context: ErrorContext
}

export class ErrorReporter {
  private static instance: ErrorReporter
  private isProduction = process.env.NODE_ENV === 'production'

  public static getInstance(): ErrorReporter {
    if (!ErrorReporter.instance) {
      ErrorReporter.instance = new ErrorReporter()
    }
    return ErrorReporter.instance
  }

  public reportError(error: Error, context: Partial<ErrorContext> = {}) {
    const errorReport: ErrorReport = {
      error: error.name,
      message: error.message,
      stack: error.stack,
      context: {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        ...context
      }
    }

    // Log to console with structured format
    console.error('Application Error:', {
      error: errorReport.error,
      message: errorReport.message,
      context: errorReport.context,
      ...(process.env.NODE_ENV === 'development' && { stack: errorReport.stack })
    })

    // In production, you could send to external error reporting service
    if (this.isProduction) {
      this.sendToExternalService(errorReport)
    }

    return errorReport
  }

  public reportApiError(
    error: Error, 
    req: NextApiRequest,
    additionalContext: Record<string, any> = {}
  ) {
    const context: Partial<ErrorContext> = {
      url: req.url,
      userAgent: req.headers['user-agent'],
      method: req.method,
      ...additionalContext
    }

    return this.reportError(error, context)
  }

  public reportAuthError(error: Error, provider?: string, email?: string) {
    const context: Partial<ErrorContext> = {
      provider,
      email: email ? this.sanitizeEmail(email) : undefined,
      category: 'authentication'
    }

    return this.reportError(error, context)
  }

  private sanitizeEmail(email: string): string {
    // Only log domain for privacy
    const [, domain] = email.split('@')
    return `***@${domain}`
  }

  private sendToExternalService(errorReport: ErrorReport) {
    // Placeholder for external error reporting service
    // Could integrate with Sentry, LogRocket, etc.
    console.warn('External error reporting not configured:', errorReport.error)
  }
}

export const errorReporter = ErrorReporter.getInstance()

// Global error handler for unhandled promise rejections
if (typeof window === 'undefined') {
  process.on('unhandledRejection', (reason, promise) => {
    const error = reason instanceof Error ? reason : new Error(String(reason))
    errorReporter.reportError(error, {
      category: 'unhandled_rejection',
      promise: promise.toString()
    })
  })

  process.on('uncaughtException', (error) => {
    errorReporter.reportError(error, {
      category: 'uncaught_exception'
    })
    process.exit(1)
  })
}