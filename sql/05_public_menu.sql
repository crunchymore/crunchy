-- =====================================================================
--  كرانشي ومور — المنيو الإلكتروني العام (05_public_menu.sql)
--  Public, read-only: active dishes (name, section, direct price) and delivery areas.
--  No costs, app prices or anything private. Safe to re-run.
-- =====================================================================
create or replace function public.public_menu() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'items', coalesce((select jsonb_agg(jsonb_build_object('id', m.id, 'name', m.name, 'cat', m.cat, 'price', m.price) order by m.sort, m.id)
                         from public.menu_items m where m.active), '[]'::jsonb),
    'areas', coalesce((select jsonb_agg(jsonb_build_object('name', a->>'name', 'fee', (a->>'fee')::numeric))
                         from public.settings s, jsonb_array_elements(coalesce(s.areas, '[]'::jsonb)) a where s.id = 1), '[]'::jsonb),
    'at', now())
$$;
revoke all on function public.public_menu() from public;
grant execute on function public.public_menu() to anon, authenticated;
select 'menu ready' as status, jsonb_array_length(public.public_menu()->'items') as items;
