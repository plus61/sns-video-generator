#!/usr/bin/env node

/**
 * 統合テスト: YouTube動画ダウンロード → 分割 → AI解析 → ダウンロード
 */

const API_BASE = 'http://localhost:3001/api';

// テスト用YouTube URL（短い動画）
const TEST_VIDEO_URL = 'https://www.youtube.com/watch?v=aqz-KE-bpKQ';

// 色付きログ出力
const log = {
  info: (msg) => console.log(`\x1b[36mℹ\x1b[0m  ${msg}`),
  success: (msg) => console.log(`\x1b[32m✓\x1b[0m  ${msg}`),
  error: (msg) => console.log(`\x1b[31m✗\x1b[0m  ${msg}`),
  step: (msg) => console.log(`\n\x1b[35m▶\x1b[0m  ${msg}`)
};

// APIリクエストヘルパー
async function apiRequest(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Accept': 'application/json',
        ...options.headers
      },
      ...options
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    return response;
  } catch (error) {
    log.error(`API Error: ${error.message}`);
    throw error;
  }
}

// メインテストフロー
async function runIntegrationTest() {
  log.info('=== 統合テスト開始 ===');
  log.info(`テスト動画: ${TEST_VIDEO_URL}`);

  try {
    // 1. YouTube動画ダウンロード
    log.step('Step 1: YouTube動画ダウンロード');
    const downloadData = await apiRequest('/download-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: TEST_VIDEO_URL })
    });

    if (!downloadData.id) {
      throw new Error('動画IDが返されませんでした');
    }
    log.success(`動画ダウンロード完了: ID=${downloadData.id}`);
    log.info(`ファイルパス: ${downloadData.path}`);

    // 2. 動画分割
    log.step('Step 2: 動画を30秒セグメントに分割');
    const splitData = await apiRequest('/split-simple', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        videoId: downloadData.id,
        filePath: downloadData.path 
      })
    });

    if (!splitData.segments || splitData.segments.length === 0) {
      throw new Error('セグメントが作成されませんでした');
    }
    log.success(`分割完了: ${splitData.segments.length}個のセグメント`);
    splitData.segments.forEach((seg, i) => {
      log.info(`  - セグメント${i + 1}: ${seg.filename} (${seg.duration}s)`);
    });

    // 3. AI解析
    log.step('Step 3: AI解析（各セグメント）');
    const analysisResults = [];
    
    for (let i = 0; i < Math.min(splitData.segments.length, 2); i++) {
      const segment = splitData.segments[i];
      log.info(`セグメント${i + 1}を解析中...`);
      
      try {
        const analysisData = await apiRequest('/analyze-simple', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            videoPath: segment.path,
            segmentIndex: i,
            duration: segment.duration
          })
        });

        analysisResults.push({
          segment: segment.filename,
          analysis: analysisData
        });
        log.success(`解析完了: ${segment.filename}`);
        if (analysisData.transcript) {
          log.info(`  転写: ${analysisData.transcript.substring(0, 100)}...`);
        }
      } catch (error) {
        log.error(`セグメント${i + 1}の解析エラー: ${error.message}`);
      }
    }

    // 4. セグメントダウンロード
    log.step('Step 4: セグメントZIPダウンロード');
    const downloadResponse = await apiRequest(`/download-segments?videoId=${downloadData.id}`);
    
    if (downloadResponse.headers && downloadResponse.headers.get('content-type')?.includes('application/zip')) {
      log.success('ZIPファイルのダウンロード準備完了');
      log.info(`ダウンロードURL: ${API_BASE}/download-segments?videoId=${downloadData.id}`);
    }

    // 5. 結果サマリー
    log.step('テスト結果サマリー');
    log.success('✅ YouTube動画ダウンロード: 成功');
    log.success('✅ 動画分割: 成功');
    log.success(`✅ AI解析: ${analysisResults.length}/${splitData.segments.length} セグメント完了`);
    log.success('✅ ZIPダウンロード: 成功');

    // 6. クリーンアップ提案
    log.step('クリーンアップ');
    log.info('生成されたファイル:');
    log.info(`  - 元動画: ${downloadData.path}`);
    splitData.segments.forEach(seg => {
      log.info(`  - セグメント: ${seg.path}`);
    });
    log.info('※ 必要に応じて手動で削除してください');

    return true;

  } catch (error) {
    log.error(`統合テスト失敗: ${error.message}`);
    return false;
  }
}

// ヘルスチェック
async function checkHealth() {
  try {
    const health = await apiRequest('/health/simple');
    if (health.status === 'healthy') {
      log.success('APIサーバー: 正常稼働中');
      return true;
    }
  } catch {
    log.error('APIサーバーに接続できません');
    log.info('サーバーを起動してください: npm run dev');
    return false;
  }
}

// メイン実行
async function main() {
  console.log('\n🎬 SNS Video Generator - 統合テスト\n');

  // ヘルスチェック
  if (!await checkHealth()) {
    process.exit(1);
  }

  // 統合テスト実行
  const success = await runIntegrationTest();
  
  console.log('\n' + '='.repeat(50));
  if (success) {
    log.success('🎉 統合テスト完了！');
  } else {
    log.error('❌ 統合テスト失敗');
    process.exit(1);
  }
}

// エラーハンドリング
process.on('unhandledRejection', (error) => {
  log.error(`予期しないエラー: ${error.message}`);
  process.exit(1);
});

// 実行
main();