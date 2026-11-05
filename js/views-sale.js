/* ---------- POS ---------- */
function sumHtml(c){return `<div><span>المجموع</span>${money(c.subtotal)}</div>
  ${c.discount?`<div><span>الخصم</span>${money(-c.discount)}</div>`:""}
  ${c.own?`<div><span>التوصيل${S.f.area?" · "+h(S.f.area):""}</span>${S.f.area?money(c.deliveryFee):'<span class="note">اختار المنطقة</span>'}</div>`:""}
  <div class="big"><span>المطلوب من الزبون</span>${money(c.total)}</div>`}
function renderPOS(){
  const chs=S.settings.channels||[];
  if(!S.channel||!chs.some(c=>c.name===S.channel))S.channel=(chs[0]||{}).name||"";
  const active=S.menu.filter(m=>m.active!==false);
  const cats=["الكل",...new Set(active.map(m=>m.cat||"أخرى"))];
  if(!cats.includes(S.cat))S.cat="الكل";
  const shown=active.filter(m=>S.cat==="الكل"||(m.cat||"أخرى")===S.cat);
  const c=calcCart();const br=curBranch();
  return `<div class="pos">
    <section>${!S.loaded?`<div class="empty">جاري تحميل المنيو…</div>`:!active.length?`<div class="panel empty">المنيو فارغ. ${isOwner()?`أضف الوجبات من <a href="#menu">المنيو والأسعار</a>.`:"اطلب من المالك يضيف الوجبات."}</div>`:
      `<div class="cats">${cats.map(x=>`<button class="chip" data-cat="${h(x)}" aria-pressed="${x===S.cat}">${h(x)}</button>`).join("")}</div>
       <div class="grid">${shown.map(m=>`<button class="item" data-add="${h(m.id)}">${S.cart[m.id]?`<span class="q num">×${S.cart[m.id]}</span>`:""}<span class="n">${h(m.name)}</span><span class="p">${money(priceFor(m))}</span></button>`).join("")}</div>`}
    </section>
    <aside class="ticket" aria-label="الطلب الحالي">
      <div class="ticket-head"><h2 style="margin:0">طلب جديد</h2><span class="note">${activeBranches().length>1&&br?h(brName(br))+" · ":""}<span class="num">${timeStr(Date.now())}</span></span></div>
      <div class="field"><span class="label">مصدر الطلب</span>
        <div class="seg">${chs.map(ch=>`<button data-ch="${h(ch.name)}" aria-pressed="${ch.name===S.channel}">${h(ch.name)}</button>`).join("")}</div></div>
      <div class="cust">
        <div class="row"><div class="field"><label class="label" for="fphone">رقم الزبون</label><input id="fphone" type="tel" inputmode="tel" class="num" dir="ltr" value="${h(S.f.phone)}" placeholder="07xxxxxxxxx"></div>
          <div class="field"><label class="label" for="fname">الاسم</label><input id="fname" value="${h(S.f.name)}" maxlength="80"></div></div>
        ${c.own?`<div class="field"><label class="label" for="farea">منطقة التوصيل</label><select id="farea"><option value="">اختار المنطقة</option>${(S.settings.areas||[]).map(a=>`<option value="${h(a.name)}" ${a.name===S.f.area?"selected":""}>${h(a.name)} · ${fmt(a.fee)} د.ع</option>`).join("")}</select></div>`:""}
        <div class="field"><label class="label" for="faddr">العنوان</label><input id="faddr" value="${h(S.f.address)}" placeholder="الشارع، أقرب نقطة دالة" maxlength="200"></div>
        <div id="knownBox">${knownHtml()}</div>
      </div>
      <div class="lines">${c.lines.length?c.lines.map(l=>`<div class="line"><span class="nm">${h(l.name)}</span>
          <span class="step"><button data-dec="${h(l.mid)}" aria-label="إنقاص">−</button><span class="num" style="min-width:20px;text-align:center">${l.qty}</span><button data-add="${h(l.mid)}" aria-label="زيادة">+</button></span>
          <span>${money(l.price*l.qty)}</span></div>`).join(""):`<div class="empty">اضغط على أي وجبة حتى تنضاف للطلب</div>`}</div>
      <div class="row"><div class="field"><label class="label" for="disc">خصم (د.ع)</label><input id="disc" type="number" min="0" step="250" inputmode="numeric" value="${S.discount||""}" placeholder="0"></div>
        <div class="field" style="flex:2"><label class="label" for="fnote">ملاحظة للمطبخ</label><input id="fnote" value="${h(S.f.note)}" placeholder="بدون مخلل، حار زيادة" maxlength="300"></div></div>
      <div class="sum" id="sum">${sumHtml(c)}</div>
      <div class="row"><button class="btn" id="save" ${!c.lines.length||!br||S.saving||(c.own&&!S.f.area)?"disabled":""}>${S.saving?"جاري الإرسال…":"إرسال الطلب للمطبخ"}</button>
        ${c.lines.length?`<button class="btn ghost" id="clear" style="flex:0">إفراغ</button>`:""}</div>
      ${!br?`<div class="note">ما كو فرع فعال. ${isOwner()?`أضف فرع من <a href="#branches">الفروع</a>.`:"اطلب من المالك يفعّل فرع."}</div>`:""}
    </aside></div>
    ${c.lines.length?`<button class="cartbar" id="toTicket" type="button"><span><span class="num">${c.lines.reduce((a,l)=>a+l.qty,0)}</span> صنف · ${money(c.total)}</span><b>إكمال الطلب ↓</b></button>`:""}`;
}
function knownHtml(){const k=S.known;if(!k)return "";return `<div class="known">زبون قديم · <span class="num">${k.count||0}</span> طلب · آخر طلب ${k.lastTs?dateStr(k.lastTs):"—"}</div>${k.notes?`<div class="note">ملاحظة: ${h(k.notes)}</div>`:""}`}
async function lookupPhone(){
  const key=normPhone(S.f.phone);S.known=null;
  if(!key){const b=$("#knownBox");if(b)b.innerHTML="";return}
  try{const r=await q(sb.from("customers").select("*").eq("phone",key).maybeSingle());
    if(r&&normPhone(S.f.phone)===key){S.known=mapCust(r);if(!S.f.name)S.f.name=S.known.name||"";if(!S.f.address)S.f.address=S.known.address||"";
      const n=$("#fname"),a=$("#faddr");if(n&&!n.value)n.value=S.f.name;if(a&&!a.value)a.value=S.f.address;
      if(!S.f.area&&S.known.area&&(S.settings.areas||[]).some(x=>x.name===S.known.area)){S.f.area=S.known.area;setTimeout(renderSafe,0)}}}catch(_){}
  const b=$("#knownBox");if(b)b.innerHTML=knownHtml();
}

/* ---------- board ---------- */
const itemsTxt=o=>(o.items||[]).map(i=>`${h(i.name)} <span class="num">×${i.qty}</span>`).join("، ");
function renderBoard(){
  const late=Number(S.settings.lateMins)||35;const tb=todayBr();const multi=activeBranches().length>1;
  const col=(st,title)=>{const list=tb.filter(o=>o.status===st).sort((a,b)=>a.ts-b.ts);
    return `<div class="col"><h3><span>${title}</span><span class="pill num">${list.length}</span></h3>${list.length?list.map(o=>{const m=mins(o.ts);return `<div class="card ${m>=late?"late":""}" data-order="${h(o.id)}">
      <div class="t"><span>${h(o.channel)} · <span class="num">#${h(o.no)}</span></span><span class="num ${m>=late?"":"note"}" style="${m>=late?"color:var(--bad)":""}">${m} د</span></div>
      <div class="its">${itemsTxt(o)}</div>
      ${o.note?`<div class="note">ملاحظة: ${h(o.note)}</div>`:""}
      ${o.customer&&(o.customer.name||o.customer.phone)?`<div class="who">${h(o.customer.name||"")} <span class="num">${h(o.customer.phone||"")}</span>${o.area?` · <b>${h(o.area)}</b>`:""}${o.customer.address?` · ${h(o.customer.address)}`:""}</div>`:""}
      ${o.deliveryFee?`<div class="note">يستلم من الزبون: ${money((o.revenue||0)+(o.deliveryFee||0))} (ويا التوصيل)</div>`:""}
      <div class="row" style="margin-top:4px"><button class="btn dark sm" data-adv="${h(o.id)}" ${S.busy[o.id]?"disabled":""}>${NEXT_T[o.status]}</button>
        ${S.confirmDel==="cx"+o.id?`<button class="btn danger sm" data-cxok="${h(o.id)}" style="flex:0">تأكيد الإلغاء</button>`:`<button class="btn ghost sm" data-askdel="cx${h(o.id)}" style="flex:0">إلغاء</button>`}</div></div>`}).join(""):`<div class="empty" style="padding:12px">ما كو</div>`}</div>`};
  const done=tb.filter(o=>o.status==="done"||o.status==="cancelled").sort((a,b)=>b.ts-a.ts);
  return `<div class="row" style="margin-bottom:12px;align-items:center"><h2 style="margin:0">طلبات اليوم${multi?" · "+h(brName(curBranch())):""}</h2><span class="note" style="flex:1 1 220px">الطلب اللي يتجاوز <span class="num">${late}</span> دقيقة يتلون أحمر</span></div>
  <div class="board">${col("new","جديد")}${col("prep","قيد التحضير")}${col("ready","جاهز")}${col("out","بالطريق")}</div>
  <div class="panel" style="margin-top:18px"><h3>اللي خلصت اليوم · <span class="num">${done.length}</span></h3>
  ${done.length?`<div class="tbl-wrap"><table><tbody>${done.map(o=>`<tr class="${o.status==="cancelled"?"cx":""}"><td class="num">#${h(o.no)}</td><td class="num">${timeStr(o.ts)}</td><td>${h(o.channel)}</td><td>${itemsTxt(o)}</td><td>${money(o.revenue)}</td><td><span class="pill ${STATUS[o.status].c}">${STATUS[o.status].t}</span></td></tr>`).join("")}</tbody></table></div>`:`<div class="empty">بعد ما كو طلبات مسلمة اليوم</div>`}</div>`;
}

/* ---------- customers ---------- */
function renderCustomers(){
  const qy=S.custQ.trim();const list=S.customers.filter(c=>!qy||(c.name||"").includes(qy)||(c.phone||"").includes(toLatin(qy))||(c.address||"").includes(qy)||(c.area||"").includes(qy));
  return `<div class="panel"><div class="row" style="align-items:center;margin-bottom:12px"><h2 style="margin:0">الزباين</h2>
    <div class="field" style="flex:2"><label class="label" for="custq">بحث بالاسم أو الرقم أو المنطقة</label><input id="custq" value="${h(S.custQ)}"></div></div>
    <p class="note">أي زبون تسجل رقمه بالطلب ينحفظ هنا تلقائياً، والمرة الجاية من يتصل تطلع معلوماته بمجرد ما تكتب رقمه.</p>
    ${list.length?`<div class="tbl-wrap"><table><thead><tr><th>الاسم</th><th>الرقم</th><th>المنطقة</th><th>العنوان</th><th>الطلبات</th><th>آخر طلب</th><th>ملاحظات</th></tr></thead><tbody>
    ${list.map(c=>`<tr><td>${h(c.name||"—")}</td><td class="num">${h(c.phone)}</td><td>${h(c.area||"")}</td><td>${h(c.address||"")}</td><td class="num">${c.count||0}</td><td class="num">${c.lastTs?dateStr(c.lastTs):""}</td>
      <td><input class="inp" id="cn-${h(c.id)}" data-cnote="${h(c.id)}" value="${h(c.notes||"")}" placeholder="مثلاً: يحب الحار" style="min-width:140px"></td></tr>`).join("")}</tbody></table></div>`:`<div class="empty">${S.customers.length?"ما كو نتيجة للبحث":"ما كو زباين بعد. ينضافون تلقائياً من الطلبات."}</div>`}</div>`;
}

/* ---------- kitchen screen ---------- */
function renderKDS(){
  const br=curBranch();const late=Number(S.settings.lateMins)||35;const tb=todayBr();
  const list=tb.filter(o=>o.status==="new"||o.status==="prep").sort((a,b)=>a.ts-b.ts);
  const ready=tb.filter(o=>o.status==="ready").sort((a,b)=>a.ts-b.ts);
  const recLine=i=>{const r=S.recipes[i.mid];const rl=recipeLines(i.mid);if(!rl.length)return "";const y=Number(r.yield)||1;
    return `<details class="krec"><summary>الوصفة</summary><ul>${rl.map(l=>`<li>${h(invName(l.itemId))}: ${qn((Number(l.qty)||0)*i.qty/y,invUnit(l.itemId))}</li>`).join("")}</ul>${r.notes?`<div>${h(r.notes)}</div>`:""}</details>`};
  return `<div class="row" style="align-items:center;margin-bottom:12px"><h2 style="margin:0">شاشة المطبخ${br?" · "+h(brName(br)):""}</h2><span class="note" style="flex:0;white-space:nowrap"><span class="num">${list.length}</span> طلب بالمطبخ</span></div>
  ${list.length?`<div class="kds">${list.map(o=>{const m=mins(o.ts);return `<div class="kcard st-${o.status} ${m>=late?"late":""}" data-order="${h(o.id)}">
    <div class="kh"><span class="num">#${h(o.no)}</span><span class="pill ${STATUS[o.status].c}">${STATUS[o.status].t}</span><span class="num" style="${m>=late?"color:var(--bad)":""}">${m} د</span></div>
    <div class="note">${h(o.channel||"")} · <span class="num">${timeStr(o.ts)}</span></div>
    ${(o.items||[]).map(i=>`<div><div class="kl"><span class="num">${i.qty}×</span><span>${h(i.name)}</span></div>${recLine(i)}</div>`).join("")}
    ${o.note?`<div class="knote">ملاحظة: ${h(o.note)}</div>`:""}
    ${o.status==="new"?`<button class="btn" data-kds="${h(o.id)}" data-to="prep" ${S.busy[o.id]?"disabled":""}>بدأ التحضير</button>`:`<button class="btn dark" data-kds="${h(o.id)}" data-to="ready" ${S.busy[o.id]?"disabled":""}>جاهز</button>`}
  </div>`}).join("")}</div>`:`<div class="panel empty">ما كو طلبات بالمطبخ هسه. الطلب الجديد يطلع هنا تلقائياً ويا صوت تنبيه.</div>`}
  ${ready.length?`<div class="panel" style="margin-top:18px"><h3>جاهزة بانتظار الاستلام · <span class="num">${ready.length}</span></h3><div class="cats">${ready.map(o=>`<span class="pill good num">#${h(o.no)}</span>`).join("")}</div></div>`:""}
  <p class="note">${S.settings.costMode==="recipe"?`وضع الوصفات شغال: لما تبدي بتحضير الطلب تنخصم مواده من ${h(locName("br:"+br))} تلقائياً.`:`الوصفات للمرجع بس. خصم المواد من المخزن يشتغل لما المالك يفعّل "حساب الكلفة من الوصفات".`}</p>`;
}

/* ---------- recipes ---------- */
function recSummary(m,r){
  const fc=recipeCost(m.id,r);const pk=Number(S.settings.packaging)||0;
  return `<div class="tot-line"><span>كلفة المواد للوجبة</span>${money(fc)}</div>
  <div class="tbl-wrap"><table><thead><tr><th>المصدر</th><th>سعر البيع</th><th>العمولة</th><th>نسبة الكلفة</th><th>الهامش بعد التغليف</th></tr></thead><tbody>
  ${(S.settings.channels||[]).map(ch=>{const p=priceFor(m,ch.name);const com=p*chanPct(ch.name)/100;const mg=p-com-pk-fc;const pct=p?fc/p*100:0;
    return `<tr><td>${h(ch.name)}</td><td>${money(p)}</td><td>${money(com)}</td><td><span class="pill ${pct>40?"bad":pct>30?"warn":"good"} num">${pct.toFixed(1)}%</span></td><td><span class="pill ${mg>0?"good":"bad"}">${money(mg)}</span></td></tr>`}).join("")}
  </tbody></table></div>`;
}
function renderRecipes(){
  const rows=[...S.menu].sort((a,b)=>(a.cat||"").localeCompare(b.cat||"","ar")||(a.sort-b.sort));
  const ro=!isMgr();const showCost=isMgr();const m=S.recSel&&S.menu.find(x=>x.id===S.recSel);
  if(m&&!ro&&(!S.recDraft||S.recDraft.mid!==m.id)){const r=S.recipes[m.id]||{};S.recDraft={mid:m.id,lines:(r.lines||[]).map(l=>({...l})),yield:r.yield||1,notes:r.notes||""};if(!S.recDraft.lines.length)S.recDraft.lines.push({itemId:"",qty:""})}
  let ed="";
  if(m){const r=ro?(S.recipes[m.id]||{lines:[],yield:1}):S.recDraft;
    ed=`<div class="panel" id="recEd"><div class="row" style="align-items:center"><h2 style="margin:0">${h(m.name)}</h2>${m.code?`<span class="pill num" style="flex:0">${h(m.code)}</span>`:""}</div>
    ${ro?`${recipeLines(m.id).length?`<div class="tbl-wrap" style="margin-top:10px"><table><thead><tr><th>المادة</th><th>الكمية</th></tr></thead><tbody>${recipeLines(m.id).map(l=>`<tr><td>${h(invName(l.itemId))}</td><td>${qn(l.qty,invUnit(l.itemId))}</td></tr>`).join("")}</tbody></table></div>
      ${r.yield>1?`<p class="note">الكميات تطلع <span class="num">${r.yield}</span> وجبة.</p>`:""}${r.notes?`<p style="white-space:pre-wrap">${h(r.notes)}</p>`:""}`:`<div class="empty">بعد ما انكتبت وصفة لهالوجبة</div>`}`
    :`<p class="note">حدد كمية كل مادة للوجبة الوحدة. الكلفة محسوبة من متوسط سعر الشراء بالمخزن.</p>
      ${!S.inv.length?`<div class="banner">أول شي أضف المواد من <a href="#items">المخزن ← المواد</a>.</div>`:""}
      <div id="recLines">${r.lines.map((l,i)=>`<div class="row lr"><div class="field" style="flex:3"><label class="label" for="rl-item-${i}">المادة</label><select id="rl-item-${i}" data-rl="${i}" data-rf="itemId">${invOpts(l.itemId)}</select></div>
        <div class="field"><label class="label" for="rl-qty-${i}">الكمية ${l.itemId?"("+h(invUnit(l.itemId))+")":""}</label><input id="rl-qty-${i}" data-rl="${i}" data-rf="qty" type="number" min="0" step="any" inputmode="decimal" value="${h(l.qty)}"></div>
        <button class="btn ghost sm x" data-rldel="${i}" aria-label="حذف السطر">حذف</button></div>`).join("")}</div>
      <button class="btn ghost sm" id="rlAdd">+ مادة</button>
      <div class="row" style="margin-top:12px"><div class="field"><label class="label" for="ryield">الكمية تطلع كم وجبة</label><input id="ryield" type="number" min="1" step="1" value="${h(r.yield||1)}"></div>
        <div class="field" style="flex:3"><label class="label" for="rnotes">طريقة التحضير / ملاحظات</label><input id="rnotes" value="${h(r.notes||"")}" placeholder="قلي 6 دقايق على 175 درجة"></div></div>`}
    <div id="recsum" style="margin-top:12px">${showCost?recSummary(m,r):""}</div>
    ${ro?`<div class="row" style="margin-top:12px"><button class="btn ghost" data-recsel="" style="flex:0">إغلاق</button></div>`:`<div class="row" style="margin-top:12px"><button class="btn" id="recSave">حفظ الوصفة</button><button class="btn ghost" data-recsel="" style="flex:0">إغلاق</button></div>`}</div>`}
  return `<div class="cols"><div class="panel"><h2>الوصفات</h2><p class="note">${ro?"اختار وجبة حتى تشوف مقاديرها.":"لكل وجبة وصفة بالمقادير. منها تنحسب كلفة الأكل الحقيقية، وتنخصم المواد من مخزن الفرع لما يتحضر الطلب (بوضع الوصفات)."}</p>
    ${rows.length?`<div class="tbl-wrap"><table><thead><tr><th>الكود</th><th>الوجبة</th><th>المواد</th>${showCost?"<th>الكلفة</th><th>نسبة الكلفة</th>":""}</tr></thead><tbody>
    ${rows.map(x=>{const n=recipeLines(x.id).length;const fc=recipeCost(x.id);const p=Number(x.price)||0;return `<tr class="${x.id===S.recSel?"sel":""}"><td class="num">${h(x.code||"—")}</td><td><button class="linkbtn" data-recsel="${h(x.id)}">${h(x.name)}</button></td>
      <td>${n?`<span class="num">${n}</span> مادة`:`<span class="pill warn">بدون وصفة</span>`}</td>${showCost?`<td>${n?money(fc):"—"}</td><td>${n&&p?`<span class="num">${(fc/p*100).toFixed(1)}%</span>`:"—"}</td>`:""}</tr>`}).join("")}</tbody></table></div>`:`<div class="empty">ما كو وجبات بالمنيو بعد</div>`}</div>
    <div>${ed||`<div class="panel empty">اختار وجبة من القائمة</div>`}</div></div>`;
}
