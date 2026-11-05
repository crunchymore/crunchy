/* ---------- gate screens: login, first-time owner setup, forced password change, pending ---------- */
const LOGO=`<img class="gate-logo lg-l" src="img/logo-light.png" alt="كرانشي ومور"><img class="gate-logo lg-d" src="img/logo-dark.png" alt="كرانشي ومور">`;
const pwField=(id,label,ac,ph)=>`<div class="field"><label class="label" for="${id}">${label}</label><div class="pw"><input id="${id}" type="password" autocomplete="${ac}" minlength="${ac==="current-password"?6:8}" required ${ph?`placeholder="${h(ph)}"`:""}><button type="button" class="eye" data-eye="${id}" aria-label="إظهار كلمة السر">إظهار</button></div></div>`;
const phoneField=(id,val)=>`<div class="field"><label class="label" for="${id}">رقم الموبايل</label><input id="${id}" type="tel" inputmode="tel" autocomplete="username" dir="ltr" class="num" placeholder="07XXXXXXXXX" value="${h(val||"")}" required></div>`;
const msgs=()=>`${S.authErr?`<div class="err" role="alert">${h(S.authErr)}</div>`:""}${S.authOk?`<div class="ok">${h(S.authOk)}</div>`:""}`;

function showGate(screen){
  S.screen=screen;$("#app").hidden=true;const g=$("#gate");g.hidden=false;
  const fn={login:gateLogin,setup:gateSetup,changepw:gateChangePw,pending:gatePending,fatal:gateFatal}[screen]||(()=>`<div class="empty">جاري التحميل…</div>`);
  g.innerHTML=`<div class="gate-card">${LOGO}${fn()}</div>`;
  const f=g.querySelector("input:not([type=hidden])");if(f&&screen!=="pending"&&matchMedia("(pointer:fine)").matches)f.focus();
}
function gateLogin(){
  return `<h1>تسجيل الدخول</h1><p class="sub">ادخل برقم موبايلك وكلمة السر</p>${msgs()}
  <form id="loginF" class="cards" novalidate>${phoneField("lPhone",S.lastPhone)}${pwField("lPass","كلمة السر","current-password")}
    <button class="btn" ${S.authBusy?"disabled":""}>${S.authBusy?"جاري الدخول…":"دخول"}</button></form>
  <div class="gate-links">${S.ownerExists===false?`<a href="#" id="toSetup"><b>أول تشغيل؟ إنشاء حساب المالك</b></a>`:""}
    <span class="note">نسيت كلمة السر؟ اطلب من صاحب المطعم كلمة سر مؤقتة جديدة.</span>
    <button type="button" class="linkbtn" data-install-help>طريقة تثبيت التطبيق</button></div>`;
}
function gateSetup(){
  return `<h1>إنشاء حساب المالك</h1><p class="sub">هذي الخطوة تصير مرة وحدة بس. أول حساب ينعمل هنا يصير هو المالك.</p>${msgs()}
  <form id="setupF" class="cards" novalidate>
    <div class="field"><label class="label" for="sName">اسمك</label><input id="sName" autocomplete="name" required maxlength="80"></div>
    ${phoneField("sPhone")}${pwField("sPass","كلمة السر (8 أحرف أو أكثر)","new-password")}${pwField("sPass2","أعد كلمة السر","new-password")}
    <button class="btn" ${S.authBusy?"disabled":""}>${S.authBusy?"جاري الإنشاء…":"إنشاء الحساب والدخول"}</button></form>
  <div class="gate-links"><a href="#" id="toLogin">رجوع لتسجيل الدخول</a></div>`;
}
function gateChangePw(){
  return `<h1>غيّر كلمة السر</h1><p class="sub">أهلاً ${h(S.me&&S.me.full_name||"")}. كلمة السر الحالية مؤقتة، اختار كلمة سر جديدة خاصة بيك قبل ما تكمل.</p>${msgs()}
  <form id="pwF" class="cards" novalidate>${pwField("nPass","كلمة السر الجديدة (8 أحرف أو أكثر)","new-password")}${pwField("nPass2","أعد كلمة السر الجديدة","new-password")}
    <button class="btn" ${S.authBusy?"disabled":""}>${S.authBusy?"جاري الحفظ…":"حفظ والدخول"}</button></form>
  <div class="gate-links"><button type="button" class="linkbtn" data-logout>خروج</button></div>`;
}
function gatePending(){
  const p=S.me;
  return `<h1>${p&&p.role&&!p.active?"حسابك موقوف":"حسابك بانتظار التفعيل"}</h1>
  <p class="sub">${p&&p.role&&!p.active?"صاحب المطعم أوقف هذا الحساب. تواصل وياه إذا تعتقد اكو غلط.":"هذا الحساب ما إله صلاحية بعد. صاحب المطعم هو اللي يضيف الموظفين ويحدد شغلهم."}</p>
  ${p&&p.phone?`<p class="note" style="text-align:center">رقم الحساب: <span class="num">${h(p.phone)}</span></p>`:""}
  <button class="btn ghost" id="recheck">تحقق مرة ثانية</button>
  <div class="gate-links"><button type="button" class="linkbtn" data-logout>خروج</button></div>`;
}
function gateFatal(){return `<h1>ما اشتغل النظام</h1><p class="sub">${h(S.authErr||"ما كدرنا نحمل مكتبة الاتصال. تأكد من الإنترنت وحاول مرة ثانية.")}</p><button class="btn" onclick="location.reload()">إعادة المحاولة</button>`}

async function refreshOwnerExists(){try{S.ownerExists=await rpc("owner_exists")}catch(_){S.ownerExists=null}}

async function doLogin(){
  const phone=normPhone($("#lPhone").value);const pass=$("#lPass").value;S.lastPhone=$("#lPhone").value;S.authOk="";
  if(!phone){S.authErr="اكتب رقم موبايل عراقي صحيح يبدي بـ 07 (11 رقم)";return showGate("login")}
  if(!pass){S.authErr="اكتب كلمة السر";return showGate("login")}
  S.authBusy=true;S.authErr="";showGate("login");
  try{const {data,error}=await sb.auth.signInWithPassword({email:staffEmail(phone),password:pass});
    S.authBusy=false;
    if(error){S.authErr=/invalid|credentials/i.test(error.message||"")?"الرقم أو كلمة السر غلط":/confirm/i.test(error.message||"")?"الحساب ما متأكد. لازم يطفي المالك خيار Confirm email من إعدادات Supabase.":errText(error);return showGate("login")}
    await afterLogin(data.user);
  }catch(e){S.authBusy=false;S.authErr=errText(e);showGate("login")}
}
async function doSetup(){
  const name=$("#sName").value.trim(),phone=normPhone($("#sPhone").value),p1=$("#sPass").value,p2=$("#sPass2").value;S.authOk="";
  if(!name){S.authErr="اكتب اسمك";return showGate("setup")}
  if(!phone){S.authErr="اكتب رقم موبايل عراقي صحيح يبدي بـ 07";return showGate("setup")}
  if(p1.length<8){S.authErr="كلمة السر لازم 8 أحرف أو أكثر";return showGate("setup")}
  if(p1!==p2){S.authErr="كلمتين السر مو متطابقات";return showGate("setup")}
  S.authBusy=true;S.authErr="";showGate("setup");
  try{
    await refreshOwnerExists();
    if(S.ownerExists){S.authBusy=false;S.authErr="المالك مسجل من قبل. ادخل بحسابك.";return showGate("login")}
    const {data,error}=await sb.auth.signUp({email:staffEmail(phone),password:p1,options:{data:{full_name:name}}});
    S.authBusy=false;
    if(error){S.authErr=/registered|exists/i.test(error.message||"")?"هذا الرقم مسجل من قبل":errText(error);return showGate("setup")}
    if(!data.session){S.authErr="انعمل الحساب بس لازم تطفي «Confirm email» من إعدادات Supabase (شوف دليل الإعداد) وبعدين ادخل.";return showGate("login")}
    await afterLogin(data.user);
  }catch(e){S.authBusy=false;S.authErr=errText(e);showGate("setup")}
}
async function doChangePw(){
  const p1=$("#nPass").value,p2=$("#nPass2").value;
  if(p1.length<8){S.authErr="كلمة السر لازم 8 أحرف أو أكثر";return showGate("changepw")}
  if(p1!==p2){S.authErr="كلمتين السر مو متطابقات";return showGate("changepw")}
  S.authBusy=true;S.authErr="";showGate("changepw");
  try{const {error}=await sb.auth.updateUser({password:p1});
    if(error){S.authBusy=false;S.authErr=/different/i.test(error.message||"")?"اختار كلمة سر غير المؤقتة":errText(error);return showGate("changepw")}
    await rpc("password_changed");S.authBusy=false;S.me.must_change_password=false;toast("انحفظت كلمة السر الجديدة");await startApp();
  }catch(e){S.authBusy=false;S.authErr=errText(e);showGate("changepw")}
}

async function fetchProfile(){return q(sb.from("profiles").select("*").eq("id",S.uid).maybeSingle())}
async function afterLogin(user){
  S.uid=user.id;S.authErr="";
  try{S.me=await fetchProfile()}catch(e){S.authErr=errText(e);return showGate("login")}
  if(!S.me||!S.me.active||!S.me.role)return showGate("pending");
  if(S.me.must_change_password)return showGate("changepw");
  await startApp();
}
async function startApp(){
  S.role=S.me.role;if(lockedBranch())S.branch=lockedBranch();
  S.screen="app";const g=$("#gate");g.hidden=true;g.innerHTML="";$("#app").hidden=false;S.loaded=false;render();
  await loadAll();curBranch();subscribeOrders();render();
  if(S.role==="kitchen"||S.role==="cashier")keepAwake();
}
async function logout(){
  try{unsubscribeOrders();await sb.auth.signOut()}catch(_){}
  try{navigator.serviceWorker&&navigator.serviceWorker.controller&&navigator.serviceWorker.controller.postMessage("clear-api")}catch(_){}
  resetSession();await refreshOwnerExists();S.authErr="";S.authOk="";showGate("login");
}
function resetSession(){
  Object.assign(S,{uid:null,me:null,role:null,menu:[],today:[],orders:[],customers:[],staff:[],inv:[],levels:[],moves:[],suppliers:[],purchases:[],supPays:[],recipes:{},costRows:{},
    expenses:[],payments:[],cart:{},known:null,newStaff:null,staffMsg:null,modal:null,rcv:null,trf:null,wst:null,recDraft:null,recSel:null,invSel:null,supSel:null,loaded:false});
  history.replaceState(null,"",location.pathname+location.search);
}
let wakeLock=null;
async function keepAwake(){try{if("wakeLock" in navigator&&!wakeLock){wakeLock=await navigator.wakeLock.request("screen");wakeLock.addEventListener("release",()=>{wakeLock=null})}}catch(_){}}
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"&&S.screen==="app"){if(S.role==="kitchen"||S.role==="cashier")keepAwake();refreshLive()}});
