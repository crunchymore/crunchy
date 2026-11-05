-- =====================================================================
--  كرانشي ومور — صلاحيات لكل موظف (03_permissions.sql)
--  Run AFTER 01_schema.sql and 02_seed.sql. Safe to re-run.
--  perms = null  -> everything the role allows (default)
--  perms = array -> only these screens/actions (inside what the role allows)
-- =====================================================================

alter table public.profiles add column if not exists perms text[];

-- can(p): owner / SQL editor always; otherwise role default or explicit list
create or replace function public.can(p text) returns boolean
language sql stable security definer set search_path = public as $$
  select case
    when auth.uid() is null then true
    else coalesce((
      select case when pr.role = 'owner' then true
                  when pr.perms is null then true
                  else p = any(pr.perms) end
        from public.profiles pr where pr.id = auth.uid() and pr.active), false)
  end
$$;

create or replace function public.need(p text) returns void
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.can(p) then
    raise exception 'ما عندك صلاحية لهذا الشي. راجع صاحب المطعم.' using errcode = '42501';
  end if;
end $$;

-- owner sets a staff member's permission list (null = role default)
create or replace function public.owner_set_perms(p_user_id uuid, p_perms text[])
returns void language plpgsql security definer set search_path = public as $$
declare
  allowed text[] := array['pos','board','customers','cancel','kds','recipes',
                          'stock','receive','transfer','waste','items','suppliers','dash'];
begin
  if public.app_role() is distinct from 'owner' then
    raise exception 'المالك فقط' using errcode = '42501';
  end if;
  if p_perms is not null and not (p_perms <@ allowed) then
    raise exception 'صلاحية غير معروفة' using errcode = '22023';
  end if;
  update public.profiles set perms = p_perms
   where id = p_user_id and role is distinct from 'owner';
  if not found then
    raise exception 'الحساب غير موجود' using errcode = 'P0002';
  end if;
  insert into public.audit_log(action, details)
  values ('staff.perms', jsonb_build_object('user', p_user_id, 'perms', p_perms));
end $$;

-- ---- server-side enforcement -------------------------------------------
create or replace function public.orders_perm_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    perform public.need('pos');
  elsif new.status is distinct from old.status then
    if new.status = 'cancelled' then
      perform public.need('cancel');
    elsif not (public.can('board') or public.can('kds')) then
      raise exception 'ما عندك صلاحية تحديث الطلبات' using errcode = '42501';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists orders_perm_guard on public.orders;
create trigger orders_perm_guard before insert or update on public.orders
  for each row execute function public.orders_perm_guard();

create or replace function public.stock_perm_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.type = 'receive' then perform public.need('receive');
  elsif new.type = 'transfer' then perform public.need('transfer');
  elsif new.type in ('waste','adjust') then perform public.need('waste');
  end if;
  return new;
end $$;
drop trigger if exists stock_perm_guard on public.stock_moves;
create trigger stock_perm_guard before insert on public.stock_moves
  for each row execute function public.stock_perm_guard();

revoke all on function public.orders_perm_guard() from public;
revoke all on function public.stock_perm_guard() from public;
revoke all on function public.owner_set_perms(uuid, text[]) from public;
grant execute on function public.owner_set_perms(uuid, text[]) to authenticated;
grant execute on function public.can(text) to authenticated;

select 'perms ready' as status;
