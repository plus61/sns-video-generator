# Supabase Storage Setup Guide

## Overview
This guide explains how to set up the Supabase storage bucket for video uploads in the SNS Video Generator project.

## Setup Steps

### 1. Create the Videos Bucket
Run the setup script to create the videos bucket:

```bash
npx tsx scripts/setup-storage-bucket.ts
```

This script will:
- Check if the videos bucket exists
- Create the bucket if it doesn't exist
- Configure it as a public bucket

### 2. Apply RLS Policies
After creating the bucket, you need to apply Row Level Security (RLS) policies. You have two options:

#### Option A: Manual Setup (Recommended)
1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and run the contents of `create-storage-bucket.sql`

#### Option B: Automated Setup (Experimental)
```bash
npx tsx scripts/apply-storage-policies.ts
```

Note: The automated approach may not work if the `exec_sql` RPC function is not available in your Supabase instance.

## RLS Policies Explained

The following policies are applied to ensure users can only access their own videos:

1. **Upload Policy**: Users can upload videos only to their own folder (folder name must match their user ID)
2. **View Policy**: Users can only view videos in their own folder
3. **Update Policy**: Users can only update videos in their own folder
4. **Delete Policy**: Users can only delete videos in their own folder

## File Structure
When videos are uploaded, they follow this structure:
```
videos/
  ├── {user-id}/
  │   ├── video1.mp4
  │   ├── video2.mp4
  │   └── ...
```

## Verification
To verify the setup is complete:

1. Run the setup script again:
   ```bash
   npx tsx scripts/setup-storage-bucket.ts
   ```
   
   You should see:
   ```
   ✅ Videos bucket already exists!
   ✅ Bucket is accessible and ready for use
   ```

2. Check in Supabase Dashboard:
   - Go to Storage section
   - You should see a "videos" bucket
   - Check the Policies tab to verify RLS policies are applied

## Troubleshooting

### Error: "The object exceeded the maximum allowed size"
This error occurs when trying to set file size limits during bucket creation. The script has been updated to create the bucket without size limits.

### Error: "Missing Supabase environment variables"
Ensure your `.env.local` file contains:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### RLS Policies Not Working
If automated policy application fails:
1. Go to Supabase Dashboard > SQL Editor
2. Run the SQL commands from `create-storage-bucket.sql` manually
3. Verify policies are created in Storage > Policies

## Next Steps
Once the storage bucket is set up:
1. Test video uploads through the application
2. Monitor storage usage in Supabase Dashboard
3. Configure any additional bucket settings as needed