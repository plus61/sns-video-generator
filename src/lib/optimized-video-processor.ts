import { spawn } from 'child_process';
import { performance } from 'perf_hooks';

export class OptimizedVideoProcessor {
  private workerCount: number;

  constructor(workerCount: number = 4) {
    this.workerCount = workerCount;
  }

  async processWithNativeFFmpeg(
    inputPath: string,
    outputPath: string,
    options: {
      preset?: string;
      threads?: number;
      hwaccel?: boolean;
    } = {}
  ): Promise<{ duration: number; success: boolean }> {
    const startTime = performance.now();
    
    const args = [
      '-i', inputPath,
      '-c:v', 'libx264',
      '-preset', options.preset || 'ultrafast',
      '-threads', (options.threads || this.workerCount).toString(),
      '-y',
      outputPath
    ];

    if (options.hwaccel) {
      args.unshift('-hwaccel', 'auto');
    }

    return new Promise((resolve) => {
      const ffmpeg = spawn('ffmpeg', args);
      
      ffmpeg.on('close', (code) => {
        resolve({
          duration: performance.now() - startTime,
          success: code === 0
        });
      });

      ffmpeg.on('error', () => {
        resolve({
          duration: performance.now() - startTime,
          success: false
        });
      });
    });
  }

  async processInParallel(
    chunks: string[],
    outputDir: string
  ): Promise<{ totalDuration: number; processedChunks: number }> {
    const startTime = performance.now();
    
    const promises = chunks.map((chunk, index) =>
      this.processWithNativeFFmpeg(
        chunk,
        `${outputDir}/chunk_${index}.mp4`,
        { preset: 'ultrafast', threads: 2 }
      )
    );

    const results = await Promise.all(promises);
    const processedChunks = results.filter(r => r.success).length;

    return {
      totalDuration: performance.now() - startTime,
      processedChunks
    };
  }
}