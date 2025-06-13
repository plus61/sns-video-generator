const { gpt4vService } = require('./src/lib/gpt4v');
const { whisperService } = require('./src/lib/whisper');

async function testGPT4VIntegration() {
  console.log('🧪 GPT-4V Integration Test Starting...\n');

  try {
    // Test 1: Frame extraction simulation
    console.log('Test 1: Frame Extraction');
    const mockVideoUrl = 'https://example.com/video.mp4';
    const duration = 30;
    
    const frames = await gpt4vService.extractKeyFrames(mockVideoUrl, duration, 5);
    console.log(`✅ Extracted ${frames.length} frames`);
    console.log(`   Frames: ${frames.slice(0, 3).join(', ')}...\n`);

    // Test 2: Frame analysis simulation
    console.log('Test 2: Frame Analysis');
    const frameAnalyses = await gpt4vService.analyzeFrames(frames);
    console.log(`✅ Analyzed ${frameAnalyses.length} frames`);
    console.log(`   Sample analysis: ${JSON.stringify(frameAnalyses[0], null, 2)}\n`);

    // Test 3: Visual cues extraction
    console.log('Test 3: Visual Cues Extraction');
    const visualCues = gpt4vService.extractVisualCues(frameAnalyses);
    console.log(`✅ Extracted ${visualCues.length} visual cues`);
    console.log(`   Sample cue: ${JSON.stringify(visualCues[0] || 'No cues', null, 2)}\n`);

    // Test 4: Content segments creation (mock)
    console.log('Test 4: Content Segments Enhancement');
    const mockTranscription = {
      text: "これは動画の自動生成された転写テキストです。実際の実装では、FFmpegを使用して動画から音声を抽出し、Whisper APIで転写を行います。",
      segments: [
        {
          id: 0,
          seek: 0,
          start: 0.0,
          end: 15.0,
          text: "これは動画の自動生成された転写テキストです。",
          tokens: [],
          temperature: 0.0,
          avg_logprob: -0.3,
          compression_ratio: 1.2,
          no_speech_prob: 0.1
        },
        {
          id: 1,
          seek: 1500,
          start: 15.0,
          end: 30.0,
          text: "実際の実装では、FFmpegを使用して動画から音声を抽出し、Whisper APIで転写を行います。",
          tokens: [],
          temperature: 0.0,
          avg_logprob: -0.25,
          compression_ratio: 1.1,
          no_speech_prob: 0.05
        }
      ],
      language: 'ja',
      duration: 30.0
    };

    const contentSegments = whisperService.extractContentSegments(mockTranscription);
    console.log(`✅ Created ${contentSegments.length} content segments`);
    
    // Test 5: Enhanced segments with visual data
    const enhancedSegments = gpt4vService.enhanceSegmentsWithVisualData(
      contentSegments, 
      frameAnalyses, 
      visualCues
    );
    console.log(`✅ Enhanced ${enhancedSegments.length} segments with visual data`);
    console.log(`   Sample enhanced segment:`, JSON.stringify({
      text: enhancedSegments[0]?.text,
      visual_engagement_score: enhancedSegments[0]?.visual_engagement_score,
      combined_engagement_score: enhancedSegments[0]?.combined_engagement_score,
      visual_cues_count: enhancedSegments[0]?.visual_cues?.length || 0,
      enhanced_analysis: enhancedSegments[0]?.enhanced_analysis
    }, null, 2));

    console.log('\n🎉 All GPT-4V integration tests passed!');
    console.log('\n📊 Test Summary:');
    console.log(`   - Frame extraction: ${frames.length} frames`);
    console.log(`   - Frame analysis: ${frameAnalyses.length} analyses`);
    console.log(`   - Visual cues: ${visualCues.length} cues`);
    console.log(`   - Enhanced segments: ${enhancedSegments.length} segments`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testGPT4VIntegration();