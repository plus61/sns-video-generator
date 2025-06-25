#!/usr/bin/env node

/**
 * Next.js API環境確認テスト
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

console.log('=== Next.js API環境確認 ===\n');

// 1. プロセス情報
console.log('📍 プロセス情報:');
console.log('- Process CWD:', process.cwd());
console.log('- __dirname:', __dirname);
console.log('- __filename:', __filename);
console.log('- NODE_ENV:', process.env.NODE_ENV);

// 2. パス情報
console.log('\n📂 パス情報:');
console.log('- PATH:', process.env.PATH?.split(':').slice(0, 5).join(':') + '...');
console.log('- /tmp存在確認:', fs.existsSync('/tmp') ? '✅' : '❌');
console.log('- /tmp書き込み可能:', (() => {
  try {
    fs.writeFileSync('/tmp/test-write.txt', 'test');
    fs.unlinkSync('/tmp/test-write.txt');
    return '✅';
  } catch {
    return '❌';
  }
})());

// 3. youtube-dl-exec確認
console.log('\n🎬 youtube-dl-exec確認:');
try {
  const youtubedl = require('youtube-dl-exec');
  console.log('- モジュール読み込み: ✅');
  
  // バイナリパスを探す
  const possiblePaths = [
    '/usr/local/bin/yt-dlp',
    '/usr/bin/yt-dlp',
    '/opt/homebrew/bin/yt-dlp',
    path.join(process.env.HOME, '.pyenv/shims/yt-dlp')
  ];
  
  for (const binPath of possiblePaths) {
    if (fs.existsSync(binPath)) {
      console.log(`- yt-dlp found at: ${binPath} ✅`);
      break;
    }
  }
  
} catch (error) {
  console.log('- モジュール読み込み: ❌', error.message);
}

// 4. yt-dlpコマンド確認
console.log('\n🔧 yt-dlpコマンド確認:');
try {
  const version = execSync('yt-dlp --version', { encoding: 'utf8' }).trim();
  console.log('- yt-dlpバージョン:', version);
  
  const which = execSync('which yt-dlp', { encoding: 'utf8' }).trim();
  console.log('- yt-dlpパス:', which);
} catch (error) {
  console.log('- yt-dlpコマンド: ❌ 利用不可');
}

// 5. Node.jsモジュール解決
console.log('\n📦 モジュール解決:');
console.log('- require.resolve paths:');
console.log(module.paths.slice(0, 3).map(p => '  ' + p).join('\n'));

// 6. 権限確認
console.log('\n🔐 権限確認:');
try {
  const tmpStats = fs.statSync('/tmp');
  console.log('- /tmp権限:', (tmpStats.mode & parseInt('777', 8)).toString(8));
  console.log('- 実効ユーザー:', process.getuid ? process.getuid() : 'N/A');
  console.log('- 実効グループ:', process.getgid ? process.getgid() : 'N/A');
} catch (error) {
  console.log('- 権限確認エラー:', error.message);
}

console.log('\n✅ 環境確認完了');