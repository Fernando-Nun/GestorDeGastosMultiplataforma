-- Replit PostgreSQL schema for Ember.
-- This schema covers local authentication, sessions, password recovery,
-- and the user's recurring expenses.

create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists app_sessions (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  user_id uuid not null references app_users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists app_sessions_token_hash_idx on app_sessions (token_hash);
create index if not exists app_sessions_user_id_idx on app_sessions (user_id);

create table if not exists password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  user_id uuid not null references app_users(id) on delete cascade,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  service_name text not null check (length(trim(service_name)) > 0),
  payment_day integer not null check (payment_day between 1 and 31),
  card_label text,
  amount numeric(10,2) not null check (amount > 0),
  currency text not null default 'MXN' check (currency in ('MXN', 'USD')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists expenses_user_payment_day_idx
  on expenses (user_id, payment_day);