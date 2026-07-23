-- Lets signed-in users bookmark job matches so cards persist across sessions.
create table if not exists public.saved_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  company text not null,
  url text not null,
  reason text not null default '',
  created_at timestamptz not null default now(),
  unique (user_id, url)
);

alter table public.saved_jobs enable row level security;

create policy "Users can view their own saved jobs"
  on public.saved_jobs for select
  using (auth.uid() = user_id);

create policy "Users can insert their own saved jobs"
  on public.saved_jobs for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own saved jobs"
  on public.saved_jobs for delete
  using (auth.uid() = user_id);
