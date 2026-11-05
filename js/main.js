/* ---------- routing ---------- */
const GROUPS=[["sale","البيع"],["kitchen","المطبخ"],["store","المخزن"],["admin","الإدارة"]];
const VIEWS=[
  ["pos","طلب جديد","sale","owner manager cashier"],["board","متابعة الطلبات","sale","owner manager cashier"],["customers","الزباين","sale","owner manager cashier"],
  ["kds","شاشة المطبخ","kitchen","owner manager kitchen"],["recipes","الوصفات","kitchen","owner manager kitchen"],
  ["stock","الأرصدة","store","owner manager store"],["receive","استلام فاتورة","store","owner manager store"],["transfer","ترحيل للفرع","store","owner manager store"],
  ["waste","تلف وجرد","store","owner manager store"],["items","المواد","store","owner manager store"],["suppliers","الموردين","store","owner manager store"],
  ["dash","لوحة التحكم","admin","owner manager"],["settle","الموازنة","admin","owner"],["menu","المنيو والأسعار","admin","owner"],
  ["staff","الموظفين","admin","owner"],["branches","الفروع","admin","owner"],["setup","الإعدادات","admin","owner"]];
const ICON={
  sale:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/></svg>',
  kitchen:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c1 3 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3-1-5 1-8.5z"/></svg>',
  store:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 8l9-5 9 5v8l-9 5-9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/></svg>',
  admin:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>'};
const HOME={owner:"dash",manager:"dash",cashier:"pos",kitchen:"kds",store:"stock"};
const myPerms=()=>S.role&&S.role!=="owner"&&S.me&&Array.isArray(S.me.perms)?S.me.perms:null;
const can=k=>{const p=myPerms();return !p||p.includes(k)};
const allowed=()=>S.role?VIEWS.filter(v=>v[3].split(" ").includes(S.role)&&(S.role==="owner"||can(v[0]))):[];
function view(){const v=(location.hash||"").slice(1);if(v==="account")return v;const ok=allowed().map(x=>x[0]);return ok.includes(v)?v:ok.includes(HOME[S.role])?HOME[S.role]:(ok[0]||"account")}
function renderNav(){
  const v=view();const al=allowed();const cur=VIEWS.find(x=>x[0]===v);const g=cur?cur[2]:null;
  const r=$("#role");r.hidden=!S.role;const lb=lockedBranch();
  r.textContent=S.role==="manager"&&lb?"مدير فرع":(ROLE_T[S.role]||"");r.className="role"+(S.role==="owner"?" owner":"");
  const me=$("#meBtn");me.textContent=(S.me&&S.me.full_name)||"حسابي";me.dataset.i=((S.me&&S.me.full_name)||"ح").trim().charAt(0);me.setAttribute("aria-current",v==="account"?"page":"false");
  const ab=activeBranches();
  $("#brbox").innerHTML=lb?(ab.length>1||S.branches.length>1?`<span class="role">${h(brName(lb))}</span>`:""):ab.length>1?`<select id="brsel" class="brsel" aria-label="الفرع">${opts(ab.map(b=>[b.id,b.name||"فرع"]),curBranch())}</select>`:"";
  const tb=todayBr();const activeN=tb.filter(o=>ACTIVE.includes(o.status)).length;const kN=tb.filter(o=>o.status==="new"||o.status==="prep").length;
  const dot=k=>k==="board"&&activeN?`<span class="dot num">${activeN}</span>`:k==="kds"&&kN?`<span class="dot num">${kN}</span>`:"";
  const groups=GROUPS.filter(([k])=>al.some(x=>x[2]===k));const curG=g||(groups[0]||[])[0];
  const gN=k=>k==="sale"&&al.some(x=>x[0]==="board")?activeN:k==="kitchen"&&al.some(x=>x[0]==="kds")?kN:0;
  const glink=(cls)=>groups.map(([k,t])=>{const first=al.find(x=>x[2]===k);const n=gN(k);return `<a class="${cls}" href="#${first[0]}" data-grp="${k}" ${k===curG?'aria-current="true"':""}>${ICON[k]||""}<span class="gl">${t}</span>${n?`<span class="dot num">${n}</span>`:""}</a>`}).join("");
  $("#sideNav").innerHTML=glink("sl");
  const bnav=groups.length>1?glink("bl"):"";$("#bnav").innerHTML=bnav;$("#bnav").hidden=!bnav;
  const subs=al.filter(x=>x[2]===curG);
  $("#tabs").innerHTML=subs.length>1?`<div class="subs">${subs.map(([k,t])=>`<a href="#${k}" ${k===v?'aria-current="page"':""}>${t}${dot(k)}</a>`).join("")}</div>`:"";
  $("#tabs").hidden=subs.length<2;
  document.body.classList.toggle("has-bnav",!!bnav);
  $("#pageT").textContent=v==="account"?"حسابي":(cur?cur[1]:"");
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
