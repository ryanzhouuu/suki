alter table public.recommendation_runs
add column if not exists run_kind text not null default 'personal',
add column if not exists collaborator_user_id uuid references auth.users(id) on delete cascade,
add column if not exists collaboration_mode text,
add column if not exists friendship_id uuid references public.friendships(id) on delete set null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'recommendation_runs_kind_chk'
      and conrelid = 'public.recommendation_runs'::regclass
  ) then
    alter table public.recommendation_runs
    add constraint recommendation_runs_kind_chk
    check (run_kind in ('personal', 'collaborative'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'recommendation_runs_collaborative_shape_chk'
      and conrelid = 'public.recommendation_runs'::regclass
  ) then
    alter table public.recommendation_runs
    add constraint recommendation_runs_collaborative_shape_chk
    check (
      (run_kind = 'personal' and collaborator_user_id is null and collaboration_mode is null)
      or (run_kind = 'collaborative' and collaborator_user_id is not null and collaboration_mode is not null)
    );
  end if;
end $$;

create index if not exists recommendation_runs_personal_idx
  on public.recommendation_runs (user_id, run_kind, algorithm_version, created_at desc);

create index if not exists recommendation_runs_collaborative_idx
  on public.recommendation_runs (
    user_id,
    collaborator_user_id,
    run_kind,
    collaboration_mode,
    algorithm_version,
    created_at desc
  );
