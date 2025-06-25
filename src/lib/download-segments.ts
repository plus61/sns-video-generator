import type { DownloadSegment, DownloadSegmentsRequest } from '@/types/api';

/**
 * Download multiple video segments as a ZIP file
 * @param segments Array of segments with name and path
 * @returns Promise that triggers the download
 */
export async function downloadSegmentsAsZip(segments: DownloadSegment[]): Promise<void> {
  try {
    const requestBody: DownloadSegmentsRequest = { segments };
    
    const response = await fetch('/api/download-segments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Download failed');
    }

    // Get the blob from response
    const blob = await response.blob();
    
    // Create a download link
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    
    // Extract filename from Content-Disposition header or use default
    const contentDisposition = response.headers.get('Content-Disposition');
    const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
    const filename = filenameMatch ? filenameMatch[1] : `video-segments-${Date.now()}.zip`;
    
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Failed to download segments:', error);
    throw error;
  }
}

/**
 * Example usage in a React component:
 * 
 * const handleDownload = async () => {
 *   const segments = [
 *     { name: 'clip1', path: '/temp/video-clip1.mp4' },
 *     { name: 'clip2', path: '/temp/video-clip2.mp4' },
 *   ];
 *   
 *   try {
 *     await downloadSegmentsAsZip(segments);
 *   } catch (error) {
 *     alert('Download failed: ' + error.message);
 *   }
 * };
 */