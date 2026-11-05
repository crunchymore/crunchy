/* ---------- warehouse: stock levels ---------- */
function locChips(cur,withAll,attr){return `<div class="cats">${[...allLocs(),...(withAll?["*"]:[])].map(l=>`<button class="chip" data-${attr}="${h(l)}" aria-pressed="${l===cur}">${h(locName(l))}</button>`).join("")}</div>`}
function renderStock(){
  const loc=S.stockLoc==="*"||allLocs().includes(S.stockLoc)?S.stockLoc:"store";const items=activeInv();const low=lowList(loc);
  const last=S.moves.length?Math.max(...S.moves.map(m=>m.ts||0)):0;
  return `<div class="row" style="align-items:center;margin-bottom:12px"><h2 style="margin:0">أرصدة المخزن</h2>
    <div style="display:flex;gap:8px;flex:0 0 auto;min-width:0"><a class="btn sm" href="#receive" style="white-space:nowrap">استلام فاتورة</a><a class="btn ghost sm" href="#transfer" style="white-space:nowrap">ترحيل</a></div></div>
  ${locChips(loc,true,"sloc")}
  <div class="kpis"><div class="kpi"><div class="label">قيمة المخزون · ${h(locName(loc))}</div><div class="v">${money(stockValue(loc))}</div><div class="s">بمتوسط سعر الشراء</div></div>
    <div class="kpi"><div class="label">المواد</div><div class="v num">${items.length}</div><div class="s">مادة فعالة</div></div>
    <div class="kpi"><div class="label">تحت الحد الأدنى</div><div class="v num" style="${low.length?"color:var(--bad)":""}">${low.length}</div><div class="s">${low.length?"لازم تتعبى":"كلشي تمام"}</div></div>
    <div class="kpi"><div class="label">آخر حركة</div><div class="v" style="font-size:16px">${last?dateStr(last):"—"}</div><div class="s"><span class="num">${S.moves.length}</span> حركة حديثة</div></div></div>
  <div class="panel">${items.length?`<div class="tbl-wrap"><table><thead><tr><th>الكود</th><th>المادة</th><th>الصنف</th><th>الرصيد</th><th>الحد الأدنى</th><th>متوسط الكلفة</th><th>القيمة</th><th>الحالة</th></tr></thead><tbody>
    ${items.map(i=>{const qy=qtyAt(i.id,loc);const mn=Number(i.minQty)||0;const isLow=mn>0&&qy<mn;return `<tr class="${isLow?"low":""}"><td class="num">${h(i.code||"—")}</td><td><button class="linkbtn" data-invsel="${h(i.id)}">${h(i.name)}</button></td><td>${h(i.category||"")}</td>
      <td>${qn(qy,i.unit)}</td><td>${mn?qn(mn,i.unit):"—"}</td><td>${money(i.avgCost)}</td><td>${money(Math.max(0,qy)*(Number(i.avgCost)||0))}</td><td>${qy<0?`<span class="pill bad">سالب</span>`:isLow?`<span class="pill bad">ناقص</span>`:`<span class="pill good">متوفر</span>`}</td></tr>`}).join("")}
  </tbody></table></div>`:`<div class="empty">ما كو مواد بالمخزن بعد. <a href="#items">أضف أول مادة</a> (دجاج، زيت، خبز، صوصات، علب…).</div>`}</div>`;
}

/* ---------- warehouse: items & item card ---------- */
function moveRef(m){return m.reason||m.note||(m.type==="receive"&&m.purchaseId?"فاتورة "+((S.purchases.find(p=>p.id===m.purchaseId)||{}).invNo||""):"")}
function itemCard(i){
  const rows=[];for(const m of S.moves){const ef=moveEffects(m).filter(e=>e.itemId===i.id);if(!ef.length)continue;
    const byLoc={};ef.forEach(e=>{byLoc[e.loc]=(byLoc[e.loc]||0)+e.q});for(const [loc,qy] of Object.entries(byLoc))rows.push({ts:m.ts||0,type:m.type,loc,q:qy,uc:ef[0].uc,ref:moveRef(m)})}
  rows.sort((a,b)=>b.ts-a.ts);
  return `<div class="panel" id="invCard"><div class="row" style="align-items:center"><h2 style="margin:0">${h(i.name)}</h2>${i.code?`<span class="pill num" style="flex:0">${h(i.code)}</span>`:""}<button class="btn ghost sm" data-invsel="" style="flex:0">إغلاق</button></div>
    <div class="kpis" style="margin-top:12px">${allLocs().map(l=>`<div class="kpi"><div class="label">${h(locName(l))}</div><div class="v">${qn(qtyAt(i.id,l),i.unit)}</div></div>`).join("")}
      <div class="kpi hl"><div class="label">القيمة الكلية</div><div class="v">${money(Math.max(0,qtyAt(i.id,"*"))*(Number(i.avgCost)||0))}</div><div class="s">متوسط الكلفة ${fmt(i.avgCost)} د.ع / ${h(i.unit||"")}</div></div></div>
    <h3>حركة المادة (آخر الحركات)</h3>${rows.length?`<div class="tbl-wrap"><table><thead><tr><th>التاريخ</th><th>النوع</th><th>الموقع</th><th>الكمية</th><th>سعر الوحدة</th><th>البيان</th></tr></thead><tbody>
    ${rows.slice(0,150).map(r=>`<tr><td class="num">${dateStr(r.ts)} ${timeStr(r.ts)}</td><td><span class="pill ${(MOVE_T[r.type]||{}).c||""}">${h((MOVE_T[r.type]||{t:r.type}).t)}</span></td><td>${h(locName(r.loc))}</td><td><span class="num" style="color:${r.q<0?"var(--bad)":"var(--good)"}">${r.q>0?"+":""}${fq(r.q)}</span></td><td>${r.uc!=null?money(r.uc):"—"}</td><td>${h(r.ref||"")}</td></tr>`).join("")}</tbody></table></div>`:`<div class="empty">ما كو حركات لهالمادة بعد</div>`}</div>`;
}
function renderItems(){
  const sel=S.invSel&&invById(S.invSel);const items=[...S.inv].sort((a,b)=>(a.category||"").localeCompare(b.category||"","ar")||(a.name||"").localeCompare(b.name||"","ar"));
  const cats=[...new Set(S.inv.map(i=>i.category).filter(Boolean))];
  return `${sel?itemCard(sel):""}<div class="panel"><h2>المواد الخام</h2><p class="note">كل مادة بكود ووحدة. الحد الأدنى يخلي المادة تتلون أحمر لما رصيدها ينزل تحته. متوسط الكلفة يتحدث تلقائياً من فواتير الشراء.</p>
    <form id="invF" class="row" style="margin:12px 0 16px">
      <div class="field" style="flex:2"><label class="label" for="iName">اسم المادة</label><input id="iName" required placeholder="صدر دجاج" maxlength="80"></div>
      <div class="field"><label class="label" for="iCode">الكود</label><input id="iCode" placeholder="RM-001" class="num" maxlength="30"></div>
      <div class="field"><label class="label" for="iUnit">الوحدة</label><select id="iUnit">${opts(UNITS.map(u=>[u,u]),"كغم")}</select></div>
      <div class="field"><label class="label" for="iCat">الصنف</label><input id="iCat" list="icats" placeholder="لحوم"></div>
      <div class="field"><label class="label" for="iMin">الحد الأدنى</label><input id="iMin" type="number" min="0" step="any" inputmode="decimal" placeholder="0"></div>
      <button class="btn sm" style="flex:0">إضافة</button></form>
    <datalist id="icats">${cats.map(c=>`<option value="${h(c)}">`).join("")}</datalist>
    ${items.length?`<div class="tbl-wrap"><table class="menu-tbl"><thead><tr><th>الكود</th><th>المادة</th><th>الوحدة</th><th>الصنف</th><th>الحد الأدنى</th><th>الرصيد الكلي</th><th>متوسط الكلفة</th><th>فعالة</th><th></th></tr></thead><tbody>
    ${items.map(i=>`<tr class="${i.id===S.invSel?"sel":""}"><td><input id="iv-code-${h(i.id)}" data-inv="${h(i.id)}" data-if="code" value="${h(i.code||"")}" class="num"></td>
      <td><input id="iv-name-${h(i.id)}" data-inv="${h(i.id)}" data-if="name" value="${h(i.name)}" style="min-width:130px"></td>
      <td><select id="iv-unit-${h(i.id)}" data-inv="${h(i.id)}" data-if="unit">${opts(UNITS.map(u=>[u,u]),i.unit)}</select></td>
      <td><input id="iv-cat-${h(i.id)}" data-inv="${h(i.id)}" data-if="category" value="${h(i.category||"")}" list="icats"></td>
      <td><input id="iv-min-${h(i.id)}" data-inv="${h(i.id)}" data-if="minQty" type="number" min="0" step="any" value="${h(i.minQty||0)}"></td>
      <td class="m">${qn(qtyAt(i.id,"*"),i.unit)}</td><td class="m">${money(i.avgCost)}</td>
      <td><input type="checkbox" id="iv-act-${h(i.id)}" data-inv="${h(i.id)}" data-if="active" ${i.active!==false?"checked":""} aria-label="فعالة"></td>
      <td><button class="btn ghost sm" data-invsel="${h(i.id)}">البطاقة</button></td></tr>`).join("")}</tbody></table></div>`:`<div class="empty">ما كو مواد بعد. أضف أول مادة من الفورم فوق.</div>`}</div>`;
}

/* ---------- warehouse: receive purchase invoice ---------- */
function renderReceive(){
  if(!S.rcv)S.rcv={supplierId:"",invNo:"",date:isoDay(Date.now()),lines:[{itemId:"",qty:"",unitCost:""}]};const r=S.rcv;
  const tot=r.lines.reduce((a,l)=>a+(Number(l.qty)||0)*(Number(l.unitCost)||0),0);
  const recent=[...S.purchases].sort((a,b)=>(b.ts||0)-(a.ts||0)).slice(0,20);
  return `<div class="cols"><div class="panel"><h2>استلام فاتورة شراء</h2><p class="note">سجل الفاتورة مثل ما وصلت من المورد. المواد تدخل المخزن الرئيسي، ومتوسط الكلفة يتحدث لكل مادة.</p>
    ${!S.suppliers.length?`<div class="banner">ما كو موردين. <a href="#suppliers">أضف مورد</a> أول.</div>`:""}${!S.inv.length?`<div class="banner">ما كو مواد. <a href="#items">أضف المواد</a> أول.</div>`:""}
    <div class="row"><div class="field" style="flex:2"><label class="label" for="rsup">المورد</label><select id="rsup">${opts(S.suppliers.filter(s=>s.active!==false).map(s=>[s.id,s.name]),r.supplierId,"اختار المورد")}</select></div>
      <div class="field"><label class="label" for="rinv">رقم الفاتورة</label><input id="rinv" value="${h(r.invNo)}" class="num" maxlength="60"></div>
      <div class="field"><label class="label" for="rdate">التاريخ</label><input id="rdate" type="date" value="${h(r.date)}"></div></div>
    <h3 style="margin-top:14px">المواد</h3>
    ${r.lines.map((l,i)=>`<div class="row lr"><div class="field" style="flex:3"><label class="label" for="rc-item-${i}">المادة</label><select id="rc-item-${i}" data-rc="${i}" data-rcf="itemId">${invOpts(l.itemId)}</select></div>
      <div class="field"><label class="label" for="rc-qty-${i}">الكمية ${l.itemId?"("+h(invUnit(l.itemId))+")":""}</label><input id="rc-qty-${i}" data-rc="${i}" data-rcf="qty" type="number" min="0" step="any" inputmode="decimal" value="${h(l.qty)}"></div>
      <div class="field"><label class="label" for="rc-cost-${i}">سعر الوحدة</label><input id="rc-cost-${i}" data-rc="${i}" data-rcf="unitCost" type="number" min="0" step="any" inputmode="decimal" value="${h(l.unitCost)}"></div>
      <button class="btn ghost sm x" data-rcdel="${i}">حذف</button></div>`).join("")}
    <button class="btn ghost sm" id="rcAdd">+ سطر</button>
    <div class="tot-line"><span>مجموع الفاتورة</span><span id="rtot">${money(tot)}</span></div>
    <button class="btn" id="rcvSave" ${S.suppliers.length&&S.inv.length&&!S.saving?"":"disabled"}>استلام وإدخال للمخزن</button></div>
  <div class="panel"><h3>آخر الفواتير</h3>${recent.length?`<div class="tbl-wrap"><table><thead><tr><th>التاريخ</th><th>المورد</th><th>رقم</th><th>المواد</th><th>المبلغ</th></tr></thead><tbody>
    ${recent.map(p=>`<tr><td class="num">${h(p.date||"")}</td><td>${h(supName(p.supplierId))}</td><td class="num">${h(p.invNo||"—")}</td><td class="num">${(p.lines||[]).length}</td><td>${money(p.total)}</td></tr>`).join("")}</tbody></table></div>`:`<div class="empty">ما كو فواتير مسجلة بعد</div>`}</div></div>`;
}

/* ---------- warehouse: transfer store -> branch kitchen ---------- */
function renderTransfer(){
  const ab=activeBranches();if(!S.trf)S.trf={to:ab.length===1?ab[0].id:"",lines:[{itemId:"",qty:""}],note:""};const t=S.trf;
  const recent=S.moves.filter(m=>m.type==="transfer").sort((a,b)=>(b.ts||0)-(a.ts||0)).slice(0,20);
  return `<div class="cols"><div class="panel"><h2>ترحيل للفرع</h2><p class="note">نقل مواد من المخزن الرئيسي لمطبخ الفرع. الرصيد ينقص من المخزن ويزيد بمطبخ الفرع.</p>
    <div class="row"><div class="field"><label class="label" for="tto">إلى مطبخ</label><select id="tto">${opts(ab.map(b=>[b.id,b.name||"فرع"]),t.to,"اختار الفرع")}</select></div>
      <div class="field" style="flex:2"><label class="label" for="tnote">ملاحظة</label><input id="tnote" value="${h(t.note)}" placeholder="تعبئة الصبح" maxlength="200"></div></div>
    <h3 style="margin-top:14px">المواد</h3>
    ${t.lines.map((l,i)=>`<div class="row lr"><div class="field" style="flex:3"><label class="label" for="tr-item-${i}">المادة</label><select id="tr-item-${i}" data-tr="${i}" data-trf="itemId">${invOpts(l.itemId)}</select>${l.itemId?`<span class="mini">رصيد المخزن: ${qn(qtyAt(l.itemId,"store"),invUnit(l.itemId))}</span>`:""}</div>
      <div class="field"><label class="label" for="tr-qty-${i}">الكمية</label><input id="tr-qty-${i}" data-tr="${i}" data-trf="qty" type="number" min="0" step="any" inputmode="decimal" value="${h(l.qty)}"></div>
      <button class="btn ghost sm x" data-trdel="${i}">حذف</button></div>`).join("")}
    <button class="btn ghost sm" id="trAdd">+ سطر</button>
    <div style="margin-top:12px"><button class="btn" id="trfSave" ${S.inv.length&&!S.saving?"":"disabled"}>ترحيل</button></div></div>
  <div class="panel"><h3>آخر الترحيلات</h3>${recent.length?`<div class="tbl-wrap"><table><thead><tr><th>التاريخ</th><th>إلى</th><th>المواد</th></tr></thead><tbody>
    ${recent.map(m=>`<tr><td class="num">${dateStr(m.ts)} ${timeStr(m.ts)}</td><td>${h(locName(m.toLoc))}</td><td>${m.lines.map(l=>`${h(invName(l.itemId))} ${qn(Math.abs(l.qty),invUnit(l.itemId))}`).join("، ")}</td></tr>`).join("")}</tbody></table></div>`:`<div class="empty">ما كو ترحيلات بعد</div>`}</div></div>`;
}

/* ---------- warehouse: waste & stock count ---------- */
function renderWaste(){
  if(!S.wst)S.wst={type:"waste",loc:"store",itemId:"",qty:"",reason:""};const w=S.wst;if(!allLocs().includes(w.loc))w.loc="store";
  const cur=w.itemId?qtyAt(w.itemId,w.loc):0;
  const recent=S.moves.filter(m=>m.type==="waste"||m.type==="adjust").sort((a,b)=>(b.ts||0)-(a.ts||0)).slice(0,30);
  return `<div class="cols"><div class="panel"><h2>تلف وجرد</h2>
    <div class="seg" style="margin-bottom:12px"><button data-wtype="waste" aria-pressed="${w.type==="waste"}">تسجيل تالف</button><button data-wtype="adjust" aria-pressed="${w.type==="adjust"}">تسوية جرد</button></div>
    <p class="note">${w.type==="waste"?"مادة خربت أو انكبت أو انتهت صلاحيتها: تنخصم من الموقع مع السبب.":"اكتب الرصيد الفعلي اللي حسبته بإيدك، والنظام يسجل الفرق تلقائياً."}</p>
    <div class="row"><div class="field"><label class="label" for="wloc">الموقع</label><select id="wloc">${opts(allLocs().map(l=>[l,locName(l)]),w.loc)}</select></div>
      <div class="field" style="flex:2"><label class="label" for="witem">المادة</label><select id="witem">${invOpts(w.itemId)}</select></div></div>
    ${w.itemId?`<p class="note">الرصيد بالنظام: ${qn(cur,invUnit(w.itemId))}</p>`:""}
    <div class="row"><div class="field"><label class="label" for="wqty">${w.type==="waste"?"الكمية التالفة":"الرصيد الفعلي"}</label><input id="wqty" type="number" min="0" step="any" inputmode="decimal" value="${h(w.qty)}"></div>
      <div class="field" style="flex:2"><label class="label" for="wreason">السبب</label><input id="wreason" value="${h(w.reason)}" placeholder="${w.type==="waste"?"دجاج انتهت صلاحيته":"جرد آخر الشهر"}" maxlength="200"></div></div>
    <div style="margin-top:12px"><button class="btn" id="wstSave" ${S.inv.length&&!S.saving?"":"disabled"}>${w.type==="waste"?"تسجيل التالف":"تسجيل التسوية"}</button></div></div>
  <div class="panel"><h3>آخر التوالف والتسويات</h3>${recent.length?`<div class="tbl-wrap"><table><thead><tr><th>التاريخ</th><th>النوع</th><th>الموقع</th><th>المادة</th><th>الكمية</th><th>القيمة</th><th>السبب</th></tr></thead><tbody>
    ${recent.map(m=>{const l=m.lines[0]||{};const qy=Number(l.qty)||0;const sq=m.type==="waste"?-Math.abs(qy):qy;return `<tr><td class="num">${dateStr(m.ts)}</td><td><span class="pill ${MOVE_T[m.type].c}">${MOVE_T[m.type].t}</span></td><td>${h(locName(m.loc))}</td><td>${h(invName(l.itemId))}</td><td><span class="num" style="color:${sq<0?"var(--bad)":"var(--good)"}">${sq>0?"+":""}${fq(sq)}</span></td><td>${money(Math.abs(sq)*(Number(l.unitCost)||0))}</td><td>${h(m.reason||"")}</td></tr>`}).join("")}</tbody></table></div>`:`<div class="empty">ما كو شي مسجل</div>`}</div></div>`;
}

/* ---------- warehouse: suppliers ---------- */
function renderSuppliers(){
  const sel=S.supSel&&S.suppliers.find(s=>s.id===S.supSel);const seeBal=isMgr();
  let st="";
  if(sel){const b=supBal(sel.id);const inv=S.purchases.filter(p=>p.supplierId===sel.id).map(p=>({ts:p.ts||0,date:p.date,kind:"inv",t:"فاتورة "+(p.invNo||""),amt:Number(p.total)||0}));
    const pays=S.supPays.filter(p=>p.supplierId===sel.id).map(p=>({ts:p.ts||0,date:p.date,kind:"pay",t:p.note||"دفعة",amt:Number(p.amount)||0}));
    const rows=[...inv,...pays].sort((a,b)=>(b.date||"").localeCompare(a.date||"")||b.ts-a.ts);
    st=`<div class="panel" id="supCard"><div class="row" style="align-items:center"><h2 style="margin:0">كشف حساب: ${h(sel.name)}</h2><button class="btn ghost sm" data-supsel="" style="flex:0">إغلاق</button></div>
      <div class="ledger" style="margin-top:8px"><div><span>مجموع الفواتير</span>${money(b.inv)}</div>${seeBal?`<div class="minus"><span>المدفوع</span>${money(b.paid)}</div>
      <div class="tot"><span>الباقي بذمتك</span>${b.bal>0?`<span class="pill bad">${money(b.bal)}</span>`:`<span class="pill good">مسدد</span>`}</div>`:""}</div>
      ${isOwner()?`<form id="spayF" class="row" style="margin:12px 0"><div class="field"><label class="label" for="spA">دفعة للمورد</label><input id="spA" type="number" min="1" required inputmode="numeric"></div>
        <div class="field"><label class="label" for="spD">التاريخ</label><input id="spD" type="date" value="${isoDay(Date.now())}"></div>
        <div class="field" style="flex:2"><label class="label" for="spN">ملاحظة</label><input id="spN" placeholder="نقد / حوالة" maxlength="120"></div><button class="btn sm" style="flex:0">سجل</button></form>`:`<p class="note">الدفعات للمورد يسجلها المالك.</p>`}
      ${rows.length?`<div class="tbl-wrap"><table><thead><tr><th>التاريخ</th><th>البيان</th><th>عليك</th>${seeBal?"<th>دفعت</th>":""}</tr></thead><tbody>${rows.filter(r=>seeBal||r.kind==="inv").map(r=>`<tr><td class="num">${h(r.date||dateStr(r.ts))}</td><td>${h(r.t)}</td><td>${r.kind==="inv"?money(r.amt):""}</td>${seeBal?`<td>${r.kind==="pay"?money(r.amt):""}</td>`:""}</tr>`).join("")}</tbody></table></div>`:`<div class="empty">ما كو حركات</div>`}</div>`}
  return `${st}<div class="panel"><h2>الموردين</h2>
    <form id="supF" class="row" style="margin:12px 0 16px"><div class="field" style="flex:2"><label class="label" for="sName">اسم المورد</label><input id="sName" required placeholder="مجزرة الدجاج" maxlength="80"></div>
      <div class="field"><label class="label" for="sPhone">الهاتف</label><input id="sPhone" type="tel" inputmode="tel" class="num" dir="ltr" maxlength="20"></div>
      <div class="field" style="flex:2"><label class="label" for="sNotes">ملاحظات</label><input id="sNotes" placeholder="يوصل كل أحد وأربعاء" maxlength="200"></div><button class="btn sm" style="flex:0">إضافة</button></form>
    ${S.suppliers.length?`<div class="tbl-wrap"><table><thead><tr><th>المورد</th><th>الهاتف</th><th>الفواتير</th>${seeBal?"<th>المدفوع</th><th>الباقي</th>":""}<th></th></tr></thead><tbody>
    ${[...S.suppliers].sort((a,b)=>(a.name||"").localeCompare(b.name||"","ar")).map(s=>{const b=supBal(s.id);return `<tr class="${s.id===S.supSel?"sel":""}"><td><b>${h(s.name)}</b>${s.notes?`<div class="mini">${h(s.notes)}</div>`:""}</td><td class="num">${h(s.phone||"")}</td><td>${money(b.inv)}</td>${seeBal?`<td>${money(b.paid)}</td><td>${b.bal>0?`<span class="pill bad">${money(b.bal)}</span>`:`<span class="pill good">مسدد</span>`}</td>`:""}
      <td><button class="btn ghost sm" data-supsel="${h(s.id)}">كشف حساب</button></td></tr>`}).join("")}</tbody></table></div>`:`<div class="empty">ما كو موردين بعد. أضف أول مورد من الفورم فوق.</div>`}</div>`;
}
