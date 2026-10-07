-- Epcon Franchise Builder Summit (Oct 2026) company survey.
-- Run once in the Supabase SQL editor before deploying the /summit page.

create table if not exists public.summit_surveys (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  event         text not null default 'epcon-fall-2026',
  data          jsonb not null default '{}'::jsonb,
  status        text not null default 'in_progress' check (status in ('in_progress', 'submitted')),
  submitted_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (user_id, event)
);

alter table public.summit_surveys enable row level security;

-- Each signed-in user can read and write only their own survey.
-- The facilitator admin view and CSV export read all rows with the service role key.
drop policy if exists "summit_surveys_select_own" on public.summit_surveys;
create policy "summit_surveys_select_own" on public.summit_surveys
  for select using (auth.uid() = user_id);

drop policy if exists "summit_surveys_insert_own" on public.summit_surveys;
create policy "summit_surveys_insert_own" on public.summit_surveys
  for insert with check (auth.uid() = user_id);

drop policy if exists "summit_surveys_update_own" on public.summit_surveys;
create policy "summit_surveys_update_own" on public.summit_surveys
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
