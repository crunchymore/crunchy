/* ---------- routing ---------- */
const GROUPS=[["sale","البيع"],["kitchen","المطبخ"],["store","المخزن"],["admin","الإدارة"]];
const VIEWS=[
  ["pos","طلب جديد","sale","owner manager cashier"],["board","متابعة الطلبات","sale","owner manager cashier"],["customers","الزباين","sale","owner manager cashier"],
  ["kds","شاشة المطبخ","kitchen","owner manager kitchen"],["recipes","الوصفات","kitchen","owner manager kitchen"],
  ["stock","الأرصدة","store","owner manager store"],["receive","استلام فاتورة","store","owner manager store"],["transfer","ترحيل للفرع","store","owner manager store"],
  ["waste","تلف وجرد","store","owner manager store"],["items","المواد","store","owner manager store"],["suppliers","الموردين","store","owner manager store"],
  ["dash","لوحة التحكم","admin","owner manager"],["settle","الموازنة","admin","owner"],["menu","المنيو والأسعار","admin","owner"],
  ["staff","الموظفين","admin","owner"],["branches","الفروع","admin","owner"],["setup","الإعدادات","admin","owner"]];
const HOME={owner:"dash",manager:"dash",cashier:"pos",kitchen:"kds",store:"stock"};
const allowed=()=>S.role?VIEWS.filter(v=>v[3].split(" ").includes(S.role)):[];
function view(){const v=(location.hash||"").slice(1);if(v==="account")return v;const ok=allowed().map(x=>x[0]);return ok.includes(v)?v:(HOME[S.role]||"pos")}
function renderNav(){
  const v=view();const al=allowed();const cur=VIEWS.find(x=>x[0]===v);const g=cur?cur[2]:null;
  const r=$("#role");r.hidden=!S.role;const lb=lockedBranch();
  r.textContent=S.role==="manager"&&lb?"مدير فرع":(ROLE_T[S.role]||"");r.className="role"+(S.role==="owner"?" owner":"");
  const me=$("#meBtn");me.textContent=(S.me&&S.me.full_name)||"حسابي";me.setAttribute("aria-current",v==="account"?"page":"false");
  const ab=activeBranches();
  $("#brbox").innerHTML=lb?(ab.length>1||S.branches.length>1?`<span class="role">${h(brName(lb))}</span>`:""):ab.length>1?`<select id="brsel" class="brsel" aria-label="الفرع">${opts(ab.map(b=>[b.id,b.name||"فرع"]),curBranch())}</select>`:"";
  const tb=todayBr();const activeN=tb.filter(o=>ACTIVE.includes(o.status)).length;const kN=tb.filter(o=>o.status==="new"||o.status==="prep").length;
  const dot=k=>k==="board"&&activeN?`<span class="dot num">${activeN}</span>`:k==="kds"&&kN?`<span class="dot num">${kN}</span>`:"";
  const groups=GROUPS.filter(([k])=>al.some(x=>x[2]===k));
  const gh=groups.length>1?`<div class="grp" role="list">${groups.map(([k,t])=>{const first=al.find(x=>x[2]===k);const n=k==="sale"&&al.some(x=>x[0]==="board")?activeN:k==="kitchen"&&al.some(x=>x[0]==="kds")?kN:0;return `<a role="listitem" href="#${first[0]}" data-grp="${k}" ${k===g?'aria-current="true"':""}>${t}${n&&k!==g?`<span class="dot num">${n}</span>`:""}</a>`}).join("")}</div>`:"";
  const subs=al.filter(x=>x[2]===(g||(groups[0]||[])[0]));
  $("#tabs").innerHTML=gh+(subs.length>1||groups.length<=1?`<div class="subs">${subs.map(([k,t])=>`<a href="#${k}" ${k===v?'aria-current="page"':""}>${t}${dot(k)}</a>`).join("")}</div>`:"");
  document.title=(cur?cur[1]+" · ":"")+"كرانشي ومور";
}
const VIEW_FN={pos:renderPOS,board:renderBoard,customers:renderCustomers,kds:renderKDS,recipes:renderRecipes,stock:renderStock,receive:renderReceive,transfer:renderTransfer,
  waste:renderWaste,items:renderItems,suppliers:renderSuppliers,dash:renderDash,settle:renderSettle,menu:renderMenu,staff:renderStaff,branches:renderBranches,setup:renderSetup,account:renderAccount};
function render(){
  if(S.screen!=="app")return;
  renderNav();
  const v=view();
  $("#view").innerHTML=!S.loaded&&v!=="account"?`<div class="empty">جاري تحميل البيانات…</div>`:VIEW_FN[v]();
  renderInstallBtn();
}
let pending=false;
function renderSafe(){if(S.screen!=="app")return;const a=document.activeElement;if(a&&a.matches("input,textarea,select")&&a.id!=="brsel"&&$("#view").contains(a)){pending=true;renderNav();return}render()}
document.addEventListener("focusout",()=>{if(pending){setTimeout(()=>{const a=document.activeElement;if(!(a&&a.matches("input,textarea,select")&&$("#view").contains(a))){pending=false;render()}},0)}});

/* periodic refresh: minute counters, day rollover, realtime safety net */
let lastFull=Date.now();
async function refreshLive(){
  if(S.screen!=="app"||!S.loaded||!navigator.onLine)return;
  const n=[];if(has("owner manager cashier kitchen"))n.push("today");
  if(S.todayKey!==isoDay(Date.now())){S.month=curYM();n.push(...monthLoads())}
  if(Date.now()-lastFull>5*60000){lastFull=Date.now();if(has("owner manager kitchen store"))n.push("levels");if(has("owner manager"))n.push(...monthLoads())}
  if(n.length){await load(...new Set(n));renderSafe()}
}
setInterval(()=>{const v=view();if(S.screen==="app"&&(v==="board"||v==="dash"||v==="kds"||v==="pos"))renderSafe()},30000);
setInterval(refreshLive,90000);
window.addEventListener("online",()=>{status("");refreshLive()});
window.addEventListener("offline",()=>status("ما كو اتصال بالإنترنت. الشاشة تتحدث لما يرجع الاتصال."));

/* ---------- boot ---------- */
async function boot(){
  if(!window.supabase||!window.CRUNCHY_CONFIG){S.authErr="";return showGate("fatal")}
  sb=makeClient(false);
  sb.auth.onAuthStateChange((ev)=>{if(ev==="SIGNED_OUT"&&S.screen!=="login"&&S.screen!=="setup"){setTimeout(()=>{unsubscribeOrders();resetSession();refreshOwnerExists().then(()=>showGate("login"))},0)}});
  let session=null;
  try{const {data}=await sb.auth.getSession();session=data&&data.session}catch(_){}
  if(session&&session.user){await afterLogin(session.user);return}
  await refreshOwnerExists();showGate("login");
}
boot();
