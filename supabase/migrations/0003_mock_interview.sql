-- Mock Interview Agent: additive tables only, existing tables untouched.
create extension if not exists pgcrypto;

create table if not exists public.interview_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  resume_id uuid, -- reserved for a future saved-resumes table; not enforced yet
  resume_text text not null,
  job_description text not null,
  role_criteria jsonb,
  role_pain text,
  red_flags jsonb,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists public.interview_turns (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.interview_sessions (id) on delete cascade,
  role text not null,
  content text not null,
  turn_type text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.interview_evaluations (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references public.interview_sessions (id) on delete cascade,
  verdict text not null,
  verdict_reason text,
  criteria_scores jsonb,
  weak_spots jsonb,
  skill_defense jsonb,
  created_at timestamptz not null default now()
);

-- Laid down now for the future feedback loop (section 4 of the outcomes tracking
-- plan); no aggregation logic yet, just CRUD via /api/outcomes.
create table if not exists public.application_outcomes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  resume_version_id uuid,
  job_title text,
  company text,
  outcome text not null,
  source text not null default 'manual',
  created_at timestamptz not null default now()
);

alter table public.interview_sessions enable row level security;
alter table public.interview_turns enable row level security;
alter table public.interview_evaluations enable row level security;
alter table public.application_outcomes enable row level security;

create policy "Users can view their own interview sessions"
  on public.interview_sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own interview sessions"
  on public.interview_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own interview sessions"
  on public.interview_sessions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can view turns from their own sessions"
  on public.interview_turns for select
  using (exists (
    select 1 from public.interview_sessions s
    where s.id = interview_turns.session_id and s.user_id = auth.uid()
  ));

create policy "Users can insert turns into their own sessions"
  on public.interview_turns for insert
  with check (exists (
    select 1 from public.interview_sessions s
    where s.id = interview_turns.session_id and s.user_id = auth.uid()
  ));

create policy "Users can view evaluations of their own sessions"
  on public.interview_evaluations for select
  using (exists (
    select 1 from public.interview_sessions s
    where s.id = interview_evaluations.session_id and s.user_id = auth.uid()
  ));

create policy "Users can insert evaluations for their own sessions"
  on public.interview_evaluations for insert
  with check (exists (
    select 1 from public.interview_sessions s
    where s.id = interview_evaluations.session_id and s.user_id = auth.uid()
  ));

create policy "Users can view their own application outcomes"
  on public.application_outcomes for select
  using (auth.uid() = user_id);

create policy "Users can insert their own application outcomes"
  on public.application_outcomes for insert
  with check (auth.uid() = user_id);
