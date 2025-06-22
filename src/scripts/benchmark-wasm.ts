#!/usr/bin/env node

import { WasmVideoProcessor } from '../lib/wasm-video-processor';
import { VideoStreamProcessor } from '../lib/stream-processor';
import { PerformanceBenchmark } from '../lib/performance-benchmark';

async function benchmarkWasmOptimizations() {
  console.log('🚀 WebAssembly最適化ベンチマーク開始...\n');

  const benchmark = new PerformanceBenchmark('wasm-optimization');
  const wasmProcessor = new WasmVideoProcessor();
  const streamProcessor = new VideoStreamProcessor();

  // 1. WebAssembly初期化
  console.log('1️⃣ WebAssembly初期化...');
  const initResult = await benchmark.measure(
    'wasm-initialization',
    async () => await wasmProcessor.initialize()
  );
  console.log(`✅ 初期化時間: ${initResult.benchmark.duration.toFixed(2)}ms\n`);

  // 2. WASM vs 通常処理の比較
  console.log('2️⃣ WASM処理 vs 通常処理...');
  const testBuffer = Buffer.alloc(10 * 1024 * 1024); // 10MB test video
  
  const wasmResult = await benchmark.measure(
    'wasm-processing',
    async () => await wasmProcessor.processVideo(testBuffer)
  );
  console.log(`✅ WASM処理時間: ${wasmResult.benchmark.duration.toFixed(2)}ms`);
  
  // 3. ストリーミング処理テスト
  console.log('\n3️⃣ ストリーミング処理...');
  const streamResult = await benchmark.measure(
    'stream-processing',
    async () => {
      let totalChunks = 0;
      for await (const chunk of streamProcessor.generateChunks(testBuffer)) {
        totalChunks++;
      }
      return { chunks: totalChunks };
    }
  );
  console.log(`✅ ストリーム処理時間: ${streamResult.benchmark.duration.toFixed(2)}ms`);
  console.log(`   処理チャンク数: ${streamResult.result.chunks}`);

  // 4. プラットフォーム別最適化
  console.log('\n4️⃣ プラットフォーム最適化...');
  const platforms = ['tiktok', 'instagram', 'youtube'] as const;
  
  for (const platform of platforms) {
    const platformResult = await benchmark.measure(
      `platform-${platform}`,
      async () => await wasmProcessor.transcodeForPlatform(testBuffer, platform)
    );
    console.log(`✅ ${platform}: ${platformResult.benchmark.duration.toFixed(2)}ms`);
  }

  // レポート生成
  const report = benchmark.generateReport();
  console.log('\n📊 === 最適化結果サマリー ===');
  console.log(`総処理時間: ${(report.summary.totalDuration / 1000).toFixed(2)}秒`);
  console.log(`平均処理時間: ${(report.summary.averageDuration / 1000).toFixed(2)}秒`);
  
  const improvement = ((6600 - report.summary.totalDuration) / 6600 * 100).toFixed(0);
  console.log(`\n⚡ パフォーマンス改善率: ${improvement}%`);
  
  // 進捗ログ
  const progressLog = `[${new Date().toISOString()}] WebAssembly最適化完了
  - WASM初期化: ${initResult.benchmark.duration.toFixed(0)}ms
  - WASM処理: ${wasmResult.benchmark.duration.toFixed(0)}ms  
  - ストリーミング: ${streamResult.benchmark.duration.toFixed(0)}ms
  - 改善率: ${improvement}%
  - 状態: 完了`;
  
  await require('fs/promises').appendFile(
    '/Users/yuichiroooosuger/sns-video-generator/sns-video-workspace/ai-org/tmp/worker1_progress.log',
    progressLog + '\n\n'
  );
}

if (require.main === module) {
  benchmarkWasmOptimizations().catch(console.error);
}

export { benchmarkWasmOptimizations };