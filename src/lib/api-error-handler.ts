// 統一されたAPIエラーハンドリングシステム
// すべてのAPIエンドポイントで一貫したエラーレスポンス形式を提供

import { NextResponse } from 'next/server'
import { errorReporter } from './error-reporting'

// エラーレスポンスの統一形式
export interface ApiErrorResponse {
  error: {
    code: string
    message: string
    details?: any
    timestamp: string
    requestId?: string
    category: ErrorCategory
    retryable: boolean
  }
  success: false
}

// 成功レスポンスの統一形式
export interface ApiSuccessResponse<T = any> {
  data: T
  success: true
  meta?: {
    timestamp: string
    requestId?: string
    pagination?: {
      page: number
      limit: number
      total: number
      hasNext: boolean
    }
  }
}

// エラーカテゴリ
export enum ErrorCategory {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  RATE_LIMIT = 'rate_limit',
  NETWORK = 'network',
  EXTERNAL_SERVICE = 'external_service',
  DATABASE = 'database',
  FILE_PROCESSING = 'file_processing',
  BUSINESS_LOGIC = 'business_logic',
  SYSTEM = 'system',
  UNKNOWN = 'unknown'
}

// エラーコード定義
export enum ErrorCode {
  // 検証エラー (4000-4099)
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FILE_FORMAT = 'INVALID_FILE_FORMAT',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  
  // 認証・認可エラー (4100-4199)
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  
  // レート制限 (4200-4299)
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',
  
  // リソースエラー (4300-4399)
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',
  RESOURCE_LOCKED = 'RESOURCE_LOCKED',
  
  // 外部サービスエラー (5000-5099)
  EXTERNAL_SERVICE_UNAVAILABLE = 'EXTERNAL_SERVICE_UNAVAILABLE',
  THIRD_PARTY_API_ERROR = 'THIRD_PARTY_API_ERROR',
  PAYMENT_PROCESSING_ERROR = 'PAYMENT_PROCESSING_ERROR',
  
  // データベースエラー (5100-5199)
  DATABASE_CONNECTION_ERROR = 'DATABASE_CONNECTION_ERROR',
  DATABASE_QUERY_ERROR = 'DATABASE_QUERY_ERROR',
  DATABASE_TIMEOUT = 'DATABASE_TIMEOUT',
  
  // ファイル処理エラー (5200-5299)
  FILE_UPLOAD_FAILED = 'FILE_UPLOAD_FAILED',
  FILE_PROCESSING_FAILED = 'FILE_PROCESSING_FAILED',
  FILE_STORAGE_ERROR = 'FILE_STORAGE_ERROR',
  VIDEO_PROCESSING_FAILED = 'VIDEO_PROCESSING_FAILED',
  
  // システムエラー (5300-5399)
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TIMEOUT = 'TIMEOUT',
  MEMORY_LIMIT_EXCEEDED = 'MEMORY_LIMIT_EXCEEDED',
  
  // 不明なエラー (9999)
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// エラーコードとHTTPステータスコードのマッピング
const errorCodeToHttpStatus: Record<ErrorCode, number> = {
  // 4xx クライアントエラー
  [ErrorCode.VALIDATION_FAILED]: 400,
  [ErrorCode.INVALID_INPUT]: 400,
  [ErrorCode.MISSING_REQUIRED_FIELD]: 400,
  [ErrorCode.INVALID_FILE_FORMAT]: 400,
  [ErrorCode.FILE_TOO_LARGE]: 413,
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.INVALID_TOKEN]: 401,
  [ErrorCode.TOKEN_EXPIRED]: 401,
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: 403,
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 429,
  [ErrorCode.QUOTA_EXCEEDED]: 429,
  [ErrorCode.TOO_MANY_REQUESTS]: 429,
  [ErrorCode.RESOURCE_NOT_FOUND]: 404,
  [ErrorCode.RESOURCE_CONFLICT]: 409,
  [ErrorCode.RESOURCE_LOCKED]: 423,
  
  // 5xx サーバーエラー
  [ErrorCode.EXTERNAL_SERVICE_UNAVAILABLE]: 502,
  [ErrorCode.THIRD_PARTY_API_ERROR]: 502,
  [ErrorCode.PAYMENT_PROCESSING_ERROR]: 502,
  [ErrorCode.DATABASE_CONNECTION_ERROR]: 503,
  [ErrorCode.DATABASE_QUERY_ERROR]: 500,
  [ErrorCode.DATABASE_TIMEOUT]: 504,
  [ErrorCode.FILE_UPLOAD_FAILED]: 500,
  [ErrorCode.FILE_PROCESSING_FAILED]: 500,
  [ErrorCode.FILE_STORAGE_ERROR]: 500,
  [ErrorCode.VIDEO_PROCESSING_FAILED]: 500,
  [ErrorCode.INTERNAL_SERVER_ERROR]: 500,
  [ErrorCode.SERVICE_UNAVAILABLE]: 503,
  [ErrorCode.TIMEOUT]: 504,
  [ErrorCode.MEMORY_LIMIT_EXCEEDED]: 507,
  [ErrorCode.UNKNOWN_ERROR]: 500
}

// エラーコードの再試行可能性
const retryableErrors = new Set([
  ErrorCode.EXTERNAL_SERVICE_UNAVAILABLE,
  ErrorCode.DATABASE_CONNECTION_ERROR,
  ErrorCode.DATABASE_TIMEOUT,
  ErrorCode.SERVICE_UNAVAILABLE,
  ErrorCode.TIMEOUT,
  ErrorCode.RATE_LIMIT_EXCEEDED
])

// エラーメッセージの多言語対応
const errorMessages: Record<ErrorCode, { ja: string; en: string }> = {
  [ErrorCode.VALIDATION_FAILED]: {
    ja: '入力データの検証に失敗しました',
    en: 'Input validation failed'
  },
  [ErrorCode.INVALID_INPUT]: {
    ja: '無効な入力データです',
    en: 'Invalid input data'
  },
  [ErrorCode.MISSING_REQUIRED_FIELD]: {
    ja: '必須フィールドが不足しています',
    en: 'Required field is missing'
  },
  [ErrorCode.INVALID_FILE_FORMAT]: {
    ja: 'サポートされていないファイル形式です',
    en: 'Unsupported file format'
  },
  [ErrorCode.FILE_TOO_LARGE]: {
    ja: 'ファイルサイズが上限を超えています',
    en: 'File size exceeds limit'
  },
  [ErrorCode.UNAUTHORIZED]: {
    ja: '認証が必要です',
    en: 'Authentication required'
  },
  [ErrorCode.FORBIDDEN]: {
    ja: 'アクセス権限がありません',
    en: 'Access forbidden'
  },
  [ErrorCode.INVALID_TOKEN]: {
    ja: '無効なトークンです',
    en: 'Invalid token'
  },
  [ErrorCode.TOKEN_EXPIRED]: {
    ja: 'トークンの有効期限が切れています',
    en: 'Token has expired'
  },
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: {
    ja: '権限が不十分です',
    en: 'Insufficient permissions'
  },
  [ErrorCode.RATE_LIMIT_EXCEEDED]: {
    ja: 'リクエスト制限を超えました。しばらく待ってから再試行してください',
    en: 'Rate limit exceeded. Please try again later'
  },
  [ErrorCode.QUOTA_EXCEEDED]: {
    ja: '利用制限に達しました',
    en: 'Quota exceeded'
  },
  [ErrorCode.TOO_MANY_REQUESTS]: {
    ja: 'リクエストが多すぎます',
    en: 'Too many requests'
  },
  [ErrorCode.RESOURCE_NOT_FOUND]: {
    ja: 'リソースが見つかりません',
    en: 'Resource not found'
  },
  [ErrorCode.RESOURCE_CONFLICT]: {
    ja: 'リソースの競合が発生しました',
    en: 'Resource conflict'
  },
  [ErrorCode.RESOURCE_LOCKED]: {
    ja: 'リソースがロックされています',
    en: 'Resource is locked'
  },
  [ErrorCode.EXTERNAL_SERVICE_UNAVAILABLE]: {
    ja: '外部サービスが利用できません',
    en: 'External service unavailable'
  },
  [ErrorCode.THIRD_PARTY_API_ERROR]: {
    ja: '外部APIでエラーが発生しました',
    en: 'Third party API error'
  },
  [ErrorCode.PAYMENT_PROCESSING_ERROR]: {
    ja: '決済処理でエラーが発生しました',
    en: 'Payment processing error'
  },
  [ErrorCode.DATABASE_CONNECTION_ERROR]: {
    ja: 'データベース接続エラーが発生しました',
    en: 'Database connection error'
  },
  [ErrorCode.DATABASE_QUERY_ERROR]: {
    ja: 'データベースクエリエラーが発生しました',
    en: 'Database query error'
  },
  [ErrorCode.DATABASE_TIMEOUT]: {
    ja: 'データベース処理がタイムアウトしました',
    en: 'Database timeout'
  },
  [ErrorCode.FILE_UPLOAD_FAILED]: {
    ja: 'ファイルのアップロードに失敗しました',
    en: 'File upload failed'
  },
  [ErrorCode.FILE_PROCESSING_FAILED]: {
    ja: 'ファイルの処理に失敗しました',
    en: 'File processing failed'
  },
  [ErrorCode.FILE_STORAGE_ERROR]: {
    ja: 'ファイルストレージエラーが発生しました',
    en: 'File storage error'
  },
  [ErrorCode.VIDEO_PROCESSING_FAILED]: {
    ja: '動画処理に失敗しました',
    en: 'Video processing failed'
  },
  [ErrorCode.INTERNAL_SERVER_ERROR]: {
    ja: '内部サーバーエラーが発生しました',
    en: 'Internal server error'
  },
  [ErrorCode.SERVICE_UNAVAILABLE]: {
    ja: 'サービスが一時的に利用できません',
    en: 'Service temporarily unavailable'
  },
  [ErrorCode.TIMEOUT]: {
    ja: '処理がタイムアウトしました',
    en: 'Request timeout'
  },
  [ErrorCode.MEMORY_LIMIT_EXCEEDED]: {
    ja: 'メモリ制限を超えました',
    en: 'Memory limit exceeded'
  },
  [ErrorCode.UNKNOWN_ERROR]: {
    ja: '不明なエラーが発生しました',
    en: 'Unknown error occurred'
  }
}

// カスタムAPIエラークラス
export class ApiError extends Error {
  public readonly code: ErrorCode
  public readonly category: ErrorCategory
  public readonly details?: any
  public readonly retryable: boolean

  constructor(
    code: ErrorCode,
    message?: string,
    details?: any,
    category?: ErrorCategory
  ) {
    super(message || errorMessages[code]?.ja || 'Unknown error')
    this.name = 'ApiError'
    this.code = code
    this.details = details
    this.retryable = retryableErrors.has(code)
    this.category = category || this.inferCategory(code)
  }

  private inferCategory(code: ErrorCode): ErrorCategory {
    const codeStr = code.toString()
    
    if (codeStr.includes('VALIDATION') || codeStr.includes('INVALID')) {
      return ErrorCategory.VALIDATION
    }
    if (codeStr.includes('AUTH') || codeStr.includes('TOKEN')) {
      return ErrorCategory.AUTHENTICATION
    }
    if (codeStr.includes('FORBIDDEN') || codeStr.includes('PERMISSION')) {
      return ErrorCategory.AUTHORIZATION
    }
    if (codeStr.includes('RATE') || codeStr.includes('QUOTA')) {
      return ErrorCategory.RATE_LIMIT
    }
    if (codeStr.includes('DATABASE')) {
      return ErrorCategory.DATABASE
    }
    if (codeStr.includes('FILE') || codeStr.includes('VIDEO')) {
      return ErrorCategory.FILE_PROCESSING
    }
    if (codeStr.includes('EXTERNAL') || codeStr.includes('THIRD_PARTY')) {
      return ErrorCategory.EXTERNAL_SERVICE
    }
    if (codeStr.includes('NETWORK') || codeStr.includes('TIMEOUT')) {
      return ErrorCategory.NETWORK
    }
    
    return ErrorCategory.SYSTEM
  }
}

// エラーレスポンス生成
export const createErrorResponse = (
  error: Error | ApiError,
  requestId?: string,
  language: 'ja' | 'en' = 'ja'
): NextResponse<ApiErrorResponse> => {
  let apiError: ApiError
  
  // 通常のErrorをApiErrorに変換
  if (!(error instanceof ApiError)) {
    apiError = new ApiError(
      ErrorCode.INTERNAL_SERVER_ERROR,
      error.message,
      { originalError: error.name },
      ErrorCategory.SYSTEM
    )
  } else {
    apiError = error
  }
  
  const httpStatus = errorCodeToHttpStatus[apiError.code] || 500
  
  // エラーレポートに送信
  errorReporter.reportError(error, {
    category: `api_${apiError.category}`,
    context: {
      errorCode: apiError.code,
      httpStatus,
      requestId,
      retryable: apiError.retryable,
      details: apiError.details
    }
  })
  
  const errorResponse: ApiErrorResponse = {
    error: {
      code: apiError.code,
      message: errorMessages[apiError.code]?.[language] || apiError.message,
      details: process.env.NODE_ENV === 'development' ? apiError.details : undefined,
      timestamp: new Date().toISOString(),
      requestId,
      category: apiError.category,
      retryable: apiError.retryable
    },
    success: false
  }
  
  return NextResponse.json(errorResponse, { status: httpStatus })
}

// 成功レスポンス生成
export const createSuccessResponse = <T>(
  data: T,
  meta?: Partial<ApiSuccessResponse<T>['meta']>,
  requestId?: string
): NextResponse<ApiSuccessResponse<T>> => {
  const response: ApiSuccessResponse<T> = {
    data,
    success: true,
    meta: {
      timestamp: new Date().toISOString(),
      requestId,
      ...meta
    }
  }
  
  return NextResponse.json(response)
}

// APIハンドラーラッパー
export const withErrorHandling = <T extends any[], R>(
  handler: (...args: T) => Promise<R>
) => {
  return async (...args: T): Promise<R> => {
    try {
      return await handler(...args)
    } catch (error) {
      // エラーをApiErrorに変換（必要に応じて）
      if (!(error instanceof ApiError)) {
        throw new ApiError(
          ErrorCode.INTERNAL_SERVER_ERROR,
          error instanceof Error ? error.message : 'Unknown error',
          { originalError: error }
        )
      }
      throw error
    }
  }
}

// バリデーションエラーヘルパー
export const createValidationError = (field: string, message: string, value?: any) => {
  return new ApiError(
    ErrorCode.VALIDATION_FAILED,
    `Validation failed for field: ${field}`,
    { field, message, value },
    ErrorCategory.VALIDATION
  )
}

// 認証エラーヘルパー
export const createAuthError = (message: string = 'Authentication required') => {
  return new ApiError(
    ErrorCode.UNAUTHORIZED,
    message,
    undefined,
    ErrorCategory.AUTHENTICATION
  )
}

// リソース未発見エラーヘルパー
export const createNotFoundError = (resource: string, id?: string) => {
  return new ApiError(
    ErrorCode.RESOURCE_NOT_FOUND,
    `${resource} not found`,
    { resource, id },
    ErrorCategory.BUSINESS_LOGIC
  )
}

// レート制限エラーヘルパー
export const createRateLimitError = (limit: number, resetTime?: Date) => {
  return new ApiError(
    ErrorCode.RATE_LIMIT_EXCEEDED,
    'Rate limit exceeded',
    { limit, resetTime },
    ErrorCategory.RATE_LIMIT
  )
}