import { useState, useRef, useCallback, useEffect } from 'react';
import { 
  VideoUploadResponse, 
  APIError, 
  ErrorCodes,
  ProgressEvent,
  VideoStatus 
} from '@/types/api';

interface UploadState {
  isUploading: boolean;
  progress: number;
  status: VideoStatus | null;
  error: string | null;
  videoId: string | null;
  message: string;
}

interface UseVideoUploadOptions {
  onSuccess?: (response: VideoUploadResponse) => void;
  onError?: (error: APIError) => void;
  onProgress?: (progress: number) => void;
}

export function useVideoUpload(options: UseVideoUploadOptions = {}) {
  const [state, setState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    status: null,
    error: null,
    videoId: null,
    message: ''
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // SSE接続を開始
  const startSSEConnection = useCallback((videoId: string) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource(`/api/upload-progress?videoId=${videoId}`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as ProgressEvent;
        
        setState(prev => ({
          ...prev,
          progress: data.progress,
          message: data.message || `${data.type}中... ${data.progress}%`
        }));

        options.onProgress?.(data.progress);
      } catch (error) {
        console.error('SSEパースエラー:', error);
      }
    };

    eventSource.addEventListener('status', (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        setState(prev => ({
          ...prev,
          status: data.status,
          message: data.message || ''
        }));
      } catch (error) {
        console.error('ステータスイベントエラー:', error);
      }
    });

    eventSource.addEventListener('complete', (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        setState(prev => ({
          ...prev,
          isUploading: false,
          status: 'ready',
          progress: 100,
          message: '完了しました！'
        }));
        options.onSuccess?.(data);
        eventSource.close();
      } catch (error) {
        console.error('完了イベントエラー:', error);
      }
    });

    eventSource.onerror = (error) => {
      console.error('SSE接続エラー:', error);
      setState(prev => ({
        ...prev,
        error: 'リアルタイム更新の接続が切断されました'
      }));
      
      // 自動再接続（最大3回）
      let retryCount = 0;
      const maxRetries = 3;
      
      const retry = () => {
        if (retryCount < maxRetries && state.isUploading) {
          retryCount++;
          setTimeout(() => {
            console.log(`SSE再接続試行: ${retryCount}/${maxRetries}`);
            startSSEConnection(videoId);
          }, 2000 * retryCount);
        }
      };
      
      retry();
    };
  }, [options, state.isUploading]);

  // ファイルアップロード
  const uploadFile = useCallback(async (file: File) => {
    // 初期状態設定
    setState({
      isUploading: true,
      progress: 0,
      status: 'uploading',
      error: null,
      videoId: null,
      message: 'アップロードを開始しています...'
    });

    // AbortController設定
    abortControllerRef.current = new AbortController();

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload-file', {
        method: 'POST',
        body: formData,
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new APIError(
          errorData.code || ErrorCodes.UPLOAD_FAILED,
          errorData.message || 'アップロードに失敗しました',
          response.status
        );
      }

      const data: VideoUploadResponse = await response.json();
      
      // SSE接続開始
      if (data.videoId) {
        setState(prev => ({ ...prev, videoId: data.videoId }));
        startSSEConnection(data.videoId);
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          setState(prev => ({
            ...prev,
            isUploading: false,
            error: 'アップロードがキャンセルされました',
            status: null
          }));
        } else {
          const apiError = error instanceof APIError 
            ? error 
            : new APIError(ErrorCodes.UPLOAD_FAILED, error.message);
          
          setState(prev => ({
            ...prev,
            isUploading: false,
            error: apiError.message,
            status: 'error'
          }));
          
          options.onError?.(apiError);
        }
      }
      throw error;
    }
  }, [options, startSSEConnection]);

  // アップロードキャンセル
  const cancelUpload = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    setState(prev => ({
      ...prev,
      isUploading: false,
      progress: 0,
      status: null,
      message: ''
    }));
  }, []);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    uploadFile,
    cancelUpload,
    ...state
  };
}