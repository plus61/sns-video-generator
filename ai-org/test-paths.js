const fs = require('fs');
const path = require('path');

// Test TypeScript path resolution
const testPaths = [
  '/Users/yuichiroooosuger/sns-video-generator/sns-video-generator/src/components/ui/Header.tsx',
  '/Users/yuichiroooosuger/sns-video-generator/sns-video-generator/src/utils/supabase/client.ts',
  '/Users/yuichiroooosuger/sns-video-generator/sns-video-generator/src/lib/supabase.ts',
  '/Users/yuichiroooosuger/sns-video-generator/sns-video-generator/src/hooks/useAuth.ts'
];

console.log('🔍 TypeScript Path Resolution Test');
console.log('===================================');

testPaths.forEach(testPath => {
  try {
    if (fs.existsSync(testPath)) {
      console.log(`✅ ${testPath.split('/').pop()} - EXISTS`);
    } else {
      console.log(`❌ ${testPath.split('/').pop()} - MISSING`);
    }
  } catch (error) {
    console.log(`🚨 ${testPath.split('/').pop()} - ERROR: ${error.message}`);
  }
});

console.log('\n📊 Import Pattern Analysis');
console.log('===========================');

// Check common import patterns
const commonImports = [
  '@/components/ui/Header',
  '@/utils/supabase/client', 
  '@/lib/supabase',
  '@/hooks/useAuth',
  '@/types'
];

commonImports.forEach(importPath => {
  const fullPath = path.join('/Users/yuichiroooosuger/sns-video-generator/sns-video-generator/src', importPath.replace('@/', ''));
  const tsxPath = fullPath + '.tsx';
  const tsPath = fullPath + '.ts';
  const indexPath = path.join(fullPath, 'index.ts');
  
  if (fs.existsSync(tsxPath)) {
    console.log(`✅ ${importPath} → ${tsxPath.split('/').pop()}`);
  } else if (fs.existsSync(tsPath)) {
    console.log(`✅ ${importPath} → ${tsPath.split('/').pop()}`);
  } else if (fs.existsSync(indexPath)) {
    console.log(`✅ ${importPath} → index.ts`);
  } else {
    console.log(`❌ ${importPath} → NOT FOUND`);
  }
});