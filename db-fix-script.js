#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

console.log('🔧 Supabase データベース修正開始');
console.log('============================================================');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase環境変数が不足しています');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.log('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

console.log('✅ 環境変数確認完了');
console.log('URL:', supabaseUrl.substring(0, 30) + '...');
console.log('Service Key:', supabaseServiceKey.substring(0, 20) + '...');

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// 実行すべきSQL文
const sqlStatements = {
  profileFunction: `
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS trigger AS $$
    BEGIN
      INSERT INTO public.profiles (id, email, created_at)
      VALUES (new.id, new.email, now());
      RETURN new;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `,
  
  profileTrigger: `
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  `,
  
  enableRLS: `
    ALTER TABLE video_uploads ENABLE ROW LEVEL SECURITY;
    ALTER TABLE video_segments ENABLE ROW LEVEL SECURITY;
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
  `,
  
  videoUploadsPolicy: `
    DROP POLICY IF EXISTS "Users can view own videos" ON video_uploads;
    DROP POLICY IF EXISTS "Users can insert own videos" ON video_uploads;
    CREATE POLICY "Users can view own videos" ON video_uploads
      FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert own videos" ON video_uploads
      FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update own videos" ON video_uploads
      FOR UPDATE USING (auth.uid() = user_id);
  `,
  
  videoSegmentsPolicy: `
    DROP POLICY IF EXISTS "Users can view own segments" ON video_segments;
    DROP POLICY IF EXISTS "Users can insert own segments" ON video_segments;
    CREATE POLICY "Users can view own segments" ON video_segments
      FOR SELECT USING (auth.uid() = (SELECT user_id FROM video_uploads WHERE id = video_upload_id));
    CREATE POLICY "Users can insert own segments" ON video_segments
      FOR INSERT WITH CHECK (auth.uid() = (SELECT user_id FROM video_uploads WHERE id = video_upload_id));
    CREATE POLICY "Users can update own segments" ON video_segments
      FOR UPDATE USING (auth.uid() = (SELECT user_id FROM video_uploads WHERE id = video_upload_id));
  `,
  
  profilesPolicy: `
    DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
    CREATE POLICY "Users can view own profile" ON profiles
      FOR SELECT USING (auth.uid() = id);
    CREATE POLICY "Users can update own profile" ON profiles
      FOR UPDATE USING (auth.uid() = id);
  `
};

async function executeSQL() {
  console.log('\n📋 実行予定SQL一覧:');
  
  Object.entries(sqlStatements).forEach(([name, sql]) => {
    console.log(`\n${name}:`);
    console.log(sql.trim());
  });
  
  console.log('\n⚠️  手動実行が必要:');
  console.log('1. https://supabase.com/dashboard にアクセス');
  console.log('2. プロジェクトを選択');
  console.log('3. SQL Editor を開く');
  console.log('4. 上記SQLを順番に実行');
  
  // テスト接続
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.log('\n❌ データベース接続テスト失敗:', error.message);
    } else {
      console.log('\n✅ データベース接続テスト成功');
      console.log('プロファイル数:', data);
    }
  } catch (error) {
    console.error('❌ 接続エラー:', error.message);
  }
}

executeSQL().catch(console.error);