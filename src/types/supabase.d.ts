// Supabase type definitions
export interface User {
  id: string
  email?: string
  created_at?: string
  updated_at?: string
}

export interface Profile {
  id: string
  first_name?: string
  last_name?: string
  username?: string
  avatar_url?: string
  updated_at: string
}