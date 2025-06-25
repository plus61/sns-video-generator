const youtubedl = require('youtube-dl-exec');

// 最もシンプルなテスト
youtubedl('https://www.youtube.com/watch?v=jNQXAC9IVRw', {
  dumpSingleJson: true,
  noCheckCertificates: true,
  noWarnings: true,
  preferFreeFormats: true,
})
.then(output => {
  console.log('✅ Success! Video info:');
  console.log('Title:', output.title);
  console.log('Duration:', output.duration, 'seconds');
  console.log('Formats available:', output.formats.length);
})
.catch(err => {
  console.error('❌ Error:', err.message);
  console.error('Stderr:', err.stderr);
});