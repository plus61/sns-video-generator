#!/usr/bin/env node

// Create Test User for Development
console.log('👤 Creating Test User for SNS Video Generator')
console.log('='.repeat(50))

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function createTestUser() {
  console.log('🔧 Creating test user...')

  try {
    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: 'test@sns-video-generator.com',
      password: 'test123456',
      email_confirm: true
    })

    if (authError) {
      console.log('ℹ️  Auth user might already exist:', authError.message)
      
      // Try to get existing user
      const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers()
      if (listError) throw listError
      
      const existingUser = users.users.find(u => u.email === 'test@sns-video-generator.com')
      if (existingUser) {
        console.log('✅ Found existing user:', existingUser.id)
        
        // Create/update profile
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .upsert({
            id: existingUser.id,
            email: 'test@sns-video-generator.com',
            full_name: 'Test User',
            subscription_tier: 'free'
          })
        
        if (profileError) {
          console.log('❌ Profile creation error:', profileError.message)
        } else {
          console.log('✅ Profile created/updated successfully')
        }
        
        console.log('\n🎯 Test User Credentials:')
        console.log('Email: test@sns-video-generator.com')
        console.log('Password: test123456')
        console.log('User ID:', existingUser.id)
        return
      }
    } else {
      console.log('✅ Auth user created:', authData.user.id)
      
      // Create profile
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: 'test@sns-video-generator.com',
          full_name: 'Test User',
          subscription_tier: 'free'
        })
      
      if (profileError) {
        console.log('❌ Profile creation error:', profileError.message)
      } else {
        console.log('✅ Profile created successfully')
      }
      
      console.log('\n🎯 Test User Credentials:')
      console.log('Email: test@sns-video-generator.com')
      console.log('Password: test123456')
      console.log('User ID:', authData.user.id)
    }

    // Test creating a sample video upload
    console.log('\n📹 Creating sample video upload...')
    const { data: uploadData, error: uploadError } = await supabaseAdmin
      .from('video_uploads')
      .insert({
        user_id: authData?.user?.id || existingUser?.id,
        title: 'Sample YouTube Video',
        youtube_url: 'https://youtu.be/cjtmDEG-B7U',
        status: 'pending',
        metadata: { 
          test: true,
          description: 'Sample video for testing platform functionality'
        }
      })
      .select()

    if (uploadError) {
      console.log('❌ Sample upload error:', uploadError.message)
    } else {
      console.log('✅ Sample video upload created')
    }

    console.log('\n🚀 Test user setup complete!')
    console.log('You can now sign in to the platform with these credentials.')
    
  } catch (error) {
    console.error('❌ Error creating test user:', error.message)
  }
}

createTestUser().catch(console.error)