const { exec } = require('child_process');
const path = require('path');

// シンプルなYouTubeダウンロードテスト
const testUrl = 'https://www.youtube.com/watch?v=jNQXAC9IVRw';
const outputPath = path.join(__dirname, 'test-download.mp4');

console.log('Testing direct yt-dlp download...');
console.log('URL:', testUrl);
console.log('Output:', outputPath);

const ytDlpPath = '/Users/yuichiroooosuger/.pyenv/shims/yt-dlp';
const command = `${ytDlpPath} "${testUrl}" -o "${outputPath}" -f "best[height<=480]/best" --no-check-certificate`;

console.log('Command:', command);

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error('Error:', error.message);
    console.error('Stderr:', stderr);
    return;
  }
  
  console.log('Success!');
  console.log('Output:', stdout);
  
  // ファイルサイズ確認
  const fs = require('fs');
  try {
    const stats = fs.statSync(outputPath);
    console.log('File size:', (stats.size / 1024 / 1024).toFixed(2), 'MB');
  } catch (e) {
    console.error('File not found');
  }
});