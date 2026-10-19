/* One editable tab per browser/site. Prevents two tabs sharing one offline outbox.
 * The lock never spans different devices; Firestore revisions handle those.
 */
(function(){'use strict';
 let release;
 function cover(message){const el=document.createElement('section');el.id='tab-lock-screen';el.setAttribute('role','alertdialog');el.setAttribute('aria-modal','true');el.style.cssText='position:fixed;inset:0;background:#102234f5;color:#f4f7fa;z-index:999999;display:grid;place-items:center;padding:24px;font-family:system-ui';const inner=document.createElement('div');inner.style.cssText='max-width:480px;text-align:center';const h=document.createElement('h1');h.textContent='Knee Quest est deja ouvert';const p=document.createElement('p');p.textContent=message;const b=document.createElement('button');b.textContent='L autre onglet est ferme : reessayer';b.className='btn primary';b.onclick=()=>location.reload();inner.append(h,p,b);el.append(inner);document.body.append(el);}
 window.KQ_TAB_LOCK=Promise.resolve(true);
 if(navigator.locks&&location.protocol!=='file:'){
  window.KQ_TAB_LOCK=new Promise(resolve=>{navigator.locks.request('kneequest-v4-'+location.pathname.replace(/[^/]*$/,''),{mode:'exclusive',ifAvailable:true},lock=>{
   if(!lock){cover('Pour proteger ta sauvegarde, utilise un seul onglet Knee Quest sur cet appareil. Ferme l autre onglet puis reessaie ici.');resolve(false);return;}
   resolve(true);return new Promise(r=>release=r);
  }).catch(()=>resolve(true));});
 }
 window.addEventListener('pagehide',()=>release?.());
 window.addEventListener('pageshow',e=>{if(e.persisted)location.reload();});
})();
