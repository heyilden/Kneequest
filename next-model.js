/* Knee Quest 4.0: completion-based coverage planner and self-reported recovery.
 * Pure functions. No credentials, no network, no clinical dose inference.
 */
(function(K,D){
'use strict';
const oldMigrate=K.migrate,oldValidate=K.validateState,oldDefault=K.defaultState,oldRule=K.standardRule,oldXP=K.xp;
const clone=K.clone, blocks=['bas','gainage','haut'];
function upgradeRule(r){
 r=clone(r);r.coverage={balanced:true,avoidPreviousWeekPair:true,matchSecondary:false,allExercises:true,strictOrder:false,...r.coverage};
 r.bonusMoment=r.bonusMoment||'end';return r;
}
function migrate(s){s=oldMigrate(s);s.rules=s.rules.map(upgradeRule);s.wellness=s.wellness||[];s.version='4.0.0';s.ruleVersion=4;s.settings.localOnly=false;return s;}
function defaultState(ex){return migrate(oldDefault(ex));}
function validateState(s){s=migrate(oldValidate(s));if(!Array.isArray(s.wellness)||s.wellness.length>10000)throw Error('Journal Hooper invalide.');for(const w of s.wellness){if(!w||!K.validDate(w.date)||!w.id||hooper(w)===null)throw Error('Une mesure Hooper doit contenir quatre notes de 1 a 7.');}return s;}
function credited(i){return !!(K.completedItem(i)||i.rotationCredit===true);}
function creditDate(i,s,tz){if(K.validDate(i.validatedDate))return i.validatedDate;if(i.validatedAt)return K.dateKey(new Date(i.validatedAt),tz);if(K.completedItem(i)&&i.log?.length){const t=i.log[i.log.length-1].at;if(t&&!Number.isNaN(+new Date(t)))return K.dateKey(new Date(t),tz);}return s.date;}
function ledger(history,tz='Europe/Luxembourg',date='9999-12-31'){
 const list=[];for(const s of history){if(s.status==='discarded')continue;for(const i of s.items||[]){if(i.bonus||!credited(i))continue;const d=creditDate(i,s,tz);if(!K.validDate(d)||d>date)continue;
 const gs=[...new Set(i.assignedGroups?.length?i.assignedGroups:[i.group])];for(const g of gs)list.push({date:d,week:K.weekKey(d),group:g,mode:i.mode==='base'?s.mode:i.mode,block:i.block,relatedGroups:[...new Set([i.group,...i.groups||[]])],id:i.id,sessionId:s.id,manual:i.rotationCredit===true,at:i.validatedAt||s.completedAt||s.startedAt||0});}}
 return list.sort((a,b)=>a.date.localeCompare(b.date)||a.at-b.at);
}
function exposure(history,tz,date){const all=ledger(history,tz,date).filter(x=>x.block==='bas');const seen=new Set();return all.filter(x=>{const k=[x.sessionId,x.date,x.group,x.mode].join('|');if(seen.has(k))return false;seen.add(k);return true;});}
function rotation(history,allowed=K.MODES,rule=upgradeRule(oldRule()),date='9999-12-31',tz='Europe/Luxembourg'){
 const seq=rule.cycle.filter(m=>allowed.includes(m)&&rule.modes.includes(m));
 const done=(i,s)=>credited(i)&&creditDate(i,s,tz)<=date;const lastDate=s=>K.lowerItems(s).filter(i=>done(i,s)).map(i=>creditDate(i,s,tz)).sort().at(-1)||s.date;
 const hs=history.filter(s=>s.status!=='discarded'&&(rule.rotationScope!=='profile'||s.ruleId===rule.id||(!s.ruleId&&rule.id==='standard'))&&K.lowerItems(s).some(i=>done(i,s))).sort((a,b)=>lastDate(a).localeCompare(lastDate(b))||(a.completedAt||a.startedAt||0)-(b.completedAt||b.startedAt||0));
 const h=hs.at(-1);if(!h)return {mode:seq[0]||null,total:0,complete:0,pending:[],advanced:false};
 const lower=K.lowerItems(h),pending=lower.filter(i=>!done(i,h));let advance=rule.rotationWhen==='lower-complete'?!pending.length:rule.rotationWhen==='any-lower'?lower.some(i=>done(i,h)):rule.rotationWhen==='session-complete'?h.items.filter(i=>!i.bonus).every(i=>done(i,h)):false;
 if(!rule.autoRotate)advance=false;const idx=seq.indexOf(h.mode),mode=advance?seq[(idx+1)%seq.length]:(seq.includes(h.mode)?h.mode:seq[0]);
 return {mode:mode||null,total:lower.length,complete:lower.length-pending.length,pending:advance?[]:pending,advanced:advance,from:h.id,previousMode:h.mode};
}
function matches(e,g,r){return e.group===g||(r.coverage.matchSecondary&&(e.groups||[]).includes(g));}
function coverageRows(exercises,history,r,tz,date){const logs=exposure(history,tz,date);const groups=[...new Set(exercises.filter(e=>e.block==='bas'&&!e.bonus&&e.enabled).flatMap(e=>r.coverage.matchSecondary?[e.group,...e.groups||[]]:[e.group]))];return groups.map(group=>({group,modes:Object.fromEntries(K.MODES.map(mode=>{const ls=logs.filter(x=>x.group===group&&x.mode===mode);return [mode,{count:ls.length,last:ls.at(-1)?.date||null,available:exercises.some(e=>!e.bonus&&e.block==='bas'&&matches(e,group,r)&&K.eligible(e,mode,r))}];}))}));}
function hash(text){let v=2166136261;for(const c of text)v=Math.imul(v^c.charCodeAt(0),16777619);return (v>>>0)/4294967296;}
function repeatUsage(history,date,r,tz){return ledger(history,tz,date).filter(x=>r.repeatBlocks.includes(x.block)&&(r.historyScope==='week'?x.week===K.weekKey(date):x.date>=K.plusDays(date,1-r.historyDays)));}
function repeatSafe(e,used,r){if(!r.repeatBlocks.includes(e.block)||e.repeatAllowed&&r.allowExceptions)return true;const logs=used.filter(x=>x.block===e.block),gs=r.repeatBasis==='all'?[e.group,...e.groups||[]]:[e.group];return (!r.antiExercises||!logs.some(x=>x.id===e.id))&&(!r.antiGroups||!logs.some(x=>gs.some(g=>(r.repeatBasis==='all'?x.relatedGroups:[x.group]).includes(g))));}
function choosePlan(exercises,history,opts){
 const r=upgradeRule(opts.rule||oldRule()),date=opts.date||K.dateKey(),tz=opts.timeZone||'Europe/Luxembourg',cfg=r.blocks.bas;
 const allowed=(opts.allowedModes||r.modes).filter(m=>r.modes.includes(m));
 const rot=rotation(history,allowed,r,date,tz),logs=exposure(history,tz,date),week=K.weekKey(date),previous=K.plusDays(week,-7);
 let types=opts.auto&&r.autoRotate?allowed:[opts.mode||rot.mode];if(!types.length||types.some(m=>!allowed.includes(m)))return {ok:false,issues:['Aucun type d effort autorise pour ce profil.']};
 const continuing=rot.pending.length&&r.rotationWhen==='lower-complete'&&r.autoRotate;
 if(continuing)types=types.filter(m=>m===rot.mode);
 if(opts.auto&&r.autoRotate&&r.coverage.strictOrder)types=types.filter(m=>m===rot.mode);
 const candidates=[],unavailable=[],used=repeatUsage(history,date,r,tz);
 for(const mode of types){
  const all=exercises.filter(e=>!e.bonus&&e.block==='bas'&&e.enabled&&e.approved&&e.frequency>0&&K.doseFor(e,mode,r));
  let groups=[...new Set(all.flatMap(e=>r.coverage.matchSecondary?[e.group,...e.groups||[]]:[e.group]))];if(cfg.groups.length)groups=groups.filter(g=>cfg.groups.includes(g));
  const pendingIds=continuing?rot.pending.map(i=>i.id):[],pendingGroups=continuing?[...new Set(rot.pending.flatMap(i=>i.assignedGroups||[i.group]))]:[];
  const ranked=groups.map(g=>{
   let pool=all.filter(e=>matches(e,g,r));if(continuing&&pendingGroups.includes(g))pool=pool.filter(e=>pendingIds.includes(e.id));
   const historyG=logs.filter(x=>x.group===g),pair=historyG.filter(x=>x.mode===mode),recent=historyG.filter(x=>r.historyScope==='week'?x.week===week:x.date>=K.plusDays(date,1-r.historyDays));
   const pending=pendingGroups.includes(g);
   const blockedGroup=r.antiGroups&&r.repeatBlocks.includes('bas')&&recent.length&&!pending&&!pool.some(e=>e.repeatAllowed&&r.allowExceptions);
   const blockedPair=r.coverage.avoidPreviousWeekPair&&pair.some(x=>x.week===previous)&&!pending;
   if(!pending)pool=pool.filter(e=>repeatSafe(e,used,r));
   if(blockedGroup||blockedPair||!pool.length)return null;
   const n=pair.length,last=pair.at(-1)?.date||'1900-01-01',groupLast=historyG.at(-1)?.date||'1900-01-01';
   // Count dominates recency and tie-breakers: an unvisited pair wins over a visited pair.
   const score=(pending?-1e9:0)+n*100000+Math.max(0,25000-(+new Date(date)-+new Date(last))/86400000)*.5+Math.max(0,100-(+new Date(date)-+new Date(groupLast))/86400000)+hash(date+'|'+g+'|'+mode);
   return {group:g,pool,score,count:n,last,pending};
  }).filter(Boolean).sort((a,b)=>a.score-b.score);
  const need=cfg.enabled?(continuing&&pendingGroups.length?Math.min(cfg.count,pendingGroups.length):cfg.count):0;
  if(cfg.enabled&&cfg.selection==='groups'&&ranked.length<need){unavailable.push(mode+' : '+ranked.length+' groupe(s) compatible(s), '+need+' demande(s).');continue;}
  const selected=cfg.selection==='groups'?ranked.slice(0,need):[];
  if(cfg.enabled&&cfg.selection!=='groups'){
   let pool=all;if(cfg.groups.length)pool=pool.filter(e=>cfg.groups.some(g=>matches(e,g,r)));if(cfg.selection==='manual')pool=pool.filter(e=>cfg.ids.includes(e.id));
   if(cfg.selection==='manual'&&(!cfg.ids.length||cfg.ids.some(id=>!pool.some(e=>e.id===id)))){unavailable.push(mode+' : une carte manuelle est exclue, bonus, non autorisee ou sans dosage compatible.');continue;}
   if(!pool.length){unavailable.push(mode+' : aucun exercice du bas compatible.');continue;}
   if(cfg.selection==='count')pool=pool.sort((a,b)=>hash(a.id+date)-hash(b.id+date)).slice(0,cfg.count);
   if(r.antiGroups||r.antiExercises){const ids=new Set(ranked.flatMap(g=>g.pool.map(e=>e.id)));if(pool.some(e=>!ids.has(e.id))){unavailable.push(mode+' : selection manuelle incompatible avec les regles anti-repetition. Desactive leur application en mode manuel pour conserver tes cartes.');continue;}}
   for(const g of [...new Set(pool.map(e=>e.group))])selected.push({group:g,pool:pool.filter(e=>e.group===g),score:0,count:logs.filter(x=>x.group===g&&x.mode===mode).length,last:'1900-01-01'});
  }
  const avg=selected.length?selected.reduce((n,x)=>n+x.score,0)/selected.length:0;
  const repeatLast=rot.previousMode===mode&&allowed.length>1?5000:0;
  const cyclePenalty=mode===rot.mode?0:50;
  candidates.push({mode,groups:selected,score:avg+repeatLast+cyclePenalty,continuing});
 }
 candidates.sort((a,b)=>a.score-b.score);
 if(!candidates.length&&r.shortage==='allow'&&!opts._relaxed){const relaxed=choosePlan(exercises,history,{...opts,_relaxed:true,rule:{...r,antiExercises:false,antiGroups:false,shortage:'block',coverage:{...r.coverage,avoidPreviousWeekPair:false}}});if(relaxed.ok)relaxed.plan.relaxed=true;return relaxed;}
 if(!candidates.length)return {ok:false,issues:['Aucune combinaison ne respecte toutes tes regles. Les groupes faits cette semaine et les couples groupe/type de la semaine precedente restent exclus.',...unavailable,'Reduis le nombre de groupes, active des variantes confirmees ou modifie explicitement les regles. Rien n est assoupli en secret.']};
 return {ok:true,plan:candidates[0],rule:r};
}
function generate(exercises,history,options={},rng=Math.random){
 const opts={date:K.dateKey(),...options},r=upgradeRule(opts.rule||oldRule());K.validRule(r);
 if(!K.validDate(opts.date))return {ok:false,issues:['Date invalide.']};
 const p=choosePlan(exercises,history,{...opts,rule:r});if(!p.ok)return p;
 const mode=p.plan.mode,selected=p.plan.groups,items=[],warnings=[];if(p.plan.relaxed)warnings.push('Repetitions autorisees exceptionnellement : ton reglage avance Si le choix manque = Autoriser a ete applique.');const used=repeatUsage(history,opts.date,r,opts.timeZone||'Europe/Luxembourg');
 for(const b of r.order){const cfg=r.blocks[b];if(!cfg.enabled)continue;let chosen=[];
  if(b==='bas'){for(const sel of selected){for(const e of (r.coverage.allExercises?sel.pool:sel.pool.slice(0,1))){const found=chosen.find(x=>x.e.id===e.id);if(found)found.gs.push(sel.group);else chosen.push({e,gs:[sel.group]});}}}
  else {let pool=exercises.filter(e=>!e.bonus&&e.block===b&&e.enabled&&e.frequency>0);if(cfg.groups.length)pool=pool.filter(e=>cfg.groups.some(g=>matches(e,g,r)));if(cfg.selection==='manual')pool=pool.filter(e=>cfg.ids.includes(e.id));
   const missing=pool.filter(e=>!K.doseFor(e,mode,r));if((cfg.selection==='all'||cfg.selection==='manual')&&missing.length)return {ok:false,issues:missing.map(e=>'Dosage a completer pour '+e.name+'.')};
   pool=pool.filter(e=>K.doseFor(e,mode,r));if(cfg.selection==='manual'&&(!cfg.ids.length||cfg.ids.some(id=>!pool.some(e=>e.id===id))))return {ok:false,issues:['Une carte manuelle du circuit '+b+' est indisponible ou est un bonus.']};let safe=pool.filter(e=>repeatSafe(e,used,r));if(!safe.length&&r.shortage==='allow'){safe=pool;warnings.push('Repetitions autorisees explicitement pour le circuit '+b+'.');}if((cfg.selection==='all'||cfg.selection==='manual')&&safe.length<pool.length)return {ok:false,issues:['Le circuit '+b+' complet contient des exercices interdits par tes regles anti-repetition. Change ces regles explicitement.']};pool=safe;if(cfg.selection==='groups'){const gs=[...new Set(pool.map(e=>e.group))].slice(0,cfg.count);pool=gs.map(g=>pool.find(e=>e.group===g));}else if(cfg.selection==='count')pool=pool.slice(0,cfg.count);if(!pool.length)return {ok:false,issues:['Aucun exercice normal compatible pour '+b+'.']};chosen=pool.map(e=>({e,gs:[e.group]}));
  }
  for(const {e,gs} of chosen){const i=K.itemV3(e,mode,r,history,opts.date,rng);if(i){i.assignedGroups=[...new Set(gs)];items.push(i);}}
 }
 if(!items.length)return {ok:false,issues:['Aucun exercice normal selectionne.']};
 let final=items;
 if(opts.quick){
  // Keep every selected lower group represented, then fill the target with complete doses.
  const required=[];const covered=new Set();for(const g of selected.map(x=>x.group)){const i=items.find(x=>x.block==='bas'&&x.assignedGroups.includes(g)&&!required.includes(x));if(i&&!covered.has(g)){required.push(i);i.assignedGroups.forEach(v=>covered.add(v));}}
  for(const b of ['gainage','haut'])if(r.blocks[b].enabled){for(const i of items.filter(x=>x.block===b).slice(0,Math.max(1,r.quick.min[b])))required.push(i);}
  for(const i of items.filter(x=>x.block==='bas'))if(required.filter(x=>x.block==='bas').length<r.quick.min.bas&&!required.includes(i))required.push(i);
  if(blocks.some(b=>required.filter(i=>i.block===b).length>r.quick.max[b]))return {ok:false,issues:['Le maximum Quick est inferieur au nombre de groupes ou au minimum choisi. Ajuste le profil.']};
  const cap=i=>{const x=clone(i);if(r.quick.setCap&&x.dose.sets>r.quick.setCap){x.originalDose=clone(x.dose);x.dose.sets=r.quick.setCap;x.adaptation='Plafond de series choisi dans les regles.';}return x;};
  let best=required.map(cap),max=(r.quick.target+r.quick.tolerance)*60;
  if(!r.quick.subsetFixed)best=items.map(cap);
  if(K.estimateSeconds(best,r)>max)return {ok:false,issues:['Les exercices minimaux durent environ '+Math.round(K.estimateSeconds(best,r)/60)+' min. Reduis les groupes ou les circuits, ou augmente la cible. Les series ne sont pas raccourcies sans ton accord.']};
  const rest=items.filter(i=>!best.some(x=>x.id===i.id)).map(cap);let candidates=[best];
  for(const i of rest){const next=candidates.slice();for(const c of candidates){if(c.filter(x=>x.block===i.block).length>=r.quick.max[i.block])continue;const v=[...c,i];if(K.estimateSeconds(v,r)<=max)next.push(v);}candidates=next.sort((a,b)=>Math.abs(K.estimateSeconds(a,r)-r.quick.target*60)-Math.abs(K.estimateSeconds(b,r)-r.quick.target*60)).slice(0,180);}
  best=candidates[0];final=items.filter(i=>best.some(x=>x.id===i.id)).map(i=>best.find(x=>x.id===i.id));warnings.push('Format court : une partie des exercices des groupes choisis. Les doses restent celles de tes fiches, sauf plafond de series explicitement choisi.');
 }
 const assigned=[...new Set(final.filter(i=>i.block==='bas').flatMap(i=>i.assignedGroups))];
 const session={id:K.uid(),date:opts.date,timeZone:opts.timeZone||'Europe/Luxembourg',mode,quick:!!opts.quick,items:final,lowerGroup:assigned[0]||'',lowerGroups:assigned,upperGroup:r.blocks.haut.enabled?'circuit-complet':'',restDefault:r.timing.restDefault,estimatedMinutes:Math.round(K.estimateSeconds(final,r)/6)/10,warnings,createdAt:Date.now(),status:'prepared',ruleVersion:4,ruleId:r.id,ruleName:r.name,rules:clone(r),withBonus:false,bonusDecision:'none',rotationReason:p.plan.continuing?'Reprise des exercices restants avant de changer de type.':'Priorite aux couples groupe/type les moins realises, puis les plus anciens. Le cycle choisi departage les possibilites.'};
 session.signature=K.signature(session);
 if(r.antiSession&&history.some(s=>ledger([s],opts.timeZone||'Europe/Luxembourg',opts.date).some(x=>x.week===K.weekKey(opts.date))&&s.items.filter(i=>!i.bonus).every(credited)&&K.signature(s)===session.signature))return {ok:false,issues:['Cette seance normale a deja ete validee cette semaine. Change les regles ou le type d effort.']};
 if(items.some(i=>i.needsReview))session.warnings.push('Une fiche attend toujours ton identification dans la bibliotheque. Elle ne peut pas etre executee avant confirmation.');
 return {ok:true,session};
}
function hooper(w){if(!w)return null;const a=['sleep','fatigue','stress','soreness'].map(k=>w[k]);return a.every(v=>Number.isInteger(v)&&v>=1&&v<=7)?a.reduce((n,v)=>n+v,0):null;}
function load(s){const effort=s.feedback?.effort,seconds=s.durationSeconds;if(!Number.isFinite(effort)||effort<0||effort>10||!Number.isFinite(seconds))return null;return Math.round(seconds/60*effort);}
function wellnessAt(s,date){return (s.wellness||[]).filter(w=>w.date===date).sort((a,b)=>(a.at||0)-(b.at||0)).at(-1)||null;}
function impact(s,id,mode){const vals=[];for(const h of s.history){if(!h.items.some(i=>i.id===id&&credited(i)&&i.mode===mode))continue;const before=hooper(wellnessAt(s,h.date)),next=hooper(wellnessAt(s,K.plusDays(h.date,1)));if(before!==null&&next!==null)vals.push(next-before);}return {n:vals.length,delta:vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:null};}
function pearson(pairs){const p=pairs.filter(a=>a.every(Number.isFinite));const n=p.length;if(n<5)return {n,r:null};const x=p.reduce((v,a)=>v+a[0],0)/n,y=p.reduce((v,a)=>v+a[1],0)/n;let xx=0,yy=0,xy=0;for(const [a,b]of p){xx+=(a-x)**2;yy+=(b-y)**2;xy+=(a-x)*(b-y);}return {n,r:xx&&yy?xy/Math.sqrt(xx*yy):null};}
function healthStats(s){const days=[...new Set(s.history.map(h=>h.date))].sort();const rows=days.map(date=>{const hs=s.history.filter(h=>h.date===date),loads=hs.map(load),before=hooper(wellnessAt(s,date)),next=hooper(wellnessAt(s,K.plusDays(date,1)));const pain=hs.filter(h=>Number.isFinite(h.checkin?.knee)&&Number.isFinite(h.feedback?.knee)).map(h=>h.feedback.knee-h.checkin.knee);return {date,load:loads.length&&loads.every(Number.isFinite)?loads.reduce((a,b)=>a+b,0):null,hooper:before,next,delta:before!==null&&next!==null?next-before:null,painDelta:pain.length?pain.reduce((a,b)=>a+b,0)/pain.length:null};});return {rows,loadHooper:pearson(rows.filter(r=>r.load!==null&&r.delta!==null).map(r=>[r.load,r.delta])),loadPain:pearson(rows.filter(r=>r.load!==null&&r.painDelta!==null).map(r=>[r.load,r.painDelta]))};}
function xp(history){let total=0;const old=history.filter(s=>s.ruleVersion<4||!s.ruleVersion);total=oldXP(old);for(const s of history.filter(s=>s.ruleVersion>=4)){const normal=s.items.filter(i=>!i.bonus&&!i.noPoints&&K.completedItem(i)).length,bonus=s.items.some(i=>i.bonus&&!i.noPoints&&K.completedItem(i));total+=normal*5+(normal&&s.feedback?5:0)+(bonus?(s.rules?.bonusPoints??15):0);}return total;}
Object.assign(K,{upgradeRule,standardRule:()=>upgradeRule(oldRule()),migrate,defaultState,validateState,credited,creditDate,ledger,exposure,rotation,autoMode:(h,d,a,r)=>rotation(h,a,r||upgradeRule(oldRule()),d).mode,choosePlan,coverageRows,generate,hooper,load,wellnessAt,impact,pearson,healthStats,xp});
})(KQ,KQ_DATA);
