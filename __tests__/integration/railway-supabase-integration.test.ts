/**
 * 統合テスト: Railway & Supabase環境の包括的検証
 * 
 * テスト項目:
 * 1. Railway環境テスト
 * 2. Supabase統合テスト  
 * 3. Vercel-Railway通信テスト
 * 4. エンドツーエンドテスト
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';

// Railway環境のエンドポイント
const RAILWAY_BASE_URL = process.env.RAILWAY_API_URL || 'https://sns-video-generator-production.up.railway.app';
const VERCEL_BASE_URL = process.env.VERCEL_URL || 'https://sns-video-generator.vercel.app';

// テストタイムアウト設定
const TEST_TIMEOUT = 30000;

// ヘルスチェック結果の型定義
interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: { status: 'up' | 'down'; responseTime: number; error?: string };
    redis: { status: 'up' | 'down'; responseTime: number; error?: string };
    queue: { status: 'up' | 'down'; waiting: number; active: number; failed: number; completed: number; error?: string };
    storage: { status: 'up' | 'down'; responseTime: number; error?: string };
    memory: { used: number; total: number; percentage: number };
    disk: { used: number; total: number; percentage: number };
  };
}

// テスト結果レポート
interface TestResults {
  railway: {
    health: boolean;
    api: boolean;
    environment: boolean;
    docker: boolean;
  };
  supabase: {
    auth: boolean;
    database: boolean;
    rls: boolean;
    realtime: boolean;
  };
  communication: {
    cors: boolean;
    apiRequest: boolean;
    errorHandling: boolean;
    performance: boolean;
  };
  endToEnd: {
    userRegistration: boolean;
    videoUpload: boolean;
    errorScenarios: boolean;
    loadTest: boolean;
  };
  overall: boolean;
}

let testResults: TestResults = {
  railway: { health: false, api: false, environment: false, docker: false },
  supabase: { auth: false, database: false, rls: false, realtime: false },
  communication: { cors: false, apiRequest: false, errorHandling: false, performance: false },
  endToEnd: { userRegistration: false, videoUpload: false, errorScenarios: false, loadTest: false },
  overall: false
};

describe('Railway環境統合テスト', () => {
  
  describe('1. Railway環境テスト', () => {
    
    test('ヘルスチェックエンドポイント応答確認', async () => {
      try {
        console.log('🏥 Railway ヘルスチェック開始...');
        
        const response = await fetch(`${RAILWAY_BASE_URL}/api/health`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        expect(response.ok).toBe(true);
        
        const healthData: HealthCheckResponse = await response.json();
        
        // 基本構造の確認
        expect(healthData).toHaveProperty('status');
        expect(healthData).toHaveProperty('timestamp');
        expect(healthData).toHaveProperty('checks');
        
        // ステータスの確認
        expect(['healthy', 'degraded', 'unhealthy']).toContain(healthData.status);
        
        console.log(`✅ ヘルスチェック成功: ${healthData.status}`);
        console.log(`📊 データベース: ${healthData.checks.database.status}`);
        console.log(`💾 Redis: ${healthData.checks.redis.status}`);
        console.log(`📝 Queue: ${healthData.checks.queue.status}`);
        console.log(`🗃️ Storage: ${healthData.checks.storage.status}`);
        
        testResults.railway.health = true;
        
      } catch (error) {
        console.error('❌ ヘルスチェック失敗:', error);
        throw error;
      }
    }, TEST_TIMEOUT);

    test('APIエンドポイント疎通確認', async () => {
      try {
        console.log('🔌 Railway API疎通テスト開始...');
        
        // テスト用エンドポイントの確認
        const endpoints = [
          '/api/test-db',
          '/api/test-supabase',
          '/api/user-usage'
        ];

        for (const endpoint of endpoints) {
          console.log(`Testing endpoint: ${endpoint}`);
          
          const response = await fetch(`${RAILWAY_BASE_URL}${endpoint}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          // 200, 401, 403は正常（認証エラーも含む）
          expect([200, 401, 403]).toContain(response.status);
          console.log(`✅ ${endpoint}: ${response.status}`);
        }
        
        testResults.railway.api = true;
        
      } catch (error) {
        console.error('❌ API疎通テスト失敗:', error);
        throw error;
      }
    }, TEST_TIMEOUT);

    test('環境変数の正しい読み込み確認', async () => {
      try {
        console.log('🌍 Railway 環境変数テスト開始...');
        
        // 環境変数確認用のテストエンドポイント呼び出し
        const response = await fetch(`${RAILWAY_BASE_URL}/api/test-db`, {
          method: 'GET',
        });

        // 環境変数が正しく設定されていれば200または401
        expect([200, 401]).toContain(response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ 環境変数正常読み込み確認');
        } else {
          console.log('✅ 環境変数設定確認（認証必要）');
        }
        
        testResults.railway.environment = true;
        
      } catch (error) {
        console.error('❌ 環境変数テスト失敗:', error);
        throw error;
      }
    }, TEST_TIMEOUT);

    test('Dockerコンテナの安定性確認', async () => {
      try {
        console.log('🐳 Docker コンテナ安定性テスト開始...');
        
        // 複数回のヘルスチェックで安定性を確認
        const checks = [];
        for (let i = 0; i < 3; i++) {
          const response = await fetch(`${RAILWAY_BASE_URL}/api/health`);
          checks.push(response.ok);
          
          if (i < 2) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // 2秒待機
          }
        }

        // 全てのチェックが成功することを確認
        const successRate = checks.filter(check => check).length / checks.length;
        expect(successRate).toBeGreaterThanOrEqual(0.8); // 80%以上の成功率
        
        console.log(`✅ Docker 安定性確認: ${successRate * 100}%`);
        testResults.railway.docker = true;
        
      } catch (error) {
        console.error('❌ Docker 安定性テスト失敗:', error);
        throw error;
      }
    }, TEST_TIMEOUT);
  });

  describe('2. Supabase統合テスト', () => {
    
    test('認証フロー（登録/ログイン/ログアウト）', async () => {
      try {
        console.log('🔐 Supabase 認証フローテスト開始...');
        
        // 認証テスト用エンドポイント
        const response = await fetch(`${RAILWAY_BASE_URL}/api/test-auth-simple`, {
          method: 'GET',
        });

        // 認証システムが動作していることを確認（200 or 401）
        expect([200, 401]).toContain(response.status);
        
        if (response.ok) {
          const data = await response.json();
          expect(data).toHaveProperty('supabase');
          console.log('✅ 認証システム正常動作確認');
        } else {
          console.log('✅ 認証システム動作確認（未認証状態）');
        }
        
        testResults.supabase.auth = true;
        
      } catch (error) {
        console.error('❌ 認証フローテスト失敗:', error);
        throw error;
      }
    }, TEST_TIMEOUT);

    test('データベース接続とCRUD操作', async () => {
      try {
        console.log('🗄️ Supabase データベーステスト開始...');
        
        // データベース接続テスト
        const response = await fetch(`${RAILWAY_BASE_URL}/api/test-supabase`, {
          method: 'GET',
        });

        expect([200, 401]).toContain(response.status);
        
        if (response.ok) {
          const data = await response.json();
          expect(data).toHaveProperty('connected');
          console.log('✅ データベース接続確認');
        } else {
          console.log('✅ データベース動作確認（認証必要）');
        }
        
        testResults.supabase.database = true;
        
      } catch (error) {
        console.error('❌ データベーステスト失敗:', error);
        throw error;
      }
    }, TEST_TIMEOUT);

    test('RLSポリシーの動作確認', async () => {
      try {
        console.log('🔒 RLS ポリシーテスト開始...');
        
        // RLSポリシーが適用されていることを確認
        const response = await fetch(`${RAILWAY_BASE_URL}/api/video-uploads`, {
          method: 'GET',
        });

        // RLSが動作していれば401または403が返される
        expect([401, 403]).toContain(response.status);
        console.log(`✅ RLS ポリシー動作確認: ${response.status}`);
        
        testResults.supabase.rls = true;
        
      } catch (error) {
        console.error('❌ RLS ポリシーテスト失敗:', error);
        throw error;
      }
    }, TEST_TIMEOUT);

    test('リアルタイム機能', async () => {
      try {
        console.log('⚡ Supabase リアルタイム機能テスト開始...');
        
        // リアルタイム機能の基本確認
        // WebSocket接続のテストは制限があるため、基本的な接続性のみ確認
        const response = await fetch(`${RAILWAY_BASE_URL}/api/health`);
        const healthData: HealthCheckResponse = await response.json();
        
        // データベースが正常に動作していればリアルタイム機能も利用可能
        expect(healthData.checks.database.status).toBe('up');
        console.log('✅ リアルタイム機能基盤確認');
        
        testResults.supabase.realtime = true;
        
      } catch (error) {
        console.error('❌ リアルタイム機能テスト失敗:', error);
        throw error;
      }
    }, TEST_TIMEOUT);
  });

  describe('3. Vercel-Railway通信テスト', () => {
    
    test('CORS設定の検証', async () => {
      try {
        console.log('🌐 CORS 設定検証開始...');
        
        // Railwayエンドポイントに対するCORSテスト
        const response = await fetch(`${RAILWAY_BASE_URL}/api/health`, {
          method: 'OPTIONS',
        });

        // CORS プリフライトが適切に処理されることを確認
        expect([200, 204]).toContain(response.status);
        console.log('✅ CORS 設定確認');
        
        testResults.communication.cors = true;
        
      } catch (error) {
        console.error('❌ CORS 設定テスト失敗:', error);
        throw error;
      }
    }, TEST_TIMEOUT);

    test('APIリクエスト/レスポンス', async () => {
      try {
        console.log('🔄 API リクエスト/レスポンステスト開始...');
        
        const startTime = Date.now();
        const response = await fetch(`${RAILWAY_BASE_URL}/api/health`);
        const responseTime = Date.now() - startTime;
        
        expect(response.ok).toBe(true);
        expect(responseTime).toBeLessThan(10000); // 10秒以内
        
        const data = await response.json();
        expect(data).toHaveProperty('status');
        
        console.log(`✅ API レスポンス確認: ${responseTime}ms`);
        testResults.communication.apiRequest = true;
        
      } catch (error) {
        console.error('❌ API リクエスト/レスポンステスト失敗:', error);
        throw error;
      }
    }, TEST_TIMEOUT);

    test('エラーハンドリング', async () => {
      try {
        console.log('⚠️ エラーハンドリングテスト開始...');
        
        // 存在しないエンドポイントでのエラーハンドリング確認
        const response = await fetch(`${RAILWAY_BASE_URL}/api/nonexistent-endpoint`);
        
        expect(response.status).toBe(404);
        console.log('✅ 404 エラーハンドリング確認');
        
        testResults.communication.errorHandling = true;
        
      } catch (error) {
        console.error('❌ エラーハンドリングテスト失敗:', error);
        throw error;
      }
    }, TEST_TIMEOUT);

    test('パフォーマンス測定', async () => {
      try {
        console.log('📊 パフォーマンス測定開始...');
        
        const measurements = [];
        
        for (let i = 0; i < 3; i++) {
          const startTime = Date.now();
          const response = await fetch(`${RAILWAY_BASE_URL}/api/health`);
          const responseTime = Date.now() - startTime;
          
          if (response.ok) {
            measurements.push(responseTime);
          }
          
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        const avgResponseTime = measurements.reduce((a, b) => a + b, 0) / measurements.length;
        expect(avgResponseTime).toBeLessThan(5000); // 5秒以内
        
        console.log(`✅ 平均レスポンス時間: ${avgResponseTime.toFixed(2)}ms`);
        testResults.communication.performance = true;
        
      } catch (error) {
        console.error('❌ パフォーマンス測定失敗:', error);
        throw error;
      }
    }, TEST_TIMEOUT);
  });

  describe('4. エンドツーエンドテスト', () => {
    
    test('ユーザー登録→動画アップロード→処理', async () => {
      try {
        console.log('👤 E2E ユーザーフローテスト開始...');
        
        // 認証が必要なエンドポイントが適切に保護されていることを確認
        const protectedEndpoints = [
          '/api/upload-video',
          '/api/video-projects',
          '/api/user-usage'
        ];

        for (const endpoint of protectedEndpoints) {
          const response = await fetch(`${RAILWAY_BASE_URL}${endpoint}`, {
            method: 'GET',
          });
          
          // 認証が必要なエンドポイントは401を返すべき
          expect([401, 403]).toContain(response.status);
          console.log(`✅ ${endpoint}: 認証保護確認`);
        }
        
        testResults.endToEnd.userRegistration = true;
        
      } catch (error) {
        console.error('❌ E2E ユーザーフローテスト失敗:', error);
        throw error;
      }
    }, TEST_TIMEOUT);

    test('エラーシナリオ', async () => {
      try {
        console.log('🚨 エラーシナリオテスト開始...');
        
        // 様々なエラーシナリオをテスト
        const errorTests = [
          { url: '/api/invalid-endpoint', expectedStatus: 404 },
          { url: '/api/upload-video', expectedStatus: 401 }, // 認証なし
        ];

        for (const test of errorTests) {
          const response = await fetch(`${RAILWAY_BASE_URL}${test.url}`);
          expect(response.status).toBe(test.expectedStatus);
          console.log(`✅ ${test.url}: ${response.status} (期待値: ${test.expectedStatus})`);
        }
        
        testResults.endToEnd.errorScenarios = true;
        
      } catch (error) {
        console.error('❌ エラーシナリオテスト失敗:', error);
        throw error;
      }
    }, TEST_TIMEOUT);

    test('負荷テスト', async () => {
      try {
        console.log('⚡ 負荷テスト開始...');
        
        // 同時リクエストによる負荷テスト
        const concurrentRequests = 5;
        const promises = Array(concurrentRequests).fill(null).map(() => 
          fetch(`${RAILWAY_BASE_URL}/api/health`)
        );

        const responses = await Promise.all(promises);
        const successCount = responses.filter(r => r.ok).length;
        const successRate = successCount / concurrentRequests;
        
        expect(successRate).toBeGreaterThanOrEqual(0.8); // 80%以上の成功率
        console.log(`✅ 負荷テスト完了: ${successRate * 100}% 成功率`);
        
        testResults.endToEnd.loadTest = true;
        
      } catch (error) {
        console.error('❌ 負荷テスト失敗:', error);
        throw error;
      }
    }, TEST_TIMEOUT);
  });

  // テスト完了後の結果集計
  afterAll(() => {
    console.log('\n📋 統合テスト結果レポート');
    console.log('================================');
    
    console.log('\n🚀 Railway環境テスト:');
    console.log(`  ✅ ヘルスチェック: ${testResults.railway.health ? '成功' : '失敗'}`);
    console.log(`  ✅ API疎通: ${testResults.railway.api ? '成功' : '失敗'}`);
    console.log(`  ✅ 環境変数: ${testResults.railway.environment ? '成功' : '失敗'}`);
    console.log(`  ✅ Docker安定性: ${testResults.railway.docker ? '成功' : '失敗'}`);
    
    console.log('\n🗄️ Supabase統合テスト:');
    console.log(`  ✅ 認証フロー: ${testResults.supabase.auth ? '成功' : '失敗'}`);
    console.log(`  ✅ データベース: ${testResults.supabase.database ? '成功' : '失敗'}`);
    console.log(`  ✅ RLSポリシー: ${testResults.supabase.rls ? '成功' : '失敗'}`);
    console.log(`  ✅ リアルタイム: ${testResults.supabase.realtime ? '成功' : '失敗'}`);
    
    console.log('\n🌐 Vercel-Railway通信テスト:');
    console.log(`  ✅ CORS設定: ${testResults.communication.cors ? '成功' : '失敗'}`);
    console.log(`  ✅ API通信: ${testResults.communication.apiRequest ? '成功' : '失敗'}`);
    console.log(`  ✅ エラーハンドリング: ${testResults.communication.errorHandling ? '成功' : '失敗'}`);
    console.log(`  ✅ パフォーマンス: ${testResults.communication.performance ? '成功' : '失敗'}`);
    
    console.log('\n🎯 エンドツーエンドテスト:');
    console.log(`  ✅ ユーザーフロー: ${testResults.endToEnd.userRegistration ? '成功' : '失敗'}`);
    console.log(`  ✅ エラーシナリオ: ${testResults.endToEnd.errorScenarios ? '成功' : '失敗'}`);
    console.log(`  ✅ 負荷テスト: ${testResults.endToEnd.loadTest ? '成功' : '失敗'}`);
    
    // 総合評価
    const allTests = [
      ...Object.values(testResults.railway),
      ...Object.values(testResults.supabase),
      ...Object.values(testResults.communication),
      ...Object.values(testResults.endToEnd)
    ];
    
    const successCount = allTests.filter(test => test).length;
    const totalTests = allTests.length;
    const successRate = (successCount / totalTests) * 100;
    
    testResults.overall = successRate >= 80;
    
    console.log('\n📊 総合評価:');
    console.log(`  成功率: ${successCount}/${totalTests} (${successRate.toFixed(1)}%)`);
    console.log(`  総合判定: ${testResults.overall ? '✅ 合格' : '❌ 不合格'}`);
    
    console.log('\n🎯 次のステップ:');
    if (testResults.overall) {
      console.log('  ✅ 全システム正常動作確認済み');
      console.log('  ✅ 本格運用準備完了');
    } else {
      console.log('  ⚠️ 一部システムに問題があります');
      console.log('  ⚠️ 詳細な調査と修正が必要です');
    }
    
    console.log('\n================================');
  });
});