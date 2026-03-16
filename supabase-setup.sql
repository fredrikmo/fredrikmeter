-- Run this in the Supabase SQL Editor to set up the database

-- 1. Create tables
create table if not exists questions (
  id text primary key,
  text text not null,
  type text not null check (type in ('word_cloud', 'multiple_choice')),
  options jsonb,
  is_active boolean default false,
  created_at timestamptz default now()
);

create table if not exists responses (
  id uuid primary key default gen_random_uuid(),
  question_id text references questions(id) on delete cascade,
  answer text not null,
  created_at timestamptz default now()
);

-- 2. Create index for faster response lookups
create index if not exists idx_responses_question_id on responses(question_id);

-- 3. Enable Realtime on the responses table
alter publication supabase_realtime add table responses;

-- 4. Enable Row Level Security (RLS) with open policies for anonymous access
alter table questions enable row level security;
alter table responses enable row level security;

-- Allow anyone to read questions
create policy "Questions are publicly readable"
  on questions for select
  using (true);

-- Allow anyone to update questions (for admin activate/deactivate)
create policy "Questions are publicly updatable"
  on questions for update
  using (true);

-- Allow anyone to insert questions (for seed)
create policy "Questions are publicly insertable"
  on questions for insert
  with check (true);

-- Allow anyone to read responses
create policy "Responses are publicly readable"
  on responses for select
  using (true);

-- Allow anyone to insert responses (for voting)
create policy "Responses are publicly insertable"
  on responses for insert
  with check (true);

-- Allow anyone to delete responses (for admin reset)
create policy "Responses are publicly deletable"
  on responses for delete
  using (true);
