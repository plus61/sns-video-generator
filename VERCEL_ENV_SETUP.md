# Vercel Environment Variables Setup

## 🚨 Critical Fix for NextAuth.js Error

The Supabase schema error is caused by missing or incorrect environment variables in Vercel production environment.

## 📋 Required Environment Variables

### 1. NextAuth.js Configuration
```bash
NEXTAUTH_URL=https://sns-video-generator.vercel.app
NEXTAUTH_SECRET=generate_a_secure_32_character_secret_key
```

### 2. Supabase Configuration
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. OAuth Providers (Optional)
```bash
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
GITHUB_ID=your_github_oauth_app_id
GITHUB_SECRET=your_github_oauth_app_secret
```

## 🛠️ Setup Instructions

### Step 1: Generate NEXTAUTH_SECRET
```bash
# Generate a secure secret
openssl rand -base64 32
```

### Step 2: Set Vercel Environment Variables
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `sns-video-generator`
3. Go to Settings → Environment Variables
4. Add each variable:
   - Name: `NEXTAUTH_URL`
   - Value: `https://sns-video-generator.vercel.app`
   - Environment: Production

### Step 3: Redeploy
After setting all environment variables:
1. Go to Deployments tab
2. Click "Redeploy" on the latest deployment
3. Select "Use existing Build Cache" = OFF

## 🔍 Verify Environment Variables

Check if variables are set correctly:
```bash
# In Vercel Function Logs, you should see:
NEXTAUTH_URL: https://sns-video-generator.vercel.app
NEXTAUTH_SECRET: [REDACTED]
NEXT_PUBLIC_SUPABASE_URL: https://your-project.supabase.co
```

## 🚀 Expected Result

After proper configuration:
- ✅ No more Supabase schema errors
- ✅ Successful authentication with test credentials:
  - Email: `test@sns-video-generator.com`
  - Password: `test123456`
- ✅ Proper session management
- ✅ Protected routes working correctly

## 🆘 Troubleshooting

### Common Issues:
1. **Schema Error**: Usually means `SUPABASE_SERVICE_ROLE_KEY` is missing
2. **JWT Secret Error**: Missing or invalid `NEXTAUTH_SECRET`
3. **Redirect Error**: Incorrect `NEXTAUTH_URL`

### Debug Mode:
Add to Vercel environment variables:
```bash
NEXTAUTH_DEBUG=true
```

This will provide detailed logs for authentication flow debugging.