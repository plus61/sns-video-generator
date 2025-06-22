import { performance } from 'perf_hooks';
import { memoryUsage } from 'process';
import fs from 'fs/promises';
import path from 'path';

export interface BenchmarkResult {
  operation: string;
  duration: number;
  memoryUsage: {
    start: NodeJS.MemoryUsage;
    end: NodeJS.MemoryUsage;
    delta: {
      heapUsed: number;
      heapTotal: number;
      external: number;
      arrayBuffers: number;
    };
  };
  metadata?: Record<string, any>;
  timestamp: number;
}

export interface BenchmarkReport {
  summary: {
    totalDuration: number;
    averageDuration: number;
    maxDuration: number;
    minDuration: number;
    peakMemoryUsage: number;
    operationCount: number;
  };
  results: BenchmarkResult[];
  metadata: {
    platform: string;
    nodeVersion: string;
    cpuCount: number;
    totalMemory: number;
    timestamp: number;
  };
}

export class PerformanceBenchmark {
  private results: BenchmarkResult[] = [];
  private activeOperations: Map<string, {
    startTime: number;
    startMemory: NodeJS.MemoryUsage;
  }> = new Map();

  constructor(private readonly name: string) {}

  start(operation: string): void {
    const startTime = performance.now();
    const startMemory = memoryUsage();
    
    this.activeOperations.set(operation, {
      startTime,
      startMemory
    });
  }

  end(operation: string, metadata?: Record<string, any>): BenchmarkResult | null {
    const active = this.activeOperations.get(operation);
    if (!active) {
      console.warn(`No active operation found for: ${operation}`);
      return null;
    }

    const endTime = performance.now();
    const endMemory = memoryUsage();
    const duration = endTime - active.startTime;

    const result: BenchmarkResult = {
      operation,
      duration,
      memoryUsage: {
        start: active.startMemory,
        end: endMemory,
        delta: {
          heapUsed: endMemory.heapUsed - active.startMemory.heapUsed,
          heapTotal: endMemory.heapTotal - active.startMemory.heapTotal,
          external: endMemory.external - active.startMemory.external,
          arrayBuffers: endMemory.arrayBuffers - active.startMemory.arrayBuffers
        }
      },
      metadata,
      timestamp: Date.now()
    };

    this.results.push(result);
    this.activeOperations.delete(operation);

    return result;
  }

  async measure<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<{ result: T; benchmark: BenchmarkResult }> {
    this.start(operation);
    
    try {
      const result = await fn();
      const benchmark = this.end(operation, metadata)!;
      return { result, benchmark };
    } catch (error) {
      this.end(operation, { error: String(error), ...metadata });
      throw error;
    }
  }

  generateReport(): BenchmarkReport {
    const durations = this.results.map(r => r.duration);
    const memoryDeltas = this.results.map(r => r.memoryUsage.delta.heapUsed);

    return {
      summary: {
        totalDuration: durations.reduce((sum, d) => sum + d, 0),
        averageDuration: durations.length > 0 
          ? durations.reduce((sum, d) => sum + d, 0) / durations.length 
          : 0,
        maxDuration: Math.max(...durations, 0),
        minDuration: Math.min(...durations, Infinity),
        peakMemoryUsage: Math.max(...memoryDeltas, 0),
        operationCount: this.results.length
      },
      results: this.results,
      metadata: {
        platform: process.platform,
        nodeVersion: process.version,
        cpuCount: require('os').cpus().length,
        totalMemory: require('os').totalmem(),
        timestamp: Date.now()
      }
    };
  }

  async saveReport(directory: string): Promise<string> {
    const report = this.generateReport();
    const filename = `benchmark-${this.name}-${Date.now()}.json`;
    const filepath = path.join(directory, filename);
    
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(filepath, JSON.stringify(report, null, 2));
    
    return filepath;
  }

  formatReport(): string {
    const report = this.generateReport();
    const lines: string[] = [];
    
    lines.push(`=== Performance Benchmark Report: ${this.name} ===`);
    lines.push(`Platform: ${report.metadata.platform}`);
    lines.push(`Node Version: ${report.metadata.nodeVersion}`);
    lines.push(`CPU Count: ${report.metadata.cpuCount}`);
    lines.push(`Total Memory: ${(report.metadata.totalMemory / 1024 / 1024 / 1024).toFixed(2)} GB`);
    lines.push('');
    
    lines.push('=== Summary ===');
    lines.push(`Total Duration: ${report.summary.totalDuration.toFixed(2)} ms`);
    lines.push(`Average Duration: ${report.summary.averageDuration.toFixed(2)} ms`);
    lines.push(`Max Duration: ${report.summary.maxDuration.toFixed(2)} ms`);
    lines.push(`Min Duration: ${report.summary.minDuration.toFixed(2)} ms`);
    lines.push(`Peak Memory Usage: ${(report.summary.peakMemoryUsage / 1024 / 1024).toFixed(2)} MB`);
    lines.push(`Operation Count: ${report.summary.operationCount}`);
    lines.push('');
    
    lines.push('=== Detailed Results ===');
    for (const result of report.results) {
      lines.push(`Operation: ${result.operation}`);
      lines.push(`  Duration: ${result.duration.toFixed(2)} ms`);
      lines.push(`  Memory Delta: ${(result.memoryUsage.delta.heapUsed / 1024 / 1024).toFixed(2)} MB`);
      if (result.metadata) {
        lines.push(`  Metadata: ${JSON.stringify(result.metadata)}`);
      }
      lines.push('');
    }
    
    return lines.join('\n');
  }

  reset(): void {
    this.results = [];
    this.activeOperations.clear();
  }
}

export class VideoProcessingBenchmark extends PerformanceBenchmark {
  constructor() {
    super('video-processing');
  }

  async benchmarkVideoUpload(
    filePath: string,
    fileSize: number
  ): Promise<BenchmarkResult> {
    return (await this.measure(
      'video-upload',
      async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      },
      { filePath, fileSize }
    )).benchmark;
  }

  async benchmarkTranscoding(
    inputPath: string,
    outputPath: string,
    resolution: string
  ): Promise<BenchmarkResult> {
    return (await this.measure(
      'video-transcoding',
      async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
      },
      { inputPath, outputPath, resolution }
    )).benchmark;
  }

  async benchmarkAIAnalysis(
    videoPath: string,
    analysisType: string
  ): Promise<BenchmarkResult> {
    return (await this.measure(
      'ai-analysis',
      async () => {
        await new Promise(resolve => setTimeout(resolve, 2000));
      },
      { videoPath, analysisType }
    )).benchmark;
  }

  async benchmarkSegmentExtraction(
    videoPath: string,
    segmentCount: number
  ): Promise<BenchmarkResult> {
    return (await this.measure(
      'segment-extraction',
      async () => {
        await new Promise(resolve => setTimeout(resolve, 1500));
      },
      { videoPath, segmentCount }
    )).benchmark;
  }

  async runCompleteBenchmark(testVideoPath: string): Promise<BenchmarkReport> {
    this.reset();
    
    const fileStats = await fs.stat(testVideoPath);
    const fileSize = fileStats.size;
    
    await this.benchmarkVideoUpload(testVideoPath, fileSize);
    
    await this.benchmarkTranscoding(
      testVideoPath,
      '/tmp/output.mp4',
      '720p'
    );
    
    await this.benchmarkAIAnalysis(testVideoPath, 'whisper-transcription');
    
    await this.benchmarkAIAnalysis(testVideoPath, 'gpt4v-scene-analysis');
    
    await this.benchmarkSegmentExtraction(testVideoPath, 10);
    
    return this.generateReport();
  }
}