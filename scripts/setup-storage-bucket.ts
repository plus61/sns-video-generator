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

async function checkAndCreateVideoBucket() {
  console.log('🔍 Checking videos bucket status...')

  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabaseAdmin
      .storage
      .listBuckets()

    if (listError) {
      console.error('❌ Error listing buckets:', listError)
      return false
    }

    const videoBucketExists = buckets?.some(bucket => bucket.id === 'videos')
    
    if (videoBucketExists) {
      console.log('✅ Videos bucket already exists!')
      
      // List files in the bucket to verify access
      const { data: files, error: filesError } = await supabaseAdmin
        .storage
        .from('videos')
        .list('', { limit: 1 })
      
      if (filesError) {
        console.error('⚠️  Bucket exists but cannot access files:', filesError)
      } else {
        console.log('✅ Bucket is accessible and ready for use')
      }
      
      return true
    }

    console.log('📦 Videos bucket not found. Creating...')

    // Create the bucket
    const { data: createData, error: createError } = await supabaseAdmin
      .storage
      .createBucket('videos', {
        public: true
      })

    if (createError) {
      console.error('❌ Error creating bucket:', createError)
      return false
    }

    console.log('✅ Videos bucket created successfully!')
    console.log('📝 Note: RLS policies need to be applied via SQL in Supabase Dashboard')
    console.log('   Run the SQL script: create-storage-bucket.sql')

    return true

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return false
  }
}

// Run the check
checkAndCreateVideoBucket()
  .then(success => {
    if (success) {
      console.log('\n🎉 Storage setup complete!')
      console.log('Next steps:')
      console.log('1. Go to Supabase Dashboard > SQL Editor')
      console.log('2. Run the create-storage-bucket.sql script to set up RLS policies')
      console.log('3. Test video uploads in your application')
    } else {
      console.log('\n❌ Storage setup failed. Please check the errors above.')
      process.exit(1)
    }
  })
  .catch(error => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })