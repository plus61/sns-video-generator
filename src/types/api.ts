// API共通型定義
// Worker1 & Worker2 統合作業用

// 動画ステータス
export type VideoStatus = 
  | 'uploading'
  | 'processing'
  | 'ready_for_analysis'
  | 'analyzing'
  | 'ready'
  | 'error';

// 動画アップロードレスポンス
export interface VideoUploadResponse {
  videoId: string;
  status: VideoStatus;
  progress?: number;
  publicUrl?: string;
  storagePath?: string;
  error?: string;
  metadata?: VideoMetadata;
}

// 動画メタデータ
export interface VideoMetadata {
  originalName: string;
  fileSize: number;
  fileType: string;
  duration?: number;
  width?: number;
  height?: number;
  uploadedAt?: string;
}

// 動画分割レスポンス
export interface VideoSplitResponse {
  success: boolean;
  clips: VideoClip[];
  sourceVideo: {
    id: string;
    duration: number;
  };
  error?: string;
}

// 動画クリップ
export interface VideoClip {
  url: string;
  start: number;
  end: number;
  duration: number;
  index: number;
}

// YouTube URL解析レスポンス
export interface YouTubeUploadResponse {
  videoId: string;
  status: VideoStatus;
  youtubeUrl: string;
  title?: string;
  thumbnail?: string;
  error?: string;
}

// API エラー
export class APIError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// エラーコード定義
export const ErrorCodes = {
  // アップロードエラー
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  
  // YouTube エラー
  YOUTUBE_FETCH_FAILED: 'YOUTUBE_FETCH_FAILED',
  INVALID_YOUTUBE_URL: 'INVALID_YOUTUBE_URL',
  
  // 処理エラー
  PROCESSING_FAILED: 'PROCESSING_FAILED',
  SPLIT_FAILED: 'SPLIT_FAILED',
  
  // 一般エラー
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  SERVER_ERROR: 'SERVER_ERROR',
} as const;

// 進捗イベント
export interface ProgressEvent {
  videoId: string;
  type: 'upload' | 'processing' | 'analysis';
  progress: number;
  message?: string;
}

// ダウンロードセグメント
export interface DownloadSegment {
  name: string;
  path: string;
}

// ダウンロードセグメントリクエスト
export interface DownloadSegmentsRequest {
  segments: DownloadSegment[];
}

// ダウンロードセグメントエラーレスポンス
export interface DownloadSegmentsErrorResponse {
  error: string;
  details?: string;
}