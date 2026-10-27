const $ = (id) => document.getElementById(id);
const STORE_KEY = "mlbb_vault_tracker_v1";
const DAILY = 20, PASS_BONUS = 80, PASS_DAYS = 7, PASS_TOTAL = 220, RING = 2 * Math.PI * 52;
const defaults = {
  diamonds:128, passes:1, passDays:5, passPrice:2.06,
  legendGoal:8000, legendFree:0, legendRate:1, legendDate:"",
  aspGoal:60, aspDone:40, aspCost:50, aspFree:20, aspPattern:"2-3-1-1",
  collabGoal:9000, collabFree:10, collabRate:50, collabDate:"", priorityGoal:"legend"
};
const inputs = Object.keys(defaults);
let lastSync = "", askPass = false, deferredInstallPrompt = null;

function num(id){const n=Number($(id).value);return Number.isFinite(n)?Math.max(0,n):0}
function int(id){return Math.floor(num(id))}
function setNum(id,v){$(id).value=Math.max(0,Math.round(v))}
function fmt(n){return Math.round(n).toLocaleString("en-US")}
function money(n){return "$"+Math.max(0,n).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}
function setText(id,value){$(id).textContent=value}
function clamp(n,min,max){return Math.min(max,Math.max(min,n))}

// ---- Tiempo real: un reclamo de 20 por cada día calendario que pasa ----
function todayKey(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
function dayIndex(key){const [y,m,d]=key.split("-").map(Number);return Math.round(Date.UTC(y,m-1,d)/864e5)}
function minsToMidnight(){const now=new Date(),next=new Date(now);next.setHours(24,0,0,0);return Math.max(0,Math.round((next-now)/6e4))}
// Procesa los días transcurridos desde la última sincronización (aunque la app estuviera cerrada).
function syncDays(){
  const today=todayKey();
  if(!lastSync){lastSync=today;return 0}
  const elapsed=dayIndex(today)-dayIndex(lastSync);
  if(elapsed<=0)return 0;
  const before=int("passDays"), claims=Math.min(elapsed,before);
  if(claims>0){
    setNum("diamonds",num("diamonds")+claims*DAILY);
    setNum("passDays",before-claims);
    if(before-claims===0)askPass=true; // el conteo terminó: preguntar por pase nuevo
  }
  lastSync=today;
  return claims;
}
// Reglas: con días restantes -> +80 y se suman los 7 días (sin 20 extra hoy).
// Con cero días -> +80 y +20 del día, y el conteo queda en 7 días totales (6 pendientes).
function registerPasses(n){
  syncDays();
  n=Math.max(0,Math.floor(n));
  askPass=false;
  if(n>0){
    const before=int("passDays");
    setNum("diamonds",num("diamonds")+n*PASS_BONUS);
    if(before>0){
      setNum("passDays",before+n*PASS_DAYS);
    }else{
      setNum("diamonds",num("diamonds")+DAILY);
      setNum("passDays",n*PASS_DAYS-1);
    }
    setNum("passes",num("passes")+n);
  }
  save();update();
}

function getShared(){
  const days=int("passDays"), diamonds=num("diamonds");
  return {days, diamonds, pending:days*DAILY, effective:diamonds+days*DAILY, passPrice:num("passPrice")};
}
function updatePass(g){
  setText("ringDays",g.days);
  $("ringFg").style.strokeDashoffset=String(RING*(1-Math.min(g.days,PASS_DAYS)/PASS_DAYS));
  const m=minsToMidnight();
  setText("nextClaim",g.days>0?`Próximo reclamo en ${Math.floor(m/60)} h ${m%60} min`:"Sin pase activo");
  setText("pendingPreview",g.days>0?`${fmt(g.pending)} diamantes pendientes · ${g.days} reclamos`:"Sin días restantes");
  $("passBanner").hidden=!askPass;
}
function update(){
  const g=getShared();
  updatePass(g);
  $("effectiveDiamonds").innerHTML=`${fmt(g.effective)} <small>diamantes</small>`;
  $("passValue").innerHTML=`${money(g.passPrice)} <small>/ pase</small>`;
  const priority=$("priorityGoal").value;
  setText("prioritySummary",`${fmt(g.effective)} diamantes`);
  setText("prioritySummaryNote",`Asignados solo a: ${{legend:"Legend futura",aspirants:"Aspirantes",collab:"Jujutsu Kaisen"}[priority]}.`);
  // Legend
  const lgGoal=num("legendGoal"), lgFree=num("legendFree")*Math.max(1,num("legendRate"));
  const lgNet=Math.max(0,lgGoal-lgFree), lgAllocated=priority==="legend"?g.effective:0, lgMissing=Math.max(0,lgNet-lgAllocated);
  const lgPasses=Math.ceil(lgMissing/PASS_TOTAL), lgPct=lgGoal?clamp((lgAllocated+lgFree)/lgGoal*100,0,100):100;
  setText("legendPercent",`${Math.round(lgPct)}%`);$("legendProgress").style.width=`${lgPct}%`;
  setText("legendMissing",fmt(lgMissing));setText("legendPasses",fmt(lgPasses));
  setText("legendCost",money(lgPasses*g.passPrice));setText("legendTime",`${lgPasses} semanas`);
  setText("legendStatus",priority==="legend"?(lgMissing===0?"¡Meta cubierta según los valores actuales! Confirma las reglas oficiales del evento antes de gastar.":`Te faltan ${fmt(lgMissing)} diamantes estimados después de asignar el fondo global.`):"No es el objetivo prioritario. El saldo global no se descuenta aquí para evitar contar los mismos diamantes dos veces.");
  markCard(".legend-result",priority==="legend");
  // Aspirants
  const ag=Math.max(1,int("aspGoal")), done=Math.min(int("aspDone"),ag), free=int("aspFree");
  const pullsLeft=Math.max(0,ag-done-free), aspCost=pullsLeft*num("aspCost"), aspAllocated=priority==="aspirants"?g.effective:0, aspMissing=Math.max(0,aspCost-aspAllocated);
  const aspPct=clamp(done/ag*100,0,100), aspPasses=Math.ceil(aspMissing/PASS_TOTAL);
  setText("aspPercent",`${Math.round(aspPct)}%`);$("aspProgress").style.width=`${aspPct}%`;
  setText("aspRemaining",fmt(pullsLeft));setText("aspDiamonds",fmt(aspCost));setText("aspMissing",fmt(aspMissing));setText("aspPasses",fmt(aspPasses));
  const pattern=($("aspPattern").value||"").trim();
  setText("aspStatus",`Patrón registrado: ${pattern||"sin datos"}. ${priority==="aspirants"?"Fondo global aplicado una sola vez":"Este escenario no usa el saldo global mientras no sea prioritario"}; un patrón no garantiza el resultado.`);
  markCard(".violet-result",priority==="aspirants");
  // Collab
  const cg=num("collabGoal"), cf=int("collabFree")*num("collabRate"), cNet=Math.max(0,cg-cf), cAllocated=priority==="collab"?g.effective:0, cmissing=Math.max(0,cNet-cAllocated);
  const cpct=cg?clamp((cAllocated+cf)/cg*100,0,100):100, cpasses=Math.ceil(cmissing/PASS_TOTAL);
  setText("collabPercent",`${Math.round(cpct)}%`);$("collabProgress").style.width=`${cpct}%`;
  setText("collabCost",fmt(cNet));setText("collabMissing",fmt(cmissing));setText("collabPasses",fmt(cpasses));setText("collabMoney",money(cpasses*g.passPrice));
  setText("collabStatus",priority==="collab"?(cmissing===0?"La meta estimada está cubierta. Verifica las reglas y precios del evento antes de gastar.":`Faltan ${fmt(cmissing)} diamantes después de aplicar el fondo global.`):"Este escenario no usa el saldo global mientras no sea prioritario; así no se contabilizan los mismos diamantes dos veces.");
  markCard(".red-result",priority==="collab");
}
function markCard(selector,isPriority){
  const card=document.querySelector(selector);
  card.classList.toggle("is-priority",isPriority);card.classList.toggle("non-priority",!isPriority);
  let badge=card.querySelector(".allocation-label");
  if(!badge){badge=document.createElement("span");badge.className="allocation-label";card.querySelector(".result-kicker").insertAdjacentElement("afterend",badge)}
  badge.textContent=isPriority?"✓ OBJETIVO PRIORITARIO · FONDO APLICADO":"FONDO GLOBAL NO ASIGNADO";
}

// ---- Persistencia ----
function save(){
  const state={lastSync,askPass};
  inputs.forEach(id=>{state[id]=$(id).value});
  try{localStorage.setItem(STORE_KEY,JSON.stringify(state));setText("saveState","Guardado local")}catch(e){setText("saveState","No se pudo guardar")}
}
function load(){
  try{
    const s=JSON.parse(localStorage.getItem(STORE_KEY)||"{}");
    inputs.forEach(id=>{if(s[id]!==undefined)$(id).value=s[id]});
    lastSync=s.lastSync||""; askPass=!!s.askPass;
  }catch(e){}
}

// ---- Diálogo de pase ----
function openPassDialog(auto){
  $("passDialogTitle").textContent=auto?"¿Activaste un nuevo pase?":"Registrar pase activado";
  $("passDialogText").textContent=auto?"Se terminó el conteo de tus días. ¿Cuántos pases activaste? Pon 0 si aún no.":"¿Cuántos pases activaste ahora mismo?";
  $("passCount").value=1;$("passDialog").showModal();
}
function tick(){
  const wasAsk=askPass;
  syncDays();
  if(!wasAsk&&askPass)openPassDialog(true);
  save();update();
}

// ---- Eventos ----
document.querySelectorAll("input").forEach(el=>el.addEventListener("input",()=>{save();update()}));
$("priorityGoal").addEventListener("change",()=>{save();update()});
document.querySelectorAll(".tab").forEach(tab=>tab.addEventListener("click",()=>{
  document.querySelectorAll(".tab").forEach(t=>{const active=t===tab;t.classList.toggle("active",active);t.setAttribute("aria-selected",String(active))});
  document.querySelectorAll(".tab-panel").forEach(p=>{const active=p.id===`panel-${tab.dataset.tab}`;p.hidden=!active;p.classList.toggle("active",active)});
}));
$("resetBtn").addEventListener("click",()=>{
  if(!confirm("¿Restablecer todos los valores del tracker a los iniciales?"))return;
  Object.entries(defaults).forEach(([id,value])=>$(id).value=value);
  lastSync=todayKey();askPass=false;save();update();
});
$("settingsBtn").addEventListener("click",()=>$("settingsDialog").showModal());
$("registerBtn").addEventListener("click",()=>openPassDialog(false));
$("passBanner").addEventListener("click",()=>openPassDialog(true));
$("passConfirm").addEventListener("click",()=>{$("passDialog").close();registerPasses(int("passCount"))});
$("passLater").addEventListener("click",()=>$("passDialog").close());
document.addEventListener("visibilitychange",()=>{if(!document.hidden)tick()});
setInterval(tick,60000);

// ---- Instalación (PWA) ----
const isStandalone=matchMedia("(display-mode: standalone)").matches||navigator.standalone===true;
const isIOS=/iphone|ipad|ipod/i.test(navigator.userAgent);
if(isStandalone)$("installBtn").hidden=true;
else if(isIOS)$("installBtn").hidden=false;
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredInstallPrompt=e;$("installBtn").hidden=false});
window.addEventListener("appinstalled",()=>{$("installBtn").hidden=true;deferredInstallPrompt=null});
$("installBtn").addEventListener("click",async()=>{
  if(deferredInstallPrompt){deferredInstallPrompt.prompt();await deferredInstallPrompt.userChoice;deferredInstallPrompt=null;$("installBtn").hidden=true;return}
  alert("Para instalar: en iPhone/iPad toca Compartir → «Añadir a pantalla de inicio». En Chrome o Edge abre el menú ⋮ → «Instalar aplicación».");
});
if("serviceWorker" in navigator && location.protocol.startsWith("http")){
  window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
}

// ---- Arranque ----
load();
syncDays();
save();update();
if(askPass)openPassDialog(true);
