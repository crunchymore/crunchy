/* ---------- window.CR: stable API for the AI staff (runs with the signed-in session) ----------
   Usage from a browser tab on this app:  await CR.ready()  then e.g.  await CR.menu()
   Everything respects the signed-in user's permissions (RLS). */
window.CR=(function(){
  const need=()=>{if(!S.uid||!S.role)throw new Error("NOT_SIGNED_IN: سجّل دخول بحساب المالك بهذا المتصفح");};
  const iso=t=>new Date(t).toISOString();
  async function all(table,sel,fn){const out=[];for(let i=0;;i+=1000){let p=sb.from(table).select(sel||"*");if(fn)p=fn(p);const rows=await q(p.range(i,i+999));out.push(...rows);if(rows.length<1000)break}return out}
  return {
    version:1,
    async ready(ms){const end=Date.now()+(ms||20000);while(Date.now()<end){if(S.uid&&S.role&&S.loaded)return {ok:true,role:S.role,name:(S.me||{}).full_name||""};if(S.screen==="login"||S.screen==="setup")break;await new Promise(r=>setTimeout(r,300))}
      return {ok:false,reason:S.screen==="login"?"NOT_SIGNED_IN":"TIMEOUT"}},
    whoami(){return {uid:S.uid,role:S.role,name:(S.me||{}).full_name||"",branch:curBranch&&curBranch()}},
    async menu(){need();const own=S.role==="owner";await load(...(own?["menu","costs"]:["menu"]));return S.menu.filter(m=>m.active).map(m=>({id:m.id,code:m.code,name:m.name,cat:m.cat,price:m.price,appPrice:m.appPrice,...(own?{cost:curCost(m.id)}:{})}))},
    async settings(){need();await load("settings");const s=S.settings;return {areas:s.areas,channels:s.channels,packaging:s.packaging,lateMins:s.lateMins,costMode:s.costMode}},
    async branches(){need();await load("branches");return S.branches},
    async orders(from,to){need();const rows=await all("orders","*",p=>p.gte("created_at",iso(from||Date.now()-864e5)).lt("created_at",iso(to||Date.now()+6e4)).order("created_at",{ascending:true}));return rows.map(mapOrder)},
    async summary(from,to){need();await load("costs","recipes","inv","settings");const list=(await this.orders(from,to));const live=list.filter(o=>o.status!=="cancelled");
      const by={},top={},hours={};let sales=0,commission=0,packaging=0,cost=0;
      for(const o of live){sales+=o.revenue;commission+=o.commission;packaging+=o.packaging;const c=orderCost(o);cost+=c;
        const b=by[o.channel]||(by[o.channel]={orders:0,sales:0,profit:0});b.orders++;b.sales+=o.revenue;b.profit+=orderProfit(o);
        for(const i of o.items||[])top[i.name]=(top[i.name]||0)+(+i.qty||0);const h=new Date(o.ts).getHours();hours[h]=(hours[h]||0)+1}
      return {orders:live.length,cancelled:list.length-live.length,open:live.filter(o=>!["done"].includes(o.status)).length,sales,commission,packaging,cost,profit:sales-commission-packaging-cost,
        byChannel:by,top:Object.entries(top).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([name,qty])=>({name,qty})),byHour:hours}},
    async customer(phone){need();const p=normPhone(phone);if(!p)return null;const r=await q(sb.from("customers").select("*").eq("phone",p).maybeSingle());return r?mapCust(r):null},
    async createOrder(o){need();
      if(!o||!Array.isArray(o.items)||!o.items.length)throw new Error("items مطلوبة");
      await load("menu","settings");const br=o.branchId||curBranch();
      const items=o.items.map(i=>{const m=S.menu.find(x=>x.id===i.mid||x.code===i.code||x.name===i.name);if(!m||!m.active)throw new Error("صنف غير موجود: "+(i.mid||i.code||i.name));return {mid:m.id,qty:Math.max(1,Math.round(+i.qty||1)),name:m.name,price:priceFor(m,o.channel||"واتساب")}});
      const ch=o.channel||"واتساب";const own=isOwn(ch);const area=own?String(o.area||(o.customer||{}).area||""):"";
      if(own&&!(S.settings.areas||[]).some(a=>a.name===area))throw new Error("منطقة غير موجودة: "+area);
      const cu=o.customer||{};const row=await q(sb.from("orders").insert({branch_id:br,channel:ch,items,discount:Math.max(0,+o.discount||0),
        customer:{phone:normPhone(cu.phone||"")||"",name:String(cu.name||"").trim(),address:String(cu.address||"").trim()},area,note:String(o.note||"").trim()}).select().single());
      return mapOrder(row)},
    async stock(){need();await load("inv","levels");return S.inv.filter(i=>i.active).map(i=>{const locs={};for(const [l,m] of Object.entries(S.bal||{}))if(m[i.id])locs[l]=m[i.id];
      return {id:i.id,code:i.code,name:i.name,unit:i.unit,minQty:i.minQty,avgCost:i.avgCost,total:(S.tot||{})[i.id]||0,locs}})},
    async moves(days){need();return (await all("stock_moves","*, stock_move_lines(*)",p=>p.gte("created_at",iso(Date.now()-(days||7)*864e5)).order("created_at",{ascending:false}))).map(mapMove)},
    async purchases(days){need();return await all("purchases","*, purchase_lines(*)",p=>p.gte("created_at",iso(Date.now()-(days||30)*864e5)))},
    async suppliers(){need();await load("suppliers");return S.suppliers},
    async notes(kind,limit){need();let p=sb.from("ai_notes").select("*").order("created_at",{ascending:false}).limit(limit||20);if(kind)p=p.eq("kind",kind);return await q(p)},
    async saveNote(n){need();if(S.role!=="owner")throw new Error("حساب المالك فقط");const body={kind:n.kind||"note",agent:n.agent||"",title:String(n.title||""),body:String(n.body||""),data:n.data||{},updated_at:new Date().toISOString()};
      if(n.key)body.key=String(n.key);const p=n.key?sb.from("ai_notes").upsert(body,{onConflict:"key"}):sb.from("ai_notes").insert(body);return await q(p.select().single())},
    async backup(){need();return await buildBackup()}
  };
})();

/* ---------- full backup (owner) ---------- */
const BACKUP_TABLES=["settings","branches","profiles","menu_items","menu_costs","recipes","customers","orders","inv_items","stock_levels","stock_moves","stock_move_lines",
  "suppliers","purchases","purchase_lines","supplier_payments","expenses","friend_payments","ai_notes","audit_log"];
async function buildBackup(){
  const out={app:"crunchy",version:1,created_at:new Date().toISOString(),by:(S.me||{}).full_name||"",tables:{}};
  for(const t of BACKUP_TABLES){const rows=[];try{for(let i=0;;i+=1000){const r=await q(sb.from(t).select("*").range(i,i+999));rows.push(...r);if(r.length<1000)break}}catch(e){out.tables[t]={error:String(e.message||e)};continue}out.tables[t]=rows}
  return out}
async function downloadBackup(){
  if(S.backingUp)return;S.backingUp=true;renderSafe();
  try{const b=await buildBackup();const n=Object.values(b.tables).reduce((a,r)=>a+(Array.isArray(r)?r.length:0),0);
    const blob=new Blob([JSON.stringify(b)],{type:"application/json"});const a=document.createElement("a");const d=new Date();
    a.href=URL.createObjectURL(blob);a.download=`crunchy-backup-${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}.json`;
    document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},2000);
    try{localStorage.setItem("crunchy.lastBackup",String(Date.now()))}catch(_){}toast(`نزلت النسخة الاحتياطية · ${n.toLocaleString("en-US")} سجل`)}
  catch(e){toast("ما نزلت النسخة: "+(e.message||e))}
  finally{S.backingUp=false;renderSafe()}
}
