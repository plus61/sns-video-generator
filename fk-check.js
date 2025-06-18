#!/usr/bin/env node

console.log('🔍 外部キー制約分析開始');
console.log('============================================================');

// 現在のスキーマから外部キー制約を確認
const foreignKeys = [
  {
    table: 'profiles',
    column: 'id',
    references: 'auth.users(id)',
    onDelete: 'CASCADE',
    current: 'NOT SPECIFIED'
  },
  {
    table: 'video_projects', 
    column: 'user_id',
    references: 'auth.users(id)', 
    onDelete: 'CASCADE',
    current: 'CASCADE'
  },
  {
    table: 'user_usage',
    column: 'user_id', 
    references: 'auth.users(id)',
    onDelete: 'CASCADE', 
    current: 'CASCADE'
  },
  {
    table: 'video_uploads',
    column: 'user_id',
    references: 'auth.users(id)',
    onDelete: 'CASCADE',
    current: 'CASCADE'
  },
  {
    table: 'video_segments',
    column: 'video_upload_id',
    references: 'video_uploads(id)',
    onDelete: 'CASCADE', 
    current: 'CASCADE'
  }
];

console.log('📋 外部キー制約状況:');
foreignKeys.forEach((fk, i) => {
  const status = fk.current === fk.onDelete ? '✅' : '⚠️';
  console.log(`${i+1}. ${fk.table}.${fk.column} -> ${fk.references}`);
  console.log(`   現在: ${fk.current} | 推奨: ${fk.onDelete} ${status}`);
});

console.log('\n🔧 修正が必要な制約:');
const needsFix = foreignKeys.filter(fk => fk.current !== fk.onDelete);

if (needsFix.length === 0) {
  console.log('✅ すべての外部キー制約は適切に設定されています');
} else {
  needsFix.forEach(fk => {
    console.log(`⚠️  ${fk.table}.${fk.column}`);
    console.log(`   ALTER TABLE ${fk.table} DROP CONSTRAINT IF EXISTS ${fk.table}_${fk.column}_fkey;`);
    console.log(`   ALTER TABLE ${fk.table} ADD CONSTRAINT ${fk.table}_${fk.column}_fkey`);
    console.log(`     FOREIGN KEY (${fk.column}) REFERENCES ${fk.references} ON DELETE ${fk.onDelete};`);
  });
}

// 特に重要な profiles テーブルの制約修正SQL
const profilesFixSQL = `
-- profiles テーブルの外部キー制約修正
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey 
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
`;

console.log('\n🎯 profiles テーブル修正SQL:');
console.log(profilesFixSQL);

console.log('\n📊 外部キー制約分析完了');