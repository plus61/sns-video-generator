// S級シンプリシティ評価エンジン
export const scoreSimplicity = (code) => {
  const lines = code.split('\n').filter(l => l.trim());
  const complexity = lines.filter(l => l.includes('if') || l.includes('for')).length;
  const score = Math.max(0, 100 - lines.length * 5 - complexity * 10);
  const grade = score >= 90 ? 'S' : score >= 70 ? 'A' : score >= 50 ? 'B' : 'C';
  return { score, grade, lines: lines.length, feedback: grade === 'S' ? '完璧！' : '簡素化の余地あり' };
};