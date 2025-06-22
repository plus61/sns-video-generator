import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing required environment variables:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.error('- SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? '✓' : '✗')
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function applyStoragePolicies() {
  console.log('🔐 Applying RLS policies for videos bucket...')

  const policies = [
    {
      name: 'Users can upload videos to own folder',
      definition: `
        CREATE POLICY "Users can upload videos to own folder" ON storage.objects
        FOR INSERT WITH CHECK (
          bucket_id = 'videos' AND
          auth.uid()::text = (storage.foldername(name))[1]
        );
      `
    },
    {
      name: 'Users can view own videos',
      definition: `
        CREATE POLICY "Users can view own videos" ON storage.objects
        FOR SELECT USING (
          bucket_id = 'videos' AND
          auth.uid()::text = (storage.foldername(name))[1]
        );
      `
    },
    {
      name: 'Users can update own videos',
      definition: `
        CREATE POLICY "Users can update own videos" ON storage.objects
        FOR UPDATE USING (
          bucket_id = 'videos' AND
          auth.uid()::text = (storage.foldername(name))[1]
        );
      `
    },
    {
      name: 'Users can delete own videos',
      definition: `
        CREATE POLICY "Users can delete own videos" ON storage.objects
        FOR DELETE USING (
          bucket_id = 'videos' AND
          auth.uid()::text = (storage.foldername(name))[1]
        );
      `
    }
  ]

  let successCount = 0
  let failureCount = 0

  for (const policy of policies) {
    try {
      const { data, error } = await supabaseAdmin.rpc('exec_sql', {
        sql: policy.definition
      }).single()

      if (error) {
        // Check if policy already exists
        if (error.message?.includes('already exists')) {
          console.log(`⚠️  Policy "${policy.name}" already exists - skipping`)
        } else {
          console.error(`❌ Failed to create policy "${policy.name}":`, error.message)
          failureCount++
        }
      } else {
        console.log(`✅ Created policy: "${policy.name}"`)
        successCount++
      }
    } catch (error) {
      console.error(`❌ Error creating policy "${policy.name}":`, error)
      failureCount++
    }
  }

  // Grant permissions
  try {
    const grantSql = `
      GRANT ALL ON storage.objects TO authenticated;
      GRANT ALL ON storage.buckets TO authenticated;
    `
    
    const { error } = await supabaseAdmin.rpc('exec_sql', {
      sql: grantSql
    }).single()

    if (error) {
      console.error('❌ Failed to grant permissions:', error)
    } else {
      console.log('✅ Granted storage permissions to authenticated users')
    }
  } catch (error) {
    console.error('❌ Error granting permissions:', error)
  }

  console.log('\n📊 Summary:')
  console.log(`   Policies created: ${successCount}`)
  console.log(`   Failures: ${failureCount}`)

  if (failureCount > 0) {
    console.log('\n⚠️  Some policies could not be created automatically.')
    console.log('   Please apply them manually in Supabase Dashboard:')
    console.log('   1. Go to SQL Editor')
    console.log('   2. Run the create-storage-bucket.sql script')
  } else {
    console.log('\n🎉 All policies applied successfully!')
  }
}

// Run the function
applyStoragePolicies()
  .catch(error => {
    console.error('❌ Fatal error:', error)
    console.log('\n⚠️  Automated policy application failed.')
    console.log('   Please apply policies manually in Supabase Dashboard:')
    console.log('   1. Go to SQL Editor')
    console.log('   2. Run the create-storage-bucket.sql script')
    process.exit(1)
  })