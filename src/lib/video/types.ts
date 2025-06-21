/**
 * 動画サムネイル生成の型定義
 */

export interface ThumbnailOptions {
  /** 出力画像の幅（ピクセル） */
  width?: number;
  
  /** 出力画像の高さ（ピクセル） */
  height?: number;
  
  /** 出力フォーマット */
  format?: 'png' | 'jpeg';
  
  /** JPEG品質 (1-100、JPEGのみ有効) */
  quality?: number;
  
  /** カスタム出力パス */
  outputPath?: string;
  
  /** アスペクト比を維持するか */
  maintainAspectRatio?: boolean;
}

export interface ThumbnailMetadata {
  /** 画像の幅 */
  width: number;
  
  /** 画像の高さ */
  height: number;
  
  /** ファイルフォーマット */
  format: string;
  
  /** ファイルサイズ（バイト） */
  fileSize: number;
  
  /** 生成にかかった時間（ミリ秒） */
  generationTime?: number;
}

export interface ThumbnailResult {
  /** 処理の成功/失敗 */
  success: boolean;
  
  /** 生成されたサムネイルのパス */
  thumbnailPath?: string;
  
  /** エラーメッセージ */
  error?: string;
  
  /** サムネイルのメタデータ */
  metadata?: ThumbnailMetadata;
}

export interface BatchThumbnailRequest {
  /** 動画内のタイムスタンプ（秒） */
  timestamp: number;
  
  /** このサムネイル用のオプション */
  options?: ThumbnailOptions;
}

export interface BatchThumbnailOptions {
  /** 並列処理を有効にするか */
  parallel?: boolean;
  
  /** 並列処理の最大数 */
  maxConcurrency?: number;
  
  /** エラー時に続行するか */
  continueOnError?: boolean;
}

export interface BatchThumbnailResult {
  /** 全体の成功/失敗（部分的成功も含む） */
  success: boolean;
  
  /** 各サムネイルの結果 */
  thumbnails: ThumbnailResult[];
  
  /** 全体のエラーメッセージ */
  error?: string;
  
  /** 処理統計 */
  stats?: {
    total: number;
    succeeded: number;
    failed: number;
    duration: number;
  };
}