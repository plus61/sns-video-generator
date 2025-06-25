'use client';

import React, { useState } from 'react';
import { downloadSegmentsAsZip } from '@/lib/download-segments';
import type { DownloadSegment } from '@/types/api';

interface DownloadSegmentsButtonProps {
  segments: DownloadSegment[];
  className?: string;
  disabled?: boolean;
}

export function DownloadSegmentsButton({ 
  segments, 
  className = '',
  disabled = false 
}: DownloadSegmentsButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    if (segments.length === 0) {
      setError('No segments to download');
      return;
    }

    setIsDownloading(true);
    setError(null);

    try {
      await downloadSegmentsAsZip(segments);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Download failed';
      setError(errorMessage);
      console.error('Download error:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="inline-flex flex-col items-start">
      <button
        onClick={handleDownload}
        disabled={disabled || isDownloading || segments.length === 0}
        className={`
          px-4 py-2 rounded-md font-medium transition-colors
          ${disabled || isDownloading || segments.length === 0
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
          }
          ${className}
        `}
      >
        {isDownloading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4"
                fill="none"
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Downloading...
          </span>
        ) : (
          <>
            Download {segments.length} Segment{segments.length !== 1 ? 's' : ''} as ZIP
          </>
        )}
      </button>
      
      {error && (
        <p className="mt-2 text-sm text-red-600">
          Error: {error}
        </p>
      )}
    </div>
  );
}

/**
 * Example usage:
 * 
 * const segments = [
 *   { name: 'intro-clip', path: '/temp/intro-clip.mp4' },
 *   { name: 'main-content', path: '/temp/main-content.mp4' },
 *   { name: 'outro-clip', path: '/temp/outro-clip.mp4' },
 * ];
 * 
 * <DownloadSegmentsButton segments={segments} />
 */