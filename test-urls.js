/**
 * 統合テスト用YouTubeビデオリスト
 * 各カテゴリーの多様な動画で品質検証
 */

const testVideos = [
  // 教育系コンテンツ
  {
    category: '教育',
    url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
    title: 'Me at the zoo',
    duration: '19秒',
    description: 'YouTube最初の動画（短時間テスト用）'
  },
  {
    category: '教育',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    title: 'Never Gonna Give You Up',
    duration: '3分33秒',
    description: '音楽コンテンツ分析テスト'
  },
  
  // エンターテイメント
  {
    category: 'エンタメ',
    url: 'https://www.youtube.com/watch?v=9bZkp7q19f0',
    title: 'GANGNAM STYLE',
    duration: '4分12秒',
    description: 'K-POP・ダンス動画分析'
  },
  {
    category: 'エンタメ',
    url: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
    title: 'Despacito',
    duration: '4分41秒',
    description: 'スペイン語音楽コンテンツ'
  },
  
  // ゲーム実況
  {
    category: 'ゲーム',
    url: 'https://www.youtube.com/watch?v=cPJUBQd-PNM',
    title: 'Minecraft Gameplay',
    duration: '約10分',
    description: 'ゲーム実況・解説動画'
  },
  
  // Vlog・日常
  {
    category: 'Vlog',
    url: 'https://www.youtube.com/watch?v=Ct6BUPvE2sM',
    title: 'Draw My Life',
    duration: '約5分',
    description: 'パーソナルストーリー分析'
  },
  
  // ニュース・時事
  {
    category: 'ニュース',
    url: 'https://www.youtube.com/watch?v=W1ilCy6XrmI',
    title: 'TED Talk Sample',
    duration: '約15分',
    description: 'プレゼンテーション形式'
  },
  
  // 料理・レシピ
  {
    category: '料理',
    url: 'https://www.youtube.com/watch?v=ZJy1ajvMU1k',
    title: 'Cooking Tutorial',
    duration: '約8分',
    description: 'ハウツー系コンテンツ'
  },
  
  // スポーツ
  {
    category: 'スポーツ',
    url: 'https://www.youtube.com/watch?v=kZlXWp6vFdE',
    title: 'Sports Highlights',
    duration: '約7分',
    description: 'ハイライト・モーメント分析'
  },
  
  // 科学・技術
  {
    category: '科学技術',
    url: 'https://www.youtube.com/watch?v=0VGW8lD6gKg',
    title: 'Science Experiment',
    duration: '約12分',
    description: '実験・解説動画の分析'
  }
];

// テスト実行用ヘルパー関数
const getTestVideosByCategory = (category) => {
  return testVideos.filter(video => video.category === category);
};

const getRandomTestVideo = () => {
  return testVideos[Math.floor(Math.random() * testVideos.length)];
};

// バッチテスト用（処理時間測定）
const getPerformanceTestSet = () => {
  return testVideos.slice(0, 5); // 最初の5本で性能テスト
};

module.exports = {
  testVideos,
  getTestVideosByCategory,
  getRandomTestVideo,
  getPerformanceTestSet
};