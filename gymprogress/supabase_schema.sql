-- ============================================================================
-- GymProgress — Supabase (PostgreSQL) Production Schema v1.0
-- Pronto para SaaS, Sincronização Multi-Aparelho e Modo Personal Trainer
-- Como usar: Cole todo este arquivo no SQL Editor do Supabase e clique em RUN.
-- ============================================================================

-- 1. PERFIS DE USUÁRIO (vinculado ao Supabase Auth)
create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    full_name text,
    role text not null default 'athlete' check (role in ('athlete', 'personal', 'admin')),
    plan text not null default 'free' check (plan in ('free', 'pro', 'personal_pro')),
    weekly_goal integer not null default 4 check (weekly_goal between 1 and 7),
    bf_profile jsonb not null default '{}'::jsonb,
    trainer_id uuid references public.profiles(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 2. FICHAS DE TREINO (SPLITS)
create table if not exists public.workout_splits (
    id text not null,
    user_id uuid not null references auth.users(id) on delete cascade,
    name text not null,
    exercises jsonb not null default '[]'::jsonb,
    sort_order integer not null default 0,
    updated_at timestamptz not null default now(),
    primary key (user_id, id)
);

-- 3. HISTÓRICO DE TREINOS FINALIZADOS
create table if not exists public.workout_logs (
    id text not null,
    user_id uuid not null references auth.users(id) on delete cascade,
    split_id text,
    split_name text not null,
    workout_date date not null,
    duration_min integer not null default 45,
    total_volume numeric(12, 2) not null default 0,
    best_epley_1rm numeric(8, 2) not null default 0,
    prs jsonb not null default '[]'::jsonb,
    exercises jsonb not null default '[]'::jsonb,
    created_at timestamptz not null default now(),
    primary key (user_id, id)
);

-- 4. MEDIDAS CORPORAIS & BF% AO LONGO DO TEMPO
create table if not exists public.body_measurements (
    id text not null,
    user_id uuid not null references auth.users(id) on delete cascade,
    measured_at date not null,
    weight numeric(6, 2),
    body_fat numeric(5, 2),
    waist numeric(6, 2),
    chest numeric(6, 2),
    arm_relaxed numeric(6, 2),
    arm_flexed numeric(6, 2),
    neck numeric(6, 2),
    thigh numeric(6, 2),
    created_at timestamptz not null default now(),
    primary key (user_id, id)
);

-- 5. METAS CORPORAIS DO USUÁRIO
create table if not exists public.body_goals (
    user_id uuid primary key references auth.users(id) on delete cascade,
    goals jsonb not null default '{}'::jsonb,
    updated_at timestamptz not null default now()
);

-- ============================================================================
-- ÍNDICES DE PERFORMANCE
-- ============================================================================
create index if not exists idx_workout_logs_user_date
    on public.workout_logs (user_id, workout_date desc);

create index if not exists idx_body_measurements_user_date
    on public.body_measurements (user_id, measured_at desc);

create index if not exists idx_profiles_trainer
    on public.profiles (trainer_id) where trainer_id is not null;

-- ============================================================================
-- TRIGGER: CRIAR PERFIL AUTOMATICAMENTE AO CADASTRAR USUÁRIO
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.profiles (id, full_name)
    values (
        new.id,
        coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
    )
    on conflict (id) do nothing;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- ============================================================================
-- SEGURANÇA (ROW LEVEL SECURITY — RLS)
-- Cada usuário só acessa os próprios dados (e Personal vê seus alunos vinculados)
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.workout_splits enable row level security;
alter table public.workout_logs enable row level security;
alter table public.body_measurements enable row level security;
alter table public.body_goals enable row level security;

-- Policies: profiles
drop policy if exists "Users can view own profile or linked students" on public.profiles;
create policy "Users can view own profile or linked students"
    on public.profiles for select
    using (auth.uid() = id or auth.uid() = trainer_id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
    on public.profiles for update
    using (auth.uid() = id);

-- Policies: workout_splits
drop policy if exists "Users manage own splits" on public.workout_splits;
create policy "Users manage own splits"
    on public.workout_splits for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

drop policy if exists "Trainers view student splits" on public.workout_splits;
create policy "Trainers view student splits"
    on public.workout_splits for select
    using (
        exists (
            select 1 from public.profiles p
            where p.id = workout_splits.user_id and p.trainer_id = auth.uid()
        )
    );

-- Policies: workout_logs
drop policy if exists "Users manage own workout logs" on public.workout_logs;
create policy "Users manage own workout logs"
    on public.workout_logs for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

drop policy if exists "Trainers view student workout logs" on public.workout_logs;
create policy "Trainers view student workout logs"
    on public.workout_logs for select
    using (
        exists (
            select 1 from public.profiles p
            where p.id = workout_logs.user_id and p.trainer_id = auth.uid()
        )
    );

-- Policies: body_measurements
drop policy if exists "Users manage own measurements" on public.body_measurements;
create policy "Users manage own measurements"
    on public.body_measurements for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

drop policy if exists "Trainers view student measurements" on public.body_measurements;
create policy "Trainers view student measurements"
    on public.body_measurements for select
    using (
        exists (
            select 1 from public.profiles p
            where p.id = body_measurements.user_id and p.trainer_id = auth.uid()
        )
    );

-- Policies: body_goals
drop policy if exists "Users manage own goals" on public.body_goals;
create policy "Users manage own goals"
    on public.body_goals for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- Policy: profiles insert (fallback caso usuário tenha se cadastrado antes do trigger)
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
    on public.profiles for insert
    with check (auth.uid() = id);

-- Permissões de tabela para usuários autenticados (mantendo 100% do isolamento via RLS)
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.workout_splits to authenticated;
grant select, insert, update, delete on public.workout_logs to authenticated;
grant select, insert, update, delete on public.body_measurements to authenticated;
grant select, insert, update, delete on public.body_goals to authenticated;

