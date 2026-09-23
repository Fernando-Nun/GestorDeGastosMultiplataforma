-- Run this in your Supabase SQL editor at https://app.supabase.com
-- Project → SQL Editor → New query

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  service_name text not null,
  payment_day integer not null check (payment_day between 1 and 31),
  card_label text,
  amount numeric(10,2) not null,
  currency text not null default 'MXN',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table expenses enable row level security;

create policy "Users manage own expenses"
  on expenses for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
