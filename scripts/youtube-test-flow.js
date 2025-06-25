#!/usr/bin/env node

/**
 * YouTube動画の完全なテストフロー
 * 1. YouTube URLから動画情報を取得
 * 2. 動画をダウンロード
 * 3. アップロードしてVideo IDを取得
 * 4. 動画を3つの10秒クリップに分割
 */

async function testYouTubeFlow() {
  console.log('🎬 YouTube動画分割テスト開始\n');
  
  // テスト用の短い動画URL（19秒の動画）
  const youtubeUrl = 'https://www.youtube.com/watch?v=jNQXAC9IVRw'; // "Me at the zoo"
  console.log('📹 テスト動画:', youtubeUrl);
  console.log('（世界初のYouTube動画、19秒）\n');
  
  try {
    // Step 1: YouTube情報取得
    console.log('1️⃣ YouTube動画情報を取得中...');
    const infoResponse = await fetch('http://localhost:3000/api/upload-youtube', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: youtubeUrl })
    });
    
    if (!infoResponse.ok) {
      const error = await infoResponse.text();
      throw new Error(`YouTube取得エラー: ${error}`);
    }
    
    const videoData = await infoResponse.json();
    console.log('✅ 動画情報取得成功!');
    console.log('   - タイトル:', videoData.title || '不明');
    console.log('   - Video ID:', videoData.videoId);
    console.log('   - 長さ:', videoData.duration || '不明', '\n');
    
    // Step 2: 動画分割
    console.log('2️⃣ 動画を3つの10秒クリップに分割中...');
    const splitResponse = await fetch('http://localhost:3000/api/split-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videoId: videoData.videoId,
        clipDuration: 10,
        maxClips: 3
      })
    });
    
    if (!splitResponse.ok) {
      const error = await splitResponse.text();
      throw new Error(`分割エラー: ${error}`);
    }
    
    const splitResult = await splitResponse.json();
    console.log('✅ 分割成功!');
    console.log(`   - ${splitResult.clips.length}個のクリップを生成`);
    
    // クリップ情報を表示
    splitResult.clips.forEach((clip, index) => {
      console.log(`\n   📹 クリップ${index + 1}:`);
      console.log(`      - 時間: ${clip.start}秒 - ${clip.end}秒`);
      console.log(`      - URL: ${clip.url}`);
    });
    
    console.log('\n🎉 テスト完了！動画が正常に分割されました。');
    console.log('\n💡 次のステップ:');
    console.log('   1. ブラウザで http://localhost:3000/test/split にアクセス');
    console.log(`   2. Video IDを入力: ${videoData.videoId}`);
    console.log('   3. 生成されたクリップを確認');
    
  } catch (error) {
    console.error('\n❌ エラーが発生しました:', error.message);
    console.error('\n💡 トラブルシューティング:');
    console.error('   1. 開発サーバーが起動しているか確認 (npm run dev)');
    console.error('   2. YouTube API キーが正しく設定されているか確認');
    console.error('   3. Supabaseの設定が正しいか確認');
  }
}

// 実行
testYouTubeFlow();