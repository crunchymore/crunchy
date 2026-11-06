-- =====================================================================
--  كرانشي ومور — تقارير الموظفين الأذكياء + إبقاء المشروع شغال (04_ops.sql)
--  Run AFTER 03_permissions.sql. Safe to re-run.
-- =====================================================================

-- reports, content plans and stock notes written by the AI staff
create table if not exists public.ai_notes(
  id         uuid primary key default gen_random_uuid(),
  key        text unique,
  kind       text not null default 'note' check (kind in ('report','content','stock','review','orders','note')),
  agent      text not null default '',
  title      text not null default '',
  body       text not null default '',
  data       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.ai_notes enable row level security;
create index if not exists ai_notes_created on public.ai_notes(created_at desc);

drop policy if exists ai_notes_read  on public.ai_notes;
drop policy if exists ai_notes_ins   on public.ai_notes;
drop policy if exists ai_notes_upd   on public.ai_notes;
create policy ai_notes_read on public.ai_notes for select to authenticated using (public.has_role('owner') or public.has_role('manager'));
create policy ai_notes_ins  on public.ai_notes for insert to authenticated with check (public.has_role('owner'));
create policy ai_notes_upd  on public.ai_notes for update to authenticated using (public.has_role('owner')) with check (public.has_role('owner'));
grant select, insert, update on public.ai_notes to authenticated;

-- keepalive: a tiny real query, callable without login (used by the daily GitHub ping)
create or replace function public.keepalive() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('ok', true, 'at', now(), 'branches', (select count(*) from public.branches))
$$;
revoke all on function public.keepalive() from public;
grant execute on function public.keepalive() to anon, authenticated;

select 'ops ready' as status;
