/* ---------- events ---------- */
document.addEventListener("click",async e=>{
  const t=e.target.closest("button,a[data-recgo],a#toSetup,a#toLogin,[data-close-bg]");if(!t)return;const d=t.dataset;
  /* modal + global */
  if(d.closeBg!==undefined){if(e.target===t)closeModal();return}
  if(d.close!==undefined){closeModal();return}
  if(t.id==="cmOk"){await confirmCostMode();return}
  if(d.eye){const i=document.getElementById(d.eye);if(i){const show=i.type==="password";i.type=show?"text":"password";t.textContent=show?"إخفاء":"إظهار"}return}
  if(d.installHelp!==undefined){openModal({kind:"install"});return}
  if(t.id==="installBtn"){doInstall();return}
  if(d.logout!==undefined){await logout();return}
  if(t.id==="toSetup"){e.preventDefault();S.authErr="";showGate("setup");return}
  if(t.id==="toLogin"){e.preventDefault();S.authErr="";showGate("login");return}
  if(t.id==="recheck"){const {data}=await sb.auth.getUser();if(data&&data.user)await afterLogin(data.user);else showGate("login");return}
  if(S.screen!=="app")return;
  /* app */
  if(d.recgo){S.recSel=d.recgo;S.recDraft=null;return}
  if(d.cat){S.cat=d.cat;render();return}
  if(d.add){S.cart[d.add]=(S.cart[d.add]||0)+1;render();return}
  if(d.dec){S.cart[d.dec]=(S.cart[d.dec]||0)-1;if(S.cart[d.dec]<=0)delete S.cart[d.dec];render();return}
  if(d.ch){S.channel=d.ch;if(!isOwn(d.ch))S.f.area="";render();return}
  if(t.id==="clear"){resetOrder();render();return}
  if(t.id==="toTicket"){const a=$(".ticket");if(a)a.scrollIntoView({behavior:"smooth",block:"start"});return}
  if(t.id==="save"){await saveOrder();return}
  if(d.adv){const o=S.today.find(x=>x.id===d.adv);if(o&&NEXT[o.status])await advance(o.id,NEXT[o.status]);return}
  if(d.kds){await advance(d.kds,d.to);return}
  if(d.cxok){S.confirmDel=null;await advance(d.cxok,"cancelled");return}
  if(d.askdel){S.confirmDel=d.askdel;render();return}
  if(d.del){S.confirmDel=null;const tbl=d.del;const rl={menu_items:["menu","recipes"],friend_payments:["payments"],expenses:["expenses"]}[tbl];if(!rl)return;
    await write(()=>q(sb.from(tbl).delete().eq("id",d.id)),"انحذف",rl);render();return}
  if(d.chdel!==undefined){const ch=[...S.settings.channels];ch.splice(Number(d.chdel),1);await saveSettings({channels:ch});return}
  if(t.id==="arAdd"){await saveSettings({areas:[...(S.settings.areas||[]),{name:"منطقة جديدة",fee:1000}]});return}
  if(d.ardel!==undefined){const ar=[...(S.settings.areas||[])];ar.splice(Number(d.ardel),1);await saveSettings({areas:ar});return}
  if(t.id==="chAdd"){await saveSettings({channels:[...S.settings.channels,{name:"مصدر جديد",pct:0,own:false}]});return}
  if(d.copy){const el=document.getElementById(d.copy);const txt=el?(el.value!==undefined&&el.tagName==="TEXTAREA"?el.value:el.textContent):"";
    let ok=false;try{await navigator.clipboard.writeText(txt);ok=true}catch(_){}
    if(!ok){try{const ta=document.createElement("textarea");ta.value=txt;ta.setAttribute("readonly","");ta.style.cssText="position:fixed;top:0;left:0;opacity:0";document.body.appendChild(ta);ta.focus();ta.select();ta.setSelectionRange(0,txt.length);ok=document.execCommand("copy");ta.remove()}catch(_){}}
    if(ok)toast("انتسخت الرسالة ✓ الصقها بالواتساب");else{if(el&&el.select){el.focus();el.select()}toast("انحدد النص، اضغط Ctrl+C أو انسخ يدوياً")}return}
  if(d.costmode){if(d.costmode===S.settings.costMode||S.modal)return;openModal({kind:"costmode",mode:d.costmode});return}
  if(d.dbr){S.dashBr=d.dbr;render();return}
  if(d.sloc){S.stockLoc=d.sloc;render();return}
  if(d.invsel!==undefined){S.invSel=d.invsel||null;if(S.invSel&&view()!=="items")location.hash="#items";else{render();if(S.invSel)scrollTo(0,0)}return}
  if(d.supsel!==undefined){S.supSel=d.supsel||null;render();if(S.supSel)scrollTo(0,0);return}
  if(d.recsel!==undefined){S.recSel=d.recsel||null;S.recDraft=null;render();const ed=$("#recEd");if(ed&&innerWidth<960)ed.scrollIntoView({block:"start"});return}
  if(t.id==="rlAdd"){S.recDraft.lines.push({itemId:"",qty:""});render();return}
  if(d.rldel!==undefined){S.recDraft.lines.splice(Number(d.rldel),1);render();return}
  if(t.id==="recSave"){await saveRecipe();return}
  if(t.id==="rcAdd"){S.rcv.lines.push({itemId:"",qty:"",unitCost:""});render();return}
  if(d.rcdel!==undefined){S.rcv.lines.splice(Number(d.rcdel),1);if(!S.rcv.lines.length)S.rcv.lines.push({itemId:"",qty:"",unitCost:""});render();return}
  if(t.id==="rcvSave"){await saveReceive();return}
  if(t.id==="trAdd"){S.trf.lines.push({itemId:"",qty:""});render();return}
  if(d.trdel!==undefined){S.trf.lines.splice(Number(d.trdel),1);if(!S.trf.lines.length)S.trf.lines.push({itemId:"",qty:""});render();return}
  if(t.id==="trfSave"){await saveTransfer();return}
  if(d.wtype){S.wst.type=d.wtype;S.wst.qty="";render();return}
  if(t.id==="wstSave"){await saveWaste();return}
  if(t.id==="stGen"){const i=$("#stPw");if(i){i.value=genPassword();if(S.newStaff)S.newStaff.pw=i.value}return}
  if(t.id==="waDone"){S.staffMsg=null;render();return}
  if(d.rstok){S.confirmDel=null;await resetStaffPw(d.rstok);return}
  if(d.usrdel){S.confirmDel=null;const ok=await write(()=>rpc("owner_delete_user",{p_user_id:d.usrdel}),"انحذف الحساب",["staff"]);if(ok)render();return}
  if(d.themeSet){const v=d.themeSet;if(v==="auto"){LS.del("crunchy.theme");delete document.documentElement.dataset.theme}else{LS.set("crunchy.theme",v);document.documentElement.dataset.theme=v}render();return}
});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&S.modal&&!S.modal.busy)closeModal()});
document.addEventListener("input",e=>{const t=e.target;const d=t.dataset;
  if(S.screen!=="app")return;
  if(t.id==="disc"){S.discount=Math.max(0,Number(toLatin(t.value))||0);const s=$("#sum");if(s)s.innerHTML=sumHtml(calcCart());return}
  if(t.id==="fphone"){S.f.phone=t.value;clearTimeout(lookupPhone.t);lookupPhone.t=setTimeout(lookupPhone,400);return}
  if(t.id==="fname"){S.f.name=t.value;return}if(t.id==="faddr"){S.f.address=t.value;return}if(t.id==="fnote"){S.f.note=t.value;return}
  if(t.id==="custq"){S.custQ=t.value;clearTimeout(S.cqT);S.cqT=setTimeout(()=>{const p=t.selectionStart;render();const n=$("#custq");if(n){n.focus();try{n.setSelectionRange(p,p)}catch(_){}}},300);return}
  if(d.rl!==undefined&&d.rf==="qty"&&S.recDraft){S.recDraft.lines[Number(d.rl)].qty=t.value;recRefresh();return}
  if(t.id==="ryield"&&S.recDraft){S.recDraft.yield=Math.max(1,Number(t.value)||1);recRefresh();return}
  if(t.id==="rnotes"&&S.recDraft){S.recDraft.notes=t.value;return}
  if(d.rc!==undefined&&d.rcf!=="itemId"&&S.rcv){S.rcv.lines[Number(d.rc)][d.rcf]=t.value;const el=$("#rtot");if(el)el.innerHTML=money(S.rcv.lines.reduce((a,l)=>a+(Number(l.qty)||0)*(Number(l.unitCost)||0),0));return}
  if(t.id==="rinv"&&S.rcv){S.rcv.invNo=t.value;return}
  if(d.tr!==undefined&&d.trf==="qty"&&S.trf){S.trf.lines[Number(d.tr)].qty=t.value;return}
  if(t.id==="tnote"&&S.trf){S.trf.note=t.value;return}
  if(t.id==="wqty"&&S.wst){S.wst.qty=t.value;return}
  if(t.id==="wreason"&&S.wst){S.wst.reason=t.value;return}
  if(S.newStaff&&["stName","stPhone","stPw"].includes(t.id)){S.newStaff[{stName:"name",stPhone:"phone",stPw:"pw"}[t.id]]=t.value;return}
});
function recRefresh(){const m=S.menu.find(x=>x.id===S.recSel);const el=$("#recsum");if(m&&el&&isMgr())el.innerHTML=recSummary(m,S.recDraft)}
const MENU_COL={name:"name",cat:"cat",code:"code",price:"price",appPrice:"app_price",active:"active"};
const INV_COL={name:"name",code:"code",unit:"unit",category:"category",minQty:"min_qty",active:"active"};
document.addEventListener("change",async e=>{const t=e.target;const d=t.dataset;
  if(S.screen!=="app")return;
  if(t.id==="brsel"){S.branch=t.value;LS.set("crunchy.branch",t.value);S.trf=null;render();return}
  if(t.id==="farea"){S.f.area=t.value;render();return}
  if(t.id==="stRole"&&S.newStaff){S.newStaff.role=t.value;S.newStaff.perms=null;render();return}
  if(t.id==="stBr"&&S.newStaff){S.newStaff.branch=t.value;return}
  if(d.arI!==undefined){const ar=(S.settings.areas||[]).map(a=>({...a}));const i=Number(d.arI);ar[i][d.af]=d.af==="fee"?Math.max(0,Number(t.value)||0):t.value.trim()||"منطقة";await saveSettings({areas:ar});return}
  if(d.chOwn!==undefined){const ch=S.settings.channels.map(c=>({...c}));ch[Number(d.chOwn)].own=t.checked;await saveSettings({channels:ch});return}
  if(t.id==="month"&&t.value){S.month=t.value>curYM()?curYM():t.value;$("#view").innerHTML=`<div class="empty">جاري التحميل…</div>`;await load(...monthLoads());render();return}
  if(d.f&&d.id){const f=d.f;const v=f==="active"?t.checked:(f==="price"||f==="appPrice")?Math.max(0,Number(t.value)||0):t.value.trim();if(f==="name"&&!v)return render();
    await write(()=>q(sb.from("menu_items").update({[MENU_COL[f]]:v}).eq("id",d.id)),"تم الحفظ",["menu"]);renderSafe();return}
  if(d.cost){const v=Math.max(0,Number(t.value)||0);if(curCost(d.cost)===v)return;await write(()=>q(sb.from("menu_costs").insert({menu_id:d.cost,cost:v})),"انحفظ سعر صديقك",["costs"]);renderSafe();return}
  if(d.cnote){await write(()=>q(sb.from("customers").update({notes:t.value.trim().slice(0,200)}).eq("phone",d.cnote)),"انحفظت الملاحظة",["customers"]);return}
  if(d.chI!==undefined){const ch=S.settings.channels.map(c=>({...c}));const i=Number(d.chI);ch[i][d.cf]=d.cf==="pct"?Math.max(0,Math.min(100,Number(t.value)||0)):t.value.trim()||"بدون اسم";await saveSettings({channels:ch});return}
  if(t.id==="pack"){await saveSettings({packaging:Math.max(0,Number(t.value)||0)});return}
  if(t.id==="late"){await saveSettings({lateMins:Math.max(5,Number(t.value)||35)});return}
  if(t.id==="dpct"){await saveSettings({directPct:Math.max(0,Number(t.value)||0)});return}
  if(t.id==="apct"){await saveSettings({appPct:Math.max(0,Number(t.value)||0)});return}
  if(d.rl!==undefined&&d.rf==="itemId"&&S.recDraft){S.recDraft.lines[Number(d.rl)].itemId=t.value;render();return}
  if(d.rc!==undefined&&d.rcf==="itemId"&&S.rcv){const l=S.rcv.lines[Number(d.rc)];l.itemId=t.value;if(t.value&&!l.unitCost){const it=invById(t.value);const c=it&&(it.lastCost||it.avgCost);if(c)l.unitCost=String(c)}render();return}
  if(t.id==="rsup"&&S.rcv){S.rcv.supplierId=t.value;return}
  if(t.id==="rdate"&&S.rcv){S.rcv.date=t.value;return}
  if(t.id==="tto"&&S.trf){S.trf.to=t.value;return}
  if(d.tr!==undefined&&d.trf==="itemId"&&S.trf){S.trf.lines[Number(d.tr)].itemId=t.value;render();return}
  if(t.id==="wloc"&&S.wst){S.wst.loc=t.value;render();return}
  if(t.id==="witem"&&S.wst){S.wst.itemId=t.value;render();return}
  if(d.inv&&d.if){const f=d.if;let v=f==="active"?t.checked:f==="minQty"?Math.max(0,Number(t.value)||0):t.value.trim();if(f==="name"&&!v)return render();
    if(f==="code"&&v&&S.inv.some(i=>i.id!==d.inv&&i.code===v)){toast("هذا الكود مستخدم لمادة ثانية");return render()}
    await write(()=>q(sb.from("inv_items").update({[INV_COL[f]]:v}).eq("id",d.inv)),"تم الحفظ",["inv"]);renderSafe();return}
  if(d.perm&&d.pre){const boxes=[...document.querySelectorAll(`input[data-perm][data-pre="${CSS.escape(d.pre)}"]`)];const list=boxes.filter(b=>b.checked).map(b=>b.dataset.perm);
    if(d.pre==="new"){S.newStaff=S.newStaff||{};S.newStaff.perms=list;return}
    const s=S.staff.find(x=>x.id===d.pre);if(!s)return;const full=(ROLE_PERMS[s.role]||[]).every(k=>list.includes(k));
    const ok=await write(()=>rpc("owner_set_perms",{p_user_id:s.id,p_perms:full?null:list}),"انحفظت الصلاحيات",["staff"]);if(!ok)await load("staff");renderSafe();return}
  if(d.stf&&d.sf){const s=S.staff.find(x=>x.id===d.stf);if(!s)return;const nx={...s,[d.sf]:d.sf==="active"?t.checked:t.value.trim()};
    const ok=await write(async()=>{await rpc("owner_set_staff",{p_user_id:s.id,p_full_name:nx.full_name||"",p_role:nx.role,p_branch_id:nx.branch_id||null,p_active:!!nx.active,p_must_change:null});if(d.sf==="role"&&nx.role!==s.role)await rpc("owner_set_perms",{p_user_id:s.id,p_perms:null})},"تم الحفظ",["staff"]);
    if(!ok)await load("staff");renderSafe();return}
  if(d.brf&&d.bf){const f=d.bf;const v=f==="active"?t.checked:t.value.trim();if(f==="name"&&!v)return render();
    await write(()=>q(sb.from("branches").update({[f]:v}).eq("id",d.brf)),"تم الحفظ",["branches"]);renderSafe();return}
});
document.addEventListener("submit",async e=>{e.preventDefault();const f=e.target;
  if(f.id==="loginF")return doLogin();
  if(f.id==="setupF")return doSetup();
  if(f.id==="pwF")return doChangePw();
  if(S.screen!=="app")return;
  if(f.id==="myPwF"){const p1=$("#myPw1").value,p2=$("#myPw2").value;if(p1.length<8){toast("كلمة السر لازم 8 أحرف أو أكثر");return}if(p1!==p2){toast("كلمتين السر مو متطابقات");return}
    const {error}=await sb.auth.updateUser({password:p1});if(error){toast(/different/i.test(error.message||"")?"اختار كلمة سر جديدة غير الحالية":errText(error));return}f.reset();toast("انحفظت كلمة السر الجديدة");return}
  if(f.id==="addF"){const name=$("#nName").value.trim();if(!name)return;const cost=Math.max(0,Number($("#nCost").value)||0);const dp=S.settings.directPct??20,ap=S.settings.appPct??40;
    const sort=Math.max(0,...S.menu.map(m=>m.sort||0))+1;
    await write(async()=>{const row=await q(sb.from("menu_items").insert({name,code:$("#nCode").value.trim(),cat:$("#nCat").value.trim()||"أخرى",price:Number($("#nPrice").value)||c250(cost*(1+dp/100)),app_price:Number($("#nApp").value)||c250(cost*(1+ap/100)),active:true,sort}).select().single());
      await q(sb.from("menu_costs").insert({menu_id:row.id,cost}))},"انضافت الوجبة",["menu","costs"]);render();return}
  if(f.id==="payF"||f.id==="expF"){const isPay=f.id==="payF";const amount=Math.round(Number($(isPay?"#payA":"#expA").value)||0);if(amount<=0)return;const [,b]=range(S.month);
    const at=new Date(S.month===curYM()?Date.now():b-1).toISOString();const note=$(isPay?"#payN":"#expN").value.trim();
    await write(()=>q(sb.from(isPay?"friend_payments":"expenses").insert(isPay?{amount,note,paid_at:at}:{amount,note,spent_at:at})),isPay?"انسجلت الدفعة":"انسجل المصروف",[isPay?"payments":"expenses"]);render();return}
  if(f.id==="invF"){const name=$("#iName").value.trim();if(!name)return;const code=$("#iCode").value.trim();
    if(code&&S.inv.some(i=>(i.code||"")===code)){toast("هذا الكود مستخدم لمادة ثانية");return}
    await write(()=>q(sb.from("inv_items").insert({name,code,unit:$("#iUnit").value,category:$("#iCat").value.trim(),min_qty:Math.max(0,Number($("#iMin").value)||0)})),"انضافت المادة",["inv"]);render();return}
  if(f.id==="supF"){const name=$("#sName").value.trim();if(!name)return;
    await write(()=>q(sb.from("suppliers").insert({name,phone:toLatin($("#sPhone").value.trim()),notes:$("#sNotes").value.trim()})),"انضاف المورد",["suppliers"]);render();return}
  if(f.id==="spayF"){const amount=Math.round(Number($("#spA").value)||0);if(amount<=0||!S.supSel)return;
    await write(()=>q(sb.from("supplier_payments").insert({supplier_id:S.supSel,amount,date:$("#spD").value||isoDay(Date.now()),note:$("#spN").value.trim()})),"انسجلت الدفعة للمورد",["supPays"]);render();return}
  if(f.id==="brF"){const name=$("#bName").value.trim();if(!name)return;
    await write(()=>q(sb.from("branches").insert({name,phone:toLatin($("#bPhone").value.trim()),address:$("#bAddr").value.trim()})),"انضاف الفرع",["branches"]);render();return}
  if(f.id==="staffF")return createStaff();
});
window.addEventListener("hashchange",()=>{S.confirmDel=null;if(S.screen==="app"){render();scrollTo(0,0);refreshFor(view())}});
/* background refresh of data that has no realtime feed (throttled per view) */
const VIEW_DATA={dash:["levels","inv","purchases","supPays","suppliers","month"],stock:["levels","inv","moves"],items:["levels","inv","moves"],receive:["purchases","suppliers","inv"],
  transfer:["levels","moves"],waste:["levels","moves"],suppliers:["suppliers","purchases","supPays"],customers:["customers"],recipes:["recipes","inv"],settle:["month","expenses","payments"],staff:["staff"],branches:["branches","levels"]};
const lastRefresh={};
async function refreshFor(v){
  const want=(VIEW_DATA[v]||[]).filter(n=>{const R={levels:"owner manager kitchen store",inv:"owner manager kitchen store",moves:"owner manager store",purchases:"owner manager store",suppliers:"owner manager store",
    supPays:"owner manager",month:"owner manager",customers:"owner manager cashier",recipes:"owner manager kitchen",expenses:"owner",payments:"owner",staff:"owner",branches:"owner"}[n];return R&&has(R)});
  if(!want.length||!navigator.onLine||Date.now()-(lastRefresh[v]||0)<20000)return;lastRefresh[v]=Date.now();
  await load(...want);if(view()===v)renderSafe();
}

/* ---------- actions ---------- */
async function saveSettings(p){
  Object.assign(S.settings,p);render();
  const col={channels:"channels",areas:"areas",packaging:"packaging",lateMins:"late_mins",directPct:"direct_pct",appPct:"app_pct"};
  const body={updated_at:new Date().toISOString()};for(const k of Object.keys(p))body[col[k]]=p[k];
  await write(()=>q(sb.from("settings").update(body).eq("id",1)),"تم الحفظ",["settings"]);renderSafe();
}
async function confirmCostMode(){
  const m=S.modal;if(!m||m.kind!=="costmode"||m.busy)return;m.busy=true;renderModal();
  const r=await write(()=>rpc("set_cost_mode",{p_mode:m.mode}),m.mode==="recipe"?"صار الحساب من الوصفات":"صار الحساب بسعر صديقك",["settings"]);
  closeModal();render();return r;
}
function resetOrder(){S.cart={};S.discount=0;S.f={phone:"",name:"",address:"",note:"",area:""};S.known=null}
async function saveOrder(){
  const c=calcCart();const br=curBranch();if(!c.lines.length||S.saving||!br)return;
  if(c.own&&!S.f.area){toast("اختار منطقة التوصيل");return}
  const key=normPhone(S.f.phone);S.saving=true;render();
  const row=await write(()=>q(sb.from("orders").insert({branch_id:br,channel:S.channel,items:c.lines.map(l=>({mid:l.mid,qty:l.qty,name:l.name,price:l.price})),discount:c.discount,
    customer:{phone:key||"",name:S.f.name.trim(),address:S.f.address.trim()},area:c.own?S.f.area:"",note:S.f.note.trim()}).select().single()));
  S.saving=false;
  if(row&&row.id){const o=mapOrder(row);upsertIn(S.today,o);if(has("owner manager"))upsertIn(S.orders,o);toast("انرسل الطلب للمطبخ · #"+o.no);resetOrder();if(key)load("customers")}
  render();
}
async function advance(id,next){
  const o=S.today.find(x=>x.id===id);if(!o||S.busy[id]||!STATUS[next])return;S.busy[id]=true;render();
  try{const row=await write(()=>rpc("advance_order",{p_order_id:id,p_status:next}),next==="cancelled"?"انلغى الطلب":STATUS[next].t);
    if(row&&row.id){const n=mapOrder(row);upsertIn(S.today,n);if(S.orders.some(x=>x.id===id))upsertIn(S.orders,n);
      if(n.consumed&&!o.consumed&&has("owner manager kitchen store"))load("levels").then(renderSafe)}
    else await load("today");
  }finally{delete S.busy[id];renderSafe()}
}
async function saveRecipe(){const d=S.recDraft;if(!d||S.saving)return;
  const lines=d.lines.map(l=>({item_id:l.itemId,qty:Number(l.qty)||0})).filter(l=>l.item_id&&l.qty>0);
  S.saving=true;const ok=await write(()=>q(sb.from("recipes").upsert({menu_id:d.mid,lines,yield:Math.max(1,Number(d.yield)||1),notes:(d.notes||"").trim(),updated_at:new Date().toISOString()},{onConflict:"menu_id"})),"انحفظت الوصفة",["recipes"]);
  S.saving=false;if(ok)S.recDraft=null;render()}
async function saveReceive(){
  const r=S.rcv;const lines=r.lines.map(l=>({item_id:l.itemId,qty:Number(l.qty)||0,unit_cost:Number(l.unitCost)||0})).filter(l=>l.item_id&&l.qty>0);
  if(!r.supplierId){toast("اختار المورد");return}if(!lines.length){toast("أضف مادة وحدة على الأقل بكمية");return}if(S.saving)return;
  S.saving=true;render();
  const ok=await write(()=>rpc("receive_purchase",{p_supplier_id:r.supplierId,p_inv_no:(r.invNo||"").trim(),p_date:r.date||isoDay(Date.now()),p_lines:lines}),"انسجلت الفاتورة ودخلت المخزن",["inv","levels","moves","purchases"]);
  S.saving=false;if(ok)S.rcv=null;render();
}
async function saveTransfer(){
  const t=S.trf;if(!t.to){toast("اختار الفرع");return}
  const per={};t.lines.forEach(l=>{const qy=Number(l.qty)||0;if(l.itemId&&qy>0)per[l.itemId]=(per[l.itemId]||0)+qy});
  const ids=Object.keys(per);if(!ids.length){toast("أضف مادة بكمية");return}
  for(const id of ids)if(per[id]>qtyAt(id,"store")+1e-9){toast("الكمية أكثر من رصيد المخزن: "+invName(id));return}
  if(S.saving)return;S.saving=true;render();
  const ok=await write(()=>rpc("transfer_stock",{p_to_branch:t.to,p_lines:ids.map(id=>({item_id:id,qty:per[id]})),p_note:(t.note||"").trim()}),"انرحلت المواد لمطبخ "+brName(t.to),["levels","moves"]);
  S.saving=false;if(ok)S.trf=null;render();
}
async function saveWaste(){
  const w=S.wst;if(!w.itemId){toast("اختار المادة");return}if(!(w.reason||"").trim()){toast("اكتب السبب");return}
  const v=Number(w.qty);if(w.qty===""||!Number.isFinite(v)||v<0||(w.type==="waste"&&v<=0)){toast("اكتب الكمية");return}
  if(w.type==="adjust"&&Math.abs(v-qtyAt(w.itemId,w.loc))<1e-9){toast("الرصيد مطابق، ما كو فرق");return}
  if(S.saving)return;S.saving=true;render();
  const ok=await write(()=>rpc("stock_adjust",{p_type:w.type,p_loc:w.loc,p_item_id:w.itemId,p_qty:v,p_reason:w.reason.trim()}),w.type==="waste"?"انسجل التالف":"انسجلت التسوية",["levels","moves"]);
  S.saving=false;if(ok)S.wst={type:w.type,loc:w.loc,itemId:"",qty:"",reason:""};render();
}

/* ---------- staff accounts ---------- */
async function createStaff(){
  if(S.saving)return;
  const name=$("#stName").value.trim(),raw=$("#stPhone").value,phone=normPhone(raw),pw=$("#stPw").value.trim(),role=$("#stRole").value,branch=$("#stBr").value;
  const pl=[...document.querySelectorAll('input[data-perm][data-pre="new"]')].filter(b=>b.checked).map(b=>b.dataset.perm);
  const perms=(ROLE_PERMS[role]||[]).every(k=>pl.includes(k))?null:pl;
  S.newStaff={name,phone:raw,pw,role,branch,perms};
  if(!name){toast("اكتب اسم الموظف");return}
  if(!phone){toast("اكتب رقم موبايل عراقي صحيح يبدي بـ 07");return}
  if(pw.length<8){toast("كلمة السر المؤقتة لازم 8 أحرف أو أكثر");return}
  if(!ROLE_T[role]||role==="owner"){toast("اختار الدور");return}
  if(S.me&&phone===S.me.phone){toast("هذا رقمك انت");return}
  S.saving=true;render();
  try{
    const tmp=makeClient(true);
    const {data,error}=await tmp.auth.signUp({email:staffEmail(phone),password:pw,options:{data:{full_name:name}}});
    if(error)throw error;
    const u=data&&data.user;
    if(!u||!u.id||(Array.isArray(u.identities)&&u.identities.length===0))throw {message:"already registered"};
    await rpc("owner_set_staff",{p_user_id:u.id,p_full_name:name,p_role:role,p_branch_id:branch||null,p_active:true,p_must_change:true});
    if(perms)await rpc("owner_set_perms",{p_user_id:u.id,p_perms:perms});
    try{await tmp.auth.signOut({scope:"local"})}catch(_){}
    S.staffMsg={name,phone,pw,role};S.newStaff=null;await load("staff");toast("انضاف الموظف");
  }catch(err){console.warn(err);
    toast(/registered|exists/i.test(String(err&&err.message))?"هذا الرقم مسجل من قبل. إذا هو موظف قديم، اعطيه كلمة سر جديدة من القائمة أو احذف حسابه وأضفه من جديد.":/password/i.test(String(err&&err.message))?"كلمة السر ضعيفة، ولّد وحدة ثانية":errText(err));
    await load("staff");
  }
  S.saving=false;render();if(S.staffMsg)scrollTo(0,0);
}
async function resetStaffPw(id){
  const s=S.staff.find(x=>x.id===id);if(!s)return;const pw=genPassword();
  const ok=await write(()=>rpc("owner_reset_password",{p_user_id:id,p_password:pw}),"انعملت كلمة سر مؤقتة جديدة",["staff"]);
  if(ok){S.staffMsg={name:s.full_name||"",phone:s.phone,pw,role:s.role,reset:true};render();scrollTo(0,0)}
  else{toast("ما اشتغل تغيير كلمة السر. أوقف الحساب أو احذفه وأضفه من جديد.");render()}
}
