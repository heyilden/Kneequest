/* Firebase Authentication + Cloud Firestore for a static GitHub Pages site.
 * Preloaded popup auth, UID-isolated journals, optimistic revisions, offline outbox.
 * No analytics, no Drive/Gmail permission, no administrative credential.
 */
(function(){'use strict';
const A=()=>window.KneeQuest,Core=window.KQSync;
const status={state:'loading',message:'Preparation de la connexion Google...',user:null,pending:0,conflicts:0};
let sdk,auth,db,user=null,engine=null,unsubscribe=null,busy=false,suppress=false,timer=null,onlineReady=false,epoch=0,guest=null,queueKey=null,syncStorageOK=true,hasServer=false;
const conf=window.KQ_FIREBASE_CONFIG;
function display(state,message){Object.assign(status,{state,message,pending:Object.keys(engine?.pending||{}).length,conflicts:Object.keys(engine?.conflicts||{}).length});document.querySelectorAll('[data-cloud-message],[data-local-label]').forEach(n=>n.textContent=message);document.querySelectorAll('[data-action="cloud-login"]').forEach(b=>b.disabled=state==='loading');document.querySelectorAll('.status-pill').forEach(n=>n.dataset.sync=state);window.dispatchEvent(new Event('kq-cloud-status'));}
function nice(e){const c=e?.code||'';return ({'auth/unauthorized-domain':'Domaine non autorise : ajoute ton nom.github.io dans Firebase Authentication > Parametres > Domaines autorises.','auth/popup-blocked':'La fenetre Google a ete bloquee. Ouvre le site dans Safari (pas dans une vue de piece jointe), autorise cette fenetre puis retouche Se connecter.','auth/popup-closed-by-user':'Connexion annulee. Tu peux reessayer.','auth/operation-not-allowed':'Active le fournisseur Google dans Firebase Authentication.','auth/invalid-api-key':'La configuration Firebase ne contient pas une cle Web valide.','auth/network-request-failed':'Connexion Internet indisponible. Reessaie une fois en ligne.','permission-denied':'Firestore refuse l acces. Publie les regles fournies dans firestore.rules, dans le meme projet que la connexion Google.','failed-precondition':'La base Firestore (default) doit etre creee dans ton projet. Verifie le guide.','resource-exhausted':'Quota Firebase atteint. Tes changements restent en attente si la copie locale est disponible.','unavailable':'Connexion au cloud indisponible. Les changements restent en attente.'})[c]||e?.message||'Synchronisation interrompue. Exporte le journal avant de fermer si le stockage local est indisponible.';}
function keep(){if(!queueKey||!engine)return;try{localStorage.setItem(queueKey,JSON.stringify(engine.save()));syncStorageOK=true;}catch{syncStorageOK=false;display('error','Copie de secours pleine ou bloquee. Garde cette page ouverte jusqu a la sauvegarde cloud, ou exporte ton journal.');}}
function summary(){if(!user)return;const n=Object.keys(engine?.pending||{}).length,c=Object.keys(engine?.conflicts||{}).length;if(c)display('conflict',c+' conflit(s) a resoudre : aucune version ecrasee.');else if(n)display('pending',n+' changement(s) en attente'+(!navigator.onLine?' - hors connexion.':'.'));else if(hasServer)display('synced','Synchronise avec Google'+(syncStorageOK?'':' - copie locale indisponible')+'.');else display('pending','Copie locale chargee. Verification du cloud en attente.');}
function applyView(changedIds=null){if(!engine)return;const current=A().getState();let state=Core.inflate(engine.view,KQ.defaultState(KQ_DATA.exercises));if(changedIds&&!changedIds.includes('active'))state.active=current.active;if(changedIds&&!changedIds.includes('dualActive'))state.dualActive=current.dualActive;suppress=true;try{A().replaceState(state);}finally{suppress=false;}}
function mapDocs(snap){const out={};snap.forEach(d=>{const v=d.data();if(typeof v.rev==='number'&&typeof v.payload==='string'&&typeof v.deleted==='boolean')out[d.id]={rev:v.rev,payload:v.payload,deleted:v.deleted};});return out;}
function changed(before,after){return [...new Set([...Object.keys(before),...Object.keys(after)])].filter(k=>before[k]!==after[k]);}
function onRemote(snap,myEpoch){if(myEpoch!==epoch||!engine||snap.metadata.hasPendingWrites)return;const remote=mapDocs(snap),before={...engine.view};engine.receive(remote);hasServer=!snap.metadata.fromCache;keep();const keys=changed(before,engine.view);if(keys.length){try{applyView(keys);}catch(e){display('error','Donnees cloud invalides : '+nice(e));return;}}summary();if(Object.keys(engine.pending).length)schedule();}
function capture(){if(suppress||!user||!engine)return;engine.capture(Core.flatten(A().getState()));keep();summary();schedule();}
function schedule(){clearTimeout(timer);timer=setTimeout(()=>flush(),1200);}
async function flush(){if(busy||!user||!engine||!onlineReady||!navigator.onLine)return;const batch=engine.batch();if(!batch.length){summary();return;}const localEpoch=epoch,uid=user.uid,workEngine=engine;
 for(const p of batch){if(new TextEncoder().encode(p.payload).byteLength>800000){display('error','Un element depasse la taille de securite cloud (800 ko). Reduis sa photo et exporte le journal. Rien n a ete tronque.');return;}workEngine.inflight[p.id]={...p};}
 busy=true;display('saving','Enregistrement sur Google...');
 try{
  const refs=batch.map(p=>sdk.doc(db,'users',uid,'records',p.id));
  await sdk.runTransaction(db,async tx=>{
   const snapshots=await Promise.all(refs.map(ref=>tx.get(ref)));const conflicts=[];
   for(let i=0;i<batch.length;i++){const old=snapshots[i].exists()?snapshots[i].data():{rev:0,payload:'',deleted:true};if(old.rev!==batch[i].baseRev)conflicts.push({id:batch[i].id,remote:{rev:old.rev,payload:old.payload,deleted:old.deleted}});}
   if(conflicts.length){const err=new Error('Deux appareils ont modifie le meme element.');err.conflicts=conflicts;throw err;}
   for(let i=0;i<batch.length;i++)tx.set(refs[i],{payload:batch[i].deleted?'':batch[i].payload,deleted:batch[i].deleted,rev:batch[i].baseRev+1,updatedAt:sdk.serverTimestamp()});
  });
  if(localEpoch!==epoch)return;
  for(const p of batch)workEngine.acknowledge(p.id,p,{payload:p.deleted?'':p.payload,deleted:p.deleted,rev:p.baseRev+1});hasServer=true;keep();summary();
 }catch(e){if(localEpoch!==epoch)return;for(const p of batch)delete workEngine.inflight[p.id];if(e.conflicts){for(const c of e.conflicts){workEngine.remote[c.id]=c.remote;const pending=workEngine.pending[c.id];if(pending)workEngine.conflicts[c.id]={local:{...pending},remote:c.remote};}keep();summary();}else display('error',nice(e));}
 finally{if(localEpoch===epoch){busy=false;if(engine.batch().length&&status.state!=='error')schedule();}}
}
async function hydrate(u){const myEpoch=++epoch;clearTimeout(timer);unsubscribe?.();unsubscribe=null;onlineReady=false;hasServer=false;busy=false;user=u;status.user=u?{uid:u.uid,email:u.email||''}:null;
 if(!u){engine=null;queueKey=null;A().setAccount(null);if(guest)A().replaceState(guest);guest=null;display('local','Mode local : connexion Google necessaire pour retrouver le journal ailleurs.');A().refresh();return;}
 if(!guest)guest=A().getState();A().setAccount(u.uid);queueKey='kneequest.v4.sync.'+u.uid;let saved=null;try{saved=JSON.parse(localStorage.getItem(queueKey));}catch{}
 engine=new Core.Reconciler(saved||{});const local=A().loadAccount(u.uid);if(local){try{A().replaceState(local);if(saved)engine.capture(Core.flatten(local));}catch(e){A().toast('Copie locale du compte illisible. Le cloud sera verifie.',true);}}
 display('loading','Connexion reussie. Lecture du journal Google...');A().refresh();
 try{
  const collection=sdk.collection(db,'users',u.uid,'records'),snap=await sdk.getDocsFromServer(collection);if(myEpoch!==epoch)return;
  const remote=mapDocs(snap);hasServer=true;
  if(!remote.profile||remote.profile.deleted){
   // Explicit migration; guest data never silently belongs to a different account.
   const source=local||(guest&&A().confirmImport(guest.history.length)?guest:KQ.defaultState(KQ_DATA.exercises));engine=new Core.Reconciler({remote});engine.capture(Core.flatten(KQ.validateState(source)));applyView();keep();
  }else if(saved){engine.receive(remote);applyView();keep();}
  else {engine=new Core.Reconciler({remote});applyView();keep();}
  onlineReady=true;unsubscribe=sdk.onSnapshot(collection,{includeMetadataChanges:true},s=>onRemote(s,myEpoch),e=>display('error',nice(e)));summary();A().refresh();schedule();
 }catch(e){if(myEpoch!==epoch)return;if(local&&saved){onlineReady=false;summary();}else if(!local){A().replaceState(KQ.defaultState(KQ_DATA.exercises));}display('error',nice(e)+' Aucune fusion aveugle avec le cloud. Utilise Reessayer.');A().refresh();}
}
function login(){if(!conf?.apiKey||!sdk||!auth){A().toast('Complete firebase-config.js puis publie les fichiers. Le guide Google + GitHub detaille les etapes.',true);window.open('./INSTALLATION.html','_blank','noopener');return Promise.resolve();}if(location.protocol==='file:'){return Promise.reject(new Error('Ouvre la version HTTPS publiee sur GitHub Pages, pas la piece jointe.'));}
 // Do not await network/bootstrap before this call: keep Safari user activation.
 return sdk.signInWithPopup(auth,new sdk.GoogleAuthProvider()).catch(e=>{display('error',nice(e));throw new Error(nice(e));});}
async function logout(){if(engine&&Object.keys(engine.pending).length){A().toast('Des changements attendent la synchronisation. Synchronise ou exporte avant de te deconnecter.',true);return;}if(!confirm('Te deconnecter de Google ? La copie privee du compte reste sur cet appareil pour les coupures.'))return;await sdk.signOut(auth);}
function showConflicts(){if(!engine)return;const list=Object.entries(engine.conflicts).map(([id,c])=>{let name=id;try{name=JSON.parse(c.local.payload||'{}').name||JSON.parse(c.local.payload||'{}').date||id;}catch{}return {id,label:name+(c.remote.deleted?' : supprime sur un autre appareil.':' : modifie sur deux appareils.')};});A().conflict(list,(id,choice)=>{if(choice==='local'&&!confirm('Remplacer explicitement la version Google de cet element par celle de cet appareil ?'))return;const before={...engine.view};engine.resolve(id,choice);keep();applyView(changed(before,engine.view));summary();schedule();});}
async function sync(){if(!user)return login();if(!onlineReady){await hydrate(auth.currentUser);return;}await flush();if(Object.keys(engine.conflicts).length)showConflicts();}
window.KQCloud={status,login,logout,sync,showConflicts};
window.addEventListener('kq-state-changed',capture);window.addEventListener('online',()=>sync());window.addEventListener('offline',summary);window.addEventListener('pagehide',keep);
window.addEventListener('beforeunload',e=>{if(!syncStorageOK&&Object.keys(engine?.pending||{}).length){e.preventDefault();e.returnValue='';}});
async function boot(){if(!conf||!['apiKey','authDomain','projectId','appId'].every(k=>typeof conf[k]==='string'&&conf[k].trim())){display('unconfigured','Google pas encore configure. Ouvre le guide de connexion.');return;}try{
 const base='https://www.gstatic.com/firebasejs/12.19.0/';const [app,a,f]=await Promise.all([import(base+'firebase-app.js'),import(base+'firebase-auth.js'),import(base+'firebase-firestore.js')]);sdk={...app,...a,...f};const instance=app.initializeApp(conf);auth=a.getAuth(instance);auth.languageCode='fr';await a.setPersistence(auth,a.browserLocalPersistence);db=f.initializeFirestore(instance,{localCache:f.memoryLocalCache()});a.onAuthStateChanged(auth,u=>hydrate(u));
 }catch(e){display('error','Connexion non initialisee : '+nice(e));}}
Promise.resolve(window.KQ_TAB_LOCK??true).then(ok=>{if(ok)boot();else display('error','Un seul onglet actif par navigateur. Ferme l autre onglet.');});
})();
