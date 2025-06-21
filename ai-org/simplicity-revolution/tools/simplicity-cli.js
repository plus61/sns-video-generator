#!/usr/bin/env node

// Simplicity Revolution CLI（8行）
import { scoreSimplicity } from './scorer.js';
import fs from 'fs';

const [,, command, ...args] = process.argv;
if (command === 'score') {
  const code = fs.readFileSync(args[0], 'utf8');
  const result = scoreSimplicity(code);
  console.log(`${result.grade}級 (${result.score}点) - ${result.lines}行 - ${result.feedback}`);
} else if (command === 'tdd') {
  console.log(`// ${args[0]}のテスト\ntest('${args[0]}', () => {\n  expect(${args[0]}('input')).toBe('output');\n});\n\n// 実装\nexport const ${args[0]} = (input) => 'output';`);
} else {
  console.log('使い方: simplicity score <file> | simplicity tdd <function>');
}