create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.source_texts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_type text not null,
  customer_name text not null,
  contact_name text,
  project_name text,
  communicated_at timestamptz not null,
  timezone text not null,
  raw_text text,
  raw_text_deleted_at timestamptz,
  analysis_status text not null default 'pending' check (analysis_status in ('pending', 'analyzed', 'failed', 'confirmed')),
  ai_model text,
  ai_response jsonb,
  ai_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.commitments (
  id uuid primary key default gen_random_uuid(),
  source_text_id uuid not null references public.source_texts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'draft' check (status in ('draft', 'confirmed', 'done', 'deleted')),
  direction text not null check (direction in ('i_owe', 'they_owe')),
  title text not null,
  details text not null default '',
  owner_label text not null,
  counterparty_label text not null,
  evidence text not null,
  due_date date,
  due_time time,
  due_timezone text,
  suggested_follow_up_date date,
  confidence numeric not null default 0 check (confidence >= 0 and confidence <= 1),
  confidence_reason text not null default '',
  risk_flags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  confirmed_at timestamptz,
  completed_at timestamptz
);

create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  commitment_id uuid references public.commitments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reminder_type text not null check (reminder_type in ('daily_digest', 'due', 'follow_up')),
  scheduled_for date not null,
  sent_at timestamptz,
  channel text not null default 'email' check (channel in ('email')),
  payload jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique (commitment_id, reminder_type, scheduled_for)
);

create index if not exists source_texts_user_created_idx on public.source_texts(user_id, created_at desc);
create index if not exists commitments_user_status_due_idx on public.commitments(user_id, status, due_date);
create index if not exists commitments_source_idx on public.commitments(source_text_id);
create index if not exists reminders_user_scheduled_idx on public.reminders(user_id, scheduled_for, sent_at);

drop trigger if exists source_texts_set_updated_at on public.source_texts;
create trigger source_texts_set_updated_at
before update on public.source_texts
for each row execute function public.set_updated_at();

drop trigger if exists commitments_set_updated_at on public.commitments;
create trigger commitments_set_updated_at
before update on public.commitments
for each row execute function public.set_updated_at();

alter table public.source_texts enable row level security;
alter table public.commitments enable row level security;
alter table public.reminders enable row level security;

drop policy if exists "source_texts_select_own" on public.source_texts;
create policy "source_texts_select_own"
on public.source_texts for select
using (auth.uid() = user_id);

drop policy if exists "source_texts_insert_own" on public.source_texts;
create policy "source_texts_insert_own"
on public.source_texts for insert
with check (auth.uid() = user_id);

drop policy if exists "source_texts_update_own" on public.source_texts;
create policy "source_texts_update_own"
on public.source_texts for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "source_texts_delete_own" on public.source_texts;
create policy "source_texts_delete_own"
on public.source_texts for delete
using (auth.uid() = user_id);

drop policy if exists "commitments_select_own" on public.commitments;
create policy "commitments_select_own"
on public.commitments for select
using (auth.uid() = user_id);

drop policy if exists "commitments_insert_own" on public.commitments;
create policy "commitments_insert_own"
on public.commitments for insert
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.source_texts source
    where source.id = source_text_id
      and source.user_id = auth.uid()
  )
);

drop policy if exists "commitments_update_own" on public.commitments;
create policy "commitments_update_own"
on public.commitments for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "commitments_delete_own" on public.commitments;
create policy "commitments_delete_own"
on public.commitments for delete
using (auth.uid() = user_id);

drop policy if exists "reminders_select_own" on public.reminders;
create policy "reminders_select_own"
on public.reminders for select
using (auth.uid() = user_id);

drop policy if exists "reminders_insert_own" on public.reminders;
create policy "reminders_insert_own"
on public.reminders for insert
with check (auth.uid() = user_id);

drop policy if exists "reminders_update_own" on public.reminders;
create policy "reminders_update_own"
on public.reminders for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "reminders_delete_own" on public.reminders;
create policy "reminders_delete_own"
on public.reminders for delete
using (auth.uid() = user_id);
