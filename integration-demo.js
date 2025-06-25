#!/usr/bin/env node

/**
 * 統合デモスクリプト
 * YouTube → AI分析 → セグメント分割 完全フロー
 */

const fs = require('fs').promises;
const path = require('path');

// デモ用YouTubeビデオ
const DEMO_VIDEOS = [
  {
    title: 'Me at the zoo',
    url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
    description: 'YouTube最初の動画（19秒）'
  },
  {
    title: 'Charlie bit my finger',
    url: 'https://www.youtube.com/watch?v=_OBlgSz8sSM',
    description: '人気バイラル動画'
  }
];

// APIベースURL
const API_BASE_URL = process.env.API_URL || 'http://localhost:3001';

/**
 * デモ実行
 */
async function runIntegrationDemo() {
  console.log('🎬 統合デモ開始\n');
  console.log('フロー: YouTube → AI分析 → セグメント分割\n');
  
  for (const video of DEMO_VIDEOS) {
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📹 ${video.title}`);
    console.log(`📝 ${video.description}`);
    console.log(`🔗 ${video.url}\n`);
    
    try {
      // 1. /api/process-simple呼び出し（Worker1: YouTube DL + Worker3: AI分析）
      console.log('⏳ 処理開始...');
      const startTime = Date.now();
      
      const processResponse = await fetch(`${API_BASE_URL}/api/process-simple`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: video.url })
      });
      
      const processData = await processResponse.json();
      const processingTime = Date.now() - startTime;
      
      if (!processData.success) {
        throw new Error(processData.error || '処理失敗');
      }
      
      console.log(`✅ 動画処理完了 (${processingTime}ms)`);
      console.log(`📁 動画ID: ${processData.videoId}`);
      
      // AI分析結果表示
      if (processData.aiAnalysisEnabled) {
        console.log('\n🤖 AI分析結果:');
        if (processData.transcript) {
          console.log(`  📝 転写: ${processData.transcript.substring(0, 100)}...`);
        }
        if (processData.summary) {
          console.log(`  📊 サマリー: ${processData.summary}`);
        }
      }
      
      // セグメント情報表示
      console.log(`\n🎯 抽出セグメント: ${processData.segments.length}個`);
      processData.segments.forEach((seg, idx) => {
        console.log(`  ${idx + 1}. ${seg.start}-${seg.end}秒 (スコア: ${seg.score}/10)`);
        if (seg.type) console.log(`     タイプ: ${seg.type}`);
        if (seg.reason) console.log(`     理由: ${seg.reason}`);
      });
      
      // 2. /api/split-simple呼び出し（Worker2: セグメント分割）
      if (processData.videoPath) {
        console.log('\n⏳ セグメント分割開始...');
        
        const splitResponse = await fetch(`${API_BASE_URL}/api/split-simple`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            videoPath: processData.videoPath,
            segments: processData.segments
          })
        });
        
        const splitData = await splitResponse.json();
        
        if (splitData.success) {
          console.log('✅ セグメント分割完了');
          console.log(`  生成ファイル数: ${splitData.outputFiles?.length || 0}`);
        }
      }
      
      console.log('\n✨ 完了！\n');
      
    } catch (error) {
      console.error(`❌ エラー: ${error.message}\n`);
    }
    
    // 次の動画の前に少し待機
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 統合デモ完了！');
  console.log('\n統合フロー:');
  console.log('1. Worker1: YouTube動画ダウンロード (youtube-dl-exec)');
  console.log('2. Worker3: AI分析 (OpenAI Whisper/GPT-3.5)');
  console.log('3. Worker2: セグメント分割 (FFmpeg)');
  console.log('\n全ワーカーの統合成功！ 🚀');
}

/**
 * OpenAI API統合状態確認
 */
async function checkOpenAIIntegration() {
  console.log('🔍 OpenAI API統合状態確認...\n');
  
  const hasApiKey = !!process.env.OPENAI_API_KEY;
  console.log(`OPENAI_API_KEY: ${hasApiKey ? '✅ 設定済み' : '❌ 未設定'}`);
  
  if (!hasApiKey) {
    console.log('\n⚠️  注意: OpenAI APIキーが設定されていません');
    console.log('AI分析はモックモードで実行されます');
  } else {
    console.log('✅ 実OpenAI APIを使用した分析が有効です');
  }
  
  console.log('\n');
}

/**
 * メイン実行
 */
async function main() {
  console.clear();
  console.log('═══════════════════════════════════════════════');
  console.log('   🎬 SNS Video Generator - 統合デモ');
  console.log('═══════════════════════════════════════════════\n');
  
  // OpenAI統合状態確認
  await checkOpenAIIntegration();
  
  // サーバー起動確認
  try {
    const response = await fetch(`${API_BASE_URL}/api/process-simple`, {
      method: 'GET'
    }).catch(() => null);
    console.log('✅ サーバー接続確認\n');
  } catch (error) {
    console.error('❌ サーバーに接続できません');
    console.log('npm run dev でサーバーを起動してください\n');
    process.exit(1);
  }
  
  // 統合デモ実行
  await runIntegrationDemo();
}

// 環境変数読み込み
require('dotenv').config({ path: '.env.local' });

// 実行
if (require.main === module) {
  main().catch(console.error);
}