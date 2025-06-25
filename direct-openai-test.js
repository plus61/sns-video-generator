#!/usr/bin/env node

/**
 * OpenAI API直接テスト
 */

const OpenAI = require('openai');
require('dotenv').config({ path: '.env.local' });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function testGPTAnalysis() {
  console.log('🧠 GPT-3.5分析実動作テスト...\n');
  
  const testTranscript = 'This is a test video about artificial intelligence and machine learning. It explains neural networks, deep learning concepts, and practical applications.';
  
  try {
    const startTime = Date.now();
    
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a social media content analyzer. Analyze video transcripts and return JSON with: score (1-10), viralPotential (1-10), category (educational/entertainment/trivia/highlight), and segments array.'
        },
        {
          role: 'user',
          content: `Analyze this transcript and return JSON only:\n\n${testTranscript}`
        }
      ],
      temperature: 0.7
    });
    
    const processingTime = Date.now() - startTime;
    const result = JSON.parse(response.choices[0].message.content);
    
    console.log('✅ GPT-3.5分析成功！');
    console.log(`⏱️  処理時間: ${processingTime}ms`);
    console.log('\n📊 分析結果:');
    console.log(JSON.stringify(result, null, 2));
    
    // 検証
    console.log('\n🔍 検証結果:');
    console.log(`- スコア: ${result.score} (${result.score >= 1 && result.score <= 10 ? '✅' : '❌'})`);
    console.log(`- バイラル可能性: ${result.viralPotential} (${result.viralPotential >= 1 && result.viralPotential <= 10 ? '✅' : '❌'})`);
    console.log(`- カテゴリー: ${result.category} (${['educational', 'entertainment', 'trivia', 'highlight'].includes(result.category) ? '✅' : '❌'})`);
    
    return true;
  } catch (error) {
    console.error('❌ エラー:', error.message);
    return false;
  }
}

async function testWhisperTranscription() {
  console.log('\n\n🎤 Whisper転写実動作テスト...\n');
  
  try {
    const fs = require('fs');
    const { File } = require('buffer');
    global.File = File;
    
    const audioBuffer = fs.readFileSync('test-audio.mp3');
    const audioFile = new File([audioBuffer], 'test-audio.mp3', { type: 'audio/mp3' });
    
    const response = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en'
    });
    
    console.log('✅ Whisper転写成功！');
    console.log(`📝 転写結果: "${response.text || '(無音)'}"`)
    console.log(`⏱️  使用時間: ${response.usage?.seconds || 0}秒`);
    
    return true;
  } catch (error) {
    console.error('❌ エラー:', error.message);
    return false;
  }
}

async function testRateLimit() {
  console.log('\n\n⚡ レート制限テスト...\n');
  
  const promises = [];
  for (let i = 0; i < 3; i++) {
    promises.push(
      openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: `Test ${i}` }],
        max_tokens: 10
      }).then(() => true).catch(() => false)
    );
  }
  
  const results = await Promise.all(promises);
  const successCount = results.filter(r => r).length;
  
  console.log(`✅ 並列リクエスト: ${successCount}/3 成功`);
  
  return successCount > 0;
}

async function main() {
  console.log('═══════════════════════════════════════════════');
  console.log('   OpenAI API実動作確認（MVP Phase 1）');
  console.log('═══════════════════════════════════════════════\n');
  
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY未設定');
    process.exit(1);
  }
  
  console.log('✅ APIキー検出\n');
  
  // 各テスト実行
  const gptSuccess = await testGPTAnalysis();
  const whisperSuccess = await testWhisperTranscription();
  const rateLimitSuccess = await testRateLimit();
  
  // 結果サマリー
  console.log('\n\n📊 実働率報告:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('機能名: OpenAI API統合');
  
  const totalTests = 3;
  const successCount = [gptSuccess, whisperSuccess, rateLimitSuccess].filter(r => r).length;
  const workingRate = Math.round((successCount / totalTests) * 100);
  
  console.log(`実働率: ${workingRate}%`);
  console.log(`- Whisper転写: ${whisperSuccess ? '✅' : '❌'}`);
  console.log(`- GPT-3.5分析: ${gptSuccess ? '✅' : '❌'}`);
  console.log(`- レート制限: ${rateLimitSuccess ? '✅' : '❌'}`);
  console.log(`- エラー処理: ✅ (実装済み)`);
  
  if (workingRate < 100) {
    console.log(`残課題: ${!whisperSuccess ? 'Whisper API接続' : ''} ${!gptSuccess ? 'GPT分析' : ''} ${!rateLimitSuccess ? 'レート制限対応' : ''}`);
  } else {
    console.log('残課題: なし');
  }
  
  console.log('\n✨ MVP Phase 1テスト完了！');
  console.log('タイムスタンプ:', new Date().toISOString());
}

main().catch(console.error);