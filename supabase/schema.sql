-- Run this in Supabase SQL Editor

-- Profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  plan text default 'free' check (plan in ('free', 'pro', 'team')),
  stripe_customer_id text,
  stripe_subscription_id text,
  google_access_token text,
  google_refresh_token text,
  slack_access_token text,
  notion_access_token text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Briefs table
create table if not exists public.briefs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  content text not null,
  meetings_count int default 0,
  emails_count int default 0,
  voice_url text,
  created_at timestamptz default now()
);

-- Tasks table
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  priority text default 'medium' check (priority in ('high', 'medium', 'low')),
  completed boolean default false,
  due_date date,
  source text default 'manual',
  created_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RLS policies
alter table public.profiles enable row level security;
alter table public.briefs enable row level security;
alter table public.tasks enable row level security;

create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can view own briefs" on public.briefs for select using (auth.uid() = user_id);
create policy "Users can insert own briefs" on public.briefs for insert with check (auth.uid() = user_id);
create policy "Users can manage own tasks" on public.tasks for all using (auth.uid() = user_id);
