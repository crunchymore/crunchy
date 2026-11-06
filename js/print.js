/* ---------- thermal printing (58 / 80 mm) ---------- */
const PRN_KEY="crunchy.print";
function prnCfg(){let c={};try{c=JSON.parse(localStorage.getItem(PRN_KEY)||"{}")||{}}catch(_){}return {width:c.width==="58"?"58":"80",autoReceipt:!!c.autoReceipt,autoKitchen:!!c.autoKitchen,copies:Math.min(3,Math.max(1,+c.copies||1))}}
function prnSet(p){const c={...prnCfg(),...p};try{localStorage.setItem(PRN_KEY,JSON.stringify(c))}catch(_){}return c}

function prnDoc(o,kinds){
  const c=prnCfg();const W=c.width==="58"?48:72;const big=c.width==="58"?15:18;
  const e=s=>String(s==null?"":s).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  const n=v=>Number(v||0).toLocaleString("en-US");
  const d=new Date(o.ts||Date.now());const dt=`${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
  const cu=o.customer||{};const items=o.items||[];
  const receipt=()=>`<section>
    <div class="c b xl">كرانشي ومور</div><div class="c s">Crunchy &amp; More · توصيل بغداد</div><hr>
    <div class="r"><span>طلب</span><b class="ltr">#${e(o.no)}</b></div><div class="r"><span>الوقت</span><span class="ltr">${dt}</span></div><div class="r"><span>المصدر</span><span>${e(o.channel)}</span></div>
    ${cu.name||cu.phone?`<hr><div>${e(cu.name||"")} <span class="ltr">${e(cu.phone||"")}</span></div>`:""}${o.area?`<div>المنطقة: <b>${e(o.area)}</b></div>`:""}${cu.address?`<div>${e(cu.address)}</div>`:""}
    <hr>${items.map(i=>`<div class="r"><span>${e(i.qty)}× ${e(i.name)}</span><span class="ltr">${n((+i.price||0)*(+i.qty||0))}</span></div>`).join("")}<hr>
    <div class="r"><span>المجموع</span><span class="ltr">${n(o.subtotal)}</span></div>
    ${o.discount?`<div class="r"><span>خصم</span><span class="ltr">-${n(o.discount)}</span></div>`:""}
    ${o.deliveryFee?`<div class="r"><span>التوصيل</span><span class="ltr">${n(o.deliveryFee)}</span></div>`:""}
    <div class="r b lg"><span>المطلوب</span><span class="ltr">${n((+o.revenue||0)+(+o.deliveryFee||0))} د.ع</span></div>
    ${o.note?`<hr><div>ملاحظة: ${e(o.note)}</div>`:""}
    <hr><div class="c s">اطلب واتساب 0776 659 9599<br>يومياً 12 الظهر – 1 بالليل<br>بالعافية 🌷</div></section>`;
  const kitchen=()=>`<section>
    <div class="r b"><span class="xl ltr">#${e(o.no)}</span><span>${e(o.channel)}</span></div><div class="s ltr" style="text-align:right">${dt}</div><hr>
    ${items.map(i=>`<div class="k"><b class="ltr">${e(i.qty)}×</b> ${e(i.name)}</div>`).join("")}
    ${o.note?`<hr><div class="k b">ملاحظة: ${e(o.note)}</div>`:""}<hr><div class="c s">تذكرة مطبخ</div></section>`;
  const parts=[];for(let k=0;k<c.copies;k++)for(const t of kinds)parts.push(t==="kitchen"?kitchen():receipt());
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>#${e(o.no)}</title><style>
    @page{size:${c.width}mm auto;margin:0}
    *{box-sizing:border-box}html,body{margin:0;padding:0;background:#fff;color:#000}
    body{width:${W}mm;margin:0 auto;padding:2mm 0 4mm;font-family:"IBM Plex Sans Arabic",Tahoma,Arial,sans-serif;font-size:${c.width==="58"?11:13}px;line-height:1.45}
    section{page-break-after:always;break-after:page;padding-bottom:3mm}section:last-child{page-break-after:auto;break-after:auto}
    hr{border:0;border-top:1px dashed #000;margin:4px 0}.c{text-align:center}.b{font-weight:700}.s{font-size:.85em}
    .xl{font-size:${big+4}px}.lg{font-size:${big-2}px}.r{display:flex;justify-content:space-between;gap:6px}.r>span:first-child{min-width:0}
    .k{font-size:${big}px;margin:3px 0}.ltr{direction:ltr;unicode-bidi:isolate;font-variant-numeric:tabular-nums}
  </style></head><body>${parts.join("")}</body></html>`;
}

function printOrder(o,kinds){
  if(!o)return;kinds=Array.isArray(kinds)?kinds:[kinds||"receipt"];
  let f=document.getElementById("prnFrame");if(f)f.remove();
  f=document.createElement("iframe");f.id="prnFrame";f.setAttribute("aria-hidden","true");f.style.cssText="position:fixed;width:0;height:0;border:0;left:-9999px;top:0";
  document.body.appendChild(f);const d=f.contentDocument;d.open();d.write(prnDoc(o,kinds));d.close();
  setTimeout(()=>{try{f.contentWindow.focus();f.contentWindow.print()}catch(_){toast("ما گدرت أطبع من هذا الجهاز")}},250);
}
function findOrder(id){return S.today.find(x=>x.id===id)||S.orders.find(x=>x.id===id)}
