/* ---------- PWA: service worker + install button ---------- */
let deferredInstall=null;
const isStandalone=()=>matchMedia("(display-mode: standalone)").matches||navigator.standalone===true;
const isIOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredInstall=e;renderInstallBtn()});
window.addEventListener("appinstalled",()=>{deferredInstall=null;renderInstallBtn();toast("انثبت التطبيق")});
function renderInstallBtn(){const b=$("#installBtn");if(!b)return;b.hidden=isStandalone()||!(deferredInstall||isIOS())}
async function doInstall(){
  if(deferredInstall){const e=deferredInstall;deferredInstall=null;try{e.prompt();await e.userChoice}catch(_){}renderInstallBtn();return}
  openModal({kind:"install"});
}
if("serviceWorker" in navigator&&location.protocol!=="file:"){
  window.addEventListener("load",()=>{navigator.serviceWorker.register("./sw.js",{scope:"./"}).catch(err=>console.warn("sw",err))});
}
