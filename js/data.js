/* ---------- Supabase client ---------- */
let sb=null;
function makeClient(tmp){
  const C=window.CRUNCHY_CONFIG;
  return window.supabase.createClient(C.supabaseUrl,C.supabaseKey,{auth:tmp
    ?{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false,storageKey:"crunchy-staff-tmp"}
    :{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false,storageKey:"crunchy-auth"}});
}
async function q(p){const {data,error}=await p;if(error)throw error;return data}

/* ---------- row mappers (DB snake_case → app objects) ---------- */
const mapOrder=r=>({id:r.id,no:r.no,branchId:r.branch_id,channel:r.channel,items:Array.isArray(r.items)?r.items:[],subtotal:+r.subtotal||0,discount:+r.discount||0,
  revenue:+r.revenue||0,commissionPct:+r.commission_pct||0,commission:+r.commission||0,packaging:+r.packaging||0,status:r.status,customer:r.customer||{},area:r.area||"",
  deliveryFee:+r.delivery_fee||0,note:r.note||"",by:r.created_by,ts:tsOf(r.created_at),costMode:r.cost_mode,consumed:!!r.consumed,foodCost:r.food_cost==null?null:+r.food_cost});
const mapMenu=r=>({id:r.id,name:r.name,cat:r.cat,code:r.code||"",price:+r.price||0,appPrice:+r.app_price||0,active:r.active!==false,sort:+r.sort||0});
const mapInv=r=>({id:r.id,name:r.name,code:r.code||"",unit:r.unit||"",units:Array.isArray(r.units)?r.units:[],category:r.category||"",minQty:+r.min_qty||0,avgCost:+r.avg_cost||0,lastCost:+r.last_cost||0,active:r.active!==false});
const mapSettings=r=>r?{channels:r.channels||[],areas:r.areas||[],packaging:+r.packaging||0,lateMins:+r.late_mins||35,directPct:+r.direct_pct||20,appPct:+r.app_pct||40,
  costMode:r.cost_mode==="recipe"?"recipe":"supplier",costModeLog:Array.isArray(r.cost_mode_log)?r.cost_mode_log:[]}:{...DEFAULT_SETTINGS};
const mapMove=r=>({id:r.id,type:r.type,loc:r.loc,toLoc:r.to_loc,ts:tsOf(r.created_at),ref:r.ref||"",note:r.note||"",reason:r.reason||"",orderId:r.order_id,purchaseId:r.purchase_id,
  lines:(r.stock_move_lines||[]).map(l=>({itemId:l.item_id,qty:+l.qty||0,unitCost:+l.unit_cost||0}))});
const mapCust=r=>({id:r.phone,phone:r.phone,name:r.name,address:r.address,area:r.area,notes:r.notes,count:r.order_count||0,total:+r.total||0,lastTs:tsOf(r.last_at),firstTs:tsOf(r.first_at)});

/* ---------- loaders ---------- */
const DB={
  async settings(){S.settings=mapSettings(await q(sb.from("settings").select("*").eq("id",1).maybeSingle()))},
  async menu(){S.menu=(await q(sb.from("menu_items").select("*").order("sort",{ascending:true}))).map(mapMenu)},
  async branches(){S.branches=(await q(sb.from("branches").select("*").order("created_at",{ascending:true})));},
  async today(){S.today=(await q(sb.from("orders").select("*").gte("created_at",new Date(dayStart()).toISOString()).order("created_at",{ascending:true}).limit(1500))).map(mapOrder);S.todayKey=isoDay(Date.now())},
  async month(){const [a,b]=range(S.month);S.orders=(await q(sb.from("orders").select("*").gte("created_at",new Date(a).toISOString()).lt("created_at",new Date(b).toISOString()).order("created_at",{ascending:false}).limit(10000))).map(mapOrder)},
  async customers(){S.customers=(await q(sb.from("customers").select("*").order("last_at",{ascending:false}).limit(500))).map(mapCust)},
  async recipes(){const m={};for(const r of await q(sb.from("recipes").select("*")))m[r.menu_id]={lines:(r.lines||[]).map(l=>({itemId:l.item_id,qty:+l.qty||0})),yield:+r.yield||1,notes:r.notes||""};S.recipes=m},
  async inv(){S.inv=(await q(sb.from("inv_items").select("*"))).map(mapInv)},
  async levels(){S.levels=await q(sb.from("stock_levels").select("*"));recalc()},
  async moves(){S.moves=(await q(sb.from("stock_moves").select("*, stock_move_lines(*)").order("created_at",{ascending:false}).limit(400))).map(mapMove)},
  async suppliers(){S.suppliers=await q(sb.from("suppliers").select("*").order("name",{ascending:true}))},
  async purchases(){S.purchases=(await q(sb.from("purchases").select("*, purchase_lines(*)").order("created_at",{ascending:false}).limit(1000))).map(p=>({id:p.id,supplierId:p.supplier_id,invNo:p.inv_no,date:p.date,total:+p.total||0,ts:tsOf(p.created_at),lines:p.purchase_lines||[]}))},
  async supPays(){S.supPays=(await q(sb.from("supplier_payments").select("*").order("created_at",{ascending:false}))).map(p=>({id:p.id,supplierId:p.supplier_id,amount:+p.amount||0,date:p.date,note:p.note,ts:tsOf(p.created_at)}))},
  async costs(){const m={};for(const r of await q(sb.from("menu_costs").select("*").order("valid_from",{ascending:true})))(m[r.menu_id]||(m[r.menu_id]=[])).push({ts:tsOf(r.valid_from),c:+r.cost||0});S.costRows=m},
  async expenses(){const [a,b]=range(S.month);S.expenses=(await q(sb.from("expenses").select("*").gte("spent_at",new Date(a).toISOString()).lt("spent_at",new Date(b).toISOString()))).map(e=>({id:e.id,amount:+e.amount||0,note:e.note,ts:tsOf(e.spent_at)}))},
  async payments(){const [a,b]=range(S.month);S.payments=(await q(sb.from("friend_payments").select("*").gte("paid_at",new Date(a).toISOString()).lt("paid_at",new Date(b).toISOString()))).map(e=>({id:e.id,amount:+e.amount||0,note:e.note,ts:tsOf(e.paid_at)}))},
  async ai(){S.ai=await q(sb.from("ai_notes").select("*").order("created_at",{ascending:false}).limit(60));S.aiLoaded=true},
  async staff(){S.staff=await q(sb.from("profiles").select("*").order("created_at",{ascending:true}))},
};
const has=roles=>roles.split(" ").includes(S.role);
async function load(...names){
  const res=await Promise.allSettled(names.map(n=>DB[n]()));
  const bad=res.map((r,i)=>r.status==="rejected"?names[i]:null).filter(Boolean);
  if(bad.length){console.warn("load failed",bad,res.filter(r=>r.status==="rejected").map(r=>r.reason));status("ما كدرنا نحمل كل البيانات. تأكد من الإنترنت وحدّث الصفحة.")}
  return !bad.length;
}
async function loadAll(){
  const n=["settings","menu","branches"];
  if(has("owner manager cashier kitchen"))n.push("today");
  if(has("owner manager cashier"))n.push("customers");
  if(has("owner manager kitchen"))n.push("recipes");
  if(has("owner manager kitchen store"))n.push("inv","levels");
  if(has("owner manager store"))n.push("moves","suppliers","purchases");
  if(has("owner manager"))n.push("supPays","month");
  if(S.role==="owner")n.push("costs","expenses","payments","staff");
  const ok=await load(...n);S.loaded=true;if(ok)status("");return ok;
}
const monthLoads=()=>S.role==="owner"?["month","expenses","payments"]:has("manager")?["month"]:[];

/* ---------- realtime ---------- */
let rtChannel=null;
function subscribeOrders(){
  if(rtChannel||!has("owner manager cashier kitchen"))return;
  rtChannel=sb.channel("orders-live").on("postgres_changes",{event:"*",schema:"public",table:"orders"},p=>onOrderChange(p)).subscribe();
}
function unsubscribeOrders(){if(rtChannel){try{sb.removeChannel(rtChannel)}catch(_){}rtChannel=null}}
function upsertIn(list,o){const i=list.findIndex(x=>x.id===o.id);if(i>=0)list[i]=o;else list.push(o)}
function onOrderChange(p){
  if(p.eventType==="DELETE"){const id=p.old&&p.old.id;S.today=S.today.filter(o=>o.id!==id);S.orders=S.orders.filter(o=>o.id!==id);renderSafe();return}
  if(!p.new||!p.new.id)return;
  const o=mapOrder(p.new);const isNew=p.eventType==="INSERT"&&!S.today.some(x=>x.id===o.id);
  if(o.ts>=dayStart())upsertIn(S.today,o);
  const [a,b]=range(S.month);if(has("owner manager")&&o.ts>=a&&o.ts<b)upsertIn(S.orders,o);
  if(isNew&&o.by!==S.uid){
    const mine=o.branchId===curBranch();
    if(mine&&prnCfg().autoKitchen)printOrder(o,"kitchen");
    if(S.role==="kitchen"||(view()==="kds"&&mine)){beep();toast("طلب جديد للمطبخ #"+o.no)}
    else if(has("owner manager")){beep();toast(`طلب جديد من ${o.channel||""} · ${fmt(o.revenue)} د.ع`)}
    else if(mine&&view()==="board")toast("طلب جديد #"+o.no);
  }
  renderSafe();
}

/* ---------- branches & locations ---------- */
const allBranches=()=>S.branches;
function activeBranches(){return S.branches.filter(b=>b.active!==false)}
function brName(id){const b=S.branches.find(x=>x.id===id);return b?(b.name||"فرع"):"فرع محذوف"}
const obr=o=>o.branchId;
const lockedBranch=()=>S.role&&S.role!=="owner"&&S.me&&S.me.branch_id?S.me.branch_id:null;
function curBranch(){const l=lockedBranch();if(l)return l;const ab=activeBranches();if(!ab.length)return null;if(!ab.some(b=>b.id===S.branch))S.branch=ab[0].id;return S.branch}
const todayBr=()=>S.today.filter(o=>obr(o)===curBranch());
function locName(l){return l==="store"?"المخزن الرئيسي":l==="*"?"كل المواقع":String(l||"").startsWith("br:")?"مطبخ "+brName(l.slice(3)):(l||"—")}
const allLocs=()=>["store",...activeBranches().map(b=>"br:"+b.id)];
const isMgr=()=>S.role==="owner"||S.role==="manager";
const isOwner=()=>S.role==="owner";

/* ---------- inventory ---------- */
const invById=id=>S.inv.find(x=>x.id===id);
const invName=id=>{const i=invById(id);return i?i.name:"مادة محذوفة"};
const invUnit=id=>(invById(id)||{}).unit||"";
/* ---------- units: up to 4 equivalent units per material, base (smallest) first ---------- */
function unitsOf(i){const raw=Array.isArray(i&&i.units)&&i.units.length?i.units:[{name:(i&&i.unit)||"",per:1}];let f=1;
  return raw.slice(0,4).map((x,k)=>{const per=k?Math.max(1,Number(x.per)||1):1;if(k)f*=per;return {name:String(x.name||""),per,f}})}
const unitsById=id=>unitsOf(invById(id));
const uf=(id,u)=>{const x=unitsById(id).find(z=>z.name===u);return x?x.f:1};
function bestUnit(id,q){const us=unitsById(id);const a=Math.abs(Number(q)||0);let b=us[0];for(const u of us)if(a>=u.f-1e-9)b=u;return b}
function qtyTxt(id,q){const b=bestUnit(id,q);return `<span class="num">${fq((Number(q)||0)/b.f)}</span> ${h(b.name)}`}
const workUnit=id=>{const us=unitsById(id);return us[Math.min(1,us.length-1)]};
const costTxt=(id,c)=>{const u=workUnit(id);return `${money((Number(c)||0)*u.f)} <span class="mini">/ ${h(u.name)}</span>`};
const defUnit=(id,big)=>id?(big?workUnit(id):unitsById(id)[0]).name:"";
function unitSelect(id,attrs,cur){if(!id)return "";const us=unitsById(id);
  if(us.length<2)return `<input value="${h(us[0].name)}" disabled aria-label="الوحدة">`;
  return `<select ${attrs} aria-label="الوحدة">${us.map(u=>`<option value="${h(u.name)}" ${u.name===cur?"selected":""}>${h(u.name)}${u.f>1?" ("+fq(u.f)+" "+h(us[0].name)+")":""}</option>`).join("")}</select>`}
const unitChain=i=>unitsOf(i).map((u,k)=>k?`${h(u.name)} = <span class="num">${fq(u.per)}</span> ${h(unitsOf(i)[k-1].name)}`:h(u.name)).join(" ← ");
const avgC=id=>Number((invById(id)||{}).avgCost)||0;
const activeInv=()=>S.inv.filter(i=>i.active!==false).sort((a,b)=>(a.category||"").localeCompare(b.category||"","ar")||(a.name||"").localeCompare(b.name||"","ar"));
const invOpts=sel=>opts(activeInv().map(i=>[i.id,i.name+" ("+unitsOf(i).map(u=>u.name).join("/")+")"+(i.code?" · "+i.code:"")]),sel,"اختار المادة");
function moveEffects(m){const out=[];for(const l of m.lines||[]){const q=Number(l.qty)||0;if(!l.itemId||!q)continue;const a=Math.abs(q);
  if(m.type==="transfer"){out.push({itemId:l.itemId,loc:m.loc,q:-a,uc:l.unitCost});if(m.toLoc)out.push({itemId:l.itemId,loc:m.toLoc,q:a,uc:l.unitCost})}
  else if(m.type==="receive")out.push({itemId:l.itemId,loc:m.loc,q:a,uc:l.unitCost});
  else if(m.type==="consume"||m.type==="waste")out.push({itemId:l.itemId,loc:m.loc,q:-a,uc:l.unitCost});
  else out.push({itemId:l.itemId,loc:m.loc,q,uc:l.unitCost});}return out}
function recalc(){const bal={},tot={};for(const r of S.levels){const L=bal[r.loc]||(bal[r.loc]={});const v=Number(r.qty)||0;L[r.item_id]=(L[r.item_id]||0)+v;tot[r.item_id]=(tot[r.item_id]||0)+v}S.bal=bal;S.tot=tot}
const qtyAt=(id,loc)=>loc==="*"?(S.tot[id]||0):((S.bal[loc]||{})[id]||0);
const lowList=loc=>activeInv().filter(i=>Number(i.minQty)>0&&qtyAt(i.id,loc)<Number(i.minQty));
const stockValue=loc=>S.inv.reduce((a,i)=>a+Math.max(0,qtyAt(i.id,loc))*(Number(i.avgCost)||0),0);
const supName=id=>(S.suppliers.find(s=>s.id===id)||{}).name||"مورد محذوف";
function supBal(id){const inv=S.purchases.filter(p=>p.supplierId===id).reduce((a,p)=>a+(Number(p.total)||0),0);const paid=S.supPays.filter(p=>p.supplierId===id).reduce((a,p)=>a+(Number(p.amount)||0),0);return {inv,paid,bal:inv-paid}}

/* ---------- recipes & costing ---------- */
const recipeLines=mid=>{const r=S.recipes[mid];return r&&Array.isArray(r.lines)?r.lines:[]};
function recipeCost(mid,rec){const r=rec||S.recipes[mid];if(!r||!Array.isArray(r.lines))return 0;const y=Number(r.yield)||1;return r.lines.reduce((a,l)=>a+(Number(l.qty)||0)*avgC(l.itemId),0)/y}
function modeAt(ts){const log=S.settings.costModeLog||[];if(!log.length)return S.settings.costMode;let m="supplier";for(const e of log)if((e.ts||0)<=ts)m=e.mode;return m}
const orderMode=o=>o.costMode==="recipe"||o.costMode==="supplier"?o.costMode:modeAt(o.ts||0);

/* ---------- money ---------- */
function isOwn(name){const c=(S.settings.channels||[]).find(c=>c.name===name);return c?(c.own!==undefined?!!c.own:OWN_DEFAULT.includes(c.name)):false}
function chanPct(name){const c=(S.settings.channels||[]).find(c=>c.name===name);return c?Number(c.pct)||0:0}
function priceFor(m,ch){const own=isOwn(ch===undefined?S.channel:ch);return own?(Number(m.price)||0):(Number(m.appPrice)||Number(m.price)||0)}
const c250=x=>Math.ceil(x/250-1e-9)*250;
function curCost(mid){const r=S.costRows[mid];return r&&r.length?r[r.length-1].c:0}
function costAt(mid,ts){const r=S.costRows[mid];if(!r||!r.length)return 0;let c=r[0].c;for(const e of r)if(e.ts<=ts)c=e.c;return c}
const supplierCost=o=>(o.items||[]).reduce((a,i)=>a+costAt(i.mid,o.ts)*(Number(i.qty)||0),0);
const recipeOrderCost=o=>(o.items||[]).reduce((a,i)=>a+recipeCost(i.mid)*(Number(i.qty)||0),0);
function orderCost(o){return orderMode(o)==="recipe"?(o.foodCost!=null?Number(o.foodCost)||0:recipeOrderCost(o)):supplierCost(o)}
function orderProfit(o){return (o.revenue||0)-(o.commission||0)-(o.packaging||0)-orderCost(o)}
function calcCart(){
  const lines=Object.entries(S.cart).map(([id,q])=>{const m=S.menu.find(x=>x.id===id);return m&&q>0?{mid:id,name:m.name,qty:q,price:priceFor(m)}:null}).filter(Boolean);
  const subtotal=lines.reduce((a,l)=>a+l.price*l.qty,0);
  const discount=Math.min(Math.max(0,Number(S.discount)||0),subtotal);
  const revenue=subtotal-discount;const pct=chanPct(S.channel);
  const commission=Math.round(revenue*pct/100);
  const packaging=lines.length?Number(S.settings.packaging)||0:0;
  const own=isOwn(S.channel);const area=own?(S.settings.areas||[]).find(a=>a.name===S.f.area):null;
  const deliveryFee=area?Number(area.fee)||0:0;
  return {lines,subtotal,discount,revenue,pct,commission,packaging,own,deliveryFee,total:revenue+deliveryFee};
}
const live=l=>l.filter(o=>o.status!=="cancelled");
function agg(orders){const o=live(orders);let friend=0,food=0;o.forEach(x=>{const c=orderCost(x);if(orderMode(x)==="recipe")food+=c;else friend+=c});
  const sales=o.reduce((a,x)=>a+(x.revenue||0),0),commission=o.reduce((a,x)=>a+(x.commission||0),0),packaging=o.reduce((a,x)=>a+(x.packaging||0),0),delivery=o.reduce((a,x)=>a+(x.deliveryFee||0),0);
  return {count:o.length,sales,profit:sales-commission-packaging-friend-food,friend,food,commission,packaging,delivery}}

/* ---------- writes ---------- */
let wq=Promise.resolve();
function serial(fn){const p=wq.then(fn);wq=p.catch(()=>{});return p}
async function write(fn,msg,reloads){
  if(!navigator.onLine){toast("ما كو اتصال بالإنترنت");return false}
  try{const r=await fn();if(reloads&&reloads.length){await load(...reloads)}if(msg)toast(msg);return r==null?true:r}
  catch(err){console.warn(err);toast(errText(err));return false}
}
async function rpc(name,args){return q(sb.rpc(name,args))}
