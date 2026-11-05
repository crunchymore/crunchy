/* ---------- helpers ---------- */
const $=s=>document.querySelector(s);
const h=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmt=n=>Math.round(Number(n)||0).toLocaleString("en-US");
const money=n=>`<span class="num">${fmt(n)}</span> د.ع`;
const pad=n=>String(n).padStart(2,"0");
const ymOf=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}`;
const curYM=()=>ymOf(new Date());
const monthName=ym=>{const [y,m]=ym.split("-").map(Number);return new Date(y,m-1,1).toLocaleDateString("ar-IQ-u-nu-latn",{month:"long",year:"numeric"})};
const range=ym=>{const [y,m]=ym.split("-").map(Number);return [new Date(y,m-1,1).getTime(),new Date(y,m,1).getTime()]};
const dayStart=()=>{const d=new Date();d.setHours(0,0,0,0);return d.getTime()};
const timeStr=ts=>new Date(ts).toLocaleTimeString("ar-IQ-u-nu-latn",{hour:"2-digit",minute:"2-digit"});
const dateStr=ts=>new Date(ts).toLocaleDateString("ar-IQ-u-nu-latn",{day:"numeric",month:"short"});
const mins=ts=>Math.max(0,Math.floor((Date.now()-ts)/60000));
const toLatin=s=>String(s??"").replace(/[٠-٩]/g,d=>"٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/[۰-۹]/g,d=>"۰۱۲۳۴۵۶۷۸۹".indexOf(d));
/* Iraqi mobile → "07XXXXXXXXX" or null */
function normPhone(s){let d=toLatin(s).replace(/\D/g,"");d=d.replace(/^00/,"");if(d.startsWith("964"))d=d.slice(3);if(d.startsWith("0"))d=d.slice(1);return /^7\d{9}$/.test(d)?"0"+d:null}
const phoneKey=p=>normPhone(p)||toLatin(p).replace(/\D/g,"");
const staffEmail=p07=>`p964${p07.slice(1)}@${(window.CRUNCHY_CONFIG||{}).staffEmailDomain||"staff.crunchy.app"}`;
const waNumber=p07=>"964"+p07.slice(1);
const fq=n=>{const v=Math.round((Number(n)||0)*1000)/1000;return v.toLocaleString("en-US",{maximumFractionDigits:3})};
const qn=(n,u)=>`<span class="num">${fq(n)}</span>${u?" "+h(u):""}`;
const isoDay=ts=>{const d=new Date(ts);return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`};
const tsOf=v=>v?Date.parse(v):0;
const LS={get(k){try{return localStorage.getItem(k)}catch(_){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(_){}},del(k){try{localStorage.removeItem(k)}catch(_){}}};
const opts=(arr,sel,ph)=>(ph!==undefined?`<option value="">${h(ph)}</option>`:"")+arr.map(([v,t])=>`<option value="${h(v)}" ${String(v)===String(sel??"")?"selected":""}>${h(t)}</option>`).join("");
function genPassword(){const a="abcdefghjkmnpqrstuvwxyz",d="23456789",all=a+d;const r=new Uint32Array(8);crypto.getRandomValues(r);
  let s="";for(let i=0;i<8;i++)s+=(i===0?a:i===7?d:all)[r[i]%(i===0?a.length:i===7?d.length:all.length)];return s}

/* ---------- constants ---------- */
const DEFAULT_SETTINGS={channels:[{name:"توترز",pct:20,own:false},{name:"طلباتي",pct:20,own:false},{name:"اتصال",pct:0,own:true},{name:"واتساب",pct:0,own:true}],areas:[],packaging:250,lateMins:35,directPct:20,appPct:40,costMode:"supplier",costModeLog:[]};
const OWN_DEFAULT=["اتصال","واتساب"];
const STATUS={new:{t:"جديد",c:"warn"},prep:{t:"قيد التحضير",c:"info"},ready:{t:"جاهز",c:"good"},out:{t:"بالطريق",c:"info"},done:{t:"تم التسليم",c:"good"},cancelled:{t:"ملغي",c:"bad"}};
const ACTIVE=["new","prep","ready","out"];
const NEXT={new:"prep",prep:"out",ready:"out",out:"done"};
const NEXT_T={new:"بدأ التحضير",prep:"خرج للتوصيل",ready:"خرج للتوصيل",out:"تم التسليم"};
const ROLE_T={owner:"المالك",manager:"مدير",cashier:"كاشير",kitchen:"مطبخ",store:"مخزن"};
const ROLE_OPTS=[["cashier","كاشير"],["kitchen","مطبخ"],["store","مخزن"],["manager","مدير"]];
const UNITS=["كغم","غم","لتر","مل","قطعة","علبة","كيس"];
const MOVE_T={receive:{t:"استلام",c:"good"},transfer:{t:"ترحيل",c:"info"},consume:{t:"استهلاك",c:"warn"},waste:{t:"تلف",c:"bad"},adjust:{t:"تسوية جرد",c:""}};
const INSTALL_STEPS=[
  ["أندرويد","افتح الرابط بـ Chrome ← اضغط ⋮ (فوق) ← «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية»."],
  ["آيفون","افتح الرابط بـ Safari ← زر المشاركة (المربع والسهم) ← «إضافة إلى الشاشة الرئيسية»."],
  ["الكمبيوتر","افتح الرابط بـ Chrome ← اضغط أيقونة التثبيت بشريط العنوان (يمين الرابط)."]];
const appLink=()=>location.origin+location.pathname;

/* ---------- state ---------- */
const S={screen:"boot",uid:null,me:null,role:null,ownerExists:null,authBusy:false,authErr:"",authOk:"",
  menu:[],settings:{...DEFAULT_SETTINGS},costRows:{},today:[],orders:[],expenses:[],payments:[],customers:[],
  branches:[],staff:[],inv:[],levels:[],moves:[],suppliers:[],purchases:[],supPays:[],recipes:{},bal:{},tot:{},
  branch:LS.get("crunchy.branch")||"",dashBr:"*",stockLoc:"store",invSel:null,supSel:null,recSel:null,recDraft:null,rcv:null,trf:null,wst:null,busy:{},
  month:curYM(),cart:{},channel:null,discount:0,cat:"الكل",f:{phone:"",name:"",address:"",note:"",area:""},known:null,
  confirmDel:null,custQ:"",loaded:false,modal:null,newStaff:null,staffMsg:null,saving:false};

function toast(t){const el=$("#toast");el.textContent=t;el.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>el.hidden=true,2800)}
function status(t){const el=$("#status");if(!el)return;if(!t){el.hidden=true;return}el.textContent=t;el.hidden=false}
function beep(){try{const a=beep.ctx||(beep.ctx=new (window.AudioContext||window.webkitAudioContext)());if(a.state==="suspended")a.resume();
  [0,.22].forEach(d=>{const o=a.createOscillator(),g=a.createGain();o.frequency.value=d?1175:880;g.gain.value=.09;o.connect(g);g.connect(a.destination);o.start(a.currentTime+d);o.stop(a.currentTime+d+.16)})}catch(_){}}
document.addEventListener("pointerdown",()=>{try{if(!beep.ctx)beep.ctx=new (window.AudioContext||window.webkitAudioContext)();else if(beep.ctx.state==="suspended")beep.ctx.resume()}catch(_){}},{once:false,passive:true});
function errText(e){const m=String(e&&(e.message||e.error_description||e.msg)||"");
  if(e&&(e.code==="42501"||/permission|not allowed|row-level/i.test(m)))return "ما عندك صلاحية لهالعملية";
  if(/Failed to fetch|NetworkError|network/i.test(m))return "ما كو اتصال بالإنترنت، جرب مرة ثانية";
  if(/[؀-ۿ]/.test(m))return m.slice(0,160);
  return "ما انحفظ، جرب مرة ثانية"}
