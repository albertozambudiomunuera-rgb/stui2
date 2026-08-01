/* ──────────────────────────────────────────────────────────────────────────
   Sonda de persistencia para STUIapp.

   Objetivo: cuantificar empíricamente la supervivencia de IndexedDB en
   navegadores móviles, la limitación declarada como crítica en el manuscrito.

   Método: escribe un registro "canario" con marca de tiempo y una carga útil
   de integridad verificable. En cada apertura posterior comprueba si el
   canario sobrevivió y cuánto tiempo lleva persistido. Genera así datos
   longitudinales de supervivencia por navegador y dispositivo.

   No recoge ni transmite ningún dato clínico ni identificativo.
   ────────────────────────────────────────────────────────────────────────── */

const DB='stui_persistence_probe', VER=1, STORE='probe', KEY='canary';
const PAYLOAD_KB=64;
const $=id=>document.getElementById(id);
const log=[];
function say(m){ log.push(new Date().toISOString().slice(11,19)+'  '+m);
                 $('log').textContent=log.join('\n'); }
function row(k,v,cls){ return `<div class="row"><span>${k}</span>
                        <span class="${cls||''}">${v}</span></div>`; }

function open(){ return new Promise((res,rej)=>{
  const r=indexedDB.open(DB,VER);
  r.onupgradeneeded=e=>{ const d=e.target.result;
    if(!d.objectStoreNames.contains(STORE)) d.createObjectStore(STORE); };
  r.onsuccess=e=>res(e.target.result); r.onerror=e=>rej(e.target.error); });}

function get(db,k){ return new Promise((res,rej)=>{
  const q=db.transaction(STORE,'readonly').objectStore(STORE).get(k);
  q.onsuccess=e=>res(e.target.result??null); q.onerror=e=>rej(e.target.error); });}

function put(db,k,v){ return new Promise((res,rej)=>{
  const t=db.transaction(STORE,'readwrite'); t.objectStore(STORE).put(v,k);
  t.oncomplete=()=>res(); t.onerror=e=>rej(e.target.error); });}

/* Carga útil determinista: permite verificar integridad byte a byte
   sin almacenar nada sensible. */
function makePayload(kb){
  let s=''; const chunk='0123456789abcdef';
  while(s.length<kb*1024) s+=chunk;
  return s.slice(0,kb*1024);
}
async function sha256(str){
  const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(str));
  return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
}

function detectBrowser(){
  const u=navigator.userAgent;
  let n='Desconocido', v='';
  if(/Edg\//.test(u)){n='Edge';v=u.match(/Edg\/([\d.]+)/)?.[1];}
  else if(/OPR\//.test(u)){n='Opera';v=u.match(/OPR\/([\d.]+)/)?.[1];}
  else if(/Firefox\//.test(u)){n='Firefox';v=u.match(/Firefox\/([\d.]+)/)?.[1];}
  else if(/CriOS\//.test(u)){n='Chrome iOS';v=u.match(/CriOS\/([\d.]+)/)?.[1];}
  else if(/Chrome\//.test(u)){n='Chrome';v=u.match(/Chrome\/([\d.]+)/)?.[1];}
  else if(/Safari\//.test(u)){n='Safari';v=u.match(/Version\/([\d.]+)/)?.[1];}
  let os='Desconocido';
  if(/iPhone|iPad|iPod/.test(u))os='iOS'; else if(/Android/.test(u))os='Android';
  else if(/Mac OS X/.test(u))os='macOS'; else if(/Windows/.test(u))os='Windows';
  else if(/Linux/.test(u))os='Linux';
  const standalone = window.matchMedia('(display-mode: standalone)').matches
                     || navigator.standalone===true;
  return {browser:n, version:v||'?', os, standalone,
          pwa: standalone?'Sí (instalada)':'No (pestaña)'};
}

function fmtBytes(b){
  if(b==null) return 'n/d';
  const u=['B','KB','MB','GB']; let i=0;
  while(b>=1024&&i<u.length-1){b/=1024;i++;}
  return b.toFixed(1)+' '+u[i];
}
function fmtDur(ms){
  const d=Math.floor(ms/86400000), h=Math.floor(ms%86400000/3600000),
        m=Math.floor(ms%3600000/60000);
  if(d>0) return `${d} d ${h} h`;
  if(h>0) return `${h} h ${m} min`;
  return `${m} min`;
}

let last={};

async function run(){
  const env=detectBrowser();
  $('env').innerHTML =
      row('Navegador', env.browser+' '+env.version)
    + row('Sistema', env.os)
    + row('Modo', env.pwa)
    + row('Pantalla', `${screen.width}×${screen.height} @${devicePixelRatio}x`);

  // ── Estado de persistencia y cuota ──────────────────────────────────────
  let persisted=null, est={};
  try{
    if(navigator.storage?.persisted) persisted=await navigator.storage.persisted();
    if(navigator.storage?.estimate)  est=await navigator.storage.estimate();
  }catch(e){ say('Storage API no disponible: '+e.message); }

  const pct = est.quota ? (est.usage/est.quota*100).toFixed(2)+' %' : 'n/d';
  $('storage').innerHTML =
      row('Persistente concedido',
          persisted===null?'API no disponible':(persisted?'Sí':'No'),
          persisted?'ok':'warn')
    + row('Cuota', fmtBytes(est.quota))
    + row('En uso', fmtBytes(est.usage))
    + row('Ocupación', pct);

  // ── Canario ─────────────────────────────────────────────────────────────
  const db=await open();
  let rec=await get(db,KEY);
  const now=Date.now();
  let survived=null, ageMs=null, integrity='—', intCls='';

  if(rec){
    ageMs = now-rec.created;
    survived=true;
    const h=await sha256(rec.payload);
    if(h===rec.hash){ integrity='Íntegro'; intCls='ok'; }
    else { integrity='CORRUPTO'; intCls='bad'; say('¡Hash no coincide!'); }
    rec.opens=(rec.opens||0)+1;
    rec.lastSeen=now;
    rec.history=(rec.history||[]).slice(-49);
    rec.history.push({t:now, persisted, usage:est.usage, quota:est.quota});
    await put(db,KEY,rec);
    say(`Canario vivo · ${rec.opens} aperturas · ${fmtDur(ageMs)}`);
  } else {
    const payload=makePayload(PAYLOAD_KB);
    const hash=await sha256(payload);
    rec={created:now, lastSeen:now, opens:1, payload, hash,
         env, history:[{t:now, persisted, usage:est.usage, quota:est.quota}]};
    await put(db,KEY,rec);
    survived=false; ageMs=0; integrity='Recién creado';
    say('Canario creado. Vuelve a abrir esta página dentro de unos días.');
  }

  $('canary').innerHTML =
      row('Estado', survived?'Sobrevivió':'Primera ejecución',
          survived?'ok':'warn')
    + row('Creado', new Date(rec.created).toLocaleString('es-ES'))
    + row('Aperturas', rec.opens)
    + row('Tamaño carga', PAYLOAD_KB+' KB');

  $('survival').textContent = survived ? fmtDur(ageMs) : 'iniciado';
  $('survival').className = 'big '+(survived?'ok':'warn');

  $('integrity').innerHTML =
      row('Verificación SHA-256', integrity, intCls)
    + row('Hash almacenado', rec.hash.slice(0,24)+'…');

  last={timestamp:new Date().toISOString(), env, persisted,
        quota:est.quota, usage:est.usage,
        canary:{created:rec.created, opens:rec.opens, ageMs,
                integrity, history:rec.history}};
}

$('refresh').onclick=()=>run().catch(e=>say('Error: '+e.message));

$('persist').onclick=async()=>{
  try{
    if(!navigator.storage?.persist) return say('persist() no disponible');
    const g=await navigator.storage.persist();
    say('persist() → '+(g?'CONCEDIDO':'DENEGADO'));
    run();
  }catch(e){ say('Error: '+e.message); }
};

$('export').onclick=()=>{
  const blob=new Blob([JSON.stringify(last,null,2)],{type:'application/json'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  const e=last.env||{};
  a.download=`persistencia_${e.browser}_${e.os}_${Date.now()}.json`.replace(/\s/g,'');
  a.click();
};

$('reset').onclick=async()=>{
  if(!confirm('¿Reiniciar el canario? Se pierde el historial de supervivencia.'))return;
  indexedDB.deleteDatabase(DB);
  say('Canario reiniciado. Recarga la página.');
};

run().catch(e=>say('Error: '+e.message));
