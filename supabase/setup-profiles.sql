-- Create profiles table with proper constraints and relationships
create table public.profiles (
  id uuid not null references auth.users on delete cascade,
  first_name text,
  last_name text,
  username text unique,
  avatar_url text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  primary key (id),
  constraint username_length check (char_length(username) >= 3)
);

-- Set up Row Level Security (RLS)
alter table public.profiles enable row level security;

-- Policies for profiles table
create policy "Public profiles are viewable by everyone." 
on profiles for select 
using (true);

create policy "Users can insert their own profile." 
on profiles for insert 
with check ((select auth.uid()) = id);

create policy "Users can update own profile." 
on profiles for update 
using ((select auth.uid()) = id);

-- This trigger automatically creates a profile entry when a new user signs up via Supabase Auth.
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, first_name, last_name)
  values (new.id, new.raw_user_meta_data->>'first_name', new.raw_user_meta_data->>'last_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Set up Storage for avatars!
insert into storage.buckets (id, name)
  values ('avatars', 'avatars');

-- Set up access controls for storage.
create policy "Avatar images are publicly accessible." 
on storage.objects for select 
using (bucket_id = 'avatars');

create policy "Anyone can upload an avatar." 
on storage.objects for insert 
with check (bucket_id = 'avatars');

create policy "Anyone can update their own avatar." 
on storage.objects for update 
using (auth.uid() = owner) 
with check (bucket_id = 'avatars');