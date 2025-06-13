# Database Setup Instructions

This document provides instructions for setting up the database schema in Supabase.

## Method 1: Using Supabase Web UI (Recommended)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to the SQL Editor
3. Copy and paste the entire content from `supabase/schema.sql`
4. Click "Run" to execute the schema

## Method 2: Using psql (if you have PostgreSQL client installed)

```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@db.mpviqmngxjcvvakylseg.supabase.co:5432/postgres" -f supabase/schema.sql
```

## What the Schema Creates

### Tables:
- **users**: User account information (managed by NextAuth)
- **video_projects**: User's video generation projects
- **video_templates**: Pre-built video templates 
- **user_usage**: Tracks user's monthly video generation limits

### Default Data:
- 3 default video templates (Social Media Short, YouTube Short, Square Post)

### Features:
- UUID primary keys
- Automatic timestamp updates
- Foreign key relationships
- Usage tracking and limits

## Verify Setup

After running the schema, verify the tables exist:

1. Go to Table Editor in Supabase dashboard
2. You should see: users, video_projects, video_templates, user_usage
3. The video_templates table should contain 3 default templates

## Environment Variables

Make sure your `.env.local` file contains the correct Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://mpviqmngxjcvvakylseg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```