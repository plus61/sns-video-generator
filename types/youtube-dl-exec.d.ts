// Type definitions for youtube-dl-exec
declare module 'youtube-dl-exec' {
  interface VideoInfo {
    title?: string
    duration?: number
    description?: string
    thumbnail?: string
    uploader?: string
    upload_date?: string
    view_count?: number
    like_count?: number
    formats?: Array<{
      url: string
      ext: string
      filesize?: number
      width?: number
      height?: number
      vcodec?: string
      acodec?: string
    }>
  }

  interface DownloadOptions {
    output?: string
    format?: string
    noCheckCertificates?: boolean
    noWarnings?: boolean
    callHome?: boolean
    noCallHome?: boolean
    extractFlat?: boolean
    writeInfoJson?: boolean
    writeDescription?: boolean
    writeThumbnail?: boolean
    writeAllThumbnails?: boolean
    dumpSingleJson?: boolean
    quiet?: boolean
    verbose?: boolean
    [key: string]: any
  }

  function youtubedl(url: string, options?: DownloadOptions): Promise<VideoInfo>
  function youtubedl(url: string, options?: DownloadOptions, callback?: (err: Error | null, output: VideoInfo) => void): void

  namespace youtubedl {
    function exec(url: string, options?: DownloadOptions): Promise<VideoInfo>
    function getVideoInfo(url: string): Promise<VideoInfo>
  }

  export = youtubedl
}