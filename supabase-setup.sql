-- Run this once in your Supabase project's SQL Editor
-- (dashboard -> your project -> SQL Editor -> New query -> paste -> Run)

create table if not exists profiles (
  user_id uuid references auth.users(id) on delete cascade primary key,
  profile jsonb,
  applications jsonb not null default '[]'::jsonb,
  edit_signals jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Users can view their own profile row"
  on profiles for select
  using (auth.uid() = user_id);

create policy "Users can insert their own profile row"
  on profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own profile row"
  on profiles for update
  using (auth.uid() = user_id);
