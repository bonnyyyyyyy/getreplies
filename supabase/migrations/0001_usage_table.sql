-- Tracks free-tier resume/job-match usage per user for the paywall.
create table if not exists public.usage (
  user_id uuid primary key references auth.users (id) on delete cascade,
  resume_uses_free integer not null default 0,
  is_subscribed boolean not null default false,
  last_reset_date timestamptz not null default now()
);

alter table public.usage enable row level security;

create policy "Users can view their own usage"
  on public.usage for select
  using (auth.uid() = user_id);

create policy "Users can insert their own usage"
  on public.usage for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own usage"
  on public.usage for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
