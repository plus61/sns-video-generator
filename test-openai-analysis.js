#!/usr/bin/env node

/**
 * OpenAI API分析実動作テスト
 */

// 環境変数読み込み
require('dotenv').config({ path: '.env.local' });

// simple-ai-analyzer.tsの関数を使用
const { analyzeContent } = require('./src/lib/simple-ai-analyzer');

async function testAnalysis() {
  console.log('🧠 GPT分析実動作テスト開始...\n');
  
  const testTranscript = 'This is a test video about artificial intelligence and machine learning. It explains neural networks, deep learning concepts, and practical applications in modern technology.';
  
  try {
    console.log('📝 テスト転写テキスト:');
    console.log(testTranscript);
    console.log('\n⏳ 分析中...');
    
    const startTime = Date.now();
    const result = await analyzeContent(testTranscript);
    const processingTime = Date.now() - startTime;
    
    console.log('\n✅ 分析成功！');
    console.log(`⏱️  処理時間: ${processingTime}ms`);
    console.log('\n📊 分析結果:');
    console.log(JSON.stringify(result, null, 2));
    
    // 結果検証
    console.log('\n🔍 検証結果:');
    console.log(`- スコア範囲: ${result.score >= 1 && result.score <= 10 ? '✅ 正常' : '❌ 異常'}`);
    console.log(`- バイラル可能性: ${result.viralPotential >= 1 && result.viralPotential <= 10 ? '✅ 正常' : '❌ 異常'}`);
    console.log(`- カテゴリー: ${['educational', 'entertainment', 'trivia', 'highlight'].includes(result.category) ? '✅ 正常' : '❌ 異常'}`);
    console.log(`- セグメント数: ${result.segments.length > 0 ? '✅ 正常' : '❌ 異常'}`);
    
    return true;
  } catch (error) {
    console.error('\n❌ エラー:', error.message);
    return false;
  }
}

// APIキー未設定時のテスト
async function testWithoutApiKey() {
  console.log('\n\n🔑 APIキー未設定時テスト...');
  
  const originalKey = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  
  try {
    await analyzeContent('Test without API key');
    console.log('❌ エラーが発生しませんでした');
    return false;
  } catch (error) {
    console.log('✅ 期待通りエラー発生:', error.message);
    return true;
  } finally {
    process.env.OPENAI_API_KEY = originalKey;
  }
}

// メイン実行
async function main() {
  console.log('═══════════════════════════════════════════════');
  console.log('   OpenAI API実動作確認テスト');
  console.log('═══════════════════════════════════════════════\n');
  
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY環境変数が設定されていません');
    process.exit(1);
  }
  
  // 通常の分析テスト
  const analysisSuccess = await testAnalysis();
  
  // APIキー未設定時テスト
  const errorHandlingSuccess = await testWithoutApiKey();
  
  console.log('\n\n📊 最終結果:');
  console.log(`- GPT分析: ${analysisSuccess ? '✅ 成功' : '❌ 失敗'}`);
  console.log(`- エラー処理: ${errorHandlingSuccess ? '✅ 成功' : '❌ 失敗'}`);
  
  console.log('\n✨ テスト完了！');
  console.log('タイムスタンプ:', new Date().toISOString());
}

main().catch(console.error);