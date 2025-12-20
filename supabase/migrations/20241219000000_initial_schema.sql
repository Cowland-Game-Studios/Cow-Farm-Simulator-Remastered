-- Migration: Initial Schema for Cow Farm Simulator
-- Created: 2024-12-19
-- Description: Creates game_saves table with RLS policies for cloud save functionality

-- ============================================
-- GAME SAVES TABLE
-- ============================================

create table if not exists public.game_saves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  saved_at bigint not null,
  version integer not null,
  game_state jsonb not null,
  config_overrides jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table public.game_saves is 'Stores player game saves with offline-first sync support';
comment on column public.game_saves.saved_at is 'Client timestamp (ms since epoch) for conflict resolution';
comment on column public.game_saves.version is 'Save format version for migrations';
comment on column public.game_saves.game_state is 'Full game state (cows, resources, inventory, stats, achievements)';
comment on column public.game_saves.config_overrides is 'User config overrides from cownsole commands';

-- ============================================
-- INDEXES
-- ============================================

-- One save per user (enables upsert on conflict)
create unique index if not exists game_saves_user_id_idx 
  on public.game_saves(user_id);

-- Faster timestamp queries for sync
create index if not exists game_saves_saved_at_idx 
  on public.game_saves(saved_at);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

alter table public.game_saves enable row level security;

-- Users can only read their own saves
create policy "Users can view own saves"
  on public.game_saves
  for select
  using (auth.uid() = user_id);

-- Users can only insert their own saves
create policy "Users can insert own saves"
  on public.game_saves
  for insert
  with check (auth.uid() = user_id);

-- Users can only update their own saves
create policy "Users can update own saves"
  on public.game_saves
  for update
  using (auth.uid() = user_id);

-- Users can only delete their own saves
create policy "Users can delete own saves"
  on public.game_saves
  for delete
  using (auth.uid() = user_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security definer
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_game_saves_updated
  before update on public.game_saves
  for each row
  execute function public.handle_updated_at();

