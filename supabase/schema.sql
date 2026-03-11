create extension if not exists pgcrypto;

create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text not null,
  isbn text not null unique,
  cover_url text,
  summary text,
  category text,
  rarity text not null check (rarity in ('Rare', 'Super Rare', 'Hero', 'Myth', 'Legend')),
  created_at timestamptz not null default now()
);

create table if not exists public.user_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id uuid not null references public.cards(id) on delete cascade,
  obtained_at timestamptz not null default now()
);

create table if not exists public.gacha_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id uuid not null references public.cards(id) on delete cascade,
  rarity text not null check (rarity in ('Rare', 'Super Rare', 'Hero', 'Myth', 'Legend')),
  created_at timestamptz not null default now()
);

create table if not exists public.daily_gacha (
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  pulls_used integer not null default 0 check (pulls_used >= 0 and pulls_used <= 5),
  primary key (user_id, date)
);

create index if not exists idx_user_cards_user_id on public.user_cards(user_id);
create index if not exists idx_user_cards_card_id on public.user_cards(card_id);
create index if not exists idx_gacha_logs_user_id on public.gacha_logs(user_id);
create index if not exists idx_daily_gacha_user_date on public.daily_gacha(user_id, date);

alter table public.cards enable row level security;
alter table public.user_cards enable row level security;
alter table public.gacha_logs enable row level security;
alter table public.daily_gacha enable row level security;

drop policy if exists "cards_select_public" on public.cards;
create policy "cards_select_public"
on public.cards
for select
to anon, authenticated
using (true);

drop policy if exists "user_cards_select_own" on public.user_cards;
create policy "user_cards_select_own"
on public.user_cards
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "user_cards_insert_own" on public.user_cards;
create policy "user_cards_insert_own"
on public.user_cards
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "gacha_logs_select_own" on public.gacha_logs;
create policy "gacha_logs_select_own"
on public.gacha_logs
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "gacha_logs_insert_own" on public.gacha_logs;
create policy "gacha_logs_insert_own"
on public.gacha_logs
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "daily_gacha_select_own" on public.daily_gacha;
create policy "daily_gacha_select_own"
on public.daily_gacha
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "daily_gacha_insert_own" on public.daily_gacha;
create policy "daily_gacha_insert_own"
on public.daily_gacha
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "daily_gacha_update_own" on public.daily_gacha;
create policy "daily_gacha_update_own"
on public.daily_gacha
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create or replace function public.get_card_ownership_stats(target_card_id uuid)
returns table (
  owners bigint,
  total_users bigint,
  ownership_rate numeric
)
language sql
security definer
set search_path = public, auth
as $$
with owner_count as (
  select count(distinct uc.user_id)::bigint as owners
  from public.user_cards uc
  where uc.card_id = target_card_id
),
active_users as (
  select count(*)::bigint as total_users
  from auth.users u
  where u.deleted_at is null
)
select
  owner_count.owners,
  active_users.total_users,
  case
    when active_users.total_users = 0 then 0
    else round((owner_count.owners::numeric / active_users.total_users::numeric) * 100, 1)
  end as ownership_rate
from owner_count, active_users;
$$;

revoke all on function public.get_card_ownership_stats(uuid) from public;
grant execute on function public.get_card_ownership_stats(uuid) to anon, authenticated;
