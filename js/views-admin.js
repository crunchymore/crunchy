/* ---------- dashboard ---------- */
function monthPicker(){return `<div class="mpick"><label class="label" for="month">الشهر</label><input id="month" type="month" value="${S.month}" max="${curYM()}"><span class="note">${h(monthName(S.month))}</span></div>`}
function renderDash(){
  const ab=activeBranches();if(S.dashBr!=="*"&&!allBranches().some(b=>b.id===S.dashBr))S.dashBr="*";
  const fb=l=>S.dashBr==="*"?l:l.filter(o=>obr(o)===S.dashBr);const ORD=fb(S.orders),TOD=fb(S.today);
  const [,b]=range(S.month);const isCur=S.month===curYM();const A=isOwner();
  const t=agg(TOD);const m=agg(ORD);
  const exp=S.expenses.reduce((x,e)=>x+(Number(e.amount)||0),0);
  const paid=S.payments.reduce((x,p)=>x+(Number(p.amount)||0),0);
  const days=new Date(b-1).getDate();const perDay=Array.from({length:days},()=>0);
  live(ORD).forEach(o=>perDay[new Date(o.ts).getDate()-1]+=A?orderProfit(o):(o.revenue||0));const maxD=Math.max(1,...perDay);
  const items={};live(ORD).forEach(o=>(o.items||[]).forEach(i=>{items[i.name]=(items[i.name]||0)+i.qty}));
  const top=Object.entries(items).sort((x,y)=>y[1]-x[1]).slice(0,6);const topMax=top.length?top[0][1]:1;
  const chans={};live(ORD).forEach(o=>{chans[o.channel]=chans[o.channel]||{n:0,s:0,p:0};chans[o.channel].n++;chans[o.channel].s+=o.revenue||0;chans[o.channel].p+=orderProfit(o)});
  const brs={};live(S.orders).forEach(o=>{const k=obr(o);brs[k]=brs[k]||{n:0,s:0,p:0};brs[k].n++;brs[k].s+=o.revenue||0;brs[k].p+=orderProfit(o)});
  const activeNow=TOD.filter(o=>ACTIVE.includes(o.status)).length;
  const lateN=TOD.filter(o=>ACTIVE.includes(o.status)&&mins(o.ts)>=(Number(S.settings.lateMins)||35)).length;
  const recent=[...ORD].sort((x,y)=>y.ts-x.ts).slice(0,20);
  const low=lowList("*");const sv=stockValue("*");
  const owed=S.suppliers.map(s=>({s,...supBal(s.id)})).filter(x=>x.bal>0).sort((a,c)=>c.bal-a.bal);const owedT=owed.reduce((a,x)=>a+x.bal,0);
  const foodPct=m.sales?(m.friend+m.food)/m.sales*100:0;
  const [ma,mb]=range(S.month);const buys=S.purchases.filter(p=>(p.ts||0)>=ma&&(p.ts||0)<mb).reduce((a,p)=>a+(Number(p.total)||0),0);
  return `<div class="row" style="align-items:center">${monthPicker()}${ab.length>1?`<div class="cats" style="flex:2;margin-bottom:14px"><button class="chip" data-dbr="*" aria-pressed="${S.dashBr==="*"}">كل الفروع</button>${ab.map(x=>`<button class="chip" data-dbr="${h(x.id)}" aria-pressed="${S.dashBr===x.id}">${h(x.name)}</button>`).join("")}</div>`:""}</div>
  <div class="kpis">
    ${A?`<div class="kpi"><div class="label">ربح اليوم</div><div class="v">${money(t.profit)}</div><div class="s"><span class="num">${t.count}</span> طلب · ${activeNow?`<span class="num">${activeNow}</span> شغالة الحين${lateN?` · <b style="color:var(--bad)"><span class="num">${lateN}</span> متأخر</b>`:""}`:"ما كو طلبات معلقة"}</div></div>`
      :`<div class="kpi"><div class="label">مبيعات اليوم</div><div class="v">${money(t.sales)}</div><div class="s"><span class="num">${t.count}</span> طلب · <span class="num">${activeNow}</span> شغالة${lateN?` · <b style="color:var(--bad)"><span class="num">${lateN}</span> متأخر</b>`:""}</div></div>`}
    <div class="kpi"><div class="label">مبيعات ${isCur?"الشهر":h(monthName(S.month))}</div><div class="v">${money(m.sales)}</div><div class="s"><span class="num">${m.count}</span> طلب · بدون أجور التوصيل</div></div>
    ${A?`<div class="kpi"><div class="label">بذمتك لصديقك</div><div class="v">${money(m.friend-paid)}</div><div class="s">بعد اللي دفعته</div></div>
    <div class="kpi hl"><div class="label">صافي الربح</div><div class="v">${money(m.profit-exp)}</div><div class="s">بعد العمولات والتغليف والمصاريف</div></div>`
    :`<div class="kpi"><div class="label">متوسط الطلب</div><div class="v">${money(m.count?m.sales/m.count:0)}</div><div class="s">هذا الشهر</div></div>
    <div class="kpi hl"><div class="label">مشتريات الشهر</div><div class="v">${money(buys)}</div><div class="s">فواتير الموردين</div></div>`}
  </div>
  <div class="kpis">
    <div class="kpi"><div class="label">قيمة المخزون</div><div class="v">${money(sv)}</div><div class="s">كل المواقع بمتوسط الكلفة</div></div>
    <div class="kpi"><div class="label">مواد ناقصة</div><div class="v num" style="${low.length?"color:var(--bad)":""}">${low.length}</div><div class="s">تحت الحد الأدنى</div></div>
    ${A?`<div class="kpi"><div class="label">نسبة كلفة الأكل</div><div class="v num">${foodPct.toFixed(1)}%</div><div class="s">${S.settings.costMode==="recipe"?"الوضع الحالي: من الوصفات":"الوضع الحالي: سعر صديقك"}</div></div>`
    :`<div class="kpi"><div class="label">أجور التوصيل</div><div class="v">${money(m.delivery)}</div><div class="s">للسايق، خارج المبيعات</div></div>`}
    <div class="kpi"><div class="label">مستحق للموردين</div><div class="v">${money(owedT)}</div><div class="s"><span class="num">${owed.length}</span> مورد</div></div>
  </div>
  <div class="cols"><div>
    <div class="panel"><h3>${A?"ربحك اليومي":"مبيعاتك اليومية"}</h3><div class="bars">${perDay.map((v,i)=>`<div class="b ${v<=0?"z":""}" style="height:${Math.max(1,Math.max(0,v)/maxD*100)}%" data-t="${i+1}: ${fmt(v)} د.ع"></div>`).join("")}</div>
      <div class="axis"><span class="num">1</span><span class="num">${Math.ceil(days/2)}</span><span class="num">${days}</span></div></div>
    ${allBranches().length>1?`<div class="panel"><h3>مبيعات الفروع · ${h(monthName(S.month))}</h3><div class="tbl-wrap"><table><thead><tr><th>الفرع</th><th>طلبات</th><th>مبيعات</th>${A?"<th>ربح قبل المصاريف</th>":""}</tr></thead><tbody>
      ${allBranches().map(x=>{const v=brs[x.id]||{n:0,s:0,p:0};return `<tr><td>${h(x.name)}</td><td class="num">${v.n}</td><td>${money(v.s)}</td>${A?`<td>${money(v.p)}</td>`:""}</tr>`}).join("")}</tbody></table></div></div>`:""}
    <div class="panel"><h3>آخر الطلبات</h3>${recent.length?`<div class="tbl-wrap"><table><thead><tr><th>الوقت</th><th>المصدر</th><th>الأصناف</th><th>المبلغ</th>${A?"<th>ربحك</th>":""}<th>الحالة</th></tr></thead><tbody>
      ${recent.map(o=>`<tr class="${o.status==="cancelled"?"cx":""}"><td class="num">${dateStr(o.ts)} ${timeStr(o.ts)}</td><td>${h(o.channel)}</td><td>${itemsTxt(o)}</td><td>${money(o.revenue)}</td>${A?`<td>${money(orderProfit(o))}</td>`:""}<td><span class="pill ${(STATUS[o.status]||STATUS.new).c}">${(STATUS[o.status]||STATUS.new).t}</span></td></tr>`).join("")}
      </tbody></table></div>`:`<div class="empty">ما كو طلبات بهالشهر بعد</div>`}</div>
  </div><div>
    <div class="panel"><h3>مواد ناقصة</h3>${low.length?`<div class="tbl-wrap"><table><thead><tr><th>المادة</th><th>الرصيد</th><th>الحد</th></tr></thead><tbody>${low.slice(0,12).map(i=>`<tr class="low"><td>${h(i.name)}</td><td>${qn(qtyAt(i.id,"*"),i.unit)}</td><td>${qn(i.minQty,i.unit)}</td></tr>`).join("")}</tbody></table></div><a href="#receive" class="note">سجل فاتورة شراء ←</a>`:`<div class="empty">${S.inv.length?"كل المواد فوق الحد الأدنى":"أضف المواد من قسم المخزن"}</div>`}</div>
    ${owed.length?`<div class="panel"><h3>ديون الموردين</h3><table><tbody>${owed.slice(0,8).map(x=>`<tr><td>${h(x.s.name)}</td><td>${money(x.bal)}</td></tr>`).join("")}</tbody></table></div>`:""}
    <div class="panel"><h3>الأكثر مبيعاً</h3>${top.length?`<div class="rank">${top.map(([n,qy])=>`<div class="r"><span>${h(n)}</span><span class="num">${qy}</span><div class="bar"><i style="width:${qy/topMax*100}%"></i></div></div>`).join("")}</div>`:`<div class="empty">تظهر بعد أول طلبات</div>`}</div>
    <div class="panel"><h3>حسب المصدر</h3>${Object.keys(chans).length?`<div class="tbl-wrap"><table><thead><tr><th>المصدر</th><th>طلبات</th><th>مبيعات</th>${A?"<th>ربحك</th>":""}</tr></thead><tbody>${Object.entries(chans).map(([n,v])=>`<tr><td>${h(n)}</td><td class="num">${v.n}</td><td>${money(v.s)}</td>${A?`<td>${money(v.p)}</td>`:""}</tr>`).join("")}</tbody></table></div>`:`<div class="empty">ما كو بيانات بعد</div>`}</div>
  </div></div>`;
}

/* ---------- owner: settlement ---------- */
function renderSettle(){
  const m=agg(S.orders);const paid=S.payments.reduce((x,p)=>x+(Number(p.amount)||0),0);const exp=S.expenses.reduce((x,e)=>x+(Number(e.amount)||0),0);
  const list=(arr,kind)=>arr.length?`<div class="tbl-wrap"><table><tbody>${[...arr].sort((a,b)=>b.ts-a.ts).map(e=>`<tr><td class="num">${dateStr(e.ts)}</td><td>${h(e.note||"—")}</td><td>${money(e.amount)}</td><td>${S.confirmDel===kind+e.id?`<button class="btn danger sm" data-del="${kind}" data-id="${h(e.id)}">تأكيد الحذف</button>`:`<button class="btn ghost sm" data-askdel="${kind}${h(e.id)}">حذف</button>`}</td></tr>`).join("")}</tbody></table></div>`:`<div class="empty">ما كو شي مسجل</div>`;
  return `${monthPicker()}<div class="cols">
    <div class="panel"><h2>موازنة ${h(monthName(S.month))}</h2><div class="ledger">
      <div><span>المبيعات بعد الخصومات · <span class="num">${m.count}</span> طلب</span>${money(m.sales)}</div>
      <div class="minus"><span>عمولات التطبيقات</span>${money(m.commission)}</div>
      <div class="minus"><span>حق صديقك</span>${money(m.friend)}</div>
      ${m.food?`<div class="minus"><span>كلفة المواد (من الوصفات)</span>${money(m.food)}</div>`:""}
      <div class="minus"><span>التغليف</span>${money(m.packaging)}</div>
      <div class="minus"><span>مصاريف أخرى</span>${money(exp)}</div>
      <div class="tot"><span>صافي ربحك</span><span style="color:var(--good)">${money(m.profit-exp)}</span></div></div>
      <p class="note">أجور التوصيل المستلمة من الزبائن (للسايق، خارج الأرباح): ${money(m.delivery)}</p>
      <h3 style="margin-top:22px">الحساب ويا صديقك</h3><div class="ledger">
      <div><span>المستحق له</span>${money(m.friend)}</div><div class="minus"><span>اللي دفعته</span>${money(paid)}</div>
      <div class="tot"><span>الباقي بذمتك</span>${m.friend-paid>0?`<span class="pill bad">${money(m.friend-paid)}</span>`:`<span class="pill good">مسدد</span>`}</div></div>
      <p class="note">حق صديقك محسوب بسعره اللي كان مسجل وقت كل طلب، فتغيير الأسعار ما يأثر على الحسابات القديمة.${m.food?" الطلبات بوضع الوصفات تنحسب كلفتها من المواد مو من سعر صديقك.":""}</p></div>
    <div><div class="panel"><h3>دفعة لصديقك</h3><form id="payF" class="row"><div class="field"><label class="label" for="payA">المبلغ</label><input id="payA" type="number" min="1" required inputmode="numeric"></div><div class="field" style="flex:2"><label class="label" for="payN">ملاحظة</label><input id="payN" placeholder="دفعة نص الشهر" maxlength="120"></div><button class="btn sm" style="flex:0">سجل</button></form><div style="margin-top:10px">${list(S.payments,"friend_payments")}</div></div>
    <div class="panel"><h3>مصاريف أخرى</h3><form id="expF" class="row"><div class="field"><label class="label" for="expA">المبلغ</label><input id="expA" type="number" min="1" required inputmode="numeric"></div><div class="field" style="flex:2"><label class="label" for="expN">البند</label><input id="expN" placeholder="إعلان ممول إنستغرام" maxlength="120"></div><button class="btn sm" style="flex:0">سجل</button></form><div style="margin-top:10px">${list(S.expenses,"expenses")}</div></div></div></div>`;
}

/* ---------- owner: menu ---------- */
function renderMenu(){
  const ch0=((S.settings.channels||[]).find(c=>!isOwn(c.name))||{}).name||"";
  const rows=[...S.menu].sort((a,b)=>(a.cat||"").localeCompare(b.cat||"","ar")||(a.sort-b.sort));
  const dp=S.settings.directPct??20,ap=S.settings.appPct??40;
  return `<div class="panel"><h2>المنيو والأسعار</h2>
    <p class="note">سعر صديقك ما يشوفه الموظف أبداً. <b>السعر المباشر</b> للواتساب والاتصال (${dp}% فوق سعر صديقك)، و<b>سعر التطبيقات</b> لتوترز وطلباتي (${ap}%). الكاشير يختار السعر حسب مصدر الطلب تلقائياً، والسيرفر يعيد حساب السعر من هنا فما ينكدر يتلاعب بيه. "الربح" محسوب لطلب بصنف واحد بعد التغليف، وللتطبيق بعد العمولة.</p>
    <form id="addF" class="row" style="margin:12px 0 16px">
      <div class="field" style="flex:2"><label class="label" for="nName">اسم الوجبة</label><input id="nName" required placeholder="بوكس كنتاكي 4 قطع" maxlength="80"></div>
      <div class="field"><label class="label" for="nCode">الكود</label><input id="nCode" class="num" placeholder="KN-20" maxlength="30"></div>
      <div class="field"><label class="label" for="nCat">القسم</label><input id="nCat" list="catlist" placeholder="كنتاكي"></div>
      <div class="field"><label class="label" for="nCost">سعر صديقك</label><input id="nCost" type="number" min="0" step="250" required inputmode="numeric"></div>
      <div class="field"><label class="label" for="nPrice">سعر مباشر</label><input id="nPrice" type="number" min="0" step="250" inputmode="numeric" placeholder="تلقائي +${dp}%"></div>
      <div class="field"><label class="label" for="nApp">سعر التطبيقات</label><input id="nApp" type="number" min="0" step="250" inputmode="numeric" placeholder="تلقائي +${ap}%"></div>
      <button class="btn sm" style="flex:0">إضافة</button></form>
    <datalist id="catlist">${[...new Set(S.menu.map(m=>m.cat).filter(Boolean))].map(c=>`<option value="${h(c)}">`).join("")}</datalist>
    ${rows.length?`<div class="tbl-wrap"><table class="menu-tbl"><thead><tr><th>الكود</th><th>الوجبة</th><th>القسم</th><th>سعر صديقك</th><th>سعر مباشر</th><th>سعر التطبيقات</th><th>ربح مباشر</th><th>ربح تطبيق</th><th>كلفة الوصفة</th><th>ظاهرة</th><th></th></tr></thead><tbody>
    ${rows.map(m=>{const cost=curCost(m.id);const pk=Number(S.settings.packaging)||0;const net=(Number(m.appPrice)||Number(m.price)||0)*(1-chanPct(ch0)/100)-cost-pk;const netD=(Number(m.price)||0)-cost-pk;const rc=recipeLines(m.id).length?recipeCost(m.id):null;return `<tr>
      <td><input id="md-${h(m.id)}" data-f="code" data-id="${h(m.id)}" value="${h(m.code||"")}" class="num" style="min-width:76px"></td>
      <td><input id="mn-${h(m.id)}" data-f="name" data-id="${h(m.id)}" value="${h(m.name)}" style="min-width:130px"></td>
      <td><input id="mc-${h(m.id)}" data-f="cat" data-id="${h(m.id)}" value="${h(m.cat||"")}" list="catlist"></td>
      <td><input id="mk-${h(m.id)}" data-cost="${h(m.id)}" type="number" step="250" min="0" value="${cost}"></td>
      <td><input id="mp-${h(m.id)}" data-f="price" data-id="${h(m.id)}" type="number" step="250" min="0" value="${m.price||0}"></td>
      <td><input id="mq-${h(m.id)}" data-f="appPrice" data-id="${h(m.id)}" type="number" step="250" min="0" value="${m.appPrice||m.price||0}"></td>
      <td class="m"><span class="pill ${netD>0?"good":"bad"}">${money(netD)}</span></td>
      <td class="m"><span class="pill ${net>0?"good":"bad"}">${money(net)}</span></td>
      <td class="m">${rc==null?`<a href="#recipes" data-recgo="${h(m.id)}" class="note">أضف وصفة</a>`:money(rc)}</td>
      <td><input id="ma-${h(m.id)}" data-f="active" data-id="${h(m.id)}" type="checkbox" ${m.active!==false?"checked":""} aria-label="ظاهرة للموظف"></td>
      <td>${S.confirmDel==="menu"+m.id?`<button class="btn danger sm" data-del="menu_items" data-id="${h(m.id)}">تأكيد</button>`:`<button class="btn ghost sm" data-askdel="menu${h(m.id)}">حذف</button>`}</td></tr>`}).join("")}
    </tbody></table></div>`:`<div class="empty">ما كو وجبات بعد</div>`}</div>`;
}

/* ---------- permissions ---------- */
const PERMS=[
  ["sale","البيع",[["pos","طلب جديد (يسجل طلبات)"],["board","متابعة الطلبات وتسليمها"],["customers","الزباين"],["cancel","إلغاء الطلبات"]]],
  ["kitchen","المطبخ",[["kds","شاشة المطبخ"],["recipes","الوصفات"]]],
  ["store","المخزن",[["stock","الأرصدة"],["receive","استلام فواتير الموردين"],["transfer","ترحيل للفرع"],["waste","تلف وجرد"],["items","المواد"],["suppliers","الموردين"]]],
  ["admin","الإدارة",[["dash","لوحة التحكم (المبيعات والأرباح)"]]]];
const ROLE_PERMS={cashier:["pos","board","customers","cancel"],kitchen:["kds","recipes"],store:["stock","receive","transfer","waste","items","suppliers"],
  manager:["pos","board","customers","cancel","kds","recipes","stock","receive","transfer","waste","items","suppliers","dash"]};
function permBox(pre,role,perms){const ok=ROLE_PERMS[role]||[];const on=k=>!Array.isArray(perms)||perms.includes(k);
  return `<fieldset class="perms" style="border:1px solid var(--line,#ddd);border-radius:12px;padding:10px 12px;margin:6px 0"><legend class="label" style="padding:0 6px">الصلاحيات</legend>
    ${PERMS.map(([g,t,list])=>{const l=list.filter(([k])=>ok.includes(k));return l.length?`<div style="margin:4px 0"><b class="note">${t}</b><div class="row" style="flex-wrap:wrap;gap:4px 14px">${l.map(([k,lb])=>`<label class="chk"><input type="checkbox" data-perm="${k}" data-pre="${h(pre)}" ${on(k)?"checked":""}> ${lb}</label>`).join("")}</div></div>`:""}).join("")}
    <p class="note" style="margin:6px 0 0">شيل العلامة عن أي شي ما تريده يشوفه أو يسويه. النظام يمنعه حتى لو حاول من جهاز ثاني.</p></fieldset>`}
/* ---------- owner: staff ---------- */
function waMessage(x){
  return `هلا ${x.name}،
انضفت لنظام كرانشي ومور (${ROLE_T[x.role]||"موظف"}).

رابط التطبيق:
${appLink()}

رقم الدخول: ${x.phone}
كلمة السر المؤقتة: ${x.pw}

تثبيت التطبيق على جهازك:
${INSTALL_STEPS.map(([k,v])=>`- ${k}: ${v}`).join("\n")}

مهم: غيّر كلمة السر بأول دخول (النظام راح يطلبها منك)، ولا تشاركها ويا أحد.`;
}
function staffMsgBox(){const x=S.staffMsg;if(!x)return "";const txt=waMessage(x);
  return `<div class="wa-box" id="waBox"><h3 style="margin:0">${x.reset?"كلمة سر مؤقتة جديدة لـ ":"انضاف "}${h(x.name)} ✓</h3>
    <p class="note" style="margin:0">ارسل هالرسالة للموظف على الواتساب. كلمة السر المؤقتة ما تنحفظ بأي مكان، فانسخها هسه.</p>
    <textarea class="wa" id="waText" readonly>${h(txt)}</textarea>
    <div class="row"><button class="btn" data-copy="waText">نسخ الرسالة</button>
      <a class="btn wa-btn" target="_blank" rel="noopener" href="https://wa.me/${h(waNumber(x.phone))}?text=${encodeURIComponent(txt)}">إرسال بالواتساب</a>
      <button class="btn ghost" id="waDone" style="flex:0">تم</button></div></div>`}
function renderStaff(){
  const brO=[["","كل الفروع"],...activeBranches().map(b=>[b.id,b.name||"فرع"])];
  const rows=S.staff.filter(s=>s.id!==S.uid&&s.role);const unknown=S.staff.filter(s=>!s.role);
  const ns=S.newStaff||(S.newStaff={name:"",phone:"",pw:genPassword(),role:"cashier",branch:activeBranches().length===1?activeBranches()[0].id:""});
  return `${staffMsgBox()}<div class="cols"><div class="panel"><h2>الموظفين</h2>
    <p class="note">كل موظف يشوف بس الأقسام اللي تخص شغله: <b>الكاشير</b> البيع والطلبات والزباين، <b>المطبخ</b> شاشة المطبخ والوصفات، <b>المخزن</b> الأرصدة والفواتير والترحيل، و<b>المدير</b> كلشي عدا الإعدادات والتكاليف الخاصة. الموظف المربوط بفرع يشوف بس طلبات فرعه.</p>
    ${rows.length?`<div class="cards">${rows.map(s=>`<div class="scard ${s.active?"":"off"}" data-staff="${h(s.id)}"><div class="hd"><b>${h(s.full_name||"موظف")}</b><span class="num note">${h(s.phone||"")}</span>${s.active?(s.must_change_password?`<span class="pill warn">ما غيّر كلمة السر بعد</span>`:`<span class="pill good">فعال</span>`):`<span class="pill bad">موقوف</span>`}</div>
      <div class="row"><div class="field"><label class="label" for="sf-name-${h(s.id)}">الاسم</label><input id="sf-name-${h(s.id)}" data-stf="${h(s.id)}" data-sf="full_name" value="${h(s.full_name||"")}" maxlength="80"></div>
        <div class="field"><label class="label" for="sf-role-${h(s.id)}">الدور</label><select id="sf-role-${h(s.id)}" data-stf="${h(s.id)}" data-sf="role">${opts(ROLE_OPTS,s.role)}</select></div>
        <div class="field"><label class="label" for="sf-br-${h(s.id)}">الفرع</label><select id="sf-br-${h(s.id)}" data-stf="${h(s.id)}" data-sf="branch_id">${opts(brO,s.branch_id||"")}</select></div></div>
      ${permBox(s.id,s.role,s.perms)}
      <div class="stf-actions"><label class="chk"><input type="checkbox" id="sf-act-${h(s.id)}" data-stf="${h(s.id)}" data-sf="active" ${s.active?"checked":""}> فعال</label>
        <span style="flex:1"></span>
        ${S.confirmDel==="rst"+s.id?`<button class="btn dark sm" data-rstok="${h(s.id)}">تأكيد كلمة سر جديدة</button>`:`<button class="btn ghost sm" data-askdel="rst${h(s.id)}">كلمة سر مؤقتة جديدة</button>`}
        ${S.confirmDel==="usr"+s.id?`<button class="btn danger sm" data-usrdel="${h(s.id)}">تأكيد حذف الحساب</button>`:`<button class="btn ghost sm" data-askdel="usr${h(s.id)}">حذف الحساب</button>`}</div></div>`).join("")}</div>`
      :`<div class="empty">ما كو موظفين بعد. أضف أول موظف من الفورم.</div>`}
    <p class="note" style="margin-top:12px">نسى الموظف كلمة السر؟ اضغط «كلمة سر مؤقتة جديدة» وارسله الرسالة. إذا ما اشتغلت، أوقف الحساب أو احذفه وأضفه من جديد بنفس الرقم. الموظف الموقوف يطلع من كل الأقسام فوراً.</p>
    ${unknown.length?`<h3 style="margin-top:18px">حسابات مو معروفة · <span class="num">${unknown.length}</span></h3>
      <p class="note">حسابات انعملت من برة النظام (أي واحد يكدر يسجل، بس ما يشوف شي بدون دور). احذفها إذا ما تعرفها.</p>
      <div class="cards">${unknown.map(s=>`<div class="scard"><div class="hd"><span class="num">${h(s.phone||"بدون رقم")}</span><span class="note">${h(s.full_name||"")}</span><span class="note num">${dateStr(tsOf(s.created_at))}</span>
        ${S.confirmDel==="usr"+s.id?`<button class="btn danger sm" data-usrdel="${h(s.id)}">تأكيد الحذف</button>`:`<button class="btn ghost sm" data-askdel="usr${h(s.id)}">حذف</button>`}</div></div>`).join("")}</div>`:""}
  </div>
  <div class="panel"><h3>إضافة موظف</h3>
    <p class="note">يدخل الموظف برقم موبايله وكلمة سر مؤقتة تحددها انت، وبأول دخول النظام يجبره يغيّرها.</p>
    <form id="staffF" class="cards" novalidate>
      <div class="field"><label class="label" for="stName">الاسم الكامل</label><input id="stName" required maxlength="80" value="${h(ns.name)}" placeholder="علي حسين"></div>
      <div class="field"><label class="label" for="stPhone">رقم الموبايل</label><input id="stPhone" type="tel" inputmode="tel" dir="ltr" class="num" required placeholder="07XXXXXXXXX" value="${h(ns.phone)}"></div>
      <div class="field"><label class="label" for="stPw">كلمة السر المؤقتة</label><div class="pwgen"><input id="stPw" dir="ltr" class="num" required minlength="8" value="${h(ns.pw)}" autocomplete="off"><button type="button" class="btn ghost sm" id="stGen">توليد</button></div></div>
      <div class="row"><div class="field"><label class="label" for="stRole">الدور</label><select id="stRole">${opts(ROLE_OPTS,ns.role)}</select></div>
        <div class="field"><label class="label" for="stBr">الفرع</label><select id="stBr">${opts(brO,ns.branch)}</select></div></div>
      ${permBox("new",ns.role,ns.perms)}
      <button class="btn wide" ${S.saving?"disabled":""}>${S.saving?"جاري الإضافة…":"إضافة الموظف"}</button></form></div></div>`;
}

/* ---------- owner: branches ---------- */
function renderBranches(){
  return `<div class="panel"><h2>الفروع</h2><p class="note">كل فرع إله طلباته ومطبخه ومخزون مطبخه. الموظف المربوط بفرع يشوف بس طلبات فرعه.</p>
    <form id="brF" class="row" style="margin:12px 0 16px"><div class="field" style="flex:2"><label class="label" for="bName">اسم الفرع</label><input id="bName" required placeholder="فرع المنصور" maxlength="60"></div>
      <div class="field"><label class="label" for="bPhone">الهاتف</label><input id="bPhone" type="tel" inputmode="tel" class="num" dir="ltr" maxlength="20"></div>
      <div class="field" style="flex:2"><label class="label" for="bAddr">العنوان</label><input id="bAddr" maxlength="200"></div><button class="btn sm" style="flex:0">إضافة فرع</button></form>
    ${S.branches.length?`<div class="tbl-wrap"><table><thead><tr><th>الفرع</th><th>الهاتف</th><th>العنوان</th><th>فعال</th><th>مخزون المطبخ</th></tr></thead><tbody>
    ${S.branches.map(b=>`<tr><td><input class="inp" id="bf-name-${h(b.id)}" data-brf="${h(b.id)}" data-bf="name" value="${h(b.name||"")}" style="min-width:120px"></td>
      <td><input class="inp num" id="bf-phone-${h(b.id)}" data-brf="${h(b.id)}" data-bf="phone" value="${h(b.phone||"")}"></td>
      <td><input class="inp" id="bf-addr-${h(b.id)}" data-brf="${h(b.id)}" data-bf="address" value="${h(b.address||"")}"></td>
      <td><input type="checkbox" id="bf-act-${h(b.id)}" data-brf="${h(b.id)}" data-bf="active" ${b.active!==false?"checked":""} aria-label="فعال"></td>
      <td>${money(stockValue("br:"+b.id))}</td></tr>`).join("")}</tbody></table></div>`:`<div class="empty">ما كو فروع. أضف الفرع الرئيسي.</div>`}</div>`;
}

/* ---------- owner: settings ---------- */
function renderSetup(){
  const cm=S.settings.costMode;const log=(S.settings.costModeLog||[]).filter(e=>e.ts>0).slice(-3).reverse();
  return `<div class="panel" style="max-width:720px"><h2>الإعدادات</h2>
    <h3>طريقة حساب الكلفة</h3>
    <div class="modebox"><p style="margin:0 0 8px">الوضع الحالي: <b>${cm==="recipe"?"من الوصفات (مطبخ خاص)":"سعر صديقك (شراء جاهز)"}</b></p>
    <div class="seg"><button data-costmode="supplier" aria-pressed="${cm==="supplier"}" ${cm==="supplier"?"disabled":""}>سعر صديقك (شراء جاهز)</button><button data-costmode="recipe" aria-pressed="${cm==="recipe"}" ${cm==="recipe"?"disabled":""}>من الوصفات (مطبخ خاص)</button></div>
    <p class="note">${cm==="supplier"?"هسه كلفة كل طلب = سعر صديقك للوجبة. الوصفات والمخزن يشتغلون للمتابعة بس.":"هسه كلفة كل طلب = مواد الوصفة بمتوسط سعر الشراء، وتنخصم المواد من مخزن مطبخ الفرع لما يتحضر الطلب."} التغيير يحتاج تأكيد، ويأثر على الطلبات الجديدة بس.</p>
    ${log.length?`<p class="note">آخر تغيير: ${log.map(e=>`${e.mode==="recipe"?"الوصفات":"سعر صديقك"} <span class="num">${dateStr(e.ts)} ${timeStr(e.ts)}</span>`).join(" ← ")}</p>`:""}</div>
    <h3 style="margin-top:22px">مصادر الطلبات والعمولة</h3><p class="note">نسبة العمولة من سعر البيع لكل مصدر. صححها حسب عقدك ويا التطبيقات. "توصيل خاص بينا" يعني السعر المباشر وأجرة منطقة.</p>
    <div class="tbl-wrap"><table><thead><tr><th>المصدر</th><th>العمولة %</th><th>توصيل خاص بينا</th><th></th></tr></thead><tbody>
      ${(S.settings.channels||[]).map((c,i)=>`<tr><td><input class="inp" id="chn-${i}" data-ch-i="${i}" data-cf="name" value="${h(c.name)}"></td><td><input class="inp" id="chp-${i}" data-ch-i="${i}" data-cf="pct" type="number" min="0" max="100" step="0.5" value="${c.pct}" style="width:90px"></td><td><input type="checkbox" id="cho-${i}" data-ch-own="${i}" ${isOwn(c.name)?"checked":""} aria-label="توصيل خاص بينا"></td>
      <td>${S.settings.channels.length>1?`<button class="btn ghost sm" data-chdel="${i}">حذف</button>`:""}</td></tr>`).join("")}</tbody></table></div>
    <button class="btn ghost sm" id="chAdd" style="margin-top:8px">+ إضافة مصدر</button>
    <h3 style="margin-top:22px">مناطق التوصيل · <span class="num">${(S.settings.areas||[]).length}</span></h3><p class="note">للطلبات اللي نوصلها إحنا (اتصال وواتساب). أجرة التوصيل يدفعها الزبون فوق سعر الأكل وتروح للسايق، فما تنحسب بالمبيعات ولا بالأرباح.</p>
    <div class="tbl-wrap"><table><thead><tr><th>المنطقة</th><th>الأجرة (د.ع)</th><th></th></tr></thead><tbody>
      ${(S.settings.areas||[]).map((a,i)=>`<tr><td><input class="inp" id="arn-${i}" data-ar-i="${i}" data-af="name" value="${h(a.name)}"></td><td><input class="inp" id="arf-${i}" data-ar-i="${i}" data-af="fee" type="number" min="0" step="250" value="${a.fee}" style="width:110px"></td><td><button class="btn ghost sm" data-ardel="${i}">حذف</button></td></tr>`).join("")}</tbody></table></div>
    <button class="btn ghost sm" id="arAdd" style="margin-top:8px">+ إضافة منطقة</button>
    <div class="row" style="margin-top:22px"><div class="field"><label class="label" for="pack">تغليف لكل طلب (د.ع)</label><input id="pack" type="number" min="0" step="50" value="${S.settings.packaging||0}"></div>
      <div class="field"><label class="label" for="late">الطلب يعتبر متأخر بعد (دقيقة)</label><input id="late" type="number" min="5" step="5" value="${S.settings.lateMins||35}"></div></div>
    <div class="row" style="margin-top:12px"><div class="field"><label class="label" for="dpct">زيادة السعر المباشر فوق سعر صديقك %</label><input id="dpct" type="number" min="0" step="1" value="${S.settings.directPct??20}"></div>
      <div class="field"><label class="label" for="apct">زيادة سعر التطبيقات %</label><input id="apct" type="number" min="0" step="1" value="${S.settings.appPct??40}"></div></div></div>
  ${menuPanel()}
  ${backupPanel()}`;
}
function menuLink(){return new URL("menu/",location.href.split("#")[0]).href}
function menuPanel(){const u=menuLink();
  return `<div class="panel" style="max-width:720px"><h2>المنيو الإلكتروني للزبائن</h2>
    <p class="note">الأصناف والأسعار ومناطق التوصيل تنقرا من هذا النظام مباشرة: أي سعر تغيّره، أو صنف توقفه، أو منطقة تضيفها، يطلع للزبون فوراً. الزبون يرسل طلبه على واتساب كرانشي.</p>
    <p class="num" style="overflow-wrap:anywhere;font-weight:600">${h(u)}</p>
    <div class="row"><a class="btn" href="${h(u)}" target="_blank" rel="noopener" style="flex:0 0 auto">افتح المنيو</a><button class="btn ghost" data-copy-menu style="flex:0 0 auto">نسخ الرابط</button></div></div>`}
function backupPanel(){const last=+LS.get("crunchy.lastBackup")||0;const days=last?Math.floor((Date.now()-last)/864e5):null;
  return `<div class="panel" style="max-width:720px"><h2>النسخة الاحتياطية</h2>
    <p class="note">ينزل ملف واحد بيه كل بيانات المطعم: الطلبات والزباين والمنيو والوصفات والمخزن والموردين والمصاريف والموظفين. احفظه بمكان أمين (فلاشة، Google Drive) مرة بالأسبوع على الأقل.</p>
    <p class="note">${last?`آخر نسخة من هذا الجهاز: <b class="num">${dateStr(last)}</b>${days>=7?` <span class="pill bad">صار لها ${days} يوم</span>`:""}`:"ما نزلت نسخة من هذا الجهاز بعد."}</p>
    <button class="btn" data-backup ${S.backingUp?"disabled":""}>${S.backingUp?"جاري تجهيز النسخة…":"تنزيل نسخة احتياطية"}</button></div>`}

/* ---------- AI staff reports ---------- */
const AI_KIND={report:"تقرير يومي",review:"مراجعة الأسبوع",content:"محتوى الأسبوع",stock:"المخزون",orders:"الطلبات",note:"ملاحظة"};
function renderAI(){
  if(!S.aiLoaded&&!S.aiLoading){S.aiLoading=true;load("ai").then(()=>{S.aiLoading=false;renderSafe()})}
  const list=S.ai||[];const f=S.aiF||"";const shown=f?list.filter(n=>n.kind===f):list;
  return `<div class="panel"><h2>الموظفين الأذكياء</h2>
    <p class="note">هنا تنحفظ تقارير ومخططات موظفين الذكاء الاصطناعي: التقرير اليومي، مراجعة الأسبوع، محتوى الأسبوع، وتنبيهات المخزون. يشتغلون من حساب المالك بالمتصفح الداخلي بحاسوبك، فخلي الحاسوب شغال وحساب المالك مسجّل دخول هناك.</p>
    <div class="cats"><button class="chip" data-aif="" aria-pressed="${!f}">الكل</button>${Object.entries(AI_KIND).map(([k,t])=>`<button class="chip" data-aif="${k}" aria-pressed="${f===k}">${t}</button>`).join("")}</div>
    ${!S.aiLoaded?`<div class="empty">جاري التحميل…</div>`:shown.length?`<div class="cards">${shown.map(n=>`<details class="scard"${n===shown[0]?" open":""}><summary class="hd" style="cursor:pointer"><b>${h(n.title||AI_KIND[n.kind]||"")}</b><span class="note"><span class="pill">${h(AI_KIND[n.kind]||n.kind)}</span> <span class="num">${dateStr(tsOf(n.created_at))} ${timeStr(tsOf(n.created_at))}</span></span></summary>
      <div style="white-space:pre-wrap;font-size:14px">${h(n.body||"")}</div></details>`).join("")}</div>`:`<div class="empty">ما كو تقارير بعد. أول تقرير ينزل الليلة بعد الساعة 11.</div>`}</div>`;
}

/* ---------- account (all roles) ---------- */
function renderAccount(){
  const p=S.me||{};const th=LS.get("crunchy.theme")||"auto";
  return `<div class="cols"><div class="panel acct"><h2>حسابي</h2>
    <dl class="kv"><dt>الاسم</dt><dd>${h(p.full_name||"—")}</dd><dt>الرقم</dt><dd class="num">${h(p.phone||"—")}</dd><dt>الدور</dt><dd>${h(ROLE_T[p.role]||"")}</dd>${p.role!=="owner"?`<dt>الفرع</dt><dd>${p.branch_id?h(brName(p.branch_id)):"كل الفروع"}</dd>`:""}</dl>
    <h3 style="margin-top:20px">تغيير كلمة السر</h3>
    <form id="myPwF" class="cards" novalidate>${pwField("myPw1","كلمة السر الجديدة (8 أحرف أو أكثر)","new-password")}${pwField("myPw2","أعد كلمة السر","new-password")}<button class="btn">حفظ كلمة السر</button></form>
    <h3 style="margin-top:20px">المظهر</h3>
    <div class="seg"><button data-theme-set="auto" aria-pressed="${th==="auto"}">حسب الجهاز</button><button data-theme-set="light" aria-pressed="${th==="light"}">فاتح</button><button data-theme-set="dark" aria-pressed="${th==="dark"}">داكن</button></div>
    ${printPanel()}
    <div class="row" style="margin-top:20px"><button class="btn ghost" data-install-help>طريقة تثبيت التطبيق</button><button class="btn danger" data-logout>تسجيل خروج</button></div></div>
    <div class="panel"><h3>عن التطبيق</h3><p class="note">نظام كرانشي ومور يشتغل من المتصفح ويتثبت مثل تطبيق على الموبايل والكمبيوتر. يحتاج إنترنت حتى يسجل الطلبات ويحدّث الشاشات.</p>
      <p class="note">رابط التطبيق: <span class="num" style="overflow-wrap:anywhere">${h(appLink())}</span></p></div></div>`;
}

function printPanel(){const c=prnCfg();
  return `<h3 style="margin-top:20px">الطباعة بهذا الجهاز</h3>
    <p class="note">للطابعة الحرارية المربوطة بهذا الجهاز. كل جهاز إله إعداده.</p>
    <div class="seg" role="group" aria-label="عرض الورق"><button data-prn-w="80" aria-pressed="${c.width==="80"}">ورق 80 ملم</button><button data-prn-w="58" aria-pressed="${c.width==="58"}">ورق 58 ملم</button></div>
    <label class="chk" style="margin-top:10px"><input type="checkbox" data-prn-opt="autoReceipt" ${c.autoReceipt?"checked":""}> اطبع وصل الزبون تلقائياً بعد تسجيل الطلب</label>
    <label class="chk"><input type="checkbox" data-prn-opt="autoKitchen" ${c.autoKitchen?"checked":""}> اطبع تذكرة المطبخ تلقائياً لكل طلب جديد</label>
    <div class="row" style="margin-top:8px;align-items:center"><div class="field" style="flex:0 0 140px"><label class="label" for="prnCopies">عدد النسخ</label><select id="prnCopies" data-prn-copies>${[1,2,3].map(n=>`<option value="${n}" ${c.copies===n?"selected":""}>${n}</option>`).join("")}</select></div>
      <button class="btn ghost" data-prn-test>طباعة تجريبية</button></div>`}

/* ---------- modals ---------- */
function renderModal(){
  const m=S.modal;const el=$("#modal");if(!m){el.innerHTML="";return}
  let body="";
  if(m.kind==="costmode"){const toR=m.mode==="recipe";
    body=`<h2 id="mdlT">تأكيد تغيير طريقة حساب الكلفة</h2>
      <p>راح تتحول من <b>${toR?"سعر صديقك":"الوصفات"}</b> إلى <b>${toR?"الوصفات (مطبخ خاص)":"سعر صديقك (شراء جاهز)"}</b>.</p>
      <ul class="steps">${toR?`<li>كلفة كل طلب جديد تنحسب من مواد الوصفة بمتوسط سعر الشراء.</li><li>المواد تنخصم من مخزن مطبخ الفرع لما المطبخ يبدي بالتحضير.</li><li>تأكد إن الوصفات وأرصدة المطبخ مضبوطة قبل ما تفعّل.</li>`
        :`<li>كلفة كل طلب جديد = سعر صديقك للوجبة.</li><li>المطبخ يبطل يخصم مواد من المخزن.</li>`}<li>الطلبات القديمة تبقى على حسابها.</li></ul>
      <div class="row"><button class="btn" id="cmOk" ${m.busy?"disabled":""}>${m.busy?"جاري التغيير…":"نعم، غيّر الطريقة"}</button><button class="btn ghost" data-close>إلغاء</button></div>`}
  else if(m.kind==="install"){
    body=`<h2 id="mdlT">تثبيت التطبيق</h2><p class="note">يتثبت مثل أي تطبيق ويفتح بشاشة كاملة بدون المتصفح.</p>
      <ol class="steps">${INSTALL_STEPS.map(([k,v])=>`<li><b>${k}:</b> ${h(v)}</li>`).join("")}</ol>
      <div class="row"><button class="btn" data-close>تمام</button></div>`}
  el.innerHTML=`<div class="modal-bg" data-close-bg><div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="mdlT">${body}</div></div>`;
}
function openModal(m){S.modal=m;renderModal();const b=$("#modal .btn");if(b)b.focus()}
function closeModal(){S.modal=null;renderModal()}
