-- =====================================================================
--  كرانشي ومور — وحدات القياس المتكافئة لكل مادة (06_units.sql)
--  Each raw material gets up to 4 units: the first is the smallest (base),
--  every next one = N × the one before it (e.g. غم → كغم ×1000 → كيس ×25).
--  Stock, recipes and costs are kept in the base unit. Safe to re-run.
-- =====================================================================
alter table public.inv_items add column if not exists units jsonb not null default '[]'::jsonb;
grant update (units) on public.inv_items to authenticated;

-- one-time: materials in كغم / لتر with no history yet move to غم / مل as their base unit
do $$
declare ids text[];
begin
  select array_agg(i.id) into ids from public.inv_items i
   where i.unit in ('كغم','لتر') and i.units = '[]'::jsonb
     and not exists (select 1 from public.stock_move_lines l where l.item_id = i.id)
     and not exists (select 1 from public.purchase_lines p where p.item_id = i.id);
  if ids is null then return; end if;
  update public.stock_levels set qty = qty * 1000 where item_id = any(ids);
  update public.recipes r set lines = (
      select coalesce(jsonb_agg(case when (l->>'item_id') = any(ids)
                                     then jsonb_set(l, '{qty}', to_jsonb(round((l->>'qty')::numeric * 1000, 3)))
                                     else l end), '[]'::jsonb)
        from jsonb_array_elements(r.lines) l)
   where exists (select 1 from jsonb_array_elements(r.lines) l where (l->>'item_id') = any(ids));
  update public.inv_items i
     set units     = jsonb_build_array(jsonb_build_object('name', case i.unit when 'كغم' then 'غم' else 'مل' end, 'per', 1),
                                       jsonb_build_object('name', i.unit, 'per', 1000)),
         unit      = case i.unit when 'كغم' then 'غم' else 'مل' end,
         min_qty   = i.min_qty * 1000,
         avg_cost  = round(i.avg_cost / 1000, 2),
         last_cost = round(i.last_cost / 1000, 2)
   where i.id = any(ids);
end $$;

update public.inv_items set units = jsonb_build_array(jsonb_build_object('name', unit, 'per', 1)) where units = '[]'::jsonb;

select 'units ready' as status, count(*) filter (where jsonb_array_length(units) > 1) as multi_unit_items from public.inv_items;
